from __future__ import annotations

import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
import pandas as pd

from backend.customer_classifier import load_or_train, transform_single
from backend.model import train_customer_churn_classifier

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
PLOTS_DIR = ROOT / "plots"

app = FastAPI(title="ChurnSight API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/plots", StaticFiles(directory=str(PLOTS_DIR)), name="plots")
DATASET_CSV = DATA_DIR / "WA_Fn-UseC_-Telco-Customer-Churn.csv"
CUSTOMER_MODEL, CUSTOMER_FEATURES = train_customer_churn_classifier(DATASET_CSV)
MODELS_DIR = ROOT / "models"
IND_MODEL, IND_ENCODER, IND_THRESHOLD = load_or_train(DATASET_CSV, MODELS_DIR)


class CustomerPayload(BaseModel):
    customerID: str
    gender: str
    SeniorCitizen: int
    Partner: str
    Dependents: str
    tenure: int
    PhoneService: str
    MultipleLines: str
    InternetService: str
    OnlineSecurity: str
    OnlineBackup: str
    DeviceProtection: str
    TechSupport: str
    StreamingTV: str
    StreamingMovies: str
    Contract: str
    PaperlessBilling: str
    PaymentMethod: str
    MonthlyCharges: float
    TotalCharges: float


class PredictPayload(BaseModel):
    tenure: int
    MonthlyCharges: float
    TotalCharges: float
    SeniorCitizen: int
    Partner: str
    Dependents: str
    Contract: str
    InternetService: str
    OnlineSecurity: str
    OnlineBackup: str
    DeviceProtection: str
    TechSupport: str
    PaperlessBilling: str
    PaymentMethod: str


def _read_json(name: str):
    path = DATA_DIR / name
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"{name} not found. Run backend/run_pipeline.py first.")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@app.get("/metrics")
def metrics():
    return _read_json("metrics.json")


@app.get("/forecast")
def forecast():
    return _read_json("forecast.json")


@app.get("/trend")
def trend():
    return _read_json("trend.json")


@app.get("/decomposition")
def decomposition():
    return _read_json("decomposition.json")


@app.get("/timeseries")
def timeseries():
    return _read_json("timeseries.json")


@app.get("/equations")
def equations():
    return _read_json("equations.json")


@app.get("/prediction-errors")
def prediction_errors():
    return _read_json("prediction_errors.json")


@app.post("/predict-churn")
def predict_churn(payload: CustomerPayload):
    row = payload.model_dump()
    row_data = {k: row[k] for k in CUSTOMER_FEATURES}
    input_df = pd.DataFrame([row_data])
    churn_prob = float(CUSTOMER_MODEL.predict_proba(input_df)[0, 1])
    pred = int(churn_prob >= 0.5)
    return {
        "customerID": payload.customerID,
        "churn_probability": churn_prob,
        "prediction": "Yes" if pred == 1 else "No",
        "label": "Churn" if pred == 1 else "Not Churn",
        "threshold": 0.5,
    }


@app.post("/predict")
def predict(payload: PredictPayload):
    row = transform_single(payload.model_dump(), IND_ENCODER)
    prob = float(IND_MODEL.predict_proba(row)[0, 1])
    churn = "Yes" if prob >= IND_THRESHOLD else "No"
    if prob >= 0.70:
        risk = "High"
    elif prob >= 0.40:
        risk = "Medium"
    else:
        risk = "Low"
    monthly = float(payload.MonthlyCharges)
    return {
        "churn": churn,
        "probability": prob,
        "risk_level": risk,
        "monthly_charges": monthly,
        "mrr_at_risk": monthly if churn == "Yes" else 0.0,
    }


@app.get("/health")
def health():
    return {"status": "ok"}
