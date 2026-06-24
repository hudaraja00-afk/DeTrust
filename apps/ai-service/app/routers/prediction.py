from fastapi import APIRouter, HTTPException
from loguru import logger

from ..schemas.prediction import PredictionRequest, PredictionResponse
from ..services.ml_service import MLService

router = APIRouter(prefix='/predict', tags=['prediction'])


@router.post('', response_model=PredictionResponse)
def predict_capability(request: PredictionRequest) -> PredictionResponse:
    """
    Predict a freelancer's capability level.

    The service automatically selects the right model:
    - **cold_start** — for users with fewer than 2 completed contracts
    - **performance** — for users with ≥2 completed contracts

    Returns a capability level (Beginner / Intermediate / Expert),
    a normalised 0-100 score, and per-class probabilities.
    """
    svc = MLService.get()
    if not svc.is_ready():
        raise HTTPException(
            status_code=503,
            detail='ML models not loaded. Train models first '
                   '(run build_training_dataset.py then train_capability_model.py).',
        )
    try:
        return svc.predict(request)
    except Exception as exc:
        logger.exception(f'Prediction failed for user {request.user_id}: {exc}')
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post('/batch', response_model=list[PredictionResponse])
def predict_batch(requests: list[PredictionRequest]) -> list[PredictionResponse]:
    """Batch capability prediction (up to 100 users per call)."""
    if len(requests) > 100:
        raise HTTPException(status_code=400, detail='Batch limited to 100 users per request.')
    svc = MLService.get()
    if not svc.is_ready():
        raise HTTPException(status_code=503, detail='ML models not loaded.')
    results = []
    for req in requests:
        try:
            results.append(svc.predict(req))
        except Exception as exc:
            logger.warning(f'Batch predict failed for {req.user_id}: {exc}')
    return results
