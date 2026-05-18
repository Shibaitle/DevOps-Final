# DevOps Final Project: Warehouse Management System

Warehouse management demo workspace for the rebranded frontend and backend services. This project is specifically designed to showcase a comprehensive CI/CD DevOps pipeline, featuring automated testing, builds, and deployments.

## Local Setup Instructions (Start from Scratch)

### 1. Prerequisites
- Docker & Docker Compose
- Go 1.21+
- [Atlas CLI](https://atlasgo.io/getting-started) (for database migrations)
- Air (Live reload for Go)

### 2. Database & Environment Setup
Navigate to the `devops-final-be` folder and set up the `.env.dev` file. Ensure `DB_NAME=devops_final_dev`.

Start the PostgreSQL database via Docker:
```bash
docker-compose --env-file .env.dev up -d postgres
```

### 3. Database Migration & Seeding
Create the dev database and apply the initial schema:
```bash
docker exec devops_final_postgres createdb -U admin atlas_dev
.\atlas.ps1 migrate apply --env dev
```

*Note: The system will automatically seed default roles and an Admin user upon server startup based on `.env.dev`.*

### 4. Running the Backend
To start the backend with live-reloading:
```bash
air
```

### 5. Running the Frontend
Navigate to `devops-final-fe` and use:
```bash
bun install
bun dev
```

### Login
- **Username:** `admin` (or `admin@warehouse.com`)
- **Password:** `password123`
