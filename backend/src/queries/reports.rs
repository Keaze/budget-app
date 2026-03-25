use chrono::NaiveDate;
use sqlx::PgPool;

use crate::error::AppError;
use crate::models::report::{MonthlySummary, SpendingByCategory};

/// Returns EXPENSE totals grouped by category for transactions whose date falls
/// within `[date_from, date_to]` inclusive. Rows are ordered by total descending.
/// Categories with no matching transactions are excluded.
/// Transactions with NULL category_id (e.g. after their category was deleted) are
/// intentionally excluded — they would produce a row with NULL category_id/name
/// that the frontend cannot meaningfully display. This is a documented policy choice.
pub async fn spending_by_category(
    db: &PgPool,
    date_from: NaiveDate,
    date_to: NaiveDate,
) -> Result<Vec<SpendingByCategory>, AppError> {
    let rows = sqlx::query_as::<_, SpendingByCategory>(
        "SELECT t.category_id, c.name AS category_name, c.color, SUM(t.amount) AS total \
         FROM transactions t \
         JOIN categories c ON c.id = t.category_id \
         WHERE t.transaction_type = 'EXPENSE' \
           AND t.category_id IS NOT NULL \
           AND t.date >= $1 \
           AND t.date < $2 + INTERVAL '1 day' \
         GROUP BY t.category_id, c.name, c.color \
         ORDER BY total DESC",
    )
    .bind(date_from)
    .bind(date_to)
    .fetch_all(db)
    .await?;
    Ok(rows)
}

/// Returns income and expense totals for each calendar month of `year`.
/// All 12 months are always present; months with no transactions return zero for
/// both fields. Uses `generate_series(1,12)` with a LEFT JOIN to avoid
/// post-processing in Rust (DL-002).
pub async fn monthly_summary(
    db: &PgPool,
    year: i32,
) -> Result<Vec<MonthlySummary>, AppError> {
    let rows = sqlx::query_as::<_, MonthlySummary>(
        "SELECT m.month::int AS month, \
         COALESCE(SUM(CASE WHEN t.transaction_type = 'INCOME'  THEN t.amount ELSE 0 END), 0) AS income, \
         COALESCE(SUM(CASE WHEN t.transaction_type = 'EXPENSE' THEN t.amount ELSE 0 END), 0) AS expenses \
         FROM generate_series(1, 12) AS m(month) \
         LEFT JOIN transactions t \
           ON EXTRACT(MONTH FROM t.date) = m.month \
          AND EXTRACT(YEAR FROM t.date) = $1 \
         GROUP BY m.month \
         ORDER BY m.month",
    )
    .bind(year)
    .fetch_all(db)
    .await?;
    Ok(rows)
}
