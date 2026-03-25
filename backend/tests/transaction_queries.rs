mod common;

use backend::error::AppError;
use backend::models::account::CreateAccountRequest;
use backend::models::transaction::{
    CreateTransactionRequest, TransactionQuery, UpdateTransactionRequest,
};
use backend::queries::{accounts, transactions};
use bigdecimal::BigDecimal;
use chrono::{Duration, Utc};
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
        transfer_to_account_id: None,
    }
}

fn transfer_req(
    from_account_id: Uuid,
    to_account_id: Uuid,
    amount: &str,
) -> CreateTransactionRequest {
    CreateTransactionRequest {
        account_id: from_account_id,
        category_id: None,
        transaction_type: "TRANSFER".into(),
        amount: BigDecimal::from_str(amount).unwrap(),
        label: "Test transfer".into(),
        notes: None,
        date: Utc::now(),
        transfer_to_account_id: Some(to_account_id),
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
            transfer_to_account_id: None,
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
            transfer_to_account_id: None,
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
            transfer_to_account_id: None,
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
async fn list_no_filters_returns_all() {
    let db = common::setup().await;
    let account = create_checking(&db.pool, "Checking").await;

    transactions::create(&db.pool, income_req(account.id, "100.00"))
        .await
        .unwrap();
    transactions::create(&db.pool, income_req(account.id, "200.00"))
        .await
        .unwrap();
    transactions::create(&db.pool, income_req(account.id, "300.00"))
        .await
        .unwrap();

    let (data, total) = transactions::list(&db.pool, &TransactionQuery::default())
        .await
        .unwrap();
    assert_eq!(total, 3);
    assert_eq!(data.len(), 3);
}

#[tokio::test]
async fn list_filters_by_account_id() {
    let db = common::setup().await;
    let account_a = create_checking(&db.pool, "Account A").await;
    let account_b = create_checking(&db.pool, "Account B").await;

    transactions::create(&db.pool, income_req(account_a.id, "100.00"))
        .await
        .unwrap();
    transactions::create(&db.pool, income_req(account_a.id, "200.00"))
        .await
        .unwrap();
    transactions::create(&db.pool, income_req(account_b.id, "300.00"))
        .await
        .unwrap();

    let query = TransactionQuery {
        account_id: Some(account_a.id),
        ..Default::default()
    };
    let (data, total) = transactions::list(&db.pool, &query).await.unwrap();
    assert_eq!(total, 2);
    assert!(data.iter().all(|t| t.account_id == account_a.id));
}

#[tokio::test]
async fn list_filters_by_transaction_type() {
    let db = common::setup().await;
    let account = create_checking(&db.pool, "Checking").await;

    transactions::create(&db.pool, income_req(account.id, "100.00"))
        .await
        .unwrap();
    transactions::create(
        &db.pool,
        CreateTransactionRequest {
            account_id: account.id,
            category_id: None,
            transaction_type: "EXPENSE".into(),
            amount: BigDecimal::from_str("50.00").unwrap(),
            label: "Expense".into(),
            notes: None,
            date: Utc::now(),
            transfer_to_account_id: None,
        },
    )
    .await
    .unwrap();

    let query = TransactionQuery {
        transaction_type: Some("INCOME".into()),
        ..Default::default()
    };
    let (data, total) = transactions::list(&db.pool, &query).await.unwrap();
    assert_eq!(total, 1);
    assert_eq!(data[0].transaction_type, "INCOME");
}

#[tokio::test]
async fn list_filters_by_date_range() {
    let db = common::setup().await;
    let account = create_checking(&db.pool, "Checking").await;

    transactions::create(&db.pool, income_req(account.id, "100.00"))
        .await
        .unwrap();

    // date_from in the future excludes all transactions
    let query = TransactionQuery {
        date_from: Some(Utc::now() + Duration::hours(1)),
        ..Default::default()
    };
    let (data, total) = transactions::list(&db.pool, &query).await.unwrap();
    assert_eq!(total, 0);
    assert!(data.is_empty());

    // date_to in the past excludes all transactions
    let query2 = TransactionQuery {
        date_to: Some(Utc::now() - Duration::hours(1)),
        ..Default::default()
    };
    let (data2, total2) = transactions::list(&db.pool, &query2).await.unwrap();
    assert_eq!(total2, 0);
    assert!(data2.is_empty());
}

#[tokio::test]
async fn list_pagination_works() {
    let db = common::setup().await;
    let account = create_checking(&db.pool, "Checking").await;

    for amount in ["100.00", "200.00", "300.00", "400.00", "500.00"] {
        transactions::create(&db.pool, income_req(account.id, amount))
            .await
            .unwrap();
    }

    let page1 = TransactionQuery {
        page: Some(1),
        page_size: Some(2),
        ..Default::default()
    };
    let (data, total) = transactions::list(&db.pool, &page1).await.unwrap();
    assert_eq!(total, 5);
    assert_eq!(data.len(), 2);

    let page3 = TransactionQuery {
        page: Some(3),
        page_size: Some(2),
        ..Default::default()
    };
    let (data3, _) = transactions::list(&db.pool, &page3).await.unwrap();
    assert_eq!(data3.len(), 1);
}

#[tokio::test]
async fn list_sort_by_amount_asc() {
    let db = common::setup().await;
    let account = create_checking(&db.pool, "Checking").await;

    transactions::create(&db.pool, income_req(account.id, "300.00"))
        .await
        .unwrap();
    transactions::create(&db.pool, income_req(account.id, "100.00"))
        .await
        .unwrap();
    transactions::create(&db.pool, income_req(account.id, "200.00"))
        .await
        .unwrap();

    let query = TransactionQuery {
        sort_by: Some("amount".into()),
        sort_order: Some("asc".into()),
        ..Default::default()
    };
    let (data, _) = transactions::list(&db.pool, &query).await.unwrap();
    assert_eq!(data.len(), 3);
    assert_eq!(data[0].amount, BigDecimal::from_str("100.00").unwrap());
    assert_eq!(data[1].amount, BigDecimal::from_str("200.00").unwrap());
    assert_eq!(data[2].amount, BigDecimal::from_str("300.00").unwrap());
}

#[tokio::test]
async fn list_invalid_sort_by_returns_bad_request() {
    let db = common::setup().await;
    let query = TransactionQuery {
        sort_by: Some("injected_sql".into()),
        ..Default::default()
    };
    let err = transactions::list(&db.pool, &query).await.unwrap_err();
    assert!(matches!(err, AppError::BadRequest(_)));
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
            transfer_to_account_id: None,
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

#[tokio::test]
async fn transfer_updates_both_account_balances() {
    let db = common::setup().await;
    let account_a = create_checking(&db.pool, "Account A").await; // initial_balance = 1000
    let account_b = accounts::create(
        &db.pool,
        CreateAccountRequest {
            name: "Account B".into(),
            account_type: "CHECKING".into(),
            currency: None,
            initial_balance: Some(BigDecimal::from_str("500.00").unwrap()),
        },
    )
    .await
    .unwrap();

    transactions::create(&db.pool, transfer_req(account_a.id, account_b.id, "300.00"))
        .await
        .unwrap();

    let balance_a = accounts::get_by_id_with_balance(&db.pool, account_a.id)
        .await
        .unwrap()
        .balance;
    let balance_b = accounts::get_by_id_with_balance(&db.pool, account_b.id)
        .await
        .unwrap()
        .balance;

    // A: 1000 - 300 = 700
    assert_eq!(balance_a, BigDecimal::from_str("700.00").unwrap());
    // B: 500 + 300 = 800
    assert_eq!(balance_b, BigDecimal::from_str("800.00").unwrap());
}

#[tokio::test]
async fn delete_transfer_restores_both_balances() {
    let db = common::setup().await;
    let account_a = create_checking(&db.pool, "Account A").await;
    let account_b = accounts::create(
        &db.pool,
        CreateAccountRequest {
            name: "Account B".into(),
            account_type: "CHECKING".into(),
            currency: None,
            initial_balance: Some(BigDecimal::from_str("500.00").unwrap()),
        },
    )
    .await
    .unwrap();

    let transfer = transactions::create(&db.pool, transfer_req(account_a.id, account_b.id, "300.00"))
        .await
        .unwrap();

    transactions::delete(&db.pool, transfer.id).await.unwrap();

    let balance_a = accounts::get_by_id_with_balance(&db.pool, account_a.id)
        .await
        .unwrap()
        .balance;
    let balance_b = accounts::get_by_id_with_balance(&db.pool, account_b.id)
        .await
        .unwrap()
        .balance;

    assert_eq!(balance_a, BigDecimal::from_str("1000.00").unwrap());
    assert_eq!(balance_b, BigDecimal::from_str("500.00").unwrap());
}

#[tokio::test]
async fn transfer_stores_transfer_to_account_id() {
    let db = common::setup().await;
    let account_a = create_checking(&db.pool, "Account A").await;
    let account_b = create_checking(&db.pool, "Account B").await;

    let transfer = transactions::create(&db.pool, transfer_req(account_a.id, account_b.id, "100.00"))
        .await
        .unwrap();

    assert_eq!(transfer.transaction_type, "TRANSFER");
    assert_eq!(transfer.transfer_to_account_id, Some(account_b.id));
}
