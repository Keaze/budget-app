use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("resource not found")]
    NotFound,

    #[error("bad request: {0}")]
    BadRequest(String),

    #[error("conflict: {0}")]
    Conflict(String),

    #[error("internal error: {0}")]
    Internal(#[from] anyhow::Error),
}

impl From<sqlx::Error> for AppError {
    fn from(e: sqlx::Error) -> Self {
        match e {
            sqlx::Error::RowNotFound => AppError::NotFound,
            other => {
                tracing::error!(error = %other, "database error");
                AppError::Internal(other.into())
            }
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let status = match &self {
            AppError::NotFound => StatusCode::NOT_FOUND,
            AppError::BadRequest(_) => StatusCode::BAD_REQUEST,
            AppError::Conflict(_) => StatusCode::CONFLICT,
            AppError::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
        };
        let message = match &self {
            AppError::Internal(_) => "an internal error occurred".to_string(),
            other => other.to_string(),
        };
        (status, Json(serde_json::json!({ "error": message }))).into_response()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::to_bytes;

    async fn response_body(err: AppError) -> (StatusCode, serde_json::Value) {
        let resp = err.into_response();
        let status = resp.status();
        let bytes = to_bytes(resp.into_body(), usize::MAX).await.unwrap();
        let body: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        (status, body)
    }

    #[tokio::test]
    async fn not_found_returns_404() {
        let (status, body) = response_body(AppError::NotFound).await;
        assert_eq!(status, StatusCode::NOT_FOUND);
        assert_eq!(body["error"], "resource not found");
    }

    #[tokio::test]
    async fn bad_request_returns_400_with_message() {
        let (status, body) = response_body(AppError::BadRequest("invalid input".into())).await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert!(body["error"].as_str().unwrap().contains("invalid input"));
    }

    #[tokio::test]
    async fn conflict_returns_409_with_message() {
        let (status, body) = response_body(AppError::Conflict("already exists".into())).await;
        assert_eq!(status, StatusCode::CONFLICT);
        assert!(body["error"].as_str().unwrap().contains("already exists"));
    }

    #[tokio::test]
    async fn internal_returns_500_and_hides_details() {
        let (status, body) =
            response_body(AppError::Internal(anyhow::anyhow!("secret db creds"))).await;
        assert_eq!(status, StatusCode::INTERNAL_SERVER_ERROR);
        // Must not leak internal detail
        assert!(!body["error"].as_str().unwrap().contains("secret db creds"));
        assert_eq!(body["error"], "an internal error occurred");
    }

    #[test]
    fn sqlx_row_not_found_maps_to_not_found() {
        let err = AppError::from(sqlx::Error::RowNotFound);
        assert!(matches!(err, AppError::NotFound));
    }
}
