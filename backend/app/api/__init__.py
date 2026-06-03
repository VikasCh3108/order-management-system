"""API route modules."""

from app.api.customer import router as customer_router
from app.api.dashboard import router as dashboard_router
from app.api.health import router as health_router
from app.api.order import router as order_router
from app.api.product import router as product_router

__all__ = ["health_router", "product_router", "customer_router", "order_router", "dashboard_router"]
