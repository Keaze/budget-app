mod common;

use backend::error::AppError;
use backend::models::account::CreateAccountRequest;
use backend::models::transaction::{CreateTransactionRequest, UpdateTransactionRequest};
use backend::queries::{accounts, transactions};
use bigdecimal::BigDecimal;
use chrono::Utc;
use std::str::FromStr;
use uuid::Uuid;

async fn create_checking(pool: &sqlx::PgPool, name: &str) -> backend::models::account::Account {
    accounts::create(
        pool,
        CreateAccountRequest {
            name: name.into(),
            account_type: "CHECKING".into(),
            currency: None,
            initial_balance: Some(BigDecimal::from_str("1000.00").unwrap()),
        },
    )
    .await
    .unwrap()
}

fn income_req(account_id: Uuid, amount: &str) -> CreateTransactionRequest {
    CreateTransactionRequest {
        account_id,
        category_id: None,
        transaction_type: "INCOME".into(),
        amount: BigDecimal::from_str(amount).unwrap(),
        label: "Test income".into(),
        notes: None,
        date: Utc::now(),
    }
}

#[tokio::test]
async fn create_and_get_by_id() {
    let db = common::setup().await;
    let account = create_checking(&db.pool, "Checking").await;

    let created = transactions::create(&db.pool, income_req(account.id, "500.00"))
        .await
        .unwrap();

    assert_eq!(created.account_id, account.id);
    assert_eq!(created.transaction_type, "INCOME");
    assert_eq!(created.amount, BigDecimal::from_str("500.00").unwrap());
    assert_eq!(created.label, "Test income");
    assert!(created.category_id.is_none());
    assert!(created.notes.is_none());
    assert!(created.transfer_to_account_id.is_none());

    let fetched = transactions::get_by_id(&db.pool, created.id).await.unwrap();
    assert_eq!(fetched.id, created.id);
    assert_eq!(fetched.transaction_type, "INCOME");
}

#[tokio::test]
async fn get_by_id_not_found() {
    let db = common::setup().await;
    let err = transactions::get_by_id(&db.pool, Uuid::new_v4())
        .await
        .unwrap_err();
    assert!(matches!(err, AppError::NotFound));
}

#[tokio::test]
async fn create_with_all_fields() {
    let db = common::setup().await;
    let account = create_checking(&db.pool, "Checking").await;

    let created = transactions::create(
        &db.pool,
        CreateTransactionRequest {
            account_id: account.id,
            category_id: None,
            transaction_type: "EXPENSE".into(),
            amount: BigDecimal::from_str("75.50").unwrap(),
            label: "Groceries".into(),
            notes: Some("Weekly shop".into()),
            date: Utc::now(),
        },
    )
    .await
    .unwrap();

    assert_eq!(created.transaction_type, "EXPENSE");
    assert_eq!(created.amount, BigDecimal::from_str("75.50").unwrap());
    assert_eq!(created.notes.as_deref(), Some("Weekly shop"));
}

#[tokio::test]
async fn create_with_invalid_account_returns_bad_request() {
    let db = common::setup().await;
    let err = transactions::create(&db.pool, income_req(Uuid::new_v4(), "100.00"))
        .await
        .unwrap_err();
    assert!(matches!(err, AppError::BadRequest(_)));
}

#[tokio::test]
async fn update_transaction() {
    let db = common::setup().await;
    let account = create_checking(&db.pool, "Checking").await;
    let created = transactions::create(&db.pool, income_req(account.id, "200.00"))
        .await
        .unwrap();

    let updated = transactions::update(
        &db.pool,
        created.id,
        UpdateTransactionRequest {
            category_id: None,
            label: Some("Updated label".into()),
            notes: Some("Some note".into()),
            amount: Some(BigDecimal::from_str("250.00").unwrap()),
            date: None,
        },
    )
    .await
    .unwrap();

    assert_eq!(updated.id, created.id);
    assert_eq!(updated.label, "Updated label");
    assert_eq!(updated.notes.as_deref(), Some("Some note"));
    assert_eq!(updated.amount, BigDecimal::from_str("250.00").unwrap());
}

#[tokio::test]
async fn update_partial_preserves_fields() {
    let db = common::setup().await;
    let account = create_checking(&db.pool, "Checking").await;
    let created = transactions::create(
        &db.pool,
        CreateTransactionRequest {
            account_id: account.id,
            category_id: None,
            transaction_type: "EXPENSE".into(),
            amount: BigDecimal::from_str("300.00").unwrap(),
            label: "Original label".into(),
            notes: None,
            date: Utc::now(),
        },
    )
    .await
    .unwrap();

    let updated = transactions::update(
        &db.pool,
        created.id,
        UpdateTransactionRequest {
            category_id: None,
            label: None,
            notes: None,
            amount: None,
            date: None,
        },
    )
    .await
    .unwrap();

    assert_eq!(updated.label, "Original label");
    assert_eq!(updated.amount, BigDecimal::from_str("300.00").unwrap());
}

#[tokio::test]
async fn update_nonexistent_returns_not_found() {
    let db = common::setup().await;
    let err = transactions::update(
        &db.pool,
        Uuid::new_v4(),
        UpdateTransactionRequest {
            category_id: None,
            label: Some("Nope".into()),
            notes: None,
            amount: None,
            date: None,
        },
    )
    .await
    .unwrap_err();
    assert!(matches!(err, AppError::NotFound));
}

#[tokio::test]
async fn delete_transaction() {
    let db = common::setup().await;
    let account = create_checking(&db.pool, "Checking").await;
    let created = transactions::create(&db.pool, income_req(account.id, "100.00"))
        .await
        .unwrap();

    transactions::delete(&db.pool, created.id).await.unwrap();

    let err = transactions::get_by_id(&db.pool, created.id)
        .await
        .unwrap_err();
    assert!(matches!(err, AppError::NotFound));
}

#[tokio::test]
async fn delete_nonexistent_returns_not_found() {
    let db = common::setup().await;
    let err = transactions::delete(&db.pool, Uuid::new_v4())
        .await
        .unwrap_err();
    assert!(matches!(err, AppError::NotFound));
}

#[tokio::test]
async fn balance_reflects_income_transaction() {
    let db = common::setup().await;
    let account = create_checking(&db.pool, "Checking").await;

    transactions::create(&db.pool, income_req(account.id, "500.00"))
        .await
        .unwrap();

    let with_balance = accounts::get_by_id_with_balance(&db.pool, account.id)
        .await
        .unwrap();
    // 1000 initial + 500 income = 1500
    assert_eq!(
        with_balance.balance,
        BigDecimal::from_str("1500.00").unwrap()
    );
}

#[tokio::test]
async fn balance_reflects_expense_transaction() {
    let db = common::setup().await;
    let account = create_checking(&db.pool, "Checking").await;

    transactions::create(
        &db.pool,
        CreateTransactionRequest {
            account_id: account.id,
            category_id: None,
            transaction_type: "EXPENSE".into(),
            amount: BigDecimal::from_str("200.00").unwrap(),
            label: "Groceries".into(),
            notes: None,
            date: Utc::now(),
        },
    )
    .await
    .unwrap();

    let with_balance = accounts::get_by_id_with_balance(&db.pool, account.id)
        .await
        .unwrap();
    // 1000 initial - 200 expense = 800
    assert_eq!(
        with_balance.balance,
        BigDecimal::from_str("800.00").unwrap()
    );
}

#[tokio::test]
async fn balance_restored_after_delete() {
    let db = common::setup().await;
    let account = create_checking(&db.pool, "Checking").await;

    let tx = transactions::create(
        &db.pool,
        CreateTransactionRequest {
            account_id: account.id,
            category_id: None,
            transaction_type: "EXPENSE".into(),
            amount: BigDecimal::from_str("200.00").unwrap(),
            label: "Groceries".into(),
            notes: None,
            date: Utc::now(),
        },
    )
    .await
    .unwrap();

    transactions::delete(&db.pool, tx.id).await.unwrap();

    let with_balance = accounts::get_by_id_with_balance(&db.pool, account.id)
        .await
        .unwrap();
    // Back to 1000 initial
    assert_eq!(
        with_balance.balance,
        BigDecimal::from_str("1000.00").unwrap()
    );
}
