const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
});


/* =====================================================
   ELEMENTS
===================================================== */

const currentTime = document.getElementById("currentTime");

const sidebar = document.getElementById("sidebar");
const menuButton = document.getElementById("menuButton");

const scanButton = document.getElementById("scanRiskButton");
const scanStatus = document.getElementById("riskScanStatus");

const emptyState = document.getElementById("riskEmptyState");
const tableWrapper = document.getElementById("riskTableWrapper");
const alertsTable = document.getElementById("riskAlertsTable");

const riskScoreRing = document.querySelector(
    ".risk-score-ring"
);

const aiRiskMessage = document.getElementById(
    "aiRiskMessage"
);

const toast = document.getElementById("toast");

let riskDistributionChart;


/* =====================================================
   LIVE CLOCK
===================================================== */

function updateClock() {
    const now = new Date();

    currentTime.textContent = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

updateClock();
setInterval(updateClock, 1000);


/* =====================================================
   SIDEBAR
===================================================== */

menuButton.addEventListener("click", () => {
    sidebar.classList.toggle("open");
});


document.addEventListener("click", event => {
    const clickedOutside =
        !sidebar.contains(event.target) &&
        !menuButton.contains(event.target);

    if (window.innerWidth <= 900 && clickedOutside) {
        sidebar.classList.remove("open");
    }
});


document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", event => {
        if (item.getAttribute("href") === "#") {
            event.preventDefault();
        }
    });
});


/* =====================================================
   TOAST
===================================================== */

function showToast(title, message, type = "success") {
    const icon =
        type === "error"
            ? "fa-circle-exclamation"
            : "fa-shield-circle-check";

    const color =
        type === "error"
            ? "#ef4444"
            : "#22c55e";

    toast.innerHTML = `
        <i
            class="fa-solid ${icon}"
            style="color: ${color}"
        ></i>

        <div>
            <strong>${title}</strong>
            <span>${message}</span>
        </div>
    `;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3500);
}


/* =====================================================
   RISK CHART
===================================================== */

function createRiskChart(results) {
    const lowRisk = results.filter(
        result => result.risk === "low"
    ).length;

    const mediumRisk = results.filter(
        result => result.risk === "medium"
    ).length;

    const highRisk = results.filter(
        result => result.risk === "high"
    ).length;

    const chartContext = document
        .getElementById("riskDistributionChart")
        .getContext("2d");

    if (riskDistributionChart) {
        riskDistributionChart.destroy();
    }

    riskDistributionChart = new Chart(chartContext, {
        type: "doughnut",

        data: {
            labels: [
                "Low Risk",
                "Medium Risk",
                "High Risk"
            ],

            datasets: [
                {
                    data: [
                        lowRisk,
                        mediumRisk,
                        highRisk
                    ],

                    backgroundColor: [
                        "rgba(34, 197, 94, 0.8)",
                        "rgba(245, 158, 11, 0.8)",
                        "rgba(239, 68, 68, 0.85)"
                    ],

                    borderColor: [
                        "#22c55e",
                        "#f59e0b",
                        "#ef4444"
                    ],

                    borderWidth: 1,
                    hoverOffset: 8
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "72%",

            plugins: {
                legend: {
                    position: "right",

                    labels: {
                        color: "#94a3b8",
                        usePointStyle: true,
                        pointStyle: "circle",
                        padding: 22,

                        font: {
                            family: "Manrope",
                            size: 10,
                            weight: "600"
                        }
                    }
                },

                tooltip: {
                    backgroundColor: "#111a31",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    borderWidth: 1,
                    padding: 11,
                    titleColor: "#ffffff",
                    bodyColor: "#cbd5e1"
                }
            }
        }
    });
}


/* =====================================================
   RISK SUMMARY
===================================================== */

function updateRiskSummary(results, alerts) {
    const highRiskAlerts = alerts.filter(
        alert => alert.severity === "high"
    );

    const amountAtRisk = alerts.reduce(
        (total, alert) =>
            total + Number(alert.paid_amount),
        0
    );

    const mediumRiskAlerts = alerts.filter(
        alert => alert.severity === "medium"
    ).length;

    const securityPenalty =
        highRiskAlerts.length * 15 +
        mediumRiskAlerts * 8;

    const securityScore = Math.max(
        0,
        100 - securityPenalty
    );

    const riskExposure = results.length
        ? Math.round(
            (alerts.length / results.length) * 100
        )
        : 0;

    document.getElementById("highRiskCount").textContent =
        highRiskAlerts.length;

    document.getElementById("amountAtRisk").textContent =
        currencyFormatter.format(amountAtRisk);

    document.getElementById("needsReviewCount").textContent =
        alerts.length;

    document.getElementById("securityScore").textContent =
        securityScore;

    document.getElementById("riskScoreValue").textContent =
        `${riskExposure}%`;

    riskScoreRing.style.setProperty(
        "--risk-angle",
        `${riskExposure * 3.6}deg`
    );

    updateAiAssessment(
        riskExposure,
        highRiskAlerts.length,
        alerts.length
    );
}


/* =====================================================
   AI ASSESSMENT
===================================================== */

function updateAiAssessment(
    exposure,
    highRiskCount,
    totalAlerts
) {
    if (exposure >= 70) {
        aiRiskMessage.innerHTML = `
            <strong style="color: #fca5a5">
                Critical exposure detected.
            </strong>
            ReconAI found ${totalAlerts} anomalies, including
            ${highRiskCount} high-severity payments. Immediate
            verification is recommended.
        `;

    } else if (exposure >= 40) {
        aiRiskMessage.innerHTML = `
            <strong style="color: #fcd34d">
                Moderate payment risk detected.
            </strong>
            Review the flagged transactions before settlement
            processing.
        `;

    } else if (totalAlerts > 0) {
        aiRiskMessage.innerHTML = `
            <strong style="color: #67e8f9">
                Low overall exposure.
            </strong>
            A small number of anomalies were detected and should
            be reviewed.
        `;

    } else {
        aiRiskMessage.innerHTML = `
            <strong style="color: #86efac">
                Payments appear secure.
            </strong>
            No suspicious reconciliation activity was detected.
        `;
    }
}


/* =====================================================
   RISK ALERTS
===================================================== */

function renderRiskAlerts(alerts) {
    if (alerts.length === 0) {
        emptyState.hidden = false;
        tableWrapper.hidden = true;

        emptyState.innerHTML = `
            <i class="fa-solid fa-shield-circle-check"></i>

            <h3>No risk alerts detected</h3>

            <p>
                All payments passed the current ReconAI scan.
            </p>
        `;

        return;
    }

    emptyState.hidden = true;
    tableWrapper.hidden = false;

    alertsTable.innerHTML = alerts.map(alert => {
        const paymentId =
            alert.payment_id || "Not found";

        return `
            <tr>
                <td>
                    <span class="payment-id">
                        ${paymentId}
                    </span>
                </td>

                <td>
                    <span class="order-id">
                        ${alert.order_id}
                    </span>
                </td>

                <td>${alert.customer}</td>

                <td>
                    <span class="amount">
                        ${currencyFormatter.format(
                            alert.paid_amount
                        )}
                    </span>
                </td>

                <td>
                    <span class="
                        risk-badge
                        risk-${alert.risk}
                    ">
                        ${alert.risk}
                    </span>
                </td>

                <td>
                    <span class="
                        severity-badge
                        severity-${alert.severity}
                    ">
                        ${alert.severity}
                    </span>
                </td>

                <td>${alert.issue}</td>
            </tr>
        `;
    }).join("");
}


/* =====================================================
   SCAN TRANSACTIONS
===================================================== */

scanButton.addEventListener("click", async () => {
    const originalButtonContent = scanButton.innerHTML;

    scanButton.disabled = true;

    scanButton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Scanning Transactions...
    `;

    scanStatus.className = "risk-scan-status scanning";

    scanStatus.innerHTML = `
        <span></span>
        AI scan in progress
    `;

    try {
        const response = await fetch("/api/reconcile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Unable to run risk scan");
        }

        const data = await response.json();
        const results = data.results;

        const alerts = results.filter(
            result =>
                result.reconciliation_status !== "matched"
        );

        updateRiskSummary(results, alerts);
        createRiskChart(results);
        renderRiskAlerts(alerts);

        scanStatus.className = "risk-scan-status complete";

        scanStatus.innerHTML = `
            <span></span>
            Scan complete
        `;

        showToast(
            "Risk scan complete",
            `${alerts.length} payment anomalies detected.`
        );

    } catch (error) {
        console.error("Risk scan error:", error);

        scanStatus.className = "risk-scan-status";

        scanStatus.innerHTML = `
            <span></span>
            Scan failed
        `;

        showToast(
            "Risk scan failed",
            "Please check the Flask server.",
            "error"
        );

    } finally {
        scanButton.disabled = false;
        scanButton.innerHTML = originalButtonContent;
    }
});