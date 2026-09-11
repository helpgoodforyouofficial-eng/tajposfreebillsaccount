/* ============================================================
   🔔 BILINGUAL AUTOMATIC UPDATE POPUP SYSTEM (update.js)
   - Dual Language Support (English / Urdu Toggle)
   - Default Language: English
   - Max 3-time View Limit per Update Version
   - Fully Responsive with Scrollable Body
   ============================================================ */

(function initUpdateNotification() {
    // -----------------------------------------------------------
    // 🛠️ 1. UPDATE CONFIGURATION (English & Urdu Content)
    // -----------------------------------------------------------
        const CURRENT_UPDATE = {
        version: "v81", // 👈 Nayi update par is version ko change karein
        
        // 🇬🇧 ENGLISH CONTENT (Default)
        en: {
            title: "🎉 Major Update — Full Bill Management System!",
            okBtn: "Got it (OK)",
            badgePrefix: "Notification:",
            content: `
                <p><strong>Hello!</strong> This is our biggest update yet! Your Bill Generator is now a complete Bill Management System:</p>
                <ul>
                    <li><strong>✏️ Edit Any Bill:</strong> Open any saved bill from History, change anything (items, customer, date, rates), and save it back with the same bill number. Nothing gets duplicated!</li>
                    <li><strong>👁️ View Bill (Read-Only):</strong> Need an old bill again? Just view it and re-print, re-download PDF/JPG or re-share — completely safe, no changes possible.</li>
                    <li><strong>🗑️ Bulk Delete:</strong> Select multiple bills at once and delete them together.</li>
                    <li><strong>📥 Download History:</strong> Export your complete bills history as PDF, Excel (CSV) or Text file.</li>
                    <li><strong>🔄 New Bill Order (Smart Refresh):</strong> You decide when a new bill starts! Choose Print, Share, Save PDF or Save JPG (any combination) in Settings — after completing those actions, your bill automatically refreshes with a new number.</li>
                    <li><strong>🆕 Smart Bill Numbering:</strong> Bill numbers now always continue from your actual last bill in history — no more wrong numbers!</li>
                    <li><strong>🕐 Date & Time in History:</strong> Every saved bill now shows both date and time in the ledger.</li>
                    <li><strong>Full Recall on Edit:</strong> Editing a bill restores EVERYTHING — date, time, NTN, note, customer, owner, title size and all settings exactly as they were.</li>
                </ul>
                <p>If you face any issue, please do a Hard Refresh (Ctrl + F5). Enjoy! 🚀</p>
            `
        },

        // 🇵🇰 URDU CONTENT
        ur: {
            title: "🎉 بڑی اپڈیٹ — مکمل بل مینجمنٹ سسٹم!",
            okBtn: "ٹھیک ہے (OK)",
            badgePrefix: "نوٹیفکیشن:",
            content: `
                <p><strong>السلام علیکم!</strong> یہ اب تک کی سب سے بڑی اپڈیٹ ہے! آپ کا بل جنریٹر اب مکمل بل مینجمنٹ سسٹم بن چکا ہے:</p>
                <ul>
                    <li><strong>✏️ کسی بھی بل کو ایڈٹ کریں:</strong> ہسٹری سے کوئی بھی پرانا بل کھولیں، جو چاہیں تبدیل کریں (آئٹمز، گاہک، تاریخ، ریٹ) اور اسی بل نمبر پر محفوظ کر دیں۔ کوئی ڈپلیکیٹ بل نہیں بنے گا!</li>
                    <li><strong>👁️ بل دیکھیں (صرف دیکھنے کے لیے):</strong> پرانا بل دوبارہ چاہیے؟ صرف دیکھیں اور دوبارہ پرنٹ، پی ڈی ایف/تصویر ڈاؤن لوڈ یا دوبارہ شیئر کریں — بالکل محفوظ، کوئی تبدیلی ممکن نہیں۔</li>
                    <li><strong>🗑️ ایک ساتھ کئی بلز ڈیلیٹ:</strong> ایک ساتھ کئی بلز منتخب کر کے ڈیلیٹ کریں۔</li>
                    <li><strong>📥 ہسٹری ڈاؤن لوڈ:</strong> اپنی مکمل بلز ہسٹری پی ڈی ایف، ایکسل (CSV) یا ٹیکسٹ فائل میں حاصل کریں۔</li>
                    <li><strong>🔄 نیا بل آرڈر (سمارٹ ریفریش):</strong> اب آپ خود فیصلہ کریں کہ نیا بل کب شروع ہو! سیٹنگز میں پرنٹ، شیئر، سیو پی ڈی ایف یا سیو جے پی جی میں سے کوئی بھی (ایک یا زیادہ) منتخب کریں — وہ مکمل ہوتے ہی آپ کا بل خود بخود نئے نمبر کے ساتھ ریفریش ہو جائے گا۔</li>
                    <li><strong>🆕 اسمارٹ بل نمبرنگ:</strong> بل نمبر اب ہمیشہ آپ کی ہسٹری کے آخری اصل نمبر سے آگے بڑھے گا — غلط نمبرز کا مسئلہ ختم!</li>
                    <li><strong>🕐 ہسٹری میں تاریخ اور وقت:</strong> ہر محفوظ شدہ بل کے ساتھ تاریخ اور وقت دونوں لیجر میں نظر آئیں گے۔</li>
                    <li><strong>ایڈٹ پر مکمل واپسی:</strong> بل ایڈٹ کرتے وقت سب کچھ واپس آ جاتا ہے — تاریخ، وقت، این ٹی این، نوٹ، گاہک، اونر، ٹائٹل سائز اور تمام سیٹنگز بالکل ویسے ہی جیسے تھیں۔</li>
                </ul>
                <p>اگر کوئی مسئلہ ہو تو براؤزر کو ایک بار Hard Refresh (Ctrl + F5) کریں۔ مزہ کریں! 🚀</p>
            `
        }
    };

    // -----------------------------------------------------------
    // 📊 2. LOGIC: Check View Counts (Max 3 Times)
    // -----------------------------------------------------------
    const savedVersion = localStorage.getItem('app_last_update_version');
    let viewCount = parseInt(localStorage.getItem('app_update_view_count') || '0', 10);

    // Reset counter if version is new
    if (savedVersion !== CURRENT_UPDATE.version) {
        localStorage.setItem('app_last_update_version', CURRENT_UPDATE.version);
        viewCount = 0;
        localStorage.setItem('app_update_view_count', '0');
    }

    // Stop if already viewed 3 times
    if (viewCount >= 5) {
        return; 
    }

    // Increment count
    viewCount++;
    localStorage.setItem('app_update_view_count', viewCount.toString());

    // -----------------------------------------------------------
    // 🎨 3. RENDER POPUP & STYLES
    // -----------------------------------------------------------
    window.addEventListener('DOMContentLoaded', () => {
        renderUpdateModal(CURRENT_UPDATE, viewCount);
    });
})();

function renderUpdateModal(data, currentCount) {
    let currentLang = 'en'; // 👈 Default Language set to English

    // Dynamic Style Injection
    const style = document.createElement('style');
    style.id = 'update-modal-styles';
    style.innerHTML = `
        .update-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.65); backdrop-filter: blur(4px);
            display: flex; align-items: center; justify-content: center;
            z-index: 999999; padding: 15px; box-sizing: border-box;
            animation: fadeIn 0.3s ease-in-out;
        }

        .update-card {
            background: #ffffff; width: 100%; max-width: 520px; max-height: 85vh;
            border-radius: 16px; box-shadow: 0 15px 35px rgba(0,0,0,0.3);
            display: flex; flex-direction: column; overflow: hidden;
            font-family: system-ui, -apple-system, sans-serif; position: relative;
            transition: all 0.2s ease;
        }

        /* Language Toggle Bar */
        .update-lang-bar {
            background: #1a252f; padding: 8px 15px;
            display: flex; justify-content: center; align-items: center; gap: 10px;
            border-bottom: 1px solid #34495e;
        }

        .lang-btn {
            background: transparent; border: 1px solid #5d6d7e; color: #abb2b9;
            padding: 4px 16px; border-radius: 20px; font-size: 13px; font-weight: bold;
            cursor: pointer; transition: all 0.2s ease;
        }

        .lang-btn.active {
            background: #3498db; color: #ffffff; border-color: #3498db;
            box-shadow: 0 2px 6px rgba(52, 152, 219, 0.4);
        }

        .update-header {
            padding: 14px 20px; background: #2c3e50; color: #ffffff;
            display: flex; align-items: center; justify-content: space-between;
        }

        .update-header h3 { margin: 0; font-size: 17px; font-weight: 600; }

        .close-update-btn {
            background: rgba(255,255,255,0.15); border: none; color: #fff;
            width: 30px; height: 30px; border-radius: 50%; font-size: 14px;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            transition: background 0.2s;
        }
        .close-update-btn:hover { background: #e74c3c; }

        .update-body {
            padding: 20px; overflow-y: auto; color: #333333; font-size: 14px;
            line-height: 1.6; flex-grow: 1; max-height: calc(85vh - 150px);
        }

        .update-body ul { padding-left: 20px; margin: 10px 0; }
        .update-card[dir="rtl"] .update-body ul { padding-left: 0; padding-right: 20px; }
        .update-body li { margin-bottom: 8px; }

        .update-footer {
            padding: 12px 20px; background: #f8f9fa; border-top: 1px solid #eeeeee;
            display: flex; align-items: center; justify-content: space-between;
        }

        .view-badge {
            font-size: 12px; color: #7f8c8d; font-weight: bold;
            background: #eef2f5; padding: 4px 10px; border-radius: 12px;
        }

        .btn-ok {
            background: #27ae60; color: white; border: none;
            padding: 8px 22px; border-radius: 6px; font-weight: bold;
            cursor: pointer; transition: background 0.2s; font-size: 14px;
        }
        .btn-ok:hover { background: #219150; }

        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
    `;
    document.head.appendChild(style);

    // HTML Structure
    const modalHtml = `
        <div class="update-overlay" id="updateOverlay">
            <div class="update-card" id="updateCard" dir="ltr">
                <div class="update-lang-bar">
                    <button class="lang-btn active" id="btnLangEn">English</button>
                    <button class="lang-btn" id="btnLangUr">اردو</button>
                </div>
                <div class="update-header">
                    <h3 id="updateTitle">${data.en.title}</h3>
                    <button class="close-update-btn" id="closeUpdateModal" title="Close">❌</button>
                </div>
                <div class="update-body" id="updateContent">
                    ${data.en.content}
                </div>
                <div class="update-footer">
                    <span class="view-badge" id="updateBadge">${data.en.badgePrefix} ${currentCount} / 5</span>
                    <button class="btn-ok" id="btnOkUpdate">${data.en.okBtn}</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Elements
    const card = document.getElementById('updateCard');
    const title = document.getElementById('updateTitle');
    const content = document.getElementById('updateContent');
    const badge = document.getElementById('updateBadge');
    const okBtn = document.getElementById('btnOkUpdate');
    const btnEn = document.getElementById('btnLangEn');
    const btnUr = document.getElementById('btnLangUr');

    // Switch Language Function
    const switchLanguage = (lang) => {
        currentLang = lang;
        const langData = data[lang];

        if (lang === 'ur') {
            card.setAttribute('dir', 'rtl');
            btnUr.classList.add('active');
            btnEn.classList.remove('active');
        } else {
            card.setAttribute('dir', 'ltr');
            btnEn.classList.add('active');
            btnUr.classList.remove('active');
        }

        title.innerHTML = langData.title;
        content.innerHTML = langData.content;
        badge.innerHTML = `${langData.badgePrefix} ${currentCount} / 5`;
        okBtn.innerHTML = langData.okBtn;
    };

    // Event Listeners for Buttons
    btnEn.addEventListener('click', () => switchLanguage('en'));
    btnUr.addEventListener('click', () => switchLanguage('ur'));

    // Close Actions
    const closeModal = () => {
        const overlay = document.getElementById('updateOverlay');
        if (overlay) overlay.remove();
    };

    document.getElementById('closeUpdateModal').addEventListener('click', closeModal);
    okBtn.addEventListener('click', closeModal);
}
