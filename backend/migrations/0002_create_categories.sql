CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  icon       TEXT,
  color      TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false
);
