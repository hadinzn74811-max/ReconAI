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

const refreshButton = document.getElementById(
    "refreshAnalytics"
);

const toast = document.getElementById("toast");

let volumeChart;
let statusChart;
let riskChart;


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
            : "fa-chart-line";

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
   KPI VALUES
===================================================== */

function updateKpis(transactions) {
    const totalTransactions = transactions.length;

    const totalVolume = transactions.reduce(
        (total, transaction) =>
            total + Number(transaction.amount),
        0
    );

    const capturedCount = transactions.filter(
        transaction => transaction.status === "captured"
    ).length;

    const highRiskCount = transactions.filter(
        transaction => transaction.risk === "high"
    ).length;

    const successRate = totalTransactions
        ? Math.round(
            (capturedCount / totalTransactions) * 100
        )
        : 0;

    const riskRate = totalTransactions
        ? Math.round(
            (highRiskCount / totalTransactions) * 100
        )
        : 0;

    const averagePayment = totalTransactions
        ? totalVolume / totalTransactions
        : 0;

    document.getElementById(
        "analyticsTotalVolume"
    ).textContent = currencyFormatter.format(totalVolume);

    document.getElementById(
        "analyticsSuccessRate"
    ).textContent = `${successRate}%`;

    document.getElementById(
        "analyticsAveragePayment"
    ).textContent = currencyFormatter.format(
        averagePayment
    );

    document.getElementById(
        "analyticsRiskRate"
    ).textContent = `${riskRate}%`;

    updatePaymentHealth(
        totalTransactions,
        capturedCount,
        transactions,
        highRiskCount
    );
}


/* =====================================================
   PAYMENT HEALTH
===================================================== */

function updatePaymentHealth(
    totalTransactions,
    capturedCount,
    transactions,
    highRiskCount
) {
    const failedCount = transactions.filter(
        transaction => transaction.status === "failed"
    ).length;

    const capturedRate = totalTransactions
        ? Math.round(
            (capturedCount / totalTransactions) * 100
        )
        : 0;

    const failedRate = totalTransactions
        ? Math.round(
            (failedCount / totalTransactions) * 100
        )
        : 0;

    const riskRate = totalTransactions
        ? Math.round(
            (highRiskCount / totalTransactions) * 100
        )
        : 0;

    document.getElementById(
        "capturedHealthValue"
    ).textContent = `${capturedRate}%`;

    document.getElementById(
        "failedHealthValue"
    ).textContent = `${failedRate}%`;

    document.getElementById(
        "riskHealthValue"
    ).textContent = `${riskRate}%`;

    document.getElementById(
        "capturedHealthBar"
    ).style.width = `${capturedRate}%`;

    document.getElementById(
        "failedHealthBar"
    ).style.width = `${failedRate}%`;

    document.getElementById(
        "riskHealthBar"
    ).style.width = `${riskRate}%`;

    const insight = document.getElementById(
        "analyticsInsight"
    );

    if (riskRate >= 30) {
        insight.innerHTML = `
            <strong style="color: #fca5a5">
                Attention required:
            </strong>
            ${riskRate}% of payments are marked high-risk.
            Review them before settlement.
        `;

    } else if (failedRate >= 20) {
        insight.innerHTML = `
            <strong style="color: #fcd34d">
                Payment failures detected:
            </strong>
            Investigate failed transactions to improve the
            payment success rate.
        `;

    } else {
        insight.innerHTML = `
            <strong style="color: #86efac">
                Payment performance is healthy.
            </strong>
            Most transactions are being captured successfully.
        `;
    }
}


/* =====================================================
   VOLUME CHART
===================================================== */

function createVolumeChart(transactions) {
    const volumeByDate = {};

    transactions.forEach(transaction => {
        const transactionDate = transaction.date;

        volumeByDate[transactionDate] =
            (volumeByDate[transactionDate] || 0) +
            Number(transaction.amount);
    });

    const labels = Object.keys(volumeByDate).sort(
        (firstDate, secondDate) =>
            new Date(firstDate) - new Date(secondDate)
    );

    const values = labels.map(
        label => volumeByDate[label]
    );

    const context = document
        .getElementById("analyticsVolumeChart")
        .getContext("2d");

    const gradient = context.createLinearGradient(
        0,
        0,
        0,
        290
    );

    gradient.addColorStop(
        0,
        "rgba(124, 92, 255, 0.4)"
    );

    gradient.addColorStop(
        1,
        "rgba(124, 92, 255, 0)"
    );

    if (volumeChart) {
        volumeChart.destroy();
    }

    volumeChart = new Chart(context, {
        type: "line",

        data: {
            labels,

            datasets: [
                {
                    label: "Payment Volume",
                    data: values,
                    borderColor: "#8b73ff",
                    backgroundColor: gradient,
                    borderWidth: 2.5,
                    pointRadius: 4,
                    pointBackgroundColor: "#8b73ff",
                    pointBorderColor: "#ffffff",
                    pointBorderWidth: 1.5,
                    fill: true,
                    tension: 0.4
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    backgroundColor: "#111a31",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderWidth: 1,
                    padding: 11,

                    callbacks: {
                        label(context) {
                            return currencyFormatter.format(
                                context.raw
                            );
                        }
                    }
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
                        color: "rgba(255,255,255,0.05)"
                    },

                    border: {
                        display: false
                    },

                    ticks: {
                        color: "#64748b",

                        callback(value) {
                            return `₹${value}`;
                        }
                    }
                }
            }
        }
    });
}


/* =====================================================
   STATUS CHART
===================================================== */

function createStatusChart(transactions) {
    const captured = transactions.filter(
        transaction => transaction.status === "captured"
    ).length;

    const failed = transactions.filter(
        transaction => transaction.status === "failed"
    ).length;

    const pending = transactions.filter(
        transaction => transaction.status === "pending"
    ).length;

    if (statusChart) {
        statusChart.destroy();
    }

    statusChart = new Chart(
        document.getElementById("analyticsStatusChart"),
        {
            type: "doughnut",

            data: {
                labels: [
                    "Captured",
                    "Failed",
                    "Pending"
                ],

                datasets: [
                    {
                        data: [
                            captured,
                            failed,
                            pending
                        ],

                        backgroundColor: [
                            "rgba(34, 197, 94, 0.82)",
                            "rgba(239, 68, 68, 0.82)",
                            "rgba(245, 158, 11, 0.82)"
                        ],

                        borderColor: [
                            "#22c55e",
                            "#ef4444",
                            "#f59e0b"
                        ],

                        borderWidth: 1,
                        hoverOffset: 7
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "70%",

                plugins: {
                    legend: {
                        position: "bottom",

                        labels: {
                            color: "#94a3b8",
                            usePointStyle: true,
                            pointStyle: "circle",
                            padding: 16,

                            font: {
                                family: "Manrope",
                                size: 9
                            }
                        }
                    }
                }
            }
        }
    );
}


/* =====================================================
   RISK CHART
===================================================== */

function createRiskChart(transactions) {
    const lowRisk = transactions.filter(
        transaction => transaction.risk === "low"
    ).length;

    const mediumRisk = transactions.filter(
        transaction => transaction.risk === "medium"
    ).length;

    const highRisk = transactions.filter(
        transaction => transaction.risk === "high"
    ).length;

    if (riskChart) {
        riskChart.destroy();
    }

    riskChart = new Chart(
        document.getElementById("analyticsRiskChart"),
        {
            type: "bar",

            data: {
                labels: [
                    "Low",
                    "Medium",
                    "High"
                ],

                datasets: [
                    {
                        data: [
                            lowRisk,
                            mediumRisk,
                            highRisk
                        ],

                        backgroundColor: [
                            "rgba(34, 197, 94, 0.7)",
                            "rgba(245, 158, 11, 0.7)",
                            "rgba(239, 68, 68, 0.75)"
                        ],

                        borderColor: [
                            "#22c55e",
                            "#f59e0b",
                            "#ef4444"
                        ],

                        borderWidth: 1,
                        borderRadius: 8
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        display: false
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
                            color: "#94a3b8"
                        }
                    },

                    y: {
                        beginAtZero: true,

                        grid: {
                            color: "rgba(255,255,255,0.05)"
                        },

                        border: {
                            display: false
                        },

                        ticks: {
                            color: "#64748b",
                            stepSize: 1
                        }
                    }
                }
            }
        }
    );
}


/* =====================================================
   TOP CUSTOMERS
===================================================== */

function displayTopCustomers(transactions) {
    const customerData = {};

    transactions.forEach(transaction => {
        const customer = transaction.customer;

        if (!customerData[customer]) {
            customerData[customer] = {
                amount: 0,
                count: 0
            };
        }

        customerData[customer].amount += Number(
            transaction.amount
        );

        customerData[customer].count += 1;
    });

    const topCustomers = Object.entries(customerData)
        .sort(
            (firstCustomer, secondCustomer) =>
                secondCustomer[1].amount -
                firstCustomer[1].amount
        )
        .slice(0, 5);

    document.getElementById(
        "topCustomersList"
    ).innerHTML = topCustomers.map(
        ([customer, data], index) => `
            <div class="customer-item">

                <div class="customer-rank">
                    ${String(index + 1).padStart(2, "0")}
                </div>

                <div class="customer-info">
                    <strong>${customer}</strong>

                    <span>
                        ${data.count} transaction${
                            data.count === 1 ? "" : "s"
                        }
                    </span>
                </div>

                <div class="customer-amount">
                    ${currencyFormatter.format(data.amount)}
                </div>

            </div>
        `
    ).join("");
}


/* =====================================================
   LOAD ANALYTICS
===================================================== */

async function loadAnalytics(showNotification = false) {
    const originalContent = refreshButton.innerHTML;

    refreshButton.disabled = true;

    refreshButton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Refreshing...
    `;

    try {
        const response = await fetch("/api/transactions");

        if (!response.ok) {
            throw new Error("Unable to load analytics data");
        }

        const transactions = await response.json();

        updateKpis(transactions);
        createVolumeChart(transactions);
        createStatusChart(transactions);
        createRiskChart(transactions);
        displayTopCustomers(transactions);

        if (showNotification) {
            showToast(
                "Analytics refreshed",
                "Latest payment intelligence loaded."
            );
        }

    } catch (error) {
        console.error("Analytics error:", error);

        showToast(
            "Analytics unavailable",
            "Please check the Flask server.",
            "error"
        );

    } finally {
        refreshButton.disabled = false;
        refreshButton.innerHTML = originalContent;
    }
}


refreshButton.addEventListener("click", () => {
    loadAnalytics(true);
});


loadAnalytics();