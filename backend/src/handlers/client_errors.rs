use axum::Json;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct ClientErrorPayload {
    pub message: String,
    pub stack: Option<String>,
    pub url: Option<String>,
    pub timestamp: Option<String>,
}

#[tracing::instrument]
pub async fn report(Json(payload): Json<ClientErrorPayload>) -> axum::http::StatusCode {
    tracing::warn!(
        message = %payload.message,
        stack = ?payload.stack,
        url = ?payload.url,
        timestamp = ?payload.timestamp,
        "client error reported"
    );
    axum::http::StatusCode::NO_CONTENT
}
