// ============================================
// 🔄 NEW BILL ORDER SYSTEM (new-bill-order.js) — v2
// ============================================
// ✅ COUNT-BASED TRIGGER:
//    1 select = 1 action = trigger
//    2 select = 2 actions = trigger
//    4 select = 4 actions = trigger
//    (Actions ka TYPE matter nahi — COUNT matter karta hai!)
// ✅ Min 1 lazmi (sab untick = JPG default)
// ✅ Auto-save setting, Edit/View safe, No popups
// ============================================

// -------------------------------------------
// ⚙️ SETTINGS
// -------------------------------------------
function getSelectedActions() {
    try {
        const s = JSON.parse(localStorage.getItem('new_bill_order'));
        if (Array.isArray(s) && s.length > 0) return s;
    } catch (e) {}
    return ['jpg']; // DEFAULT: Save JPG
}

// -------------------------------------------
// 🎨 UI INJECTION
// -------------------------------------------
(function injectNewBillOrderUI() {
    document.addEventListener('DOMContentLoaded', function() {
        const adminPanel = document.querySelector('.admin-panel');
        if (!adminPanel || document.getElementById('nb-order-grid')) return;

        const isUrdu = (typeof currentLang !== 'undefined' && currentLang === 'rtl');

        const grid = document.createElement('div');
        grid.className = 'config-grid';
        grid.id = 'nb-order-grid';
        grid.innerHTML = `
            <span class="config-item" style="flex-direction:column; align-items:flex-start; gap:6px;">
                <span>🔄 New Bill Order: <small style="color:#888; font-weight:normal;">(${isUrdu ? 'Jitne select, utne actions ke baad naya bill' : 'Selected count of actions = New Bill'})</small></span>
                <span style="display:flex; flex-wrap:wrap; gap:14px;">
                    <label class="config-item" style="cursor:pointer;"><input type="checkbox" id="nb-print"> 🖨️ Print</label>
                    <label class="config-item" style="cursor:pointer;"><input type="checkbox" id="nb-share"> 📤 Share</label>
                    <label class="config-item" style="cursor:pointer;"><input type="checkbox" id="nb-pdf"> 📄 Save PDF</label>
                    <label class="config-item" style="cursor:pointer;"><input type="checkbox" id="nb-jpg"> 🖼️ Save JPG</label>
                </span>
            </span>`;
        adminPanel.appendChild(grid);

        const sel = getSelectedActions();
        ['print', 'share', 'pdf', 'jpg'].forEach(a => {
            const cb = document.getElementById('nb-' + a);
            if (cb) {
                cb.checked = sel.includes(a);
                cb.addEventListener('change', onNbOrderChange);
            }
        });
    });
})();

function onNbOrderChange() {
    const actions = ['print', 'share', 'pdf', 'jpg'];
    const selected = [];
    actions.forEach(a => {
        const cb = document.getElementById('nb-' + a);
        if (cb && cb.checked) selected.push(a);
    });

    if (selected.length === 0) {
        const jpg = document.getElementById('nb-jpg');
        if (jpg) jpg.checked = true;
        selected.push('jpg');
        const isUrdu = (typeof currentLang !== 'undefined' && currentLang === 'rtl');
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                toast: true, position: 'top-end', showConfirmButton: false,
                timer: 2200, icon: 'info',
                title: isUrdu ? 'کم از کم ایک آپشن ضروری ہے — Save JPG سیٹ کر دیا' : 'At least 1 option required — Save JPG set'
            });
        }
    }

    localStorage.setItem('new_bill_order', JSON.stringify(selected));
}

// -------------------------------------------
// 🎯 TRIGGER ENGINE — v2: COUNT-BASED! 🆕
// -------------------------------------------
let nbActionCount = 0; // Kitne actions complete hue is bill par

function markBillAction(action) {
    // 🛡️ Edit/View mode mein trigger KABHI nahi
    if (typeof isEditModeActive !== 'undefined' && isEditModeActive) return;
    if (typeof isViewModeActive !== 'undefined' && isViewModeActive) return;

    const selected = getSelectedActions();
    if (!selected.includes(action)) return; // ye action setting ka hissa nahi

    nbActionCount++; // 🆕 Count barhao (type koi bhi ho!)

    // 🎯 Kya required count poora hua?
    // (2 select = 2 actions chahiye, 4 select = 4 actions chahiye)
    if (nbActionCount >= selected.length) {
        nbActionCount = 0; // agle bill ke liye reset
        freshBillAuto();
    } else {
        // Chota hint: kitne baqi hain
        const isUrdu = (typeof currentLang !== 'undefined' && currentLang === 'rtl');
        const remaining = selected.length - nbActionCount;
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                toast: true, position: 'top-end', showConfirmButton: false,
                timer: 1800, icon: 'info',
                title: isUrdu
                    ? `(${nbActionCount}/${selected.length}) — ${remaining} action baqi hai naye bill se pehle`
                    : `(${nbActionCount}/${selected.length}) — ${remaining} more action(s) before new bill`
            });
        }
    }
}

// -------------------------------------------
// 🆕 FRESH BILL AUTO
// -------------------------------------------
function freshBillAuto() {
    const isUrdu = (typeof currentLang !== 'undefined' && currentLang === 'rtl');

    const tbody = document.getElementById("items");
    if (tbody) tbody.innerHTML = "";
    if (typeof addRow === 'function') addRow();

    const custNameEl = document.getElementById("cust-name-field");
    const custAddrEl = document.getElementById("cust-address-field");
    if (custNameEl) custNameEl.innerText = isUrdu ? "کاؤنٹر سیل" : "Counter Sale";
    if (custAddrEl) custAddrEl.innerText = "#";

    const prevBalField = document.getElementById("prev-bal-val");
    if (prevBalField) prevBalField.value = "0.00";
    const recInput = document.getElementById("paid");
    if (recInput) recInput.value = "0";

    const ntnChk = document.querySelector("input[data-target='ntn-wrap']");
    const discChk = document.getElementById("disc-master");
    const taxChk = document.getElementById("tax-master");
    const noteChk = document.getElementById("note-master");
    if (ntnChk) ntnChk.checked = false;
    if (discChk) discChk.checked = false;
    if (taxChk) taxChk.checked = false;
    if (noteChk) noteChk.checked = false;

    if (typeof applyToggles === 'function') applyToggles();

    // NAYA NUMBER (history-first)
    if (typeof autoIncrementBillNo === 'function') autoIncrementBillNo();

    // Fresh Date & Time
    if (typeof setDateTime === 'function') setDateTime();

    if (typeof calc === 'function') calc();

    const billNoEl = document.getElementById("bill-no");
    const newNo = billNoEl ? billNoEl.innerText : '';
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            toast: true, position: 'top-end', showConfirmButton: false,
            timer: 2200, timerProgressBar: true, icon: 'success',
            title: isUrdu ? `🆕 نیا بل تیار — نمبر ${newNo}` : `🆕 New Bill Ready — No. ${newNo}`
        });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// 🔗 ACTION HOOKS (4 buttons — Bill apne number ke sath capture!)
// ============================================

// 🖨️ PRINT
window.applyPrint = function() {
    if (typeof captureCustomerName === 'function') captureCustomerName();
    if (typeof logBillToHistory === 'function') logBillToHistory();
    if (typeof gtag === 'function') gtag("event", "bill_generated", { "event_category": "Engagement", "event_label": "Invoice Printed" });

    const size = document.getElementById('pageSize').value;
    const wrapper = document.getElementById("bill-content");

    if (size === "80mm") { wrapper.style.width = "80mm"; wrapper.style.margin = "0 auto"; }
    else if (size === "A5") { wrapper.style.width = "148mm"; wrapper.style.margin = "0 auto"; }
    else if (size === "Legal") { wrapper.style.width = "216mm"; wrapper.style.margin = "0 auto"; }
    else if (size === "custom") { wrapper.style.width = document.getElementById("custW").value + "mm"; wrapper.style.margin = "0 auto"; }
    else { wrapper.style.width = "100%"; wrapper.style.margin = "0"; }

    document.getElementById("printModal").style.display = "none";

    setTimeout(() => {
        window.print();
        markBillAction('print');
        setTimeout(() => { wrapper.style.width = "100%"; wrapper.style.margin = "auto"; }, 1000);
    }, 500);
};

// 📤 SHARE
window.shareBill = async function() {
    if (typeof captureCustomerName === 'function') captureCustomerName();
    if (typeof logBillToHistory === 'function') logBillToHistory();
    if (typeof gtag === 'function') gtag("event", "bill_shared", { "event_category": "Engagement", "event_label": "Invoice Shared" });

    const billContent = document.getElementById('bill-content');
    const elementsToHide = document.querySelectorAll('.no-print, .rt-col-action, .editable-text-container, .editable-input-container');

    billContent.classList.add('force-pc-layout');
    elementsToHide.forEach(el => {
        if (el.classList.contains('editable-text-container') || el.classList.contains('editable-input-container')) {
            el.style.paddingRight = '0';
            el.style.setProperty('--show-pencil', 'none');
        } else { el.style.display = 'none'; }
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        const canvas = await html2canvas(billContent, { scale: 3, useCORS: true, width: 800 });
        const dataUrl = canvas.toDataURL('image/jpeg');

        if (navigator.share && navigator.canShare) {
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], 'Invoice.jpg', { type: 'image/jpeg' });
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: 'Invoice Bill' });
            } else {
                const link = document.createElement('a');
                link.download = 'Invoice.jpg'; link.href = dataUrl; link.click();
            }
        } else {
            const link = document.createElement('a');
            link.download = 'Invoice.jpg'; link.href = dataUrl; link.click();
        }
    } catch (shareErr) {
        if (!(shareErr && shareErr.name === 'AbortError')) {
            console.error("Sharing failed", shareErr);
        }
    }

    billContent.classList.remove('force-pc-layout');
    elementsToHide.forEach(el => {
        if (el.classList.contains('editable-text-container') || el.classList.contains('editable-input-container')) {
            el.style.paddingRight = ''; el.style.removeProperty('--show-pencil');
        } else { el.style.display = ''; }
    });

    markBillAction('share');
};

// 📄🖼️ DOWNLOAD
window.downloadFile = async function(formatType) {
    if (typeof captureCustomerName === 'function') captureCustomerName();
    if (typeof logBillToHistory === 'function') logBillToHistory();
    if (typeof gtag === 'function') gtag("event", "bill_downloaded", { "event_category": "Engagement", "event_label": "Invoice Downloaded" });

    const billContent = document.getElementById('bill-content');
    const elementsToHide = document.querySelectorAll('.no-print, .rt-col-action, .editable-text-container, .editable-input-container');

    billContent.classList.add('force-pc-layout');
    elementsToHide.forEach(el => {
        if (el.classList.contains('editable-text-container') || el.classList.contains('editable-input-container')) {
            el.style.paddingRight = '0'; el.style.setProperty('--show-pencil', 'none');
        } else { el.style.display = 'none'; }
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        const canvas = await html2canvas(billContent, { scale: 3, useCORS: true, width: 800 });

        if (formatType === 'jpg') {
            const link = document.createElement('a');
            link.download = 'Bill.jpg'; link.href = canvas.toDataURL('image/jpeg'); link.click();
        } else {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            pdf.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', 0, 0, 210, (canvas.height * 210) / canvas.width);
            pdf.save('Invoice.pdf');
        }

        billContent.classList.remove('force-pc-layout');
        elementsToHide.forEach(el => {
            if (el.classList.contains('editable-text-container') || el.classList.contains('editable-input-container')) {
                el.style.paddingRight = ''; el.style.removeProperty('--show-pencil');
            } else { el.style.display = ''; }
        });

        markBillAction(formatType === 'jpg' ? 'jpg' : 'pdf');
    } catch (err) {
        billContent.classList.remove('force-pc-layout');
        elementsToHide.forEach(el => {
            if (el.classList.contains('editable-text-container') || el.classList.contains('editable-input-container')) {
                el.style.paddingRight = ''; el.style.removeProperty('--show-pencil');
            } else { el.style.display = ''; }
        });
        console.error('Download failed:', err);
    }
};