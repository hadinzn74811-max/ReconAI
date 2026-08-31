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

const fileInput = document.getElementById("csvFileInput");
const uploadZone = document.querySelector(".file-upload-zone");
const selectedFileBox = document.getElementById("selectedFile");

const runButton = document.getElementById(
    "runPageReconciliation"
);

const resultsStatus = document.getElementById("resultsStatus");
const emptyResults = document.getElementById("emptyResults");

const resultsWrapper = document.getElementById(
    "pageResultsWrapper"
);

const resultsTable = document.getElementById(
    "pageReconciliationTable"
);

const toast = document.getElementById("toast");

let selectedCsvFile = null;


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
        const link = item.getAttribute("href");

        if (link === "#") {
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
   FILE SELECTION
===================================================== */

function formatFileSize(size) {
    if (size < 1024) {
        return `${size} bytes`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}


function selectCsvFile(file) {
    if (!file) {
        return;
    }

    const isCsvFile =
        file.name.toLowerCase().endsWith(".csv");

    if (!isCsvFile) {
        showToast(
            "Invalid file",
            "Please select a CSV file.",
            "error"
        );

        return;
    }

    const maximumSize = 10 * 1024 * 1024;

    if (file.size > maximumSize) {
        showToast(
            "File is too large",
            "CSV file must be smaller than 10 MB.",
            "error"
        );

        return;
    }

    selectedCsvFile = file;

    selectedFileBox.classList.add("has-file");

    selectedFileBox.innerHTML = `
        <i class="fa-solid fa-file-csv"></i>

        <div>
            <strong>${file.name}</strong>
            <span>
                ${formatFileSize(file.size)} · Ready to upload
            </span>
        </div>
    `;

    showToast(
        "File selected",
        `${file.name} is ready for reconciliation.`
    );
}


fileInput.addEventListener("change", event => {
    selectCsvFile(event.target.files[0]);
});


["dragenter", "dragover"].forEach(eventName => {
    uploadZone.addEventListener(eventName, event => {
        event.preventDefault();
        uploadZone.classList.add("dragging");
    });
});


["dragleave", "drop"].forEach(eventName => {
    uploadZone.addEventListener(eventName, event => {
        event.preventDefault();
        uploadZone.classList.remove("dragging");
    });
});


uploadZone.addEventListener("drop", event => {
    selectCsvFile(event.dataTransfer.files[0]);
});


/* =====================================================
   RESULTS
===================================================== */

function displaySummary(summary) {
    document.getElementById("pageReconTotal").textContent =
        summary.total_checked;

    document.getElementById("pageReconMatched").textContent =
        summary.matched;

    document.getElementById("pageReconIssues").textContent =
        summary.issues_found;

    document.getElementById("pageReconRisk").textContent =
        summary.high_risk;
}


function displayResults(results) {
    resultsTable.innerHTML = results.map(result => {
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

    emptyResults.hidden = true;
    resultsWrapper.hidden = false;
}


/* =====================================================
   RUN RECONCILIATION
===================================================== */

runButton.addEventListener("click", async () => {
    const originalButtonContent = runButton.innerHTML;

    runButton.disabled = true;

    runButton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Analysing Payments...
    `;

    resultsStatus.className = "results-status processing";

    resultsStatus.innerHTML = `
        <span></span>
        AI analysis in progress
    `;

    try {
        let response;

        if (selectedCsvFile) {
            const formData = new FormData();

            formData.append(
                "file",
                selectedCsvFile
            );

            response = await fetch(
                "/api/reconcile-upload",
                {
                    method: "POST",
                    body: formData
                }
            );

        } else {
            response = await fetch("/api/reconcile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Reconciliation request failed"
            );
        }

        displaySummary(data.summary);
        displayResults(data.results);

        resultsStatus.className = "results-status complete";

        resultsStatus.innerHTML = `
            <span></span>
            Analysis complete
        `;

        const sourceMessage = selectedCsvFile
            ? `${selectedCsvFile.name} analysed successfully.`
            : "Current payment dataset analysed successfully.";

        showToast(
            "Reconciliation complete",
            sourceMessage
        );

    } catch (error) {
        console.error("Reconciliation error:", error);

        resultsStatus.className = "results-status";

        resultsStatus.innerHTML = `
            <span></span>
            Analysis failed
        `;

        showToast(
            "Reconciliation failed",
            error.message,
            "error"
        );

    } finally {
        runButton.disabled = false;
        runButton.innerHTML = originalButtonContent;
    }
});