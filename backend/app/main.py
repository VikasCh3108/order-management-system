from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.customer import router as customer_router
from app.api.dashboard import router as dashboard_router
from app.api.health import router as health_router
from app.api.order import router as order_router
from app.api.product import router as product_router
from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger
from app.db.init_db import close_database_connections, verify_database_connection

settings = get_settings()
configure_logging(settings.log_level)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("Starting %s in %s mode.", settings.app_name, settings.environment)
    await verify_database_connection()
    logger.info("Application startup completed.")
    try:
        yield
    finally:
        logger.info("Application shutdown initiated.")
        await close_database_connections()
        logger.info("Application shutdown completed.")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix=settings.api_v1_prefix)
app.include_router(product_router, prefix=settings.api_v1_prefix)
app.include_router(customer_router, prefix=settings.api_v1_prefix)
app.include_router(order_router, prefix=settings.api_v1_prefix)
app.include_router(dashboard_router, prefix=settings.api_v1_prefix)
