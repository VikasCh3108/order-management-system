"""Idempotent demo data seeder for the Inventory & Order Management System.

This script reuses the existing service layer so all business rules
(unique SKU/email, inventory deduction, backend-calculated totals,
transactional order creation) are enforced exactly as in production.

Run with:
    python -m app.seed                # local (env vars / .env)
    docker compose exec backend python -m app.seed

Running it multiple times is safe: products/customers are matched by
their unique fields (SKU/email) and orders are only generated when the
orders table is empty, preventing duplicate inventory deductions.
"""

from __future__ import annotations

import asyncio
from decimal import Decimal

from sqlalchemy import func, select

from app.db.session import SessionLocal
from app.models.customer import Customer
from app.models.order import Order
from app.models.product import Product
from app.schemas.customer import CustomerCreate
from app.schemas.order import OrderCreate, OrderItemCreate
from app.schemas.product import ProductCreate
from app.services.customer_service import create_customer
from app.services.order_service import create_order
from app.services.product_service import create_product


# ---------------------------------------------------------------------------
# Static demo datasets
# ---------------------------------------------------------------------------

# 20 products with deliberate stock distribution:
#   5 products  -> stock < 10        (low stock; surfaces on dashboard)
#   5 products  -> stock 10-50       (mid stock)
#   10 products -> stock > 50        (healthy stock)
PRODUCTS: list[dict] = [
    # Low stock (< 10)
    {"name": "Mechanical Keyboard", "sku": "ELC-KEY-001", "price": Decimal("89.99"), "stock_quantity": 4},
    {"name": "Wireless Mouse", "sku": "ACC-MOU-002", "price": Decimal("39.50"), "stock_quantity": 7},
    {"name": "USB-C Hub", "sku": "ACC-HUB-003", "price": Decimal("54.00"), "stock_quantity": 3},
    {"name": "Noise Cancelling Headphones", "sku": "ELC-HDP-004", "price": Decimal("199.99"), "stock_quantity": 9},
    {"name": "Portable SSD 1TB", "sku": "STG-SSD-005", "price": Decimal("129.00"), "stock_quantity": 5},
    # Mid stock (10-50)
    {"name": "27-inch Monitor", "sku": "ELC-MON-006", "price": Decimal("249.99"), "stock_quantity": 15},
    {"name": "Laptop Stand", "sku": "ACC-STD-007", "price": Decimal("32.75"), "stock_quantity": 25},
    {"name": "Webcam 1080p", "sku": "ELC-CAM-008", "price": Decimal("69.99"), "stock_quantity": 40},
    {"name": "Network Switch 8-Port", "sku": "NET-SWT-009", "price": Decimal("45.00"), "stock_quantity": 18},
    {"name": "External HDD 2TB", "sku": "STG-HDD-010", "price": Decimal("74.99"), "stock_quantity": 30},
    # Healthy stock (> 50)
    {"name": "Ballpoint Pens (Box)", "sku": "OFC-PEN-011", "price": Decimal("12.99"), "stock_quantity": 200},
    {"name": "A4 Paper Ream", "sku": "OFC-PPR-012", "price": Decimal("8.49"), "stock_quantity": 350},
    {"name": "Sticky Notes Pack", "sku": "OFC-NTE-013", "price": Decimal("6.25"), "stock_quantity": 150},
    {"name": "HDMI Cable 2m", "sku": "ACC-HDM-014", "price": Decimal("11.99"), "stock_quantity": 120},
    {"name": "Ethernet Cable 5m", "sku": "NET-ETH-015", "price": Decimal("9.99"), "stock_quantity": 180},
    {"name": "Wireless Router", "sku": "NET-RTR-016", "price": Decimal("89.00"), "stock_quantity": 60},
    {"name": "USB Flash Drive 64GB", "sku": "STG-USB-017", "price": Decimal("14.50"), "stock_quantity": 90},
    {"name": "Desk Organizer", "sku": "OFC-ORG-018", "price": Decimal("21.00"), "stock_quantity": 75},
    {"name": "Laptop Sleeve 15-inch", "sku": "ACC-SLV-019", "price": Decimal("24.99"), "stock_quantity": 110},
    {"name": "Surge Protector 6-Outlet", "sku": "ELC-SRG-020", "price": Decimal("27.49"), "stock_quantity": 85},
]

CUSTOMERS: list[dict] = [
    {"full_name": "John Doe", "email": "john.doe@example.com", "phone": "+1-202-555-0101"},
    {"full_name": "Jane Smith", "email": "jane.smith@example.com", "phone": "+1-202-555-0102"},
    {"full_name": "Michael Brown", "email": "michael.brown@example.com", "phone": "+1-202-555-0103"},
    {"full_name": "Emily Davis", "email": "emily.davis@example.com", "phone": "+1-202-555-0104"},
    {"full_name": "David Wilson", "email": "david.wilson@example.com", "phone": "+1-202-555-0105"},
    {"full_name": "Sarah Johnson", "email": "sarah.johnson@example.com", "phone": "+1-202-555-0106"},
    {"full_name": "James Miller", "email": "james.miller@example.com", "phone": "+1-202-555-0107"},
    {"full_name": "Linda Garcia", "email": "linda.garcia@example.com", "phone": "+1-202-555-0108"},
    {"full_name": "Robert Martinez", "email": "robert.martinez@example.com", "phone": "+1-202-555-0109"},
    {"full_name": "Patricia Rodriguez", "email": "patricia.rodriguez@example.com", "phone": "+1-202-555-0110"},
    {"full_name": "Christopher Lee", "email": "christopher.lee@example.com", "phone": "+1-202-555-0111"},
    {"full_name": "Barbara Walker", "email": "barbara.walker@example.com", "phone": "+1-202-555-0112"},
    {"full_name": "Daniel Hall", "email": "daniel.hall@example.com", "phone": "+1-202-555-0113"},
    {"full_name": "Jessica Allen", "email": "jessica.allen@example.com", "phone": "+1-202-555-0114"},
    {"full_name": "Matthew Young", "email": "matthew.young@example.com", "phone": "+1-202-555-0115"},
    {"full_name": "Ashley King", "email": "ashley.king@example.com", "phone": "+1-202-555-0116"},
    {"full_name": "Joshua Wright", "email": "joshua.wright@example.com", "phone": "+1-202-555-0117"},
    {"full_name": "Amanda Scott", "email": "amanda.scott@example.com", "phone": "+1-202-555-0118"},
    {"full_name": "Andrew Green", "email": "andrew.green@example.com", "phone": "+1-202-555-0119"},
    {"full_name": "Megan Baker", "email": "megan.baker@example.com", "phone": "+1-202-555-0120"},
]

# Orders reference products by SKU (resolved to IDs at runtime) so the data
# stays readable and decoupled from auto-increment IDs. Mix of single-item and
# multi-item orders. Quantities kept small to avoid exhausting low-stock items.
ORDERS: list[dict] = [
    {"customer_email": "john.doe@example.com", "items": [("OFC-PEN-011", 2)]},
    {"customer_email": "jane.smith@example.com", "items": [("ELC-MON-006", 1), ("ACC-STD-007", 1)]},
    {"customer_email": "michael.brown@example.com", "items": [("STG-USB-017", 3)]},
    {"customer_email": "emily.davis@example.com", "items": [("OFC-PPR-012", 5), ("OFC-NTE-013", 4)]},
    {"customer_email": "david.wilson@example.com", "items": [("NET-RTR-016", 1)]},
    {"customer_email": "sarah.johnson@example.com", "items": [("ACC-HDM-014", 2), ("NET-ETH-015", 2)]},
    {"customer_email": "james.miller@example.com", "items": [("ELC-CAM-008", 1)]},
    {"customer_email": "linda.garcia@example.com", "items": [("OFC-ORG-018", 2), ("ACC-SLV-019", 1)]},
    {"customer_email": "robert.martinez@example.com", "items": [("ELC-SRG-020", 3)]},
    {"customer_email": "patricia.rodriguez@example.com", "items": [("STG-HDD-010", 1), ("STG-USB-017", 2)]},
    {"customer_email": "christopher.lee@example.com", "items": [("NET-SWT-009", 1)]},
    {"customer_email": "barbara.walker@example.com", "items": [("OFC-PEN-011", 4), ("OFC-PPR-012", 3)]},
    {"customer_email": "daniel.hall@example.com", "items": [("ACC-HDM-014", 5)]},
    {"customer_email": "jessica.allen@example.com", "items": [("ELC-MON-006", 1), ("ELC-CAM-008", 1), ("ACC-MOU-002", 1)]},
    {"customer_email": "matthew.young@example.com", "items": [("NET-ETH-015", 3)]},
    {"customer_email": "ashley.king@example.com", "items": [("OFC-NTE-013", 6)]},
    {"customer_email": "joshua.wright@example.com", "items": [("ACC-SLV-019", 2), ("ACC-STD-007", 1)]},
    {"customer_email": "amanda.scott@example.com", "items": [("STG-SSD-005", 1)]},
    {"customer_email": "andrew.green@example.com", "items": [("ELC-HDP-004", 1), ("ELC-KEY-001", 1)]},
    {"customer_email": "megan.baker@example.com", "items": [("OFC-ORG-018", 3), ("ACC-HUB-003", 1)]},
]


# ---------------------------------------------------------------------------
# Seeding routines (idempotent)
# ---------------------------------------------------------------------------

async def _existing_skus(session) -> set[str]:
    result = await session.execute(select(Product.sku))
    return set(result.scalars().all())


async def _existing_emails(session) -> set[str]:
    result = await session.execute(select(Customer.email))
    return set(result.scalars().all())


async def seed_products(session) -> int:
    existing = await _existing_skus(session)
    created = 0
    for product in PRODUCTS:
        if product["sku"] in existing:
            continue
        await create_product(session, ProductCreate(**product))
        created += 1
    return created


async def seed_customers(session) -> int:
    existing = await _existing_emails(session)
    created = 0
    for customer in CUSTOMERS:
        if customer["email"] in existing:
            continue
        await create_customer(session, CustomerCreate(**customer))
        created += 1
    return created


async def seed_orders(session) -> int:
    # Only seed orders when none exist to avoid repeated inventory deductions.
    existing_orders = await session.execute(select(func.count(Order.id)))
    if (existing_orders.scalar() or 0) > 0:
        return 0

    # Build SKU -> id and email -> id lookups from current DB state.
    product_rows = await session.execute(select(Product.id, Product.sku))
    sku_to_id = {row.sku: row.id for row in product_rows.all()}

    customer_rows = await session.execute(select(Customer.id, Customer.email))
    email_to_id = {row.email: row.id for row in customer_rows.all()}

    created = 0
    for order in ORDERS:
        customer_id = email_to_id.get(order["customer_email"])
        if customer_id is None:
            continue

        items = [
            OrderItemCreate(product_id=sku_to_id[sku], quantity=qty)
            for sku, qty in order["items"]
            if sku in sku_to_id
        ]
        if not items:
            continue

        await create_order(
            session,
            OrderCreate(customer_id=customer_id, items=items),
        )
        created += 1
    return created


async def run_seed() -> None:
    async with SessionLocal() as session:
        products_created = await seed_products(session)
        customers_created = await seed_customers(session)
        orders_created = await seed_orders(session)

    print("Seed complete:")
    print(f"  Products created : {products_created}")
    print(f"  Customers created: {customers_created}")
    print(f"  Orders created   : {orders_created}")


if __name__ == "__main__":
    asyncio.run(run_seed())
