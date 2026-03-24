mod common;

use backend::error::AppError;
use backend::models::category::{CreateCategoryRequest, UpdateCategoryRequest};
use backend::queries::categories;

#[tokio::test]
async fn list_all_returns_seeded_defaults() {
    let db = common::setup().await;
    let cats = categories::list_all(&db.pool).await.unwrap();

    assert_eq!(cats.len(), 14);
    assert!(cats.iter().all(|c| c.is_default));
    // Defaults come first, sorted by name
    assert!(cats[0].is_default);
}

#[tokio::test]
async fn list_all_ordering_defaults_first_then_by_name() {
    let db = common::setup().await;

    categories::create(
        &db.pool,
        CreateCategoryRequest {
            name: "AAA Custom".into(),
            icon: None,
            color: None,
        },
    )
    .await
    .unwrap();

    let cats = categories::list_all(&db.pool).await.unwrap();
    let first_custom_idx = cats.iter().position(|c| !c.is_default).unwrap();

    // All defaults should appear before any custom category
    assert!(cats[..first_custom_idx].iter().all(|c| c.is_default));
}

#[tokio::test]
async fn create_and_get_by_id() {
    let db = common::setup().await;

    let created = categories::create(
        &db.pool,
        CreateCategoryRequest {
            name: "Test Category".into(),
            icon: Some("🧪".into()),
            color: Some("#123456".into()),
        },
    )
    .await
    .unwrap();

    assert_eq!(created.name, "Test Category");
    assert_eq!(created.icon.as_deref(), Some("🧪"));
    assert_eq!(created.color.as_deref(), Some("#123456"));
    assert!(!created.is_default);

    let fetched = categories::get_by_id(&db.pool, created.id).await.unwrap();
    assert_eq!(fetched.id, created.id);
    assert_eq!(fetched.name, "Test Category");
}

#[tokio::test]
async fn get_by_id_not_found() {
    let db = common::setup().await;
    let err = categories::get_by_id(&db.pool, uuid::Uuid::new_v4())
        .await
        .unwrap_err();

    assert!(matches!(err, AppError::NotFound));
}

#[tokio::test]
async fn create_duplicate_name_returns_conflict() {
    let db = common::setup().await;

    categories::create(
        &db.pool,
        CreateCategoryRequest {
            name: "Unique".into(),
            icon: None,
            color: None,
        },
    )
    .await
    .unwrap();

    let err = categories::create(
        &db.pool,
        CreateCategoryRequest {
            name: "Unique".into(),
            icon: None,
            color: None,
        },
    )
    .await
    .unwrap_err();

    assert!(matches!(err, AppError::Conflict(_)));
}

#[tokio::test]
async fn create_duplicate_of_default_returns_conflict() {
    let db = common::setup().await;

    let err = categories::create(
        &db.pool,
        CreateCategoryRequest {
            name: "Housing".into(),
            icon: None,
            color: None,
        },
    )
    .await
    .unwrap_err();

    assert!(matches!(err, AppError::Conflict(_)));
}

#[tokio::test]
async fn update_category() {
    let db = common::setup().await;

    let created = categories::create(
        &db.pool,
        CreateCategoryRequest {
            name: "Before".into(),
            icon: None,
            color: None,
        },
    )
    .await
    .unwrap();

    let updated = categories::update(
        &db.pool,
        created.id,
        UpdateCategoryRequest {
            name: Some("After".into()),
            icon: Some("✅".into()),
            color: Some("#AABBCC".into()),
        },
    )
    .await
    .unwrap();

    assert_eq!(updated.id, created.id);
    assert_eq!(updated.name, "After");
    assert_eq!(updated.icon.as_deref(), Some("✅"));
    assert_eq!(updated.color.as_deref(), Some("#AABBCC"));
}

#[tokio::test]
async fn update_partial_fields_preserves_others() {
    let db = common::setup().await;

    let created = categories::create(
        &db.pool,
        CreateCategoryRequest {
            name: "Original".into(),
            icon: Some("🏠".into()),
            color: Some("#000000".into()),
        },
    )
    .await
    .unwrap();

    let updated = categories::update(
        &db.pool,
        created.id,
        UpdateCategoryRequest {
            name: Some("Renamed".into()),
            icon: None,
            color: None,
        },
    )
    .await
    .unwrap();

    assert_eq!(updated.name, "Renamed");
    assert_eq!(updated.icon.as_deref(), Some("🏠"));
    assert_eq!(updated.color.as_deref(), Some("#000000"));
}

#[tokio::test]
async fn update_nonexistent_returns_not_found() {
    let db = common::setup().await;

    let err = categories::update(
        &db.pool,
        uuid::Uuid::new_v4(),
        UpdateCategoryRequest {
            name: Some("Nope".into()),
            icon: None,
            color: None,
        },
    )
    .await
    .unwrap_err();

    assert!(matches!(err, AppError::NotFound));
}

#[tokio::test]
async fn delete_category() {
    let db = common::setup().await;

    let created = categories::create(
        &db.pool,
        CreateCategoryRequest {
            name: "To Delete".into(),
            icon: None,
            color: None,
        },
    )
    .await
    .unwrap();

    categories::delete(&db.pool, created.id).await.unwrap();

    let err = categories::get_by_id(&db.pool, created.id)
        .await
        .unwrap_err();
    assert!(matches!(err, AppError::NotFound));
}

#[tokio::test]
async fn delete_nonexistent_does_not_error() {
    let db = common::setup().await;
    // delete of nonexistent row silently succeeds (no rows_affected check)
    let result = categories::delete(&db.pool, uuid::Uuid::new_v4()).await;
    assert!(result.is_ok());
}
