mod common;

use axum::{
    body::to_bytes,
    http::{Request, StatusCode},
    Router,
};
use backend::models::account::CreateAccountRequest;
use backend::queries::accounts;
use bigdecimal::BigDecimal;
use std::str::FromStr;
use tower::util::ServiceExt;

fn build_test_app(pool: sqlx::PgPool) -> Router {
    use axum::routing::get;
    use axum::Router;
    let api = Router::new()
        .route(
            "/reports/account-balances",
            get(backend::handlers::reports::account_balances),
        )
        .route(
            "/reports/spending-by-category",
            get(backend::handlers::reports::spending_by_category),
        )
        .route(
            "/reports/monthly-summary",
            get(backend::handlers::reports::monthly_summary),
        );
    Router::new()
        .nest("/api/v1", api)
        .with_state(pool)
}

#[tokio::test]
async fn account_balances_returns_200() {
    let db = common::setup().await;
    let app = build_test_app(db.pool.clone());

    accounts::create(
        &db.pool,
        CreateAccountRequest {
            name: "Checking".into(),
            account_type: "CHECKING".into(),
            currency: None,
            initial_balance: Some(BigDecimal::from_str("500.00").unwrap()),
        },
    )
    .await
    .unwrap();

    let resp = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/reports/account-balances")
                .body(axum::body::Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(resp.status(), StatusCode::OK);
    let bytes = to_bytes(resp.into_body(), usize::MAX).await.unwrap();
    let json: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert!(json.is_array());
    assert_eq!(json.as_array().unwrap().len(), 1);
}

#[tokio::test]
async fn spending_by_category_missing_params_returns_400() {
    let db = common::setup().await;
    let app = build_test_app(db.pool);

    let resp = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/reports/spending-by-category")
                .body(axum::body::Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn spending_by_category_missing_date_to_returns_400() {
    let db = common::setup().await;
    let app = build_test_app(db.pool);

    let resp = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/reports/spending-by-category?date_from=2026-01-01")
                .body(axum::body::Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn spending_by_category_with_valid_params_returns_200() {
    let db = common::setup().await;
    let app = build_test_app(db.pool);

    let resp = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/reports/spending-by-category?date_from=2026-01-01&date_to=2026-12-31")
                .body(axum::body::Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(resp.status(), StatusCode::OK);
    let bytes = to_bytes(resp.into_body(), usize::MAX).await.unwrap();
    let json: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert!(json.is_array());
}

#[tokio::test]
async fn monthly_summary_missing_year_returns_400() {
    let db = common::setup().await;
    let app = build_test_app(db.pool);

    let resp = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/reports/monthly-summary")
                .body(axum::body::Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn monthly_summary_with_valid_year_returns_12_entries() {
    let db = common::setup().await;
    let app = build_test_app(db.pool);

    let resp = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/reports/monthly-summary?year=2026")
                .body(axum::body::Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(resp.status(), StatusCode::OK);
    let bytes = to_bytes(resp.into_body(), usize::MAX).await.unwrap();
    let json: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert!(json.is_array());
    assert_eq!(json.as_array().unwrap().len(), 12);
}
