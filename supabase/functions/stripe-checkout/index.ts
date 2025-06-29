import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

// Validate environment variables at startup
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');

console.log('Environment check:', {
  hasSupabaseUrl: !!supabaseUrl,
  hasSupabaseServiceKey: !!supabaseServiceKey,
  hasStripeSecret: !!stripeSecret,
});

if (!supabaseUrl || !supabaseServiceKey || !stripeSecret) {
  console.error('Missing required environment variables:', {
    SUPABASE_URL: !!supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: !!supabaseServiceKey,
    STRIPE_SECRET_KEY: !!stripeSecret,
  });
}

const supabase = createClient(supabaseUrl ?? '', supabaseServiceKey ?? '');

console.log('Initializing Stripe with key length:', stripeSecret?.length || 0);
console.log('Stripe key prefix:', stripeSecret?.substring(0, 10) || 'none');

const stripe = new Stripe(stripeSecret ?? '', {
  appInfo: {
    name: 'Photo Restoration HD v2',
    version: '1.0.0',
  },
});

console.log('Stripe client initialized successfully');

// Helper function to create responses with CORS headers
function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  // For 204 No Content, don't include Content-Type or body
  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  try {
    console.log('=== STRIPE CHECKOUT FUNCTION START ===');
    console.log(`${req.method} request received`);
    console.log('Headers:', Object.fromEntries(req.headers.entries()));
    console.log('URL:', req.url);

    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      console.error('Invalid method:', req.method);
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    // Check environment variables before processing
    if (!supabaseUrl || !supabaseServiceKey || !stripeSecret) {
      console.error('Missing environment variables');
      return corsResponse({ 
        error: 'Server configuration error: Missing required environment variables' 
      }, 500);
    }

    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body received:', { 
        hasPriceId: !!requestBody.price_id,
        hasSuccessUrl: !!requestBody.success_url,
        hasCancelUrl: !!requestBody.cancel_url,
        mode: requestBody.mode 
      });
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return corsResponse({ error: 'Invalid JSON in request body' }, 400);
    }

    const { user_id, price_id, success_url, cancel_url, mode } = requestBody;

    const error = validateParameters(
      { user_id, price_id, success_url, cancel_url, mode },
      {
        user_id: 'string',
        cancel_url: 'string',
        price_id: 'string',
        success_url: 'string',
        mode: { values: ['payment', 'subscription'] },
      },
    );

    if (error) {
      console.error('Parameter validation failed:', error);
      return corsResponse({ error }, 400);
    }

    // Validate authorization header (should be service key from API route)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return corsResponse({ error: 'Missing Authorization header' }, 401);
    }

    // Basic validation that we have a service key
    const token = authHeader.replace('Bearer ', '');
    if (!token.startsWith('eyJ')) {
      console.error('Invalid authorization token format');
      return corsResponse({ error: 'Invalid authorization' }, 401);
    }

    console.log('Service key authenticated, processing for user:', user_id);

    // Get user email for Stripe customer creation
    console.log('Fetching user data from Supabase...');
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
    if (userError || !userData.user) {
      console.error('Failed to get user data:', userError);
      return corsResponse({ error: 'User not found' }, 404);
    }
    
    const user = userData.user;
    console.log('User data retrieved:', user.email);

    const { data: customer, error: getCustomerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user_id)
      .is('deleted_at', null)
      .maybeSingle();

    if (getCustomerError) {
      console.error('Failed to fetch customer information from the database', getCustomerError);
      return corsResponse({ error: 'Failed to fetch customer information' }, 500);
    }

    let customerId;

    /**
     * In case we don't have a mapping yet, the customer does not exist and we need to create one.
     */
    if (!customer || !customer.customer_id) {
      console.log('Creating new Stripe customer for user:', user_id);
      
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user_id,
        },
      });

      console.log(`Created new Stripe customer ${newCustomer.id} for user ${user_id}`);

      const { error: createCustomerError } = await supabase.from('stripe_customers').insert({
        user_id: user_id,
        customer_id: newCustomer.id,
      });

      if (createCustomerError) {
        console.error('Failed to save customer information in the database', createCustomerError);

        // Try to clean up both the Stripe customer and subscription record
        try {
          await stripe.customers.del(newCustomer.id);
          await supabase.from('stripe_subscriptions').delete().eq('customer_id', newCustomer.id);
        } catch (deleteError) {
          console.error('Failed to clean up after customer mapping error:', deleteError);
        }

        return corsResponse({ error: 'Failed to create customer mapping' }, 500);
      }

      if (mode === 'subscription') {
        const { error: createSubscriptionError } = await supabase.from('stripe_subscriptions').insert({
          customer_id: newCustomer.id,
          status: 'not_started',
        });

        if (createSubscriptionError) {
          console.error('Failed to save subscription in the database', createSubscriptionError);

          // Try to clean up the Stripe customer since we couldn't create the subscription
          try {
            await stripe.customers.del(newCustomer.id);
          } catch (deleteError) {
            console.error('Failed to delete Stripe customer after subscription creation error:', deleteError);
          }

          return corsResponse({ error: 'Unable to save the subscription in the database' }, 500);
        }
      }

      customerId = newCustomer.id;
      console.log(`Successfully set up new customer ${customerId} with subscription record`);
    } else {
      customerId = customer.customer_id;
      console.log('Using existing customer:', customerId);
      
      // Validate that the Stripe customer still exists
      try {
        await stripe.customers.retrieve(customerId);
        console.log('Existing customer validated:', customerId);
      } catch (customerError) {
        console.log('Existing customer invalid, creating new one:', customerError.message);
        
        // Create a new customer since the old one is invalid
        const newCustomer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user_id,
          },
        });
        
        // Update the database with the new customer ID
        const { error: updateError } = await supabase
          .from('stripe_customers')
          .update({ customer_id: newCustomer.id })
          .eq('user_id', user_id);
          
        if (updateError) {
          console.error('Failed to update customer ID:', updateError);
          return corsResponse({ error: 'Failed to update customer information' }, 500);
        }
        
        customerId = newCustomer.id;
        console.log('Created and updated to new customer:', customerId);
      }

      if (mode === 'subscription') {
        // Verify subscription exists for existing customer
        const { data: subscription, error: getSubscriptionError } = await supabase
          .from('stripe_subscriptions')
          .select('status')
          .eq('customer_id', customerId)
          .maybeSingle();

        if (getSubscriptionError) {
          console.error('Failed to fetch subscription information from the database', getSubscriptionError);
          return corsResponse({ error: 'Failed to fetch subscription information' }, 500);
        }

        if (!subscription) {
          // Create subscription record for existing customer if missing
          const { error: createSubscriptionError } = await supabase.from('stripe_subscriptions').insert({
            customer_id: customerId,
            status: 'not_started',
          });

          if (createSubscriptionError) {
            console.error('Failed to create subscription record for existing customer', createSubscriptionError);
            return corsResponse({ error: 'Failed to create subscription record for existing customer' }, 500);
          }
        }
      }
    }

    // create Checkout Session
    console.log('Creating Stripe checkout session with:', {
      customer: customerId,
      price_id,
      mode,
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode,
      success_url,
      cancel_url,
      allow_promotion_codes: true,
    });

    console.log(`Created checkout session ${session.id} for customer ${customerId}`);

    return corsResponse({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('=== STRIPE CHECKOUT ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error type:', error.type);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    console.error('Environment variables check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseServiceKey: !!supabaseServiceKey,
      hasStripeSecret: !!stripeSecret,
      stripeSecretLength: stripeSecret?.length || 0,
      stripeSecretPrefix: stripeSecret?.substring(0, 10) || 'none'
    });
    console.error('================================');
    
    // Provide more specific error messages based on error type
    let errorMessage = error.message || 'Unknown error occurred';
    let statusCode = 500;
    
    if (error.type === 'StripeInvalidRequestError') {
      errorMessage = 'Invalid payment configuration. Please contact support.';
      statusCode = 400;
    } else if (error.message?.includes('price')) {
      errorMessage = 'Invalid price configuration. Please contact support.';
      statusCode = 400;
    } else if (error.message?.includes('customer')) {
      errorMessage = 'Customer setup failed. Please try again.';
      statusCode = 400;
    } else if (error.message?.includes('Invalid API Key')) {
      errorMessage = 'Payment system configuration error. Please contact support.';
      statusCode = 500;
    }
    
    return corsResponse({ 
      error: errorMessage,
      debug: Deno.env.get('NODE_ENV') === 'development' ? {
        originalError: error.message,
        type: error.type,
        hasStripeKey: !!stripeSecret
      } : undefined
    }, statusCode);
  }
});

type ExpectedType = 'string' | { values: string[] };
type Expectations<T> = { [K in keyof T]: ExpectedType };

function validateParameters<T extends Record<string, any>>(values: T, expected: Expectations<T>): string | undefined {
  for (const parameter in values) {
    const expectation = expected[parameter];
    const value = values[parameter];

    if (expectation === 'string') {
      if (value == null) {
        return `Missing required parameter ${parameter}`;
      }
      if (typeof value !== 'string') {
        return `Expected parameter ${parameter} to be a string got ${JSON.stringify(value)}`;
      }
    } else {
      if (!expectation.values.includes(value)) {
        return `Expected parameter ${parameter} to be one of ${expectation.values.join(', ')}`;
      }
    }
  }

  return undefined;
}