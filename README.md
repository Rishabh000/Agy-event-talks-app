# BigQuery Release Notes & Share Hub

A modern, responsive web application built with **Python Flask** and **Vanilla HTML/CSS/JS** that fetches, normalizes, filters, and shares Google Cloud BigQuery release notes on Twitter/X.

## 🚀 Features

*   **Granular Update Splitting:** Automatically parses and splits multi-topic daily release entries into individual, readable cards (separating *Features*, *Changes*, *Deprecations*, and *Issues*).
*   **Live Search & Categories:** Instantly search through update headlines/body text and filter cards dynamically by release type.
*   **Instant Feed Refresh:** Trigger a new backend fetch from the GCP feed at the click of a button, complete with smooth loading skeleton placeholders.
*   **Interactive X (Twitter) Composer:** Select any specific release card to compose, edit, toggle hashtag chips, monitor character limits (with visual warning states), and post directly to X.
*   **Modern Glassmorphism Design:** A premium dark theme UI with neon gradients, responsive layouts, and rich micro-interactions.

---

## 🛠️ Tech Stack

*   **Backend:** Python 3, Flask, Requests, BeautifulSoup4 (for HTML element extraction)
*   **Frontend:** Plain Vanilla HTML5, CSS3 Variables & Keyframe Animations, Vanilla JavaScript ES6

---

## 📦 Directory Structure

```text
agy-cli-projects/
├── app.py                # Flask server, router, and XML/HTML parser
├── news.txt              # Exported general news list (sample file)
├── summary.txt           # Summary of exported news list
├── templates/
│   └── index.html        # Main SPA markup & Tweeter Modal structure
└── static/
    ├── app.js            # Frontend logic (events, search, filters, tweet composer)
    └── style.css         # Dark theme style guidelines & glassmorphism
```

---

## ⚙️ Installation & Run Instructions

### 1. Prerequisite Checklist
Make sure you have **Python 3.x** and `pip` installed on your machine.

### 2. Clone/Setup Workspace
Navigate to your project folder:
```bash
cd /Users/risha/agy-cli-projects
```

### 3. Install Required Libraries
Install the Flask, requests, and BeautifulSoup packages:
```bash
pip install Flask requests beautifulsoup4
```
*(Alternatively, initialize and install inside a python virtual environment).*

### 4. Run the Server
Launch the Flask development server:
```bash
python3 app.py
```

### 5. Access the Web App
Open your web browser and navigate to:
👉 **[http://127.0.0.1:5001](http://127.0.0.1:5001)**

---

## ⚡ API Endpoint Reference

### `GET /api/updates`
Returns a JSON array of parsed, normalized, and chronologically sorted BigQuery updates.

**Sample Output Structure:**
```json
[
  {
    "date": "June 15, 2026",
    "type": "Feature",
    "content": "<p>Use Gemini Cloud Assist to analyze your SQL queries...</p>",
    "raw_text": "Use Gemini Cloud Assist to analyze your SQL queries...",
    "link": "https://docs.cloud.google.com/bigquery/docs/release-notes#June_15_2026",
    "updated": "2026-06-15T00:00:00-07:00"
  }
]
```

---

## 📝 License
This project is licensed under the MIT License.
