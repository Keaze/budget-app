use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

use crate::{
    db::Db,
    error::AppError,
    models::category::{Category, CreateCategoryRequest, UpdateCategoryRequest},
    queries::categories,
};

#[tracing::instrument(skip(db))]
pub async fn list(State(db): State<Db>) -> Result<Json<Vec<Category>>, AppError> {
    let cats = categories::list_all(&db).await?;
    Ok(Json(cats))
}

#[tracing::instrument(skip(db))]
pub async fn get_one(
    State(db): State<Db>,
    Path(id): Path<Uuid>,
) -> Result<Json<Category>, AppError> {
    let cat = categories::get_by_id(&db, id).await?;
    Ok(Json(cat))
}

#[tracing::instrument(skip(db))]
pub async fn create(
    State(db): State<Db>,
    Json(payload): Json<CreateCategoryRequest>,
) -> Result<(StatusCode, Json<Category>), AppError> {
    if payload.name.trim().is_empty() {
        return Err(AppError::BadRequest("name must not be empty".into()));
    }
    let cat = categories::create(&db, payload).await?;
    Ok((StatusCode::CREATED, Json(cat)))
}

#[tracing::instrument(skip(db))]
pub async fn update(
    State(db): State<Db>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateCategoryRequest>,
) -> Result<Json<Category>, AppError> {
    let existing = categories::get_by_id(&db, id).await?;
    if existing.is_default {
        return Err(AppError::Forbidden(
            "default categories cannot be modified".into(),
        ));
    }
    let cat = categories::update(&db, id, payload).await?;
    Ok(Json(cat))
}

#[tracing::instrument(skip(db))]
pub async fn delete(
    State(db): State<Db>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    let existing = categories::get_by_id(&db, id).await?;
    if existing.is_default {
        return Err(AppError::Forbidden(
            "default categories cannot be deleted".into(),
        ));
    }
    categories::delete(&db, id).await?;
    Ok(StatusCode::NO_CONTENT)
}
