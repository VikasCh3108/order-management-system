from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.schemas.order import (
    OrderCreate,
    OrderListResponse,
    OrderResponse,
)
from app.services.order_service import (
    create_order,
    delete_order,
    get_order,
    get_orders,
)

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order_endpoint(
    order_in: OrderCreate,
    session: AsyncSession = Depends(get_db_session),
) -> OrderResponse:
    try:
        order = await create_order(session, order_in)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating the order.",
        ) from exc

    return OrderResponse.model_validate(order)


@router.get("", response_model=OrderListResponse, status_code=status.HTTP_200_OK)
async def list_orders_endpoint(
    session: AsyncSession = Depends(get_db_session),
) -> OrderListResponse:
    try:
        orders = await get_orders(session)
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching orders.",
        ) from exc

    return OrderListResponse(
        items=[OrderResponse.model_validate(order) for order in orders]
    )


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
    status_code=status.HTTP_200_OK,
)
async def get_order_endpoint(
    order_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> OrderResponse:
    try:
        order = await get_order(session, order_id)
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching the order.",
        ) from exc

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found.",
        )

    return OrderResponse.model_validate(order)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order_endpoint(
    order_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    try:
        deleted = await delete_order(session, order_id)
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while deleting the order.",
        ) from exc

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found.",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
