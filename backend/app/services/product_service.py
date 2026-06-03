from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


async def create_product(
    session: AsyncSession, product_in: ProductCreate
) -> Product:
    existing_product = await _get_product_by_sku(session, product_in.sku)
    if existing_product is not None:
        raise ValueError("A product with this SKU already exists.")

    product = Product(
        name=product_in.name,
        sku=product_in.sku,
        price=product_in.price,
        stock_quantity=product_in.stock_quantity,
    )
    session.add(product)

    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise ValueError("A product with this SKU already exists.") from exc
    except SQLAlchemyError:
        await session.rollback()
        raise

    await session.refresh(product)
    return product


async def get_product(session: AsyncSession, product_id: int) -> Product | None:
    return await session.get(Product, product_id)


async def get_products(session: AsyncSession) -> list[Product]:
    result = await session.execute(select(Product).order_by(Product.id.asc()))
    return list(result.scalars().all())


async def update_product(
    session: AsyncSession, product_id: int, product_in: ProductUpdate
) -> Product | None:
    product = await get_product(session, product_id)
    if product is None:
        return None

    update_data = product_in.model_dump(exclude_unset=True)

    if "sku" in update_data:
        existing_product = await _get_product_by_sku(session, update_data["sku"])
        if existing_product is not None and existing_product.id != product_id:
            raise ValueError("A product with this SKU already exists.")

    for field, value in update_data.items():
        setattr(product, field, value)

    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise ValueError("A product with this SKU already exists.") from exc
    except SQLAlchemyError:
        await session.rollback()
        raise

    await session.refresh(product)
    return product


async def delete_product(session: AsyncSession, product_id: int) -> bool:
    product = await get_product(session, product_id)
    if product is None:
        return False

    await session.delete(product)

    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise ValueError("Product cannot be deleted because it is referenced by existing orders.") from exc
    except SQLAlchemyError:
        await session.rollback()
        raise

    return True


async def _get_product_by_sku(session: AsyncSession, sku: str) -> Product | None:
    result = await session.execute(select(Product).where(Product.sku == sku))
    return result.scalar_one_or_none()
