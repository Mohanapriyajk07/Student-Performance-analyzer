/**
 * Student Performance Analyzer — Frontend Logic
 * Handles CSV upload, API communication, and results rendering.
 */

(() => {
    "use strict";

    // ——— Configuration ———
    const API_URL = "http://127.0.0.1:5000/api/analyze";

    // ——— DOM References ———
    const uploadForm = document.getElementById("upload-form");
    const fileInput = document.getElementById("csv-file-input");
    const dropZone = document.getElementById("drop-zone");
    const fileInfo = document.getElementById("file-info");
    const fileNameSpan = document.getElementById("file-name");
    const clearFileBtn = document.getElementById("clear-file-btn");
    const analyzeBtn = document.getElementById("analyze-btn");
    const btnText = analyzeBtn.querySelector(".btn-text");
    const btnLoader = analyzeBtn.querySelector(".btn-loader");
    const errorMessage = document.getElementById("error-message");
    const resultsSection = document.getElementById("results-section");

    // ——— State ———
    let selectedFile = null;

    // ——— File selection helpers ———
    function setFile(file) {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith(".csv")) {
            showError("Please select a valid CSV file.");
            return;
        }
        selectedFile = file;
        fileNameSpan.textContent = file.name;
        fileInfo.classList.remove("hidden");
        dropZone.classList.add("hidden");
        analyzeBtn.disabled = false;
        hideError();
    }

    function clearFile() {
        selectedFile = null;
        fileInput.value = "";
        fileInfo.classList.add("hidden");
        dropZone.classList.remove("hidden");
        analyzeBtn.disabled = true;
    }

    // ——— Error handling ———
    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.classList.remove("hidden");
    }

    function hideError() {
        errorMessage.classList.add("hidden");
    }

    // ——— Events: File input / drag-drop ———
    fileInput.addEventListener("change", () => setFile(fileInput.files[0]));
    clearFileBtn.addEventListener("click", clearFile);

    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("drag-over");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("drag-over");
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("drag-over");
        if (e.dataTransfer.files.length) {
            setFile(e.dataTransfer.files[0]);
        }
    });

    // ——— Form submit ———
    uploadForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!selectedFile) return;

        // UI loading state
        analyzeBtn.disabled = true;
        btnText.classList.add("hidden");
        btnLoader.classList.remove("hidden");
        hideError();
        resultsSection.classList.add("hidden");

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                showError(data.error || "Something went wrong. Please try again.");
                return;
            }

            renderResults(data);
        } catch (err) {
            showError("Could not connect to the backend server. Make sure it is running on port 5000.");
            console.error(err);
        } finally {
            analyzeBtn.disabled = false;
            btnText.classList.remove("hidden");
            btnLoader.classList.add("hidden");
        }
    });

    // ======================================================================
    //  RENDER FUNCTIONS
    // ======================================================================

    function renderResults(data) {
        renderSummaryCards(data);
        renderSubjectBars(data.subjectAverages);
        renderStudentCards("top-performers-list", data.topPerformers, "no-top");
        renderStudentCards("at-risk-list", data.atRiskStudents, "no-risk");
        renderAllStudentsTable(data.allStudents);
        renderHighlights(data);
        resultsSection.classList.remove("hidden");
        resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // — Summary stat cards —
    function renderSummaryCards(data) {
        document.getElementById("stat-total").textContent = data.totalStudents;
        document.getElementById("stat-avg").textContent = data.classAverage + "%";
        document.getElementById("stat-top-count").textContent = data.topPerformers.length;
        document.getElementById("stat-risk-count").textContent = data.atRiskStudents.length;
    }

    // — Subject bar chart —
    function renderSubjectBars(subjectAverages) {
        const container = document.getElementById("subject-bars");
        container.innerHTML = "";

        const barClasses = {
            Math: "bar-math",
            Science: "bar-science",
            English: "bar-english",
            History: "bar-history",
            Geography: "bar-geography",
        };

        for (const [subject, avg] of Object.entries(subjectAverages)) {
            const row = document.createElement("div");
            row.className = "subject-bar-row";

            const label = document.createElement("span");
            label.className = "subject-bar-label";
            label.textContent = subject;

            const track = document.createElement("div");
            track.className = "subject-bar-track";

            const fill = document.createElement("div");
            fill.className = `subject-bar-fill ${barClasses[subject] || "bar-math"}`;
            fill.style.width = "0%";
            fill.textContent = avg + "%";

            track.appendChild(fill);
            row.appendChild(label);
            row.appendChild(track);
            container.appendChild(row);

            // Animate after paint
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    fill.style.width = Math.min(avg, 100) + "%";
                });
            });
        }
    }

    // — Student cards (top & at-risk) —
    function renderStudentCards(containerId, students, emptyId) {
        const container = document.getElementById(containerId);
        const emptyMsg = document.getElementById(emptyId);
        container.innerHTML = "";

        if (!students.length) {
            emptyMsg.classList.remove("hidden");
            return;
        }
        emptyMsg.classList.add("hidden");

        students.forEach((s, i) => {
            const card = document.createElement("div");
            card.className = "student-card";
            card.style.animationDelay = `${i * 0.08}s`;

            const gradeClass = gradeToClass(s.grade);

            card.innerHTML = `
                <div class="student-card-header">
                    <span class="student-card-name">${escapeHtml(s.name)}</span>
                    <span class="student-card-grade ${gradeClass}">${s.grade}</span>
                </div>
                <div class="student-card-stats">
                    <div class="student-card-stat">
                        <span class="student-card-stat-label">Math</span>
                        <span class="student-card-stat-value">${s.math}</span>
                    </div>
                    <div class="student-card-stat">
                        <span class="student-card-stat-label">Science</span>
                        <span class="student-card-stat-value">${s.science}</span>
                    </div>
                    <div class="student-card-stat">
                        <span class="student-card-stat-label">English</span>
                        <span class="student-card-stat-value">${s.english}</span>
                    </div>
                    <div class="student-card-stat">
                        <span class="student-card-stat-label">History</span>
                        <span class="student-card-stat-value">${s.history}</span>
                    </div>
                    <div class="student-card-stat">
                        <span class="student-card-stat-label">Geography</span>
                        <span class="student-card-stat-value">${s.geography}</span>
                    </div>
                    <div class="student-card-stat">
                        <span class="student-card-stat-label">Attendance</span>
                        <span class="student-card-stat-value">${s.attendance}%</span>
                    </div>
                    <div class="card-avg-row">
                        <span class="student-card-stat-label">Average</span>
                        <span class="student-card-stat-value">${s.average}%</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // — All students table —
    function renderAllStudentsTable(students) {
        const tbody = document.getElementById("all-students-body");
        tbody.innerHTML = "";

        students.forEach((s, i) => {
            const rank = i + 1;
            const gradeClass = gradeToClass(s.grade);
            let rankBadge = `<span class="rank-badge${rank <= 3 ? ` rank-${rank}` : ""}">${rank}</span>`;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${rankBadge}</td>
                <td>${s.id}</td>
                <td>${escapeHtml(s.name)}</td>
                <td>${s.math}</td>
                <td>${s.science}</td>
                <td>${s.english}</td>
                <td>${s.history}</td>
                <td>${s.geography}</td>
                <td>${s.attendance}%</td>
                <td><strong>${s.average}%</strong></td>
                <td><span class="student-card-grade ${gradeClass}">${s.grade}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // — Highlights —
    function renderHighlights(data) {
        const container = document.getElementById("highlights");
        container.innerHTML = "";

        const highlights = [
            {
                icon: "🥇",
                title: "Highest Average",
                value: data.highestAverage.name,
                sub: `${data.highestAverage.average}%`,
            },
            {
                icon: "🔻",
                title: "Lowest Average",
                value: data.lowestAverage.name,
                sub: `${data.lowestAverage.average}%`,
            },
            {
                icon: "📊",
                title: "Class Average",
                value: `${data.classAverage}%`,
                sub: `Across ${data.totalStudents} students`,
            },
            {
                icon: "📖",
                title: "Best Subject",
                value: bestSubject(data.subjectAverages).name,
                sub: `${bestSubject(data.subjectAverages).avg}% class average`,
            },
            {
                icon: "📉",
                title: "Weakest Subject",
                value: worstSubject(data.subjectAverages).name,
                sub: `${worstSubject(data.subjectAverages).avg}% class average`,
            },
        ];

        highlights.forEach((h) => {
            const card = document.createElement("div");
            card.className = "highlight-card";
            card.innerHTML = `
                <div class="highlight-icon">${h.icon}</div>
                <div class="highlight-title">${h.title}</div>
                <div class="highlight-value">${h.value}</div>
                <div class="highlight-sub">${h.sub}</div>
            `;
            container.appendChild(card);
        });
    }

    // ——— Helpers ———
    function gradeToClass(grade) {
        const map = { "A+": "grade-ap", A: "grade-a", B: "grade-b", C: "grade-c", D: "grade-d", E: "grade-e", F: "grade-f" };
        return map[grade] || "grade-c";
    }

    function bestSubject(subjectAverages) {
        let best = { name: "", avg: -1 };
        for (const [name, avg] of Object.entries(subjectAverages)) {
            if (avg > best.avg) best = { name, avg };
        }
        return best;
    }

    function worstSubject(subjectAverages) {
        let worst = { name: "", avg: 101 };
        for (const [name, avg] of Object.entries(subjectAverages)) {
            if (avg < worst.avg) worst = { name, avg };
        }
        return worst;
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }
})();
