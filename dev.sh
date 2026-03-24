#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# dev.sh — start a local Postgres container and run the backend
# Usage:
#   bash dev.sh          # start DB + backend
#   bash dev.sh stop     # stop and remove the DB container
# ---------------------------------------------------------------------------

CONTAINER=budget-pg
DB_USER=budget
DB_PASS=secret
DB_NAME=budget
DB_PORT=5432
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:${DB_PORT}/${DB_NAME}"

stop() {
    echo "Stopping ${CONTAINER}..."
    docker stop "${CONTAINER}" 2>/dev/null && docker rm "${CONTAINER}" 2>/dev/null || true
    echo "Done."
    exit 0
}

wait_for_postgres() {
    echo -n "Waiting for Postgres to be ready"
    for i in $(seq 1 30); do
        if docker exec "${CONTAINER}" pg_isready -U "${DB_USER}" -d "${DB_NAME}" -q 2>/dev/null; then
            echo " ready."
            return 0
        fi
        echo -n "."
        sleep 1
    done
    echo ""
    echo "ERROR: Postgres did not become ready in 30 seconds." >&2
    exit 1
}

if [[ "${1:-}" == "stop" ]]; then
    stop
fi

# --- Start Postgres ---
if docker inspect "${CONTAINER}" &>/dev/null; then
    echo "Container '${CONTAINER}' already exists — starting it if stopped..."
    docker start "${CONTAINER}" 2>/dev/null || true
else
    echo "Starting Postgres container '${CONTAINER}'..."
    docker run -d \
        --name "${CONTAINER}" \
        -e POSTGRES_USER="${DB_USER}" \
        -e POSTGRES_PASSWORD="${DB_PASS}" \
        -e POSTGRES_DB="${DB_NAME}" \
        -p "${DB_PORT}:5432" \
        postgres:16-alpine
fi

wait_for_postgres

# --- Run backend ---
echo "Starting backend (migrations run automatically on startup)..."
cd "$(dirname "$0")/backend"

export DATABASE_URL="${DATABASE_URL}"
export RUST_LOG="${RUST_LOG:-debug}"
export BIND_ADDR="${BIND_ADDR:-0.0.0.0:3001}"

exec cargo run
