from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.schemas.customer import (
    CustomerCreate,
    CustomerListResponse,
    CustomerResponse,
)
from app.services.customer_service import (
    create_customer,
    delete_customer,
    get_customer,
    get_customers,
)

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer_endpoint(
    customer_in: CustomerCreate,
    session: AsyncSession = Depends(get_db_session),
) -> CustomerResponse:
    try:
        customer = await create_customer(session, customer_in)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating the customer.",
        ) from exc

    return CustomerResponse.model_validate(customer)


@router.get("", response_model=CustomerListResponse, status_code=status.HTTP_200_OK)
async def list_customers_endpoint(
    session: AsyncSession = Depends(get_db_session),
) -> CustomerListResponse:
    try:
        customers = await get_customers(session)
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching customers.",
        ) from exc

    return CustomerListResponse(
        items=[CustomerResponse.model_validate(customer) for customer in customers]
    )


@router.get(
    "/{customer_id}",
    response_model=CustomerResponse,
    status_code=status.HTTP_200_OK,
)
async def get_customer_endpoint(
    customer_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> CustomerResponse:
    try:
        customer = await get_customer(session, customer_id)
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching the customer.",
        ) from exc

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    return CustomerResponse.model_validate(customer)


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer_endpoint(
    customer_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    try:
        deleted = await delete_customer(session, customer_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while deleting the customer.",
        ) from exc

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
