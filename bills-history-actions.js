// ============================================
// 🗑️ MULTIPLE SELECTION & DELETE MANAGEMENT
// ============================================

let isDeleteSelectionActive = false;

/**
 * 1. سلیکشن موڈ کو آن / آف کرنا
 */
function toggleDeleteMode() {
    isDeleteSelectionActive = !isDeleteSelectionActive;
    
    // اگر ایڈٹ موڈ آن ہو تو اسے بند کر دیں
    if (typeof isEditModeActive !== 'undefined') {
        isEditModeActive = false;
    }

    const toggleBtn = document.getElementById('btn-toggle-delete-mode');
    const deleteBtn = document.getElementById('btn-delete-selected');

    if (toggleBtn) {
        toggleBtn.innerText = isDeleteSelectionActive ? '❌ کنسل (Cancel)' : '🗑️ Delete Bill';
        toggleBtn.style.background = isDeleteSelectionActive ? '#7f8c8d' : '#e74c3c';
    }

    if (deleteBtn) {
        deleteBtn.style.display = isDeleteSelectionActive ? 'inline-block' : 'none';
        deleteBtn.innerText = '❌ Delete Selected (0)';
    }

    if (typeof renderBillsHistory === 'function') {
        renderBillsHistory();
    }
}

/**
 * 2. تمام چیک باکسز کو ایک ساتھ سلیکٹ یا ان-سلیکٹ کرنا
 */
function toggleSelectAllBills(masterCheckbox) {
    const checkboxes = document.querySelectorAll('.bill-select-checkbox');
    checkboxes.forEach(cb => cb.checked = masterCheckbox.checked);
    updateSelectedCount();
}

/**
 * 3. منتخب شدہ بلز کی تعداد (Live Count) اپ ڈیٹ کرنا
 */
function updateSelectedCount() {
    const selectedCount = document.querySelectorAll('.bill-select-checkbox:checked').length;
    const deleteBtn = document.getElementById('btn-delete-selected');
    if (deleteBtn) {
        deleteBtn.innerText = `❌ Delete Selected (${selectedCount})`;
    }
}

/**
 * 4. منتخب شدہ بلز کو خوبصورت پاپ اپ کے ساتھ ڈیلیٹ کرنا
 */
async function deleteSelectedBills() {
    const selectedCheckboxes = document.querySelectorAll('.bill-select-checkbox:checked');
    
    if (selectedCheckboxes.length === 0) {
        showCustomAlert("warning", "انتباہ!", "براہِ کرم ڈیلیٹ کرنے کے لیے کم از کم ایک بل منتخب کریں۔");
        return;
    }

    const billNosToDelete = Array.from(selectedCheckboxes).map(cb => cb.value);
    const totalCount = billNosToDelete.length;
    const billListString = billNosToDelete.join(", ");

    // خوبصورت پاپ اپ ڈائلاگ (SweetAlert2 یا HTML Modal Support)
    const confirmed = await showCustomConfirm(
        "کیا آپ واقعی یہ بلز ڈیلیٹ کرنا چاہتے ہیں؟",
        `<b>منتخب شدہ کل بلز:</b> ${totalCount}<br><b>بل نمبرز:</b> ${billListString}`
    );

    if (confirmed) {
        // سلیکٹڈ بلز کو ہسٹری ایرے سے خارج کرنا
        savedBillsLog = savedBillsLog.filter(b => !billNosToDelete.includes(String(b.billNo)));
        
        // لوکل اسٹوریج اپ ڈیٹ کرنا
        localStorage.setItem("bills_history_log", JSON.stringify(savedBillsLog));

        // سلیکشن موڈ کو بند کرنا اور UI اپ ڈیٹ کرنا
        isDeleteSelectionActive = false;
        
        const toggleBtn = document.getElementById('btn-toggle-delete-mode');
        const deleteBtn = document.getElementById('btn-delete-selected');
        if (toggleBtn) toggleBtn.innerText = '🗑️ Delete Bill';
        if (deleteBtn) deleteBtn.style.display = 'none';

        renderBillsHistory();
        showCustomAlert("success", "کامیابی!", `${totalCount} بلز کو ہسٹری سے ڈیلیٹ کر دیا گیا ہے۔`);
    }
}

/**
 * 5. تمام ہسٹری ایک ساتھ کلیئر کرنا (Clear All)
 */
async function clearAllBillsHistory() {
    if (!savedBillsLog || savedBillsLog.length === 0) {
        showCustomAlert("info", "اطلاع", "ہسٹری پہلے سے ہی خالی ہے۔");
        return;
    }

    const confirmed = await showCustomConfirm(
        "تمام ہسٹری کا ریکارڈ ختم کریں؟",
        `کیا آپ واقعی <b>تمام (${savedBillsLog.length}) بلز</b> کا ریکارڈ ہمیشہ کے لیے حذف کرنا چاہتے ہیں؟`
    );

    if (confirmed) {
        savedBillsLog = [];
        localStorage.removeItem("bills_history_log");
        isDeleteSelectionActive = false;
        renderBillsHistory();
        showCustomAlert("success", "مکمل!", "تمام بلز کا ریکارڈ ہٹا دیا گیا ہے۔");
    }
}

// ============================================
// 🎨 BEAUTIFUL POPUP DIALOGS (HELPER FUNCTIONS)
// ============================================

function showCustomConfirm(title, htmlContent) {
    return new Promise((resolve) => {
        // اگر SweetAlert2 لائبریری موجود ہے تو وہ استعمال ہوگی، ورنہ فالبیک کسٹم پاپ اپ
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: title,
                html: htmlContent,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#e74c3c',
                cancelButtonColor: '#7f8c8d',
                confirmButtonText: 'ہاں، ڈیلیٹ کریں',
                cancelButtonText: 'کنسل'
            }).then((result) => {
                resolve(result.isConfirmed);
            });
        } else {
            // سادہ براؤزر کنفرم فالبیک
            const plainText = htmlContent.replace(/<[^>]*>?/gm, '');
            const res = confirm(`${title}\n\n${plainText}`);
            resolve(res);
        }
    });
}

function showCustomAlert(icon, title, text) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: icon,
            title: title,
            text: text,
            confirmButtonColor: '#27ae60'
        });
    } else {
        alert(`${title}\n${text}`);
    }
}
