mod common;

use backend::models::account::CreateAccountRequest;
use backend::models::category::CreateCategoryRequest;
use backend::queries::{accounts, reports};
use bigdecimal::BigDecimal;
use chrono::NaiveDate;
use std::str::FromStr;

async fn create_checking(pool: &sqlx::PgPool, name: &str) -> backend::models::account::Account {
    accounts::create(
        pool,
        CreateAccountRequest {
            name: name.into(),
            account_type: "CHECKING".into(),
            currency: None,
            initial_balance: None,
        },
    )
    .await
    .unwrap()
}

async fn create_category(
    pool: &sqlx::PgPool,
    name: &str,
    color: Option<&str>,
) -> backend::models::category::Category {
    use backend::queries::categories;
    categories::create(
        pool,
        CreateCategoryRequest {
            name: name.into(),
            icon: None,
            color: color.map(|s| s.into()),
        },
    )
    .await
    .unwrap()
}

#[tokio::test]
async fn spending_by_category_returns_expenses_in_range() {
    let db = common::setup().await;
    let account = create_checking(&db.pool, "Checking").await;
    let cat = create_category(&db.pool, "Test Groceries", Some("#ff0000")).await;

    let date_in = NaiveDate::from_ymd_opt(2026, 3, 15).unwrap();
    let date_out = NaiveDate::from_ymd_opt(2026, 5, 1).unwrap();

    sqlx::query(
        "INSERT INTO transactions (account_id, category_id, transaction_type, amount, label, date) \
         VALUES ($1, $2, 'EXPENSE', 50.00, 'In range', $3)",
    )
    .bind(account.id)
    .bind(cat.id)
    .bind(date_in.and_hms_opt(12, 0, 0).unwrap().and_utc())
    .execute(&db.pool)
    .await
    .unwrap();

    sqlx::query(
        "INSERT INTO transactions (account_id, category_id, transaction_type, amount, label, date) \
         VALUES ($1, $2, 'EXPENSE', 30.00, 'Out of range', $3)",
    )
    .bind(account.id)
    .bind(cat.id)
    .bind(date_out.and_hms_opt(12, 0, 0).unwrap().and_utc())
    .execute(&db.pool)
    .await
    .unwrap();

    sqlx::query(
        "INSERT INTO transactions (account_id, transaction_type, amount, label, date) \
         VALUES ($1, 'INCOME', 1000.00, 'Salary', $2)",
    )
    .bind(account.id)
    .bind(date_in.and_hms_opt(12, 0, 0).unwrap().and_utc())
    .execute(&db.pool)
    .await
    .unwrap();

    let from = NaiveDate::from_ymd_opt(2026, 1, 1).unwrap();
    let to = NaiveDate::from_ymd_opt(2026, 3, 31).unwrap();
    let rows = reports::spending_by_category(&db.pool, from, to).await.unwrap();

    assert_eq!(rows.len(), 1);
    assert_eq!(rows[0].category_name, "Test Groceries");
    assert_eq!(rows[0].color.as_deref(), Some("#ff0000"));
    assert_eq!(rows[0].total, BigDecimal::from_str("50.00").unwrap());
}

#[tokio::test]
async fn spending_by_category_excludes_income() {
    let db = common::setup().await;
    let account = create_checking(&db.pool, "Checking").await;

    let date = NaiveDate::from_ymd_opt(2026, 3, 15).unwrap();
    sqlx::query(
        "INSERT INTO transactions (account_id, transaction_type, amount, label, date) \
         VALUES ($1, 'INCOME', 500.00, 'Salary', $2)",
    )
    .bind(account.id)
    .bind(date.and_hms_opt(12, 0, 0).unwrap().and_utc())
    .execute(&db.pool)
    .await
    .unwrap();

    let from = NaiveDate::from_ymd_opt(2026, 1, 1).unwrap();
    let to = NaiveDate::from_ymd_opt(2026, 12, 31).unwrap();
    let rows = reports::spending_by_category(&db.pool, from, to).await.unwrap();
    assert!(rows.is_empty());
}

#[tokio::test]
async fn monthly_summary_returns_12_months() {
    let db = common::setup().await;
    let rows = reports::monthly_summary(&db.pool, 2026).await.unwrap();
    assert_eq!(rows.len(), 12);
    for row in &rows {
        assert_eq!(row.income, BigDecimal::from(0));
        assert_eq!(row.expenses, BigDecimal::from(0));
    }
}

#[tokio::test]
async fn monthly_summary_aggregates_income_and_expenses() {
    let db = common::setup().await;
    let account = create_checking(&db.pool, "Checking").await;

    let jan = NaiveDate::from_ymd_opt(2026, 1, 15).unwrap();
    let mar = NaiveDate::from_ymd_opt(2026, 3, 10).unwrap();

    sqlx::query(
        "INSERT INTO transactions (account_id, transaction_type, amount, label, date) \
         VALUES ($1, 'INCOME', 1200.00, 'Salary', $2)",
    )
    .bind(account.id)
    .bind(jan.and_hms_opt(12, 0, 0).unwrap().and_utc())
    .execute(&db.pool)
    .await
    .unwrap();

    sqlx::query(
        "INSERT INTO transactions (account_id, transaction_type, amount, label, date) \
         VALUES ($1, 'EXPENSE', 200.00, 'Rent', $2)",
    )
    .bind(account.id)
    .bind(mar.and_hms_opt(12, 0, 0).unwrap().and_utc())
    .execute(&db.pool)
    .await
    .unwrap();

    let rows = reports::monthly_summary(&db.pool, 2026).await.unwrap();
    assert_eq!(rows.len(), 12);

    let jan_row = rows.iter().find(|r| r.month == 1).unwrap();
    assert_eq!(jan_row.income, BigDecimal::from_str("1200.00").unwrap());
    assert_eq!(jan_row.expenses, BigDecimal::from(0));

    let mar_row = rows.iter().find(|r| r.month == 3).unwrap();
    assert_eq!(mar_row.expenses, BigDecimal::from_str("200.00").unwrap());
    assert_eq!(mar_row.income, BigDecimal::from(0));

    let feb_row = rows.iter().find(|r| r.month == 2).unwrap();
    assert_eq!(feb_row.income, BigDecimal::from(0));
    assert_eq!(feb_row.expenses, BigDecimal::from(0));
}
