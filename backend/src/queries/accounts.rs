use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;
use bigdecimal::BigDecimal;
use crate::models::account::{Account, AccountWithBalance, CreateAccountRequest, UpdateAccountRequest};

pub async fn list_all_with_balances(db: &PgPool) -> Result<Vec<AccountWithBalance>, AppError> {
    let accounts = sqlx::query_as::<_, AccountWithBalance>(
        "SELECT \
           a.id, a.name, a.account_type, a.currency, a.initial_balance, a.created_at, a.updated_at, \
           a.initial_balance \
           + COALESCE(SUM(CASE WHEN t.transaction_type = 'INCOME'  THEN t.amount ELSE 0 END), 0) \
           - COALESCE(SUM(CASE WHEN t.transaction_type = 'EXPENSE' THEN t.amount ELSE 0 END), 0) \
           - COALESCE(SUM(CASE WHEN t.transaction_type = 'TRANSFER' AND t.account_id = a.id             THEN t.amount ELSE 0 END), 0) \
           + COALESCE(SUM(CASE WHEN t.transaction_type = 'TRANSFER' AND t.transfer_to_account_id = a.id THEN t.amount ELSE 0 END), 0) \
           AS balance \
         FROM accounts a \
         LEFT JOIN transactions t ON t.account_id = a.id OR t.transfer_to_account_id = a.id \
         GROUP BY a.id, a.name, a.account_type, a.currency, a.initial_balance, a.created_at, a.updated_at \
         ORDER BY a.name ASC",
    )
    .fetch_all(db)
    .await?;
    Ok(accounts)
}

pub async fn get_by_id_with_balance(db: &PgPool, id: Uuid) -> Result<AccountWithBalance, AppError> {
    sqlx::query_as::<_, AccountWithBalance>(
        "SELECT \
           a.id, a.name, a.account_type, a.currency, a.initial_balance, a.created_at, a.updated_at, \
           a.initial_balance \
           + COALESCE(SUM(CASE WHEN t.transaction_type = 'INCOME'  THEN t.amount ELSE 0 END), 0) \
           - COALESCE(SUM(CASE WHEN t.transaction_type = 'EXPENSE' THEN t.amount ELSE 0 END), 0) \
           - COALESCE(SUM(CASE WHEN t.transaction_type = 'TRANSFER' AND t.account_id = a.id             THEN t.amount ELSE 0 END), 0) \
           + COALESCE(SUM(CASE WHEN t.transaction_type = 'TRANSFER' AND t.transfer_to_account_id = a.id THEN t.amount ELSE 0 END), 0) \
           AS balance \
         FROM accounts a \
         LEFT JOIN transactions t ON t.account_id = a.id OR t.transfer_to_account_id = a.id \
         WHERE a.id = $1 \
         GROUP BY a.id, a.name, a.account_type, a.currency, a.initial_balance, a.created_at, a.updated_at",
    )
    .bind(id)
    .fetch_optional(db)
    .await?
    .ok_or(AppError::NotFound)
}

pub async fn create(db: &PgPool, req: CreateAccountRequest) -> Result<Account, AppError> {
    let currency = req.currency.unwrap_or_else(|| "USD".into());
    let initial_balance = req.initial_balance.unwrap_or_else(BigDecimal::default);

    sqlx::query_as::<_, Account>(
        "INSERT INTO accounts (name, account_type, currency, initial_balance) \
         VALUES ($1, $2, $3, $4) \
         RETURNING id, name, account_type, currency, initial_balance, created_at, updated_at",
    )
    .bind(&req.name)
    .bind(&req.account_type)
    .bind(&currency)
    .bind(initial_balance)
    .fetch_one(db)
    .await
    .map_err(AppError::from)
}

pub async fn update(db: &PgPool, id: Uuid, req: UpdateAccountRequest) -> Result<Account, AppError> {
    sqlx::query_as::<_, Account>(
        "UPDATE accounts \
         SET name            = COALESCE($2, name), \
             account_type    = COALESCE($3, account_type), \
             initial_balance = COALESCE($4, initial_balance), \
             updated_at      = now() \
         WHERE id = $1 \
         RETURNING id, name, account_type, currency, initial_balance, created_at, updated_at",
    )
    .bind(id)
    .bind(&req.name)
    .bind(&req.account_type)
    .bind(req.initial_balance)
    .fetch_optional(db)
    .await?
    .ok_or(AppError::NotFound)
}

pub async fn delete(db: &PgPool, id: Uuid) -> Result<(), AppError> {
    let result = sqlx::query("DELETE FROM accounts WHERE id = $1")
        .bind(id)
        .execute(db)
        .await
        .map_err(|e| match e {
            sqlx::Error::Database(ref db_err) if db_err.code().as_deref() == Some("23503") => {
                AppError::Conflict(
                    "account has existing transactions and cannot be deleted".into(),
                )
            }
            other => AppError::from(other),
        })?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}
