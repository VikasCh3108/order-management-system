from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.logging import get_logger
from app.db.session import engine

logger = get_logger(__name__)


async def verify_database_connection() -> None:
    try:
        async with engine.begin() as connection:
            await connection.execute(text("SELECT 1"))
        logger.info("Database connection verified successfully.")
    except SQLAlchemyError:
        logger.exception("Database connection verification failed.")
        raise


async def close_database_connections() -> None:
    await engine.dispose()
    logger.info("Database connections closed.")
