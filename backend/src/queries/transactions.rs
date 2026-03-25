use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::transaction::{
    CreateTransactionRequest, Transaction, TransactionQuery, UpdateTransactionRequest,
};

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
           (account_id, category_id, transaction_type, amount, label, notes, date, transfer_to_account_id) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) \
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
    .bind(req.transfer_to_account_id)
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

pub async fn list(
    db: &PgPool,
    query: &TransactionQuery,
) -> Result<(Vec<Transaction>, i64), AppError> {
    let page = query.page.unwrap_or(1).max(1);
    let page_size = query.page_size.unwrap_or(50).clamp(1, 100);
    let offset = (page - 1) * page_size;

    let sort_col = match query.sort_by.as_deref().unwrap_or("date") {
        "date" => "date",
        "amount" => "amount",
        "label" => "label",
        _ => {
            return Err(AppError::BadRequest(
                "sort_by must be one of: date, amount, label".into(),
            ))
        }
    };
    let sort_dir = match query.sort_order.as_deref().unwrap_or("desc") {
        "asc" => "ASC",
        "desc" => "DESC",
        _ => {
            return Err(AppError::BadRequest(
                "sort_order must be asc or desc".into(),
            ))
        }
    };

    let mut conditions: Vec<String> = Vec::new();
    let mut param_idx: usize = 0;

    if query.account_id.is_some() {
        param_idx += 1;
        conditions.push(format!("account_id = ${param_idx}"));
    }
    if query.category_id.is_some() {
        param_idx += 1;
        conditions.push(format!("category_id = ${param_idx}"));
    }
    if query.transaction_type.is_some() {
        param_idx += 1;
        conditions.push(format!("transaction_type = ${param_idx}"));
    }
    if query.date_from.is_some() {
        param_idx += 1;
        conditions.push(format!("date >= ${param_idx}"));
    }
    if query.date_to.is_some() {
        param_idx += 1;
        conditions.push(format!("date <= ${param_idx}"));
    }

    let where_clause = if conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", conditions.join(" AND "))
    };

    let limit_idx = param_idx + 1;
    let offset_idx = param_idx + 2;

    let data_sql = format!(
        "SELECT id, account_id, category_id, transaction_type, amount, label, notes, date, \
                transfer_to_account_id, created_at \
         FROM transactions \
         {where_clause} \
         ORDER BY {sort_col} {sort_dir} \
         LIMIT ${limit_idx} OFFSET ${offset_idx}"
    );
    let count_sql = format!("SELECT COUNT(*) FROM transactions {where_clause}");

    let mut data_q = sqlx::query_as::<_, Transaction>(&data_sql);
    let mut count_q = sqlx::query_scalar::<_, i64>(&count_sql);

    if let Some(v) = query.account_id {
        data_q = data_q.bind(v);
        count_q = count_q.bind(v);
    }
    if let Some(v) = query.category_id {
        data_q = data_q.bind(v);
        count_q = count_q.bind(v);
    }
    if let Some(ref v) = query.transaction_type {
        data_q = data_q.bind(v.clone());
        count_q = count_q.bind(v.clone());
    }
    if let Some(v) = query.date_from {
        data_q = data_q.bind(v);
        count_q = count_q.bind(v);
    }
    if let Some(v) = query.date_to {
        data_q = data_q.bind(v);
        count_q = count_q.bind(v);
    }

    data_q = data_q.bind(page_size).bind(offset);

    let total = count_q.fetch_one(db).await?;
    let data = data_q.fetch_all(db).await?;

    Ok((data, total))
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
