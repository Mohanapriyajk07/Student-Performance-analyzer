import os
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

REQUIRED_COLUMNS = [
    "Student ID",
    "Student Name",
    "Math",
    "Science",
    "English",
    "History",
    "Geography",
    "Attendance %",
]

SUBJECT_COLUMNS = ["Math", "Science", "English", "History", "Geography"]

AT_RISK_MARKS_THRESHOLD = 40   
AT_RISK_ATTENDANCE_THRESHOLD = 75 
TOP_MARKS_THRESHOLD = 85        
TOP_ATTENDANCE_THRESHOLD = 90   


def validate_csv(df: pd.DataFrame) -> list[str]:
    errors: list[str] = []

    if df.empty:
        errors.append("The uploaded CSV file is empty.")
        return errors

    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        errors.append(f"Missing required columns: {', '.join(missing)}")
        return errors

    for col in SUBJECT_COLUMNS + ["Attendance %"]:
        if not pd.api.types.is_numeric_dtype(df[col]):
            errors.append(f"Column '{col}' contains non-numeric values.")

    return errors


def compute_student_averages(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["Average Marks"] = df[SUBJECT_COLUMNS].mean(axis=1).round(2)
    return df


def identify_at_risk(df: pd.DataFrame) -> pd.DataFrame:
    return df[
        (df["Average Marks"] < AT_RISK_MARKS_THRESHOLD)
        | (df["Attendance %"] < AT_RISK_ATTENDANCE_THRESHOLD)
    ].copy()


def identify_top_performers(df: pd.DataFrame) -> pd.DataFrame:
    return df[
        (df["Average Marks"] >= TOP_MARKS_THRESHOLD)
        & (df["Attendance %"] >= TOP_ATTENDANCE_THRESHOLD)
    ].copy()


def subject_averages(df: pd.DataFrame) -> dict:
    return {col: round(df[col].mean(), 2) for col in SUBJECT_COLUMNS}


def build_grade(avg: float) -> str:
    if avg >= 90:
        return "A+"
    if avg >= 80:
        return "A"
    if avg >= 70:
        return "B"
    if avg >= 60:
        return "C"
    if avg >= 50:
        return "D"
    if avg >= 40:
        return "E"
    return "F"


def build_student_summary(df: pd.DataFrame) -> list[dict]:
    summaries = []
    for _, row in df.iterrows():
        avg = row["Average Marks"]
        summaries.append({
            "id": int(row["Student ID"]),
            "name": row["Student Name"],
            "math": float(row["Math"]),
            "science": float(row["Science"]),
            "english": float(row["English"]),
            "history": float(row["History"]),
            "geography": float(row["Geography"]),
            "attendance": float(row["Attendance %"]),
            "average": float(avg),
            "grade": build_grade(avg),
        })
    return summaries

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/analyze", methods=["POST"])
def analyze():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded. Please select a CSV file."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected."}), 400

    if not file.filename.lower().endswith(".csv"):
        return jsonify({"error": "Only CSV files are supported."}), 400
        
    filepath = os.path.join(UPLOAD_FOLDER, "uploaded.csv")
    file.save(filepath)

    try:
        df = pd.read_csv(filepath)
    except Exception as exc:
        return jsonify({"error": f"Failed to read CSV: {exc}"}), 400

    errors = validate_csv(df)
    if errors:
        return jsonify({"error": " | ".join(errors)}), 400

    df = compute_student_averages(df)
    at_risk_df = identify_at_risk(df)
    top_df = identify_top_performers(df)
    subj_avgs = subject_averages(df)

    class_avg = round(df["Average Marks"].mean(), 2)
    highest_avg_student = df.loc[df["Average Marks"].idxmax()]
    lowest_avg_student = df.loc[df["Average Marks"].idxmin()]

    response = {
        "totalStudents": len(df),
        "classAverage": class_avg,
        "highestAverage": {
            "name": highest_avg_student["Student Name"],
            "average": float(highest_avg_student["Average Marks"]),
        },
        "lowestAverage": {
            "name": lowest_avg_student["Student Name"],
            "average": float(lowest_avg_student["Average Marks"]),
        },
        "subjectAverages": subj_avgs,
        "topPerformers": build_student_summary(top_df),
        "atRiskStudents": build_student_summary(at_risk_df),
        "allStudents": build_student_summary(df.sort_values("Average Marks", ascending=False)),
    }

    return jsonify(response)

if __name__ == "__main__":
    app.run(debug=True, port=5000)

