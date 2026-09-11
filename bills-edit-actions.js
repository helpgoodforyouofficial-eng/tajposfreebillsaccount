// ============================================
// ✏️ BILLS EDIT ACTIONS — FINAL EDITION v4
// ============================================
// ✏️ EDIT MODE: "Save New Changes" button se save, naya number
//    auto (history-first). Print/Share edit ko naya bill NAHI banayenge.
// 👁️ VIEW MODE: 100% READ-ONLY LOCK! Koi field edit nahi ho sakti.
//    Print/PDF/JPG/Share sab chalenge — kuch save NAHI hoga.
// ============================================

let isEditModeActive = false;
let editingBillNo = null;
let isViewModeActive = false;
let viewingBillNo = null;

// 📅 Date ko browser format (YYYY-MM-DD) mein convert
function getDateForInput(dateStr) {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 2) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
}

// ============================================
// 🔒 VIEW MODE LOCK SYSTEM (Read-Only)
// ============================================

// 🔒 Bill ki har field ko LOCK karo (sirf dekhna, badalna mana!)
function lockFormForView() {
    // 1. Saare contenteditable (Name, Address, NTN, Note, Owner...) → false
    document.querySelectorAll('#bill-content [contenteditable="true"]').forEach(el => {
        el.setAttribute('data-was-editable', 'true');
        el.setAttribute('contenteditable', 'false');
    });

    // 2. Saare inputs (Date, Time, Qty, Rate, Paid...) → readOnly
    document.querySelectorAll('#bill-content input').forEach(inp => {
        if (inp.type === 'checkbox' || inp.type === 'radio') return;
        inp.setAttribute('data-was-editable', 'true');
        inp.readOnly = true;
    });

    // 3. "+ Add New Item" button hide
    const addBtn = document.querySelector('.btn-add');
    if (addBtn) addBtn.style.display = 'none';

    // 4. Item delete (✖) buttons hide
    document.querySelectorAll('#bill-content .rt-col-action').forEach(td => td.style.display = 'none');
}

// 🔓 Lock hatana (naye bill ke liye sab wapas editable)
function unlockForm() {
    document.querySelectorAll('#bill-content [data-was-editable]').forEach(el => {
        if (el.tagName === 'INPUT') {
            el.readOnly = false;
        } else {
            el.setAttribute('contenteditable', 'true');
        }
        el.removeAttribute('data-was-editable');
    });
    const addBtn = document.querySelector('.btn-add');
    if (addBtn) addBtn.style.display = '';
    document.querySelectorAll('#bill-content .rt-col-action').forEach(td => td.style.display = '');
}

// 🆕 View ke liye readonly styling (focus highlight band, halka tint)
(function injectViewStyles() {
    const s = document.createElement('style');
    s.textContent = `
        #bill-content input[readonly] { background: transparent !important; color: #555; }
        #bill-content [contenteditable="false"] { color: #333; }
    `;
    document.head.appendChild(s);
})();

/**
 * 1. EDIT MODE TOGGLE
 */
function toggleEditMode() {
    const isUrdu = (typeof currentLang !== 'undefined' && currentLang === 'rtl');

    if (isEditModeActive) {
        Swal.fire({
            title: isUrdu ? 'کیا آپ ایڈٹ کینسل کرنا چاہتے ہیں؟' : 'Cancel Editing?',
            text: isUrdu ? 'اس سے فارم نئے بل کے لیے ری سیٹ ہو جائے گا۔' : 'This will reset the form for a new bill.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: isUrdu ? 'جی ہاں، کینسل کریں' : 'Yes, Cancel',
            cancelButtonText: isUrdu ? 'نہیں۔ جاری رکھیں' : 'No, Keep Editing',
            reverseButtons: isUrdu
        }).then((result) => {
            if (result.isConfirmed) {
                isEditModeActive = false;
                editingBillNo = null;
                resetFormToNewBill();
                updateAllModeButtons();
            }
        });
    } else {
        // 🆕 View on tha to usay sahi tareeqe se band karo (unlock bhi)
        if (isViewModeActive) {
            isViewModeActive = false;
            viewingBillNo = null;
            resetFormToNewBill(); // unlock bhi iske andar hota hai
        }
        isEditModeActive = true;
        updateAllModeButtons();
    }
}

/**
 * 2. VIEW MODE TOGGLE
 */
function toggleViewMode() {
    const isUrdu = (typeof currentLang !== 'undefined' && currentLang === 'rtl');

    if (isViewModeActive) {
        isViewModeActive = false;
        viewingBillNo = null;
        resetFormToNewBill();
        updateAllModeButtons();
    } else {
        if (isEditModeActive) {
            Swal.fire({
                title: isUrdu ? 'پہلے ایڈٹ بند کریں' : 'Close Edit Mode First',
                text: isUrdu ? 'ایڈٹ اور ویو ایک ساتھ نہیں ہو سکتے۔' : 'Edit and View cannot be active together.',
                icon: 'info',
                confirmButtonText: isUrdu ? 'ٹھیک ہے' : 'OK'
            });
            return;
        }
        isViewModeActive = true;
        updateAllModeButtons();
    }
}

/**
 * 3. TEENO BUTTONS SYNC
 */
function updateAllModeButtons() {
    const isUrdu = (typeof currentLang !== 'undefined' && currentLang === 'rtl');

    if (typeof isDeleteSelectionActive !== 'undefined' && isDeleteSelectionActive) {
        isDeleteSelectionActive = false;
        const delToggleBtn = document.getElementById('btn-toggle-delete-mode');
        const delBtn = document.getElementById('btn-delete-selected');
        if (delToggleBtn) {
            delToggleBtn.innerText = isUrdu ? '🗑️ بل ڈیلیٹ کریں' : '🗑️ Delete Bill';
            delToggleBtn.style.background = '#e74c3c';
        }
        if (delBtn) delBtn.style.display = 'none';
    }

    const editBtn = document.getElementById('btn-edit-mode');
    if (editBtn) {
        editBtn.innerText = isEditModeActive
            ? (isUrdu ? '❌ ایڈٹ کینسل' : '❌ Cancel Edit')
            : (isUrdu ? '✏️ بل ایڈٹ کریں' : '✏️ Edit Bill');
        editBtn.style.background = isEditModeActive ? '#7f8c8d' : '#f39c12';
    }

    const viewBtn = document.getElementById('btn-view-mode');
    if (viewBtn) {
        viewBtn.innerText = isViewModeActive
            ? (isUrdu ? '❌ ویو کینسل' : '❌ Cancel View')
            : (isUrdu ? '👁️ بل دیکھیں' : '👁️ View Bill');
        viewBtn.style.background = isViewModeActive ? '#7f8c8d' : '#3498db';
    }

    if (typeof renderBillsHistory === 'function') {
        renderBillsHistory();
    }
}

function updateEditButtonState() {
    updateAllModeButtons();
}

/**
 * 4. FORM RESET (Naya bill ke liye — sab wapas editable)
 */
function resetFormToNewBill() {
    editingBillNo = null;
    viewingBillNo = null;
    isViewModeActive = false;

    // 🔓 Pehle lock hatao (agar view ka tha)
    unlockForm();

    const isUrdu = (typeof currentLang !== 'undefined' && currentLang === 'rtl');

    const tbody = document.getElementById("items");
    if (tbody) tbody.innerHTML = "";
    if (typeof addRow === 'function') addRow();

    const custNameEl = document.getElementById("cust-name-field");
    const custAddrEl = document.getElementById("cust-address-field");
    if (custNameEl) custNameEl.innerText = isUrdu ? "کاؤنٹر سیل" : "Counter Sale";
    if (custAddrEl) custAddrEl.innerText = "#";

    // Bill No: history-first se agla number
    if (typeof autoIncrementBillNo === 'function') {
        autoIncrementBillNo();
    } else {
        const lastBill = localStorage.getItem("last_bill_no");
        const billNoEl = document.getElementById("bill-no");
        if (billNoEl && lastBill) billNoEl.innerText = lastBill;
    }

    if (typeof setDateTime === 'function') setDateTime();

    const ntnEl = document.getElementById('ntn-field');
    const savedNTN = localStorage.getItem('ntn_value');
    if (ntnEl && savedNTN !== null) ntnEl.innerText = savedNTN;

    const noteEl = document.getElementById('note-body');
    const savedNote = localStorage.getItem(isUrdu ? 'custom_invoice_note_ur' : 'custom_invoice_note_en');
    if (noteEl && savedNote !== null) noteEl.innerText = savedNote;

    const prevBalField = document.getElementById("prev-bal-val");
    if (prevBalField) prevBalField.value = "0.00";
    const recInput = document.getElementById("paid");
    if (recInput) recInput.value = "0";

    const dateChk = document.querySelector("input[data-target='date-wrap']");
    const timeChk = document.querySelector("input[data-target='time-wrap']");
    const ntnChk = document.querySelector("input[data-target='ntn-wrap']");
    const discChk = document.getElementById("disc-master");
    const taxChk = document.getElementById("tax-master");
    const noteChk = document.getElementById("note-master");
    if (dateChk) dateChk.checked = true;
    if (timeChk) timeChk.checked = true;
    if (ntnChk) ntnChk.checked = false;
    if (discChk) discChk.checked = false;
    if (taxChk) taxChk.checked = false;
    if (noteChk) noteChk.checked = false;

    if (typeof applyToggles === 'function') applyToggles();
    if (typeof calc === 'function') calc();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 5. SHARED LOADER (Edit aur View dono yahan se load)
 */
function loadBillIntoForm(bill, billNo) {
    const billNoEl = document.getElementById("bill-no");
    const custNameEl = document.getElementById("cust-name-field");
    const custAddrEl = document.getElementById("cust-address-field");
    if (billNoEl) billNoEl.innerText = bill.billNo;
    if (custNameEl) custNameEl.innerText = bill.customer || "Counter Sale";
    if (custAddrEl) custAddrEl.innerText = bill.address || "#";

    if (bill.taxRate !== undefined) {
        const taxRateField = document.getElementById('tax-rate-field');
        if (taxRateField) {
            if (taxRateField.tagName === 'INPUT') taxRateField.value = bill.taxRate;
            else taxRateField.innerText = bill.taxRate;
        }
    }

    if (bill.config) {
        if (bill.config.layoutDirection && typeof toggleDirection === 'function') {
            toggleDirection(bill.config.layoutDirection);
        }

        if (bill.config.titleSize) {
            const radio = document.querySelector(`input[name='tsize'][value='${bill.config.titleSize}']`);
            if (radio) {
                radio.checked = true;
                if (typeof updateTitleSize === 'function') updateTitleSize(bill.config.titleSize);
            }
        }

        if (bill.config.paperSize) {
            const paperEl = document.getElementById("pageSize");
            if (paperEl) paperEl.value = bill.config.paperSize;
            if (typeof syncPaperSize === 'function') syncPaperSize(bill.config.paperSize);
        }

        if (bill.config.currencySymbol && typeof updateCurrencySymbol === 'function') {
            const curSelect = document.getElementById("currency");
            if (curSelect) curSelect.value = bill.config.currencyVal || bill.config.currencySymbol;
            updateCurrencySymbol(bill.config.currencySymbol);
        }

        if (bill.config.ownerName) {
            const ownerNameEl = document.getElementById("owner-name-field");
            if (ownerNameEl) ownerNameEl.innerText = bill.config.ownerName;
        }
        if (bill.config.ownerLabel) {
            const ownerLabelEl = document.getElementById("owner-label");
            if (ownerLabelEl) ownerLabelEl.innerText = bill.config.ownerLabel;
        }

        const dateChk = document.querySelector("input[data-target='date-wrap']");
        const timeChk = document.querySelector("input[data-target='time-wrap']");
        const ntnChk = document.querySelector("input[data-target='ntn-wrap']");
        const discChk = document.getElementById("disc-master");
        const taxChk = document.getElementById("tax-master");
        const noteChk = document.getElementById("note-master");
        if (dateChk) dateChk.checked = bill.config.showDate;
        if (timeChk) timeChk.checked = bill.config.showTime;
        if (ntnChk) ntnChk.checked = bill.config.showNtn;
        if (discChk) discChk.checked = bill.config.showDisc;
        if (taxChk) taxChk.checked = bill.config.showTax;
        if (noteChk) noteChk.checked = bill.config.showNote;
    }

    if (typeof applyToggles === 'function') applyToggles();

    // Date & Time Restore — toggleDirection ke BAAD
    const dateEl = document.getElementById("date-field");
    const timeEl = document.getElementById("time-field");
    if (dateEl && bill.dateVal) {
        const safeDate = getDateForInput(bill.dateVal);
        if (dateEl.tagName === "INPUT") {
            dateEl.value = safeDate;
        } else {
            dateEl.innerText = bill.dateVal;
        }
    }
    if (timeEl && bill.timeVal) {
        if (timeEl.tagName === "INPUT") timeEl.value = bill.timeVal;
        else timeEl.innerText = bill.timeVal;
    }

    // NTN Restore
    if (bill.ntn !== undefined && bill.ntn !== '') {
        const ntnFieldEl = document.getElementById('ntn-field');
        if (ntnFieldEl) ntnFieldEl.innerText = bill.ntn;
    }

    // Note Restore
    if (bill.noteContent) {
        const noteBodyEl = document.getElementById('note-body');
        if (noteBodyEl) noteBodyEl.innerText = bill.noteContent;
    }

    // Products Restore
    const tbody = document.getElementById("items");
    if (tbody) tbody.innerHTML = "";

    if (bill.products && bill.products.length > 0) {
        bill.products.forEach(prodStr => {
            const matchWithDisc = prodStr.match(/^(.*?)\s*\((\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)(?:\s*-\s*Disc:\s*(\d+(?:\.\d+)?))?\)$/);
            let name = prodStr;
            let qty = 1;
            let rate = 0;
            let disc = 0;
            if (matchWithDisc) {
                name = matchWithDisc[1].trim();
                qty = matchWithDisc[2];
                rate = matchWithDisc[3];
                disc = matchWithDisc[4] ? parseFloat(matchWithDisc[4]) : 0;
            }

            if (typeof addRow === 'function') addRow();

            const rows = document.querySelectorAll("#items tr");
            const lastRow = rows[rows.length - 1];
            if (lastRow) {
                const inputName = lastRow.querySelector(".item-input");
                const inputQty = lastRow.querySelector(".q");
                const inputRate = lastRow.querySelector(".r");
                const inputDisc = lastRow.querySelector(".d");
                if (inputName) inputName.value = name;
                if (inputQty) inputQty.value = qty;
                if (inputRate) inputRate.value = rate;
                if (inputDisc) inputDisc.value = disc;
            }
        });
    } else {
        if (typeof addRow === 'function') addRow();
    }

    // Balances
    const prevBalField = document.getElementById("prev-bal-val");
    if (prevBalField) {
        prevBalField.value = bill.previousBalance !== undefined ? bill.previousBalance : 0;
    }
    const recInput = document.getElementById("paid");
    if (recInput) {
        let cleanPaid = 0;
        if (bill.paidAmount) {
            cleanPaid = parseFloat(String(bill.paidAmount).replace(/[^0-9.-]/g, '')) || 0;
        }
        recInput.value = cleanPaid;
    }

    if (typeof calc === 'function') calc();

    // 🔒 VIEW MODE: Bill load hone ke BAAD sab LOCK!
    if (isViewModeActive) {
        lockFormForView();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 6. EDIT LOAD
 */
function loadBillToEdit(billNo) {
    if (typeof savedBillsLog === 'undefined') return;
    const bill = savedBillsLog.find(b => String(b.billNo) === String(billNo));
    if (!bill) return;

    const isUrdu = (typeof currentLang !== 'undefined' && currentLang === 'rtl');

    Swal.fire({
        title: isUrdu ? `بل نمبر ${billNo} ایڈٹ کریں؟` : `Edit Bill No. ${billNo}?`,
        text: isUrdu ? 'بل فارم میں لوڈ ہوگا — "Save New Changes" سے محفوظ کریں۔' : 'Bill will load — use "Save New Changes" button to save edits.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#f39c12',
        cancelButtonColor: '#95a5a6',
        confirmButtonText: isUrdu ? 'جی ہاں، لوڈ کریں' : 'Yes, Load It',
        cancelButtonText: isUrdu ? 'منسوخ کریں' : 'Cancel',
        reverseButtons: isUrdu
    }).then((result) => {
        if (result.isConfirmed) {
            editingBillNo = String(billNo);
            loadBillIntoForm(bill, billNo);

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    toast: true, position: 'top-end', showConfirmButton: false,
                    timer: 2500, timerProgressBar: true, icon: 'success',
                    title: isUrdu ? `بل نمبر ${billNo} ایڈٹ کے لیے لوڈ ہو گیا` : `Bill ${billNo} loaded — Ready to edit!`
                });
            }
        }
    });
}

/**
 * 7. VIEW LOAD
 */
function loadBillToView(billNo) {
    if (typeof savedBillsLog === 'undefined') return;
    const bill = savedBillsLog.find(b => String(b.billNo) === String(billNo));
    if (!bill) return;

    const isUrdu = (typeof currentLang !== 'undefined' && currentLang === 'rtl');

    Swal.fire({
        title: isUrdu ? `بل نمبر ${billNo} دیکھیں؟` : `View Bill No. ${billNo}?`,
        text: isUrdu ? 'بل ریڈ-اونلی (Read-Only) لوڈ ہوگا — پرنٹ، پی ڈی ایف، شیئر سب چلیں گے لیکن کوئی تبدیلی ممکن نہیں۔' : 'Bill loads in READ-ONLY mode — Print, PDF, Share all work but no changes possible.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3498db',
        cancelButtonColor: '#95a5a6',
        confirmButtonText: isUrdu ? 'جی ہاں، دیکھیں' : 'Yes, View It',
        cancelButtonText: isUrdu ? 'منسوخ کریں' : 'Cancel',
        reverseButtons: isUrdu
    }).then((result) => {
        if (result.isConfirmed) {
            viewingBillNo = String(billNo);
            loadBillIntoForm(bill, billNo);

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    toast: true, position: 'top-end', showConfirmButton: false,
                    timer: 2800, timerProgressBar: true, icon: 'info',
                    title: isUrdu ? `بل نمبر ${billNo} ریڈ-اونلی ویو میں — Read Only 🔒` : `Bill ${billNo} loaded in Read-Only View 🔒`
                });
            }
        }
    });
}

/**
 * 8. SAVE NEW CHANGES (Sirf edit mode se — view mein block!)
 */
function saveEditedBill() {
    const isUrdu = (typeof currentLang !== 'undefined' && currentLang === 'rtl');

    // 🆕 VIEW MODE GUARD — kabhi save nahi hoga
    if (isViewModeActive) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                toast: true, position: 'top-end', showConfirmButton: false,
                timer: 2500, icon: 'info',
                title: isUrdu ? 'ویو موڈ میں save نہیں ہوتا' : 'View Mode: saving is disabled'
            });
        }
        return;
    }

    if (!isEditModeActive || editingBillNo === null) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                toast: true, position: 'top-end', showConfirmButton: false,
                timer: 2000, icon: 'info',
                title: isUrdu ? 'کوئی ایڈٹ فعال نہیں ہے' : 'No active edit to save'
            });
        }
        return;
    }

    const entry = (typeof buildBillLog === 'function') ? buildBillLog() : null;
    if (!entry) return;

    const idx = savedBillsLog.findIndex(b => String(b.billNo) === String(editingBillNo));
    if (idx > -1) {
        savedBillsLog[idx] = entry;
    } else {
        savedBillsLog.unshift(entry);
    }
    localStorage.setItem("bills_history_log", JSON.stringify(savedBillsLog));

    const savedNo = entry.billNo;
    isEditModeActive = false;
    editingBillNo = null;

    if (typeof renderBillsHistory === 'function') renderBillsHistory();

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            toast: true, position: 'top-end', showConfirmButton: false,
            timer: 2500, timerProgressBar: true, icon: 'success',
            title: isUrdu ? `✅ نئی تبدیلیاں کامیابی سے محفوظ ہو گئیں (بل ${savedNo})` : `✅ New Changes Saved Successfully (Bill ${savedNo})`
        }).then(() => {
            resetFormToNewBill();
            updateAllModeButtons();
        });
    } else {
        alert(`New Changes Saved Successfully (Bill ${savedNo})`);
        resetFormToNewBill();
        updateAllModeButtons();
    }
}

/**
 * 9. COMPLETE BILL LOGGER
 */
function buildBillLog() {
    const billNo = document.getElementById("bill-no") ? document.getElementById("bill-no").innerText.trim() : "";
    const customer = document.getElementById("cust-name-field") ? document.getElementById("cust-name-field").innerText.trim() : "Counter Sale";
    const address = document.getElementById("cust-address-field") ? document.getElementById("cust-address-field").innerText.trim() : "#";
    const dateVal = document.getElementById("date-field") ? document.getElementById("date-field").value : "";
    const timeVal = document.getElementById("time-field") ? document.getElementById("time-field").value : "";
    const totalAmount = document.getElementById("total-val") ? document.getElementById("total-val").innerText : "0.00";
    const paidAmountVal = parseFloat(document.getElementById("paid")?.value) || 0;
    const balanceAmount = document.getElementById("bal-val") ? document.getElementById("bal-val").innerText : "0.00";
    const prevBalEl = document.getElementById("prev-bal-val");
    const prevBalanceVal = prevBalEl ? (parseFloat(prevBalEl.value) || 0) : 0;
    const taxRateField = document.getElementById('tax-rate-field');
    const taxRateVal = taxRateField ? (parseFloat(taxRateField.value || taxRateField.innerText) || 0) : 0;
    const currencySymbol = document.querySelector('.cur') ? document.querySelector('.cur').innerText : 'Rs';

    const ntnEl = document.getElementById('ntn-field');
    const ntnVal = ntnEl ? ntnEl.innerText.trim() : '';
    const noteEl = document.getElementById('note-body');
    const noteContentVal = noteEl ? noteEl.innerText : '';

    const showDate = document.querySelector("input[data-target='date-wrap']")?.checked ?? true;
    const showTime = document.querySelector("input[data-target='time-wrap']")?.checked ?? true;
    const showNtn = document.querySelector("input[data-target='ntn-wrap']")?.checked ?? false;
    const showDisc = document.getElementById("disc-master")?.checked ?? false;
    const showTax = document.getElementById("tax-master")?.checked ?? false;
    const showNote = document.getElementById("note-master")?.checked ?? false;

    const layoutDirection = typeof currentLang !== 'undefined' ? currentLang : 'ltr';
    const titleSizeRadio = document.querySelector("input[name='tsize']:checked");
    const titleSize = titleSizeRadio ? titleSizeRadio.value : 'title-large';
    const paperSizeEl = document.getElementById("pageSize");
    const paperSize = paperSizeEl ? paperSizeEl.value : 'A4';
    const currencyEl = document.getElementById("currency");
    const currencyVal = currencyEl ? currencyEl.value : currencySymbol;
    const ownerNameEl = document.getElementById("owner-name-field");
    const ownerLabelEl = document.getElementById("owner-label");
    const ownerName = ownerNameEl ? ownerNameEl.innerText.trim() : '';
    const ownerLabel = ownerLabelEl ? ownerLabelEl.innerText.trim() : '';

    let products = [];
    document.querySelectorAll("#items tr").forEach(row => {
        const nameEl = row.querySelector(".item-input");
        const qtyEl = row.querySelector(".q");
        const rateEl = row.querySelector(".r");
        const discEl = row.querySelector(".d");
        const name = nameEl ? nameEl.value.trim() : "";
        const qty = qtyEl ? qtyEl.value : 1;
        const rate = rateEl ? rateEl.value : 0;
        const disc = (showDisc && discEl) ? parseFloat(discEl.value) || 0 : 0;
        if (name) {
            if (disc > 0) products.push(`${name} (${qty}x${rate} - Disc: ${disc})`);
            else products.push(`${name} (${qty}x${rate})`);
        }
    });

    return {
        billNo, customer, address, dateVal, timeVal,
        ntn: ntnVal, noteContent: noteContentVal, taxRate: taxRateVal,
        products,
        totalAmount: currencySymbol + " " + totalAmount,
        paidAmount: currencySymbol + " " + paidAmountVal.toFixed(2),
        balanceAmount: currencySymbol + " " + balanceAmount,
        previousBalance: prevBalanceVal,
        config: {
            showDate, showTime, showNtn, showDisc, showTax, showNote,
            layoutDirection, titleSize, paperSize, currencyVal, currencySymbol,
            ownerName, ownerLabel
        }
    };
}

// ============================================
// 🔗 SMART INTEGRATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {

    // ---------------------------------------------------------
    // 📝 logBillToHistory OVERRIDE:
    // - EDIT: block + toast (Save New Changes button use karo)
    // - VIEW: chupchaap block (kuch save nahi hota)
    // - NEW: pehle jaisa
    // ---------------------------------------------------------
    if (typeof logBillToHistory !== 'undefined') {
        window.logBillToHistory = function() {
            if (isEditModeActive && editingBillNo !== null) {
                const isUrdu = (typeof currentLang !== 'undefined' && currentLang === 'rtl');
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        toast: true, position: 'top-end', showConfirmButton: false,
                        timer: 3500, timerProgressBar: true, icon: 'warning',
                        title: isUrdu
                            ? 'ایڈٹ موڈ: نیا گرین "Save New Changes" بٹن استعمال کریں'
                            : 'Edit Mode: Use green "Save New Changes" button instead'
                    });
                }
                return;
            }

            if (isViewModeActive) {
                return; // 👁️ view mein kuch save nahi hota
            }

            const entry = buildBillLog();
            const isDup = savedBillsLog.some(b =>
                b.billNo === entry.billNo &&
                b.customer === entry.customer &&
                b.totalAmount === entry.totalAmount
            );
            if (isDup) return;
            savedBillsLog.unshift(entry);
            localStorage.setItem("bills_history_log", JSON.stringify(savedBillsLog));
            if (typeof renderBillsHistory === 'function') renderBillsHistory();
        };
    }

    // ---------------------------------------------------------
    // 🆕 autoIncrementBillNo OVERRIDE — View mode mein Bill No
    //    KABHI change nahi hoga (print/PDF par wahi purana rahega!)
    // ---------------------------------------------------------
    if (typeof autoIncrementBillNo !== 'undefined') {
        const originalAutoInc = autoIncrementBillNo;
        window.autoIncrementBillNo = function() {
            if (isViewModeActive) {
                return; // 👁️ View: number lock hai!
            }
            originalAutoInc();
        };
    }

    // ---------------------------------------------------------
    // 👁️ VIEW MODE BANNER (wazeh message)
    // ---------------------------------------------------------
    const banner = document.createElement('div');
    banner.id = 'view-mode-banner';
    banner.style.cssText = 'display:none; position:fixed; top:0; left:0; right:0; z-index:99998; background:#3498db; color:white; padding:10px; text-align:center; font-weight:bold; font-family:sans-serif; box-shadow:0 2px 8px rgba(0,0,0,0.3);';
    document.body.appendChild(banner);

    setInterval(() => {
        const b = document.getElementById('view-mode-banner');
        if (!b) return;
        const isUrdu = (typeof currentLang !== 'undefined' && currentLang === 'rtl');
        if (isViewModeActive && viewingBillNo !== null) {
            b.innerText = isUrdu
                ? `👁️ ویو موڈ (Read-Only): بل نمبر ${viewingBillNo} — پرنٹ/پی ڈی ایف/شیئر سب چلیں گے، تبدیلی ممکن نہیں | باہر: "Cancel View"`
                : `👁️ View Mode (Read-Only): Bill ${viewingBillNo} — Print/PDF/Share all work, no changes possible | Exit: "Cancel View"`;
            b.style.display = 'block';
        } else {
            b.style.display = 'none';
        }
    }, 500);

    // ---------------------------------------------------------
    // 🗑️ clearAllBillsHistory (bilingual)
    // ---------------------------------------------------------
    window.clearAllBillsHistory = async function() {
        const isUrdu = (typeof currentLang !== 'undefined' && currentLang === 'rtl');
        if (!savedBillsLog || savedBillsLog.length === 0) {
            if (typeof showCustomAlert === 'function') {
                showCustomAlert("info", isUrdu ? "اطلاع" : "Info", isUrdu ? "ہسٹری پہلے سے ہی خالی ہے۔" : "History is already empty.");
            }
            return;
        }
        if (typeof showCustomConfirm === 'function') {
            const confirmed = await showCustomConfirm(
                isUrdu ? "تمام ہسٹری کا ریکارڈ ختم کریں؟" : "Clear ALL history?",
                isUrdu
                    ? `کیا آپ واقعی <b>تمام (${savedBillsLog.length}) بلز</b> کا ریکارڈ ہمیشہ کے لیے حذف کرنا چاہتے ہیں؟`
                    : `Permanently delete <b>ALL (${savedBillsLog.length}) bills</b> from history?`
            );
            if (confirmed) {
                savedBillsLog = [];
                localStorage.removeItem("bills_history_log");
                if (typeof renderBillsHistory === 'function') renderBillsHistory();
                if (typeof showCustomAlert === 'function') {
                    showCustomAlert("success", isUrdu ? "مکمل!" : "Done!", isUrdu ? "تمام بلز کا ریکارڈ ہٹا دیا گیا ہے۔" : "All bills removed.");
                }
            }
        }
    };

    // ---------------------------------------------------------
    // 💾 SAVE NEW CHANGES BUTTON (sirf EDIT mode mein dikhega —
    //    VIEW mein kabhi nahi!)
    // ---------------------------------------------------------
    const btnContainer = document.querySelector('.action-buttons');
    if (btnContainer && !document.getElementById('btn-save-changes')) {
        const saveBtn = document.createElement('button');
        saveBtn.id = 'btn-save-changes';
        saveBtn.className = 'btn no-print';
        saveBtn.style.background = '#27ae60';
        saveBtn.style.gridColumn = 'span 2';
        saveBtn.style.display = 'none';
        saveBtn.onclick = saveEditedBill;
        btnContainer.appendChild(saveBtn);
    }

    setInterval(() => {
        const saveBtn = document.getElementById('btn-save-changes');
        if (!saveBtn) return;
        const isUrdu = (typeof currentLang !== 'undefined' && currentLang === 'rtl');
        // ✅ SIRF EDIT MODE — view mein hidden
        if (isEditModeActive && editingBillNo !== null && !isViewModeActive) {
            saveBtn.innerText = isUrdu
                ? `💾 نئی تبدیلیاں محفوظ کریں (بل ${editingBillNo})`
                : `💾 Save New Changes (Bill ${editingBillNo})`;
            saveBtn.style.display = 'block';
        } else {
            saveBtn.style.display = 'none';
        }
    }, 500);
});