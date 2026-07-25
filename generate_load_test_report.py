# generate_load_test_report.py
"""Combine Locust CSV result files into a single Excel workbook.

The script reads the three CSV files produced by Locust when run with the
`--csv results` flag:
  - results_stats.csv
  - results_failures.csv
  - results_exceptions.csv

It writes them to `load_test_report.xlsx` with separate worksheets:
  * Stats
  * Failures
  * Exceptions

Run with:
    python generate_load_test_report.py
"""

import os
import pandas as pd

# Directory containing the CSV files (project root)
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

csv_files = {
    "Stats": os.path.join(BASE_DIR, "results_stats.csv"),
    "Failures": os.path.join(BASE_DIR, "results_failures.csv"),
    "Exceptions": os.path.join(BASE_DIR, "results_exceptions.csv"),
}

# Create an Excel writer using openpyxl engine
excel_path = os.path.join(BASE_DIR, "load_test_report.xlsx")
with pd.ExcelWriter(excel_path, engine="openpyxl") as writer:
    for sheet_name, path in csv_files.items():
        if os.path.exists(path):
            df = pd.read_csv(path)
            df.to_excel(writer, sheet_name=sheet_name, index=False)
        else:
            # Write a note if the CSV is missing
            pd.DataFrame({"Message": [f"{os.path.basename(path)} not found"]}).to_excel(writer, sheet_name=sheet_name, index=False)

print(f"Excel report written to {excel_path}")

