from __future__ import annotations

from pathlib import Path

from backend.model import train_and_export
from backend.preprocessing import load_and_prepare


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    data_dir = root / "data"
    plots_dir = root / "plots"
    source_csv = data_dir / "WA_Fn-UseC_-Telco-Customer-Churn.csv"

    artifacts = load_and_prepare(source_csv, data_dir, plots_dir)
    output = train_and_export(artifacts, data_dir, plots_dir)
    print("Pipeline completed.")
    print("ARIMA order:", output["order"])
    print("SARIMA seasonal order:", output["seasonal_order"])


if __name__ == "__main__":
    main()
