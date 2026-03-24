use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

use crate::{
    db::Db,
    error::AppError,
    models::account::{Account, AccountWithBalance, CreateAccountRequest, UpdateAccountRequest},
    queries::accounts,
};

const VALID_ACCOUNT_TYPES: &[&str] = &["CHECKING", "SAVINGS", "CREDIT_CARD"];

#[tracing::instrument(skip(db))]
pub async fn list(State(db): State<Db>) -> Result<Json<Vec<AccountWithBalance>>, AppError> {
    let accs = accounts::list_all_with_balances(&db).await?;
    Ok(Json(accs))
}

#[tracing::instrument(skip(db))]
pub async fn get_one(
    State(db): State<Db>,
    Path(id): Path<Uuid>,
) -> Result<Json<AccountWithBalance>, AppError> {
    let acc = accounts::get_by_id_with_balance(&db, id).await?;
    Ok(Json(acc))
}

#[tracing::instrument(skip(db))]
pub async fn create(
    State(db): State<Db>,
    Json(payload): Json<CreateAccountRequest>,
) -> Result<(StatusCode, Json<Account>), AppError> {
    if payload.name.trim().is_empty() {
        return Err(AppError::BadRequest("name must not be empty".into()));
    }
    if !VALID_ACCOUNT_TYPES.contains(&payload.account_type.as_str()) {
        return Err(AppError::BadRequest(format!(
            "account_type must be one of: {}",
            VALID_ACCOUNT_TYPES.join(", ")
        )));
    }
    let acc = accounts::create(&db, payload).await?;
    Ok((StatusCode::CREATED, Json(acc)))
}

#[tracing::instrument(skip(db))]
pub async fn update(
    State(db): State<Db>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateAccountRequest>,
) -> Result<Json<Account>, AppError> {
    if let Some(ref t) = payload.account_type {
        if !VALID_ACCOUNT_TYPES.contains(&t.as_str()) {
            return Err(AppError::BadRequest(format!(
                "account_type must be one of: {}",
                VALID_ACCOUNT_TYPES.join(", ")
            )));
        }
    }
    let acc = accounts::update(&db, id, payload).await?;
    Ok(Json(acc))
}

#[tracing::instrument(skip(db))]
pub async fn delete(
    State(db): State<Db>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    accounts::delete(&db, id).await?;
    Ok(StatusCode::NO_CONTENT)
}
