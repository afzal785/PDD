import os
import pandas as pd
import random
from datetime import datetime, timedelta

def generate_test_report():
    input_path = os.path.join(r"c:\Users\AMohamed afzal\Downloads\healthtrack", "HealthTrack_Master_Test_Cases.xlsx")
    output_path = os.path.join(r"c:\Users\AMohamed afzal\Downloads\healthtrack", "HealthTrack_Test_Execution_Report.xlsx")
    
    if not os.path.exists(input_path):
        print(f"Error: Could not find {input_path}")
        return

    # Load the test cases
    df = pd.read_excel(input_path, sheet_name="All Test Cases")
    
    testers = ["Alice Smith", "Bob Jones", "Charlie Davis", "Diana Prince"]
    
    statuses = []
    actual_results = []
    execution_dates = []
    tester_names = []
    bug_ids = []

    base_date = datetime.now() - timedelta(days=5)

    # Generate mock execution data
    for index, row in df.iterrows():
        # 85% Pass, 10% Fail, 3% Blocked, 2% Pending
        rand = random.random()
        tester = random.choice(testers)
        exec_date = (base_date + timedelta(hours=random.randint(1, 100))).strftime("%Y-%m-%d %H:%M")
        
        if rand < 0.85:
            status = "Pass"
            actual = "As expected: " + str(row["Expected Result"])
            bug_id = ""
        elif rand < 0.95:
            status = "Fail"
            actual = "Failed: Did not match expected result."
            bug_id = f"BUG-{random.randint(1000, 9999)}"
        elif rand < 0.98:
            status = "Blocked"
            actual = "Blocked due to dependency."
            bug_id = ""
        else:
            status = "Pending"
            actual = ""
            tester = ""
            exec_date = ""
            bug_id = ""

        statuses.append(status)
        actual_results.append(actual)
        execution_dates.append(exec_date)
        tester_names.append(tester)
        bug_ids.append(bug_id)

    # Update dataframe
    df["Status"] = statuses
    df["Actual Result"] = actual_results
    df["Tester Name"] = tester_names
    df["Execution Date"] = execution_dates
    df["Bug ID"] = bug_ids

    # Create a summary dataframe
    summary_data = {
        "Metric": ["Total Test Cases", "Passed", "Failed", "Blocked", "Pending", "Pass Rate"],
        "Value": [
            len(df),
            statuses.count("Pass"),
            statuses.count("Fail"),
            statuses.count("Blocked"),
            statuses.count("Pending"),
            f"{(statuses.count('Pass') / len(df) * 100):.1f}%"
        ]
    }
    summary_df = pd.DataFrame(summary_data)

    # Write to Excel with multiple sheets
    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        summary_df.to_excel(writer, sheet_name="Execution Summary", index=False)
        df.to_excel(writer, sheet_name="Test Execution Details", index=False)
        
        # Formatting Summary
        worksheet = writer.sheets["Execution Summary"]
        worksheet.column_dimensions['A'].width = 20
        worksheet.column_dimensions['B'].width = 15
        
        # Formatting Details
        worksheet = writer.sheets["Test Execution Details"]
        worksheet.column_dimensions['A'].width = 15 # ID
        worksheet.column_dimensions['B'].width = 15 # Category
        worksheet.column_dimensions['C'].width = 30 # Name
        worksheet.column_dimensions['D'].width = 40 # Desc
        worksheet.column_dimensions['E'].width = 40 # Expected
        worksheet.column_dimensions['F'].width = 12 # Status
        worksheet.column_dimensions['G'].width = 40 # Actual
        worksheet.column_dimensions['H'].width = 20 # Tester
        worksheet.column_dimensions['I'].width = 20 # Date
        worksheet.column_dimensions['J'].width = 15 # Bug ID

    print(f"Generated test execution report at: {output_path}")

if __name__ == "__main__":
    generate_test_report()
