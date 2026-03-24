use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

use crate::{
    db::Db,
    error::AppError,
    models::transaction::{CreateTransactionRequest, Transaction, UpdateTransactionRequest},
    queries::transactions,
};

const VALID_TRANSACTION_TYPES: &[&str] = &["INCOME", "EXPENSE", "TRANSFER"];

#[tracing::instrument(skip(db))]
pub async fn create(
    State(db): State<Db>,
    Json(payload): Json<CreateTransactionRequest>,
) -> Result<(StatusCode, Json<Transaction>), AppError> {
    if payload.label.trim().is_empty() {
        return Err(AppError::BadRequest("label must not be empty".into()));
    }
    if payload.amount <= bigdecimal::BigDecimal::from(0) {
        return Err(AppError::BadRequest("amount must be greater than 0".into()));
    }
    if !VALID_TRANSACTION_TYPES.contains(&payload.transaction_type.as_str()) {
        return Err(AppError::BadRequest(format!(
            "transaction_type must be one of: {}",
            VALID_TRANSACTION_TYPES.join(", ")
        )));
    }
    let tx = transactions::create(&db, payload).await?;
    Ok((StatusCode::CREATED, Json(tx)))
}

#[tracing::instrument(skip(db))]
pub async fn get_one(
    State(db): State<Db>,
    Path(id): Path<Uuid>,
) -> Result<Json<Transaction>, AppError> {
    let tx = transactions::get_by_id(&db, id).await?;
    Ok(Json(tx))
}

#[tracing::instrument(skip(db))]
pub async fn update(
    State(db): State<Db>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateTransactionRequest>,
) -> Result<Json<Transaction>, AppError> {
    if let Some(ref amount) = payload.amount {
        if *amount <= bigdecimal::BigDecimal::from(0) {
            return Err(AppError::BadRequest("amount must be greater than 0".into()));
        }
    }
    let tx = transactions::update(&db, id, payload).await?;
    Ok(Json(tx))
}

#[tracing::instrument(skip(db))]
pub async fn delete(
    State(db): State<Db>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    transactions::delete(&db, id).await?;
    Ok(StatusCode::NO_CONTENT)
}
