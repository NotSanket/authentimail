import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.analyze import router as analyze_router
from app.api.health import router as health_router
from app.core.config import get_settings


logger = logging.getLogger("authentimail.api")
settings = get_settings()

app = FastAPI(
    title="AUTHENTIMAIL Analysis API",
    description="Deterministic phishing-risk analysis for messages and URL strings.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)

app.include_router(health_router, prefix="/api")
app.include_router(analyze_router, prefix="/api")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = [
        {
            "field": ".".join(str(part) for part in error["loc"] if part != "body") or "request",
            "message": error["msg"],
            "type": error["type"],
        }
        for error in exc.errors()
    ]
    return JSONResponse(status_code=422, content={"detail": errors})


@app.exception_handler(Exception)
async def unexpected_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled analysis service error", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "The analysis service encountered an unexpected error."},
    )
