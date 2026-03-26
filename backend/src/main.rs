mod db;
mod error;
mod handlers;
mod models;
mod queries;

use axum::{routing::{get, post}, Router};
use tower_http::{cors::CorsLayer, trace::TraceLayer};

#[tokio::main]
async fn main() {
    // Load .env (ignore error if file is absent — env vars may be set directly)
    let _ = dotenvy::dotenv();

    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");

    let pool = match sqlx::postgres::PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
    {
        Ok(pool) => {
            tracing::info!("connected to database");
            pool
        }
        Err(e) => {
            tracing::error!(error = %e, "failed to connect to database");
            std::process::exit(1);
        }
    };

    if let Err(e) = sqlx::migrate!("./migrations").run(&pool).await {
        tracing::error!(error = %e, "failed to run migrations");
        std::process::exit(1);
    }
    tracing::info!("migrations applied");

    let app = build_router(pool);

    let bind_addr = std::env::var("BIND_ADDR").unwrap_or_else(|_| "0.0.0.0:3001".to_string());
    let listener = tokio::net::TcpListener::bind(&bind_addr)
        .await
        .expect("failed to bind");
    tracing::info!("listening on {bind_addr}");

    axum::serve(listener, app).await.expect("server error");
}

fn build_router(pool: db::Db) -> Router {
    let api = Router::new()
        .route(
            "/accounts",
            get(handlers::accounts::list).post(handlers::accounts::create),
        )
        .route(
            "/accounts/{id}",
            get(handlers::accounts::get_one)
                .patch(handlers::accounts::update)
                .delete(handlers::accounts::delete),
        )
        .route(
            "/categories",
            get(handlers::categories::list).post(handlers::categories::create),
        )
        .route(
            "/categories/{id}",
            get(handlers::categories::get_one)
                .patch(handlers::categories::update)
                .delete(handlers::categories::delete),
        )
        .route(
            "/transactions",
            get(handlers::transactions::list).post(handlers::transactions::create),
        )
        .route(
            "/transactions/{id}",
            get(handlers::transactions::get_one)
                .patch(handlers::transactions::update)
                .delete(handlers::transactions::delete),
        )
        .route(
            "/reports/account-balances",
            get(handlers::reports::account_balances),
        )
        .route(
            "/reports/spending-by-category",
            get(handlers::reports::spending_by_category),
        )
        .route(
            "/reports/monthly-summary",
            get(handlers::reports::monthly_summary),
        )
        .route(
            "/client-errors",
            post(handlers::client_errors::report),
        );

    Router::new()
        .route("/health", get(|| async { "OK" }))
        .nest("/api/v1", api)
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive())
        .with_state(pool)
}

#[cfg(test)]
mod tests {
    use axum::{
        body::to_bytes,
        http::{Request, StatusCode},
        routing::get,
        Router,
    };
    use tower::util::ServiceExt;

    fn health_router() -> Router {
        // Health handler is stateless — build a minimal router without a pool.
        Router::new().route("/health", get(|| async { "OK" }))
    }

    #[tokio::test]
    async fn health_returns_200_ok() {
        let app = health_router();
        let resp = app
            .oneshot(Request::builder().uri("/health").body(axum::body::Body::empty()).unwrap())
            .await
            .unwrap();
        let resp: axum::response::Response = resp;

        assert_eq!(resp.status(), StatusCode::OK);
        let bytes = to_bytes(resp.into_body(), usize::MAX).await.unwrap();
        assert_eq!(&bytes[..], b"OK");
    }

    #[tokio::test]
    async fn unknown_route_returns_404() {
        let app = health_router();
        let resp: axum::response::Response = app
            .oneshot(
                Request::builder()
                    .uri("/does-not-exist")
                    .body(axum::body::Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }
}
