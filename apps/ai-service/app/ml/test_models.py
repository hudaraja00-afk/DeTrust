"""
Test both trained models with realistic mock freelancer profiles.
Validates that predictions are sensible and confidence scores make sense.
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import joblib

BASE = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE, 'trained_models')

# ─── Load Model Artifacts ─────────────────────────────────────────────

def load_model(tag):
    """Load model, scaler, label encoder, and feature columns."""
    model = joblib.load(os.path.join(MODELS_DIR, f'{tag}_model.pkl'))
    scaler = joblib.load(os.path.join(MODELS_DIR, f'{tag}_scaler.pkl'))
    le = joblib.load(os.path.join(MODELS_DIR, f'{tag}_label_encoder.pkl'))
    features = joblib.load(os.path.join(MODELS_DIR, f'{tag}_feature_columns.pkl'))
    return model, scaler, le, features


# ─── COLD-START Mock Profiles ─────────────────────────────────────────

COLD_START_MOCKS = [
    {
        "name": "Fresh Graduate (should be Beginner)",
        "years_of_experience": 0.5,
        "hourly_rate_usd": 10.0,
        "rating": 0.0,
        "client_satisfaction": 0.0,
        "primary_skill": "Data Analysis",
        "country": "India",
    },
    {
        "name": "Mid-Level Dev (should be Intermediate)",
        "years_of_experience": 5.0,
        "hourly_rate_usd": 45.0,
        "rating": 3.8,
        "client_satisfaction": 75.0,
        "primary_skill": "Web Development",
        "country": "Germany",
    },
    {
        "name": "Senior Blockchain Expert (should be Expert)",
        "years_of_experience": 15.0,
        "hourly_rate_usd": 95.0,
        "rating": 4.8,
        "client_satisfaction": 95.0,
        "primary_skill": "Blockchain Development",
        "country": "United States",
    },
    {
        "name": "Beginner Designer from Egypt",
        "years_of_experience": 1.0,
        "hourly_rate_usd": 15.0,
        "rating": 2.0,
        "client_satisfaction": 40.0,
        "primary_skill": "Graphic Design",
        "country": "Egypt",
    },
    {
        "name": "Experienced ML Engineer",
        "years_of_experience": 10.0,
        "hourly_rate_usd": 80.0,
        "rating": 4.5,
        "client_satisfaction": 90.0,
        "primary_skill": "Machine Learning",
        "country": "Canada",
    },
]


# ─── PERFORMANCE Mock Profiles ─────────────────────────────────────────

PERFORMANCE_MOCKS = [
    {
        "name": "Low performer (should be Beginner)",
        "Job_Completed": 5,
        "Earnings_USD": 200,
        "Hourly_Rate": 8.0,
        "Job_Success_Rate": 55.0,
        "Client_Rating": 3.1,
        "Job_Duration_Days": 60,
        "Rehire_Rate": 12.0,
        "Job_Category": "Data Entry",
        "Project_Type": "Fixed",
        "Client_Region": "Asia",
    },
    {
        "name": "Average performer (should be Intermediate)",
        "Job_Completed": 50,
        "Earnings_USD": 5000,
        "Hourly_Rate": 40.0,
        "Job_Success_Rate": 78.0,
        "Client_Rating": 4.0,
        "Job_Duration_Days": 30,
        "Rehire_Rate": 45.0,
        "Job_Category": "Web Development",
        "Project_Type": "Hourly",
        "Client_Region": "Europe",
    },
    {
        "name": "Top performer (should be Expert)",
        "Job_Completed": 200,
        "Earnings_USD": 9500,
        "Hourly_Rate": 90.0,
        "Job_Success_Rate": 97.0,
        "Client_Rating": 4.9,
        "Job_Duration_Days": 20,
        "Rehire_Rate": 75.0,
        "Job_Category": "App Development",
        "Project_Type": "Hourly",
        "Client_Region": "USA",
    },
    {
        "name": "Mediocre SEO freelancer",
        "Job_Completed": 30,
        "Earnings_USD": 1500,
        "Hourly_Rate": 20.0,
        "Job_Success_Rate": 65.0,
        "Client_Rating": 3.5,
        "Job_Duration_Days": 45,
        "Rehire_Rate": 25.0,
        "Job_Category": "SEO",
        "Project_Type": "Fixed",
        "Client_Region": "Middle East",
    },
    {
        "name": "Elite content writer",
        "Job_Completed": 180,
        "Earnings_USD": 8000,
        "Hourly_Rate": 75.0,
        "Job_Success_Rate": 95.0,
        "Client_Rating": 4.8,
        "Job_Duration_Days": 10,
        "Rehire_Rate": 70.0,
        "Job_Category": "Content Writing",
        "Project_Type": "Hourly",
        "Client_Region": "UK",
    },
]


def build_cold_start_vector(profile, feature_columns, scaler):
    """Build a feature vector for cold-start model from a profile dict."""
    row = {}
    # Numeric features
    for col in ['years_of_experience', 'hourly_rate_usd', 'rating', 'client_satisfaction']:
        row[col] = profile.get(col, 0.0)

    # One-hot: primary_skill
    for col in feature_columns:
        if col.startswith('primary_skill_'):
            skill_name = col.replace('primary_skill_', '')
            row[col] = 1.0 if profile.get('primary_skill') == skill_name else 0.0
        elif col.startswith('country_'):
            country_name = col.replace('country_', '')
            row[col] = 1.0 if profile.get('country') == country_name else 0.0

    # Build DataFrame in correct column order
    df = pd.DataFrame([row])[feature_columns]

    # Scale numeric features
    numeric_cols = ['years_of_experience', 'hourly_rate_usd', 'rating', 'client_satisfaction']
    existing_numeric = [c for c in numeric_cols if c in df.columns]
    df[existing_numeric] = scaler.transform(df[existing_numeric])

    return df


def build_performance_vector(profile, feature_columns, scaler):
    """Build a feature vector for performance model from a profile dict."""
    row = {}
    # Numeric features
    numeric_cols = ['Job_Completed', 'Earnings_USD', 'Hourly_Rate',
                    'Job_Success_Rate', 'Client_Rating', 'Job_Duration_Days', 'Rehire_Rate']
    for col in numeric_cols:
        row[col] = profile.get(col, 0.0)

    # One-hot: Job_Category, Project_Type, Client_Region
    for col in feature_columns:
        if col.startswith('Job_Category_'):
            cat = col.replace('Job_Category_', '')
            row[col] = 1.0 if profile.get('Job_Category') == cat else 0.0
        elif col.startswith('Project_Type_'):
            pt = col.replace('Project_Type_', '')
            row[col] = 1.0 if profile.get('Project_Type') == pt else 0.0
        elif col.startswith('Client_Region_'):
            cr = col.replace('Client_Region_', '')
            row[col] = 1.0 if profile.get('Client_Region') == cr else 0.0

    df = pd.DataFrame([row])[feature_columns]
    existing_numeric = [c for c in numeric_cols if c in df.columns]
    df[existing_numeric] = scaler.transform(df[existing_numeric])

    return df


def test_model(tag, mocks, build_fn):
    """Test a model against mock profiles."""
    print(f"\n{'='*70}")
    print(f"  TESTING: {tag.upper()} MODEL")
    print(f"{'='*70}")

    model, scaler, le, features = load_model(tag)
    classes = le.classes_

    print(f"  Classes: {list(classes)}")
    print(f"  Features: {len(features)}")
    print()

    results = []

    for i, mock in enumerate(mocks):
        name = mock.pop('name')
        X = build_fn(mock, features, scaler)

        # Predict class
        pred_idx = model.predict(X)[0]
        pred_label = le.inverse_transform([pred_idx])[0]

        # Predict probabilities
        probs = model.predict_proba(X)[0]
        prob_dict = {cls: round(float(p), 4) for cls, p in zip(classes, probs)}
        confidence = round(float(max(probs)) * 100, 1)

        # Capability score (weighted avg)
        score_map = {'Beginner': 20, 'Intermediate': 55, 'Expert': 88}
        capability_score = round(sum(score_map.get(c, 50) * p for c, p in zip(classes, probs)), 1)

        results.append({
            'name': name,
            'prediction': pred_label,
            'confidence': confidence,
            'capability_score': capability_score,
            'probabilities': prob_dict,
        })

        # Print results
        status = '✅' if confidence > 60 else '⚠️'
        print(f"  {status} [{i+1}] {name}")
        print(f"       Prediction:  {pred_label} ({confidence}% confidence)")
        print(f"       Score:       {capability_score}/100")
        print(f"       Probabilities: ", end='')
        for cls, p in prob_dict.items():
            bar = '█' * int(p * 20)
            print(f"{cls}={p:.2%} {bar}  ", end='')
        print('\n')

        mock['name'] = name  # restore

    return results


def main():
    print("\n" + "🧪" * 25)
    print("  DeTrust — Model Validation with Mock Data")
    print("🧪" * 25)

    # Test Cold-Start
    cold_results = test_model('cold_start', COLD_START_MOCKS, build_cold_start_vector)

    # Test Performance
    perf_results = test_model('performance', PERFORMANCE_MOCKS, build_performance_vector)

    # Summary
    print(f"\n{'='*70}")
    print(f"  SUMMARY")
    print(f"{'='*70}")

    print(f"\n  Cold-Start Model ({len(cold_results)} profiles tested):")
    for r in cold_results:
        print(f"    {r['prediction']:15s} ({r['confidence']:5.1f}%)  →  {r['name']}")

    print(f"\n  Performance Model ({len(perf_results)} profiles tested):")
    for r in perf_results:
        print(f"    {r['prediction']:15s} ({r['confidence']:5.1f}%)  →  {r['name']}")

    # Sanity checks
    print(f"\n  Sanity Checks:")
    checks_passed = 0
    total_checks = 0

    # Cold-start: fresh grad should be Beginner
    total_checks += 1
    if cold_results[0]['prediction'] == 'Beginner':
        print(f"    ✅ Fresh graduate → Beginner")
        checks_passed += 1
    else:
        print(f"    ❌ Fresh graduate → {cold_results[0]['prediction']} (expected Beginner)")

    # Cold-start: senior expert should be Expert
    total_checks += 1
    if cold_results[2]['prediction'] == 'Expert':
        print(f"    ✅ Senior blockchain dev → Expert")
        checks_passed += 1
    else:
        print(f"    ❌ Senior blockchain dev → {cold_results[2]['prediction']} (expected Expert)")

    # Performance: low performer should be Beginner
    total_checks += 1
    if perf_results[0]['prediction'] == 'Beginner':
        print(f"    ✅ Low performer → Beginner")
        checks_passed += 1
    else:
        print(f"    ❌ Low performer → {perf_results[0]['prediction']} (expected Beginner)")

    # Performance: top performer should be Expert
    total_checks += 1
    if perf_results[2]['prediction'] == 'Expert':
        print(f"    ✅ Top performer → Expert")
        checks_passed += 1
    else:
        print(f"    ❌ Top performer → {perf_results[2]['prediction']} (expected Expert)")

    # Performance: elite writer should be Expert
    total_checks += 1
    if perf_results[4]['prediction'] == 'Expert':
        print(f"    ✅ Elite writer → Expert")
        checks_passed += 1
    else:
        print(f"    ❌ Elite writer → {perf_results[4]['prediction']} (expected Expert)")

    # Scores should increase: beginner < intermediate < expert
    total_checks += 1
    cs = [r['capability_score'] for r in cold_results]
    if cs[0] < cs[1] < cs[2]:
        print(f"    ✅ Cold-start scores increase: {cs[0]} < {cs[1]} < {cs[2]}")
        checks_passed += 1
    else:
        print(f"    ❌ Cold-start scores NOT ordered: {cs[0]}, {cs[1]}, {cs[2]}")

    total_checks += 1
    ps = [r['capability_score'] for r in perf_results]
    if ps[0] < ps[1] < ps[2]:
        print(f"    ✅ Performance scores increase: {ps[0]} < {ps[1]} < {ps[2]}")
        checks_passed += 1
    else:
        print(f"    ❌ Performance scores NOT ordered: {ps[0]}, {ps[1]}, {ps[2]}")

    print(f"\n  Result: {checks_passed}/{total_checks} sanity checks passed")
    if checks_passed == total_checks:
        print("  🏆 ALL CHECKS PASSED — Both models are working correctly!")
    else:
        print(f"  ⚠️  {total_checks - checks_passed} check(s) failed — review needed")

    print()


if __name__ == '__main__':
    main()
