from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.analysis import HealthResponse


router = APIRouter(tags=["service"])


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(
        status="operational",
        service=get_settings().app_name,
    )
