// ============================================
// 📥 BILLS HISTORY MULTI-FORMAT DOWNLOAD ACTIONS — v2
// ============================================
// ✅ PDF: Clean clone (no buttons) + compact font + auto pages
// ✅ CSV: Time column added
// ✅ TXT: Clean table format (like ledger screenshot)
// ============================================

/**
 * 1. مین فنکشن: ڈاؤن لوڈ آپشنز والا پاپ اپ
 */
function downloadHistoryPDF() {
    openDownloadOptionsModal();
}

function openDownloadOptionsModal() {
    if (typeof savedBillsLog === 'undefined' || savedBillsLog.length === 0) {
        const isUrdu = (typeof currentLang !== 'undefined' && currentLang === 'rtl');
        if (typeof Swal !== 'undefined') {
            Swal.fire(
                isUrdu ? 'خالی ہسٹری' : 'Empty History',
                isUrdu ? 'ڈاؤن لوڈ کرنے کے لیے کوئی بل موجود نہیں ہے۔' : 'No bills available to download.',
                'info'
            );
        } else {
            alert("No history available to download.");
        }
        return;
    }

    const isUrdu = (typeof currentLang !== 'undefined' && currentLang === 'rtl');

    Swal.fire({
        title: isUrdu ? 'فائل فارمیٹ منتخب کریں' : 'Select Download Format',
        text: isUrdu ? 'آپ بلز ہسٹری کس فارمیٹ میں ڈاؤن لوڈ کرنا چاہتے ہیں؟' : 'Choose the file format to download bills history:',
        icon: 'question',
        showCancelButton: true,
        showConfirmButton: false,
        cancelButtonText: isUrdu ? 'منسوخ کریں' : 'Cancel',
        html: `
            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">
                <button id="dl-pdf-btn" class="swal2-confirm swal2-styled" style="background-color: #e74c3c; margin: 0; width: 100%; cursor: pointer;">
                    📄 PDF File (.pdf)
                </button>
                <button id="dl-csv-btn" class="swal2-confirm swal2-styled" style="background-color: #27ae60; margin: 0; width: 100%; cursor: pointer;">
                    📊 Excel / CSV File (.csv)
                </button>
                <button id="dl-txt-btn" class="swal2-confirm swal2-styled" style="background-color: #2980b9; margin: 0; width: 100%; cursor: pointer;">
                    📝 Text Document (.txt)
                </button>
            </div>
        `,
        didOpen: () => {
            document.getElementById('dl-pdf-btn').addEventListener('click', () => {
                Swal.close();
                generateHistoryPDFCanvas();
            });
            document.getElementById('dl-csv-btn').addEventListener('click', () => {
                Swal.close();
                generateHistoryCSV();
            });
            document.getElementById('dl-txt-btn').addEventListener('click', () => {
                Swal.close();
                generateHistoryTXT();
            });
        }
    });
}

/**
 * 📄 Option 1: PDF Generator
 * ✅ CLEAN CLONE: buttons waghera PDF mein nahi aayenge
 * ✅ COMPACT: chota font = zyada data per page
 * ✅ AUTO PAGES: data jitna bara, utni pages (khud)
 */
function generateHistoryPDFCanvas() {
    const originalPanel = document.querySelector('.record-panel');

    if (!originalPanel) {
        window.print();
        return;
    }

    // Loading popup
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'PDF بن رہی ہے...',
            text: 'برائے مہربانی انتظار کریں',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });
    }

    // 🧹 CLEAN CLONE — sirf data, koi button nahi!
    const clone = originalPanel.cloneNode(true);

    // 1. Saare buttons hatao (Edit/Delete/Download/Clear — kuch nahi chahiye)
    clone.querySelectorAll('button').forEach(btn => btn.remove());

    // 2. Action/Selection columns bhi hatao (agar khuli hon)
    clone.querySelectorAll('.action-col-cell, .select-col-cell').forEach(td => td.remove());
    clone.querySelectorAll('.action-col-header, .select-col-header').forEach(th => th.remove());

    // 3. COMPACT STYLING — max data per page (chota par readable)
    clone.style.cssText = `
        position: absolute; left: -10000px; top: 0;
        width: 780px; background: #ffffff; padding: 12px;
        box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif;
    `;
    clone.querySelectorAll('h3').forEach(h => {
        h.style.fontSize = '14px';
        h.style.margin = '0 0 8px 0';
    });

    const recTable = clone.querySelector('.record-table');
    if (recTable) {
        recTable.style.fontSize = '10px';      // 🆕 chota font — zyada rows/page
        recTable.style.width = '100%';
        recTable.querySelectorAll('th').forEach(th => {
            th.style.padding = '3px 4px';
            th.style.fontSize = '9px';
        });
        recTable.querySelectorAll('td').forEach(td => {
            td.style.padding = '2px 4px';       // 🆕 tight rows
        });
        recTable.querySelectorAll('.prod-tag').forEach(tag => {
            tag.style.fontSize = '8px';         // 🆕 item names chote par readable
            tag.style.padding = '1px 3px';
            tag.style.margin = '1px';
        });
    }

    // Off-screen attach → capture → remove
    document.body.appendChild(clone);

    html2canvas(clone, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
        document.body.removeChild(clone); // clone saaf

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');

        const imgWidth = 210;                 // A4 width
        const pageHeight = 297;               // A4 height
        const usableHeight = 285;             // thora margin
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const imgData = canvas.toDataURL('image/png');

        let heightLeft = imgHeight;
        let position = 0;

        // Page 1
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= usableHeight;

        // 🆕 AUTO PAGES — jitna data, utni pages (har page next slice)
        while (heightLeft >= 0) {
            position = position - usableHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= usableHeight;
        }

        const today = new Date().toISOString().slice(0, 10);
        pdf.save(`Bills_History_${today}.pdf`);

        if (typeof Swal !== 'undefined') Swal.close();
    }).catch(err => {
        // clone saaf karna na bhoolen
        if (document.body.contains(clone)) document.body.removeChild(clone);
        if (typeof Swal !== 'undefined') Swal.close();

        const isUrdu = (typeof currentLang !== 'undefined' && currentLang === 'rtl');
        if (typeof Swal !== 'undefined') {
            Swal.fire('Error', isUrdu ? 'PDF بننے میں مسئلہ آیا۔' : 'Failed to generate PDF.', 'error');
        } else {
            alert("PDF generation failed.");
        }
    });
}

/**
 * 📊 Option 2: Excel / CSV Generator (UTF-8 Urdu + Time column)
 */
function generateHistoryCSV() {
    let csvContent = "\uFEFFBill No,Customer,Date,Time,Products Details,Grand Total,Received,Balance\n";

    savedBillsLog.forEach(b => {
        const prodList = (b.products && Array.isArray(b.products)) ? `"${b.products.join(' | ').replace(/"/g, '""')}"` : '""';
        const custName = `"${(b.customer || 'Counter Sale').replace(/"/g, '""')}"`;
        const total = `"${(b.totalAmount || '0.00').replace(/"/g, '""')}"`;
        const paid = `"${(b.paidAmount || '0.00').replace(/"/g, '""')}"`;
        const bal = `"${(b.balanceAmount || '0.00').replace(/"/g, '""')}"`;
        const time = `"${(b.timeVal || '').replace(/"/g, '""')}"`;

        csvContent += `${b.billNo},${custName},${b.dateVal || ''},${time},${prodList},${total},${paid},${bal}\n`;
    });

    triggerFileDownload(csvContent, 'text/csv;charset=utf-8;', 'csv');
}

/**
 * 📝 Option 3: Text Generator (Clean Table Format — ledger jaisa)
 */
function generateHistoryTXT() {
    // \uFEFF Urdu ke liye zaroori
    let txt = "\uFEFF";
    txt += "==========================================================================================================\n";
    txt += "                                    SAVED BILLS HISTORY / LEDGER                                          \n";
    txt += "==========================================================================================================\n\n";

    // 📋 TABLE HEADER (aligned columns)
    txt += "Bill No | Customer          | Date       | Time  | Grand Total    | Received        | Balance         \n";
    txt += "----------------------------------------------------------------------------------------------------------\n";

    savedBillsLog.forEach((b, index) => {
        const billNo = String(b.billNo || '').padEnd(7, ' ');
        const customer = String(b.customer || 'Counter Sale').substring(0, 17).padEnd(17, ' ');
        const date = String(b.dateVal || 'N/A').padEnd(10, ' ');
        const time = String(b.timeVal || '--:--').padEnd(5, ' ');
        const total = String(b.totalAmount || '0.00').padEnd(14, ' ');
        const paid = String(b.paidAmount || '0.00').padEnd(15, ' ');
        const bal = String(b.balanceAmount || '0.00');

        txt += `${billNo} | ${customer} | ${date} | ${time} | ${total} | ${paid} | ${bal}\n`;

        // Items — neeche indented (har bill ke)
        if (b.products && Array.isArray(b.products) && b.products.length > 0) {
            txt += `        Items: ${b.products.join(', ')}\n`;
        } else {
            txt += `        Items: N/A\n`;
        }
        txt += "----------------------------------------------------------------------------------------------------------\n";
    });

    txt += "\n";
    txt += `Total Bills: ${savedBillsLog.length}\n`;
    txt += `Generated: ${new Date().toLocaleString()}\n`;

    triggerFileDownload(txt, 'text/plain;charset=utf-8;', 'txt');
}

/**
 * 💾 Helper: File Download Trigger
 */
function triggerFileDownload(content, mimeType, extension) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);

    link.setAttribute("href", url);
    link.setAttribute("download", `Bills_History_${today}.${extension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}