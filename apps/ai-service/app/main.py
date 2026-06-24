"""DeTrust AI Service — FastAPI entrypoint."""
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from .config import get_settings
from .routers import health, prediction, verification
from .services.ml_service import MLService


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.remove()
    logger.add(
        sys.stderr,
        level=settings.log_level.upper(),
        format='<green>{time:HH:mm:ss}</green> | <level>{level}</level> | {message}',
    )
    logger.info(f'Starting DeTrust AI Service v{settings.api_version}')

    # Eagerly load models at startup
    svc = MLService.get()
    if svc.is_ready():
        logger.info('ML models loaded successfully')
    else:
        logger.warning(
            'No ML models available. '
            'Run build_training_dataset.py then train_capability_model.py '
            'to generate model artifacts.'
        )
    yield
    logger.info('Shutting down DeTrust AI Service')


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.api_title,
        version=settings.api_version,
        docs_url='/docs',
        redoc_url='/redoc',
        openapi_url='/openapi.json',
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=['*'],
        allow_methods=['*'],
        allow_headers=['*'],
    )

    app.include_router(health.router)
    app.include_router(prediction.router)
    app.include_router(verification.router)

    return app


app = create_app()


if __name__ == '__main__':
    import uvicorn
    settings = get_settings()
    uvicorn.run('app.main:app', host='0.0.0.0', port=settings.port,
                reload=settings.debug, log_level=settings.log_level)
