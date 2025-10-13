/*
  # Create Payments Table

  1. New Tables
    - `payments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `report_id` (uuid, references reports)
      - `amount` (numeric)
      - `currency` (text)
      - `payment_status` (text: pending, succeeded, failed, refunded)
      - `payment_provider` (text)
      - `payment_provider_id` (text, Stripe payment intent ID)
      - `payment_method` (text)
      - `error_message` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `payments` table
    - Add policy for users to read their own payments
    - Add policy for users to insert their own payments
    - Add policy for users to update their own payments (status updates)
  
  3. Notes
    - Payments are linked to users and reports
    - Stores Stripe payment intent IDs for reconciliation
    - Supports multiple currencies
    - Tracks payment lifecycle from pending to completion
*/

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_id uuid REFERENCES reports(id) ON DELETE SET NULL,
  amount numeric(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  payment_status text NOT NULL DEFAULT 'pending',
  payment_provider text DEFAULT 'stripe',
  payment_provider_id text,
  payment_method text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT payment_status_check CHECK (payment_status IN ('pending', 'succeeded', 'failed', 'refunded'))
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at on payments
CREATE TRIGGER set_updated_at_payments
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments(user_id);
CREATE INDEX IF NOT EXISTS payments_report_id_idx ON payments(report_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(payment_status);
CREATE INDEX IF NOT EXISTS payments_provider_id_idx ON payments(payment_provider_id);
CREATE INDEX IF NOT EXISTS payments_created_at_idx ON payments(created_at DESC);