from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, Tuple

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from pmdarima import auto_arima
from scipy import stats
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error, mean_squared_error
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from statsmodels.tsa.statespace.sarimax import SARIMAX

from backend.preprocessing import PreprocessArtifacts


def _train_test_split(churn_ts: pd.Series, ratio: float = 0.8) -> Tuple[pd.Series, pd.Series]:
    split_idx = int(len(churn_ts) * ratio)
    return churn_ts.iloc[:split_idx], churn_ts.iloc[split_idx:]


def _calc_metrics(y_true: pd.Series, y_pred: pd.Series, model) -> Dict[str, float]:
    return {
        "MAE": float(mean_absolute_error(y_true, y_pred)),
        "RMSE": float(np.sqrt(mean_squared_error(y_true, y_pred))),
        "MAPE": float(mean_absolute_percentage_error(y_true, y_pred) * 100),
        "AIC": float(model.aic),
        "BIC": float(model.bic),
    }


def train_and_export(artifacts: PreprocessArtifacts, data_dir: Path, plots_dir: Path) -> Dict[str, object]:
    data_dir.mkdir(parents=True, exist_ok=True)
    plots_dir.mkdir(parents=True, exist_ok=True)

    churn_ts = artifacts.churn_ts
    train, test = _train_test_split(churn_ts)

    auto_model = auto_arima(
        train,
        seasonal=True,
        m=12,
        stepwise=True,
        trace=False,
        information_criterion="aic",
        suppress_warnings=True,
        error_action="ignore",
        d=artifacts.d,
        D=None,
    )
    order = auto_model.order
    seasonal_order = auto_model.seasonal_order

    arima_model = SARIMAX(train, order=order, enforce_stationarity=False, enforce_invertibility=False).fit(disp=False)
    sarima_model = SARIMAX(
        train,
        order=order,
        seasonal_order=seasonal_order,
        enforce_stationarity=False,
        enforce_invertibility=False,
    ).fit(disp=False)

    arima_fc = arima_model.get_forecast(steps=len(test))
    sarima_fc = sarima_model.get_forecast(steps=len(test))
    arima_pred = arima_fc.predicted_mean
    sarima_pred = sarima_fc.predicted_mean
    conf_int = sarima_fc.conf_int()

    metrics = {
        "ARIMA": _calc_metrics(test, arima_pred, arima_model),
        "SARIMA": _calc_metrics(test, sarima_pred, sarima_model),
    }
    with open(data_dir / "metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    prediction_errors = []
    for i in range(len(test)):
        actual = float(test.iloc[i])
        pred = float(sarima_pred.iloc[i])
        prediction_errors.append(
            {
                "month_index": int(len(train) + i),
                "actual": actual,
                "predicted": pred,
                "residual": float(actual - pred),
                "abs_error": float(abs(actual - pred)),
            }
        )
    with open(data_dir / "prediction_errors.json", "w", encoding="utf-8") as f:
        json.dump(prediction_errors, f, indent=2)

    future_fc = sarima_model.get_forecast(steps=12)
    future_ci = future_fc.conf_int()
    forecast_df = pd.DataFrame(
        {
            "month_index": list(range(len(churn_ts), len(churn_ts) + 12)),
            "forecast": future_fc.predicted_mean.values,
            "lower": future_ci.iloc[:, 0].values,
            "upper": future_ci.iloc[:, 1].values,
        }
    )
    forecast_df.to_json(data_dir / "forecast.json", orient="records", indent=2)

    trend = artifacts.stl.trend
    t = np.arange(len(trend))
    m, b = np.polyfit(t, trend, 1)
    trend_payload = {
        "equation": f"Trend(t) = {m:.5f}t + {b:.5f}",
        "slope": float(m),
        "intercept": float(b),
        "trend_values": [float(x) for x in trend],
    }
    with open(data_dir / "trend.json", "w", encoding="utf-8") as f:
        json.dump(trend_payload, f, indent=2)

    decomposition = {
        "observed": [float(x) for x in artifacts.churn_ts.values],
        "trend": [float(x) for x in artifacts.stl.trend.values],
        "seasonal": [float(x) for x in artifacts.stl.seasonal.values],
        "residual": [float(x) for x in artifacts.stl.resid.values],
        "adf_raw": artifacts.adf_raw,
        "adf_differenced": artifacts.adf_diff,
    }
    with open(data_dir / "decomposition.json", "w", encoding="utf-8") as f:
        json.dump(decomposition, f, indent=2)

    with open(data_dir / "timeseries.json", "w", encoding="utf-8") as f:
        json.dump(
            [{"month_index": int(i), "churn_rate": float(v)} for i, v in enumerate(churn_ts.values)],
            f,
            indent=2,
        )

    equations = {
        "arima_definition": "ARIMA(p,d,q): phi(B)(1-B)^d y_t = c + theta(B)epsilon_t",
        "sarima_definition": "SARIMA(p,d,q)(P,D,Q)_s: Phi(B^s)phi(B)(1-B)^d(1-B^s)^D y_t = c + Theta(B^s)theta(B)epsilon_t",
        "selected_parameters": {
            "p": int(order[0]),
            "d": int(order[1]),
            "q": int(order[2]),
            "P": int(seasonal_order[0]),
            "D": int(seasonal_order[1]),
            "Q": int(seasonal_order[2]),
            "s": int(seasonal_order[3]),
        },
        "error_metric_formulas": {
            "MAE": "MAE = (1/n) * sum(|y_t - yhat_t|)",
            "RMSE": "RMSE = sqrt((1/n) * sum((y_t - yhat_t)^2))",
            "MAPE": "MAPE = (100/n) * sum(|(y_t - yhat_t)/y_t|)",
            "AIC": "AIC = 2k - 2ln(L)",
            "BIC": "BIC = k ln(n) - 2ln(L)",
        },
    }
    with open(data_dir / "equations.json", "w", encoding="utf-8") as f:
        json.dump(equations, f, indent=2)

    # actual_vs_predicted.png
    x_test = np.arange(len(train), len(train) + len(test))
    plt.figure(figsize=(11, 5))
    plt.plot(churn_ts.index, churn_ts.values, color="#a0aec0", label="Observed")
    plt.plot(x_test, sarima_pred.values, color="#63b3ed", label="SARIMA prediction")
    plt.fill_between(x_test, conf_int.iloc[:, 0], conf_int.iloc[:, 1], color="#63b3ed", alpha=0.2, label="95% CI")
    plt.title("Actual vs Predicted Churn Rate")
    plt.xlabel("Tenure month index")
    plt.ylabel("Churn rate")
    plt.grid(alpha=0.3)
    plt.legend()
    plt.tight_layout()
    plt.savefig(plots_dir / "actual_vs_predicted.png", dpi=140)
    plt.close()

    # forecast_12m.png
    x_future = forecast_df["month_index"].values
    plt.figure(figsize=(11, 5))
    plt.plot(churn_ts.index, churn_ts.values, color="#a0aec0", label="History")
    plt.plot(x_future, forecast_df["forecast"].values, color="#9f7aea", label="12m forecast")
    plt.fill_between(x_future, forecast_df["lower"], forecast_df["upper"], color="#9f7aea", alpha=0.2, label="95% CI")
    plt.title("12-Month Churn Forecast")
    plt.xlabel("Tenure month index")
    plt.ylabel("Churn rate")
    plt.grid(alpha=0.3)
    plt.legend()
    plt.tight_layout()
    plt.savefig(plots_dir / "forecast_12m.png", dpi=140)
    plt.close()

    # residuals.png
    resid = sarima_model.resid
    fig, axes = plt.subplots(2, 2, figsize=(12, 8))
    axes[0, 0].plot(resid, color="#63b3ed")
    axes[0, 0].set_title("Residuals")
    axes[0, 1].hist(resid, bins=20, color="#68d391")
    axes[0, 1].set_title("Residual Histogram")
    stats.probplot(resid, dist="norm", plot=axes[1, 0])
    axes[1, 0].set_title("Q-Q Plot")
    from statsmodels.graphics.tsaplots import plot_acf

    plot_acf(resid.dropna(), lags=20, ax=axes[1, 1])
    axes[1, 1].set_title("Residual Correlogram")
    fig.tight_layout()
    fig.savefig(plots_dir / "residuals.png", dpi=140)
    plt.close(fig)

    # model_comparison.png
    metric_names = ["MAE", "RMSE", "MAPE"]
    arima_vals = [metrics["ARIMA"][m] for m in metric_names]
    sarima_vals = [metrics["SARIMA"][m] for m in metric_names]
    x = np.arange(len(metric_names))
    width = 0.35
    plt.figure(figsize=(9, 5))
    plt.bar(x - width / 2, arima_vals, width, label="ARIMA")
    plt.bar(x + width / 2, sarima_vals, width, label="SARIMA")
    plt.xticks(x, metric_names)
    plt.title("ARIMA vs SARIMA Metrics")
    plt.grid(axis="y", alpha=0.3)
    plt.legend()
    plt.tight_layout()
    plt.savefig(plots_dir / "model_comparison.png", dpi=140)
    plt.close()

    return {
        "order": order,
        "seasonal_order": seasonal_order,
        "metrics": metrics,
    }


def train_customer_churn_classifier(data_csv: Path):
    df = pd.read_csv(data_csv)
    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
    df["Churn"] = df["Churn"].map({"Yes": 1, "No": 0})
    df = df.dropna(subset=["TotalCharges"]).copy()

    # Keep all user-requested fields except customerID and target for model fitting.
    feature_cols = [
        "gender",
        "SeniorCitizen",
        "Partner",
        "Dependents",
        "tenure",
        "PhoneService",
        "MultipleLines",
        "InternetService",
        "OnlineSecurity",
        "OnlineBackup",
        "DeviceProtection",
        "TechSupport",
        "StreamingTV",
        "StreamingMovies",
        "Contract",
        "PaperlessBilling",
        "PaymentMethod",
        "MonthlyCharges",
        "TotalCharges",
    ]
    X = df[feature_cols]
    y = df["Churn"]

    numeric_cols = ["SeniorCitizen", "tenure", "MonthlyCharges", "TotalCharges"]
    categorical_cols = [c for c in feature_cols if c not in numeric_cols]

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numeric_cols),
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_cols),
        ]
    )
    clf = Pipeline(
        steps=[
            ("prep", preprocessor),
            ("model", LogisticRegression(max_iter=400)),
        ]
    )
    clf.fit(X, y)
    return clf, feature_cols
