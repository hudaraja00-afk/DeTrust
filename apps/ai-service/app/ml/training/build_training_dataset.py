"""
DeTrust — Training Dataset Builder
====================================
Merges the available raw datasets into two clean Parquet files:

  out/cold_start_features.parquet  — profile-only signals (no contract history)
  out/performance_features.parquet — post-contract signals (aggregated from 1.3M rows)

Datasets used:
  dataset/global_freelancers_raw.csv  — profile signals (skills, experience, rates)
  dataset/freelancer_earnings_bd.csv  — aggregated performance history (Kaggle BD dataset)
  dataset/contracts1.3 mil.csv        — raw contract transactions (1.3M rows)
  dataset/freelancer_job_postings.csv — job taxonomy (used for category mapping)

Cold-start label derivation:
  Composite = 0.4 * norm(rating) + 0.35 * norm(years_exp) + 0.25 * norm(hourly_rate)
  Binned into Beginner / Intermediate / Expert by tertile.

Performance label derivation (same as v2 train script, for consistency):
  Composite = 0.25*success_rate + 0.25*avg_rating + 0.15*rehire_rate
            + 0.15*earnings_usd + 0.10*completed_jobs + 0.10*hourly_rate
  Binned into Beginner / Intermediate / Expert by tertile.
"""

import os
import warnings
import numpy as np
import pandas as pd

warnings.filterwarnings('ignore')

# ─── PATHS ────────────────────────────────────────────────────────────────────
BASE = os.path.dirname(os.path.abspath(__file__))
DS  = os.path.join(BASE, 'dataset')
OUT = os.path.join(BASE, 'out')
os.makedirs(OUT, exist_ok=True)

GLOBAL_CSV     = os.path.join(DS, 'global_freelancers_raw.csv')
EARNINGS_CSV   = os.path.join(DS, 'freelancer_earnings_bd.csv')
CONTRACTS_CSV  = os.path.join(DS, 'contracts1.3 mil.csv')

# ─── HELPERS ──────────────────────────────────────────────────────────────────
def minmax_norm(series: pd.Series) -> pd.Series:
    mn, mx = series.min(), series.max()
    if mx == mn:
        return pd.Series(np.zeros(len(series)), index=series.index)
    return (series - mn) / (mx - mn)


def tertile_label(scores: pd.Series) -> pd.Series:
    p33 = scores.quantile(0.33)
    p66 = scores.quantile(0.66)
    return pd.cut(scores, bins=[-np.inf, p33, p66, np.inf],
                  labels=['Beginner', 'Intermediate', 'Expert'])


# ─── COLD-START DATASET ───────────────────────────────────────────────────────
def build_cold_start():
    print("=" * 55)
    print("Building cold-start dataset from global_freelancers_raw…")
    print("=" * 55)

    df = pd.read_csv(GLOBAL_CSV)
    print(f"  Raw rows: {len(df)}")

    # Rename for consistency
    df.columns = [c.strip().lower().replace(' ', '_').replace('(', '').replace(')', '') for c in df.columns]

    # Drop rows missing key signals
    df = df.dropna(subset=['years_of_experience', 'rating'])

    # Numeric coerce — must separate coerce and fillna so median() runs on numeric dtype
    df['hourly_rate_usd'] = pd.to_numeric(df['hourly_rate_usd'], errors='coerce')
    df['hourly_rate_usd'] = df['hourly_rate_usd'].fillna(df['hourly_rate_usd'].median() if df['hourly_rate_usd'].notna().any() else 0)
    df['years_of_experience'] = pd.to_numeric(df['years_of_experience'], errors='coerce').fillna(0)
    df['rating'] = pd.to_numeric(df['rating'], errors='coerce').fillna(0)
    df['client_satisfaction'] = pd.to_numeric(df['client_satisfaction'], errors='coerce').fillna(0)

    # Composite score
    composite = (
        0.40 * minmax_norm(df['rating']) +
        0.35 * minmax_norm(df['years_of_experience']) +
        0.25 * minmax_norm(df['hourly_rate_usd'])
    )
    df['capability_score'] = composite
    df['Capability_Level'] = tertile_label(composite)
    df = df.dropna(subset=['Capability_Level'])

    # Feature set for cold-start
    features = df[['years_of_experience', 'hourly_rate_usd', 'rating',
                   'client_satisfaction', 'primary_skill', 'country',
                   'Capability_Level']].copy()

    # One-hot encode categoricals
    out = pd.get_dummies(features, columns=['primary_skill', 'country'], drop_first=False)

    print(f"  Clean rows: {len(out)}")
    print(f"  Features:   {len(out.columns) - 1}")
    dist = out['Capability_Level'].value_counts()
    print(f"  Label dist: {dict(dist)}")

    out.to_parquet(os.path.join(OUT, 'cold_start_features.parquet'), index=False)
    print(f"  Saved → out/cold_start_features.parquet")
    return out


# ─── PERFORMANCE DATASET (BD earnings + 1.3M contracts) ──────────────────────
def build_performance():
    print("\n" + "=" * 55)
    print("Building performance dataset…")
    print("=" * 55)

    # ── BD earnings dataset (already aggregated) ──────────────────
    print("  Loading freelancer_earnings_bd.csv…")
    bd = pd.read_csv(EARNINGS_CSV)

    # Capability composite matching the training script v2 weights
    bd_norm = pd.DataFrame()
    weights = {
        'Job_Success_Rate': 0.25,
        'Client_Rating':    0.25,
        'Rehire_Rate':      0.15,
        'Earnings_USD':     0.15,
        'Job_Completed':    0.10,
        'Hourly_Rate':      0.10,
    }
    for col, w in weights.items():
        bd_norm[col] = minmax_norm(bd[col])

    bd['capability_score'] = sum(bd_norm[c] * w for c, w in weights.items())
    bd['Capability_Level'] = tertile_label(bd['capability_score'])
    bd = bd.dropna(subset=['Capability_Level'])

    bd_features = bd[['Job_Completed', 'Earnings_USD', 'Hourly_Rate',
                       'Job_Success_Rate', 'Client_Rating', 'Job_Duration_Days',
                       'Rehire_Rate', 'Job_Category', 'Project_Type',
                       'Client_Region', 'Capability_Level']].copy()
    print(f"  BD rows: {len(bd_features)}")

    # ── Aggregate contracts1.3M ────────────────────────────────────
    print("  Loading contracts1.3 mil.csv (large, chunking)…")
    chunks = []
    for chunk in pd.read_csv(CONTRACTS_CSV, chunksize=200_000,
                             parse_dates=['start_date', 'end_date'],
                             low_memory=False):
        # Coerce numerics
        chunk['total_paid'] = pd.to_numeric(chunk['total_paid'], errors='coerce')
        chunk['hourly_rate'] = pd.to_numeric(chunk['hourly_rate'], errors='coerce')
        chunk['total_hours'] = pd.to_numeric(chunk['total_hours'], errors='coerce')

        # Duration in days
        chunk['duration_days'] = (
            pd.to_datetime(chunk['end_date'], errors='coerce') -
            pd.to_datetime(chunk['start_date'], errors='coerce')
        ).dt.days.clip(lower=0)

        # Completed = has end_date and total_paid > 0
        chunk['completed'] = (
            chunk['end_date'].notna() & (chunk['total_paid'] > 0)
        ).astype(int)

        chunks.append(chunk[['freelancer_id', 'total_paid', 'hourly_rate',
                              'total_hours', 'duration_days', 'completed']])

    contracts = pd.concat(chunks, ignore_index=True)
    print(f"  Contract rows loaded: {len(contracts):,}")

    # Aggregate by freelancer
    agg = contracts.groupby('freelancer_id').agg(
        contract_count      = ('total_paid', 'count'),
        completed_count     = ('completed', 'sum'),
        total_earned        = ('total_paid', 'sum'),
        avg_hourly_rate     = ('hourly_rate', 'mean'),
        avg_duration_days   = ('duration_days', 'mean'),
        total_hours         = ('total_hours', 'sum'),
    ).reset_index()

    agg['success_rate'] = (agg['completed_count'] / agg['contract_count'].clip(lower=1)) * 100
    agg['avg_hourly_rate']  = agg['avg_hourly_rate'].fillna(0)
    agg['avg_duration_days'] = agg['avg_duration_days'].fillna(0)

    # Filter: only freelancers with ≥ 2 contracts (enough signal)
    agg = agg[agg['contract_count'] >= 2].copy()

    # Derive a synthetic client_rating from success_rate (contracts lack rating)
    # Map success_rate [0,100] → [1,5]
    agg['synthetic_rating'] = 1 + (agg['success_rate'] / 100) * 4

    # Composite capability score
    agg_norm = pd.DataFrame()
    perf_weights = {
        'success_rate':       0.30,
        'synthetic_rating':   0.25,
        'total_earned':       0.20,
        'completed_count':    0.15,
        'avg_hourly_rate':    0.10,
    }
    for col, w in perf_weights.items():
        agg_norm[col] = minmax_norm(agg[col])

    agg['capability_score'] = sum(agg_norm[c] * w for c, w in perf_weights.items())
    agg['Capability_Level'] = tertile_label(agg['capability_score'])
    agg = agg.dropna(subset=['Capability_Level'])

    # Rename to match model feature expectations
    contract_features = agg.rename(columns={
        'completed_count':   'Job_Completed',
        'total_earned':      'Earnings_USD',
        'avg_hourly_rate':   'Hourly_Rate',
        'success_rate':      'Job_Success_Rate',
        'synthetic_rating':  'Client_Rating',
        'avg_duration_days': 'Job_Duration_Days',
    })[['Job_Completed', 'Earnings_USD', 'Hourly_Rate', 'Job_Success_Rate',
        'Client_Rating', 'Job_Duration_Days', 'Capability_Level']].copy()

    # Fill missing categorical columns with placeholder for concat
    contract_features['Rehire_Rate'] = 0.0
    contract_features['Job_Category'] = 'Unknown'
    contract_features['Project_Type'] = 'Unknown'
    contract_features['Client_Region'] = 'Unknown'

    print(f"  Contract-derived rows: {len(contract_features):,}")

    # ── Merge both performance sources ────────────────────────────
    combined = pd.concat([bd_features, contract_features], ignore_index=True)
    combined = combined.dropna(subset=['Capability_Level'])
    print(f"  Combined performance rows: {len(combined):,}")

    # One-hot encode
    out = pd.get_dummies(combined, columns=['Job_Category', 'Project_Type', 'Client_Region'],
                         drop_first=False)

    dist = out['Capability_Level'].value_counts()
    print(f"  Label dist: {dict(dist)}")

    out.to_parquet(os.path.join(OUT, 'performance_features.parquet'), index=False)
    print(f"  Saved → out/performance_features.parquet")
    return out


# ─── MAIN ─────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    cold = build_cold_start()
    perf = build_performance()

    print("\n" + "=" * 55)
    print("Dataset build complete.")
    print(f"  Cold-start:  {len(cold):>7,} rows  →  out/cold_start_features.parquet")
    print(f"  Performance: {len(perf):>7,} rows  →  out/performance_features.parquet")
    print("=" * 55)
