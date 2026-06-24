"""
MLService — loads both trained models and dispatches predictions.

Model selection logic:
  completedJobs >= settings.performance_model_min_contracts
    → use performance model
  otherwise
    → use cold-start model
"""
from __future__ import annotations

import os
from typing import Any

import joblib
from loguru import logger

from ..config import get_settings
from ..schemas.prediction import PredictionRequest, PredictionResponse
from ..utils.preprocessing import (
    build_cold_start_row,
    build_performance_row,
    level_to_score,
)


class ModelBundle:
    """Wraps a model + label encoder + scaler + feature list."""

    def __init__(self, tag: str, model_dir: str) -> None:
        self.tag = tag
        prefix = os.path.join(model_dir, tag)
        self.model         = joblib.load(f'{prefix}_model.pkl')
        self.label_encoder = joblib.load(f'{prefix}_label_encoder.pkl')
        self.scaler        = joblib.load(f'{prefix}_scaler.pkl')
        self.feature_cols  = joblib.load(f'{prefix}_feature_columns.pkl')
        logger.info(f'[MLService] Loaded {tag} model ({len(self.feature_cols)} features)')

    def predict(self, X) -> tuple[str, float, dict[str, float]]:
        """
        Returns (predicted_label, confidence, {label: probability}).
        """
        proba  = self.model.predict_proba(X)[0]
        labels = self.label_encoder.classes_
        probs  = {str(lbl): round(float(p), 4) for lbl, p in zip(labels, proba)}
        idx    = proba.argmax()
        label  = str(labels[idx])
        conf   = round(float(proba[idx]), 4)
        return label, conf, probs


class MLService:
    _instance: 'MLService | None' = None

    def __init__(self) -> None:
        settings = get_settings()
        model_dir = os.path.abspath(settings.model_path)
        self._min_contracts = settings.performance_model_min_contracts
        self._cold: ModelBundle | None = None
        self._perf: ModelBundle | None = None

        try:
            self._cold = ModelBundle(settings.cold_start_model_tag, model_dir)
        except FileNotFoundError:
            logger.warning('[MLService] cold_start model not found — run train_capability_model.py')

        try:
            self._perf = ModelBundle(settings.performance_model_tag, model_dir)
        except FileNotFoundError:
            logger.warning('[MLService] performance model not found — run train_capability_model.py')

    @classmethod
    def get(cls) -> 'MLService':
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def is_ready(self) -> bool:
        return self._cold is not None or self._perf is not None

    def predict(self, req: PredictionRequest) -> PredictionResponse:
        use_performance = (
            req.completed_jobs >= self._min_contracts
            and self._perf is not None
        )

        if use_performance:
            bundle = self._perf
            assert bundle is not None
            X = build_performance_row(
                completed_jobs=req.completed_jobs,
                earnings_usd=req.earnings_usd,
                hourly_rate=req.hourly_rate_usd,
                success_rate=req.success_rate,
                avg_rating=req.avg_rating,
                avg_job_duration_days=req.avg_job_duration_days,
                rehire_rate=req.rehire_rate,
                job_category=req.job_category,
                project_type=req.project_type,
                client_region=req.client_region,
                feature_columns=bundle.feature_cols,
                scaler=bundle.scaler,
            )
            model_tag = 'performance'
        else:
            if self._cold is None:
                raise RuntimeError('No models loaded. Train models first.')
            bundle = self._cold
            X = build_cold_start_row(
                years_of_experience=req.years_of_experience,
                hourly_rate_usd=req.hourly_rate_usd,
                rating=req.rating,
                client_satisfaction=req.client_satisfaction,
                primary_skill=req.primary_skill,
                country=req.country,
                feature_columns=bundle.feature_cols,
                scaler=bundle.scaler,
            )
            model_tag = 'cold_start'

        label, confidence, probs = bundle.predict(X)
        score = level_to_score(label, probs)

        return PredictionResponse(
            user_id=req.user_id,
            capability_level=label,       # type: ignore[arg-type]
            capability_score=score,
            confidence=confidence,
            model_used=model_tag,         # type: ignore[arg-type]
            probabilities=probs,
        )
