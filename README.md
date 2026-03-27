# Home Budget App

A personal home budget application for tracking income, expenses, and transfers across multiple accounts. Built with Rust (Axum) on the backend, React (Vite) on the frontend, and PostgreSQL as the database.

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

### Steps

1. Clone the repository and enter the project directory:
   ```bash
   git clone <repo-url>
   cd budget-app
   ```

2. Copy the example environment file (defaults work out of the box):
   ```bash
   cp .env.example .env
   ```

3. Build and start all services:
   ```bash
   docker compose up --build
   ```

4. Verify the services are running:
   - App UI: `http://localhost`
   - API health: `http://localhost/api/v1/accounts` should return JSON

### Stopping and restarting

```bash
# Stop all services (data is preserved in the db_data volume)
docker compose down

# Start again — data is still there
docker compose up
```

### Removing all data

```bash
# Stop and remove containers, networks, and volumes
docker compose down -v
```

## Development

For local development without Docker:

```bash
# Start Postgres in Docker and run the backend with cargo
bash dev.sh

# In another terminal, start the frontend dev server
cd frontend && npm install && npm run dev
```

The frontend dev server proxies `/api` to `http://localhost:3001`.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Rust + Axum 0.7 |
| Database | PostgreSQL 16 |
| Frontend | React + Vite |
| UI | Tailwind CSS |
| Container | Docker + nginx |
