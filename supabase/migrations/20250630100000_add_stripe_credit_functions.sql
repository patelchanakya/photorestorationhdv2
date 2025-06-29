-- Migration: Add Stripe credit purchase functions
-- This creates the add_credits_from_purchase function for processing Stripe webhook payments

-- Function to add credits from a successful Stripe purchase
CREATE OR REPLACE FUNCTION add_credits_from_purchase(
  p_user_id uuid,
  p_credits_to_add integer,
  p_stripe_session_id text,
  p_amount_paid integer,
  p_currency text
)
RETURNS void AS $$
BEGIN
  -- Insert purchase record (this will fail if the session ID already exists, preventing double processing)
  INSERT INTO credit_purchases (
    user_id,
    stripe_session_id,
    credits_purchased,
    amount_paid,
    currency
  ) VALUES (
    p_user_id,
    p_stripe_session_id,
    p_credits_to_add,
    p_amount_paid,
    p_currency
  );

  -- Add credits to user account (this will create the record if it doesn't exist)
  INSERT INTO user_credits (user_id, credits)
  VALUES (p_user_id, p_credits_to_add)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    credits = user_credits.credits + p_credits_to_add,
    updated_at = now();

  -- Log the credit addition for debugging
  RAISE NOTICE 'Successfully added % credits for user % from Stripe session %', 
    p_credits_to_add, p_user_id, p_stripe_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced deduct credits function with better error handling
CREATE OR REPLACE FUNCTION deduct_credits_safe(
  p_user_id uuid,
  p_credits_to_deduct integer DEFAULT 1
)
RETURNS boolean AS $$
DECLARE
  current_credits integer;
BEGIN
  -- Get current credits with row lock to prevent race conditions
  SELECT credits INTO current_credits
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check if user has enough credits
  IF current_credits IS NULL OR current_credits < p_credits_to_deduct THEN
    RAISE NOTICE 'Insufficient credits for user %. Current: %, Required: %', 
      p_user_id, COALESCE(current_credits, 0), p_credits_to_deduct;
    RETURN false;
  END IF;

  -- Deduct credits
  UPDATE user_credits
  SET 
    credits = credits - p_credits_to_deduct,
    updated_at = now()
  WHERE user_id = p_user_id;

  RAISE NOTICE 'Successfully deducted % credits for user %. New balance: %', 
    p_credits_to_deduct, p_user_id, (current_credits - p_credits_to_deduct);
    
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current credit balance
CREATE OR REPLACE FUNCTION get_user_credits(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  credit_balance integer;
BEGIN
  SELECT credits INTO credit_balance
  FROM user_credits
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(credit_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION add_credits_from_purchase(uuid, integer, text, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION deduct_credits_safe(uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_user_credits(uuid) TO authenticated, service_role;

-- Add unique constraint on stripe_session_id to prevent duplicate processing
ALTER TABLE credit_purchases 
ADD CONSTRAINT credit_purchases_stripe_session_id_unique 
UNIQUE (stripe_session_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_id ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_created_at ON credit_purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_customer_id ON stripe_customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_orders_checkout_session_id ON stripe_orders(checkout_session_id);

-- Update updated_at timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for automatic updated_at timestamps
CREATE TRIGGER update_user_credits_updated_at 
  BEFORE UPDATE ON user_credits 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_customers_updated_at 
  BEFORE UPDATE ON stripe_customers 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_orders_updated_at 
  BEFORE UPDATE ON stripe_orders 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_subscriptions_updated_at 
  BEFORE UPDATE ON stripe_subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();