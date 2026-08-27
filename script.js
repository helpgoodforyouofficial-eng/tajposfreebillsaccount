// --- PWA Service Worker Registration & Prompt Logic ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('Service Worker registered!'))
        .catch(err => console.log('Service Worker registration failed: ', err));
    });
}

let deferredPrompt;

// 1. Jab browser install karne ke liye ready ho
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    const installBanner = document.getElementById('pwa-install-btn');
    if (installBanner) {
        installBanner.style.setProperty('display', 'flex', 'important'); 
    }
});

// 2. Click handle karne ke liye jab page poora tayyar ho jaye
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

// 3. Jab app successfully install ho jaye
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

// --- Functions ---
function syncPaperSize(val) {
    const pageSizeEl = document.getElementById('pageSize');
    const topCustomDimsEl = document.getElementById('topCustomDims');
    const customDimsEl = document.getElementById('customDims');
    
    if(pageSizeEl) pageSizeEl.value = val;
    if(topCustomDimsEl) topCustomDimsEl.style.display = val === 'custom' ? 'inline-block' : 'none';
    if(customDimsEl) customDimsEl.style.display = val === 'custom' ? 'block' : 'none';
}

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
    const tr = document.createElement('tr');
    const rowCount = tbody.rows.length + 1;

    tr.innerHTML = `
        <td>${rowCount}</td>
        <td>
            <div class="editable-input-container">
                <input type="text" placeholder="Item Name..." class="item-input" autocomplete="off">
            </div>
            <div class="suggestion-container"></div>
        </td>
        <td><div class="editable-input-container"><input type="number" class="q" value="1" oninput="calc()" onclick="this.select()" style="text-align:center; font-weight:bold;"></div></td>
        <td><div class="editable-input-container"><input type="number" class="r" value="0" oninput="calc()" onclick="this.select()" style="text-align:right; font-weight:bold;"></div></td>
        <td class="col-disc"><div class="editable-input-container"><input type="number" class="d" value="0" oninput="calc()" onclick="this.select()" style="text-align:right; font-weight:bold;"></div></td>
        <td style="text-align:right; font-weight:bold;" class="rt">0.00</td>
        <td class="no-print rt-col-action">
            <button class="delete-btn" onclick="this.parentElement.parentElement.remove(); reIndex(); calc();">✖</button>
        </td>`;
    
    tbody.appendChild(tr);
    
    const input = tr.querySelector('.item-input');
    const suggestBox = tr.querySelector('.suggestion-container');

    input.addEventListener('input', function() {
        const val = this.value.toLowerCase();
        suggestBox.innerHTML = '';
        if (val.length > 0) {
            const matches = savedItems.filter(i => i.toLowerCase().includes(val));
            if (matches.length > 0) {
                suggestBox.style.display = 'block';
                matches.forEach(m => {
                    const div = document.createElement('div');
                    div.className = 'suggestion-item'; div.innerText = m;
                    div.onclick = function() { input.value = m; suggestBox.style.display = 'none'; calc(); };
                    suggestBox.appendChild(div);
                });
            } else { suggestBox.style.display = 'none'; }
        } else { suggestBox.style.display = 'none'; }
        calc();
    });

    input.addEventListener('blur', function() {
        setTimeout(() => { suggestBox.style.display = 'none'; }, 200);
        const val = this.value.trim();
        if (val && !savedItems.includes(val)) {
            savedItems.push(val);
            localStorage.setItem('inventory', JSON.stringify(savedItems));
        }
    });

    input.focus(); applyToggles(); calc();
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
        if (custName && custName !== "" && custName !== "Counter Sale") {
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

function logBillToHistory() {
    const billNo = document.getElementById("bill-no").innerText.trim();
    const customer = document.getElementById("cust-name-field").innerText.trim();
    const dateVal = document.getElementById("date-field").value;
    const totalAmount = document.getElementById("total-val").innerText;
    const paidAmount = parseFloat(document.getElementById("paid").value) || 0;
    const balanceAmount = document.getElementById("bal-val").innerText;
    const currencySymbol = document.querySelector('.cur').innerText;

    let products = [];
    document.querySelectorAll("#items tr").forEach(row => {
        const name = row.querySelector(".item-input").value.trim();
        const qty = row.querySelector(".q").value;
        const rate = row.querySelector(".r").value;
        if(name) {
            products.push(`${name} (${qty}x${rate})`);
        }
    });

    if(savedBillsLog.some(b => b.billNo === billNo && b.customer === customer && b.totalAmount === (currencySymbol + " " + totalAmount))) {
        return; 
    }

    const newLog = { 
        billNo, 
        customer, 
        dateVal, 
        products, 
        totalAmount: currencySymbol + " " + totalAmount,
        paidAmount: currencySymbol + " " + paidAmount.toFixed(2),
        balanceAmount: currencySymbol + " " + balanceAmount
    };
    savedBillsLog.unshift(newLog);
    localStorage.setItem("bills_history_log", JSON.stringify(savedBillsLog));
    renderBillsHistory();
}

function renderBillsHistory() {
    const tbody = document.getElementById("bill-history-rows");
    if (savedBillsLog.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#999; padding:20px;">No bill records found yet. Save/Print a bill to log details.</td></tr>`;
        return;
    }

    tbody.innerHTML = "";
    savedBillsLog.forEach(b => {
        const tr = document.createElement("tr");
        let prodHTML = b.products.map(p => `<span class="prod-tag">${p}</span>`).join(" ");
        const isPending = parseFloat(b.balanceAmount.replace(/[^0-9.-]/g, '')) > 0;
        const balStyle = isPending ? "font-weight:bold; color:red; text-align:right;" : "font-weight:bold; color:#777; text-align:right;";

        tr.innerHTML = `
            <td style="font-weight:bold; color:#2c3e50;">${b.billNo}</td>
            <td style="font-weight:600;">${b.customer}</td>
            <td>${b.dateVal}</td>
            <td>${prodHTML || '<i style="color:#aaa;">No Products</i>'}</td>
            <td style="font-weight:bold; color:#2c3e50; text-align:right;">${b.totalAmount}</td>
            <td style="font-weight:bold; color:#27ae60; text-align:right;">${b.paidAmount || '0.00'}</td>
            <td style="${balStyle}">${b.balanceAmount || '0.00'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function clearAllBillsHistory() {
    if(confirm("Are you sure you want to permanently clear all bills records history?")) {
        savedBillsLog = [];
        localStorage.removeItem("bills_history_log");
        renderBillsHistory();
    }
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

function autoIncrementBillNo() {
    const billNoEl = document.getElementById("bill-no");
    let currentVal = billNoEl.innerText.trim();
    
    const regex = /^(.*?)(\d+)$/;
    const match = currentVal.match(regex);
    
    if (match) {
        const prefix = match[1]; 
        const number = parseInt(match[2], 10); 
        const newNumber = number + 1;
        const paddedNumber = match[2].length > 1 ? String(newNumber).padStart(match[2].length, '0') : newNumber;
        billNoEl.innerText = prefix + paddedNumber;
    } else {
        billNoEl.innerText = currentVal + "1";
    }
    localStorage.setItem("last_bill_no", billNoEl.innerText);
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
document.getElementById('date-field').valueAsDate = new Date();
document.getElementById('time-field').value = new Date().toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'});

addRow();

document.addEventListener("DOMContentLoaded", function() {
    renderBillsHistory();

    const lastBill = localStorage.getItem("last_bill_no");
    if (lastBill) {
        document.getElementById("bill-no").innerText = lastBill;
    }

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
        const savedNote = localStorage.getItem("custom_invoice_note");
        if (savedNote !== null) {
            noteBody.innerText = savedNote;
        }

        noteBody.addEventListener("input", function () {
            localStorage.setItem("custom_invoice_note", this.innerText);
        });

        noteBody.addEventListener("focus", function () {
            if (this.innerText.trim() === "Thank you for your business!") {
                document.execCommand('selectAll', false, null);
            }
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

(function(){
    const devInfo = { name: "WasiDevelopers", whatsapp: "923346800959", displayPhone: "0334-6800959" };
    const contactDiv = document.getElementById('wasi-contact');
    const waLink = document.getElementById('modal-wa-link');
    const brandingArea = document.querySelector('.permanent-branding');
    
    if (contactDiv && !contactDiv.innerHTML.includes('contenteditable')) {
        contactDiv.innerHTML = 'Mobile: <div class="editable-text-container"><div contenteditable="true" style="display:inline-block; font-weight: normal; outline:none; min-width:100px; word-break:break-word; vertical-align:middle;">0300-8002765</div></div>';
    }
    
    const updateUI = () => {
        if (brandingArea && brandingArea.innerHTML !== 'https://freebills.netlify.app/') { brandingArea.innerHTML = 'https://freebills.netlify.app/'; }
        if(waLink) { waLink.setAttribute('href', "https://wa.me/" + devInfo.whatsapp); }
    };
    updateUI(); setInterval(updateUI, 1500);
})();

// ==========================================
// 🛡️ --- COMPLETE SECURITY & ANTI-TAMPER BLOCK ---
// ==========================================

// 1. 🚫 INSPECT ELEMENT & RIGHT CLICK BLOCKER
document.addEventListener('contextmenu', event => event.preventDefault()); 

document.onkeydown = function(e) {
    if (e.keyCode == 123) return false; // F12 Key
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) return false; // Ctrl+Shift+I
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) return false; // Ctrl+Shift+J
    if (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) return false; // Ctrl+U
};

// 2. ⚠️ STRICT CODE INTEGRITY VERIFICATION
(function() {
    // 🌟 EXACT MATCHED HASH SIGNATURE
    const CORRECT_HASH_SIGNATURE = 12494; 

    const enforceSecurityLock = () => {
        try {
            let currentStrippedSource = ''; 
            
            const safeFunctions = [];
            if (typeof calc !== 'undefined') safeFunctions.push(calc);
            if (typeof addRow !== 'undefined') safeFunctions.push(addRow);
            if (typeof reIndex !== 'undefined') safeFunctions.push(reIndex);
            if (typeof applyToggles !== 'undefined') safeFunctions.push(applyToggles);
            if (typeof logBillToHistory !== 'undefined') safeFunctions.push(logBillToHistory);
            if (typeof downloadFile !== 'undefined') safeFunctions.push(downloadFile);
            if (typeof shareBill !== 'undefined') safeFunctions.push(shareBill);
            if (typeof autoIncrementBillNo !== 'undefined') safeFunctions.push(autoIncrementBillNo);
            if (typeof captureCustomerName !== 'undefined') safeFunctions.push(captureCustomerName);
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

            // Agar kisi ne functions code mein tabdeeli ki to screen red ho jayegi
            if (currentLength !== CORRECT_HASH_SIGNATURE) {
                document.body.innerHTML = `
                    <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background-color:#7f1d1d; color:#ffffff; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; padding:20px; text-align:center; z-index:999999;">
                        <h1 style="font-size:42px; margin-bottom:20px;">⚠️ CODE TAMPERING DETECTED</h1>
                        <p style="font-size:18px; max-width:600px; line-height:1.6; margin-bottom:20px;">
                            Unauthorized modifications to the original source code or the developer's intellectual property have been detected. In accordance with our security policy, your access to this application has been permanently revoked.
                        </p>
                        <p style="font-size:16px; color:#f3f4f6; margin-bottom:30px;">
                            Please contact <strong>Wasi Developers</strong> on WhatsApp to resolve this issue: 
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
    
    setTimeout(enforceSecurityLock, 500); 
})();
