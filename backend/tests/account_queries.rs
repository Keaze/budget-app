mod common;

use backend::error::AppError;
use backend::models::account::{CreateAccountRequest, UpdateAccountRequest};
use backend::queries::accounts;
use bigdecimal::BigDecimal;
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

#[tokio::test]
async fn create_account_with_defaults() {
    let db = common::setup().await;

    let account = create_checking(&db.pool, "My Checking").await;

    assert_eq!(account.name, "My Checking");
    assert_eq!(account.account_type, "CHECKING");
    assert_eq!(account.currency, "USD");
    assert_eq!(account.initial_balance, BigDecimal::from(0));
}

#[tokio::test]
async fn create_account_with_all_fields() {
    let db = common::setup().await;

    let account = accounts::create(
        &db.pool,
        CreateAccountRequest {
            name: "Euro Savings".into(),
            account_type: "SAVINGS".into(),
            currency: Some("EUR".into()),
            initial_balance: Some(BigDecimal::from_str("1000.50").unwrap()),
        },
    )
    .await
    .unwrap();

    assert_eq!(account.name, "Euro Savings");
    assert_eq!(account.account_type, "SAVINGS");
    assert_eq!(account.currency, "EUR");
    assert_eq!(
        account.initial_balance,
        BigDecimal::from_str("1000.50").unwrap()
    );
}

#[tokio::test]
async fn list_all_with_balances_empty() {
    let db = common::setup().await;
    let accounts = accounts::list_all_with_balances(&db.pool).await.unwrap();
    assert!(accounts.is_empty());
}

#[tokio::test]
async fn list_all_with_balances_ordered_by_name() {
    let db = common::setup().await;

    create_checking(&db.pool, "Zulu").await;
    create_checking(&db.pool, "Alpha").await;

    let accts = accounts::list_all_with_balances(&db.pool).await.unwrap();
    assert_eq!(accts.len(), 2);
    assert_eq!(accts[0].name, "Alpha");
    assert_eq!(accts[1].name, "Zulu");
}

#[tokio::test]
async fn get_by_id_with_balance() {
    let db = common::setup().await;

    let created = accounts::create(
        &db.pool,
        CreateAccountRequest {
            name: "Test".into(),
            account_type: "CHECKING".into(),
            currency: None,
            initial_balance: Some(BigDecimal::from_str("500.00").unwrap()),
        },
    )
    .await
    .unwrap();

    let fetched = accounts::get_by_id_with_balance(&db.pool, created.id)
        .await
        .unwrap();

    assert_eq!(fetched.id, created.id);
    assert_eq!(fetched.name, "Test");
    // With no transactions, balance equals initial_balance
    assert_eq!(fetched.balance, BigDecimal::from_str("500.00").unwrap());
}

#[tokio::test]
async fn get_by_id_not_found() {
    let db = common::setup().await;
    let err = accounts::get_by_id_with_balance(&db.pool, uuid::Uuid::new_v4())
        .await
        .unwrap_err();

    assert!(matches!(err, AppError::NotFound));
}

#[tokio::test]
async fn update_account() {
    let db = common::setup().await;
    let created = create_checking(&db.pool, "Old Name").await;

    let updated = accounts::update(
        &db.pool,
        created.id,
        UpdateAccountRequest {
            name: Some("New Name".into()),
            account_type: Some("SAVINGS".into()),
            initial_balance: Some(BigDecimal::from_str("100.00").unwrap()),
        },
    )
    .await
    .unwrap();

    assert_eq!(updated.id, created.id);
    assert_eq!(updated.name, "New Name");
    assert_eq!(updated.account_type, "SAVINGS");
    assert_eq!(
        updated.initial_balance,
        BigDecimal::from_str("100.00").unwrap()
    );
    assert!(updated.updated_at >= created.updated_at);
}

#[tokio::test]
async fn update_partial_preserves_fields() {
    let db = common::setup().await;

    let created = accounts::create(
        &db.pool,
        CreateAccountRequest {
            name: "Keep Me".into(),
            account_type: "SAVINGS".into(),
            currency: Some("EUR".into()),
            initial_balance: Some(BigDecimal::from_str("250.00").unwrap()),
        },
    )
    .await
    .unwrap();

    let updated = accounts::update(
        &db.pool,
        created.id,
        UpdateAccountRequest {
            name: None,
            account_type: None,
            initial_balance: None,
        },
    )
    .await
    .unwrap();

    assert_eq!(updated.name, "Keep Me");
    assert_eq!(updated.account_type, "SAVINGS");
    assert_eq!(
        updated.initial_balance,
        BigDecimal::from_str("250.00").unwrap()
    );
}

#[tokio::test]
async fn update_nonexistent_returns_not_found() {
    let db = common::setup().await;

    let err = accounts::update(
        &db.pool,
        uuid::Uuid::new_v4(),
        UpdateAccountRequest {
            name: Some("Nope".into()),
            account_type: None,
            initial_balance: None,
        },
    )
    .await
    .unwrap_err();

    assert!(matches!(err, AppError::NotFound));
}

#[tokio::test]
async fn delete_account() {
    let db = common::setup().await;
    let created = create_checking(&db.pool, "To Delete").await;

    accounts::delete(&db.pool, created.id).await.unwrap();

    let err = accounts::get_by_id_with_balance(&db.pool, created.id)
        .await
        .unwrap_err();
    assert!(matches!(err, AppError::NotFound));
}

#[tokio::test]
async fn delete_nonexistent_returns_not_found() {
    let db = common::setup().await;
    let err = accounts::delete(&db.pool, uuid::Uuid::new_v4())
        .await
        .unwrap_err();
    assert!(matches!(err, AppError::NotFound));
}

#[tokio::test]
async fn delete_account_with_transactions_returns_conflict() {
    let db = common::setup().await;
    let account = create_checking(&db.pool, "Has Transactions").await;

    // Insert a transaction directly to create the FK constraint
    sqlx::query(
        "INSERT INTO transactions (account_id, transaction_type, amount, label, date) \
         VALUES ($1, 'INCOME', 100.00, 'Test income', now())",
    )
    .bind(account.id)
    .execute(&db.pool)
    .await
    .unwrap();

    let err = accounts::delete(&db.pool, account.id).await.unwrap_err();
    assert!(matches!(err, AppError::Conflict(_)));
}

#[tokio::test]
async fn balance_reflects_transactions() {
    let db = common::setup().await;

    let account = accounts::create(
        &db.pool,
        CreateAccountRequest {
            name: "Balance Test".into(),
            account_type: "CHECKING".into(),
            currency: None,
            initial_balance: Some(BigDecimal::from_str("1000.00").unwrap()),
        },
    )
    .await
    .unwrap();

    // Add income
    sqlx::query(
        "INSERT INTO transactions (account_id, transaction_type, amount, label, date) \
         VALUES ($1, 'INCOME', 500.00, 'Salary', now())",
    )
    .bind(account.id)
    .execute(&db.pool)
    .await
    .unwrap();

    // Add expense
    sqlx::query(
        "INSERT INTO transactions (account_id, transaction_type, amount, label, date) \
         VALUES ($1, 'EXPENSE', 200.00, 'Groceries', now())",
    )
    .bind(account.id)
    .execute(&db.pool)
    .await
    .unwrap();

    let fetched = accounts::get_by_id_with_balance(&db.pool, account.id)
        .await
        .unwrap();

    // 1000 + 500 - 200 = 1300
    assert_eq!(fetched.balance, BigDecimal::from_str("1300.00").unwrap());
}

#[tokio::test]
async fn balance_reflects_transfers() {
    let db = common::setup().await;

    let from = accounts::create(
        &db.pool,
        CreateAccountRequest {
            name: "From".into(),
            account_type: "CHECKING".into(),
            currency: None,
            initial_balance: Some(BigDecimal::from_str("1000.00").unwrap()),
        },
    )
    .await
    .unwrap();

    let to = accounts::create(
        &db.pool,
        CreateAccountRequest {
            name: "To".into(),
            account_type: "SAVINGS".into(),
            currency: None,
            initial_balance: Some(BigDecimal::from_str("500.00").unwrap()),
        },
    )
    .await
    .unwrap();

    // Transfer 300 from checking to savings
    sqlx::query(
        "INSERT INTO transactions (account_id, transfer_to_account_id, transaction_type, amount, label, date) \
         VALUES ($1, $2, 'TRANSFER', 300.00, 'Transfer', now())",
    )
    .bind(from.id)
    .bind(to.id)
    .execute(&db.pool)
    .await
    .unwrap();

    let from_balance = accounts::get_by_id_with_balance(&db.pool, from.id)
        .await
        .unwrap();
    let to_balance = accounts::get_by_id_with_balance(&db.pool, to.id)
        .await
        .unwrap();

    // From: 1000 - 300 = 700
    assert_eq!(
        from_balance.balance,
        BigDecimal::from_str("700.00").unwrap()
    );
    // To: 500 + 300 = 800
    assert_eq!(to_balance.balance, BigDecimal::from_str("800.00").unwrap());
}
