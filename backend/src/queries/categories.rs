use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::category::{Category, CreateCategoryRequest, UpdateCategoryRequest};

pub async fn list_all(db: &PgPool) -> Result<Vec<Category>, AppError> {
    let categories = sqlx::query_as::<_, Category>(
        "SELECT id, name, icon, color, is_default \
         FROM categories \
         ORDER BY is_default DESC, name ASC",
    )
    .fetch_all(db)
    .await?;
    Ok(categories)
}

pub async fn get_by_id(db: &PgPool, id: Uuid) -> Result<Category, AppError> {
    sqlx::query_as::<_, Category>(
        "SELECT id, name, icon, color, is_default FROM categories WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(db)
    .await?
    .ok_or(AppError::NotFound)
}

pub async fn create(db: &PgPool, req: CreateCategoryRequest) -> Result<Category, AppError> {
    sqlx::query_as::<_, Category>(
        "INSERT INTO categories (name, icon, color) \
         VALUES ($1, $2, $3) \
         RETURNING id, name, icon, color, is_default",
    )
    .bind(&req.name)
    .bind(&req.icon)
    .bind(&req.color)
    .fetch_one(db)
    .await
    .map_err(|e| match e {
        sqlx::Error::Database(ref db_err)
            if db_err.constraint() == Some("categories_name_key") =>
        {
            AppError::Conflict(format!("category '{}' already exists", req.name))
        }
        other => AppError::from(other),
    })
}

pub async fn update(
    db: &PgPool,
    id: Uuid,
    req: UpdateCategoryRequest,
) -> Result<Category, AppError> {
    sqlx::query_as::<_, Category>(
        "UPDATE categories \
         SET name  = COALESCE($2, name), \
             icon  = COALESCE($3, icon), \
             color = COALESCE($4, color) \
         WHERE id = $1 \
         RETURNING id, name, icon, color, is_default",
    )
    .bind(id)
    .bind(&req.name)
    .bind(&req.icon)
    .bind(&req.color)
    .fetch_optional(db)
    .await?
    .ok_or(AppError::NotFound)
}

pub async fn delete(db: &PgPool, id: Uuid) -> Result<(), AppError> {
    sqlx::query("DELETE FROM categories WHERE id = $1")
        .bind(id)
        .execute(db)
        .await?;
    Ok(())
}
