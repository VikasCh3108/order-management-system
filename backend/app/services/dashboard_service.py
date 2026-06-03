from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.models.order import Order
from app.models.product import Product
from app.schemas.dashboard import DashboardResponse, LowStockProductResponse


async def get_dashboard_summary(session: AsyncSession) -> DashboardResponse:
    # Count total products
    total_products_result = await session.execute(
        select(func.count(Product.id))
    )
    total_products = total_products_result.scalar()

    # Count total customers
    total_customers_result = await session.execute(
        select(func.count(Customer.id))
    )
    total_customers = total_customers_result.scalar()

    # Count total orders
    total_orders_result = await session.execute(
        select(func.count(Order.id))
    )
    total_orders = total_orders_result.scalar()

    # Retrieve low stock products (stock_quantity < 10)
    low_stock_result = await session.execute(
        select(Product.id, Product.name, Product.sku, Product.stock_quantity)
        .where(Product.stock_quantity < 10)
        .order_by(Product.stock_quantity.asc())
    )
    low_stock_products = [
        LowStockProductResponse(
            id=row.id,
            name=row.name,
            sku=row.sku,
            stock_quantity=row.stock_quantity,
        )
        for row in low_stock_result.all()
    ]

    return DashboardResponse(
        total_products=total_products or 0,
        total_customers=total_customers or 0,
        total_orders=total_orders or 0,
        low_stock_products=low_stock_products,
    )
