/* =====================================================
   FEEWISE - SCHOOL PAYMENT BREAKDOWN CALCULATOR

   STUDENT: MUKTAR MUBARAK YUSUF
   MATRIC NUMBER: 2025/HND/SWD/103
   COURSE CODE: SWD 417

   TECHNOLOGIES:
   HTML, CSS, JAVASCRIPT, LOCAL STORAGE
===================================================== */

"use strict";


/* =====================================================
   1. STORAGE CONFIGURATION
===================================================== */

const STORAGE_KEYS = {
    fees: "feewise_fees",
    payments: "feewise_payments",
    profile: "feewise_profile",
    theme: "feewise_theme"
};


/* =====================================================
   2. APPLICATION STATE
===================================================== */

let fees = loadData(STORAGE_KEYS.fees, []);

let payments = loadData(STORAGE_KEYS.payments, []);

let studentProfile = loadData(
    STORAGE_KEYS.profile,
    {}
);

let currentPage = "dashboard";

let toastTimeout = null;


/* =====================================================
   3. DOM HELPER FUNCTIONS
===================================================== */

function getElement(id) {
    return document.getElementById(id);
}


function setText(id, value) {

    const element = getElement(id);

    if (element) {
        element.textContent = value;
    }

}


/* =====================================================
   4. LOCAL STORAGE FUNCTIONS
===================================================== */

function loadData(key, fallback) {

    try {

        const saved = localStorage.getItem(key);

        if (saved === null) {
            return fallback;
        }

        return JSON.parse(saved);

    } catch (error) {

        console.error(
            "Error reading Local Storage:",
            error
        );

        return fallback;

    }

}


function saveData(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;

    } catch (error) {

        console.error(
            "Error saving Local Storage:",
            error
        );

        showToast(
            "Unable to save data in this browser.",
            "error"
        );

        return false;

    }

}


/* =====================================================
   5. FORMAT MONEY IN NIGERIAN NAIRA
===================================================== */

function formatMoney(amount) {

    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(amount);

}


/* =====================================================
   6. MONEY CALCULATION HELPERS

   Convert amounts to kobo for accurate
   addition and subtraction.
===================================================== */

function toKobo(amount) {

    return Math.round(
        Number(amount) * 100
    );

}


function fromKobo(amount) {

    return amount / 100;

}


/* =====================================================
   7. GENERATE UNIQUE IDs
===================================================== */

function generateId() {

    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {

        return crypto.randomUUID();

    }

    return (
        Date.now().toString() +
        "-" +
        Math.random().toString(36).slice(2)
    );

}


/* =====================================================
   8. TOAST NOTIFICATIONS
===================================================== */

function showToast(message, type = "info") {

    const toast = getElement("toast");

    clearTimeout(toastTimeout);

    toast.textContent = message;

    toast.className = `toast show ${type}`;

    toastTimeout = setTimeout(() => {

        toast.className = "toast";

    }, 3500);

}


/* =====================================================
   9. MOBILE SIDEBAR
===================================================== */

function openSidebar() {

    getElement("sidebar").classList.add("open");

    getElement("sidebarOverlay").hidden = false;

    getElement("menuToggle").setAttribute(
        "aria-expanded",
        "true"
    );

}


function closeSidebar() {

    getElement("sidebar").classList.remove("open");

    getElement("sidebarOverlay").hidden = true;

    getElement("menuToggle").setAttribute(
        "aria-expanded",
        "false"
    );

}


/* =====================================================
   10. PAGE NAVIGATION
===================================================== */

const pageTitles = {
    dashboard: "Dashboard",
    calculator: "Fee Calculator",
    payments: "Payment Tracker",
    planner: "Instalment Planner",
    summary: "Payment Summary",
    profile: "Student Profile"
};


function switchPage(page) {

    if (!pageTitles[page]) {
        return;
    }

    document.querySelectorAll(
        ".page-section"
    ).forEach(section => {

        section.hidden = true;

    });

    getElement(`${page}Section`).hidden = false;

    currentPage = page;

    setText(
        "pageTitle",
        pageTitles[page]
    );

    document.querySelectorAll(
        ".nav-item"
    ).forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.page === page
        );

    });

    closeSidebar();

    renderAll();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =====================================================
   11. DARK MODE
===================================================== */

function applyTheme(theme) {

    const isDark = theme === "dark";

    document.body.classList.toggle(
        "dark-mode",
        isDark
    );

    setText(
        "themeToggle",
        isDark
            ? "☀️ Light Mode"
            : "🌙 Dark Mode"
    );

    saveData(
        STORAGE_KEYS.theme,
        theme
    );

}


function toggleTheme() {

    const isDark = document.body.classList.contains(
        "dark-mode"
    );

    applyTheme(
        isDark ? "light" : "dark"
    );

}


/* =====================================================
   12. GET PAYMENTS FOR A FEE
===================================================== */

function getFeePayments(feeId) {

    return payments.filter(
        payment => payment.feeId === feeId
    );

}


/* =====================================================
   13. GET TOTAL PAID FOR A FEE
===================================================== */

function getFeePaidKobo(feeId) {

    return getFeePayments(feeId).reduce(
        (total, payment) => {

            return total + toKobo(
                payment.amount
            );

        },
        0
    );

}


/* =====================================================
   14. GET FEE BALANCE
===================================================== */

function getFeeBalanceKobo(fee) {

    const total = toKobo(fee.amount);

    const paid = getFeePaidKobo(fee.id);

    return Math.max(
        0,
        total - paid
    );

}


/* =====================================================
   15. CALCULATE FINANCIAL TOTALS
===================================================== */

function calculateTotals() {

    const totalKobo = fees.reduce(
        (total, fee) => {

            return total + toKobo(
                fee.amount
            );

        },
        0
    );

    const paidKobo = fees.reduce(
        (total, fee) => {

            return total + getFeePaidKobo(
                fee.id
            );

        },
        0
    );

    const balanceKobo = Math.max(
        0,
        totalKobo - paidKobo
    );

    const progress = totalKobo > 0
        ? (paidKobo / totalKobo) * 100
        : 0;

    return {
        totalKobo,
        paidKobo,
        balanceKobo,
        total: fromKobo(totalKobo),
        paid: fromKobo(paidKobo),
        balance: fromKobo(balanceKobo),
        progress: Math.min(100, progress)
    };

}


/* =====================================================
   16. CREATE TABLE CELLS
===================================================== */

function createCell(value) {

    const cell = document.createElement("td");

    cell.textContent = value;

    return cell;

}


function createEmptyRow(columns, message) {

    const row = document.createElement("tr");

    const cell = document.createElement("td");

    cell.colSpan = columns;

    cell.className = "empty-cell";

    cell.textContent = message;

    row.appendChild(cell);

    return row;

}


/* =====================================================
   17. FEE PAYMENT STATUS
===================================================== */

function getFeeStatus(fee) {

    const paid = getFeePaidKobo(fee.id);

    const total = toKobo(fee.amount);

    if (paid >= total) {

        return {
            label: "Paid",
            className: "paid"
        };

    }

    if (paid > 0) {

        return {
            label: "Partial",
            className: "partial"
        };

    }

    return {
        label: "Unpaid",
        className: "unpaid"
    };

}


function createStatusBadge(fee) {

    const status = getFeeStatus(fee);

    const badge = document.createElement("span");

    badge.className =
        `status-badge ${status.className}`;

    badge.textContent = status.label;

    return badge;

}


/* =====================================================
   18. DASHBOARD
===================================================== */

function renderDashboard() {

    const totals = calculateTotals();

    setText(
        "dashboardTotal",
        formatMoney(totals.total)
    );

    setText(
        "dashboardPaid",
        formatMoney(totals.paid)
    );

    setText(
        "dashboardBalance",
        formatMoney(totals.balance)
    );

    setText(
        "dashboardProgress",
        `${Math.round(totals.progress)}%`
    );

    setText(
        "progressPercentage",
        `${Math.round(totals.progress)}%`
    );

    setText(
        "progressPaid",
        `Paid: ${formatMoney(totals.paid)}`
    );

    setText(
        "progressRemaining",
        `Remaining: ${formatMoney(totals.balance)}`
    );

    const progressBar = getElement(
        "paymentProgressBar"
    );

    progressBar.style.width =
        `${totals.progress}%`;

    getElement(
        "paymentProgressTrack"
    ).setAttribute(
        "aria-valuenow",
        Math.round(totals.progress)
    );

    renderDashboardFeeTable();

}


/* =====================================================
   19. DASHBOARD FEE TABLE
===================================================== */

function renderDashboardFeeTable() {

    const tbody = getElement(
        "dashboardFeeTable"
    );

    tbody.replaceChildren();

    if (fees.length === 0) {

        tbody.appendChild(
            createEmptyRow(
                5,
                "No school fees added yet."
            )
        );

        return;

    }

    fees.forEach(fee => {

        const row = document.createElement("tr");

        const paid = getFeePaidKobo(fee.id);

        const balance = getFeeBalanceKobo(fee);

        row.appendChild(
            createCell(fee.category)
        );

        row.appendChild(
            createCell(
                formatMoney(fee.amount)
            )
        );

        row.appendChild(
            createCell(
                formatMoney(fromKobo(paid))
            )
        );

        row.appendChild(
            createCell(
                formatMoney(fromKobo(balance))
            )
        );

        const statusCell = document.createElement(
            "td"
        );

        statusCell.appendChild(
            createStatusBadge(fee)
        );

        row.appendChild(statusCell);

        tbody.appendChild(row);

    });

}


/* =====================================================
   20. ADD SCHOOL FEE
===================================================== */

function addFee(event) {

    event.preventDefault();

    const categorySelect = getElement(
        "feeCategory"
    );

    const customName = getElement(
        "customFeeName"
    ).value.trim();

    const amountInput = getElement(
        "feeAmount"
    );

    const description = getElement(
        "feeDescription"
    ).value.trim();

    let category = categorySelect.value;

    if (category === "Other") {

        category = customName;

    }

    const amount = Number(
        amountInput.value
    );

    if (!category) {

        showToast(
            "Please enter a fee category.",
            "error"
        );

        return;

    }

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        showToast(
            "Please enter a valid fee amount.",
            "error"
        );

        return;

    }

    const amountKobo = toKobo(amount);

    if (amountKobo <= 0) {

        showToast(
            "Fee amount must be at least ₦0.01.",
            "error"
        );

        return;

    }

    const fee = {
        id: generateId(),
        category,
        amount: fromKobo(amountKobo),
        description,
        createdAt: new Date().toISOString()
    };

    fees.push(fee);

    saveData(
        STORAGE_KEYS.fees,
        fees
    );

    getElement("feeForm").reset();

    getElement(
        "customFeeGroup"
    ).hidden = true;

    renderAll();

    showToast(
        "School fee added successfully!",
        "success"
    );

}


/* =====================================================
   21. CUSTOM FEE CATEGORY
===================================================== */

function handleFeeCategoryChange() {

    const isOther =
        getElement("feeCategory").value === "Other";

    getElement(
        "customFeeGroup"
    ).hidden = !isOther;

    getElement(
        "customFeeName"
    ).required = isOther;

}


/* =====================================================
   22. FEE CALCULATOR SUMMARY
===================================================== */

function renderCalculator() {

    const totals = calculateTotals();

    setText(
        "feeCategoryCount",
        fees.length
    );

    setText(
        "calculatorTotal",
        formatMoney(totals.total)
    );

    setText(
        "calculatorPaid",
        formatMoney(totals.paid)
    );

    setText(
        "calculatorBalance",
        formatMoney(totals.balance)
    );

    setText(
        "estimatedTotal",
        formatMoney(totals.total)
    );

    renderFeeTable();

}


/* =====================================================
   23. FEE TABLE
===================================================== */

function renderFeeTable() {

    const tbody = getElement(
        "feeTableBody"
    );

    tbody.replaceChildren();

    if (fees.length === 0) {

        tbody.appendChild(
            createEmptyRow(
                6,
                "No fee categories added."
            )
        );

        return;

    }

    fees.forEach(fee => {

        const row = document.createElement("tr");

        const paid = getFeePaidKobo(fee.id);

        const balance = getFeeBalanceKobo(fee);

        row.appendChild(
            createCell(fee.category)
        );

        row.appendChild(
            createCell(
                fee.description || "—"
            )
        );

        row.appendChild(
            createCell(
                formatMoney(fee.amount)
            )
        );

        row.appendChild(
            createCell(
                formatMoney(fromKobo(paid))
            )
        );

        row.appendChild(
            createCell(
                formatMoney(fromKobo(balance))
            )
        );

        const actionCell = document.createElement(
            "td"
        );

        const deleteButton = document.createElement(
            "button"
        );

        deleteButton.type = "button";

        deleteButton.className = "btn btn-danger";

        deleteButton.textContent = "Delete";

        deleteButton.addEventListener(
            "click",
            () => deleteFee(fee.id)
        );

        actionCell.appendChild(deleteButton);

        row.appendChild(actionCell);

        tbody.appendChild(row);

    });

}


/* =====================================================
   24. DELETE SCHOOL FEE
===================================================== */

function deleteFee(feeId) {

    const fee = fees.find(
        item => item.id === feeId
    );

    if (!fee) {
        return;
    }

    const confirmed = confirm(
        `Delete "${fee.category}"?\n\n` +
        "Any payments recorded for this fee " +
        "will also be deleted."
    );

    if (!confirmed) {
        return;
    }

    fees = fees.filter(
        item => item.id !== feeId
    );

    payments = payments.filter(
        payment => payment.feeId !== feeId
    );

    saveData(
        STORAGE_KEYS.fees,
        fees
    );

    saveData(
        STORAGE_KEYS.payments,
        payments
    );

    renderAll();

    showToast(
        "Fee category deleted successfully.",
        "success"
    );

}


/* =====================================================
   25. PAYMENT DROPDOWN
===================================================== */

function renderPaymentOptions() {

    const select = getElement(
        "paymentFee"
    );

    const previousValue = select.value;

    select.replaceChildren();

    const defaultOption = document.createElement(
        "option"
    );

    defaultOption.value = "";

    defaultOption.textContent = "Select Fee";

    select.appendChild(defaultOption);

    fees.forEach(fee => {

        const balance = getFeeBalanceKobo(fee);

        if (balance <= 0) {
            return;
        }

        const option = document.createElement(
            "option"
        );

        option.value = fee.id;

        option.textContent =
            `${fee.category} — ` +
            `${formatMoney(fromKobo(balance))} remaining`;

        select.appendChild(option);

    });

    const stillAvailable = Array.from(
        select.options
    ).some(
        option => option.value === previousValue
    );

    if (stillAvailable) {

        select.value = previousValue;

    }

}


/* =====================================================
   26. RECORD PAYMENT
===================================================== */

function recordPayment(event) {

    event.preventDefault();

    const feeId = getElement(
        "paymentFee"
    ).value;

    const amount = Number(
        getElement("paymentAmount").value
    );

    const date = getElement(
        "paymentDate"
    ).value;

    const note = getElement(
        "paymentNote"
    ).value.trim();

    const fee = fees.find(
        item => item.id === feeId
    );

    if (!fee) {

        showToast(
            "Please select a valid fee.",
            "error"
        );

        return;

    }

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        showToast(
            "Please enter a valid payment amount.",
            "error"
        );

        return;

    }

    const amountKobo = toKobo(amount);

    if (amountKobo <= 0) {

        showToast(
            "Minimum payment is ₦0.01.",
            "error"
        );

        return;

    }

    const balanceKobo = getFeeBalanceKobo(fee);

    if (amountKobo > balanceKobo) {

        showToast(
            "Payment exceeds the outstanding balance.",
            "error"
        );

        return;

    }

    if (!date) {

        showToast(
            "Please select a payment date.",
            "error"
        );

        return;

    }

    const payment = {
        id: generateId(),
        feeId,
        category: fee.category,
        amount: fromKobo(amountKobo),
        date,
        note,
        createdAt: new Date().toISOString()
    };

    payments.push(payment);

    saveData(
        STORAGE_KEYS.payments,
        payments
    );

    getElement(
        "paymentForm"
    ).reset();

    setTodayDate();

    renderAll();

    showToast(
        "Payment recorded successfully!",
        "success"
    );

}


/* =====================================================
   27. PAYMENT TRACKER SUMMARY
===================================================== */

function renderPayments() {

    const totals = calculateTotals();

    setText(
        "paymentTotalFees",
        formatMoney(totals.total)
    );

    setText(
        "paymentTotalPaid",
        formatMoney(totals.paid)
    );

    setText(
        "paymentTotalBalance",
        formatMoney(totals.balance)
    );

    renderPaymentOptions();

    renderPaymentTable();

}


/* =====================================================
   28. PAYMENT RECORDS TABLE
===================================================== */

function renderPaymentTable() {

    const tbody = getElement(
        "paymentTableBody"
    );

    tbody.replaceChildren();

    if (payments.length === 0) {

        tbody.appendChild(
            createEmptyRow(
                5,
                "No payments recorded yet."
            )
        );

        return;

    }

    const sortedPayments = [
        ...payments
    ].sort((a, b) => {

        return b.date.localeCompare(a.date);

    });

    sortedPayments.forEach(payment => {

        const row = document.createElement("tr");

        row.appendChild(
            createCell(payment.category)
        );

        row.appendChild(
            createCell(
                formatMoney(payment.amount)
            )
        );

        row.appendChild(
            createCell(
                formatDate(payment.date)
            )
        );

        row.appendChild(
            createCell(payment.note || "—")
        );

        const actionCell = document.createElement(
            "td"
        );

        const deleteButton = document.createElement(
            "button"
        );

        deleteButton.type = "button";

        deleteButton.className = "btn btn-danger";

        deleteButton.textContent = "Delete";

        deleteButton.addEventListener(
            "click",
            () => deletePayment(payment.id)
        );

        actionCell.appendChild(deleteButton);

        row.appendChild(actionCell);

        tbody.appendChild(row);

    });

}


/* =====================================================
   29. DELETE PAYMENT
===================================================== */

function deletePayment(paymentId) {

    const confirmed = confirm(
        "Are you sure you want to delete this payment record?"
    );

    if (!confirmed) {
        return;
    }

    payments = payments.filter(
        payment => payment.id !== paymentId
    );

    saveData(
        STORAGE_KEYS.payments,
        payments
    );

    renderAll();

    showToast(
        "Payment record deleted.",
        "success"
    );

}


/* =====================================================
   30. DATE FORMATTING
===================================================== */

function formatDate(dateString) {

    if (!dateString) {
        return "—";
    }

    const parts = dateString.split("-");

    if (parts.length !== 3) {
        return dateString;
    }

    const year = Number(parts[0]);

    const month = Number(parts[1]);

    const day = Number(parts[2]);

    const date = new Date(
        year,
        month - 1,
        day
    );

    return date.toLocaleDateString(
        "en-NG",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


/* =====================================================
   31. SET TODAY'S DATE
===================================================== */

function setTodayDate() {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(
        today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        today.getDate()
    ).padStart(2, "0");

    const dateString =
        `${year}-${month}-${day}`;

    getElement(
        "paymentDate"
    ).value = dateString;

    getElement(
        "plannerStartDate"
    ).value = dateString;

}


/* =====================================================
   32. UPDATE INSTALMENT BALANCE
===================================================== */

function updatePlannerBalance() {

    const totals = calculateTotals();

    getElement(
        "plannerBalance"
    ).value = totals.balance.toFixed(2);

}


/* =====================================================
   33. CALCULATE INSTALMENT PLAN
===================================================== */

function calculateInstalments(event) {

    event.preventDefault();

    const totals = calculateTotals();

    const balanceKobo = totals.balanceKobo;

    const months = Number(
        getElement("plannerMonths").value
    );

    const startDate = getElement(
        "plannerStartDate"
    ).value;

    if (balanceKobo <= 0) {

        showToast(
            "There is no outstanding balance to plan.",
            "info"
        );

        return;

    }

    if (
        !Number.isInteger(months) ||
        months < 1 ||
        months > 12
    ) {

        showToast(
            "Please select a valid number of months.",
            "error"
        );

        return;

    }

    if (!startDate) {

        showToast(
            "Please select a start date.",
            "error"
        );

        return;

    }

    const basePayment = Math.floor(
        balanceKobo / months
    );

    const remainder = balanceKobo % months;

    const tbody = getElement(
        "plannerTableBody"
    );

    tbody.replaceChildren();

    let remaining = balanceKobo;

    for (let index = 0; index < months; index++) {

        const paymentKobo =
            basePayment +
            (index < remainder ? 1 : 0);

        remaining -= paymentKobo;

        const dueDate = addMonths(
            startDate,
            index
        );

        const row = document.createElement(
            "tr"
        );

        row.appendChild(
            createCell(
                `Instalment ${index + 1}`
            )
        );

        row.appendChild(
            createCell(
                formatDate(dueDate)
            )
        );

        row.appendChild(
            createCell(
                formatMoney(
                    fromKobo(paymentKobo)
                )
            )
        );

        row.appendChild(
            createCell(
                formatMoney(
                    fromKobo(remaining)
                )
            )
        );

        tbody.appendChild(row);

    }

    setText(
        "monthlyPayment",
        formatMoney(
            fromKobo(
                Math.ceil(balanceKobo / months)
            )
        )
    );

    setText(
        "plannerTotal",
        formatMoney(totals.balance)
    );

    setText(
        "plannerInstallments",
        months
    );

    showToast(
        "Instalment plan calculated successfully!",
        "success"
    );

}


/* =====================================================
   34. ADD MONTHS TO A DATE
===================================================== */

function addMonths(dateString, monthsToAdd) {

    const [year, month, day] = dateString
        .split("-")
        .map(Number);

    const targetMonth = new Date(
        Date.UTC(
            year,
            month - 1 + monthsToAdd,
            1
        )
    );

    const targetYear =
        targetMonth.getUTCFullYear();

    const targetMonthIndex =
        targetMonth.getUTCMonth();

    const daysInMonth = new Date(
        Date.UTC(
            targetYear,
            targetMonthIndex + 1,
            0
        )
    ).getUTCDate();

    const safeDay = Math.min(
        day,
        daysInMonth
    );

    const result = new Date(
        Date.UTC(
            targetYear,
            targetMonthIndex,
            safeDay
        )
    );

    return result.toISOString().slice(0, 10);

}


/* =====================================================
   35. RESET STALE INSTALMENT RESULTS

   When fees or payments change, an old
   instalment plan should not remain visible.
===================================================== */

function resetPlannerResults() {

    setText(
        "monthlyPayment",
        formatMoney(0)
    );

    setText(
        "plannerTotal",
        formatMoney(0)
    );

    setText(
        "plannerInstallments",
        0
    );

    const tbody = getElement(
        "plannerTableBody"
    );

    tbody.replaceChildren();

    tbody.appendChild(
        createEmptyRow(
            4,
            "Calculate a plan to view your schedule."
        )
    );

}


/* =====================================================
   36. STUDENT PROFILE
===================================================== */

function saveStudentProfile(event) {

    event.preventDefault();

    const name = getElement(
        "studentName"
    ).value.trim();

    const matric = getElement(
        "studentMatric"
    ).value.trim();

    const institution = getElement(
        "studentInstitution"
    ).value.trim();

    const department = getElement(
        "studentDepartment"
    ).value.trim();

    const level = getElement(
        "studentLevel"
    ).value;

    const session = getElement(
        "academicSession"
    ).value.trim();

    if (
        !name ||
        !institution ||
        !department ||
        !level
    ) {

        showToast(
            "Please complete the required student details.",
            "error"
        );

        return;

    }

    studentProfile = {
        name,
        matric,
        institution,
        department,
        level,
        session
    };

    saveData(
        STORAGE_KEYS.profile,
        studentProfile
    );

    renderReport();

    showToast(
        "Student information saved successfully!",
        "success"
    );

}


/* =====================================================
   37. LOAD STUDENT PROFILE
===================================================== */

function loadStudentProfile() {

    setInputValue(
        "studentName",
        studentProfile.name
    );

    setInputValue(
        "studentMatric",
        studentProfile.matric
    );

    setInputValue(
        "studentInstitution",
        studentProfile.institution
    );

    setInputValue(
        "studentDepartment",
        studentProfile.department
    );

    setInputValue(
        "studentLevel",
        studentProfile.level
    );

    setInputValue(
        "academicSession",
        studentProfile.session
    );

}


function setInputValue(id, value) {

    const element = getElement(id);

    if (element) {
        element.value = value || "";
    }

}


/* =====================================================
   38. PAYMENT SUMMARY REPORT
===================================================== */

function renderReport() {

    const totals = calculateTotals();

    setText(
        "reportStudentName",
        studentProfile.name || "Not Provided"
    );

    setText(
        "reportInstitution",
        studentProfile.institution || "Not Provided"
    );

    setText(
        "reportDepartment",
        studentProfile.department || "Not Provided"
    );

    setText(
        "reportLevel",
        studentProfile.level || "Not Provided"
    );

    setText(
        "reportTotal",
        formatMoney(totals.total)
    );

    setText(
        "reportPaid",
        formatMoney(totals.paid)
    );

    setText(
        "reportBalance",
        formatMoney(totals.balance)
    );

    renderReportTable();

    renderExpenseChart();

}


/* =====================================================
   39. REPORT FEE TABLE
===================================================== */

function renderReportTable() {

    const tbody = getElement(
        "reportTableBody"
    );

    tbody.replaceChildren();

    if (fees.length === 0) {

        tbody.appendChild(
            createEmptyRow(
                4,
                "No school fees recorded."
            )
        );

        return;

    }

    fees.forEach(fee => {

        const row = document.createElement(
            "tr"
        );

        const paid = getFeePaidKobo(fee.id);

        const balance = getFeeBalanceKobo(fee);

        row.appendChild(
            createCell(fee.category)
        );

        row.appendChild(
            createCell(
                formatMoney(fee.amount)
            )
        );

        row.appendChild(
            createCell(
                formatMoney(
                    fromKobo(paid)
                )
            )
        );

        row.appendChild(
            createCell(
                formatMoney(
                    fromKobo(balance)
                )
            )
        );

        tbody.appendChild(row);

    });

}


/* =====================================================
   40. EXPENSE DISTRIBUTION CHART
===================================================== */

function renderExpenseChart() {

    const container = getElement(
        "expenseChart"
    );

    container.replaceChildren();

    if (fees.length === 0) {

        const empty = document.createElement(
            "div"
        );

        empty.className = "empty-chart";

        empty.textContent =
            "Add school fees to view the chart.";

        container.appendChild(empty);

        return;

    }

    const totals = calculateTotals();

    fees.forEach(fee => {

        const percentage = totals.totalKobo > 0
            ? (
                toKobo(fee.amount) /
                totals.totalKobo
            ) * 100
            : 0;

        const item = document.createElement(
            "div"
        );

        item.className = "chart-item";

        const label = document.createElement(
            "span"
        );

        label.className = "chart-label";

        label.textContent = fee.category;

        const track = document.createElement(
            "div"
        );

        track.className = "chart-track";

        const bar = document.createElement(
            "div"
        );

        bar.className = "chart-bar";

        bar.style.width =
            `${Math.min(100, percentage)}%`;

        track.appendChild(bar);

        const value = document.createElement(
            "span"
        );

        value.className = "chart-value";

        value.textContent =
            `${percentage.toFixed(1)}%`;

        item.append(
            label,
            track,
            value
        );

        container.appendChild(item);

    });

}


/* =====================================================
   41. PRINT PAYMENT SUMMARY
===================================================== */

function printSummary() {

    renderReport();

    switchPage("summary");

    window.print();

}


/* =====================================================
   42. RENDER ALL APPLICATION SECTIONS
===================================================== */

function renderAll() {

    renderDashboard();

    renderCalculator();

    renderPayments();

    updatePlannerBalance();

    renderReport();

}


/* =====================================================
   43. EVENT LISTENERS
===================================================== */

function initializeEvents() {

    /* SIDEBAR */

    getElement(
        "menuToggle"
    ).addEventListener(
        "click",
        () => {

            const sidebar = getElement(
                "sidebar"
            );

            if (sidebar.classList.contains("open")) {

                closeSidebar();

            } else {

                openSidebar();

            }

        }
    );


    getElement(
        "sidebarOverlay"
    ).addEventListener(
        "click",
        closeSidebar
    );


    /* NAVIGATION */

    document.querySelectorAll(
        "[data-page]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                switchPage(
                    button.dataset.page
                );

            }
        );

    });


    document.querySelectorAll(
        "[data-open]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                switchPage(
                    button.dataset.open
                );

            }
        );

    });


    /* DARK MODE */

    getElement(
        "themeToggle"
    ).addEventListener(
        "click",
        toggleTheme
    );


    /* FEE FORM */

    getElement(
        "feeForm"
    ).addEventListener(
        "submit",
        event => {

            addFee(event);

            resetPlannerResults();

        }
    );


    /* CUSTOM CATEGORY */

    getElement(
        "feeCategory"
    ).addEventListener(
        "change",
        handleFeeCategoryChange
    );


    /* PAYMENT FORM */

    getElement(
        "paymentForm"
    ).addEventListener(
        "submit",
        event => {

            recordPayment(event);

            resetPlannerResults();

        }
    );


    /* INSTALMENT PLANNER */

    getElement(
        "plannerForm"
    ).addEventListener(
        "submit",
        calculateInstalments
    );


    /* STUDENT PROFILE */

    getElement(
        "profileForm"
    ).addEventListener(
        "submit",
        saveStudentProfile
    );


    /* PRINT REPORT */

    getElement(
        "printSummaryBtn"
    ).addEventListener(
        "click",
        printSummary
    );


    /* ESCAPE KEY */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                closeSidebar();

            }

        }
    );

}


/* =====================================================
   44. APPLICATION INITIALIZATION
===================================================== */

function initializeApp() {

    if (!Array.isArray(fees)) {
        fees = [];
    }

    if (!Array.isArray(payments)) {
        payments = [];
    }

    if (
        !studentProfile ||
        typeof studentProfile !== "object" ||
        Array.isArray(studentProfile)
    ) {

        studentProfile = {};

    }

    const savedTheme = loadData(
        STORAGE_KEYS.theme,
        "light"
    );

    applyTheme(
        savedTheme === "dark"
            ? "dark"
            : "light"
    );

    initializeEvents();

    setTodayDate();

    loadStudentProfile();

    renderAll();

    resetPlannerResults();

    switchPage("dashboard");

    console.log(
        "FeeWise initialized successfully."
    );

}


/* =====================================================
   45. START APPLICATION
===================================================== */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeApp
    );

} else {

    initializeApp();

}