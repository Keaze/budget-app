use bigdecimal::BigDecimal;
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Expense total for one category over a date range.
/// Returned by `GET /api/v1/reports/spending-by-category`.
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct SpendingByCategory {
    pub category_id: Uuid,
    pub category_name: String,
    pub color: Option<String>,
    pub total: BigDecimal,
}

/// Income and expense totals for a single calendar month.
/// Returned by `GET /api/v1/reports/monthly-summary`.
/// All 12 months are always present; months with no transactions have zero values.
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct MonthlySummary {
    pub month: i32,
    pub income: BigDecimal,
    pub expenses: BigDecimal,
}

/// Query parameters for `GET /api/v1/reports/spending-by-category`.
/// date_from/date_to use NaiveDate matching the YYYY-MM-DD wire format (DL-003).
/// Both fields are required at the handler level; serde parses them as `Option`
/// so the handler can return a structured 400 error when either is absent (DL-005).
#[derive(Debug, Deserialize)]
pub struct SpendingByCategoryQuery {
    pub date_from: Option<NaiveDate>,
    pub date_to: Option<NaiveDate>,
}

/// Query parameters for `GET /api/v1/reports/monthly-summary`.
/// year uses i32 matching the integer wire format (DL-003).
/// `year` is required at the handler level; serde parses it as `Option`
/// so the handler can return a structured 400 error when absent (DL-005).
#[derive(Debug, Deserialize)]
pub struct MonthlySummaryQuery {
    pub year: Option<i32>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn spending_by_category_query_deserializes_dates() {
        let qs = "date_from=2026-01-01&date_to=2026-12-31";
        let q: SpendingByCategoryQuery = serde_urlencoded::from_str(qs).unwrap();
        assert_eq!(q.date_from, Some(NaiveDate::from_ymd_opt(2026, 1, 1).unwrap()));
        assert_eq!(q.date_to, Some(NaiveDate::from_ymd_opt(2026, 12, 31).unwrap()));
    }

    #[test]
    fn spending_by_category_query_missing_params_is_none() {
        let q: SpendingByCategoryQuery = serde_urlencoded::from_str("").unwrap();
        assert!(q.date_from.is_none());
        assert!(q.date_to.is_none());
    }

    #[test]
    fn monthly_summary_query_deserializes_year() {
        let q: MonthlySummaryQuery = serde_urlencoded::from_str("year=2026").unwrap();
        assert_eq!(q.year, Some(2026));
    }

    #[test]
    fn monthly_summary_query_missing_year_is_none() {
        let q: MonthlySummaryQuery = serde_urlencoded::from_str("").unwrap();
        assert!(q.year.is_none());
    }
}
