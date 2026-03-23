CREATE TABLE transactions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id             UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  category_id            UUID REFERENCES categories(id) ON DELETE SET NULL,
  transaction_type       TEXT NOT NULL CHECK (transaction_type IN ('INCOME', 'EXPENSE', 'TRANSFER')),
  amount                 NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  label                  TEXT NOT NULL,
  notes                  TEXT,
  date                   TIMESTAMPTZ NOT NULL,
  transfer_to_account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_account_id  ON transactions(account_id);
CREATE INDEX idx_transactions_date        ON transactions(date DESC);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
