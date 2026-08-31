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

const tableBody = document.getElementById(
    "transactionsPageTable"
);

const tableWrapper = document.querySelector(
    ".transactions-table-wrapper"
);

const emptyState = document.getElementById(
    "transactionsEmpty"
);

const searchInput = document.getElementById(
    "transactionSearch"
);

const statusFilter = document.getElementById(
    "statusFilter"
);

const riskFilter = document.getElementById(
    "riskFilter"
);

const refreshButton = document.getElementById(
    "refreshTransactions"
);

const exportButton = document.getElementById(
    "exportTransactions"
);

const visibleCount = document.getElementById(
    "visibleTransactionCount"
);

const drawer = document.getElementById(
    "transactionDrawer"
);

const drawerOverlay = document.getElementById(
    "drawerOverlay"
);

const closeDrawerButton = document.getElementById(
    "closeDrawer"
);

const drawerPaymentId = document.getElementById(
    "drawerPaymentId"
);

const drawerContent = document.getElementById(
    "drawerContent"
);

const toast = document.getElementById("toast");

let allTransactions = [];
let visibleTransactions = [];


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
            : "fa-circle-check";

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
   SUMMARY
===================================================== */

function updateTransactionSummary(transactions) {
    const captured = transactions.filter(
        transaction => transaction.status === "captured"
    ).length;

    const failed = transactions.filter(
        transaction => transaction.status === "failed"
    ).length;

    const volume = transactions.reduce(
        (total, transaction) =>
            total + Number(transaction.amount),
        0
    );

    document.getElementById("transactionCount").textContent =
        transactions.length;

    document.getElementById("capturedCount").textContent =
        captured;

    document.getElementById("failedCount").textContent =
        failed;

    document.getElementById("transactionVolume").textContent =
        currencyFormatter.format(volume);
}


/* =====================================================
   TABLE
===================================================== */

function renderTransactions(transactions) {
    visibleTransactions = transactions;

    visibleCount.textContent =
        `Showing ${transactions.length} transaction${
            transactions.length === 1 ? "" : "s"
        }`;

    if (transactions.length === 0) {
        tableWrapper.hidden = true;
        emptyState.hidden = false;
        tableBody.innerHTML = "";
        return;
    }

    tableWrapper.hidden = false;
    emptyState.hidden = true;

    tableBody.innerHTML = transactions.map(transaction => `
        <tr data-payment-id="${transaction.id}">

            <td>
                <span class="payment-id">
                    ${transaction.id}
                </span>
            </td>

            <td>
                <span class="order-id">
                    ${transaction.order_id}
                </span>
            </td>

            <td>${transaction.customer}</td>

            <td>
                <span class="amount">
                    ${currencyFormatter.format(
                        transaction.amount
                    )}
                </span>
            </td>

            <td>
                <span class="
                    status-badge
                    status-${transaction.status}
                ">
                    ${transaction.status}
                </span>
            </td>

            <td>
                <span class="
                    risk-badge
                    risk-${transaction.risk}
                ">
                    ${transaction.risk}
                </span>
            </td>

            <td>${transaction.date}</td>

            <td>
                <button
                    class="table-action"
                    data-action="view"
                    data-payment-id="${transaction.id}"
                    title="View details"
                >
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </button>
            </td>

        </tr>
    `).join("");
}


/* =====================================================
   FILTERS
===================================================== */

function applyFilters() {
    const searchText =
        searchInput.value.trim().toLowerCase();

    const selectedStatus = statusFilter.value;
    const selectedRisk = riskFilter.value;

    const filteredTransactions = allTransactions.filter(
        transaction => {
            const matchesSearch =
                transaction.id.toLowerCase().includes(searchText) ||
                transaction.order_id
                    .toLowerCase()
                    .includes(searchText) ||
                transaction.customer
                    .toLowerCase()
                    .includes(searchText);

            const matchesStatus =
                selectedStatus === "all" ||
                transaction.status === selectedStatus;

            const matchesRisk =
                selectedRisk === "all" ||
                transaction.risk === selectedRisk;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesRisk
            );
        }
    );

    renderTransactions(filteredTransactions);
}


searchInput.addEventListener("input", applyFilters);
statusFilter.addEventListener("change", applyFilters);
riskFilter.addEventListener("change", applyFilters);


/* =====================================================
   TRANSACTION DRAWER
===================================================== */

function openTransactionDrawer(transaction) {
    drawerPaymentId.textContent = transaction.id;

    drawerContent.innerHTML = `
        <div class="detail-status">
            <span>Transaction amount</span>

            <strong>
                ${currencyFormatter.format(transaction.amount)}
            </strong>
        </div>

        <div class="detail-list">

            <div class="detail-item">
                <span>Payment ID</span>
                <strong>${transaction.id}</strong>
            </div>

            <div class="detail-item">
                <span>Order ID</span>
                <strong>${transaction.order_id}</strong>
            </div>

            <div class="detail-item">
                <span>Customer</span>
                <strong>${transaction.customer}</strong>
            </div>

            <div class="detail-item">
                <span>Status</span>

                <strong>
                    <span class="
                        status-badge
                        status-${transaction.status}
                    ">
                        ${transaction.status}
                    </span>
                </strong>
            </div>

            <div class="detail-item">
                <span>Risk level</span>

                <strong>
                    <span class="
                        risk-badge
                        risk-${transaction.risk}
                    ">
                        ${transaction.risk}
                    </span>
                </strong>
            </div>

            <div class="detail-item">
                <span>Transaction date</span>
                <strong>${transaction.date}</strong>
            </div>

        </div>
    `;

    drawer.classList.add("show");
    drawerOverlay.classList.add("show");

    document.body.style.overflow = "hidden";
}


function closeTransactionDrawer() {
    drawer.classList.remove("show");
    drawerOverlay.classList.remove("show");

    document.body.style.overflow = "";
}


tableBody.addEventListener("click", event => {
    const row = event.target.closest("tr");

    if (!row) {
        return;
    }

    const paymentId = row.dataset.paymentId;

    const transaction = allTransactions.find(
        item => item.id === paymentId
    );

    if (transaction) {
        openTransactionDrawer(transaction);
    }
});


closeDrawerButton.addEventListener(
    "click",
    closeTransactionDrawer
);

drawerOverlay.addEventListener(
    "click",
    closeTransactionDrawer
);


document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeTransactionDrawer();
    }
});


/* =====================================================
   CSV EXPORT
===================================================== */

function escapeCsvValue(value) {
    const text = String(value ?? "");

    if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
    ) {
        return `"${text.replaceAll('"', '""')}"`;
    }

    return text;
}


function exportTransactionsToCsv() {
    if (visibleTransactions.length === 0) {
        showToast(
            "Nothing to export",
            "No transactions match the current filters.",
            "error"
        );

        return;
    }

    const rows = [
        [
            "payment_id",
            "order_id",
            "customer",
            "amount",
            "status",
            "risk",
            "date"
        ],

        ...visibleTransactions.map(transaction => [
            transaction.id,
            transaction.order_id,
            transaction.customer,
            transaction.amount,
            transaction.status,
            transaction.risk,
            transaction.date
        ])
    ];

    const csvContent = rows
        .map(row =>
            row.map(escapeCsvValue).join(",")
        )
        .join("\n");

    const csvBlob = new Blob(
        [csvContent],
        {
            type: "text/csv;charset=utf-8"
        }
    );

    const downloadUrl = URL.createObjectURL(csvBlob);
    const downloadLink = document.createElement("a");

    downloadLink.href = downloadUrl;
    downloadLink.download =
        `reconai-transactions-${
            new Date().toISOString().slice(0, 10)
        }.csv`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    URL.revokeObjectURL(downloadUrl);

    showToast(
        "Export complete",
        `${visibleTransactions.length} transactions exported.`
    );
}


exportButton.addEventListener(
    "click",
    exportTransactionsToCsv
);


/* =====================================================
   LOAD TRANSACTIONS
===================================================== */

async function loadTransactions() {
    refreshButton.classList.add("loading");

    try {
        const response = await fetch("/api/transactions");

        if (!response.ok) {
            throw new Error("Unable to load transactions");
        }

        allTransactions = await response.json();

        updateTransactionSummary(allTransactions);
        applyFilters();

    } catch (error) {
        console.error("Transaction error:", error);

        tableWrapper.hidden = true;
        emptyState.hidden = false;

        showToast(
            "Unable to load transactions",
            "Please check the Flask server.",
            "error"
        );

    } finally {
        refreshButton.classList.remove("loading");
    }
}


refreshButton.addEventListener("click", () => {
    loadTransactions();

    showToast(
        "Transactions refreshed",
        "The latest payment data has been loaded."
    );
});


loadTransactions();