"""
Feature engineering helpers that mirror the build_training_dataset.py
transformations so inference stays consistent with training.
"""
from __future__ import annotations
import numpy as np
import pandas as pd
from typing import Any


# ─── COLD-START FEATURES ──────────────────────────────────────────────────────
COLD_START_NUMERIC = [
    'years_of_experience', 'hourly_rate_usd', 'rating', 'client_satisfaction'
]


def build_cold_start_row(
    *,
    years_of_experience: float,
    hourly_rate_usd: float,
    rating: float,
    client_satisfaction: float,
    primary_skill: str | None,
    country: str | None,
    feature_columns: list[str],
    scaler: Any,
) -> pd.DataFrame:
    """
    Construct a single-row DataFrame that matches the cold_start training schema.
    Unknown one-hot categories are left as 0 (unseen at training time).
    """
    row: dict[str, float] = {c: 0.0 for c in feature_columns}

    # Numeric
    row['years_of_experience']  = float(years_of_experience)
    row['hourly_rate_usd']       = float(hourly_rate_usd)
    row['rating']                = float(rating)
    row['client_satisfaction']   = float(client_satisfaction)

    # One-hot
    if primary_skill:
        key = f'primary_skill_{primary_skill}'
        if key in row:
            row[key] = 1.0
    if country:
        key = f'country_{country}'
        if key in row:
            row[key] = 1.0

    df = pd.DataFrame([row])[feature_columns]

    # Scale numeric columns only
    num_present = [c for c in COLD_START_NUMERIC if c in df.columns]
    if num_present:
        df[num_present] = scaler.transform(df[num_present])

    return df


# ─── PERFORMANCE FEATURES ─────────────────────────────────────────────────────
PERF_NUMERIC = [
    'Job_Completed', 'Earnings_USD', 'Hourly_Rate',
    'Job_Success_Rate', 'Client_Rating', 'Job_Duration_Days', 'Rehire_Rate'
]


def build_performance_row(
    *,
    completed_jobs: int,
    earnings_usd: float,
    hourly_rate: float,
    success_rate: float,
    avg_rating: float,
    avg_job_duration_days: float,
    rehire_rate: float,
    job_category: str | None,
    project_type: str | None,
    client_region: str | None,
    feature_columns: list[str],
    scaler: Any,
) -> pd.DataFrame:
    """
    Construct a single-row DataFrame matching the performance training schema.
    """
    row: dict[str, float] = {c: 0.0 for c in feature_columns}

    row['Job_Completed']      = float(completed_jobs)
    row['Earnings_USD']       = float(earnings_usd)
    row['Hourly_Rate']        = float(hourly_rate)
    row['Job_Success_Rate']   = float(success_rate)
    row['Client_Rating']      = float(avg_rating)
    row['Job_Duration_Days']  = float(avg_job_duration_days)
    row['Rehire_Rate']        = float(rehire_rate)

    if job_category:
        key = f'Job_Category_{job_category}'
        if key in row:
            row[key] = 1.0
    if project_type:
        key = f'Project_Type_{project_type}'
        if key in row:
            row[key] = 1.0
    if client_region:
        key = f'Client_Region_{client_region}'
        if key in row:
            row[key] = 1.0

    df = pd.DataFrame([row])[feature_columns]
    num_present = [c for c in PERF_NUMERIC if c in df.columns]
    if num_present:
        df[num_present] = scaler.transform(df[num_present])

    return df


# ─── SCORE NORMALISATION ──────────────────────────────────────────────────────
_LEVEL_TO_SCORE = {'Beginner': 20.0, 'Intermediate': 55.0, 'Expert': 88.0}


def level_to_score(level: str, probs: dict[str, float]) -> float:
    """
    Convert a discrete label + probability distribution to a 0-100 score.
    Weighted average of the level midpoints by their probabilities.
    """
    score = sum(
        _LEVEL_TO_SCORE.get(lbl, 55.0) * p
        for lbl, p in probs.items()
    )
    return round(min(100.0, max(0.0, score)), 2)
