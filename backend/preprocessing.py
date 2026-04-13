from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Tuple

import matplotlib.pyplot as plt
import pandas as pd
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
from statsmodels.tsa.seasonal import STL
from statsmodels.tsa.stattools import adfuller


@dataclass
class PreprocessArtifacts:
    churn_ts: pd.Series
    diff_ts: pd.Series
    stl: STL
    adf_raw: Dict[str, object]
    adf_diff: Dict[str, object]
    d: int


def _adf_dict(series: pd.Series) -> Dict[str, object]:
    result = adfuller(series)
    return {
        "adf_statistic": float(result[0]),
        "p_value": float(result[1]),
        "critical_values": {k: float(v) for k, v in result[4].items()},
    }


def load_and_prepare(data_csv: Path, output_data_dir: Path, plots_dir: Path) -> PreprocessArtifacts:
    output_data_dir.mkdir(parents=True, exist_ok=True)
    plots_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(data_csv)
    print("Shape:", df.shape)
    print("Dtypes:\n", df.dtypes)
    print("Head:\n", df.head())
    print("Nulls:\n", df.isnull().sum())

    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
    df["Churn"] = df["Churn"].map({"Yes": 1, "No": 0})
    df.dropna(subset=["TotalCharges"], inplace=True)

    churn_ts = df.groupby("tenure").apply(lambda x: x["Churn"].sum() / len(x))
    churn_ts = churn_ts.sort_index()
    churn_ts.index = pd.RangeIndex(start=0, stop=len(churn_ts))
    churn_ts.name = "churn_rate"
    churn_ts.to_csv(output_data_dir / "churn_ts.csv", header=True)

    plt.figure(figsize=(11, 5))
    plt.plot(churn_ts.index, churn_ts.values, label="Raw churn rate", color="#63b3ed")
    trend = churn_ts.rolling(window=6, min_periods=1).mean()
    plt.plot(churn_ts.index, trend.values, label="Trend line (rolling mean)", color="#f6ad55")
    plt.title("Raw Monthly Churn Rate by Tenure")
    plt.xlabel("Tenure month index")
    plt.ylabel("Churn rate")
    plt.grid(alpha=0.3)
    plt.legend()
    plt.tight_layout()
    plt.savefig(plots_dir / "raw_churn_ts.png", dpi=140)
    plt.close()

    stl_result = STL(churn_ts, period=12).fit()
    fig = stl_result.plot()
    fig.set_size_inches(10, 7)
    fig.tight_layout()
    fig.savefig(plots_dir / "decomposition.png", dpi=140)
    plt.close(fig)

    adf_raw = _adf_dict(churn_ts)
    d = 1 if adf_raw["p_value"] > 0.05 else 0
    diff_ts = churn_ts.diff().dropna() if d == 1 else churn_ts.copy()
    adf_diff = _adf_dict(diff_ts)

    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    axes[0].plot(churn_ts.index, churn_ts.values, color="#63b3ed")
    axes[0].set_title("Original Series")
    axes[0].grid(alpha=0.3)
    axes[1].plot(diff_ts.index, diff_ts.values, color="#f56565")
    axes[1].set_title("Differenced Series" if d == 1 else "Stationary Series")
    axes[1].grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(plots_dir / "adf_differenced.png", dpi=140)
    plt.close(fig)

    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    plot_acf(diff_ts, lags=20, ax=axes[0])
    plot_pacf(diff_ts, lags=20, ax=axes[1], method="ywm")
    axes[0].set_title("ACF")
    axes[1].set_title("PACF")
    fig.tight_layout()
    fig.savefig(plots_dir / "acf_pacf.png", dpi=140)
    plt.close(fig)

    return PreprocessArtifacts(
        churn_ts=churn_ts,
        diff_ts=diff_ts,
        stl=stl_result,
        adf_raw=adf_raw,
        adf_diff=adf_diff,
        d=d,
    )
