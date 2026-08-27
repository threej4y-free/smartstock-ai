from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.errors import DomainError
from app.routers import inventory, products, sales, suppliers
from app.schemas import HealthRead


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="Inventory system with lot traceability and FEFO allocation.",
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.exception_handler(DomainError)
    async def domain_error_handler(_: Request, exc: DomainError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": exc.code, "message": exc.message}},
        )

    @application.get("/health", response_model=HealthRead, tags=["health"])
    def health() -> HealthRead:
        return HealthRead(status="ok")

    for router in (products.router, suppliers.router, inventory.router, sales.router):
        application.include_router(router, prefix=settings.api_prefix)
    return application


app = create_app()
