use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Account {
    pub id: Uuid,
    pub name: String,
    pub account_type: String,
    pub currency: String,
    pub initial_balance: BigDecimal,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Like `Account` but includes the computed running balance.
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct AccountWithBalance {
    pub id: Uuid,
    pub name: String,
    pub account_type: String,
    pub currency: String,
    pub initial_balance: BigDecimal,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub balance: BigDecimal,
}

#[derive(Debug, Deserialize)]
pub struct CreateAccountRequest {
    pub name: String,
    pub account_type: String,
    pub currency: Option<String>,
    pub initial_balance: Option<BigDecimal>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAccountRequest {
    pub name: Option<String>,
    pub account_type: Option<String>,
    pub initial_balance: Option<BigDecimal>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn create_request_deserializes_required_fields_only() {
        let json = r#"{"name": "Checking", "account_type": "CHECKING"}"#;
        let req: CreateAccountRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.name, "Checking");
        assert_eq!(req.account_type, "CHECKING");
        assert!(req.currency.is_none());
        assert!(req.initial_balance.is_none());
    }

    #[test]
    fn create_request_deserializes_all_fields() {
        let json = r#"{"name": "Savings", "account_type": "SAVINGS", "currency": "EUR", "initial_balance": 500.00}"#;
        let req: CreateAccountRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.name, "Savings");
        assert_eq!(req.account_type, "SAVINGS");
        assert_eq!(req.currency.as_deref(), Some("EUR"));
        assert_eq!(
            req.initial_balance
                .as_ref()
                .map(|d: &BigDecimal| d.with_scale(2).to_string()),
            Some("500.00".to_string())
        );
    }

    #[test]
    fn update_request_deserializes_empty_object() {
        let json = r#"{}"#;
        let req: UpdateAccountRequest = serde_json::from_str(json).unwrap();
        assert!(req.name.is_none());
        assert!(req.account_type.is_none());
        assert!(req.initial_balance.is_none());
    }

    #[test]
    fn update_request_deserializes_partial_fields() {
        let json = r#"{"name": "Main Checking"}"#;
        let req: UpdateAccountRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.name.as_deref(), Some("Main Checking"));
        assert!(req.account_type.is_none());
    }
}
