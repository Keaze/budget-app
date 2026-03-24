use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::transaction::{CreateTransactionRequest, Transaction, UpdateTransactionRequest};

pub async fn get_by_id(db: &PgPool, id: Uuid) -> Result<Transaction, AppError> {
    sqlx::query_as::<_, Transaction>(
        "SELECT id, account_id, category_id, transaction_type, amount, label, notes, date, \
                transfer_to_account_id, created_at \
         FROM transactions \
         WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(db)
    .await?
    .ok_or(AppError::NotFound)
}

pub async fn create(db: &PgPool, req: CreateTransactionRequest) -> Result<Transaction, AppError> {
    sqlx::query_as::<_, Transaction>(
        "INSERT INTO transactions \
           (account_id, category_id, transaction_type, amount, label, notes, date) \
         VALUES ($1, $2, $3, $4, $5, $6, $7) \
         RETURNING id, account_id, category_id, transaction_type, amount, label, notes, date, \
                   transfer_to_account_id, created_at",
    )
    .bind(req.account_id)
    .bind(req.category_id)
    .bind(&req.transaction_type)
    .bind(&req.amount)
    .bind(&req.label)
    .bind(&req.notes)
    .bind(req.date)
    .fetch_one(db)
    .await
    .map_err(|e| match e {
        sqlx::Error::Database(ref db_err) if db_err.code().as_deref() == Some("23503") => {
            AppError::BadRequest("referenced account or category does not exist".into())
        }
        other => AppError::from(other),
    })
}

pub async fn update(
    db: &PgPool,
    id: Uuid,
    req: UpdateTransactionRequest,
) -> Result<Transaction, AppError> {
    sqlx::query_as::<_, Transaction>(
        "UPDATE transactions \
         SET category_id = COALESCE($2, category_id), \
             label       = COALESCE($3, label), \
             notes       = COALESCE($4, notes), \
             amount      = COALESCE($5, amount), \
             date        = COALESCE($6, date) \
         WHERE id = $1 \
         RETURNING id, account_id, category_id, transaction_type, amount, label, notes, date, \
                   transfer_to_account_id, created_at",
    )
    .bind(id)
    .bind(req.category_id)
    .bind(req.label)
    .bind(req.notes)
    .bind(req.amount)
    .bind(req.date)
    .fetch_optional(db)
    .await?
    .ok_or(AppError::NotFound)
}

pub async fn delete(db: &PgPool, id: Uuid) -> Result<(), AppError> {
    let result = sqlx::query("DELETE FROM transactions WHERE id = $1")
        .bind(id)
        .execute(db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}
