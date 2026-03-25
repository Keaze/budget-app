use axum::{
    extract::{Query, State},
    Json,
};

use crate::{
    db::Db,
    error::AppError,
    models::{
        account::AccountWithBalance,
        report::{MonthlySummary, MonthlySummaryQuery, SpendingByCategory, SpendingByCategoryQuery},
    },
    queries::{accounts, reports},
};

/// `GET /api/v1/reports/account-balances`
///
/// Returns current balance for every account. Reuses
/// `accounts::list_all_with_balances` to avoid duplicating balance SQL (DL-001).
#[tracing::instrument(skip(db))]
pub async fn account_balances(
    State(db): State<Db>,
) -> Result<Json<Vec<AccountWithBalance>>, AppError> {
    let balances = accounts::list_all_with_balances(&db).await?;
    Ok(Json(balances))
}

/// `GET /api/v1/reports/spending-by-category?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD`
///
/// Returns EXPENSE totals by category for the given date range.
/// Returns 400 if either `date_from` or `date_to` is absent.
#[tracing::instrument(skip(db))]
pub async fn spending_by_category(
    State(db): State<Db>,
    Query(params): Query<SpendingByCategoryQuery>,
) -> Result<Json<Vec<SpendingByCategory>>, AppError> {
    let date_from = params
        .date_from
        .ok_or_else(|| AppError::BadRequest("date_from is required".into()))?;
    let date_to = params
        .date_to
        .ok_or_else(|| AppError::BadRequest("date_to is required".into()))?;
    let rows = reports::spending_by_category(&db, date_from, date_to).await?;
    Ok(Json(rows))
}

/// `GET /api/v1/reports/monthly-summary?year=YYYY`
///
/// Returns income and expense totals for all 12 months of `year`.
/// Returns 400 if `year` is absent.
#[tracing::instrument(skip(db))]
pub async fn monthly_summary(
    State(db): State<Db>,
    Query(params): Query<MonthlySummaryQuery>,
) -> Result<Json<Vec<MonthlySummary>>, AppError> {
    let year = params
        .year
        .ok_or_else(|| AppError::BadRequest("year is required".into()))?;
    let rows = reports::monthly_summary(&db, year).await?;
    Ok(Json(rows))
}
