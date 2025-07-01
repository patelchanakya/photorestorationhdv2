import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Photo Restoration HD v2',
    version: '1.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

// Credit mapping based on your stripe-config.ts
// Updated with actual Stripe price IDs from your Dashboard (TEST MODE)
const CREDIT_MAPPING: { [key: string]: number } = {
  'price_1RYMaEDHBXmKKCsnzZK4iqzv': 2,   // Single Pack
  'price_1RYMbzDHBXmKKCsnjXbOyxui': 5,   // Memories Pack
  'price_1RYMdJDHBXmKKCsn6BohuUcS': 25,  // Family Pack
  'price_1RYMeIDHBXmKKCsnLT3mXJGJ': 100, // Archive Album Pack
};

Deno.serve(async (req) => {
  try {
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // get the signature from the header
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    // get the raw body
    const body = await req.text();

    // verify the webhook signature
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  const stripeData = event?.data?.object ?? {};

  if (!stripeData) {
    return;
  }

  if (!('customer' in stripeData)) {
    return;
  }

  // for one time payments, we only listen for the checkout.session.completed event
  if (event.type === 'payment_intent.succeeded' && event.data.object.invoice === null) {
    return;
  }

  const { customer: customerId } = stripeData;

  if (!customerId || typeof customerId !== 'string') {
    console.error(`No customer received on event: ${JSON.stringify(event)}`);
  } else {
    let isSubscription = true;

    if (event.type === 'checkout.session.completed') {
      const { mode } = stripeData as Stripe.Checkout.Session;

      isSubscription = mode === 'subscription';

      console.info(`Processing ${isSubscription ? 'subscription' : 'one-time payment'} checkout session`);
    }

    const { mode, payment_status } = stripeData as Stripe.Checkout.Session;

    if (isSubscription) {
      console.info(`Starting subscription sync for customer: ${customerId}`);
      await syncCustomerFromStripe(customerId);
    } else if (mode === 'payment' && payment_status === 'paid') {
      try {
        // Extract the necessary information from the session
        const {
          id: checkout_session_id,
          payment_intent,
          amount_subtotal,
          amount_total,
          currency,
        } = stripeData as Stripe.Checkout.Session;

        // Get the full session to access line items
        const fullSession = await stripe.checkout.sessions.retrieve(checkout_session_id, {
          expand: ['line_items.data.price']
        });

        // Insert the order into the stripe_orders table
        const { error: orderError } = await supabase.from('stripe_orders').insert({
          checkout_session_id,
          payment_intent_id: payment_intent,
          customer_id: customerId,
          amount_subtotal,
          amount_total,
          currency,
          payment_status,
          status: 'completed',
        });

        if (orderError) {
          console.error('Error inserting order:', orderError);
          return;
        }

        // Process credit purchase
        if (fullSession.line_items?.data?.[0]?.price?.id) {
          const priceId = fullSession.line_items.data[0].price.id;
          const creditsToAdd = CREDIT_MAPPING[priceId];

          console.log('Processing credit purchase:', {
            sessionId: checkout_session_id,
            customerId,
            priceId,
            creditsToAdd
          });

          if (creditsToAdd) {
            // Get user ID from customer ID
            const { data: customer, error: customerError } = await supabase
              .from('stripe_customers')
              .select('user_id')
              .eq('customer_id', customerId)
              .single();

            console.log('Customer lookup result:', {
              customerId,
              found: !!customer,
              error: customerError?.message,
              userId: customer?.user_id
            });

            if (customerError || !customer) {
              console.error('Customer not found in database, attempting to recover...');
              
              // Try to get the customer from Stripe and find user by email
              try {
                const stripeCustomer = await stripe.customers.retrieve(customerId);
                if (stripeCustomer && !stripeCustomer.deleted && stripeCustomer.email) {
                  console.log('Retrieved Stripe customer:', stripeCustomer.email);
                  
                  // Find user by email in auth.users table
                  const { data: matchingUser, error: userError } = await supabase.auth.admin.listUsers();
                  
                  if (userError) {
                    console.error('Error listing users:', userError);
                    return;
                  }
                  
                  const foundUser = matchingUser.users.find(u => u.email === stripeCustomer.email);
                  
                  if (foundUser) {
                    console.log('Found matching user by email, creating customer mapping');
                    
                    // Create the missing customer mapping
                    const { error: insertError } = await supabase
                      .from('stripe_customers')
                      .insert({
                        user_id: foundUser.id,
                        customer_id: customerId
                      });
                    
                    if (!insertError) {
                      // Retry the credit addition with the newly mapped customer
                      const { error: creditError } = await supabase.rpc('add_credits_from_purchase', {
                        p_user_id: foundUser.id,
                        p_credits_to_add: creditsToAdd,
                        p_stripe_session_id: checkout_session_id,
                        p_amount_paid: amount_total,
                        p_currency: currency
                      });
                      
                      if (!creditError) {
                        console.info(`Successfully recovered and added ${creditsToAdd} credits for user ${foundUser.id}`);
                        return; // Success!
                      }
                    }
                  }
                }
              } catch (recoveryError) {
                console.error('Recovery attempt failed:', recoveryError);
              }
              
              console.error('Could not recover customer mapping, credits not added');
              return;
            }

            // Add credits to user account
            const { error: creditError } = await supabase.rpc('add_credits_from_purchase', {
              p_user_id: customer.user_id,
              p_credits_to_add: creditsToAdd,
              p_stripe_session_id: checkout_session_id,
              p_amount_paid: amount_total,
              p_currency: currency
            });

            if (creditError) {
              console.error('Error adding credits:', creditError);
            } else {
              console.info(`Successfully added ${creditsToAdd} credits for user ${customer.user_id}`);
            }
          }
        }

        console.info(`Successfully processed one-time payment for session: ${checkout_session_id}`);
      } catch (error) {
        console.error('Error processing one-time payment:', error);
      }
    }
  }
}

// based on the excellent https://github.com/t3dotgg/stripe-recommendations
async function syncCustomerFromStripe(customerId: string) {
  try {
    // fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    // TODO verify if needed
    if (subscriptions.data.length === 0) {
      console.info(`No active subscriptions found for customer: ${customerId}`);
      const { error: noSubError } = await supabase.from('stripe_subscriptions').upsert(
        {
          customer_id: customerId,
          status: 'not_started',
        },
        {
          onConflict: 'customer_id',
        },
      );

      if (noSubError) {
        console.error('Error updating subscription status:', noSubError);
        throw new Error('Failed to update subscription status in database');
      }
    }

    // assumes that a customer can only have a single subscription
    const subscription = subscriptions.data[0];

    // store subscription state
    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
          ? {
              payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
              payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : {}),
        status: subscription.status,
      },
      {
        onConflict: 'customer_id',
      },
    );

    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription in database');
    }
    console.info(`Successfully synced subscription for customer: ${customerId}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}