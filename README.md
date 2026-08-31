# ReconAI – Payment Intelligence Dashboard

ReconAI is a multi-page payment reconciliation and risk-intelligence dashboard built as a prototype for the Razorpay Buildathon.

It helps analyse payment records, identify mismatches, detect suspicious transactions and generate useful reports from one unified platform.

## Live Demo

[Open ReconAI Live](https://recon-ai-blond.vercel.app)

## Key Features

- Payment overview with live operational metrics
- CSV transaction upload and processing
- Automated order and payment reconciliation
- Detection of mismatched, failed and missing payments
- Transaction search, status filters and risk filters
- Rule-based payment risk and anomaly analysis
- Interactive payment analytics and charts
- CSV, JSON and printable report generation
- Configurable risk preferences
- Safe demo mode without real payment credentials
- Responsive multi-page dashboard interface

## Application Pages

- Overview
- Reconciliation
- Transactions
- Risk Detection
- Analytics
- Reports
- Settings

## Technology Stack

- Python
- Flask
- Flask-CORS
- HTML5
- CSS3
- JavaScript
- Chart.js
- Font Awesome
- JSON
- Git and GitHub
- Vercel

## Project Structure

```text
ReconAI/
├── app.py
├── requirements.txt
├── README.md
├── .gitignore
├── data/
│   └── transactions.json
├── templates/
│   ├── index.html
│   ├── reconciliation.html
│   ├── transactions.html
│   ├── risk-detection.html
│   ├── analytics.html
│   ├── reports.html
│   └── settings.html
└── static/
    ├── css/
    │   ├── style.css
    │   ├── reconciliation.css
    │   ├── transactions.css
    │   ├── risk-detection.css
    │   ├── analytics.css
    │   ├── reports.css
    │   └── settings.css
    ├── js/
    │   ├── app.js
    │   ├── reconciliation.js
    │   ├── transactions.js
    │   ├── risk-detection.js
    │   ├── analytics.js
    │   ├── reports.js
    │   └── settings.js
    └── images/
```

## Run Locally

Clone the repository:

```powershell
git clone https://github.com/hadinzn74811-max/ReconAI.git
cd ReconAI
```

Create a virtual environment:

```powershell
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Start the Flask server:

```powershell
python app.py
```

Open the application:

```text
http://127.0.0.1:5000
```

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend health |
| GET | `/api/summary` | Fetch dashboard summary |
| GET | `/api/transactions` | Fetch transaction records |
| GET/POST | `/api/reconcile` | Run reconciliation |
| POST | `/api/reconcile-upload` | Analyse an uploaded CSV file |

## CSV Format

Uploaded CSV files should contain:

```text
payment_id,order_id,customer,amount,status,risk,date
```

## Demo Mode

ReconAI currently operates as a safe demonstration prototype using simulated payment data.

- It does not process real money.
- It does not require Razorpay API credentials.
- Risk results are generated using transparent rule-based analysis.
- No API keys or secrets are stored in the repository.

## Future Improvements

- Razorpay Test Mode integration
- Secure webhook signature verification
- Database and user authentication
- Machine-learning anomaly scoring
- Real-time notifications
- Advanced audit trails

## Author

**Hadi Nizam**

GitHub: [hadinzn74811-max](https://github.com/hadinzn74811-max)