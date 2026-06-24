from fastapi import APIRouter
from ..services.ml_service import MLService

router = APIRouter(tags=['health'])


@router.get('/health')
def health_check():
    svc = MLService.get()
    return {
        'status': 'ok',
        'models_ready': svc.is_ready(),
    }


@router.get('/health/models')
def model_status():
    svc = MLService.get()
    return {
        'cold_start_loaded':  svc._cold is not None,
        'performance_loaded': svc._perf is not None,
    }
