-- Migration: Add automatic credit assignment for new users
-- This creates the handle_new_user function and trigger to give new users 1 free credit

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new record in user_credits with 1 free credit
  INSERT INTO public.user_credits (user_id, credits)
  VALUES (NEW.id, 1);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call handle_new_user when a new user is inserted
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO anon, authenticated;