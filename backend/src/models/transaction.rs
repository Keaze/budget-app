use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Transaction {
    pub id: Uuid,
    pub account_id: Uuid,
    pub category_id: Option<Uuid>,
    pub transaction_type: String,
    pub amount: BigDecimal,
    pub label: String,
    pub notes: Option<String>,
    pub date: DateTime<Utc>,
    pub transfer_to_account_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTransactionRequest {
    pub account_id: Uuid,
    pub category_id: Option<Uuid>,
    pub transaction_type: String,
    pub amount: BigDecimal,
    pub label: String,
    pub notes: Option<String>,
    pub date: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTransactionRequest {
    pub category_id: Option<Uuid>,
    pub label: Option<String>,
    pub notes: Option<String>,
    pub amount: Option<BigDecimal>,
    pub date: Option<DateTime<Utc>>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn create_request_deserializes_required_fields() {
        let json = r#"{
            "account_id": "00000000-0000-0000-0000-000000000001",
            "transaction_type": "INCOME",
            "amount": 100.00,
            "label": "Salary",
            "date": "2026-01-15T00:00:00Z"
        }"#;
        let req: CreateTransactionRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.transaction_type, "INCOME");
        assert_eq!(req.label, "Salary");
        assert!(req.category_id.is_none());
        assert!(req.notes.is_none());
    }

    #[test]
    fn update_request_deserializes_empty_object() {
        let json = r#"{}"#;
        let req: UpdateTransactionRequest = serde_json::from_str(json).unwrap();
        assert!(req.label.is_none());
        assert!(req.amount.is_none());
        assert!(req.date.is_none());
    }
}
