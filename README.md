Student Performance Analyzer – Web Application

🔹 Overview
The Student Performance Analyzer is a web-based application designed to analyze student academic data and generate meaningful insights. Educational institutions often store marks digitally but lack tools to identify high-performing and at-risk students. This system converts raw academic data into actionable insights using rule-based analysis.

🔹 Problem Statement
Student marks and attendance records are stored digitally but are not effectively analyzed. There is a need for a system that can:

Identify top-performing students
Detect students at academic risk
Analyze subject-wise performance

This project addresses the problem by providing a simple, efficient, and transparent performance analysis system.

🔹 Solution Approach

The application uses a rule-based analysis approach to ensure clarity and explainability. Instead of using machine learning, predefined thresholds and logical conditions are applied to evaluate student performance.

The system:
Accepts student data via CSV upload
Computes average marks
Classifies students based on performance rules
Displays results through a web interface

🔹 Tech Stack

Backend: Python, Flask
Data Processing: Pandas
Frontend: HTML, CSS
Data Format: CSV

🔹 Application Workflow

User opens the web application
Uploads a CSV file containing student data
Clicks the “Analyze” button
System processes the data
Performance insights are displayed on the screen

🔹 Dataset Format

The uploaded CSV file must contain the following columns:

student_id
name
maths
science
english
attendance

All marks and attendance values must be numeric.

🔹 Analysis Logic
1. Average Marks Calculation
Average = (Maths + Science + English) / 3
2. Top Performer Criteria
Average Marks ≥ 75
Attendance ≥ 80%

3. At-Risk Student Criteria
Average Marks < 40
OR
Attendance < 70%

4. Subject-Wise Performance

Mean score for each subject is calculated

🔹 Key Features
CSV file upload support
Automated performance classification
Identification of at-risk students
Subject-wise performance analysis
Error handling for invalid data
Simple and clean user interface

🔹 How to Run the Application

Install required dependencies:
pip install -r requirements.txt
Run the Flask application:
python app.py
Open the browser and navigate to:
http://127.0.0.1:5000

Upload a valid CSV file and click Analyze.

🔹 Testing

The application was tested using the following scenarios:
High-performing students
Low marks scenarios
Low attendance scenarios
Balanced performance cases
Invalid and non-numeric input data

🔹 Project Structure
student-performance-analyzer/
│
├── app.py
├── requirements.txt
│
├── templates/
│   └── index.html
│
├── static/
│   └── style.css
│
├── data/
│   └── sample_students.csv
│
├── tests/
│   └── test_cases.txt
│
├── screenshots/
│   └── results.png
│
└── README.md
🔹 Future Enhancements

Graphical visualization of performance data
Downloadable performance reports (PDF)
Subject-wise risk detection
User authentication system

🔹 Conclusion

The Student Performance Analyzer demonstrates how structured data analysis can support academic decision-making. By transforming raw student records into clear insights, the system helps institutions identify strengths and address performance gaps effectively.

