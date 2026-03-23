# Home Budget App

A personal home budget application for tracking income, expenses, and transfers across multiple accounts. Built with Rust (Axum) on the backend, React (Vite) on the frontend, and PostgreSQL as the database.

## Quick Start

> Full setup instructions will be added in Step 20 once Docker deployment is complete.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

### Steps

1. Clone the repository and enter the project directory.
2. Copy the example environment file and fill in any values you want to change:
   ```bash
   cp .env.example .env
   ```
3. Build and start all services:
   ```bash
   docker compose up --build
   ```
4. The app will be available at `http://localhost` and the API at `http://localhost/api/v1`.
