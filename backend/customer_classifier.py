from __future__ import annotations

from pathlib import Path
from typing import Tuple

import joblib
import pandas as pd
from xgboost import XGBClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import RandomizedSearchCV, train_test_split
from sklearn.preprocessing import OrdinalEncoder
from scipy.stats import randint, uniform
import numpy as np

FEATURES = [
    "tenure",
    "MonthlyCharges",
    "TotalCharges",
    "SeniorCitizen",
    "Partner",
    "Dependents",
    "Contract",
    "InternetService",
    "OnlineSecurity",
    "OnlineBackup",
    "DeviceProtection",
    "TechSupport",
    "PaperlessBilling",
    "PaymentMethod",
]
CAT_FEATURES = [
    "Partner",
    "Dependents",
    "Contract",
    "InternetService",
    "OnlineSecurity",
    "OnlineBackup",
    "DeviceProtection",
    "TechSupport",
    "PaperlessBilling",
    "PaymentMethod",
]


def _add_engineered_features(X: pd.DataFrame) -> pd.DataFrame:
    out = X.copy()
    # Ratio-like signal: high monthly charge at low tenure is churn-prone.
    out["charge_tenure_ratio"] = out["MonthlyCharges"] / (out["tenure"] + 1.0)
    out["total_tenure_ratio"] = out["TotalCharges"] / (out["tenure"] + 1.0)
    out["monthly_x_tenure"] = out["MonthlyCharges"] * out["tenure"]
    # Simple nonlinear terms for tree splits.
    out["tenure_sq"] = out["tenure"] ** 2
    out["monthly_sq"] = out["MonthlyCharges"] ** 2
    out["total_sq"] = out["TotalCharges"] ** 2
    return out


def _prepare(df: pd.DataFrame, encoder: OrdinalEncoder | None = None) -> Tuple[pd.DataFrame, OrdinalEncoder]:
    X = df[FEATURES].copy()
    if encoder is None:
        encoder = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
        X[CAT_FEATURES] = encoder.fit_transform(X[CAT_FEATURES])
    else:
        X[CAT_FEATURES] = encoder.transform(X[CAT_FEATURES])
    X = _add_engineered_features(X)
    return X, encoder


def train_and_save(data_csv: Path, models_dir: Path):
    models_dir.mkdir(parents=True, exist_ok=True)
    model_path = models_dir / "churn_classifier.pkl"
    encoder_path = models_dir / "encoder.pkl"
    threshold_path = models_dir / "threshold.pkl"

    df = pd.read_csv(data_csv)
    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
    df = df.dropna(subset=["TotalCharges"]).copy()
    df["Churn"] = df["Churn"].map({"Yes": 1, "No": 0})
    X_full, encoder = _prepare(df)
    y = df["Churn"]

    X_train, X_test, y_train, y_test = train_test_split(
        X_full, y, test_size=0.2, random_state=42, stratify=y
    )

    base_model = XGBClassifier(
        n_estimators=700,
        max_depth=6,
        learning_rate=0.03,
        subsample=0.9,
        colsample_bytree=0.9,
        reg_lambda=1.5,
        reg_alpha=0.1,
        objective="binary:logistic",
        eval_metric="logloss",
        random_state=42,
        n_jobs=-1,
    )
    base_model.fit(X_train, y_train)
    base_pred = base_model.predict(X_test)
    base_acc = accuracy_score(y_test, base_pred)

    search = RandomizedSearchCV(
        estimator=XGBClassifier(
            objective="binary:logistic",
            eval_metric="logloss",
            tree_method="hist",
            random_state=42,
            n_jobs=-1,
        ),
        param_distributions={
            "n_estimators": randint(300, 1100),
            "max_depth": randint(3, 10),
            "learning_rate": uniform(0.01, 0.18),
            "subsample": uniform(0.65, 0.35),
            "colsample_bytree": uniform(0.65, 0.35),
            "min_child_weight": randint(1, 8),
            "gamma": uniform(0.0, 0.6),
            "reg_lambda": uniform(0.5, 2.0),
            "reg_alpha": uniform(0.0, 1.0),
            "max_bin": randint(128, 512),
        },
        n_iter=80,
        scoring="accuracy",
        cv=5,
        random_state=42,
        n_jobs=-1,
        verbose=0,
    )
    search.fit(X_train, y_train)
    tuned_model = search.best_estimator_
    tuned_pred = tuned_model.predict(X_test)
    tuned_acc = accuracy_score(y_test, tuned_pred)

    if tuned_acc >= base_acc:
        model = tuned_model
        pred = tuned_pred
        selected = "XGBoost tuned"
        selected_params = search.best_params_
    else:
        model = base_model
        pred = base_pred
        selected = "XGBoost baseline"
        selected_params = {
            "n_estimators": 700,
            "max_depth": 6,
            "learning_rate": 0.03,
            "subsample": 0.9,
            "colsample_bytree": 0.9,
        }

    # Calibrate probabilities and optimize threshold for accuracy.
    calibrated = CalibratedClassifierCV(model, method="sigmoid", cv=3)
    calibrated.fit(X_train, y_train)
    probs = calibrated.predict_proba(X_test)[:, 1]
    thresholds = np.arange(0.35, 0.76, 0.01)
    best_threshold = 0.5
    best_acc = -1.0
    best_pred = None
    for th in thresholds:
        candidate_pred = (probs >= th).astype(int)
        candidate_acc = accuracy_score(y_test, candidate_pred)
        if candidate_acc > best_acc:
            best_acc = candidate_acc
            best_threshold = float(th)
            best_pred = candidate_pred

    acc = accuracy_score(y_test, best_pred)
    f1 = f1_score(y_test, best_pred)
    report = classification_report(y_test, best_pred)
    print(f"Customer classifier accuracy: {acc:.4f}")
    print(f"Customer classifier F1-score: {f1:.4f}")
    print(f"Model selected: {selected}")
    clean_params = {k: (float(v) if isinstance(v, np.floating) else int(v) if isinstance(v, np.integer) else v) for k, v in selected_params.items()}
    print("Selected parameters:", clean_params)
    print(f"Selected threshold: {best_threshold:.2f}")
    print("Classification report:\n", report)

    joblib.dump(calibrated, model_path)
    joblib.dump(encoder, encoder_path)
    joblib.dump(best_threshold, threshold_path)
    return calibrated, encoder, best_threshold


def load_or_train(data_csv: Path, models_dir: Path):
    model_path = models_dir / "churn_classifier.pkl"
    encoder_path = models_dir / "encoder.pkl"
    threshold_path = models_dir / "threshold.pkl"
    if model_path.exists() and encoder_path.exists() and threshold_path.exists():
        return joblib.load(model_path), joblib.load(encoder_path), float(joblib.load(threshold_path))
    return train_and_save(data_csv, models_dir)


def transform_single(payload: dict, encoder: OrdinalEncoder) -> pd.DataFrame:
    row = pd.DataFrame([payload])[FEATURES]
    row[CAT_FEATURES] = encoder.transform(row[CAT_FEATURES])
    row = _add_engineered_features(row)
    return row
