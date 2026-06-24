"""
DeTrust Module 6: AI Capability Prediction — Model Training Pipeline v3
=========================================================================
Two-model approach:
  1. cold_start_model  — profile-only signals (new users with no contracts)
  2. performance_model — post-contract signals (users with ≥2 completed jobs)

Both models use XGBoost as the primary estimator (fallback to Random Forest
if XGBoost is unavailable).  Labels are derived via a composite scoring
function — NOT the original random Experience_Level column.

Run AFTER build_training_dataset.py:
  python build_training_dataset.py
  python train_capability_model.py
"""

import os
import json
import time
import warnings
import numpy as np
import pandas as pd
import joblib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import (
    train_test_split, cross_val_score, StratifiedKFold, GridSearchCV
)
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    classification_report, confusion_matrix, accuracy_score,
    f1_score, precision_score, recall_score
)

try:
    from xgboost import XGBClassifier
    _HAS_XGB = True
except ImportError:
    _HAS_XGB = False

warnings.filterwarnings('ignore')

# ─── CONFIG ───────────────────────────────────────────────────────────────────
# app/models/train_capability_model.py
# → app/ml/training/out   (built datasets)
# → app/ml/trained_models (serialised model artifacts)
BASE        = os.path.dirname(os.path.abspath(__file__))      # …/app/models
OUT_DIR     = os.path.abspath(os.path.join(BASE, '..', 'ml', 'training', 'out'))
MODELS_DIR  = os.path.abspath(os.path.join(BASE, '..', 'ml', 'trained_models'))
os.makedirs(OUT_DIR,    exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

RANDOM_STATE = 42
TEST_SIZE    = 0.20
CV_FOLDS     = 5
N_JOBS       = -1
TARGET       = 'Capability_Level'

# Features for each model variant
COLD_START_NUMERIC = [
    'years_of_experience', 'hourly_rate_usd', 'rating', 'client_satisfaction'
]
PERF_NUMERIC = [
    'Job_Completed', 'Earnings_USD', 'Hourly_Rate',
    'Job_Success_Rate', 'Client_Rating', 'Job_Duration_Days', 'Rehire_Rate'
]


# ─── SHARED HELPERS ───────────────────────────────────────────────────────────
def _best_classifier(n_jobs=N_JOBS, random_state=RANDOM_STATE):
    if _HAS_XGB:
        return XGBClassifier(
            n_estimators=400, max_depth=6, learning_rate=0.1,
            subsample=0.85, colsample_bytree=0.85,
            random_state=random_state, n_jobs=n_jobs,
            eval_metric='mlogloss', verbosity=0,
        )
    return RandomForestClassifier(
        n_estimators=400, max_depth=15, min_samples_leaf=2,
        random_state=random_state, n_jobs=n_jobs,
    )


def _cv_eval(model, X, y, folds=CV_FOLDS):
    cv = StratifiedKFold(n_splits=folds, shuffle=True, random_state=RANDOM_STATE)
    f1s  = cross_val_score(model, X, y, cv=cv, scoring='f1_weighted', n_jobs=1)
    accs = cross_val_score(model, X, y, cv=cv, scoring='accuracy',    n_jobs=1)
    return f1s.mean(), f1s.std(), accs.mean()


def _hold_out_metrics(model, X, y, le):
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    model.fit(X_tr, y_tr)
    y_pred = model.predict(X_te)
    cm = confusion_matrix(y_te, y_pred)
    return {
        'accuracy':            round(accuracy_score(y_te, y_pred), 4),
        'f1_weighted':         round(f1_score(y_te, y_pred, average='weighted'), 4),
        'precision_weighted':  round(precision_score(y_te, y_pred, average='weighted'), 4),
        'recall_weighted':     round(recall_score(y_te, y_pred, average='weighted'), 4),
        'confusion_matrix':    cm.tolist(),
        'classification_report': classification_report(
            y_te, y_pred, target_names=le.classes_, output_dict=True
        ),
    }, cm


def _save_artifacts(tag, model, le, scaler, feat_cols, metrics):
    prefix = os.path.join(MODELS_DIR, tag)
    joblib.dump(model,      f'{prefix}_model.pkl')
    joblib.dump(le,         f'{prefix}_label_encoder.pkl')
    joblib.dump(scaler,     f'{prefix}_scaler.pkl')
    joblib.dump(feat_cols,  f'{prefix}_feature_columns.pkl')

    clean_params = {}
    if hasattr(model, 'get_params'):
        for k, v in model.get_params().items():
            clean_params[k] = v if isinstance(v, (str, int, float, bool, type(None))) else str(v)

    meta = {
        'tag':             tag,
        'model_type':      type(model).__name__,
        'target_column':   TARGET,
        'target_classes':  le.classes_.tolist(),
        'feature_columns': feat_cols,
        'metrics':         metrics,
        'model_params':    clean_params,
    }
    with open(f'{prefix}_metadata.json', 'w') as fh:
        json.dump(meta, fh, indent=2)

    print(f"  Saved: {prefix}_{{model,label_encoder,scaler,feature_columns}}.pkl + metadata.json")


def _plot_cm(cm, le, tag):
    fig, ax = plt.subplots(figsize=(7, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=le.classes_, yticklabels=le.classes_, ax=ax)
    ax.set_title(f'Confusion Matrix — {tag}', fontsize=13, fontweight='bold')
    ax.set_ylabel('Actual'); ax.set_xlabel('Predicted')
    plt.tight_layout()
    path = os.path.join(MODELS_DIR, f'{tag}_confusion_matrix.png')
    plt.savefig(path, dpi=150); plt.close()
    print(f"  Chart: {path}")


def _plot_importances(model, feat_cols, tag):
    if not hasattr(model, 'feature_importances_'):
        return
    imps = model.feature_importances_
    idx  = np.argsort(imps)[::-1][:15]
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.barh(range(len(idx)), imps[idx][::-1],
            color=sns.color_palette('viridis', len(idx)))
    ax.set_yticks(range(len(idx)))
    ax.set_yticklabels([feat_cols[i] for i in idx][::-1])
    ax.set_title(f'Feature Importances — {tag}', fontsize=13, fontweight='bold')
    ax.set_xlabel('Importance')
    plt.tight_layout()
    path = os.path.join(MODELS_DIR, f'{tag}_feature_importance.png')
    plt.savefig(path, dpi=150); plt.close()
    print(f"  Chart: {path}")


# ─── MODEL 1: COLD-START ──────────────────────────────────────────────────────
def train_cold_start():
    TAG = 'cold_start'
    print("\n" + "=" * 60)
    print(f"TRAINING: {TAG.upper()} model")
    print("=" * 60)

    parquet = os.path.join(OUT_DIR, 'cold_start_features.parquet')
    if not os.path.exists(parquet):
        raise FileNotFoundError(
            "Run build_training_dataset.py first to generate "
            "out/cold_start_features.parquet"
        )

    df = pd.read_parquet(parquet)
    df = df.dropna(subset=[TARGET])
    print(f"  Rows: {len(df)}")

    # Identify numeric features that exist in this frame
    num_feats = [c for c in COLD_START_NUMERIC if c in df.columns]
    cat_feats  = [c for c in df.columns if c.startswith('primary_skill_') or c.startswith('country_')]

    X = df[num_feats + cat_feats].fillna(0)
    y_raw = df[TARGET]

    le = LabelEncoder()
    y  = le.fit_transform(y_raw)
    print(f"  Classes: {le.classes_.tolist()}")

    scaler = StandardScaler()
    X[num_feats] = scaler.fit_transform(X[num_feats])

    feat_cols = list(X.columns)
    print(f"  Features: {len(feat_cols)}")

    # CV eval
    model = _best_classifier()
    f1_cv, f1_std, acc_cv = _cv_eval(model, X, y)
    print(f"  CV  F1={f1_cv:.4f} (±{f1_std:.4f})  Acc={acc_cv:.4f}")

    # Hold-out eval
    metrics, cm = _hold_out_metrics(model, X, y, le)
    print(f"  HO  F1={metrics['f1_weighted']}  Acc={metrics['accuracy']}")
    print(classification_report(
        [le.classes_[i] for i in [row for row in range(len(le.classes_))]],
        [le.classes_[i] for i in [row for row in range(len(le.classes_))]],
        labels=le.classes_,
    ) if False else '')  # skip verbose report here

    # Retrain on full data
    model.fit(X, y)
    _save_artifacts(TAG, model, le, scaler, feat_cols, metrics)
    _plot_cm(cm, le, TAG)
    _plot_importances(model, feat_cols, TAG)
    return metrics


# ─── MODEL 2: PERFORMANCE ─────────────────────────────────────────────────────
def train_performance():
    TAG = 'performance'
    print("\n" + "=" * 60)
    print(f"TRAINING: {TAG.upper()} model")
    print("=" * 60)

    parquet = os.path.join(OUT_DIR, 'performance_features.parquet')
    if not os.path.exists(parquet):
        raise FileNotFoundError(
            "Run build_training_dataset.py first to generate "
            "out/performance_features.parquet"
        )

    df = pd.read_parquet(parquet)
    df = df.dropna(subset=[TARGET])
    print(f"  Rows: {len(df):,}")

    num_feats = [c for c in PERF_NUMERIC if c in df.columns]
    cat_feats  = [c for c in df.columns
                  if c.startswith('Job_Category_') or
                     c.startswith('Project_Type_') or
                     c.startswith('Client_Region_')]

    X = df[num_feats + cat_feats].fillna(0)
    y_raw = df[TARGET]

    le = LabelEncoder()
    y  = le.fit_transform(y_raw)
    print(f"  Classes: {le.classes_.tolist()}")

    scaler = StandardScaler()
    X[num_feats] = scaler.fit_transform(X[num_feats])

    feat_cols = list(X.columns)
    print(f"  Features: {len(feat_cols)}")

    # CV eval
    model = _best_classifier()
    f1_cv, f1_std, acc_cv = _cv_eval(model, X, y)
    print(f"  CV  F1={f1_cv:.4f} (±{f1_std:.4f})  Acc={acc_cv:.4f}")

    # Hold-out
    metrics, cm = _hold_out_metrics(model, X, y, le)
    print(f"  HO  F1={metrics['f1_weighted']}  Acc={metrics['accuracy']}")

    # Full retrain
    model.fit(X, y)
    _save_artifacts(TAG, model, le, scaler, feat_cols, metrics)
    _plot_cm(cm, le, TAG)
    _plot_importances(model, feat_cols, TAG)
    return metrics


# ─── COMPARISON CHART ─────────────────────────────────────────────────────────
def plot_comparison(cold_metrics, perf_metrics):
    names = ['Cold-start', 'Performance']
    f1s   = [cold_metrics['f1_weighted'], perf_metrics['f1_weighted']]
    accs  = [cold_metrics['accuracy'],    perf_metrics['accuracy']]

    x = np.arange(len(names))
    width = 0.35
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.bar(x - width/2, f1s,  width, label='F1 (weighted)', color='#2ecc71')
    ax.bar(x + width/2, accs, width, label='Accuracy',      color='#3498db')
    ax.set_xticks(x); ax.set_xticklabels(names)
    ax.set_ylim(0, 1.1)
    ax.set_title('Model Comparison — Hold-Out Test Set', fontsize=13, fontweight='bold')
    ax.set_ylabel('Score'); ax.legend()
    for i, (f, a) in enumerate(zip(f1s, accs)):
        ax.text(i - width/2, f + 0.02, f'{f:.3f}', ha='center', fontsize=9)
        ax.text(i + width/2, a + 0.02, f'{a:.3f}', ha='center', fontsize=9)
    plt.tight_layout()
    path = os.path.join(MODELS_DIR, 'model_comparison.png')
    plt.savefig(path, dpi=150); plt.close()
    print(f"  Chart: {path}")


# ─── MAIN ─────────────────────────────────────────────────────────────────────
def main():
    print("\n" + "=" * 60)
    print("  DeTrust AI — Capability Prediction v3")
    print("  Two-model pipeline (cold-start + performance)")
    print("=" * 60)
    t0 = time.time()

    cold_m = train_cold_start()
    perf_m = train_performance()
    plot_comparison(cold_m, perf_m)

    elapsed = time.time() - t0
    print("\n" + "=" * 60)
    print("TRAINING COMPLETE")
    print(f"  cold_start   F1={cold_m['f1_weighted']}  Acc={cold_m['accuracy']}")
    print(f"  performance  F1={perf_m['f1_weighted']}  Acc={perf_m['accuracy']}")
    print(f"  Total time:  {elapsed:.1f}s")
    print(f"  Artifacts:   {MODELS_DIR}/")
    print("=" * 60)


if __name__ == '__main__':
    main()
