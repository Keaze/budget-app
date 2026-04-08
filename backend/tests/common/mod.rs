use sqlx::PgPool;
use testcontainers::runners::AsyncRunner;
use testcontainers::ImageExt;
use testcontainers::ContainerAsync;
use testcontainers_modules::postgres::Postgres;
use uuid::Uuid;

pub struct TestDb {
    pub pool: PgPool,
    _container: Option<ContainerAsync<Postgres>>,
}

pub async fn setup() -> TestDb {
    match std::env::var("DATABASE_URL") {
        Ok(server_url) => setup_with_server(&server_url).await,
        Err(_) => setup_with_container().await,
    }
}

async fn setup_with_server(server_url: &str) -> TestDb {
    let db_name = format!("test_{}", Uuid::new_v4().simple());

    let server_pool = PgPool::connect(server_url)
        .await
        .expect("failed to connect to postgres server");

    sqlx::query(&format!("CREATE DATABASE {db_name}"))
        .execute(&server_pool)
        .await
        .expect("failed to create test database");

    server_pool.close().await;

    let test_url = replace_db(server_url, &db_name);
    let pool = PgPool::connect(&test_url)
        .await
        .expect("failed to connect to test database");

    sqlx::migrate!()
        .run(&pool)
        .await
        .expect("failed to run migrations");

    TestDb { pool, _container: None }
}

async fn setup_with_container() -> TestDb {
    let container = Postgres::default()
        .with_tag("16-alpine")
        .start()
        .await
        .expect("failed to start postgres container");

    let port = container
        .get_host_port_ipv4(5432)
        .await
        .expect("failed to get mapped port");

    let url = format!("postgres://postgres:postgres@127.0.0.1:{port}/postgres");
    let pool = PgPool::connect(&url)
        .await
        .expect("failed to connect to test database");

    sqlx::migrate!()
        .run(&pool)
        .await
        .expect("failed to run migrations");

    TestDb { pool, _container: Some(container) }
}

fn replace_db(url: &str, db_name: &str) -> String {
    match url.rfind('/') {
        Some(idx) => format!("{}/{}", &url[..idx], db_name),
        None => format!("{}/{}", url, db_name),
    }
}
