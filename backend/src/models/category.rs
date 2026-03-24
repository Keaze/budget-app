use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Category {
    pub id: Uuid,
    pub name: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub is_default: bool,
}

#[derive(Debug, Deserialize)]
pub struct CreateCategoryRequest {
    pub name: String,
    pub icon: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCategoryRequest {
    pub name: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn category_serializes_with_optional_fields_null() {
        let cat = Category {
            id: Uuid::nil(),
            name: "Groceries".into(),
            icon: None,
            color: None,
            is_default: true,
        };
        let json = serde_json::to_value(&cat).unwrap();
        assert_eq!(json["name"], "Groceries");
        assert_eq!(json["is_default"], true);
        assert!(json["icon"].is_null());
        assert!(json["color"].is_null());
    }

    #[test]
    fn category_serializes_with_optional_fields_set() {
        let cat = Category {
            id: Uuid::nil(),
            name: "Transport".into(),
            icon: Some("🚗".into()),
            color: Some("#FF0000".into()),
            is_default: false,
        };
        let json = serde_json::to_value(&cat).unwrap();
        assert_eq!(json["icon"], "🚗");
        assert_eq!(json["color"], "#FF0000");
        assert_eq!(json["is_default"], false);
    }

    #[test]
    fn create_request_deserializes_name_only() {
        let json = r#"{"name": "My Category"}"#;
        let req: CreateCategoryRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.name, "My Category");
        assert!(req.icon.is_none());
        assert!(req.color.is_none());
    }

    #[test]
    fn create_request_deserializes_all_fields() {
        let json = "{\"name\": \"Food\", \"icon\": \"🍔\", \"color\": \"#00FF00\"}";
        let req: CreateCategoryRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.name, "Food");
        assert_eq!(req.icon.as_deref(), Some("🍔"));
        assert_eq!(req.color.as_deref(), Some("#00FF00"));
    }

    #[test]
    fn update_request_deserializes_empty_object() {
        let json = r#"{}"#;
        let req: UpdateCategoryRequest = serde_json::from_str(json).unwrap();
        assert!(req.name.is_none());
        assert!(req.icon.is_none());
        assert!(req.color.is_none());
    }

    #[test]
    fn update_request_deserializes_partial_fields() {
        let json = r#"{"name": "Updated Name"}"#;
        let req: UpdateCategoryRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.name.as_deref(), Some("Updated Name"));
        assert!(req.icon.is_none());
        assert!(req.color.is_none());
    }
}
