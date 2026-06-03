from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate


async def create_customer(
    session: AsyncSession, customer_in: CustomerCreate
) -> Customer:
    existing_customer = await _get_customer_by_email(session, customer_in.email)
    if existing_customer is not None:
        raise ValueError("A customer with this email already exists.")

    customer = Customer(
        full_name=customer_in.full_name,
        email=customer_in.email,
        phone=customer_in.phone,
    )
    session.add(customer)

    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise ValueError("A customer with this email already exists.") from exc
    except SQLAlchemyError:
        await session.rollback()
        raise

    await session.refresh(customer)
    return customer


async def get_customer(session: AsyncSession, customer_id: int) -> Customer | None:
    return await session.get(Customer, customer_id)


async def get_customers(session: AsyncSession) -> list[Customer]:
    result = await session.execute(select(Customer).order_by(Customer.id.asc()))
    return list(result.scalars().all())


async def delete_customer(session: AsyncSession, customer_id: int) -> bool:
    customer = await get_customer(session, customer_id)
    if customer is None:
        return False

    await session.delete(customer)

    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise ValueError("Customer cannot be deleted because it is referenced by existing orders.") from exc
    except SQLAlchemyError:
        await session.rollback()
        raise

    return True


async def _get_customer_by_email(
    session: AsyncSession, email: str
) -> Customer | None:
    result = await session.execute(select(Customer).where(Customer.email == email))
    return result.scalar_one_or_none()
