const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
});


let paymentChart;


/* =====================================================
   LIVE CLOCK
===================================================== */

function updateClock() {
    const clock = document.getElementById("currentTime");

    const now = new Date();

    clock.textContent = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

updateClock();
setInterval(updateClock, 1000);


/* =====================================================
   DASHBOARD SUMMARY
===================================================== */

async function loadSummary() {
    try {
        const response = await fetch("/api/summary");

        if (!response.ok) {
            throw new Error("Unable to load dashboard summary");
        }

        const data = await response.json();

        document.getElementById("totalAmount").textContent =
            currencyFormatter.format(data.totalAmount);

        document.getElementById("successfulPayments").textContent =
            data.successfulPayments;

        document.getElementById("failedPayments").textContent =
            data.failedPayments;

        document.getElementById("highRiskTransactions").textContent =
            data.highRiskTransactions;

    } catch (error) {
        console.error("Summary error:", error);
    }
}


/* =====================================================
   TRANSACTIONS TABLE
===================================================== */

async function loadTransactions() {
    const tableBody = document.getElementById("transactionTable");

    try {
        const response = await fetch("/api/transactions");

        if (!response.ok) {
            throw new Error("Unable to load transactions");
        }

        const transactions = await response.json();

        tableBody.innerHTML = transactions.map(transaction => `
            <tr>
                <td>
                    <span class="payment-id">${transaction.id}</span>
                </td>

                <td>${transaction.customer}</td>

                <td>
                    <span class="amount">
                        ${currencyFormatter.format(transaction.amount)}
                    </span>
                </td>

                <td>
                    <span class="status-badge status-${transaction.status}">
                        ${transaction.status}
                    </span>
                </td>

                <td>
                    <span class="risk-badge risk-${transaction.risk}">
                        ${transaction.risk}
                    </span>
                </td>

                <td>${transaction.date}</td>
            </tr>
        `).join("");

    } catch (error) {
        console.error("Transaction error:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="6">Unable to load transaction data.</td>
            </tr>
        `;
    }
}


/* =====================================================
   PAYMENT CHART
===================================================== */

function createPaymentChart(range = "7") {
    const canvas = document.getElementById("paymentChart");
    const context = canvas.getContext("2d");

    const sevenDayData = {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        successful: [18, 24, 21, 29, 32, 27, 38],
        failed: [3, 2, 5, 2, 4, 3, 2]
    };

    const thirtyDayData = {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
        successful: [124, 158, 176, 219],
        failed: [18, 14, 21, 12]
    };

    const selectedData =
        range === "30" ? thirtyDayData : sevenDayData;

    if (paymentChart) {
        paymentChart.destroy();
    }

    const purpleGradient = context.createLinearGradient(0, 0, 0, 280);

    purpleGradient.addColorStop(0, "rgba(124, 92, 255, 0.35)");
    purpleGradient.addColorStop(1, "rgba(124, 92, 255, 0)");

    paymentChart = new Chart(context, {
        type: "line",

        data: {
            labels: selectedData.labels,

            datasets: [
                {
                    label: "Successful",
                    data: selectedData.successful,
                    borderColor: "#8b73ff",
                    backgroundColor: purpleGradient,
                    borderWidth: 2.5,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: "#8b73ff",
                    fill: true,
                    tension: 0.42
                },
                {
                    label: "Failed",
                    data: selectedData.failed,
                    borderColor: "#ef4444",
                    backgroundColor: "transparent",
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    borderDash: [5, 5],
                    tension: 0.42
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                intersect: false,
                mode: "index"
            },

            plugins: {
                legend: {
                    position: "top",
                    align: "end",

                    labels: {
                        color: "#94a3b8",
                        boxWidth: 9,
                        boxHeight: 9,
                        usePointStyle: true,
                        pointStyle: "circle",
                        padding: 18,
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
                    bodyColor: "#cbd5e1",
                    displayColors: true
                }
            },

            scales: {
                x: {
                    grid: {
                        display: false
                    },

                    border: {
                        display: false
                    },

                    ticks: {
                        color: "#64748b",
                        font: {
                            family: "Manrope",
                            size: 9
                        }
                    }
                },

                y: {
                    beginAtZero: true,

                    grid: {
                        color: "rgba(255, 255, 255, 0.05)"
                    },

                    border: {
                        display: false
                    },

                    ticks: {
                        color: "#64748b",
                        padding: 10,
                        font: {
                            family: "Manrope",
                            size: 9
                        }
                    }
                }
            }
        }
    });
}


/* =====================================================
   CHART RANGE
===================================================== */

document
    .getElementById("chartRange")
    .addEventListener("change", event => {
        createPaymentChart(event.target.value);
    });


/* =====================================================
   REAL RECONCILIATION ENGINE
===================================================== */

const reconciliationButton =
    document.getElementById("runReconciliation");

const reconciliationModal =
    document.getElementById("reconciliationModal");

const closeModalButton =
    document.getElementById("closeModal");

const reconciliationTable =
    document.getElementById("reconciliationTable");

const toast = document.getElementById("toast");


function openReconciliationModal() {
    reconciliationModal.classList.add("show");
    document.body.classList.add("modal-open");
}


function closeReconciliationModal() {
    reconciliationModal.classList.remove("show");
    document.body.classList.remove("modal-open");
}


function displayReconciliationResults(data) {
    const summary = data.summary;
    const results = data.results;

    document.getElementById("reconTotal").textContent =
        summary.total_checked;

    document.getElementById("reconMatched").textContent =
        summary.matched;

    document.getElementById("reconIssues").textContent =
        summary.issues_found;

    document.getElementById("reconHighRisk").textContent =
        summary.high_risk;

    reconciliationTable.innerHTML = results.map(result => {
        const paymentId =
            result.payment_id || "Not found";

        const issue =
            result.issue || "Payment matched successfully";

        return `
            <tr>
                <td>
                    <span class="payment-id">
                        ${result.order_id}
                    </span>
                </td>

                <td>${paymentId}</td>

                <td>${result.customer}</td>

                <td>
                    ${currencyFormatter.format(
                        result.expected_amount
                    )}
                </td>

                <td>
                    <span class="amount">
                        ${currencyFormatter.format(
                            result.paid_amount
                        )}
                    </span>
                </td>

                <td>
                    <span class="
                        recon-status
                        ${result.reconciliation_status}
                    ">
                        ${result.reconciliation_status}
                    </span>
                </td>

                <td>${issue}</td>
            </tr>
        `;
    }).join("");

    openReconciliationModal();
}


function showErrorToast() {
    toast.innerHTML = `
        <i
            class="fa-solid fa-circle-exclamation"
            style="color: #ef4444"
        ></i>

        <div>
            <strong>Reconciliation failed</strong>
            <span>Please check the server and try again.</span>
        </div>
    `;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3500);
}


reconciliationButton.addEventListener("click", async () => {
    const originalContent = reconciliationButton.innerHTML;

    reconciliationButton.disabled = true;

    reconciliationButton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Reconciling Payments...
    `;

    try {
        const response = await fetch("/api/reconcile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Reconciliation request failed");
        }

        const data = await response.json();

        displayReconciliationResults(data);

    } catch (error) {
        console.error("Reconciliation error:", error);
        showErrorToast();

    } finally {
        reconciliationButton.disabled = false;
        reconciliationButton.innerHTML = originalContent;
    }
});


closeModalButton.addEventListener(
    "click",
    closeReconciliationModal
);


reconciliationModal.addEventListener("click", event => {
    if (event.target === reconciliationModal) {
        closeReconciliationModal();
    }
});


document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeReconciliationModal();
    }
});
/* =====================================================
   SIDEBAR
===================================================== */

const sidebar = document.getElementById("sidebar");
const menuButton = document.getElementById("menuButton");


menuButton.addEventListener("click", () => {
    sidebar.classList.toggle("open");
});


document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", event => {
        const link = item.getAttribute("href");

        if (link === "#") {
            event.preventDefault();
        }

        if (window.innerWidth <= 900) {
            sidebar.classList.remove("open");
        }
    });
});

document.addEventListener("click", event => {
    const clickedOutsideSidebar =
        !sidebar.contains(event.target) &&
        !menuButton.contains(event.target);

    if (window.innerWidth <= 900 && clickedOutsideSidebar) {
        sidebar.classList.remove("open");
    }
});


/* =====================================================
   INITIAL LOAD
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    loadSummary();
    loadTransactions();
    createPaymentChart();
});