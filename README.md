# Inventory & Order Management System

## Project Overview
A full-stack FastAPI + React application for managing products, customers, orders, inventory levels, and dashboard analytics. The system enforces critical business rules (unique SKU/email, stock management, backend-calculated totals) while providing a clean administrative UI and containerized deployment workflow.

## Technology Stack
- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0, PostgreSQL, Alembic
- **Frontend:** React 18, Vite, React Router, Axios
- **Infrastructure:** Docker, Docker Compose, Render (backend deployment target), Vercel (frontend deployment target)

## Architecture Overview
```
┌──────────────┐      REST (JSON)      ┌──────────────┐
│  React/Vite  │  <----------------->  │  FastAPI API │
│ (frontend)   │                       │ (backend)    │
└──────────────┘                       └─────┬────────┘
                                             │ SQLAlchemy ORM
                                             ▼
                                      ┌──────────────┐
                                      │ PostgreSQL   │
                                      └──────────────┘
```
- Frontend talks to backend via `VITE_API_BASE_URL`.
- Backend interacts with PostgreSQL using SQLAlchemy models + Alembic migrations.
- Docker Compose orchestrates all services for local or demo deployments.

## Repository Structure
```
backend/        # FastAPI app, models, services, migrations
frontend/       # React application (Vite)
order_management/README.md  # legacy placeholder (unused)
README.md       # ← you are here
``` 

## Prerequisites
- Docker Engine + Docker Compose v2
- Node.js 20+ and npm 10+ (for local frontend development)
- Python 3.12 + pip (for local backend development)

**Note:** Never commit `.env` files to version control. Copy `.env.example` to `.env` and configure locally.

## Environment Variables
Create a root `.env` (copy from `.env.example`) and customize as needed:

| Variable | Description | Default |
| --- | --- | --- |
| `POSTGRES_DB` | Database name | `inventory_db` |
| `POSTGRES_USER` | Database user | `inventory_user` |
| `POSTGRES_PASSWORD` | Database password | `change_me` |
| `POSTGRES_HOST` | Database host (use `postgres` inside Docker) | `postgres` |
| `POSTGRES_PORT` | Database port | `5432` |
| `DATABASE_URL` | Optional full SQLAlchemy URL (otherwise derived from values above) | *(empty)* |
| `APP_NAME` | FastAPI metadata | `Inventory & Order Management System API` |
| `APP_VERSION` | API version string | `1.0.0` |
| `ENVIRONMENT` | `development` / `production` | `development` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `VITE_API_BASE_URL` | Frontend API URL (Vite build-time) | `http://localhost:8000/api/v1` |

### Frontend-specific `.env`
```
# frontend/.env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```
Update the value before building/deploying to match the backend hosting URL.

## Local Development Setup
### Backend (FastAPI)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env  # or export env vars manually
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
API will be available at `http://localhost:8000/api/v1`.

### Frontend (React)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev -- --host 0.0.0.0 --port 5173
```
Visit `http://localhost:5173` and ensure `VITE_API_BASE_URL` points to the backend URL above.

## Database & Alembic Commands
```bash
cd backend
# Generate new migration
alembic revision --autogenerate -m "describe changes"
# Apply latest migrations
alembic upgrade head
# Downgrade (if needed)
alembic downgrade -1
```
All migrations live under `backend/alembic/versions/` and are committed for reproducibility.

## Docker Workflow
```bash
# Build + run all services (frontend, backend, postgres)
docker compose up --build

# Stop containers
docker compose down

# Stop and remove volumes (⚠️ wipes data)
docker compose down -v
```
- Frontend accessible at `http://localhost:5173`.
- Backend accessible at `http://localhost:8000/api/v1`.
- Environment values come from `.env` in project root.

### Load Demo Seed Data
After the stack is up, populate predictable sample data (20 products/customers/orders) so reviewers can explore the UI without manual entry:

```bash
docker compose exec backend python -m app.seed
```

The script is idempotent—you can rerun it any time to restore the baseline dataset without duplicating records.

## API Endpoints Summary
| Resource | Method | Path | Description |
| --- | --- | --- | --- |
| Products | POST | `/api/v1/products` | Create product |
|  | GET | `/api/v1/products` | List products |
|  | GET | `/api/v1/products/{id}` | Get by ID |
|  | PUT | `/api/v1/products/{id}` | Update |
|  | DELETE | `/api/v1/products/{id}` | Delete (409 if referenced) |
| Customers | POST | `/api/v1/customers` | Create customer |
|  | GET | `/api/v1/customers` | List customers |
|  | GET | `/api/v1/customers/{id}` | Get by ID |
|  | DELETE | `/api/v1/customers/{id}` | Delete (409 if referenced) |
| Orders | POST | `/api/v1/orders` | Create order (transactional + inventory checks) |
|  | GET | `/api/v1/orders` | List orders |
|  | GET | `/api/v1/orders/{id}` | Order details |
|  | DELETE | `/api/v1/orders/{id}` | Delete (restores inventory) |
| Dashboard | GET | `/api/v1/dashboard` | Summary counts + low stock |

## Deployment Guides
### Frontend (Vercel)
1. Fork/push repo to GitHub.
2. In Vercel, **New Project →** import repository selecting `frontend/` subdirectory.
3. Set **Framework Preset:** Vite.
4. Add environment variable `VITE_API_BASE_URL=https://<your-backend-domain>/api/v1`.
5. Build command: `npm run build`. Output directory: `dist`.
6. Deploy; verify UI calls backend endpoint above.

### Backend (Render)
1. Create new **Web Service** from GitHub repo pointing to `/backend` directory.
2. Environment: `Python 3`.
3. Build command: `pip install -r requirements.txt && alembic upgrade head`.
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
5. Configure environment variables (`POSTGRES_*`, `LOG_LEVEL`, etc.).
6. Provision a Render PostgreSQL instance, copy credentials into service env.
7. Update frontend `VITE_API_BASE_URL` to Render backend URL before redeploying UI.

## Docker Hub Publishing Guide
```bash
# Build backend image
cd backend
docker build -t your-dockerhub-username/inventory-backend:1.0.0 .
# Push
docker push your-dockerhub-username/inventory-backend:1.0.0

# Build frontend image
cd ../frontend
docker build -t your-dockerhub-username/inventory-frontend:1.0.0 .
docker push your-dockerhub-username/inventory-frontend:1.0.0
```
Remember to `docker login` first and bump tags per release.

## Troubleshooting
| Symptom | Fix |
| --- | --- |
| `docker compose up` fails to connect to DB | Ensure `.env` exists and ports 5432/8000/5173 are free. Remove old volumes with `docker compose down -v`. |
| Frontend cannot reach API | Confirm `VITE_API_BASE_URL` matches backend URL (including `/api/v1`). |
| Alembic upgrade errors | Check migration history cleanliness; run `alembic current` to debug and reapply migrations. |
| CORS issues in deployment | Make sure backend exposes correct domain in any CORS settings (defaults allow all in this project). |

## Final Submission Checklist
- [ ] All migrations committed and `alembic upgrade head` succeeds on fresh DB.
- [ ] `.env` (root + frontend) configured with production-ready secrets.
- [ ] `docker compose up --build` verified locally.
- [ ] Backend deployed (Render or equivalent) and URL documented.
- [ ] Frontend deployed (Vercel or equivalent) and URL documented.
- [ ] Docker images built + pushed (if assessment requires Docker Hub links).
- [ ] README, deployment instructions, and troubleshooting verified for accuracy.
- [ ] Final QA pass across Products, Customers, Orders, Dashboard.

You are now ready to submit the project for evaluation.
