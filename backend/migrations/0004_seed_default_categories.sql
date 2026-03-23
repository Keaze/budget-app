INSERT INTO categories (name, is_default) VALUES
  ('Housing',       true),
  ('Groceries',     true),
  ('Dining Out',    true),
  ('Transport',     true),
  ('Entertainment', true),
  ('Healthcare',    true),
  ('Utilities',     true),
  ('Shopping',      true),
  ('Personal Care', true),
  ('Education',     true),
  ('Savings',       true),
  ('Income',        true),
  ('Transfer',      true),
  ('Other',         true)
ON CONFLICT (name) DO NOTHING;
