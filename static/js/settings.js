/* =====================================================
   ELEMENTS
===================================================== */

const currentTime = document.getElementById("currentTime");

const sidebar = document.getElementById("sidebar");
const menuButton = document.getElementById("menuButton");

const integrationMode = document.getElementById(
    "razorpayMode"
);

const keyIdInput = document.getElementById(
    "razorpayKeyId"
);

const keySecretInput = document.getElementById(
    "razorpayKeySecret"
);

const webhookSecretInput = document.getElementById(
    "webhookSecret"
);

const integrationState = document.getElementById(
    "integrationState"
);

const testConnectionButton = document.getElementById(
    "testConnection"
);

const connectionMessage = document.getElementById(
    "connectionMessage"
);

const riskThreshold = document.getElementById(
    "riskThreshold"
);

const riskThresholdValue = document.getElementById(
    "riskThresholdValue"
);

const saveButton = document.getElementById(
    "saveAllSettings"
);

const toast = document.getElementById("toast");


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
   SECRET VISIBILITY
===================================================== */

document.querySelectorAll(".toggle-secret").forEach(button => {
    button.addEventListener("click", () => {
        const targetId = button.dataset.target;
        const targetInput = document.getElementById(targetId);
        const icon = button.querySelector("i");

        const shouldShow =
            targetInput.type === "password";

        targetInput.type =
            shouldShow ? "text" : "password";

        icon.className = shouldShow
            ? "fa-regular fa-eye-slash"
            : "fa-regular fa-eye";
    });
});


/* =====================================================
   RISK THRESHOLD
===================================================== */

riskThreshold.addEventListener("input", () => {
    riskThresholdValue.textContent =
        `${riskThreshold.value}%`;
});


/* =====================================================
   INTEGRATION MODE
===================================================== */

function updateIntegrationMode() {
    const demoMode = integrationMode.value === "demo";

    keyIdInput.disabled = demoMode;
    keySecretInput.disabled = demoMode;
    webhookSecretInput.disabled = demoMode;

    keyIdInput.placeholder = demoMode
        ? "Not required in demo mode"
        : "rzp_test_xxxxxxxxxx";

    keySecretInput.placeholder = demoMode
        ? "Not required in demo mode"
        : "Enter test key secret";

    if (demoMode) {
        integrationState.classList.add("connected");

        integrationState.innerHTML = `
            <i></i>
            Demo data active
        `;

        connectionMessage.textContent =
            "ReconAI sample transactions enabled.";

    } else {
        integrationState.classList.remove("connected");

        integrationState.innerHTML = `
            <i></i>
            Not configured
        `;

        connectionMessage.textContent = "";
    }
}


integrationMode.addEventListener(
    "change",
    updateIntegrationMode
);


/* =====================================================
   CONNECTION TEST
===================================================== */

testConnectionButton.addEventListener("click", () => {
    const originalContent =
        testConnectionButton.innerHTML;

    testConnectionButton.disabled = true;

    testConnectionButton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Checking...
    `;

    setTimeout(() => {
        if (integrationMode.value === "demo") {
            integrationState.classList.add("connected");

            integrationState.innerHTML = `
                <i></i>
                Demo connected
            `;

            connectionMessage.textContent =
                "ReconAI demo data is ready.";

            showToast(
                "Demo connection active",
                "Sample payment data is available."
            );

        } else {
            const keyId = keyIdInput.value.trim();
            const keySecret = keySecretInput.value.trim();

            if (!keyId || !keySecret) {
                integrationState.classList.remove("connected");

                integrationState.innerHTML = `
                    <i></i>
                    Credentials required
                `;

                connectionMessage.textContent =
                    "Enter both test-mode credentials.";

                showToast(
                    "Credentials missing",
                    "Enter the Key ID and Key Secret.",
                    "error"
                );

            } else if (!keyId.startsWith("rzp_test_")) {
                integrationState.classList.remove("connected");

                integrationState.innerHTML = `
                    <i></i>
                    Invalid test key
                `;

                connectionMessage.textContent =
                    "Key ID must begin with rzp_test_.";

                showToast(
                    "Invalid Key ID",
                    "Only Razorpay test-mode keys are allowed.",
                    "error"
                );

            } else if (keySecret.length < 8) {
                integrationState.classList.remove("connected");

                integrationState.innerHTML = `
                    <i></i>
                    Invalid secret
                `;

                connectionMessage.textContent =
                    "The test key secret appears incomplete.";

                showToast(
                    "Invalid Key Secret",
                    "Check the test-mode secret and try again.",
                    "error"
                );

            } else {
                integrationState.classList.add("connected");

                integrationState.innerHTML = `
                    <i></i>
                    Credentials ready
                `;

                connectionMessage.textContent =
                    "Credential format verified locally.";

                showToast(
                    "Credentials verified",
                    "Ready for secure backend connection."
                );
            }
        }

        testConnectionButton.disabled = false;
        testConnectionButton.innerHTML = originalContent;

    }, 900);
});


/* =====================================================
   SAVE PREFERENCES
===================================================== */

function savePreferences() {
    const preferences = {
        integrationMode: integrationMode.value,
        riskThreshold: riskThreshold.value,
        defaultCurrency:
            document.getElementById("defaultCurrency").value,
        refreshInterval:
            document.getElementById("refreshInterval").value,
        riskNotifications:
            document.getElementById(
                "riskNotifications"
            ).checked,
        failedNotifications:
            document.getElementById(
                "failedNotifications"
            ).checked,
        reportNotifications:
            document.getElementById(
                "reportNotifications"
            ).checked
    };

    localStorage.setItem(
        "reconaiPreferences",
        JSON.stringify(preferences)
    );

    showToast(
        "Settings saved",
        "ReconAI preferences updated successfully."
    );
}


/* =====================================================
   LOAD PREFERENCES
===================================================== */

function loadPreferences() {
    const savedPreferences = localStorage.getItem(
        "reconaiPreferences"
    );

    if (!savedPreferences) {
        updateIntegrationMode();
        return;
    }

    try {
        const preferences = JSON.parse(savedPreferences);

        integrationMode.value =
            preferences.integrationMode || "test";

        riskThreshold.value =
            preferences.riskThreshold || "70";

        riskThresholdValue.textContent =
            `${riskThreshold.value}%`;

        document.getElementById("defaultCurrency").value =
            preferences.defaultCurrency || "INR";

        document.getElementById("refreshInterval").value =
            preferences.refreshInterval || "30";

        document.getElementById(
            "riskNotifications"
        ).checked =
            preferences.riskNotifications ?? true;

        document.getElementById(
            "failedNotifications"
        ).checked =
            preferences.failedNotifications ?? true;

        document.getElementById(
            "reportNotifications"
        ).checked =
            preferences.reportNotifications ?? true;

    } catch (error) {
        console.error("Preference loading error:", error);
    }

    updateIntegrationMode();
}


saveButton.addEventListener(
    "click",
    savePreferences
);


loadPreferences();