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

const reportType = document.getElementById("reportType");
const reportFormat = document.getElementById("reportFormat");
const reportName = document.getElementById("reportName");

const generateButton = document.getElementById(
    "generateReportButton"
);

const createButton = document.getElementById(
    "createReportButton"
);

const downloadButton = document.getElementById(
    "downloadReportButton"
);

const emptyPreview = document.getElementById(
    "reportEmptyPreview"
);

const generatedPreview = document.getElementById(
    "generatedReportPreview"
);

const previewStatus = document.getElementById(
    "previewStatus"
);

const snapshotTable = document.getElementById(
    "reportSnapshotTable"
);

const toast = document.getElementById("toast");

let transactions = [];
let reconciliationData = null;
let activeReport = null;


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
            : "fa-file-circle-check";

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

function updateReportSummary() {
    const totalVolume = transactions.reduce(
        (total, transaction) =>
            total + Number(transaction.amount),
        0
    );

    const summary = reconciliationData.summary;

    document.getElementById(
        "reportTransactionCount"
    ).textContent = transactions.length;

    document.getElementById(
        "reportTotalVolume"
    ).textContent = currencyFormatter.format(totalVolume);

    document.getElementById(
        "reportIssueCount"
    ).textContent = summary.issues_found;

    document.getElementById(
        "reportMatchedCount"
    ).textContent = summary.matched;
}


/* =====================================================
   SNAPSHOT TABLE
===================================================== */

function renderSnapshotTable() {
    const results = reconciliationData.results;

    snapshotTable.innerHTML = results.map(result => {
        const paymentId =
            result.payment_id || "Not found";

        const issue =
            result.issue || "Payment matched successfully";

        return `
            <tr>
                <td>
                    <span class="order-id">
                        ${result.order_id}
                    </span>
                </td>

                <td>
                    <span class="payment-id">
                        ${paymentId}
                    </span>
                </td>

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
}


/* =====================================================
   REPORT DATA
===================================================== */

function getSelectedReportData() {
    if (reportType.value === "transactions") {
        return transactions;
    }

    if (reportType.value === "risk") {
        return reconciliationData.results.filter(
            result =>
                result.reconciliation_status !== "matched"
        );
    }

    return reconciliationData.results;
}


function getReportTypeLabel() {
    const selectedOption =
        reportType.options[reportType.selectedIndex];

    return selectedOption.textContent.trim();
}


function getFormatLabel() {
    const selectedOption =
        reportFormat.options[reportFormat.selectedIndex];

    return selectedOption.textContent.trim();
}


/* =====================================================
   GENERATE REPORT
===================================================== */

function generateReport() {
    const cleanReportName =
        reportName.value.trim() || "ReconAI Report";

    const selectedData = getSelectedReportData();

    activeReport = {
        name: cleanReportName,
        type: reportType.value,
        typeLabel: getReportTypeLabel(),
        format: reportFormat.value,
        formatLabel: getFormatLabel(),
        generatedAt: new Date(),
        data: selectedData
    };

    emptyPreview.hidden = true;
    generatedPreview.hidden = false;

    previewStatus.classList.add("ready");

    previewStatus.innerHTML = `
        <i></i>
        Report ready
    `;

    document.getElementById(
        "previewReportType"
    ).textContent = activeReport.typeLabel;

    document.getElementById(
        "previewReportName"
    ).textContent = activeReport.name;

    document.getElementById(
        "previewReportDetails"
    ).textContent =
        `${activeReport.formatLabel} · ` +
        `${activeReport.data.length} records · ` +
        activeReport.generatedAt.toLocaleString("en-IN");

    document.getElementById(
        "reportGeneratedAt"
    ).textContent =
        `Generated ${activeReport.generatedAt.toLocaleString(
            "en-IN"
        )}`;

    showToast(
        "Report generated",
        `${activeReport.typeLabel} is ready to download.`
    );
}


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


function convertToCsv(report) {
    let rows;

    if (report.type === "transactions") {
        rows = [
            [
                "payment_id",
                "order_id",
                "customer",
                "amount",
                "status",
                "risk",
                "date"
            ],

            ...report.data.map(transaction => [
                transaction.id,
                transaction.order_id,
                transaction.customer,
                transaction.amount,
                transaction.status,
                transaction.risk,
                transaction.date
            ])
        ];

    } else {
        rows = [
            [
                "payment_id",
                "order_id",
                "customer",
                "expected_amount",
                "paid_amount",
                "payment_status",
                "risk",
                "reconciliation_status",
                "severity",
                "issue",
                "date"
            ],

            ...report.data.map(result => [
                result.payment_id || "",
                result.order_id,
                result.customer,
                result.expected_amount,
                result.paid_amount,
                result.payment_status,
                result.risk,
                result.reconciliation_status,
                result.severity,
                result.issue || "",
                result.date
            ])
        ];
    }

    return rows
        .map(row =>
            row.map(escapeCsvValue).join(",")
        )
        .join("\n");
}


/* =====================================================
   FILE DOWNLOAD
===================================================== */

function sanitizeFileName(fileName) {
    return fileName
        .replace(/[^a-z0-9-_ ]/gi, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
}


function downloadBlob(content, mimeType, extension) {
    const blob = new Blob(
        [content],
        {
            type: mimeType
        }
    );

    const downloadUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    downloadLink.href = downloadUrl;

    downloadLink.download =
        `${sanitizeFileName(activeReport.name)}.${extension}`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    URL.revokeObjectURL(downloadUrl);
}


function downloadActiveReport() {
    if (!activeReport) {
        showToast(
            "Generate a report first",
            "Configure and create your report.",
            "error"
        );

        return;
    }

    if (activeReport.format === "print") {
        window.print();
        return;
    }

    if (activeReport.format === "json") {
        const jsonReport = {
            report_name: activeReport.name,
            report_type: activeReport.typeLabel,
            generated_at:
                activeReport.generatedAt.toISOString(),
            summary: reconciliationData.summary,
            records: activeReport.data
        };

        downloadBlob(
            JSON.stringify(jsonReport, null, 2),
            "application/json;charset=utf-8",
            "json"
        );

    } else {
        downloadBlob(
            convertToCsv(activeReport),
            "text/csv;charset=utf-8",
            "csv"
        );
    }

    showToast(
        "Download started",
        `${activeReport.name} is being downloaded.`
    );
}


/* =====================================================
   LOAD REPORT DATA
===================================================== */

async function loadReportData() {
    try {
        const [
            transactionResponse,
            reconciliationResponse
        ] = await Promise.all([
            fetch("/api/transactions"),

            fetch("/api/reconcile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            })
        ]);

        if (
            !transactionResponse.ok ||
            !reconciliationResponse.ok
        ) {
            throw new Error("Unable to load report data");
        }

        transactions = await transactionResponse.json();

        reconciliationData =
            await reconciliationResponse.json();

        updateReportSummary();
        renderSnapshotTable();

    } catch (error) {
        console.error("Report data error:", error);

        showToast(
            "Reports unavailable",
            "Please check the Flask server.",
            "error"
        );
    }
}


/* =====================================================
   EVENTS
===================================================== */

generateButton.addEventListener(
    "click",
    generateReport
);

createButton.addEventListener(
    "click",
    generateReport
);

downloadButton.addEventListener(
    "click",
    downloadActiveReport
);


loadReportData();