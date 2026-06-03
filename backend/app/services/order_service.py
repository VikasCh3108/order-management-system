from __future__ import annotations

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.schemas.order import OrderCreate


async def create_order(session: AsyncSession, order_in: OrderCreate) -> Order:
    # Validate customer exists
    customer = await session.get(Customer, order_in.customer_id)
    if customer is None:
        raise ValueError("Customer not found.")

    # Validate no duplicate product IDs in order items
    product_ids = [item.product_id for item in order_in.items]
    if len(product_ids) != len(set(product_ids)):
        raise ValueError("Duplicate product IDs in order items. Each product can only appear once.")

    # Validate all products exist and check inventory
    products_result = await session.execute(
        select(Product).where(Product.id.in_(product_ids))
    )
    products = {p.id: p for p in products_result.scalars().all()}

    if len(products) != len(product_ids):
        missing_ids = set(product_ids) - set(products.keys())
        raise ValueError(f"Products not found: {missing_ids}")

    # Check inventory and prepare order items
    order_items_data = []
    total_amount = Decimal("0.00")

    for item_in in order_in.items:
        product = products[item_in.product_id]
        
        if product.stock_quantity < item_in.quantity:
            raise ValueError(
                f"Insufficient inventory for product {product.id} (SKU: {product.sku}). "
                f"Available: {product.stock_quantity}, Requested: {item_in.quantity}"
            )

        unit_price = product.price
        subtotal = unit_price * Decimal(item_in.quantity)
        total_amount += subtotal

        order_items_data.append(
            {
                "product_id": item_in.product_id,
                "quantity": item_in.quantity,
                "unit_price": unit_price,
                "subtotal": subtotal,
            }
        )

    # Create order
    order = Order(
        customer_id=order_in.customer_id,
        total_amount=total_amount,
    )
    session.add(order)
    await session.flush()  # Get order ID without committing

    # Create order items and reduce inventory
    for item_data in order_items_data:
        order_item = OrderItem(
            order_id=order.id,
            **item_data,
        )
        session.add(order_item)

        # Reduce inventory
        product = products[item_data["product_id"]]
        product.stock_quantity -= item_data["quantity"]

    try:
        await session.commit()
    except SQLAlchemyError:
        await session.rollback()
        raise

    await session.refresh(order)
    # Re-fetch with relationship eager loading so response serialization does
    # not trigger additional lazy I/O outside the event loop.
    return await get_order(session, order.id)


async def get_order(session: AsyncSession, order_id: int) -> Order | None:
    result = await session.execute(
        select(Order)
        .options(
            selectinload(Order.order_items).selectinload(OrderItem.product),
            selectinload(Order.customer),
        )
        .where(Order.id == order_id)
    )
    return result.scalar_one_or_none()


async def get_orders(session: AsyncSession) -> list[Order]:
    result = await session.execute(
        select(Order)
        .options(
            selectinload(Order.order_items).selectinload(OrderItem.product),
            selectinload(Order.customer),
        )
        .order_by(Order.id.asc())
    )
    return list(result.scalars().all())


async def delete_order(session: AsyncSession, order_id: int) -> bool:
    # Get order with order items
    result = await session.execute(
        select(Order)
        .options(selectinload(Order.order_items).selectinload(OrderItem.product))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()

    if order is None:
        return False

    # Restore inventory for each order item
    for order_item in order.order_items:
        product = order_item.product
        product.stock_quantity += order_item.quantity

    # Delete order (cascade will delete order items due to RESTRICT, but we delete explicitly)
    for order_item in order.order_items:
        await session.delete(order_item)

    await session.delete(order)

    try:
        await session.commit()
    except SQLAlchemyError:
        await session.rollback()
        raise

    return True
