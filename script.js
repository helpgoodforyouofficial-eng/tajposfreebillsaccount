// ============================================
// 📊 GOOGLE ANALYTICS CONFIG
// ============================================
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'AW-1084371XXXX');
gtag('config', 'G-MM1128NLL1');

// --- PWA Service Worker Registration & Prompt Logic ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('Service Worker registered!'))
        .catch(err => console.log('Service Worker registration failed: ', err));
    });
}

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBanner = document.getElementById('pwa-install-btn');
    if (installBanner) {
        installBanner.style.setProperty('display', 'flex', 'important');
    }
});

document.addEventListener("DOMContentLoaded", function() {
    const actualBtn = document.getElementById('pwa-actual-install-click');
    const installBanner = document.getElementById('pwa-install-btn');

    if (actualBtn) {
        actualBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            deferredPrompt = null;
            if (installBanner) installBanner.style.setProperty('display', 'none', 'important');
        });
    }
});

window.addEventListener('appinstalled', (evt) => {
    console.log('PWA was successfully installed!');
    const installBanner = document.getElementById('pwa-install-btn');
    if (installBanner) {
        installBanner.style.setProperty('display', 'none', 'important');
    }
});

// --- Initializations & Variables ---
let savedItems = JSON.parse(localStorage.getItem("inventory")) || [];
let savedCustomers = JSON.parse(localStorage.getItem("customer_profiles")) || [{"name": "Counter Sale", "address": "#"}];
let savedBillsLog = JSON.parse(localStorage.getItem("bills_history_log")) || [];

// NOTE DEFAULT TEXTS (English + Urdu dono)
const NOTE_TEXTS = {
    en: "1. Please clear the bill amount within 7 days.\n2. Kindly check the expiry of the items on the spot.\n3. The distribution is not responsible for any personal transactions with the salesman.\n4. For expired items claim, please inform us 1 month in advance.",
    ur: "1. براہ کرم بل کی رقم 7 دنوں کے اندر ادا کریں۔\n2. براہ کرم سامان کی تاریخِ انقضا فوراً چیک کر لیں۔\n3. سیلزمین کے ساتھ کسی ذاتی لین دین کی ذمہ داری ڈسٹری بیوشن پر نہیں ہوگی۔\n4. ایکسپائرڈ اشیاء کے دعوے کے لیے ہمیں ایک ماہ پہلے اطلاع دیں۔"
};

// 🆕 v74: OWNER LABEL DEFAULTS (English = Owner, Urdu = اونر)
const OWNER_DEFAULTS = { en: 'Owner', ur: 'اونر' };

let currentLang = 'ltr';

// SAVED LANGUAGE LOAD (Refresh ke baad wohi language rahegi)
(function initLanguage() {
    const saved = localStorage.getItem('app_language');
    if (saved === 'rtl' || saved === 'ltr') currentLang = saved;
    const selectEl = document.getElementById('layoutDirection');
    if (selectEl) selectEl.value = currentLang;
})();

// RTL mode me customer-info right align (mobile CSS override)
(function injectRTLStyle() {
    const s = document.createElement('style');
    s.textContent = '[dir="rtl"] .customer-info-wrap, [dir="rtl"] .customer-info-wrap * { text-align: right !important; }';
    document.head.appendChild(s);
})();

// Date & Time Auto-Set Function
/**
 * current Date اور Time کو فارم اور بل میں صحیح فارمیٹ (DD-MM-YYYY) کے ساتھ انجیکٹ کرنا
 */
function setDateTime() {
    const now = new Date();

    // 1. Format Date to DD-MM-YYYY
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    
    // DD-MM-YYYY format
    const currentDate = `${day}-${month}-${year}`;

    // 2. Format Time to HH:MM (24-hour)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;

    // Elements injection check (Input vs Text/Span)
    const dateEl = document.getElementById("date-field");
    const timeEl = document.getElementById("time-field");

    if (dateEl) {
        if (dateEl.tagName === 'INPUT') {
            // اگر input type="date" ہے تو براؤزر YYYY-MM-DD کو ہی سپورٹ کرتا ہے
            if (dateEl.type === 'date') {
                dateEl.value = `${year}-${month}-${day}`;
            } else {
                dateEl.value = currentDate;
            }
        } else {
            dateEl.innerText = currentDate;
        }
    }

    if (timeEl) {
        if (timeEl.tagName === 'INPUT') timeEl.value = currentTime;
        else timeEl.innerText = currentTime;
    }
}


// SAFE TEXT REPLACER (Sirf text nodes badalta hai — listeners destroy NAHI hote)
function replaceTexts(root, pairs) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
        let txt = node.nodeValue;
        let newTxt = txt;
        pairs.forEach(p => { newTxt = newTxt.split(p[0]).join(p[1]); });
        if (newTxt !== txt) node.nodeValue = newTxt;
    }
}

// 🆕 v74: OWNER LABEL / NAME & NTN LOAD (Per-language label save support)
function getOwnerLabelKey() {
    return (currentLang === 'rtl') ? 'owner_label_ur' : 'owner_label_en';
}

function loadOwnerFields() {
    const labelEl = document.getElementById('owner-label');
    const nameEl = document.getElementById('owner-name-field');
    const ntnEl = document.getElementById('ntn-field');

    if (labelEl) {
        const saved = localStorage.getItem(getOwnerLabelKey());
        labelEl.innerText = (saved !== null && saved.trim() !== '')
            ? saved
            : (currentLang === 'rtl' ? OWNER_DEFAULTS.ur : OWNER_DEFAULTS.en);
    }
    if (nameEl) {
        const savedName = localStorage.getItem('owner_name_value');
        if (savedName !== null) nameEl.innerText = savedName;
    }
    if (ntnEl) {
        const savedNTN = localStorage.getItem('ntn_value');
        if (savedNTN !== null) ntnEl.innerText = savedNTN;
    }
}

// --- Functions ---
function syncPaperSize(val) {
    const pageSizeEl = document.getElementById('pageSize');
    const topCustomDimsEl = document.getElementById('topCustomDims');
    const customDimsEl = document.getElementById('customDims');

    if(pageSizeEl) pageSizeEl.value = val;
    if(topCustomDimsEl) topCustomDimsEl.style.display = val === 'custom' ? 'inline-block' : 'none';
    if(customDimsEl) customDimsEl.style.display = val === 'custom' ? 'block' : 'none';
}

// QR Code Initialization
if(document.getElementById("qrcode")) {
    (function(siteUrl){
        new QRCode(document.getElementById("qrcode"), { text: siteUrl, width: 60, height: 60 });
    })("https://freebills.netlify.app/");
}

function updateTitleSize(sizeValue){
    const mainTitleEl = document.getElementById("main-title");
    if(mainTitleEl) {
        mainTitleEl.className = "biz-name " + sizeValue;
    }
}

// 🌐 Dynamic Language & Direction Switcher
function toggleDirection(dir) {
    currentLang = dir;

    // Language ko localStorage me SAVE karo
    localStorage.setItem('app_language', dir);
    const selectEl = document.getElementById('layoutDirection');
    if (selectEl) selectEl.value = dir;

    const billContainer = document.getElementById('bill-content');
    if (!billContainer) return;

    const isUrdu = (dir === 'rtl');

    billContainer.setAttribute('dir', dir);
    billContainer.style.textAlign = isUrdu ? 'right' : 'left';

    // Business Address Label
    const bizAddrLabel = document.getElementById('biz-addr-label');
    if (bizAddrLabel) bizAddrLabel.innerText = isUrdu ? 'پتہ:' : 'Address:';

    // Mobile Label
    const bizMobileLabel = document.getElementById('biz-mobile-label') ||
                           document.getElementById('mobile-label') ||
                           document.getElementById('biz-phone-label');
    if (bizMobileLabel) bizMobileLabel.innerText = isUrdu ? 'موبائل:' : 'Mobile:';

    // 🆕 v74: Owner Label load (saved label ya default — har language apna yaad rakhti hai)
    loadOwnerFields();

    // SAFE Label Translation
    const pairs = isUrdu ? [
        ["Customer:", "گاہک کا نام:"],
        ["Address:", "پتہ:"],
        ["Date:", "تاریخ:"],
        ["Time:", "وقت:"],
        ["Bill No:", "بل نمبر:"],
        ["Note / Terms:", "نوٹ / شرائط:"]
    ] : [
        ["گاہک کا نام:", "Customer:"],
        ["پتہ:", "Address:"],
        ["تاریخ:", "Date:"],
        ["وقت:", "Time:"],
        ["بل نمبر:", "Bill No:"],
        ["نوٹ / شرائط:", "Note / Terms:"]
    ];
    replaceTexts(billContainer, pairs);

    // Customer Name & Address fields ka direction (RTL/LTR + cursor)
    const custNameField = document.getElementById('cust-name-field');
    const custAddrField = document.getElementById('cust-address-field');
    if (custNameField) {
        custNameField.setAttribute('dir', isUrdu ? 'rtl' : 'ltr');
        custNameField.style.direction = isUrdu ? 'rtl' : 'ltr';
        custNameField.style.removeProperty('text-align');
        custNameField.style.setProperty('text-align', isUrdu ? 'right' : 'left');
    }
    if (custAddrField) {
        custAddrField.setAttribute('dir', isUrdu ? 'rtl' : 'ltr');
        custAddrField.style.direction = isUrdu ? 'rtl' : 'ltr';
        custAddrField.style.removeProperty('text-align');
        custAddrField.style.setProperty('text-align', isUrdu ? 'right' : 'left');
    }

    // Note Box — Content + Direction per language
    const noteBody = document.getElementById('note-body');
    if (noteBody) {
        const noteKey = isUrdu ? 'custom_invoice_note_ur' : 'custom_invoice_note_en';
        let noteTxt = localStorage.getItem(noteKey);
        if (noteTxt === null && !isUrdu) {
            const legacy = localStorage.getItem('custom_invoice_note');
            noteTxt = (legacy !== null) ? legacy : NOTE_TEXTS.en;
        } else if (noteTxt === null) {
            noteTxt = NOTE_TEXTS.ur;
        }
        noteBody.innerText = noteTxt;
        noteBody.setAttribute('dir', isUrdu ? 'rtl' : 'ltr');
        noteBody.style.direction = isUrdu ? 'rtl' : 'ltr';
        noteBody.style.removeProperty('text-align');
        noteBody.style.setProperty('text-align', isUrdu ? 'right' : 'left');
    }

    // Default Customer Name
    const custNameDef = document.getElementById('cust-name-field');
    if (custNameDef && (custNameDef.innerText.trim() === "Counter Sale" || custNameDef.innerText.trim() === "کاؤنٹر سیل")) {
        custNameDef.innerText = isUrdu ? "کاؤنٹر سیل" : "Counter Sale";
    }

    // Invoice Title
    const invH1 = billContainer.querySelector('h1');
    if (invH1) invH1.innerText = isUrdu ? "بل / انوائس" : "INVOICE";

    // Table Headers (FIXED: Handles both 6 columns and 5 columns when Disc is unchecked)
    const ths = billContainer.querySelectorAll('table thead th');
    if (ths.length >= 6) {
        ths[0].innerText = isUrdu ? "نمبر" : "#";
        ths[1].innerText = isUrdu ? "تفصیلِ سامان" : "Description";
        ths[2].innerText = isUrdu ? "تعداد" : "Qty";
        ths[3].innerText = isUrdu ? "قیمت" : "Rate";
        ths[4].innerText = isUrdu ? "رعایت" : "Disc";
        ths[5].innerText = isUrdu ? "کل قیمت" : "Total";
    } else if (ths.length === 5) {
        ths[0].innerText = isUrdu ? "نمبر" : "#";
        ths[1].innerText = isUrdu ? "تفصیلِ سامان" : "Description";
        ths[2].innerText = isUrdu ? "تعداد" : "Qty";
        ths[3].innerText = isUrdu ? "قیمت" : "Rate";
        ths[4].innerText = isUrdu ? "کل قیمت" : "Total";
    }

    // Add Button & Placeholders
    const btnAdd = document.querySelector('.btn-add');
    if (btnAdd) btnAdd.innerText = isUrdu ? "+ نیا آئٹم شامل کریں" : "+ Add New Item";

    document.querySelectorAll('.item-input').forEach(inp => {
        inp.placeholder = isUrdu ? "آئٹم کا نام..." : "Item Name...";
    });

    // Totals Table
    const sumTable = document.querySelector('.sum-table');
    if (sumTable) {
        const rows = sumTable.querySelectorAll('tr');
        if (rows[0]) rows[0].cells[0].innerText = isUrdu ? "ٹوٹل رقم:" : "Sub Total:";
        if (rows[1]) rows[1].cells[0].innerText = isUrdu ? "رعایت (ڈسکاؤنٹ):" : "Discount:";
        if (rows[3]) rows[3].cells[0].innerText = isUrdu ? "کل واجب الادا:" : "Grand Total:";
        if (rows[4]) rows[4].cells[0].innerText = isUrdu ? "سابقہ بقایا:" : "Previous Balance:";
        if (rows[5]) rows[5].cells[0].innerText = isUrdu ? "وصول شدہ:" : "Received:";
        if (rows[6]) rows[6].cells[0].innerText = isUrdu ? "کل بقایا رقم:" : "Total Pending Balance:";
    }

    // Footer Signature & Disclaimer
    const sigDiv = billContainer.querySelector('.footer-area div[style*="border-top"]');
    if (sigDiv) sigDiv.innerText = isUrdu ? "دستخط" : "Signature";

    const disclaimer = billContainer.querySelector('.no-challenge-disclaimer');
    if (disclaimer) {
        disclaimer.innerHTML = isUrdu
            ? "یہ مرشد ٹریڈرز کا ای-بل قانونی حیثیت نہیں رکھتا۔ <br>کسی عدالت میں پیش نہیں کیا جا سکتا۔"
            : "This Free Bills E-Bill: Not legally binding. <br>Cannot be challenged in any court.";
    }

    // Language change par bhi Date & Time fresh set
    setDateTime();
}



function updateCurrencySymbol(symbol) {
    document.querySelectorAll('.cur').forEach(el => { el.innerText = symbol; });
}

function handleCurrencyChange(selectedValue) {
    if (selectedValue === 'custom') {
        let customSymbol = prompt("Enter Country or Currency symbol:", "");
        if (customSymbol && customSymbol.trim() !== "") {
            let selectBox = document.getElementById('currency');
            let newOption = document.createElement('option');
            newOption.value = customSymbol; newOption.text = customSymbol; newOption.selected = true;
            selectBox.add(newOption, selectBox.options[selectBox.options.length - 1]);
            updateCurrencySymbol(customSymbol);
        } else {
            document.getElementById('currency').value = 'Rs';
            updateCurrencySymbol('Rs');
        }
    } else { updateCurrencySymbol(selectedValue); }
}

function addRow() {
    const tbody = document.getElementById('items');
    if (!tbody) return;

    const tr = document.createElement('tr');
    const rowCount = tbody.rows.length + 1;

    const placeholderText = (typeof currentLang !== 'undefined' && currentLang === 'rtl') ? 'آئٹم کا نام...' : 'Item Name...';

    tr.innerHTML = `
        <td>${rowCount}</td>
        <td>
            <div class="editable-input-container">
                <input type="text" placeholder="${placeholderText}" class="item-input" autocomplete="off">
            </div>
            <div class="suggestion-container"></div>
        </td>
        <td><div class="editable-input-container"><input type="number" class="q" value="1" oninput="calc()" onclick="this.select()" style="text-align:center; font-weight:bold;"></div></td>
        <td><div class="editable-input-container"><input type="number" class="r" value="0" oninput="calc()" onclick="this.select()" style="text-align:right; font-weight:bold;"></div></td>
        <td class="col-disc"><div class="editable-input-container"><input type="number" class="d" value="0" oninput="calc()" onclick="this.select()" style="text-align:right; font-weight:bold;"></div></td>
        
        <!-- Total Column (Only Total Amount) -->
        <td style="text-align:right; font-weight:bold;" class="rt">0.00</td>
        
                <!-- Separate Action Column (Only Delete Button) -->
        <td class="no-print rt-col-action" style="text-align:center; width:5%;">
            <button class="delete-btn" onclick="this.closest('tr').remove(); reIndex(); calc();">✖</button>
        </td>`;

    tbody.appendChild(tr);

    const input = tr.querySelector('.item-input');
    const suggestBox = tr.querySelector('.suggestion-container');

    // 1. Auto-suggestion Input Listener
    input.addEventListener('input', function() {
        const val = this.value.toLowerCase();
        suggestBox.innerHTML = '';
        if (val.length > 0 && typeof savedItems !== 'undefined') {
            const matches = savedItems.filter(i => i.toLowerCase().includes(val));
            if (matches.length > 0) {
                suggestBox.style.display = 'block';
                matches.forEach(m => {
                    const div = document.createElement('div');
                    div.className = 'suggestion-item';
                    div.innerText = m;
                    div.onclick = function() { input.value = m; suggestBox.style.display = 'none'; calc(); };
                    suggestBox.appendChild(div);
                });
            } else { suggestBox.style.display = 'none'; }
        } else { suggestBox.style.display = 'none'; }
        calc();
    });

    // 2. Blur Listener (Inventory Auto-Save)
    input.addEventListener('blur', function() {
        setTimeout(() => { suggestBox.style.display = 'none'; }, 200);
        const val = this.value.trim();
        if (val && typeof savedItems !== 'undefined' && !savedItems.includes(val)) {
            savedItems.push(val);
            localStorage.setItem('inventory', JSON.stringify(savedItems));
        }
    });

    // 3. Focus & Layout Configurations
    input.focus();
    if (typeof applyToggles === 'function') applyToggles();
    if (typeof calc === 'function') calc();
}


function reIndex() {
    document.querySelectorAll("#items tr").forEach(function(row, idx) {
        row.cells[0].innerText = idx + 1;
    });
}

function calc() {
    let subTotal = 0, discountTotal = 0;

    const discMaster = document.getElementById('disc-master');
    const isDiscountActive = discMaster ? discMaster.checked : false;

    document.querySelectorAll("#items tr").forEach(row => {
        const qty = parseFloat(row.querySelector(".q").value) || 0;
        const rate = parseFloat(row.querySelector(".r").value) || 0;
        const disc = isDiscountActive ? (parseFloat(row.querySelector(".d").value) || 0) : 0;
        const total = (qty * rate) - disc;

        row.querySelector(".rt").innerText = total.toFixed(2);
        subTotal += (qty * rate);
        discountTotal += disc;
    });

    document.getElementById("sub-val").innerText = subTotal.toFixed(2);

    const discAmtField = document.getElementById("disc-amt");
    if (discAmtField) {
        discAmtField.innerText = discountTotal.toFixed(2);
    }

    let taxAmount = 0;
    const taxMaster = document.getElementById('tax-master');
    const taxRateField = document.getElementById('tax-rate-field');
    const taxAmountField = document.getElementById('tax-amount');

    if (taxMaster && taxMaster.checked && taxRateField) {
        const taxPercent = parseFloat(taxRateField.innerText) || parseFloat(taxRateField.value) || 0;
        const taxableAmount = subTotal - discountTotal;
        taxAmount = (taxableAmount * taxPercent) / 100;
    }

    if (taxAmountField) {
        taxAmountField.innerText = taxAmount.toFixed(2);
    }

    const grandTotal = (subTotal - discountTotal) + taxAmount;
    document.getElementById("total-val").innerText = grandTotal.toFixed(2);

    const prevBalField = document.getElementById("prev-bal-val");
    const previousBalance = prevBalField ? (parseFloat(prevBalField.value) || 0) : 0;

    const paidInput = document.getElementById("paid");
    const paid = parseFloat(paidInput ? paidInput.value : 0) || 0;
    const balance = (grandTotal + previousBalance) - paid;

    const balValField = document.getElementById("bal-val");
    if (balValField) {
        balValField.innerText = balance.toFixed(2);
    }
}

function captureCustomerName() {
    const custSpan = document.getElementById("cust-name-field");
    const addrDiv = document.getElementById("cust-address-field");
    if (custSpan && addrDiv) {
        const custName = custSpan.innerText.trim();
        const custAddr = addrDiv.innerText.trim();
        if (custName && custName !== "" && custName !== "Counter Sale" && custName !== "کاؤنٹر سیل") {
            const existingIdx = savedCustomers.findIndex(c => c.name.toLowerCase() === custName.toLowerCase());
            if (existingIdx > -1) {
                savedCustomers[existingIdx].address = custAddr;
            } else {
                savedCustomers.push({ name: custName, address: custAddr });
            }
            localStorage.setItem("customer_profiles", JSON.stringify(savedCustomers));
        }
    }
}

// --- Bill Logging Logic (With Time & Tax Support) ---
function logBillToHistory() {
    const billNo = document.getElementById("bill-no") ? document.getElementById("bill-no").innerText.trim() : "";
    const customer = document.getElementById("cust-name-field") ? document.getElementById("cust-name-field").innerText.trim() : "Counter Sale";
    const address = document.getElementById("cust-address-field") ? document.getElementById("cust-address-field").innerText.trim() : "#";
    
    // Date & Time Capture
    const dateVal = document.getElementById("date-field") ? document.getElementById("date-field").value : "";
    const timeVal = document.getElementById("time-field") ? document.getElementById("time-field").value : "";

    const totalAmount = document.getElementById("total-val") ? document.getElementById("total-val").innerText : "0.00";
    const paidAmountVal = parseFloat(document.getElementById("paid")?.value) || 0;
    const balanceAmount = document.getElementById("bal-val") ? document.getElementById("bal-val").innerText : "0.00";
    
    // Previous Balance Extract
    const prevBalEl = document.getElementById("prev-bal-val");
    const prevBalanceVal = prevBalEl ? (parseFloat(prevBalEl.value) || 0) : 0;

    // Tax Rate Extract
    const taxRateField = document.getElementById('tax-rate-field');
    const taxRateVal = taxRateField ? (parseFloat(taxRateField.value || taxRateField.innerText) || 0) : 0;

    const currencySymbol = document.querySelector('.cur') ? document.querySelector('.cur').innerText : 'Rs';

    // Checkboxes Status
    const showDate = document.querySelector("input[data-target='date-wrap']")?.checked ?? true;
    const showTime = document.querySelector("input[data-target='time-wrap']")?.checked ?? true;
    const showNtn = document.querySelector("input[data-target='ntn-wrap']")?.checked ?? false;
    const showDisc = document.getElementById("disc-master")?.checked ?? false;
    const showTax = document.getElementById("tax-master")?.checked ?? false;
    const showNote = document.getElementById("note-master")?.checked ?? false;

    // Dynamic Layout & Header Settings
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
            if (disc > 0) {
                products.push(`${name} (${qty}x${rate} - Disc: ${disc})`);
            } else {
                products.push(`${name} (${qty}x${rate})`);
            }
        }
    });

    if(savedBillsLog.some(b => b.billNo === billNo && b.customer === customer && b.totalAmount === (currencySymbol + " " + totalAmount))) {
        return;
    }

    const newLog = {
        billNo,
        customer,
        address,
        dateVal,
        timeVal,            // 👈 Saved Time Value
        taxRate: taxRateVal, // 👈 Saved Tax Rate (%)
        products,
        totalAmount: currencySymbol + " " + totalAmount,
        paidAmount: currencySymbol + " " + paidAmountVal.toFixed(2),
        balanceAmount: currencySymbol + " " + balanceAmount,
        previousBalance: prevBalanceVal,
        config: {
            showDate,
            showTime,
            showNtn,
            showDisc,
            showTax,
            showNote,
            layoutDirection,
            titleSize,
            paperSize,
            currencyVal,
            currencySymbol,
            ownerName,
            ownerLabel
        }
    };

    savedBillsLog.unshift(newLog);
    localStorage.setItem("bills_history_log", JSON.stringify(savedBillsLog));
    renderBillsHistory();
}

// 📅 History display ke liye: YYYY-MM-DD ko DD-MM-YYYY mein badalta hai
function formatDateForDisplay(dateStr) {
    if (!dateStr) return '';
    // Agar pehle se DD-MM-YYYY hai to waise hi chhodo
    if (dateStr.includes('/') || (dateStr.split('-')[0] && dateStr.split('-')[0].length === 2)) {
        return dateStr;
    }
    const parts = dateStr.split('-'); // YYYY-MM-DD todta hai
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY banata hai
    }
    return dateStr;
}




// Render Bills History (With Delete Action Support)
// ============================================
// 📋 RENDER BILLS HISTORY (Fix Layout & Table)
// ============================================
function renderBillsHistory() {
    const tbody = document.getElementById("bill-history-rows");
    if (!tbody) return;

    if (!savedBillsLog || savedBillsLog.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#999; padding:20px;">No bill records found yet. Save/Print a bill to log details.</td></tr>`;
        return;
    }

    // Checking Active Modes
    const isDeleteActive = (typeof isDeleteSelectionActive !== 'undefined') ? isDeleteSelectionActive : false;
    const isEditActive = (typeof isEditModeActive !== 'undefined') ? isEditModeActive : false;
    const isViewActive = (typeof isViewModeActive !== 'undefined') ? isViewModeActive : false; // 🆕
    // Toggle Header Column Visibility
    const selHeaders = document.querySelectorAll('.select-col-header');
    const actHeaders = document.querySelectorAll('.action-col-header');
    
    selHeaders.forEach(el => el.style.display = isDeleteActive ? 'table-cell' : 'none');
    actHeaders.forEach(el => el.style.display = (isEditActive || isViewActive) ? 'table-cell' : 'none');

    tbody.innerHTML = "";
    savedBillsLog.forEach(b => {
        const tr = document.createElement("tr");
        let prodHTML = (b.products && Array.isArray(b.products)) 
            ? b.products.map(p => `<span class="prod-tag">${p}</span>`).join(" ")
            : '<i style="color:#aaa;">No Products</i>';

        const rawBal = b.balanceAmount ? parseFloat(String(b.balanceAmount).replace(/[^0-9.-]/g, '')) : 0;
        const balStyle = rawBal > 0 ? "font-weight:bold; color:red; text-align:right;" : "font-weight:bold; color:#777; text-align:right;";

        tr.innerHTML = `
            <td class="select-col-cell" style="display:${isDeleteActive ? 'table-cell' : 'none'}; text-align:center;">
    <input type="checkbox" class="bill-select-checkbox" value="${b.billNo}" onchange="updateSelectedCount()">
</td>

            <!-- Standard Ledger Columns -->
            <td style="font-weight:bold; color:#2c3e50; text-align:center;">${b.billNo}</td>
            <td style="font-weight:600;">${b.customer || 'Counter Sale'}</td>
            <td style="text-align:center;">
    <div style="font-weight:600;">${formatDateForDisplay(b.dateVal) || '-'}</div>
    <div style="font-size:11px; color:#7f8c8d; margin-top:2px;">🕐 ${b.timeVal || ''}</div>
</td>
            <td>${prodHTML}</td>
            <td style="font-weight:bold; color:#2c3e50; text-align:right;">${b.totalAmount || 'Rs 0.00'}</td>
            <td style="font-weight:bold; color:#27ae60; text-align:right;">${b.paidAmount || 'Rs 0.00'}</td>
            
            <!-- Complete Balance Column (No trash basket) -->
            <td style="${balStyle}">${b.balanceAmount || 'Rs 0.00'}</td>

            <!-- Action Column (Edit ya View mode ke hisaab se) -->
<td class="action-col-cell" style="display:${(isEditActive || isViewActive) ? 'table-cell' : 'none'}; text-align:center;">
    ${isEditActive ? `<button onclick="loadBillToEdit('${b.billNo}')" style="background:#f39c12; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:11px; margin:2px;">✏️ Edit</button>` : ''}
    ${isViewActive ? `<button onclick="loadBillToView('${b.billNo}')" style="background:#3498db; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:11px; margin:2px;">👁️ View</button>` : ''}
</td>
        `;
        tbody.appendChild(tr);
    });
}


function showPrintModal() {
    document.getElementById("printModal").style.display = "block";
    document.getElementById("pageSize").onchange = function() {
        const isCustom = this.value === "custom";
        document.getElementById("customDims").style.display = isCustom ? "block" : "none";
        document.getElementById("topPageSize").value = this.value;
        document.getElementById("topCustomDims").style.display = isCustom ? "inline-block" : "none";
    };
}

function showDevModal() {
    document.getElementById('devModal').style.display = 'block';
}

// --- Dynamic Auto Increment Logic (v2: History-First) ---
// 🆕 Bill No hamesha HISTORY ke actual last number se niklega —
//    Edit wale purane numbers se +1 hone ka masla khatam!
// ⚠️ SIRF YE FUNCTION BADLA GAYA — data format aur keys same hain,
//    history 100% mehfooz hai!
function autoIncrementBillNo() {
    const billNoEl = document.getElementById("bill-no");

    // 1️⃣ SACH KI TALAASH: History mein sab se bara number dhundo
    let maxNum = 0;
    let maxEntry = null;

    if (typeof savedBillsLog !== 'undefined' && savedBillsLog.length > 0) {
        savedBillsLog.forEach(b => {
            // Bill No ke aakhir se digits nikalo ("28" → 28, "INV-28" → 28)
            const m = String(b.billNo).match(/(\d+)\s*$/);
            if (m) {
                const num = parseInt(m[1], 10);
                if (num > maxNum) {
                    maxNum = num;
                    maxEntry = b; // pura entry store (prefix/padding nikalne ke liye)
                }
            }
        });
    }

    // 2️⃣ Fallback: history khali ho to localStorage (bilkul naya user)
    if (maxNum === 0) {
        const stored = localStorage.getItem("last_bill_no");
        if (stored) {
            const m = String(stored).match(/(\d+)\s*$/);
            if (m) maxNum = parseInt(m[1], 10);
        }
    }

    // 3️⃣ Naya number = history ke MAX + 1 (edit wale number se NAHI!)
    const newNumber = maxNum + 1;

    // 4️⃣ PREFIX: history ke last entry ka prefix preserve ("INV-28" → "INV-")
    let prefix = "";
    if (maxEntry && maxEntry.billNo) {
        prefix = String(maxEntry.billNo).replace(/(\d+)\s*$/, '');
    } else if (billNoEl) {
        // History khali — current form ke number se prefix (agar letters hain)
        const pm = (billNoEl.innerText || "").match(/^(.*?)(\d+)$/);
        if (pm && pm[1]) prefix = pm[1];
    }

    // 5️⃣ PADDING: leading zeros preserve ("028" → "029")
    let padLen = 0;
    if (maxEntry && maxEntry.billNo) {
        const dm = String(maxEntry.billNo).match(/(\d+)\s*$/);
        if (dm) padLen = dm[1].length;
    }
    const padded = padLen > 1 ? String(newNumber).padStart(padLen, '0') : String(newNumber);

    const newBillNo = prefix + padded;

    // 6️⃣ Apply — form + localStorage (same key as before)
    if (billNoEl) billNoEl.innerText = newBillNo;
    localStorage.setItem("last_bill_no", newBillNo);
}

function applyPrint() {
    captureCustomerName();
    logBillToHistory();
    autoIncrementBillNo();
    gtag("event", "bill_generated", { "event_category": "Engagement", "event_label": "Invoice Printed" });

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
        setTimeout(() => { wrapper.style.width = "100%"; wrapper.style.margin = "auto"; }, 1000);
    }, 500);
}

async function shareBill() {
    captureCustomerName();
    logBillToHistory();
    autoIncrementBillNo();
    gtag("event", "bill_shared", { "event_category": "Engagement", "event_label": "Invoice Shared" });

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

    html2canvas(billContent, { scale: 3, useCORS: true, width: 800 }).then(async (canvas) => {
        try {
            const dataUrl = canvas.toDataURL('image/jpeg');
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], 'Invoice.jpg', { type: 'image/jpeg' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: 'Invoice Bill' });
            } else {
                const link = document.createElement('a');
                link.download = 'Invoice.jpg'; link.href = dataUrl; link.click();
            }
        } catch (shareErr) { console.error("Sharing failed", shareErr); }

        billContent.classList.remove('force-pc-layout');
        elementsToHide.forEach(el => {
            if (el.classList.contains('editable-text-container') || el.classList.contains('editable-input-container')) {
                el.style.paddingRight = ''; el.style.removeProperty('--show-pencil');
            } else { el.style.display = ''; }
        });
    });
}

async function downloadFile(formatType) {
    captureCustomerName();
    logBillToHistory();
    autoIncrementBillNo();
    gtag("event", "bill_downloaded", { "event_category": "Engagement", "event_label": "Invoice Downloaded" });

    const billContent = document.getElementById('bill-content');
    const elementsToHide = document.querySelectorAll('.no-print, .rt-col-action, .editable-text-container, .editable-input-container');

    billContent.classList.add('force-pc-layout');

    elementsToHide.forEach(el => {
        if (el.classList.contains('editable-text-container') || el.classList.contains('editable-input-container')) {
            el.style.paddingRight = '0'; el.style.setProperty('--show-pencil', 'none');
        } else { el.style.display = 'none'; }
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    html2canvas(billContent, { scale: 3, useCORS: true, width: 800 }).then(canvas => {
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
    });
}

function applyToggles() {
    document.querySelectorAll('.toggle').forEach(t => {
        const target = t.getAttribute('data-target');
        document.querySelectorAll('.' + target).forEach(el => el.style.display = t.checked ? '' : 'none');
    });
}

window.onclick = function(event) {
    if (event.target == document.getElementById('devModal')) document.getElementById('devModal').style.display = "none";
    if (event.target == document.getElementById('printModal')) document.getElementById('printModal').style.display = "none";
}

document.querySelectorAll('.toggle').forEach(t => t.addEventListener('change', applyToggles));

addRow();

document.addEventListener("DOMContentLoaded", function() {
    renderBillsHistory();

    const lastBill = localStorage.getItem("last_bill_no");
    if (lastBill) {
        document.getElementById("bill-no").innerText = lastBill;
    }

    toggleDirection(currentLang);

    const custSpan = document.getElementById("cust-name-field");
    const addrDiv = document.getElementById("cust-address-field");
    if (custSpan && addrDiv) {
        const wrap = custSpan.parentElement;
        wrap.style.position = "relative";

        const cSuggestBox = document.createElement("div");
        cSuggestBox.className = "suggestion-container";
        cSuggestBox.style.position = "absolute";
        cSuggestBox.style.top = "100%";
        cSuggestBox.style.left = "0";
        cSuggestBox.style.width = "200px";
        cSuggestBox.style.zIndex = "99999";
        wrap.appendChild(cSuggestBox);

        custSpan.addEventListener("input", function() {
            const val = this.innerText.trim().toLowerCase();
            cSuggestBox.innerHTML = '';
            if (val.length > 0) {
                const matches = savedCustomers.filter(c => c.name.toLowerCase().includes(val));
                if (matches.length > 0) {
                    cSuggestBox.style.display = 'block';
                    matches.forEach(m => {
                        const div = document.createElement('div');
                        div.className = 'suggestion-item';
                        div.innerText = m.name;
                        div.style.cursor = "pointer";
                        div.onclick = function() {
                            custSpan.innerText = m.name;
                            addrDiv.innerText = m.address || "#";
                            cSuggestBox.style.display = 'none';

                            let foundPrevBal = 0;
                            const lastCustomerBill = savedBillsLog.find(b => b.customer.toLowerCase().trim() === m.name.toLowerCase().trim());

                            if (lastCustomerBill && lastCustomerBill.balanceAmount) {
                                const cleanBal = lastCustomerBill.balanceAmount.replace(/[^0-9.-]/g, '');
                                foundPrevBal = parseFloat(cleanBal) || 0;
                            }

                            const prevBalField = document.getElementById("prev-bal-val");
                            if (prevBalField) {
                                prevBalField.value = foundPrevBal.toFixed(2);
                            }

                            calc();

                            const range = document.createRange();
                            const sel = window.getSelection();
                            range.selectNodeContents(custSpan);
                            range.collapse(false);
                            sel.removeAllRanges();
                            sel.addRange(range);
                        };
                        cSuggestBox.appendChild(div);
                    });
                } else { cSuggestBox.style.display = 'none'; }
            } else { cSuggestBox.style.display = 'none'; }
        });

        custSpan.addEventListener('blur', function() {
            setTimeout(() => { cSuggestBox.style.display = 'none'; }, 200);
        });
    }

    const pageSizeElement = document.getElementById('pageSize');
    if (pageSizeElement) {
        pageSizeElement.addEventListener('change', function() {
            document.getElementById('topPageSize').value = this.value;
            document.getElementById('topCustomDims').style.display = this.value === 'custom' ? 'inline-block' : 'none';
        });
    }

    const noteBody = document.getElementById("note-body");
    if (noteBody) {
        noteBody.addEventListener("input", function () {
            const key = (currentLang === 'rtl') ? "custom_invoice_note_ur" : "custom_invoice_note_en";
            localStorage.setItem(key, this.innerText);
        });
    }

    const ownerLabelEl = document.getElementById('owner-label');
    if (ownerLabelEl) {
        ownerLabelEl.addEventListener('input', function() {
            localStorage.setItem(getOwnerLabelKey(), this.innerText.trim());
        });
        ownerLabelEl.addEventListener('blur', function() {
            let t = this.innerText.trim();
            if (t === '') {
                t = (currentLang === 'rtl') ? OWNER_DEFAULTS.ur : OWNER_DEFAULTS.en;
                this.innerText = t;
            }
            localStorage.setItem(getOwnerLabelKey(), t);
        });
    }

    const ownerNameEl = document.getElementById('owner-name-field');
    if (ownerNameEl) {
        ownerNameEl.addEventListener('input', function() {
            localStorage.setItem('owner_name_value', this.innerText.trim());
        });
        ownerNameEl.addEventListener('blur', function() {
            localStorage.setItem('owner_name_value', this.innerText.trim());
        });
    }

    const ntnFieldEl = document.getElementById('ntn-field');
    if (ntnFieldEl) {
        ntnFieldEl.addEventListener('input', function() {
            localStorage.setItem('ntn_value', this.innerText.trim());
        });
        ntnFieldEl.addEventListener('blur', function() {
            localStorage.setItem('ntn_value', this.innerText.trim());
        });
    }

    const discMaster = document.getElementById('disc-master');
    if (discMaster) {
        discMaster.addEventListener('change', function() {
            calc();
        });
    }

    const taxMaster = document.getElementById('tax-master');
    if (taxMaster) {
        taxMaster.addEventListener('change', function() {
            calc();
        });
    }

    const taxRateField = document.getElementById('tax-rate-field');
    if (taxRateField) {
        taxRateField.addEventListener('input', calc);
        taxRateField.addEventListener('change', calc);
        taxRateField.addEventListener('keyup', calc);
        taxRateField.addEventListener('blur', calc);
    }
});

// Developer Info & Branding
(function(){
    const devInfo = { name: "WasiDevelopers", whatsapp: "923346800959", displayPhone: "0334-6800959" };
    const contactDiv = document.getElementById('wasi-contact');
    const waLink = document.getElementById('modal-wa-link');
    const brandingArea = document.querySelector('.permanent-branding');

    if (contactDiv && !contactDiv.innerHTML.includes('contenteditable')) {
        const mobileText = (currentLang === 'rtl') ? 'موبائل:' : 'Mobile:';
        contactDiv.innerHTML = `<span id="biz-mobile-label">${mobileText}</span> <div class="editable-text-container"><div contenteditable="true" style="display:inline-block; font-weight: normal; outline:none; min-width:100px; word-break:break-word; vertical-align:middle;">0334-6800959</div></div>`;
    }

    const updateUI = () => {
        if (brandingArea && brandingArea.innerHTML !== 'https://freebills.netlify.app/') { brandingArea.innerHTML = 'https://freebills.netlify.app/'; }
        if(waLink) { waLink.setAttribute('href', "https://wa.me/" + devInfo.whatsapp); }
    };
    updateUI(); setInterval(updateUI, 1500);
})();

// ==========================================
    // 🛡️ --- SECURITY & ANTI-TAMPER BLOCK ---
    // ==========================================

    // 1. 🚫 INSPECT ELEMENT & RIGHT CLICK BLOCKER
    document.addEventListener('contextmenu', event => event.preventDefault());

    document.onkeydown = function(e) {
        if (e.keyCode == 123) return false; // F12
        if (e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) return false;
        if (e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) return false;
        if (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) return false;
    };

    // 2. ⚠️ CODE INTEGRITY VERIFICATION
    (function() {
        const INTEGRITY_CHECK_ENABLED = true; 
        const CORRECT_HASH_SIGNATURE = 18560; 

        const enforceSecurityLock = () => {
            if (!INTEGRITY_CHECK_ENABLED) return;
            try {
                let currentStrippedSource = '';

                const safeFunctions = [];
            if (typeof calc !== 'undefined') safeFunctions.push(calc);
            if (typeof addRow !== 'undefined') safeFunctions.push(addRow);
            if (typeof reIndex !== 'undefined') safeFunctions.push(reIndex);
            if (typeof applyToggles !== 'undefined') safeFunctions.push(applyToggles);
            if (typeof logBillToHistory !== 'undefined') safeFunctions.push(logBillToHistory);
            if (typeof downloadHistoryPDF !== 'undefined') safeFunctions.push(downloadHistoryPDF);
            if (typeof downloadFile !== 'undefined') safeFunctions.push(downloadFile);
            if (typeof shareBill !== 'undefined') safeFunctions.push(shareBill);
            if (typeof autoIncrementBillNo !== 'undefined') safeFunctions.push(autoIncrementBillNo);
            if (typeof captureCustomerName !== 'undefined') safeFunctions.push(captureCustomerName);
            if (typeof gtag !== 'undefined') safeFunctions.push(gtag);
            if (typeof applyPrint !== 'undefined') safeFunctions.push(applyPrint);
            if (typeof showPrintModal !== 'undefined') safeFunctions.push(showPrintModal);
            if (typeof clearAllBillsHistory !== 'undefined') safeFunctions.push(clearAllBillsHistory);
            if (typeof renderBillsHistory !== 'undefined') safeFunctions.push(renderBillsHistory);
            if (typeof showDevModal !== 'undefined') safeFunctions.push(showDevModal);
            if (typeof handleCurrencyChange !== 'undefined') safeFunctions.push(handleCurrencyChange);
            if (typeof updateCurrencySymbol !== 'undefined') safeFunctions.push(updateCurrencySymbol);
                safeFunctions.forEach(fn => {
                    currentStrippedSource += fn.toString().replace(/\s+/g,'');
                });

                const currentLength = currentStrippedSource.length;
               //     alert("New Code Length is: " + currentLength);
                if (currentLength !== CORRECT_HASH_SIGNATURE) {
                    document.body.innerHTML = `
                        <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background-color:#7f1d1d; color:#ffffff; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; padding:20px; text-align:center; z-index:999999;">
                            <h1 style="font-size:42px; margin-bottom:20px;">⚠️ CODE TAMPERING DETECTED</h1>
                            <p style="font-size:18px; max-width:600px; line-height:1.6; margin-bottom:20px;">
                                Unauthorized modifications to the original source code or the developer's intellectual property have been detected.
                            </p>
                            <p style="font-size:16px; color:#f3f4f6; margin-bottom:30px;">
                                Please contact <strong>Wasi Developers</strong> on WhatsApp:
                                <a href="https://wa.me/923346800959" target="_blank" style="color:#22c55e; font-weight:bold; text-decoration:underline; margin-left:5px;">+923346800959</a>
                            </p>
                            <div style="background:#000; padding:15px; border-radius:5px; font-family:monospace; font-size:14px; color:#ef4444;">
                                Error Code: ERR_AUTH_INTEGRITY_VIOLATION
                            </div>
                        </div>
                    `;
                }
            } catch(e) {
                document.body.innerHTML = "Security system bypassed. Access Denied. Contact Wasi Developers at +923346800959.";
            }
        };

        setTimeout(enforceSecurityLock, 0);
    })();