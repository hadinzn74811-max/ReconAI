import csv
import io
import json
from pathlib import Path

from flask import Flask, jsonify, render_template, request
from flask_cors import CORS


app = Flask(__name__)
CORS(app)


BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data" / "transactions.json"

# =====================================================
# DATA LOADING
# =====================================================

def load_transaction_data():
    with DATA_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)


# =====================================================
# RECONCILIATION ENGINE
# =====================================================

def run_reconciliation(custom_data=None):
    if custom_data is None:
        data = load_transaction_data()
    else:
        data = custom_data

    orders = data.get("orders", [])
    payments = data.get("payments", [])

    orders_by_id = {
        order["order_id"]: order
        for order in orders
    }

    processed_order_ids = set()
    results = []

    for payment in payments:
        order_id = payment["order_id"]
        order = orders_by_id.get(order_id)

        result = {
            "payment_id": payment["id"],
            "order_id": order_id,
            "customer": payment["customer"],
            "paid_amount": payment["amount"],
            "expected_amount": (
                order["expected_amount"] if order else 0
            ),
            "payment_status": payment["status"],
            "risk": payment["risk"],
            "date": payment["date"]
        }

        # Payment belongs to an unknown order
        if order is None:
            result.update(
                {
                    "reconciliation_status": "unmatched",
                    "issue": "Payment belongs to an unknown order",
                    "severity": "high"
                }
            )

        else:
            processed_order_ids.add(order_id)

            # Payment failed
            if payment["status"] != "captured":
                result.update(
                    {
                        "reconciliation_status": "failed",
                        "issue": "Payment was not captured",
                        "severity": "high"
                    }
                )

            # Paid and expected amounts are different
            elif payment["amount"] != order["expected_amount"]:
                difference = (
                    payment["amount"] -
                    order["expected_amount"]
                )

                result.update(
                    {
                        "reconciliation_status": "mismatch",
                        "issue": "Payment amount does not match order amount",
                        "severity": "medium",
                        "difference": difference
                    }
                )

            # Payment requires AI risk review
            elif payment["risk"] == "high":
                result.update(
                    {
                        "reconciliation_status": "review",
                        "issue": "High-risk payment requires verification",
                        "severity": "high"
                    }
                )

            # Payment is fully matched
            else:
                result.update(
                    {
                        "reconciliation_status": "matched",
                        "issue": None,
                        "severity": "low"
                    }
                )

        results.append(result)

    # Find orders for which no payment exists
    for order in orders:
        if order["order_id"] not in processed_order_ids:
            results.append(
                {
                    "payment_id": None,
                    "order_id": order["order_id"],
                    "customer": order["customer"],
                    "paid_amount": 0,
                    "expected_amount": order["expected_amount"],
                    "payment_status": "missing",
                    "risk": "medium",
                    "date": order["date"],
                    "reconciliation_status": "missing",
                    "issue": "No payment was found for this order",
                    "severity": "medium"
                }
            )

    summary = {
        "total_checked": len(results),
        "matched": sum(
            result["reconciliation_status"] == "matched"
            for result in results
        ),
        "mismatched": sum(
            result["reconciliation_status"] == "mismatch"
            for result in results
        ),
        "failed": sum(
            result["reconciliation_status"] == "failed"
            for result in results
        ),
        "high_risk": sum(
            result["reconciliation_status"] == "review"
            for result in results
        ),
        "missing": sum(
            result["reconciliation_status"] == "missing"
            for result in results
        ),
        "unmatched": sum(
            result["reconciliation_status"] == "unmatched"
            for result in results
        )
    }

    summary["issues_found"] = (
        summary["total_checked"] - summary["matched"]
    )

    return {
        "summary": summary,
        "results": results
    }


# =====================================================
# PAGE ROUTE
# =====================================================

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/reconciliation")
def reconciliation_page():
    return render_template("reconciliation.html")


@app.route("/transactions")
def transactions_page():
    return render_template("transactions.html")


@app.route("/risk-detection")
def risk_detection_page():
    return render_template("risk-detection.html")


@app.route("/analytics")
def analytics_page():
    return render_template("analytics.html")


@app.route("/reports")
def reports_page():
    return render_template("reports.html")

@app.route("/settings")
def settings_page():
    return render_template("settings.html")


# =====================================================
# API ROUTES
# =====================================================

@app.route("/api/summary")
def dashboard_summary():
    data = load_transaction_data()
    payments = data.get("payments", [])

    return jsonify(
        {
            "totalAmount": sum(
                payment["amount"]
                for payment in payments
            ),
            "successfulPayments": sum(
                payment["status"] == "captured"
                for payment in payments
            ),
            "failedPayments": sum(
                payment["status"] == "failed"
                for payment in payments
            ),
            "highRiskTransactions": sum(
                payment["risk"] == "high"
                for payment in payments
            )
        }
    )


@app.route("/api/transactions")
def get_transactions():
    data = load_transaction_data()
    return jsonify(data.get("payments", []))


@app.route("/api/reconcile", methods=["GET", "POST"])
def reconcile():
    return jsonify(run_reconciliation())

@app.route("/api/reconcile-upload", methods=["POST"])
def reconcile_uploaded_file():
    maximum_size = 10 * 1024 * 1024

    if (
        request.content_length
        and request.content_length > maximum_size
    ):
        return jsonify(
            {
                "error": "CSV file must be smaller than 10 MB"
            }
        ), 413

    if "file" not in request.files:
        return jsonify(
            {
                "error": "No CSV file was uploaded"
            }
        ), 400

    uploaded_file = request.files["file"]

    if uploaded_file.filename == "":
        return jsonify(
            {
                "error": "Please select a CSV file"
            }
        ), 400

    if not uploaded_file.filename.lower().endswith(".csv"):
        return jsonify(
            {
                "error": "Only CSV files are supported"
            }
        ), 400

    try:
        csv_content = uploaded_file.read().decode("utf-8-sig")

        csv_reader = csv.DictReader(
            io.StringIO(csv_content)
        )

        if csv_reader.fieldnames is None:
            return jsonify(
                {
                    "error": "CSV file is empty"
                }
            ), 400

        csv_reader.fieldnames = [
            field.strip()
            for field in csv_reader.fieldnames
        ]

        required_columns = {
            "payment_id",
            "order_id",
            "customer",
            "amount",
            "status",
            "risk",
            "date"
        }

        missing_columns = (
            required_columns - set(csv_reader.fieldnames)
        )

        if missing_columns:
            return jsonify(
                {
                    "error": (
                        "Missing CSV columns: "
                        + ", ".join(sorted(missing_columns))
                    )
                }
            ), 400

        uploaded_payments = []

        for row_number, row in enumerate(
            csv_reader,
            start=2
        ):
            amount_text = (
                row["amount"]
                .replace("₹", "")
                .replace(",", "")
                .strip()
            )

            if not amount_text:
                raise ValueError(
                    f"Amount is missing on row {row_number}"
                )

            uploaded_payments.append(
                {
                    "id": row["payment_id"].strip(),
                    "order_id": row["order_id"].strip(),
                    "customer": row["customer"].strip(),
                    "amount": int(float(amount_text)),
                    "status": row["status"].strip().lower(),
                    "risk": row["risk"].strip().lower(),
                    "date": row["date"].strip()
                }
            )

        if not uploaded_payments:
            return jsonify(
                {
                    "error": "CSV file contains no payment records"
                }
            ), 400

        existing_data = load_transaction_data()

        custom_data = {
            "orders": existing_data.get("orders", []),
            "payments": uploaded_payments
        }

        reconciliation_result = run_reconciliation(
            custom_data
        )

        reconciliation_result["source"] = {
            "type": "csv_upload",
            "filename": uploaded_file.filename,
            "payment_records": len(uploaded_payments)
        }

        return jsonify(reconciliation_result)

    except UnicodeDecodeError:
        return jsonify(
            {
                "error": "CSV file must use UTF-8 encoding"
            }
        ), 400

    except (ValueError, KeyError) as error:
        return jsonify(
            {
                "error": str(error)
            }
        ), 400

@app.route("/api/health")
def health():
    return jsonify(
        {
            "status": "healthy",
            "service": "ReconAI API",
            "reconciliationEngine": "online"
        }
    )


if __name__ == "__main__":
    app.run(debug=True, port=5000)