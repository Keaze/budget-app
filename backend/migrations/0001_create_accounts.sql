CREATE TABLE accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  account_type    TEXT NOT NULL CHECK (account_type IN ('CHECKING', 'SAVINGS', 'CREDIT_CARD')),
  currency        TEXT NOT NULL DEFAULT 'USD',
  initial_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
