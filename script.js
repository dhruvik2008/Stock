function formatDateDDMMYYYY(dateObj) {
    if (!dateObj) return '';
    try {
        const d = parseDateDDMMYYYY(dateObj);
        if (isNaN(d.getTime())) return typeof dateObj === 'string' ? dateObj : '';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return day + '-' + month + '-' + year;
    } catch (e) {
        return dateObj;
    }
}

function formatTimeHHMM(dateObj) {
    if (!dateObj) return '';
    try {
        let d = dateObj;
        if (typeof dateObj === 'string' || typeof dateObj === 'number') {
            d = new Date(dateObj);
        }
        if (isNaN(d)) return '';
        let h = d.getHours();
        const min = String(d.getMinutes()).padStart(2, '0');
        const ampm = h >= 12 ? 'pm' : 'am';
        h = h % 12;
        h = h ? h : 12;
        return (h < 10 ? '0' + h : h) + ':' + min + ' ' + ampm;
    } catch (e) {
        return '';
    }
}

function formatDateTime(dateObj) {
    if (!dateObj) return '';
    const dStr = formatDateDDMMYYYY(dateObj);
    const tStr = formatTimeHHMM(dateObj);
    if (dStr && tStr) return dStr + ', ' + tStr;
    return dStr;
}

function parseDateDDMMYYYY(str) {
    if (!str) return new Date();
    if (str instanceof Date) return str;

    if (typeof str === 'string') {
        // Remove time portion if exists (e.g., "06-03-2026, 11:05 am")
        const cleanStr = str.split(',')[0].split('T')[0].trim();
        const parts = cleanStr.split(/[-/]/);
        if (parts.length === 3) {
            const p0 = parseInt(parts[0], 10);
            const p1 = parseInt(parts[1], 10);
            const p2 = parseInt(parts[2], 10);

            if (parts[0].length === 4) { // YYYY-MM-DD
                return new Date(p0, p1 - 1, p2);
            } else if (parts[2].length === 4) { // DD-MM-YYYY
                return new Date(p2, p1 - 1, p0);
            }
        }
    }

    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date() : d;
}
/* ================================================
   VASTRA – JavaScript
================================================ */

// ── CREDENTIALS ──────────────────────────────────
const FIXED_EMAIL = 'maniyadhruvik07@gmail.com';
const FIXED_PASSWORD = 'maniya@#07';

// ── STATE ─────────────────────────────────────────
let designs = []; // Now loaded asynchronously from VastraDB
let categories = [];
let editingDesignId = null;  // null = Add mode, number = Edit mode

// ── SUPPLIER PROFILE ─────────────────────────────
function getSupplierProfile() {
    return JSON.parse(localStorage.getItem('vastra_supplier') || '{}');
}
function openSupplierProfile() {
    const s = getSupplierProfile();
    document.getElementById('supName').value = s.name || '';
    document.getElementById('supAddress').value = s.address || '';
    document.getElementById('supGST').value = s.gst || '';
    document.getElementById('supCity').value = s.city || '';
    document.getElementById('supPincode').value = s.pincode || '';
    document.getElementById('supState').value = s.state || '';
    document.getElementById('supStateCode').value = s.stateCode || '';
    document.getElementById('supPhone').value = s.phone || '';
    document.getElementById('supHSN').value = s.hsn || '';
    document.getElementById('supTerms').value = s.terms || '1. E. & O.E. 2. Goods once sold will not be taken back or exchanged. 3. Supplier is not responsible for any loss or damaged of goods in transit. 4. Disputes, if any, will be subject to seller place jurisdiction.';
    document.getElementById('supplierProfileModal').style.display = 'flex';
}
function closeSupplierProfile() {
    document.getElementById('supplierProfileModal').style.display = 'none';
}
function saveSupplierProfile() {
    const sup = {
        name: document.getElementById('supName').value.trim(),
        address: document.getElementById('supAddress').value.trim(),
        gst: document.getElementById('supGST').value.trim(),
        city: document.getElementById('supCity').value.trim(),
        pincode: document.getElementById('supPincode').value.trim(),
        state: document.getElementById('supState').value.trim(),
        stateCode: document.getElementById('supStateCode').value.trim(),
        phone: document.getElementById('supPhone').value.trim(),
        hsn: document.getElementById('supHSN').value.trim(),
        terms: document.getElementById('supTerms').value.trim(),
    };
    if (!sup.name) { alert('Supplier Name is required!'); return; }
    sup.updatedAt = Date.now();
    localStorage.setItem('vastra_supplier', JSON.stringify(sup));
    closeSupplierProfile();
    showToast('Supplier Profile saved! 🏢');
}

// ── HELPERS ──────────────────────────────────────
function showPage(id) {
    document.querySelectorAll('.auth-card').forEach(c => c.classList.remove('active-card'));
    document.getElementById(id).classList.add('active-card');
    clearErrors();
}

function clearErrors() {
    ['signInError', 'signUpError', 'signUpSuccess'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.style.display = 'none'; el.textContent = ''; }
    });
}

function showError(id, msg) {
    const el = document.getElementById(id);
    el.textContent = '⚠ ' + msg;
    el.style.display = 'block';
}

function showSuccess(id, msg) {
    const el = document.getElementById(id);
    el.textContent = '✓ ' + msg;
    el.style.display = 'block';
}

function togglePass(inputId, btn) {
    const inp = document.getElementById(inputId);
    if (inp.type === 'password') {
        inp.type = 'text';
        btn.innerHTML = '<i class="fa fa-eye-slash"></i>';
    } else {
        inp.type = 'password';
        btn.innerHTML = '<i class="fa fa-eye"></i>';
    }
}

// ── SIGN IN ──────────────────────────────────────
function signIn() {
    const email = document.getElementById('siEmail').value.trim();
    const pass = document.getElementById('siPassword').value;

    if (!email || !pass) return showError('signInError', 'Please fill in all fields.');
    if (email !== FIXED_EMAIL) return showError('signInError', 'Email not found.');
    if (pass !== FIXED_PASSWORD) return showError('signInError', 'Incorrect password.');

    // Save initial auth success
    localStorage.setItem('vastra_auth_success', 'true');
    showPage('userSelectPage');
}

// ── USER & ROLE SELECTION FLOW ──────────────────
let selectedUserForLogin = null;

const ALL_USER_PINS = {
    'Vishal': '2179',
    'Piyush': '2179',
    'Amish': '1734',
    'Office': '4973',
    'Packing': '1568',
    'Bholo': '2491'
};

// Default permissions if none exist
const DEFAULT_PERMISSIONS = {
    Amish: ['designsSection', 'challansSection'],
    Office: ['designsSection', 'challansSection', 'packSection', 'salesReturnSection', 'analysisSection'],
    Packing: ['packSection', 'designsSection'],
    Bholo: ['designsSection']
};

function handleUserClick(user) {
    selectedUserForLogin = user;
    document.getElementById('userSelectError').style.display = 'none';
    document.getElementById('userSelectGrid').style.display = 'none';
    document.getElementById('pinSection').style.display = 'block';
    document.getElementById('pinLabel').textContent = 'Enter PIN for ' + user;
    document.getElementById('userPinInput').value = '';
    setTimeout(() => document.getElementById('userPinInput').focus(), 100);
}

function verifyFinalPin() {
    const pin = document.getElementById('userPinInput').value;
    const correctPin = ALL_USER_PINS[selectedUserForLogin];

    if (pin === correctPin) {
        completeUserLogin(selectedUserForLogin);
    } else {
        showError('userSelectError', 'Incorrect PIN for ' + selectedUserForLogin);
        document.getElementById('userPinInput').value = '';
        document.getElementById('userPinInput').focus();
    }
}

function cancelPinEntry() {
    selectedUserForLogin = null;
    document.getElementById('pinSection').style.display = 'none';
    document.getElementById('userSelectGrid').style.display = 'grid';
    document.getElementById('userSelectError').style.display = 'none';
}

function completeUserLogin(user) {
    localStorage.setItem('vastra_currentUser', user);
    localStorage.setItem('vastra_session', 'active');
    goToDashboard();
}

function applyPermissions() {
    const user = localStorage.getItem('vastra_currentUser') || 'Admin';
    const isAdmin = (user === 'Vishal' || user === 'Piyush');

    // Show/Hide Admin-only elements
    const adminSidebar = document.getElementById('adminOnlySidebar');
    if (adminSidebar) adminSidebar.style.display = isAdmin ? 'block' : 'none';

    if (isAdmin) {
        // Show everything for admin
        const allItems = document.querySelectorAll('.sidebar-item');
        allItems.forEach(i => i.style.display = 'flex');
        return;
    }

    // Staff Mode: Filter menus
    let permissions = JSON.parse(localStorage.getItem('vastra_role_permissions'));
    if (!permissions) {
        permissions = DEFAULT_PERMISSIONS;
    }
    const allowed = permissions[user] || [];

    const menuLinks = [
        { id: 'designsSection', el: document.querySelector('[onclick*="designsSection"]') },
        { id: 'challansSection', el: document.querySelector('[onclick*="challansSection"]') },
        { id: 'packSection', el: document.querySelector('[onclick*="packSection"]') },
        { id: 'salesReturnSection', el: document.querySelector('[onclick*="salesReturnSection"]') },
        { id: 'analysisSection', el: document.querySelector('[onclick*="analysisSection"]') },
        { id: 'returnAnalysisSection', el: document.querySelector('[onclick*="returnAnalysisSection"]') },
        { id: 'liveStockSection', el: document.querySelector('[onclick*="liveStockSection"]') },
        { id: 'totalSellReportSection', el: document.querySelector('[onclick*="totalSellReportSection"]') },
        { id: 'lowStockSection', el: document.getElementById('sideLowStock') }
    ];

    menuLinks.forEach(item => {
        if (item.el) item.el.style.display = allowed.includes(item.id) ? 'flex' : 'none';
    });

    // Auto-redirect if current section is hidden
    const currentSectionId = document.querySelector('.page-section:not([style*="display: none"])')?.id;
    if (currentSectionId && !allowed.includes(currentSectionId)) {
        const first = allowed[0];
        if (first) {
            const link = menuLinks.find(m => m.id === first)?.el;
            if (link) link.click();
        }
    }
}

// ── PERMISSION MANAGEMENT (Admin Only) ──
const MENU_ITEMS = [
    { id: 'designsSection', label: 'Designs' },
    { id: 'challansSection', label: 'Delivery Challan' },
    { id: 'packSection', label: 'Pack Design' },
    { id: 'salesReturnSection', label: 'Sales Return' },
    { id: 'analysisSection', label: 'Analysis' },
    { id: 'returnAnalysisSection', label: 'Return Analysis' },
    { id: 'liveStockSection', label: 'Live Stock' },
    { id: 'totalSellReportSection', label: 'Total Sell Report' },
    { id: 'lowStockSection', label: 'Low Stock Alert' }
];
const ROLES = ['Amish', 'Office', 'Packing', 'Bholo'];

function renderPermissionsTable() {
    const permissions = JSON.parse(localStorage.getItem('vastra_role_permissions') || JSON.stringify(DEFAULT_PERMISSIONS));
    const tbody = document.getElementById('permissionsTableBody');
    if (!tbody) return;

    tbody.innerHTML = MENU_ITEMS.map(menu => {
        const checks = ROLES.map(role => {
            const chk = (permissions[role] || []).includes(menu.id) ? 'checked' : '';
            return `<td style="padding:12px; text-align:center;">
                        <input type="checkbox" class="perm-check" data-role="${role}" data-menu="${menu.id}" ${chk} style="width:18px; height:18px; cursor:pointer;" />
                    </td>`;
        }).join('');
        return `<tr style="border-bottom:1px solid #eee;">
                    <td style="padding:12px; font-weight:500; color:#333;">${menu.label}</td>
                    ${checks}
                </tr>`;
    }).join('');
}

function saveAllPermissions() {
    const data = {};
    ROLES.forEach(r => data[r] = []);
    document.querySelectorAll('.perm-check').forEach(c => {
        if (c.checked) data[c.dataset.role].push(c.dataset.menu);
    });
    localStorage.setItem('vastra_role_permissions', JSON.stringify(data));
    // Also store updatedAt for the whole permissions object
    const meta = JSON.parse(localStorage.getItem('vastra_role_permissions_meta') || '{}');
    meta.updatedAt = Date.now();
    localStorage.setItem('vastra_role_permissions_meta', JSON.stringify(meta));

    showToast('Permissions saved successfully! 🔐');
    applyPermissions();
}

// ── INDEXED_DB HELPER (For Unlimited Storage) ──
const VastraDB = {
    dbName: 'VastraDB',
    dbVersion: 1,
    storeName: 'designs',
    _db: null,

    async init() {
        if (this._db) return this._db;
        return new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(this.dbName, this.dbVersion);
                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        db.createObjectStore(this.storeName, { keyPath: 'id' });
                    }
                };
                request.onsuccess = (e) => {
                    this._db = e.target.result;
                    resolve(this._db);
                };
                request.onerror = (e) => {
                    console.error("IndexedDB Open Error:", e);
                    reject(e.target.error);
                };
            } catch (err) {
                reject(err);
            }
        });
    },

    async saveAll(data) {
        try {
            const db = await this.init();
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);

            // Fast clear and repopulate
            await new Promise((res, rej) => {
                const clearReq = store.clear();
                clearReq.onsuccess = res;
                clearReq.onerror = rej;
            });

            for (let item of data) {
                if (!item.id) item.id = Date.now() + Math.random();
                if (!item.updatedAt) item.updatedAt = Date.now();
                store.put(item);
            }

            return new Promise((resolve, reject) => {
                tx.oncomplete = () => {
                    console.log(`IndexedDB: Saved ${data.length} designs.`);
                    resolve();
                };
                tx.onerror = (e) => {
                    console.error("IndexedDB Transaction Error:", e);
                    reject(e.target.error);
                };
            });
        } catch (err) {
            console.error("VastraDB.saveAll failed:", err);
            throw err;
        }
    },

    async getAll() {
        try {
            const db = await this.init();
            const tx = db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);

            return new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = (e) => reject(e.target.error);
                tx.onerror = (e) => reject(e.target.error);
            });
        } catch (err) {
            console.error("VastraDB.getAll failed:", err);
            return [];
        }
    }
};

function goToDashboard() {
    const user = localStorage.getItem('vastra_currentUser') || 'Admin';
    document.getElementById('authWrapper').style.display = 'none';
    document.getElementById('dashboardWrapper').style.display = 'flex';
    document.getElementById('navUserName').textContent = user;

    applyPermissions();
    if (user === 'Vishal' || user === 'Piyush') {
        renderPermissionsTable();
    }

    renderDesignsTable();
    updateStats();
}

// Allow Enter key on sign-in fields
document.addEventListener('DOMContentLoaded', () => {
    ['siEmail', 'siPassword'].forEach(id => {
        document.getElementById(id)?.addEventListener('keydown', e => {
            if (e.key === 'Enter') signIn();
        });
    });
});

// ── SIGN UP ──────────────────────────────────────
function signUp() {
    const name = document.getElementById('suName').value.trim();
    const email = document.getElementById('suEmail').value.trim();
    const pass = document.getElementById('suPassword').value;
    const confirm = document.getElementById('suConfirm').value;

    if (!name || !email || !pass || !confirm) return showError('signUpError', 'Please fill in all fields.');
    if (!/\S+@\S+\.\S+/.test(email)) return showError('signUpError', 'Enter a valid email address.');
    if (pass.length < 6) return showError('signUpError', 'Password must be at least 6 characters.');
    if (pass !== confirm) return showError('signUpError', 'Passwords do not match.');

    document.getElementById('signUpError').style.display = 'none';
    showSuccess('signUpSuccess', 'Account created! Please sign in.');
    setTimeout(() => showPage('signInPage'), 1800);
}

// ── LOGOUT ───────────────────────────────────────
function logout() {
    localStorage.removeItem('vastra_session');
    localStorage.removeItem('vastra_currentUser');
    localStorage.removeItem('vastra_auth_success');

    document.getElementById('dashboardWrapper').style.display = 'none';
    document.getElementById('authWrapper').style.display = 'flex';
    document.getElementById('siEmail').value = '';
    document.getElementById('siPassword').value = '';
    showPage('signInPage');
}

// Allow Enter key on PIN input
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('userPinInput')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') verifyFinalPin();
    });
});

// ── SIDEBAR ───────────────────────────────────────
function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    if (window.innerWidth <= 680) {
        sb.classList.toggle('mobile-open');
    } else {
        sb.classList.toggle('collapsed');
    }
}

function setActive(el) {
    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
}

// ── SECTION SWITCHING ────────────────────────────────
function showSection(sectionId, sidebarEl) {
    // Switch sidebar active state
    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
    if (sidebarEl) sidebarEl.classList.add('active');
    // Show the correct section, hide others
    const allSections = [
        'designsSection', 'challansSection', 'packSection', 'salesReturnSection',
        'analysisSection', 'returnAnalysisSection', 'liveStockSection',
        'liveStockDetailSection', 'totalSellReportSection', 'lowStockSection',
        'permissionsSection'
    ];

    allSections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = (id === sectionId) ? 'block' : 'none';

        if (id === sectionId) {
            if (id === 'liveStockSection') renderLiveStock();
            if (id === 'lowStockSection') renderLowStockAlert();
            if (id === 'permissionsSection') renderPermissionsTable();
        }
    });
}

// ── MODAL: ADD NEW DESIGN ─────────────────────────
function openAddDesignModal() {
    editingDesignId = null;
    document.querySelector('.modal-title').textContent = 'Add New Design';

    // Reset all fields
    ['dName', 'dPrice', 'dDesc', 'dTags', 'dHSN', 'dSize', 'dMinStock', 'dMinOrder', 'dSample'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('dSetWise').checked = false;
    document.getElementById('dOutOfStock').checked = false;
    categories = [];
    renderCategories();
    resetImgPreview();
    closeAccordion();

    // Hide stock detail and delete button in Add mode
    const stockBtn = document.getElementById('btnStockDetail');
    if (stockBtn) stockBtn.style.display = 'none';
    const delBtn = document.getElementById('btnDeleteDesign');
    if (delBtn) delBtn.style.display = 'none';

    document.getElementById('addDesignModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// ── MODAL: EDIT DESIGN ────────────────────────────
function openEditDesignModal(id) {
    const d = designs.find(x => x.id === id);
    if (!d) return;

    editingDesignId = id;
    document.querySelector('.modal-title').textContent = 'Edit Design';

    // Pre-fill all fields
    const setVal = (elId, val) => {
        const el = document.getElementById(elId);
        if (el) el.value = (val && val !== '–') ? val : '';
    };
    setVal('dName', d.name);
    setVal('dPrice', d.price);
    setVal('dDesc', d.desc);
    setVal('dTags', d.tags);
    setVal('dHSN', d.hsn);
    setVal('dSize', d.size);
    setVal('dMinStock', d.minStock);
    setVal('dMinOrder', d.minOrder);
    setVal('dSample', d.sample);

    document.getElementById('dSetWise').checked = !!d.setWise;
    document.getElementById('dOutOfStock').checked = !!d.outOfStock;

    // Categories
    categories = d.categories ? [...d.categories] : [];
    renderCategories();

    // Show delete button in edit mode
    const delBtn = document.getElementById('btnDeleteDesign');
    if (delBtn) delBtn.style.display = 'block';

    // Image
    const preview = document.getElementById('imgPreview');
    if (d.imgSrc) {
        preview.innerHTML = `<img src="${d.imgSrc}" alt="${d.name}"/>`;
    } else {
        resetImgPreview();
    }

    // Open additional detail if any extra fields are filled
    const hasExtra = (d.hsn && d.hsn !== '–') || (d.gst && d.gst !== '–') ||
        (d.minStock && d.minStock !== '–') || (d.minOrder && d.minOrder !== '–');
    if (hasExtra) {
        document.getElementById('accordionBody').style.display = 'block';
        document.querySelector('.accordion-header')?.classList.add('open');
    } else {
        closeAccordion();
    }

    // Show stock detail button in Edit mode
    const stockBtn = document.getElementById('btnStockDetail');
    if (stockBtn) stockBtn.style.display = 'inline-flex';

    document.getElementById('addDesignModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    setTimeout(function () { generateCodes(d.name); }, 150);
}

function closeAddDesignModal() {
    document.getElementById('addDesignModal').style.display = 'none';
    document.body.style.overflow = '';
}

// Close modal on overlay click
document.getElementById('addDesignModal')?.addEventListener('click', function (e) {
    if (e.target === this) closeAddDesignModal();
});

// Live-generate codes while typing design name
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('dName')?.addEventListener('input', function () {
        const name = this.value.trim();
        if (name.length >= 2) generateCodes(name);
        else hideCodes();
    });
});

// ── QR CODE + BARCODE ─────────────────────────────
let qrInstance = null;

function generateCodes(designName) {
    const section = document.getElementById('qrBarcodeSection');
    const qrBox = document.getElementById('qrCodeBox');
    const canvas = document.getElementById('barcodeCanvas');

    section.style.display = 'block';

    // ── QR Code ──
    qrBox.innerHTML = '';       // clear old
    qrInstance = null;
    try {
        qrInstance = new QRCode(qrBox, {
            text: designName,
            width: 110,
            height: 110,
            colorDark: '#1565C0',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H,
        });
    } catch (e) { console.warn('QR error', e); }

    // ── Barcode (CODE128) ──
    // JsBarcode needs a safe string (no special chars for some formats)
    const safeText = designName.replace(/[^A-Za-z0-9\-\.\s]/g, '').trim() || 'DESIGN';
    try {
        JsBarcode(canvas, safeText, {
            format: 'CODE128',
            width: 1.8,
            height: 55,
            displayValue: true,
            fontSize: 11,
            fontOptions: 'bold',
            lineColor: '#1565C0',
            background: '#ffffff',
            margin: 6,
        });
    } catch (e) {
        // Fallback: try CODE39 for symbols
        try {
            JsBarcode(canvas, 'DESIGN', {
                format: 'CODE128', width: 1.8, height: 55,
                displayValue: true, fontSize: 11, lineColor: '#1565C0',
            });
        } catch (e2) { console.warn('Barcode error', e2); }
    }
}

function hideCodes() {
    document.getElementById('qrBarcodeSection').style.display = 'none';
}

// ── PRINT CODES ───────────────────────────────────
function printCodes() {
    const designName = document.getElementById('dName').value.trim() || 'Design';
    const qrImg = document.querySelector('#qrCodeBox canvas, #qrCodeBox img');
    const bcCanvas = document.getElementById('barcodeCanvas');

    const qrSrc = qrImg ? (qrImg.tagName === 'CANVAS' ? qrImg.toDataURL() : qrImg.src) : '';
    const bcSrc = bcCanvas ? bcCanvas.toDataURL() : '';

    const win = window.open('', '_blank', 'width=420,height=520');
    win.document.write(`
      <!DOCTYPE html><html><head>
      <title>Print – ${designName}</title>
      <style>
        body { font-family: Inter, sans-serif; text-align: center; padding: 24px; }
        h2   { color: #1565C0; font-size: 18px; margin-bottom: 6px; }
        p    { color: #666; font-size: 12px; margin: 0 0 20px; }
        .row { display: flex; justify-content: center; gap: 30px; flex-wrap: wrap; }
        .box { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .lbl { font-size: 11px; font-weight: 700; color: #8A95A3; text-transform: uppercase; letter-spacing: .5px; }
        img  { border: 1px solid #E9ECF0; border-radius: 8px; padding: 6px; }
        @media print { button { display:none; } }
      </style></head><body>
      <h2>${designName}</h2>
      <p>VASTRA – Textile Management</p>
      <div class="row">
        <div class="box"><div class="lbl">QR Code</div><img src="${qrSrc}" width="130" height="130"/></div>
        <div class="box"><div class="lbl">Barcode</div><img src="${bcSrc}" height="80" style="max-width:200px"/></div>
      </div>
      <br/><button onclick="window.print()" style="padding:10px 24px;background:#1565C0;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;">🖨️ Print</button>
      </body></html>`);
    win.document.close();
}

// ── IMAGE PREVIEW ─────────────────────────────────
function previewImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const preview = document.getElementById('imgPreview');
        preview.innerHTML = `<img src="${e.target.result}" alt="Design"/>`;
        // Auto-generate codes after image upload using current design name
        const name = document.getElementById('dName').value.trim();
        if (name) generateCodes(name);
    };
    reader.readAsDataURL(file);
}

function resetImgPreview() {
    document.getElementById('imgPreview').innerHTML = '<i class="fa fa-tshirt fa-3x" style="color:#b0c4d8"></i>';
}

// ── CATEGORY ─────────────────────────────────────
function addCategory() {
    const name = prompt('Enter Category Name:');
    if (!name || !name.trim()) return;
    categories.push(name.trim());
    renderCategories();
}

function removeCategory(idx) {
    categories.splice(idx, 1);
    renderCategories();
}

function renderCategories() {
    const list = document.getElementById('categoryList');
    list.innerHTML = categories.map((c, i) =>
        `<div class="cat-chip">
       ${c}
       <span class="remove" onclick="removeCategory(${i})">✕</span>
     </div>`
    ).join('');
}

// ── ACCORDION ─────────────────────────────────────
function toggleAccordion() {
    const body = document.getElementById('accordionBody');
    const icon = document.getElementById('accIcon');
    const header = document.querySelector('.accordion-header');
    const isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : 'block';
    header.classList.toggle('open', !isOpen);
}

function closeAccordion() {
    document.getElementById('accordionBody').style.display = 'none';
    document.querySelector('.accordion-header')?.classList.remove('open');
}

// ── STOCK DETAIL ─────────────────────────────────
function showStockDetail() {
    if (!editingDesignId) return;
    const d = designs.find(x => x.id === editingDesignId);
    if (!d) return;

    closeAddDesignModal();
    openLiveStockDetail(d.name);
}

function closeStockDetail() {
    // Unused popup method, kept for reference
    document.getElementById('stockDetailDialog').style.display = 'none';
}

// ── HELPER: Resize image to save space in localStorage ──
async function resizeImage(base64Str, maxWidth = 800, maxHeight = 800) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7)); // compress to 70% quality jpeg
        };
        img.onerror = () => resolve(base64Str); // fallback if fails
    });
}

// ── SAVE DESIGN (Add + Edit) ──────────────────────
async function saveDesign() {
    const saveBtn = document.querySelector('.btn-save-design[onclick="saveDesign()"]');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> SAVING...';
    }

    try {
        const name = document.getElementById('dName').value.trim();
        if (!name) {
            alert('Design Name/Number is required!');
            document.getElementById('dName').focus();
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fa fa-save"></i> SAVE DESIGN';
            }
            return;
        }

        let imgSrc = document.querySelector('#imgPreview img')?.src || null;
        // Compress image if it's a large base64 string
        if (imgSrc && imgSrc.startsWith('data:image') && imgSrc.length > 50000) {
            try {
                imgSrc = await resizeImage(imgSrc);
            } catch (err) {
                console.warn("Image resize failed, using original", err);
            }
        }

        // Stricter Duplicate check (Master List)
        const isDuplicate = designs.some(d => 
            d.name.trim().toLowerCase() === name.trim().toLowerCase() && 
            d.id !== editingDesignId &&
            !d.deleted // Only active duplicates for now, but trimmed
        );
        if (isDuplicate) {
            showErrorToast(`Design "${name}" already exists in your list! 🚫`);
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fa fa-save"></i> SAVE DESIGN';
            }
            return;
        }

        const existingDesign = editingDesignId !== null ? designs.find(x => x.id === editingDesignId) : null;

        const designData = {
            id: editingDesignId || Date.now(),
            updatedAt: Date.now(),
            name,
            price: document.getElementById('dPrice').value.trim() || '–',
            desc: document.getElementById('dDesc').value.trim() || '–',
            categories: [...categories],
            tags: document.getElementById('dTags').value.trim() || '–',
            hsn: document.getElementById('dHSN').value.trim() || '–',
            size: document.getElementById('dSize').value.trim() || '–',
            gst: existingDesign ? (existingDesign.gst || '–') : '–',
            minStock: document.getElementById('dMinStock').value.trim() || '–',
            minOrder: document.getElementById('dMinOrder').value.trim() || '–',
            setWise: document.getElementById('dSetWise').checked,
            outOfStock: document.getElementById('dOutOfStock').checked,
            sample: document.getElementById('dSample').value.trim() || '–',
            imgSrc: imgSrc,
            createdBy: localStorage.getItem('vastra_currentUser') || 'Admin',
        };

        if (editingDesignId !== null) {
            const idx = designs.findIndex(d => d.id === editingDesignId);
            if (idx !== -1) {
                designs[idx] = { ...designs[idx], ...designData };
            }
            showToast('Design updated successfully! ✏️');
        } else {
            designs.push({
                createdAt: formatDateDDMMYYYY(new Date()),
                ...designData,
            });
            showToast('Design saved successfully! 🎉');
        }

        // Storage phase
        try {
            await VastraDB.saveAll(designs);
        } catch (dbErr) {
            console.error("IndexedDB Save Failed:", dbErr);
            // We ignore it and fall back to localStorage/memory
        }

        try {
            localStorage.setItem('vastra_designs', JSON.stringify(designs));
            localStorage.setItem('vastra_designs_updatedAt', Date.now()); // Mark designs as updated
        } catch (storageErr) {
            console.warn("LocalStorage quota exceeded, but data is in memory/IndexedDB", storageErr);
        }

        closeAddDesignModal();
        renderDesignsTable();
        updateStats();
    } catch (e) {
        console.error("Critical Save Error:", e);
        alert("Unexpected error while saving. Please check the name and try again.");
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fa fa-save"></i> SAVE DESIGN';
        }
    }
}

// ── CARD GRID RENDER ──────────────────────────
function renderDesignsTable() {
    const grid = document.getElementById('designsGrid');
    const empty = document.getElementById('designsEmpty');
    const searchInput = document.getElementById('designsSearchInput');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    if (designs.length === 0 && !query) {
        grid.innerHTML = '';
        grid.appendChild(empty);
        empty.style.display = 'block';
        return;
    }

    let filteredDesigns = designs.filter(d => !d.deleted);
    if (query) {
        filteredDesigns = filteredDesigns.filter(d => 
            (d.name && String(d.name).toLowerCase().includes(query)) ||
            (d.tags && String(d.tags).toLowerCase().includes(query)) ||
            (d.categories && d.categories.some(c => c && String(c).toLowerCase().includes(query))) ||
            (d.hsn && String(d.hsn).toLowerCase().includes(query)) ||
            (d.size && String(d.size).toLowerCase().includes(query))
        );
    }

    // Sort designs by name/number numerically (e.g., 199, 200, 201)
    filteredDesigns.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true, sensitivity: 'base' }));

    // Hide the empty placeholder
    empty.style.display = 'none';

    // Remove old cards first
    grid.querySelectorAll('.design-card').forEach(c => c.remove());

    if (filteredDesigns.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'design-card';
        noResults.style.gridColumn = '1 / -1';
        noResults.style.textAlign = 'center';
        noResults.style.padding = '20px';
        noResults.innerHTML = '<p style="color:#888;">No designs found matching your search.</p>';
        grid.appendChild(noResults);
        return;
    }

    filteredDesigns.forEach(d => {
        const card = document.createElement('div');
        card.className = 'design-card';

        const imgHTML = d.imgSrc
            ? `<img src="${d.imgSrc}" alt="${d.name}"/>`
            : `<i class="fa fa-tshirt no-img-icon"></i>`;

        const priceHTML = (d.price && d.price !== '–')
            ? `<div class="design-price-badge">₹${d.price}</div>` : '';

        const catText = d.categories && d.categories.length
            ? d.categories.join(', ') : '';

        card.innerHTML = `
      <button class="design-card-del" onclick="deleteDesign(${d.id});event.stopPropagation();">
        <i class="fa fa-trash"></i>
      </button>
      <div class="design-card-img">
        ${imgHTML}
        ${priceHTML}
        <div class="design-card-edit-overlay">
          <i class="fa fa-pencil-alt"></i> Edit
        </div>
      </div>
      <div class="design-card-footer">
        <div class="design-card-name">${d.name}</div>
        <div style="font-size:10px;color:#888;margin-top:2px;">HSN: ${d.hsn || '-'}</div>
        ${(d.size && d.size !== '–') ? `<div style="font-size:10px;color:#888;margin-top:1px;">Size: ${d.size}</div>` : ''}
        ${catText ? `<div class="design-card-cat">${catText}</div>` : ''}
      </div>
    `;
        // Click anywhere on card (except delete btn) → open edit
        card.addEventListener('click', () => openEditDesignModal(d.id));
        grid.appendChild(card);
    });
}

function deleteDesign(id) {
    if (!confirm('Delete this design?')) return;
    
    // Soft delete: mark as deleted instead of removing from array
    // This prevents Firebase smartMerge from bringing it back (resurrection)
    const d = designs.find(x => x.id === id);
    if (d) {
        d.deleted = true;
        d.updatedAt = Date.now();
        d.deletedAt = Date.now();
    } else {
        // Fallback for safety
        designs = designs.filter(x => x.id !== id);
    }

    try {
        VastraDB.saveAll(designs);
        localStorage.setItem('vastra_designs', JSON.stringify(designs));
        localStorage.setItem('vastra_designs_updatedAt', Date.now()); // Mark designs as updated
    } catch (e) {
        console.warn("Delete sync warning:", e);
    }

    renderDesignsTable();
    updateStats();
}

function deleteDesignFromModal() {
    if (editingDesignId) {
        deleteDesign(editingDesignId);
        closeAddDesignModal();
    }
}

// ── STATS UPDATE ──────────────────────────────────
function updateStats() {
    const el = document.getElementById('totalDesigns');
    if (el) el.textContent = designs.filter(d => !d.deleted).length;
}

// ── HELPER: get design image by ID ────────────────
function getDesignImg(designId) {
    const d = designs.find(x => x.id === parseInt(designId) && !x.deleted);
    return (d && d.imgSrc) ? d.imgSrc : '';
}

function getDesignHSN(designId) {
    const d = designs.find(x => x.id === parseInt(designId) && !x.deleted);
    return (d && d.hsn && d.hsn !== '–') ? d.hsn : '';
}

// ── HELPER: get stock for a design ───────────────
// Stock IN = Pack Design quantity, Stock OUT = Delivery Challan quantity
function getDesignStock(designIdOrName, size = null, color = null) {
    const packs = JSON.parse(localStorage.getItem('vastra_packs') || '[]');
    const challans = JSON.parse(localStorage.getItem('vastra_challans') || '[]');
    const returns = JSON.parse(localStorage.getItem('vastra_salesReturns') || '[]');

    // If we only have name, try to find the ID from global designs array
    let designId = null;
    let designName = null;
    // We only use non-deleted designs for new stock lookups
    const d = designs.find(x => (x.id == designIdOrName || x.name === designIdOrName) && !x.deleted);
    if (d) {
        designId = d.id;
        designName = d.name;
    } else {
        // Fallback for cases where design is not in master list anymore
        if (typeof designIdOrName === 'number') designId = designIdOrName;
        else designName = designIdOrName;
    }

    // Stock IN: sum all pack quantities and returns for this design+size+color
    let stockIn = 0;
    packs.forEach(p => {
        if (!p.deleted && p.items) {
            p.items.forEach(item => {
                const match = (designId && item.designId == designId) || (designName && item.name === designName);
                const sizeMatch = !size || item.size === size;
                const colorMatch = !color || item.color === color;
                if (match && sizeMatch && colorMatch) {
                    stockIn += parseInt(item.qty || 0);
                }
            });
        }
    });

    // Add Sales Returns back to stock
    returns.forEach(sr => {
        if (!sr.deleted && sr.items) {
            sr.items.forEach(item => {
                const match = (designId && item.designId == designId) || (designName && item.designName === designName);
                const sizeMatch = !size || item.size === size;
                const colorMatch = !color || item.color === color;
                if (match && sizeMatch && colorMatch) {
                    stockIn += parseInt(item.qty || 0);
                }
            });
        }
    });

    // Stock OUT: sum all challan quantities for this design+size+color
    let stockOut = 0;
    challans.forEach(c => {
        if (!c.deleted && c.items) {
            c.items.forEach(item => {
                const match = (designId && item.designId == designId) || (designName && item.designName === designName);
                const sizeMatch = !size || item.size === size;
                const colorMatch = !color || item.color === color;
                if (match && sizeMatch && colorMatch) {
                    stockOut += parseInt(item.qty || 0);
                }
            });
        }
    });

    return { stockIn, stockOut, available: stockIn - stockOut };
}

function getDesignSizeWiseStock(designIdOrName) {
    const packs = JSON.parse(localStorage.getItem('vastra_packs') || '[]');
    const challans = JSON.parse(localStorage.getItem('vastra_challans') || '[]');
    const returns = JSON.parse(localStorage.getItem('vastra_salesReturns') || '[]');

    let designId = null;
    let designName = null;
    const d = designs.find(x => x.id == designIdOrName || x.name === designIdOrName);
    if (d) {
        designId = d.id;
        designName = d.name;
    } else {
        if (typeof designIdOrName === 'number') designId = designIdOrName;
        else designName = designIdOrName;
    }

    const sizeStock = {};

    packs.forEach(p => {
        (p.items || []).forEach(item => {
            const match = (designId && item.designId == designId) || (designName && item.name === designName);
            if (match) {
                const s = item.size || 'No-Size';
                sizeStock[s] = (sizeStock[s] || 0) + (parseInt(item.qty) || 0);
            }
        });
    });

    returns.forEach(sr => {
        (sr.items || []).forEach(item => {
            const match = (designId && item.designId == designId) || (designName && item.designName === designName);
            if (match) {
                const s = item.size || 'No-Size';
                sizeStock[s] = (sizeStock[s] || 0) + (parseInt(item.qty) || 0);
            }
        });
    });

    challans.forEach(c => {
        if (!c.deleted && c.items) {
            (c.items || []).forEach(item => {
                const match = (designId && item.designId == designId) || (designName && item.designName === designName);
                if (match) {
                    const s = item.size || 'No-Size';
                    sizeStock[s] = (sizeStock[s] || 0) - (parseInt(item.qty) || 0);
                }
            });
        }
    });

    return sizeStock;
}

// ── TOAST ─────────────────────────────────────────
function showToast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style, {
        position: 'fixed', bottom: '24px', left: '50%',
        transform: 'translateX(-50%) translateY(0)',
        background: '#1565C0', color: '#fff',
        padding: '12px 24px', borderRadius: '12px',
        fontSize: '14px', fontWeight: '600',
        boxShadow: '0 8px 24px rgba(21,101,192,.4)',
        zIndex: '9999', transition: 'all .4s ease',
        opacity: '1',
    });
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, 2500);
}

function showErrorToast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style, {
        position: 'fixed', bottom: '24px', left: '50%',
        transform: 'translateX(-50%) translateY(0)',
        background: '#e53935', color: '#fff',
        padding: '12px 24px', borderRadius: '12px',
        fontSize: '14px', fontWeight: '600',
        boxShadow: '0 8px 24px rgba(229,57,53,.4)',
        zIndex: '9999', transition: 'all .4s ease',
        opacity: '1',
    });
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, 3500);
}

// ── INIT ──────────────────────────────────────────
(async function initApp() {
    // Load designs from IndexedDB first
    try {
        designs = await VastraDB.getAll();
        // Fallback for first time or if DB is empty but localStorage has data
        if (designs.length === 0) {
            const local = JSON.parse(localStorage.getItem('vastra_designs') || '[]');
            if (local.length > 0) {
                designs = local;
                await VastraDB.saveAll(designs);
            }
        }
    } catch (e) {
        console.warn("DB Load error, using localStorage fallback", e);
        designs = JSON.parse(localStorage.getItem('vastra_designs') || '[]');
    }

    // Refresh display
    const authSuccess = localStorage.getItem('vastra_auth_success');

    if (authSuccess === 'true') {
        // Even if session was active, force re-selection on refresh for security
        // (User asked why last login comes back on refresh)
        document.getElementById('authWrapper').style.display = 'flex';
        showPage('userSelectPage');
    } else {
        renderDesignsTable();
        updateStats();
    }
})();


/* ================================================
   DELIVERY CHALLAN
================================================ */

// One-time cleanup: strip imgSrc from old challans & packs to free space
(function cleanupStorage() {
    if (localStorage.getItem('vastra_storage_cleaned')) return;
    try {
        ['vastra_challans', 'vastra_packs'].forEach(key => {
            const data = JSON.parse(localStorage.getItem(key) || '[]');
            let changed = false;
            data.forEach(entry => {
                if (entry.items) {
                    entry.items.forEach(item => {
                        if (item.imgSrc && item.imgSrc.length > 200) {
                            delete item.imgSrc;
                            changed = true;
                        }
                    });
                }
            });
            if (changed) localStorage.setItem(key, JSON.stringify(data));
        });
        localStorage.setItem('vastra_storage_cleaned', '1');
        console.log('Storage cleanup done');
    } catch (e) { console.warn('Cleanup error:', e); }
})();

let challans = JSON.parse(localStorage.getItem('vastra_challans') || '[]');
let challanTab = 'design';
let selectedCustomerId = null;

function openCreateChallan() {
    // Reset form
    selectedCustomerId = null;
    document.getElementById('challanCustomerDisplay').textContent = 'Customer Name*';
    document.getElementById('challanCustomerDisplay').className = 'challan-placeholder';
    document.getElementById('challanCategoryDisplay').textContent = 'Select Category';
    document.getElementById('challanAgentDisplay').textContent = 'Select Agent';
    ['challanDiscount', 'challanShipping', 'challanNumber', 'challanTransport', 'challanNote', 'challanSize', 'challanColor'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('challanBale').checked = false;
    document.getElementById('challanPhotoPreview').innerHTML = '';
    document.getElementById('challanItemsArea').innerHTML =
        '<div class="challan-items-empty"><div class="challan-empty-icon sm"><i class="fa fa-tshirt"></i></div></div>';
    // Set date to now
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    document.getElementById('challanDate').value =
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    // Reset tabs
    switchChallanTab('design');

    document.getElementById('challanModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeChallan() {
    document.getElementById('challanModal').style.display = 'none';
    document.body.style.overflow = '';
}

function switchChallanTab(tab) {
    challanTab = tab;
    document.getElementById('tabDesign').classList.toggle('active', tab === 'design');
    document.getElementById('tabMaterial').classList.toggle('active', tab === 'material');
}

function challanDropdown(type) {
    const val = prompt(`Enter ${type === 'category' ? 'Category' : 'Agent'} name:`);
    if (!val) return;
    const elId = type === 'category' ? 'challanCategoryDisplay' : 'challanAgentDisplay';
    const el = document.getElementById(elId);
    el.textContent = val;
    el.className = 'challan-selected';
}

function challanPhotoPreview(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('challanPhotoPreview').innerHTML =
            `<img src="${e.target.result}" style="width:72px;height:72px;object-fit:cover;border-radius:8px;margin:6px 0;"/>`;
    };
    reader.readAsDataURL(file);
}

// ── DESIGN PICKER (Add Item) ───────────────────
let _pendingDesign = null; // design selected but awaiting qty/rate

let designPickerContext = 'challan';
let activePackCardId = null;

function addChallanItem() {
    designPickerContext = 'challan';
    document.getElementById('designPickerSearch').value = '';
    renderDesignPickerGrid(designs);
    document.getElementById('designPickerModal').style.display = 'flex';
}

function openPDDesignPicker(cardId) {
    designPickerContext = 'pack';
    activePackCardId = cardId;
    document.getElementById('designPickerSearch').value = '';
    renderDesignPickerGrid(designs);
    document.getElementById('designPickerModal').style.display = 'flex';
}

function handleDesignSelect(id) {
    if (designPickerContext === 'pack') {
        const design = designs.find(d => d.id === id);
        if (design) updatePackCardDesign(activePackCardId, design);
        closeDesignPicker();
    } else {
        openQtyDialog(id);
    }
}

function renderDesignPickerGrid(list) {
    const grid = document.getElementById('designPickerGrid');
    const empty = document.getElementById('designPickerEmpty');
    if (!list.length) {
        grid.innerHTML = ''; empty.style.display = 'block'; return;
    }
    empty.style.display = 'none';
    // Sort list numerically (e.g., 199, 200, 201)
    const sortedList = [...list].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true, sensitivity: 'base' }));
    grid.innerHTML = sortedList.map(d => `
        <div onclick="handleDesignSelect(${d.id})" style="background:#fff;border:1px solid #ddd;border-radius:2px;overflow:hidden;margin-bottom:8px;box-shadow:0 1px 2px rgba(0,0,0,0.05);cursor:pointer;display:flex;flex-direction:column;">
            <div style="width:100%;height:130px;background:#eee;border-bottom:1px solid #ddd;display:flex;align-items:center;justify-content:center">
                ${d.imgSrc ? `<img src="${d.imgSrc}" alt="" style="width:100%;height:100%;object-fit:cover"/>` : '<i class="fa fa-tshirt" style="color:#aaa;font-size:24px"></i>'}
            </div>
            <div style="padding:10px 12px;position:relative;">
                <div style="font-size:11px;color:#888;margin-bottom:2px">HSN: ${d.hsn || '-'}</div>
                ${(d.size && d.size !== '–') ? `<div style="font-size:11px;color:#888;margin-bottom:2px">Size: ${d.size}</div>` : ''}
                <div style="font-size:12px;color:#888;margin-bottom:4px">Rate: <strong style="color:#333">${d.price || '0'}</strong></div>
                <div style="font-size:14px;color:#111;font-weight:600;">${d.name || 'Unnamed'}</div>
                <i class="fa fa-eye" style="position:absolute;bottom:12px;right:14px;color:#555;font-size:16px;"></i>
            </div>
        </div>`).join('');
}

function filterDesignPicker(q) {
    const filtered = q ? designs.filter(d => !d.deleted && (d.name || '').toLowerCase().includes(q.toLowerCase())) : designs.filter(d => !d.deleted);
    renderDesignPickerGrid(filtered);
}

function closeDesignPicker() {
    document.getElementById('designPickerModal').style.display = 'none';
}

function getLastDesignRate(designId, customerId = null) {
    try {
        // 1. Check in Invoices (stored in vastra_invoices)
        const invoices = JSON.parse(localStorage.getItem('vastra_invoices') || '[]');
        // Latest first
        const sortedInvoices = invoices.slice().sort((a, b) => (b.updatedAt || b.id) - (a.updatedAt || a.id));
        
        for (const inv of sortedInvoices) {
            if (customerId && inv.customerId != customerId) continue;
            const item = inv.items?.find(i => i.designId == designId);
            if (item && item.rate) return item.rate;
        }

        // 2. Check in Challans (stored in vastra_challans)
        const challansList = JSON.parse(localStorage.getItem('vastra_challans') || '[]');
        const sortedChallans = challansList.slice().sort((a, b) => (b.updatedAt || b.id) - (a.updatedAt || a.id));
        
        for (const c of sortedChallans) {
            if (customerId && c.customerId != customerId) continue;
            const item = c.items?.find(i => i.designId == designId);
            if (item && item.rate) return item.rate;
        }
    } catch (e) {
        console.warn("Error fetching last rate:", e);
    }
    return null;
}

function openQtyDialog(designId) {
    _pendingDesign = designs.find(d => d.id === designId);
    if (!_pendingDesign) return;

    // Fill dialog header
    document.getElementById('qtyDialogDesignInfo').innerHTML = `
        <div class="qty-dialog-thumb">
            ${_pendingDesign.imgSrc ? `<img src="${_pendingDesign.imgSrc}" alt=""/>` : '<i class="fa fa-tshirt"></i>'}
        </div>
        <div>
            <div class="qty-dialog-dname">${_pendingDesign.name || 'Design'}</div>
            <div style="font-size:12px;color:#888;margin-bottom:4px">HSN: ${_pendingDesign.hsn || '-'}</div>
            ${_pendingDesign.price && _pendingDesign.price !== '–' ? `<div class="qty-dialog-dprice">₹${_pendingDesign.price} / unit</div>` : ''}
        </div>`;
    document.getElementById('qtyInput').value = 1;
    
    // Use last rate for this customer if available, otherwise fallback to design price
    const lastRate = getLastDesignRate(designId, selectedCustomerId);
    document.getElementById('rateInput').value = lastRate || _pendingDesign.price || '';
    
    document.getElementById('sizeInput').value = '';
    document.getElementById('colorInput').value = '';
    closeDesignPicker();
    document.getElementById('qtyRateDialog').style.display = 'flex';
}

function closeQtyDialog() {
    document.getElementById('qtyRateDialog').style.display = 'none';
    _pendingDesign = null;
}

function confirmAddItem() {
    if (!_pendingDesign) return;
    const qty = parseFloat(document.getElementById('qtyInput').value) || 1;
    const rate = parseFloat(document.getElementById('rateInput').value) || 0;
    const size = document.getElementById('sizeInput').value || '';
    const color = document.getElementById('colorInput').value || '';
    const total = (qty * rate).toFixed(2);

    const area = _addingToDetail
        ? document.getElementById('cdItemsArea')
        : document.getElementById('challanItemsArea');

    // Duplicate check within current session
    if (!_addingToDetail) {
        const existingRows = area.querySelectorAll('.challan-item-row');
        let alreadyExists = false;
        existingRows.forEach(row => {
            if (row.dataset.designId == _pendingDesign.id && row.dataset.size === size && row.dataset.color === color) {
                alreadyExists = true;
            }
        });
        if (alreadyExists) {
            if (!confirm(`"${_pendingDesign.name}" (Size: ${size || '-'}) is already added to this challan. Add another row anyway?`)) {
                closeQtyDialog();
                return;
            }
        }
    }

    if (!_addingToDetail) area.querySelector('.challan-items-empty')?.remove();

    if (_addingToDetail && currentDetailChallan) {
        currentDetailChallan.items = currentDetailChallan.items || [];
        currentDetailChallan.items.push({
            designId: _pendingDesign.id, designName: _pendingDesign.name || '',
            imgSrc: '', qty, rate, size, color, total: parseFloat(total),
            hsn: _pendingDesign.hsn || '',
            gstRate: _pendingDesign.gstRate || '0',
            gstMode: _pendingDesign.gstMode || 'igst'
        });
        renderChallanDetail(currentDetailChallan);
        closeQtyDialog();
        showToast(`${_pendingDesign.name} added ✅`);
        _pendingDesign = null; _addingToDetail = false; return;
    }

    const row = document.createElement('div');
    row.className = 'challan-item-row';
    const uid = Date.now();
    row.id = 'citem_' + uid;
    row.dataset.designId = _pendingDesign.id;
    row.dataset.designName = _pendingDesign.name || '';
    row.dataset.imgSrc = '';
    row.dataset.designId2 = _pendingDesign.id || '';
    row.dataset.qty = qty;
    row.dataset.rate = rate;
    row.dataset.size = size;
    row.dataset.color = color;
    row.dataset.total = total;
    row.dataset.hsn = _pendingDesign.hsn || '';
    row.dataset.gstRate = _pendingDesign.gstRate || '0';
    row.dataset.gstMode = _pendingDesign.gstMode || 'igst';
    row.innerHTML = `
        <div class="challan-item-thumb">
            ${_pendingDesign.imgSrc ? `<img src="${_pendingDesign.imgSrc}" alt=""/>` : '<i class="fa fa-tshirt"></i>'}
        </div>
        <div class="challan-item-info">
            <strong>${_pendingDesign.name || 'Design'}</strong>
            <div style="font-size:10px;color:#888">HSN: ${_pendingDesign.hsn || '-'}</div>
            <div style="font-size:11px;color:#666">${size ? 'Size: ' + size : ''} ${color ? 'Color: ' + color : ''}</div>
            <span>₹${rate} × ${qty} = <b style="color:var(--blue)">₹${total}</b></span>
        </div>
        <div class="challan-item-qty"><strong>${qty}</strong><span>Qty</span></div>
        <button class="challan-item-del" onclick="document.getElementById('citem_${uid}').remove()" title="Remove"><i class="fa fa-times"></i></button>
    `;
    area.appendChild(row);
    closeQtyDialog();
    showToast(`${_pendingDesign.name} added ✅`);
    _pendingDesign = null;
}


let _addingToDetail = false;

function saveChallan() {
    try {
        console.log('saveChallan called');
        const custEl = document.getElementById('challanCustomerDisplay');
        console.log('selectedCustomerId:', selectedCustomerId, 'custText:', custEl.textContent.trim());

        if (!selectedCustomerId || custEl.textContent.trim() === 'Customer Name*') {
            showToast('❌ Please select a Customer!');
            return;
        }

        // collect items from the DOM rows
        const items = [];
        const rows = document.querySelectorAll('#challanItemsArea .challan-item-row');
        console.log('Found challan item rows:', rows.length);
        rows.forEach(row => {
            items.push({
                designId: row.dataset.designId || '',
                designName: row.dataset.designName || '',
                qty: parseFloat(row.dataset.qty) || 0,
                rate: parseFloat(row.dataset.rate) || 0,
                total: parseFloat(row.dataset.total) || 0,
                size: row.dataset.size || '',
                color: row.dataset.color || '',
                hsn: row.dataset.hsn || '',
                gstRate: row.dataset.gstRate || '0',
                gstMode: row.dataset.gstMode || 'igst',
            });
        });

        const challan = {
            id: Date.now(),
            updatedAt: Date.now(),
            customerId: selectedCustomerId,
            customerName: custEl.textContent.trim(),
            number: document.getElementById('challanNumber').value || auto_challan_no(),
            transport: document.getElementById('challanTransport').value,
            size: document.getElementById('challanSize').value || '',
            color: document.getElementById('challanColor').value || '',
            date: document.getElementById('challanDate').value,
            note: document.getElementById('challanNote')?.value || '',
            createdAt: formatDateDDMMYYYY(new Date()),
            createdTime: formatDateTime(new Date()),
            items,
            createdBy: localStorage.getItem('vastra_currentUser') || 'Admin',
            updatedBy: localStorage.getItem('vastra_currentUser') || 'Admin',
        };
        challans.push(challan);
        localStorage.setItem('vastra_challans', JSON.stringify(challans));
        console.log('Challan saved to localStorage:', challan.number);
        closeChallan();
        renderChallanList();
        showToast('Delivery Challan saved! 📝');
    } catch (err) {
        console.error('saveChallan ERROR:', err);
        alert('Error saving challan: ' + err.message);
    }
}


function auto_challan_no() {
    return 'DC-' + String(challans.length + 1).padStart(4, '0');
}

function renderChallanList() {
    const list = document.getElementById('challanList');
    const empty = document.getElementById('challanEmpty');
    const searchInput = document.getElementById('challansSearchInput');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    if (challans.length === 0 && !query) {
        list.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    let filteredChallans = challans.filter(c => !c.deleted);
    if (query) {
        filteredChallans = filteredChallans.filter(c =>
            (c.number && c.number.toLowerCase().includes(query)) ||
            (c.customerName && c.customerName.toLowerCase().includes(query)) ||
            (c.items && c.items.some(i => i.designName && i.designName.toLowerCase().includes(query)))
        );
    }

    if (filteredChallans.length === 0) {
        list.innerHTML = '<div style="padding:20px;text-align:center;color:#888;">No delivery challans found matching your search.</div>';
        return;
    }

    list.innerHTML = filteredChallans.slice().reverse().map(c => {
        const firstItem = (c.items && c.items.length > 0) ? c.items[0] : null;
        const img = firstItem ? getDesignImg(firstItem.designId) : '';

        let designName = '-';
        if (c.items && c.items.length > 0) {
            const uniqueDesigns = [...new Set(c.items.map(i => i.designName || 'Unnamed'))];
            designName = uniqueDesigns.join(', ');
        }

        // Calculate size-wise breakdown
        const sizeStr = (c.items || []).reduce((acc, itm) => {
            if (itm.size) {
                acc[itm.size] = (acc[itm.size] || 0) + (parseFloat(itm.qty) || 0);
            }
            return acc;
        }, {});
        const sizeDisplay = Object.entries(sizeStr).map(([s, q]) => `${s}:${q}`).join(', ');

        return `
        <div class="challan-card" onclick="openChallanDetail(${c.id})" style="display:flex;align-items:center;padding:12px;cursor:pointer;background:#fff;border-radius:2px;box-shadow:0 1px 3px rgba(0,0,0,0.1);margin-bottom:10px;">
            <div style="width:52px;height:52px;background:#f5f5f5;border-radius:6px;display:flex;align-items:center;justify-content:center;margin-right:12px;overflow:hidden;flex-shrink:0;border:1px solid #eee;">
                ${img ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover"/>` : `<i class="fa fa-file-invoice" style="color:#ccc"></i>`}
            </div>
            <div style="flex:1;">
                <div style="font-weight:700;font-size:15px;color:#111">${c.number} - <span style="color:var(--blue)">${designName}</span></div>
                <div style="font-size:12px;color:#8A95A3;margin-top:3px">
                    ${c.customerName || '-'} • ${formatDateDDMMYYYY(c.createdAt)}
                    <span style="background:#e1f0f8; color:#0077c2; border-radius:4px; padding:1px 6px; font-size:10px; font-weight:bold; margin-left:8px; border:1px solid #b3d7ef;">
                        <i class="fa fa-user" style="font-size:9px;"></i> ${(c.createdBy || 'Admin').toUpperCase()}
                    </span>
                </div>
                <div style="font-size:12px;color:var(--blue);margin-top:2px">
                    ${(c.items || []).length} item(s) • Qty: ${sumQty(c)} 
                    ${sizeDisplay ? `<span style="color:#666;font-size:11px;margin-left:5px">(${sizeDisplay})</span>` : ''}
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
                <button onclick="event.stopPropagation();deleteChallan(${c.id})" style="background:#FFEBEE;border:none;color:#c62828;border-radius:8px;padding:8px 12px;cursor:pointer;font-size:12px;font-weight:600;"><i class="fa fa-trash"></i></button>
                <i class="fa fa-chevron-right" style="color:#ccc;font-size:14px;margin-left:4px"></i>
            </div>
        </div>`;
    }).join('');
}

function sumQty(challan) {
    return (challan.items || []).reduce((s, i) => s + (i.qty || 0), 0);
}

function deleteChallan(id) {
    if (!confirm('Delete this challan?')) return;
    
    const c = challans.find(x => x.id === id);
    if (c) {
        c.deleted = true;
        c.updatedAt = Date.now();
    } else {
        challans = challans.filter(c => c.id !== id);
    }
    
    localStorage.setItem('vastra_challans', JSON.stringify(challans));
    refreshStockViews();
}

function refreshStockViews() {
    renderChallanList();
    if (typeof renderPackList === 'function') renderPackList();
    if (typeof renderSRList === 'function') renderSRList();
    if (typeof renderLiveStock === 'function') renderLiveStock();
    updateStats();
    
    // Only refresh detail view if it's currently being viewed to avoid unwanted navigation
    const detailSection = document.getElementById('liveStockDetailSection');
    if (currentLSDesign && detailSection && detailSection.style.display !== 'none') {
        openLiveStockDetail(currentLSDesign);
    }
}

// Init challan list on load
renderChallanList();


/* ================================================
   CUSTOMERS
================================================ */
let customers = JSON.parse(localStorage.getItem('vastra_customers') || '[]');

function openCustomerSelect() {
    renderCustomerSelectList();
    document.getElementById('customerSelectModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeCustomerSelect() {
    document.getElementById('customerSelectModal').style.display = 'none';
    document.body.style.overflow = 'hidden'; // keep challan modal scroll locked
}

function renderCustomerSelectList() {
    const list = document.getElementById('customerSelectList');
    const empty = document.getElementById('custSelectEmpty');
    if (customers.length === 0) {
        list.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';
    list.innerHTML = customers.map(c => {
        const initials = c.name.charAt(0).toUpperCase();
        const avatarHTML = c.avatar
            ? `<img src="${c.avatar}" alt=""/>`
            : initials;
        return `
        <div class="customer-item" onclick="selectCustomer(${c.id})">
            <div style="display:flex; align-items:center; flex:1;">
                <div class="customer-avatar-sm">${avatarHTML}</div>
                <div class="customer-item-info">
                    <strong>${c.name}</strong>
                    <span>${c.mobile || ''}</span>
                </div>
            </div>
            <button onclick="event.stopPropagation(); deleteCustomer(${c.id})" style="border:none; background:transparent; color:#f44336; padding:10px; cursor:pointer; font-size:16px;">
                <i class="fa fa-trash"></i>
            </button>
        </div>`;
    }).join('');
}

function deleteCustomer(id) {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    customers = customers.filter(c => c.id !== id);
    localStorage.setItem('vastra_customers', JSON.stringify(customers));
    renderCustomerSelectList();
    if (typeof updateStats === 'function') updateStats();
}

function selectCustomer(id) {
    const c = customers.find(x => x.id === id);
    if (!c) return;
    selectedCustomerId = id;
    const el = document.getElementById('challanCustomerDisplay');
    el.textContent = c.name;
    el.className = 'challan-selected';
    closeCustomerSelect();
}

function openAddCustomer() {
    // Reset form
    ['custGST', 'custOrgName', 'custContact', 'custMobile', 'custAddress', 'custPincode', 'custStateCode'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('custStateDisplay').textContent = 'Select State';
    document.getElementById('custStateDisplay').className = 'challan-placeholder';
    document.getElementById('custCityDisplay').textContent = 'Select City';
    document.getElementById('custCityDisplay').className = 'challan-placeholder';
    document.getElementById('custAgentDisplay').textContent = 'Select Agent';
    document.getElementById('custAgentDisplay').className = 'challan-placeholder';
    document.getElementById('custCategoryDisplay').textContent = 'Select Category';
    document.getElementById('custCategoryDisplay').className = 'challan-placeholder';

    document.getElementById('custAvatarPreview').innerHTML =
        '<i class="fa fa-user-tie" style="font-size:44px;color:#aaa"></i>';
    document.getElementById('addCustomerModal').style.display = 'flex';
}

function closeAddCustomer() {
    document.getElementById('addCustomerModal').style.display = 'none';
}

function custAvatarChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('custAvatarPreview').innerHTML =
            `<img src="${e.target.result}" alt="avatar"/>`;
    };
    reader.readAsDataURL(file);
}

function saveCustomer() {
    const name = document.getElementById('custOrgName').value.trim();
    const mobile = document.getElementById('custMobile').value.trim();
    if (!name) { alert("Customer's Organization Name is required!"); return; }
    if (!mobile) { alert('Mobile Number is required!'); return; }

    const avatarImg = document.querySelector('#custAvatarPreview img');
    const customer = {
        id: Date.now(),
        name,
        mobile,
        gst: document.getElementById('custGST').value.trim(),
        contact: document.getElementById('custContact').value.trim(),
        address: document.getElementById('custAddress').value.trim(),
        pincode: document.getElementById('custPincode').value.trim(),
        stateCode: document.getElementById('custStateCode').value.trim(),
        state: document.getElementById('custStateDisplay').textContent,
        city: document.getElementById('custCityDisplay').textContent,
        agent: document.getElementById('custAgentDisplay').textContent,
        category: document.getElementById('custCategoryDisplay').textContent,
        avatar: avatarImg ? avatarImg.src : null,
        createdAt: formatDateDDMMYYYY(new Date()),
        updatedAt: Date.now(),
        id: Date.now() // Ensure Customer has ID
    };
    customers.push(customer);
    localStorage.setItem('vastra_customers', JSON.stringify(customers));
    closeAddCustomer();
    renderCustomerSelectList(); // refresh list
    showToast('Customer added! 👍');

    // Auto-select the newly added customer if we are making a challan
    if (document.getElementById('challanModal').style.display === 'flex') {
        selectCustomer(customer.id);
    }
}


/* ================================================
   AGENTS
================================================ */
let agents = JSON.parse(localStorage.getItem('vastra_agents') || '[{"id":1,"name":"Direct","location":"-","agency":"","mobile":"","avatar":null}]');
let pickerContext = 'cust'; // 'cust' | 'challan'

function openAgentSelect(ctx) {
    pickerContext = ctx || 'cust';
    renderAgentList();
    document.getElementById('agentSelectModal').style.display = 'flex';
}
function closeAgentSelect() { document.getElementById('agentSelectModal').style.display = 'none'; }

function renderAgentList(filter) {
    const list = document.getElementById('agentList');
    let filtered = agents;
    if (filter) filtered = agents.filter(a => a.name.toLowerCase().includes(filter.toLowerCase()));
    if (!filtered.length) { list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--gray-4)">No agents found</div>'; return; }
    list.innerHTML = filtered.map(a => `
        <div class="picker-item" onclick="selectAgent(${a.id})">
            <div class="picker-avatar">${a.avatar ? `<img src="${a.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>` : '<i class="fa fa-user-tie"></i>'}</div>
            <div class="picker-item-info">
                <strong>${a.name}</strong>
                <span>Location: ${a.location || '-'}</span>
            </div>
        </div>`).join('');
}

function selectAgent(id) {
    const a = agents.find(x => x.id === id);
    if (!a) return;
    let displayId;
    if (pickerContext === 'challan') displayId = 'challanAgentDisplay';
    else if (pickerContext === 'inv') displayId = 'invAgentDisplay';
    else if (pickerContext === 'sr') displayId = 'srAgentDisplay';
    else displayId = 'custAgentDisplay';
    const el = document.getElementById(displayId);
    if (el) { el.textContent = a.name; el.className = 'challan-selected'; }
    closeAgentSelect();
}

function openAddAgent() {
    ['agentGST', 'agentAgency', 'agentName', 'agentMobile'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    document.getElementById('agentAvatarPreview').innerHTML = '<i class="fa fa-user-tie" style="font-size:44px;color:#aaa"></i>';
    document.getElementById('agentStateDisplay').textContent = 'Select State';
    document.getElementById('agentStateDisplay').className = 'challan-placeholder';
    document.getElementById('agentCityDisplay').textContent = 'Select City';
    document.getElementById('agentCityDisplay').className = 'challan-placeholder';
    document.getElementById('addAgentModal').style.display = 'flex';
}
function closeAddAgent() { document.getElementById('addAgentModal').style.display = 'none'; }

function agentAvatarChange(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = e => { document.getElementById('agentAvatarPreview').innerHTML = `<img src="${e.target.result}" alt=""/>`; };
    reader.readAsDataURL(file);
}

function saveAgent() {
    const name = document.getElementById('agentName').value.trim();
    const mobile = document.getElementById('agentMobile').value.trim();
    if (!name) { alert("Agent's Name is required!"); return; }
    if (!mobile) { alert('Mobile Number is required!'); return; }
    const avatarImg = document.querySelector('#agentAvatarPreview img');
    const agent = {
        id: Date.now(), name, mobile,
        agency: document.getElementById('agentAgency').value.trim(),
        gst: document.getElementById('agentGST').value.trim(),
        location: document.getElementById('agentStateDisplay').textContent !== 'Select State'
            ? document.getElementById('agentStateDisplay').textContent : '-',
        avatar: avatarImg ? avatarImg.src : null,
        updatedAt: Date.now()
    };
    agents.push(agent);
    localStorage.setItem('vastra_agents', JSON.stringify(agents));
    closeAddAgent();
    renderAgentList();
    showToast('Agent added! 👍');
}

function togglePickerSearch(id) {
    const el = document.getElementById(id);
    el.style.display = el.style.display === 'none' ? 'flex' : 'none';
}
function filterPickerList(listId, val, type) {
    if (type === 'agent') renderAgentList(val);
    if (type === 'category') renderCategoryTypeList(val);
}


/* ================================================
   CUSTOMER CATEGORY TYPE
================================================ */
let categoryTypes = JSON.parse(localStorage.getItem('vastra_categoryTypes') || '[]');
let catValueType = 'percent'; // 'percent' | 'rupees'

let categoryPickerContext = 'cust'; // 'cust' | 'challan'

function openCustCategorySelect(ctx) {
    categoryPickerContext = ctx || 'cust';
    renderCategoryTypeList();
    document.getElementById('custCategoryModal').style.display = 'flex';
}
function closeCustCategorySelect() { document.getElementById('custCategoryModal').style.display = 'none'; }

function renderCategoryTypeList(filter) {
    const list = document.getElementById('categoryTypeList');
    const empty = document.getElementById('categoryTypeEmpty');
    const fab = document.getElementById('categoryTypeAddFab');
    let filtered = categoryTypes;
    if (filter) filtered = categoryTypes.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));
    if (!filtered.length) {
        list.innerHTML = ''; empty.style.display = 'block'; fab.style.display = 'none'; return;
    }
    empty.style.display = 'none'; fab.style.display = 'block';
    list.innerHTML = filtered.map(c => `
        <div class="picker-item" onclick="selectCategoryType('${c.name}')">
            <div class="picker-avatar"><i class="fa fa-layer-group"></i></div>
            <div class="picker-item-info">
                <strong>${c.name}</strong>
                <span>${c.valueType === 'percent' ? c.value + '%' : '₹' + c.value} ${c.mrp}</span>
            </div>
        </div>`).join('');
}

function selectCategoryType(name) {
    const displayId = categoryPickerContext === 'challan' ? 'challanCategoryDisplay' : 'custCategoryDisplay';
    document.getElementById(displayId).textContent = name;
    document.getElementById(displayId).className = 'challan-selected';
    closeCustCategorySelect();
}

function openAddCategoryDialog() {
    document.getElementById('categoryTypeName').value = '';
    document.getElementById('categoryTypeValue').value = '';
    document.getElementById('addCategoryDialog').style.display = 'flex';
}
function closeAddCategoryDialog() { document.getElementById('addCategoryDialog').style.display = 'none'; }

function catTypeChange(radio) {
    catValueType = radio.value;
    document.getElementById('categoryTypeValue').placeholder = catValueType === 'percent' ? 'Percentage %' : 'Rupees ₹';
}

function saveCategoryType() {
    const name = document.getElementById('categoryTypeName').value.trim();
    if (!name) { alert('Category Type Name is required!'); return; }
    const cat = {
        id: Date.now(), name,
        valueType: catValueType,
        value: document.getElementById('categoryTypeValue').value || '0',
        mrp: document.getElementById('categoryTypeMRP').value,
        updatedAt: Date.now()
    };
    categoryTypes.push(cat);
    localStorage.setItem('vastra_categoryTypes', JSON.stringify(categoryTypes));
    closeAddCategoryDialog();
    renderCategoryTypeList();
    showToast('Category type added! ✅');
}


/* ================================================
   STATE & CITY PICKER
================================================ */
const INDIA_STATES = {
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Kakinada', 'Rajahmundry'],
    'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro'],
    'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Purnia', 'Arrah', 'Bihar Sharif'],
    'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Jagdalpur'],
    'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Navsari', 'Morbi', 'Mehsana'],
    'Haryana': ['Faridabad', 'Gurgaon', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat'],
    'Himachal Pradesh': ['Shimla', 'Dharamsala', 'Solan', 'Kullu', 'Mandi', 'Hamirpur', 'Una'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih'],
    'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davanagere', 'Bellary', 'Bijapur', 'Shimoga'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha', 'Malappuram', 'Kannur'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Kolhapur', 'Thane', 'Navi Mumbai', 'Pimpri-Chinchwad', 'Kalyan'],
    'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur'],
    'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongstoin'],
    'Mizoram': ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip'],
    'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur', 'Puri', 'Balasore'],
    'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Firozpur', 'Hoshiarpur'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar'],
    'Sikkim': ['Gangtok', 'Namchi', 'Geyzing', 'Mangan'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Tiruppur', 'Thoothukudi'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam', 'Mahbubnagar'],
    'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailasahar'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Meerut', 'Allahabad', 'Ghaziabad', 'Bareilly', 'Aligarh', 'Moradabad', 'Noida', 'Mathura'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rishikesh', 'Kashipur', 'Rudrapur'],
    'West Bengal': ['Kolkata', 'Howrah', 'Asansol', 'Siliguri', 'Bardhaman', 'Durgapur', 'Malda', 'Kharagpur'],
    // Union Territories
    'Andaman & Nicobar': ['Port Blair', 'Rangat', 'Diglipur'],
    'Chandigarh': ['Chandigarh'],
    'Dadra & Nagar Haveli': ['Silvassa'],
    'Daman & Diu': ['Daman', 'Diu'],
    'Delhi': ['New Delhi', 'Dwarka', 'Rohini', 'Janakpuri', 'Pitampura', 'Lajpat Nagar', 'Karol Bagh', 'Connaught Place'],
    'Jammu & Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Sopore', 'Baramulla'],
    'Ladakh': ['Leh', 'Kargil'],
    'Lakshadweep': ['Kavaratti', 'Amini', 'Andrott'],
    'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
};

const STATE_CODE_MAP = {
    'Andhra Pradesh': '37', 'Arunachal Pradesh': '12', 'Assam': '18', 'Bihar': '10', 'Chhattisgarh': '22',
    'Goa': '30', 'Gujarat': '24', 'Haryana': '06', 'Himachal Pradesh': '02', 'Jharkhand': '20',
    'Karnataka': '29', 'Kerala': '32', 'Madhya Pradesh': '23', 'Maharashtra': '27', 'Manipur': '14',
    'Meghalaya': '17', 'Mizoram': '15', 'Nagaland': '13', 'Odisha': '21', 'Punjab': '03',
    'Rajasthan': '08', 'Sikkim': '11', 'Tamil Nadu': '33', 'Telangana': '36', 'Tripura': '16',
    'Uttar Pradesh': '09', 'Uttarakhand': '05', 'West Bengal': '19', 'Andaman & Nicobar': '35',
    'Chandigarh': '04', 'Dadra & Nagar Haveli': '26', 'Daman & Diu': '25', 'Delhi': '07',
    'Jammu & Kashmir': '01', 'Ladakh': '38', 'Lakshadweep': '31', 'Puducherry': '34'
};

const CITY_PINCODE_MAP = {
    'Surat': '395001', 'Ahmedabad': '380001', 'Vadodara': '390001', 'Rajkot': '360001',
    'Bhavnagar': '364001', 'Jamnagar': '361001', 'Gandhinagar': '382010', 'Junagadh': '362001',
    'Navsari': '396445', 'Anand': '388001', 'Morbi': '363641', 'Mehsana': '384001',
    'Mumbai': '400001', 'Pune': '411001', 'Nagpur': '440001', 'Nashik': '422001',
    'Delhi': '110001', 'New Delhi': '110001', 'Jaipur': '302001', 'Jodhpur': '342001',
    'Kota': '324001', 'Bangalore': '560001', 'Hyderabad': '500001', 'Chennai': '600001',
    'Lucknow': '226001', 'Kanpur': '208001', 'Kolkata': '700001'
};

let statePickerFor = 'cust'; // 'cust' | 'agent'
let cityPickerFor = 'cust';
let currentStateCities = [];

function openStateSelect(context) {
    statePickerFor = context || 'cust';
    document.getElementById('stateSearchInput').value = '';
    renderStateList(Object.keys(INDIA_STATES));
    document.getElementById('statePickerModal').style.display = 'flex';
}
function closeStateSelect() { document.getElementById('statePickerModal').style.display = 'none'; }

function renderStateList(states) {
    document.getElementById('stateList').innerHTML = states.map(s => `
        <div class="picker-item" onclick="selectState('${s.replace(/'/g, "\\'")}')">
            <div class="picker-avatar"><i class="fa fa-map-marker-alt"></i></div>
            <div class="picker-item-info"><strong>${s}</strong></div>
        </div>`).join('');
}

function filterStates(q) {
    const all = Object.keys(INDIA_STATES);
    renderStateList(q ? all.filter(s => s.toLowerCase().includes(q.toLowerCase())) : all);
}

function selectState(state) {
    const ctx = statePickerFor;
    let stateId, cityId;
    if (ctx === 'agent') { stateId = 'agentStateDisplay'; cityId = 'agentCityDisplay'; }
    else if (ctx === 'inv') { stateId = 'invStateDisplay'; cityId = 'invCityDisplay'; }
    else {
        stateId = 'custStateDisplay';
        cityId = 'custCityDisplay';
        // Auto-fill State Code for Customer
        const codeInput = document.getElementById('custStateCode');
        if (codeInput && STATE_CODE_MAP[state]) {
            codeInput.value = STATE_CODE_MAP[state];
        }
    }
    const stateEl = document.getElementById(stateId);
    const cityEl = document.getElementById(cityId);
    if (stateEl) { stateEl.textContent = state; stateEl.className = 'challan-selected'; }
    if (cityEl) { cityEl.textContent = 'Select City'; cityEl.className = ctx === 'inv' ? 'inv-placeholder' : 'challan-placeholder'; }
    currentStateCities = INDIA_STATES[state] || [];
    cityPickerFor = ctx;
    closeStateSelect();
    showToast(`${state} selected ✓`);
}

function openCitySelect(context) {
    cityPickerFor = context || 'cust';
    let stateId;
    if (cityPickerFor === 'agent') stateId = 'agentStateDisplay';
    else if (cityPickerFor === 'inv') stateId = 'invStateDisplay';
    else stateId = 'custStateDisplay';
    const stateEl = document.getElementById(stateId);
    const stateName = stateEl?.textContent;
    const placeholders = ['Select State', 'State of Supply*'];
    if (!stateName || placeholders.includes(stateName)) {
        alert('Please select a State first!'); return;
    }
    currentStateCities = INDIA_STATES[stateName] || [];
    document.getElementById('citySearchInput').value = '';
    renderCityList(currentStateCities);
    document.getElementById('cityPickerModal').style.display = 'flex';
}
function closeCitySelect() { document.getElementById('cityPickerModal').style.display = 'none'; }

function renderCityList(cities) {
    document.getElementById('cityList').innerHTML = cities.map(c => `
        <div class="picker-item" onclick="selectCity('${c.replace(/'/g, "\\'")}')">
            <div class="picker-avatar"><i class="fa fa-city"></i></div>
            <div class="picker-item-info"><strong>${c}</strong></div>
        </div>`).join('');
}

function filterCities(q) {
    renderCityList(q ? currentStateCities.filter(c => c.toLowerCase().includes(q.toLowerCase())) : currentStateCities);
}

function selectCity(city) {
    let cityEl;
    if (cityPickerFor === 'agent') cityEl = document.getElementById('agentCityDisplay');
    else if (cityPickerFor === 'inv') cityEl = document.getElementById('invCityDisplay');
    else {
        cityEl = document.getElementById('custCityDisplay');
        // Auto-fill Pincode for Customer
        const pinInput = document.getElementById('custPincode');
        if (pinInput && CITY_PINCODE_MAP[city]) {
            pinInput.value = CITY_PINCODE_MAP[city];
        }
    }
    if (cityEl) { cityEl.textContent = city; cityEl.className = 'challan-selected'; }
    closeCitySelect();
}


/* ================================================
   CHALLAN DETAIL VIEW
================================================ */
let currentDetailChallan = null;

function openChallanDetail(id) {
    currentDetailChallan = challans.find(c => c.id === id);
    if (!currentDetailChallan) return;
    document.getElementById('challanDetailTitle').textContent = currentDetailChallan.number;
    renderChallanDetail(currentDetailChallan);
    document.getElementById('challanDetailModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeChallanDetail() {
    document.getElementById('challanDetailModal').style.display = 'none';
    document.body.style.overflow = '';
    currentDetailChallan = null;
}

function renderChallanDetail(c) {
    const items = c.items || [];
    const totalQty = items.reduce((s, i) => s + (i.qty || 0), 0);
    document.getElementById('cdTotalItems').textContent = items.length;
    document.getElementById('cdTotalQty').textContent = totalQty;
    document.getElementById('cdCreatedAt').textContent = c.createdTime || c.createdAt;
    document.getElementById('cdCustomer').textContent = c.customerName;
    const createdByEl = document.getElementById('cdCreatedBy');
    if (createdByEl) createdByEl.textContent = (c.createdBy || 'Admin').toUpperCase();
    document.getElementById('cdTransport').textContent = c.transport || '-';
    document.getElementById('cdDiscount').value = c.discount || '';
    document.getElementById('cdShipping').value = c.shipping || '';
    document.getElementById('cdAgent').value = c.agent || '';
    document.getElementById('cdCategory').value = c.category || '';
    const area = document.getElementById('cdItemsArea');
    if (!items.length) {
        area.innerHTML = '<div class="challan-items-empty"><div class="challan-empty-icon sm"><i class="fa fa-tshirt"></i></div><p style="color:var(--gray-4);margin-top:10px">No items added</p></div>';
        return;
    }
    area.innerHTML = items.map((item, idx) => `
        <div class="cd-item-card">
            <div class="cd-item-header">
                <div style="display:flex;align-items:center;gap:10px">
                    <div class="challan-item-thumb">${(item.imgSrc || getDesignImg(item.designId)) ? `<img src="${item.imgSrc || getDesignImg(item.designId)}" alt=""/>` : '<i class="fa fa-tshirt"></i>'}</div>
                    <div>
                        <strong style="font-size:14px">${item.designName}</strong>
                        <div style="font-size:11px;color:#888">HSN: ${item.hsn || getDesignHSN(item.designId) || '-'}</div>
                    </div>
                </div>
                <button class="cd-icon-btn del" onclick="removeCDItem(${idx})"><i class="fa fa-trash"></i></button>
            </div>
            <table class="cd-item-table">
                <thead><tr><th>SIZE</th><th>COLOR</th><th>QTY</th><th>RATE</th><th></th></tr></thead>
                <tbody><tr>
                    <td><input type="text" value="${item.size || ''}" placeholder="Size" class="cd-table-input" onchange="updateCDItem(${idx},'size',this.value)"/></td>
                    <td><input type="text" value="${item.color || ''}" placeholder="Color" class="cd-table-input" onchange="updateCDItem(${idx},'color',this.value)"/></td>
                    <td><input type="number" value="${item.qty}" class="cd-table-input" onchange="updateCDItem(${idx},'qty',this.value)"/></td>
                    <td><input type="number" value="${item.rate}" class="cd-table-input" onchange="updateCDItem(${idx},'rate',this.value)"/></td>
                    <td><button onclick="removeCDItem(${idx})" style="background:none;border:none;color:#c62828;font-size:18px;cursor:pointer"><i class="fa fa-times-circle"></i></button></td>
                </tr></tbody>
            </table>
            <div style="padding:6px 0;font-size:13px;font-weight:600">Total: ${item.qty}</div>
        </div>`).join('');
}

function removeCDItem(idx) {
    if (!currentDetailChallan) return;
    currentDetailChallan.items.splice(idx, 1);
    renderChallanDetail(currentDetailChallan);
}

function updateCDItem(idx, field, val) {
    if (!currentDetailChallan) return;
    const item = currentDetailChallan.items[idx];
    if (!item) return;
    if (field === 'qty' || field === 'rate') {
        item[field] = parseFloat(val) || 0;
        item.total = item.qty * item.rate;
    } else {
        item[field] = val;
    }
}

function updateChallan() {
    if (!currentDetailChallan) return;
    currentDetailChallan.discount = document.getElementById('cdDiscount').value;
    currentDetailChallan.shipping = document.getElementById('cdShipping').value;
    currentDetailChallan.agent = document.getElementById('cdAgent').value;
    currentDetailChallan.category = document.getElementById('cdCategory').value;
    currentDetailChallan.updatedBy = localStorage.getItem('vastra_currentUser') || 'Admin';
    currentDetailChallan.createdBy = localStorage.getItem('vastra_currentUser') || 'Admin';
    currentDetailChallan.updatedAt = Date.now();
    const idx = challans.findIndex(c => c.id === currentDetailChallan.id);
    if (idx !== -1) { challans[idx] = { ...currentDetailChallan }; }
    localStorage.setItem('vastra_challans', JSON.stringify(challans));
    showToast('Challan updated! ✅');
    renderChallanList();
}

function addItemToDetail() {
    _addingToDetail = true;
    document.getElementById('designPickerSearch').value = '';
    renderDesignPickerGrid(designs);
    document.getElementById('designPickerModal').style.display = 'flex';
}


/* ================================================
   CREATE INVOICE
================================================ */
let invGSTRate = 0, invDiscRate = 0, invGSTMode = 'igst';
let currentInvoiceChallan = null;

function convertToInvoice() {
    if (!currentDetailChallan) return;
    currentInvoiceChallan = currentDetailChallan;
    const c = currentInvoiceChallan;
    document.getElementById('invCustomerName').textContent = c.customerName;
    document.getElementById('invChallanNum').textContent = c.number;
    document.getElementById('invTransportField').value = c.transport || '';
    const now = new Date();
    document.getElementById('invDate').value = now.toISOString().split('T')[0];

    // Auto-detect GST from items
    let firstItem = (c.items && c.items.length > 0) ? c.items[0] : null;
    invGSTRate = firstItem ? (parseFloat(firstItem.gstRate) || 0) : 0;
    invGSTMode = firstItem ? (firstItem.gstMode || 'igst') : 'igst';
    invDiscRate = 0;

    document.getElementById('invDiscInput').value = 0;
    setInvGSTMode(invGSTMode);

    document.getElementById('invGSTTypeDisplay').textContent = 'Registered';
    document.getElementById('invStateDisplay').textContent = 'State of Supply*';
    document.getElementById('invStateDisplay').className = 'inv-placeholder';
    document.getElementById('invCityDisplay').textContent = 'City of Supply*';
    document.getElementById('invCityDisplay').className = 'inv-placeholder';
    const agentDisplay = document.getElementById('invAgentDisplay');
    if (agentDisplay) {
        agentDisplay.textContent = 'Agent Name';
        agentDisplay.className = 'inv-placeholder';
    }
    renderInvItems();
    calcInvTotals();
    const invCreatorEl = document.getElementById('invCreatedByDisplay');
    if (invCreatorEl) invCreatorEl.textContent = (localStorage.getItem('vastra_currentUser') || 'Admin').toUpperCase();
    document.getElementById('createInvoiceModal').style.display = 'flex';
}

function closeCreateInvoice() {
    document.getElementById('createInvoiceModal').style.display = 'none';
}

function setInvGSTMode(mode) {
    invGSTMode = mode;
    document.getElementById('invIGSTToggle').classList.toggle('active', mode === 'igst');
    document.getElementById('invCSToggle').classList.toggle('active', mode === 'cgst_sgst');
    renderInvItems();
    calcInvTotals();
}

function updateInvItemGSTRate(idx, val) {
    if (currentInvoiceChallan && currentInvoiceChallan.items[idx]) {
        currentInvoiceChallan.items[idx].gstRate = parseFloat(val) || 0;
        renderInvItems();
        calcInvTotals();
    }
}

function updateInvItemRate(idx, val) {
    if (currentInvoiceChallan && currentInvoiceChallan.items[idx]) {
        const rate = parseFloat(val) || 0;
        currentInvoiceChallan.items[idx].rate = rate;
        currentInvoiceChallan.items[idx].total = currentInvoiceChallan.items[idx].qty * rate;
        renderInvItems();
        calcInvTotals();
    }
}

function renderInvItems() {
    const items = (currentInvoiceChallan?.items) || [];
    const totalQty = items.reduce((s, i) => s + (i.qty || 0), 0);
    const area = document.getElementById('invItemsArea');
    document.getElementById('invTotalItems').textContent = items.length;
    document.getElementById('invTotalQty').textContent = totalQty.toFixed(1);
    area.innerHTML = items.map((item, idx) => {
        const itemAmt = item.qty * item.rate;
        const discAmt = itemAmt * invDiscRate / 100;
        const afterDsc = itemAmt - discAmt;
        const itemGSTRate = parseFloat(item.gstRate) || 0;
        const taxAmt = afterDsc * itemGSTRate / 100;
        const netAmt = afterDsc + taxAmt;
        const taxLabel = invGSTMode === 'igst' ? 'IGST' : 'GST';

        const taxLine = invGSTMode === 'igst'
            ? `<div class="inv-calc-row"><span>IGST@${itemGSTRate}%</span><span style="color:green">₹${taxAmt.toFixed(2)} (+)</span></div>`
            : `<div class="inv-calc-row"><span>CGST@${(itemGSTRate / 2).toFixed(1)}%</span><span style="color:green">₹${(taxAmt / 2).toFixed(2)} (+)</span></div>
               <div class="inv-calc-row"><span>SGST@${(itemGSTRate / 2).toFixed(1)}%</span><span style="color:green">₹${(taxAmt / 2).toFixed(2)} (+)</span></div>`;

        return `<div class="inv-item-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div class="challan-item-thumb">${(item.imgSrc || getDesignImg(item.designId)) ? `<img src="${item.imgSrc || getDesignImg(item.designId)}" alt=""/>` : '<i class="fa fa-tshirt"></i>'}</div>
                    <div>
                        <strong>${item.designName}</strong>
                        <div style="font-size:11px;color:#888">HSN: ${item.hsn || '-'}</div>
                    </div>
                </div>
                <div style="text-align:right">
                    <div style="font-size:11px;color:#888;margin-bottom:2px">GST Rate%</div>
                    <input type="number" value="${itemGSTRate}" class="inv-field-input" style="width:60px;padding:4px;text-align:center"
                        onchange="updateInvItemGSTRate(${idx}, this.value)" />
                </div>
            </div>
            <div class="inv-item-stats">
                <div class="inv-stat"><div class="inv-stat-label">Quantity:</div><div class="inv-stat-val">${item.qty}</div></div>
                <div class="inv-stat"><div class="inv-stat-label">Price:</div>
                    <div style="display:flex; flex-direction:column; align-items:flex-end;">
                        <input type="number" value="${item.rate}" class="inv-field-input" style="width:70px; text-align:right;" 
                            onchange="updateInvItemRate(${idx}, this.value)" />
                        <div style="font-size:9px; color:var(--blue); margin-top:2px;">Last: ₹${getLastDesignRate(item.designId, currentInvoiceChallan?.customerId) || '-'}</div>
                    </div>
                </div>
                <div class="inv-stat"><div class="inv-stat-label">Total Amount:</div><div class="inv-stat-val">${itemAmt.toFixed(0)}</div></div>
            </div>
            <div class="inv-calc-row"><span>Discount@${invDiscRate}%</span><span style="color:#c62828">₹${discAmt.toFixed(2)} (-)</span></div>
            ${taxLine}
            <div class="inv-calc-row" style="font-weight:700;border-top:1px solid #eee;padding-top:6px"><span>Net Amount:</span><span>₹${netAmt.toFixed(2)}</span></div>
        </div>`;
    }).join('');
}

function calcInvTotals() {
    const items = (currentInvoiceChallan?.items) || [];
    let itemTotal = 0;
    let totalTaxAmt = 0;

    items.forEach(itm => {
        const qty = parseFloat(itm.qty) || 0;
        const rate = parseFloat(itm.rate) || 0;
        const amt = qty * rate;
        const disc = amt * invDiscRate / 100;
        const afterDisc = amt - disc;
        const taxRate = parseFloat(itm.gstRate) || 0;
        const tax = afterDisc * taxRate / 100;
        itemTotal += amt;
        totalTaxAmt += tax;
    });

    const discAmt = itemTotal * invDiscRate / 100;
    const subTotal = itemTotal - discAmt;
    const grand = subTotal + totalTaxAmt;

    document.getElementById('invItemTotal').textContent = `₹${itemTotal.toFixed(2)}`;
    document.getElementById('invDiscAmt').textContent = `₹${discAmt.toFixed(2)}`;
    document.getElementById('invSubTotal').textContent = `₹${subTotal.toFixed(2)}`;
    document.getElementById('invGrandTotal').textContent = `₹${grand.toFixed(2)}`;

    if (invGSTMode === 'igst') {
        document.getElementById('invTaxLabel').textContent = `IGST Total:`;
        document.getElementById('invTaxAmt').textContent = `₹${totalTaxAmt.toFixed(2)}`;
        document.getElementById('invCGSTRow').style.display = 'none';
        document.getElementById('invSGSTRow').style.display = 'none';
        document.getElementById('invIGSTRow').style.display = 'flex';
    } else {
        document.getElementById('invTaxLabel2').textContent = `CGST Total:`;
        document.getElementById('invTaxAmt2').textContent = `₹${(totalTaxAmt / 2).toFixed(2)}`;
        document.getElementById('invTaxLabel3').textContent = `SGST Total:`;
        document.getElementById('invTaxAmt3').textContent = `₹${(totalTaxAmt / 2).toFixed(2)}`;
        document.getElementById('invCGSTRow').style.display = 'flex';
        document.getElementById('invSGSTRow').style.display = 'flex';
        document.getElementById('invIGSTRow').style.display = 'none';
    }
}

function saveInvoice() {
    if (!currentInvoiceChallan) return;
    const items = currentInvoiceChallan.items || [];
    let itemTotal = 0;
    let totalTaxAmt = 0;

    items.forEach(itm => {
        const qty = parseFloat(itm.qty) || 0;
        const rate = parseFloat(itm.rate) || 0;
        const amt = qty * rate;
        const disc = amt * invDiscRate / 100;
        const afterDisc = amt - disc;
        const taxRate = parseFloat(itm.gstRate) || 0;
        const tax = afterDisc * taxRate / 100;
        itemTotal += amt;
        totalTaxAmt += tax;
    });

    const discAmt = itemTotal * invDiscRate / 100;
    const subTotal = itemTotal - discAmt;
    const grand = subTotal + totalTaxAmt;

    const invoices = JSON.parse(localStorage.getItem('vastra_invoices') || '[]');
    const invNum = document.getElementById('invNumber').value ||
        `INV-${String(invoices.length + 1).padStart(4, '0')}`;
    const invoice = {
        id: Date.now(), number: invNum,
        date: document.getElementById('invDate').value,
        customerId: currentInvoiceChallan.customerId,
        customerName: currentInvoiceChallan.customerName,
        challanNum: currentInvoiceChallan.number,
        challanId: currentInvoiceChallan.id,
        state: document.getElementById('invStateDisplay').textContent,
        city: document.getElementById('invCityDisplay').textContent,
        gstType: document.getElementById('invGSTTypeDisplay').textContent,
        transport: document.getElementById('invTransportField').value,
        gstMode: invGSTMode, discRate: invDiscRate,
        items, itemTotal, discAmt, subTotal, taxAmt: totalTaxAmt, grand,
        createdAt: formatDateTime(new Date()),
        createdBy: localStorage.getItem('vastra_currentUser') || 'Admin',
        updatedAt: Date.now()
    };
    invoices.push(invoice);
    localStorage.setItem('vastra_invoices', JSON.stringify(invoices));
    closeCreateInvoice();
    showToast(`Invoice ${invNum} saved! 🧾`);
    setTimeout(() => printInvoice(invoice), 400);
}

function printInvoice(inv) {
    const items = inv.items || [];
    const totalQty = items.reduce((s, i) => s + (parseFloat(i.qty) || 0), 0);
    const itemTotal = items.reduce((s, i) => s + ((parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0)), 0);
    const discAmt = itemTotal * (inv.discRate / 100);
    const subTotal = itemTotal - discAmt;

    // Item-wise Tax grouping for summary table
    const taxGroups = {};
    let totalTaxAmt = 0;

    items.forEach(itm => {
        const qty = parseFloat(itm.qty) || 0;
        const rateVal = parseFloat(itm.rate) || 0;
        const amt = qty * rateVal;
        const taxable = amt - (amt * (inv.discRate || 0) / 100);
        const hsn = itm.hsn || getDesignHSN(itm.designId) || '-';
        const rate = parseFloat(itm.gstRate) || 0;
        const tax = taxable * rate / 100;
        totalTaxAmt += tax;

        const groupKey = hsn + '_' + rate;
        if (!taxGroups[groupKey]) {
            taxGroups[groupKey] = { hsn: hsn, taxableValue: 0, qty: 0, cgst: 0, sgst: 0, igst: 0, rate: rate };
        }
        taxGroups[groupKey].taxableValue += taxable;
        taxGroups[groupKey].qty += qty;
        if (inv.gstMode === 'igst') {
            taxGroups[groupKey].igst += tax;
        } else {
            taxGroups[groupKey].cgst += tax / 2;
            taxGroups[groupKey].sgst += tax / 2;
        }
    });

    const grandTotal = subTotal + totalTaxAmt;
    const igstAmt = inv.gstMode === 'igst' ? totalTaxAmt : 0;
    const cgstAmt = inv.gstMode !== 'igst' ? (totalTaxAmt / 2) : 0;
    const sgstAmt = inv.gstMode !== 'igst' ? (totalTaxAmt / 2) : 0;

    const itemRows = items.map((item, idx) => {
        const amt = ((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)).toFixed(0);
        return `<tr>
            <td style="border:1px solid #ccc;padding:8px;text-align:center">${idx + 1}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:left">${item.designName}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:center">${item.hsn || getDesignHSN(item.designId) || '-'}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:center">${item.color || '-'}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:center">${item.size || '-'}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:center">${item.qty}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:center">${item.rate}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:right">${Number(amt).toLocaleString('en-IN')}</td>
        </tr>`;
    }).join('');

    // Num to words dummy function (for demo, simple implementation can be added later)
    const amountInWords = `Indian Rupees ${Number(grandTotal).toLocaleString('en-IN')} Only`;
    const dateOnly = inv.date ? formatDateDDMMYYYY(inv.date) : formatDateDDMMYYYY(new Date().toISOString().split('T')[0]);


    const taxRows = Object.values(taxGroups).map(g => {
        const hsn = g.hsn;
        const totalTax = g.cgst + g.sgst + g.igst;
        const rateDisplay = g.rate;
        return `<tr>
            <td style="border-left:none">${hsn}</td>
            <td>${Number(g.taxableValue.toFixed(2)).toLocaleString('en-IN')}</td>
            <td>${g.qty}</td>
            ${inv.gstMode !== 'igst' ? `
            <td>${(rateDisplay / 2).toFixed(1)}%</td>
            <td>${Number(g.cgst.toFixed(2)).toLocaleString('en-IN')}</td>
            <td>${(rateDisplay / 2).toFixed(1)}%</td>
            <td>${Number(g.sgst.toFixed(2)).toLocaleString('en-IN')}</td>
            <td>${Number(totalTax.toFixed(2)).toLocaleString('en-IN')}</td>
            <td style="border-right:none;font-size:9px">CGST AMT : ${Number(g.cgst.toFixed(2)).toLocaleString('en-IN')}<br/>SGST AMT : ${Number(g.sgst.toFixed(2)).toLocaleString('en-IN')}</td>
            ` : `
            <td>${rateDisplay}%</td>
            <td>${Number(g.igst.toFixed(2)).toLocaleString('en-IN')}</td>
            <td>${Number(g.igst.toFixed(2)).toLocaleString('en-IN')}</td>
            <td style="border-right:none;font-size:9px">IGST AMT : ${Number(g.igst.toFixed(2)).toLocaleString('en-IN')}</td>
            `}
        </tr>`;
    }).join('');

    const sup = getSupplierProfile();
    const cust = customers.find(c => (inv.customerId && c.id === inv.customerId) || c.name === inv.customerName) || {};

    const w = window.open('', '_blank', 'width=850,height=1000');
    w.document.write(`<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <title>Tax Invoice ${inv.number}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: Arial, sans-serif; color: #000; background: #fff; padding: 20px; font-size: 11px; }
      .page { max-width: 800px; margin: 0 auto; border: 1px solid #ccc; padding: 0; }
      
      .title { text-align: center; font-weight: bold; font-size: 13px; padding: 8px; border-bottom: 1px solid #ccc; }
      
      .header-grid { display: flex; border-bottom: 1px solid #ccc; }
      .seller-info { flex: 1.2; padding: 12px; border-right: 1px solid #ccc; }
      .meta-info { flex: 1; display: flex; flex-direction: column; }
      .meta-row { display: flex; border-bottom: 1px solid #ccc; }
      .meta-cell { flex: 1; padding: 6px 12px; border-right: 1px solid #ccc; }
      .meta-cell:last-child { border-right: none; }
      
      .buyer-info { padding: 12px; border-bottom: 1px solid #ccc; }
      .buyer-grid { display: flex; }
      .buyer-left { flex: 1; border-right: 1px solid #ccc; padding: 12px; }
      .buyer-right { flex: 1; padding: 12px; }
      
      .tbl { width: 100%; border-collapse: collapse; text-align: center; }
      .tbl th { border: 1px solid #ccc; padding: 8px; background-color: #eaf4fb; font-weight: bold; border-top: none; }
      .tbl td { border: 1px solid #ccc; padding: 6px; }
      
      .totals-area { display: flex; text-align: right; }
      .totals-blank { flex: 2; border-right: 1px solid #ccc; border-bottom: 1px solid #ccc;}
      .totals-calc { flex: 1; padding: 4px; border-bottom: 1px solid #ccc;}
      .calc-row { display: flex; justify-content: space-between; padding: 4px 12px; }
      
      .tax-tbl { width: 100%; border-collapse: collapse; text-align: center; margin-top: 20px; border-bottom: 1px solid #ccc;}
      .tax-tbl th { border: 1px solid #ccc; padding: 6px; font-weight: bold; }
      .tax-tbl td { border: 1px solid #ccc; padding: 6px; }
      
      .footer-grid { display: flex; border-bottom: 1px solid #ccc; }
      .terms { flex: 1; padding: 12px; border-right: 1px solid #ccc; font-size: 10px; }
      .sign { flex: 1; padding: 12px; text-align: right; display: flex; flex-direction: column; justify-content: space-between; }
      
      .bottom-credit { display: flex; justify-content: space-between; padding: 12px; margin-top: 10px;}
      
      .print-btn {
        display: block; width: 220px; margin: 24px auto;
        padding: 12px 0; background: #000; color: #fff;
        border: none; border-radius: 4px; font-size: 15px; font-weight: bold;
        cursor: pointer; text-align: center;
      }
      @page { margin: 0; }
      @media print {
        body { padding: 1cm; }
        .page { border: 1px solid #000; }
        .print-btn { display: none !important; }
      }
    </style>
    </head><body>
    
    <div class="page">
        <div class="title">Tax Invoice</div>
        
        <div class="header-grid">
            <div class="seller-info">
                Supplier Name: <strong>${sup.name || 'Honest export'}</strong><br/>
                Address: <strong>${sup.address || '4, 405, MARUTI A VENUE BLDGA, RAJ LAXMI SOC.,NR HANS RESIDANCY, VED ROAD, Surat, Gujarat, 395004'}</strong><br/>
                Gst No: <strong>${sup.gst || '24FMJPM2024L1ZZ'}</strong><br/>
                City: <strong>${sup.city || 'Surat'}</strong>, Pincode: <strong>${sup.pincode || '395004'}</strong><br/>
                State: <strong>${sup.state || 'Gujarat'}</strong>, Code : <strong>${sup.stateCode || '24'}</strong><br/>
                Phone No: <strong>${sup.phone || '9924297264'}</strong>
            </div>
            
            <div class="meta-info">
                <div class="meta-row">
                    <div class="meta-cell">Invoice No<br/><strong>${inv.number}</strong></div>
                    <div class="meta-cell">Date<br/><strong>${dateOnly}</strong></div>
                </div>
                <div class="meta-row">
                    <div class="meta-cell">Delivery Challans:<br/><strong>${inv.challanNum}</strong></div>
                    <div class="meta-cell">Bill Due Days:<br/></div>
                </div>
                <div class="meta-row" style="border-bottom:none;">
                    <div style="padding: 6px 12px;">Agent Name:<br/>Eway Bill No:</div>
                </div>
            </div>
        </div>
        
        <div class="buyer-grid">
            <div class="buyer-left">
                Buyer's Name: <strong>${inv.customerName}</strong><br/>
                Address: ${cust.address || ''}<br/>
                GST No: ${cust.gst || ''}<br/>
                City: <strong>${inv.city || cust.city || '-'}</strong>, Pincode: <strong>${cust.pincode || (CITY_PINCODE_MAP[inv.city || cust.city] || '')}</strong><br/>
                State: <strong>${inv.state || cust.state || '-'}</strong>, Code : <strong>${cust.stateCode || '-'}</strong><br/>
                Phone No: <strong>${cust.mobile || ''}</strong>
            </div>
            <div class="buyer-right">
                State of Supply: <strong>${inv.state || cust.state || '-'}</strong><br/><br/>
                Transport Name: ${inv.transport || ''}<br/>
                L.R. No:-<br/>
                Bale No:-<br/>
                Manual Challan No:-
            </div>
        </div>
        
        <table class="tbl">
            <thead>
                <tr>
                    <th style="width:5%">Sr No.</th>
                    <th style="width:40%;text-align:left">Description</th>
                    <th style="width:8%">HSN</th>
                    <th style="width:8%">Color</th>
                    <th style="width:8%">Size</th>
                    <th style="width:10%">Total<br/>Qty</th>
                    <th style="width:10%">Rate</th>
                    <th style="width:11%;border-right:none">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${itemRows}
            </tbody>
            <tfoot>
                <tr style="font-weight:bold;">
                    <td colspan="2" style="border:1px solid #ccc;padding:6px;text-align:center">Total</td>
                    <td style="border:1px solid #ccc;padding:6px"></td>
                    <td style="border:1px solid #ccc;padding:6px"></td>
                    <td style="border:1px solid #ccc;padding:6px"></td>
                    <td style="border:1px solid #ccc;padding:6px">${totalQty}</td>
                    <td colspan="2" style="border:1px solid #ccc;padding:6px;border-right:none;"></td>
                </tr>
            </tfoot>
        </table>
        
        <div class="totals-area">
            <div class="totals-blank"></div>
            <div class="totals-calc">
                <div class="calc-row"><span>Item Total</span><span>${Number(itemTotal).toLocaleString('en-IN')}</span></div>
                <div class="calc-row"><span>Discount(${inv.discRate}%)</span><span>- ${Number(discAmt).toLocaleString('en-IN')}</span></div>
                <div class="calc-row" style="font-weight:bold"><span>Sub Total</span><span>${Number(subTotal).toLocaleString('en-IN')}</span></div>
                ${inv.gstMode !== 'igst' ? `
                <div class="calc-row" style="font-weight:bold"><span>CGST%</span><span>${Number(cgstAmt).toLocaleString('en-IN')}</span></div>
                <div class="calc-row" style="font-weight:bold"><span>SGST%</span><span>${Number(sgstAmt).toLocaleString('en-IN')}</span></div>
                ` : `
                <div class="calc-row" style="font-weight:bold"><span>IGST%</span><span>${Number(igstAmt).toLocaleString('en-IN')}</span></div>
                `}
                <div class="calc-row" style="font-weight:bold;margin-top:4px"><span>Grand Total</span><span>${Number(grandTotal).toLocaleString('en-IN')}</span></div>
            </div>
        </div>
        
        <div style="padding:4px 8px;font-size:10px;">
            Amount Chargeable (in words)<br/>
            <strong>${amountInWords}</strong>
            <span style="float:right">E & O.E</span>
        </div>
        
        <table class="tax-tbl">
            <thead>
                <tr>
                    <th rowspan="2" style="width:8%;border-left:none">HSN<br/>Code</th>
                    <th rowspan="2" style="width:15%">Taxable<br/>Value</th>
                    <th rowspan="2" style="width:10%">Total<br/>Qty</th>
                    ${inv.gstMode !== 'igst' ? `
                    <th colspan="2" style="width:20%">CGST</th>
                    <th colspan="2" style="width:20%">SGST</th>
                    ` : `
                    <th colspan="2" style="width:40%">IGST</th>
                    `}
                    <th rowspan="2" style="width:15%">Total Tax<br/>Amount</th>
                    <th rowspan="2" style="width:12%;border-right:none"></th>
                </tr>
                <tr>
                    ${inv.gstMode !== 'igst' ? `
                    <th>Rate</th><th>Amount</th>
                    <th>Rate</th><th>Amount</th>
                    ` : `
                    <th>Rate</th><th>Amount</th>
                    `}
                </tr>
            </thead>
            <tbody>
                ${taxRows}
                <tr style="font-weight:bold">
                    <td style="border-left:none">Total</td>
                    <td>${Number(subTotal.toFixed(2)).toLocaleString('en-IN')}</td>
                    <td>${totalQty}</td>
                    ${inv.gstMode !== 'igst' ? `
                    <td></td>
                    <td>${Number((totalTaxAmt / 2).toFixed(2)).toLocaleString('en-IN')}</td>
                    <td></td>
                    <td>${Number((totalTaxAmt / 2).toFixed(2)).toLocaleString('en-IN')}</td>
                    <td>${Number(totalTaxAmt.toFixed(2)).toLocaleString('en-IN')}</td>
                    ` : `
                    <td></td>
                    <td>${Number(totalTaxAmt.toFixed(2)).toLocaleString('en-IN')}</td>
                    <td>${Number(totalTaxAmt.toFixed(2)).toLocaleString('en-IN')}</td>
                    `}
                    <td style="border-right:none"></td>
                </tr>
            </tbody>
        </table>
        
        <div class="footer-grid">
            <div class="terms">
                <strong>Terms & Conditions:</strong><br/><br/>
                ${(sup.terms || '1. E. & O.E. 2. Goods once sold will not be taken back or exchanged. 3. Supplier is not responsible for any loss or damaged of goods in transit. 4. Disputes, if any, will be subject to seller place jurisdiction.').replace(/\n/g, '<br/>')}
            </div>
            <div class="sign">
                <div>for <strong>${sup.name || 'Dhruvik'}</strong></div>
                <div style="margin-top:40px">Authorised Signatory</div>
            </div>
        </div>
    </div>
    
    <div class="bottom-credit">
        <div>Created by : <strong>${(inv.createdBy || inv.enteredBy || 'Admin').toUpperCase()}</strong></div>
        <div>Powered by <strong>Dhruvik</strong></div>
    </div>

    <!-- Print Formatter Button Container -->
    <div style="text-align:center; margin-bottom:40px;">
        <button class="print-btn" onclick="window.print()">
            Print Invoice
        </button>
    </div>

    </body></html>`);
    w.document.close();
}

// ═════════════════════ PACK DESIGN LOGIC ═════════════════════
let packCardsCount = 0;
let activeEditingPackId = null;

function openPackDesign() {
    activeEditingPackId = null;
    packCardsCount = 0;
    document.getElementById('packCardsArea').innerHTML = '';
    document.getElementById('pdTotalCount').textContent = '0';
    document.getElementById('btnDeletePack').style.display = 'none';
    document.getElementById('btnSavePack').textContent = 'SAVE';
    document.getElementById('pdMainDesign').textContent = 'No Design';

    packSelectedCustomerId = null;
    const pCustDisp = document.getElementById('packCustomerDisplay');
    if (pCustDisp) {
        pCustDisp.textContent = 'Select Customer';
        pCustDisp.className = 'challan-placeholder';
    }

    // Set current date/time to dd-MMM-yyyy HH:MM:ss format
    const now = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const formattedDate = `${dd}-${mm}-${yyyy} ${hh}:${min}:${ss}`;

    document.getElementById('pdDateTime').value = formattedDate;
    document.getElementById('pdNote').value = '';

    addPackCardArea(); // add first card
    document.getElementById('packDesignModal').style.display = 'flex';
}

function closePackDesign() {
    activeEditingPackId = null;
    document.getElementById('packDesignModal').style.display = 'none';
}

function addPackCardArea() {
    packCardsCount++;
    const cardId = `pdCard_${Date.now()}_${packCardsCount}`;
    const html = `
    <div id="${cardId}" class="inv-card" style="padding:14px;border:1px solid #ddd;box-shadow:0 1px 3px rgba(0,0,0,0.05);border-radius:2px;margin-bottom:12px;background:#fff">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
            <div>
                <div style="font-weight:bold;font-size:16px;color:#333;margin-bottom:2px" id="${cardId}_name">Select Design...</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
                <button onclick="openPDDesignPicker('${cardId}')" style="background:#f2f2f2;border:1px solid #ddd;padding:6px 10px;border-radius:2px;font-size:11px;font-weight:bold;color:#666;cursor:pointer">CHANGE DESIGN</button>
                <button style="background:#d9e1e8;color:#555;border:none;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer"><i class="fa fa-file-alt" style="font-size:13px"></i></button>
                <button onclick="removePackCardArea('${cardId}')" style="background:#ffcccc;color:#e53935;border:none;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer"><i class="fa fa-trash" style="font-size:13px"></i></button>
            </div>
        </div>
        <div style="display:flex;gap:16px;align-items:flex-end">
            <div style="width:60px;height:60px;background:#eee;border-radius:2px;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid #ddd" id="${cardId}_img">
                <i class="fa fa-tshirt" style="color:#aaa"></i>
            </div>
            <div style="flex:1">
                <input type="number" id="${cardId}_qty" placeholder="Qty*" style="width:100%;border:none;border-bottom:1px solid #ccc;padding:8px 0;font-size:14px;outline:none;color:#333;font-family:inherit;background:transparent;margin-bottom:8px" />
                <div style="display:flex;gap:8px">
                    <input type="text" id="${cardId}_size" placeholder="Size" oninput="refreshPDStock('${cardId}')" style="flex:1;border:none;border-bottom:1px solid #eee;padding:4px 0;font-size:12px;outline:none;color:#666;font-family:inherit;background:transparent;" />
                    <input type="text" id="${cardId}_color" placeholder="Color" oninput="refreshPDStock('${cardId}')" style="flex:1;border:none;border-bottom:1px solid #eee;padding:4px 0;font-size:12px;outline:none;color:#666;font-family:inherit;background:transparent;" />
                </div>
            </div>
        </div>
        <input type="hidden" id="${cardId}_designId" value=""/>
    </div>`;

    document.getElementById('packCardsArea').insertAdjacentHTML('beforeend', html);
    updatePackTotalCount();
}

function removePackCardArea(cardId) {
    const el = document.getElementById(cardId);
    if (el) el.remove();
    updatePackTotalCount();
}

function updatePackTotalCount() {
    const area = document.getElementById('packCardsArea');
    const cards = area.querySelectorAll('.inv-card');
    document.getElementById('pdTotalCount').textContent = cards.length;
}

function refreshPDStock(cardId) {
    const dId = document.getElementById(`${cardId}_designId`).value;
    const name = document.getElementById(`${cardId}_name`).textContent;
    const size = document.getElementById(`${cardId}_size`).value;
    const color = document.getElementById(`${cardId}_color`).value;
    const availEl = document.getElementById(`${cardId}_avail`);

    if (!dId || name === 'Select Design...') {
        if (availEl) availEl.textContent = '0';
        return;
    }

    const st = getDesignStock(name, size, color);
    if (availEl) {
        availEl.textContent = st.available;
        availEl.style.color = st.available >= 0 ? '#2e7d32' : '#c62828';
    }
}

function updatePackCardDesign(cardId, d) {
    document.getElementById(`${cardId}_name`).textContent = d.name || 'Unnamed';

    if (d.imgSrc) {
        document.getElementById(`${cardId}_img`).innerHTML = `<img src="${d.imgSrc}" style="width:100%;height:100%;object-fit:cover"/>`;
    } else {
        document.getElementById(`${cardId}_img`).innerHTML = `<i class="fa fa-tshirt" style="color:#aaa"></i>`;
    }

    // Update main design name if it's the first card
    const firstCard = document.getElementById('packCardsArea').firstElementChild;
    if (firstCard && firstCard.id === cardId) {
        document.getElementById('pdMainDesign').textContent = d.name || 'Unnamed';
    }

    document.getElementById(`${cardId}_designId`).value = d.id;
    refreshPDStock(cardId);
    document.getElementById(`${cardId}_qty`).focus();
}

function savePackDesign() {
    const area = document.getElementById('packCardsArea');
    const cards = area.querySelectorAll('.inv-card');

    const itemsMap = {}; // key: designId_size_color -> item
    cards.forEach(card => {
        const cId = card.id;
        const dId = document.getElementById(`${cId}_designId`).value;
        const qty = parseInt(document.getElementById(`${cId}_qty`).value) || 0;
        const size = (document.getElementById(`${cId}_size`).value || '').trim();
        const color = (document.getElementById(`${cId}_color`).value || '').trim();
        const name = document.getElementById(`${cId}_name`).textContent;

        if (dId && qty > 0) {
            const key = `${dId}_${size}_${color}`;
            if (itemsMap[key]) {
                itemsMap[key].qty += qty;
            } else {
                itemsMap[key] = { designId: parseInt(dId), name, qty, size, color };
            }
        }
    });
    const items = Object.values(itemsMap);

    if (items.length === 0) {
        alert("Please select at least one design and enter quantity!");
        return;
    }

    const dateTime = document.getElementById('pdDateTime').value;
    const note = document.getElementById('pdNote').value;

    const vastra_packs = JSON.parse(localStorage.getItem('vastra_packs') || '[]');
    const pack = {
        id: activeEditingPackId || Date.now(),
        customerId: packSelectedCustomerId,
        customerName: document.getElementById('packCustomerDisplay').textContent === 'Select Customer' ? '' : document.getElementById('packCustomerDisplay').textContent,
        items,
        dateTime,
        note,
        createdBy: localStorage.getItem('vastra_currentUser') || 'Admin',
        updatedAt: Date.now(),
        createdAt: activeEditingPackId ? (vastra_packs.find(p => p.id === activeEditingPackId)?.createdAt || formatDateTime(new Date())) : formatDateTime(new Date())
    };

    if (activeEditingPackId) {
        const idx = vastra_packs.findIndex(p => p.id === activeEditingPackId);
        if (idx > -1) vastra_packs[idx] = pack;
    } else {
        vastra_packs.push(pack);
    }
    localStorage.setItem('vastra_packs', JSON.stringify(vastra_packs));

    closePackDesign();
    const msg = activeEditingPackId ? "Pack updated successfully! 🔄" : "Pack saved successfully! 📦";
    showToast(msg);
    renderPackList();
}

function deletePackFromModal() {
    if (!activeEditingPackId) return;
    if (!confirm('Are you sure you want to delete this pack?')) return;

    let vastra_packs = JSON.parse(localStorage.getItem('vastra_packs') || '[]');
    const p = vastra_packs.find(x => x.id === activeEditingPackId);
    if (p) {
        p.deleted = true;
        p.updatedAt = Date.now();
    } else {
        vastra_packs = vastra_packs.filter(p => p.id !== activeEditingPackId);
    }
    localStorage.setItem('vastra_packs', JSON.stringify(vastra_packs));

    closePackDesign();
    showToast(`Pack deleted! 🗑️`);
    refreshStockViews();
}

function renderPackList() {
    const packs = JSON.parse(localStorage.getItem('vastra_packs') || '[]');
    const listEl = document.getElementById('packList');
    const emptyEl = document.getElementById('packEmpty');
    const searchInput = document.getElementById('packSearchInput');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    if (packs.length === 0 && !query) {
        listEl.innerHTML = '';
        emptyEl.style.display = 'flex';
        return;
    }

    emptyEl.style.display = 'none';

    // We need original idx to preserve packNum calculation, so map and then filter
    let mappedPacks = packs.map((p, idx) => ({
        pack: p,
        packNum: `PACKAG-${packs.length - idx}`
    })).filter(obj => !obj.pack.deleted);

    if (query) {
        mappedPacks = mappedPacks.filter(obj =>
            obj.packNum.toLowerCase().includes(query) ||
            (obj.pack.customerName && obj.pack.customerName.toLowerCase().includes(query)) ||
            (obj.pack.items && obj.pack.items.some(i => i.name && i.name.toLowerCase().includes(query)))
        );
    }

    if (mappedPacks.length === 0) {
        listEl.innerHTML = '<div style="padding:20px;text-align:center;color:#888;">No pack designs found matching your search.</div>';
        return;
    }

    let html = '';
    // Reverse the filtered array to display nearest first
    mappedPacks.slice().reverse().forEach(({ pack: p, packNum }) => {
        const totalQty = p.items.reduce((s, i) => s + parseInt(i.qty), 0);

        // Get first item image
        const firstItem = p.items[0];
        const img = firstItem ? getDesignImg(firstItem.designId) : '';

        // Calculate total available stock based on unique designs in this pack
        let totalAvail = 0;
        const seenDesigns = new Set();
        const itemSummaries = [];

        p.items.forEach(item => {
            if (item.name && !seenDesigns.has(item.name)) {
                // Get absolute total stock for this design (ignoring size/color)
                const st = getDesignStock(item.name);
                totalAvail += st.available;
                seenDesigns.add(item.name);
            }

            if (item.qty > 0) {
                const sizeTag = item.size ? ` (${item.size})` : '';
                itemSummaries.push(`${item.qty}${sizeTag}`);
            }
        });
        const itemsText = itemSummaries.join(', ');

        html += `
        <div onclick="editPack(${p.id})" style="background:#fff;border-radius:2px;box-shadow:0 1px 3px rgba(0,0,0,0.1);margin-bottom:12px;display:flex;align-items:center;padding:12px 16px;cursor:pointer;position:relative;">
            <div style="width:52px;height:52px;background:#f5f5f5;border-radius:6px;display:flex;align-items:center;justify-content:center;margin-right:16px;overflow:hidden;flex-shrink:0;border:1px solid #eee;">
                ${img ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover"/>` : `<i class="fa fa-tshirt" style="color:#ccc"></i>`}
            </div>
            <div style="flex:1;">
                <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px">${packNum}</div>
                <div style="font-size:15px;color:#111;font-weight:bold;margin-bottom:4px">
                    ${firstItem ? (designs.find(d => d.id === firstItem.designId)?.name || firstItem.name) : 'No Design'}
                    <span style="background:#e1f0f8; color:#0077c2; border-radius:4px; padding:1px 6px; font-size:10px; font-weight:bold; margin-left:8px; border:1px solid #b3d7ef; vertical-align:middle;">
                        <i class="fa fa-user" style="font-size:9px;"></i> ${(p.createdBy || 'Admin').toUpperCase()}
                    </span>
                </div>
                <div style="display:flex;gap:12px;font-size:12px;color:#666;flex-wrap:wrap;margin-bottom:2px">
                    <div>Packed: <strong style="color:#0088cc">${totalQty}</strong></div>
                    ${p.customerName ? `<div>• ${p.customerName}</div>` : ''}
                </div>
                <div style="font-size:12px;color:#6A1B9A;font-weight:600;">
                    ${itemsText}
                </div>
            </div>
            <i class="fa fa-chevron-right" style="color:#ccc;font-size:14px;"></i>
        </div>`;
    });

    listEl.innerHTML = html;
}

function editPack(id) {
    const packs = JSON.parse(localStorage.getItem('vastra_packs') || '[]');
    const pack = packs.find(p => p.id === id);
    if (!pack) return;

    activeEditingPackId = pack.id;
    packCardsCount = 0;
    document.getElementById('packCardsArea').innerHTML = '';

    document.getElementById('pdDateTime').value = pack.dateTime || '';
    document.getElementById('pdNote').value = pack.note || '';

    const pbByArea = document.getElementById('pdCreatedByArea');
    const pbByVal = document.getElementById('pdCreatedBy');
    if (pbByArea && pbByVal) {
        pbByArea.style.display = 'block';
        pbByVal.textContent = (pack.createdBy || 'Admin').toUpperCase();
    }

    document.getElementById('btnDeletePack').style.display = 'block';
    document.getElementById('btnSavePack').textContent = 'UPDATE';

    packSelectedCustomerId = pack.customerId || null;
    const pCustDisp = document.getElementById('packCustomerDisplay');
    if (pCustDisp) {
        if (pack.customerName) {
            pCustDisp.textContent = pack.customerName;
            pCustDisp.className = 'challan-selected';
        } else {
            pCustDisp.textContent = 'Select Customer';
            pCustDisp.className = 'challan-placeholder';
        }
    }

    if (pack.items && pack.items.length > 0) {
        document.getElementById('pdMainDesign').textContent = pack.items[0].name || 'No Design';
        pack.items.forEach(item => {
            packCardsCount++;
            const cardId = `pdCard_${Date.now()}_${packCardsCount}`;
            const html = `
            <div id="${cardId}" class="inv-card" style="padding:14px;border:1px solid #ddd;box-shadow:0 1px 3px rgba(0,0,0,0.05);border-radius:2px;margin-bottom:12px;background:#fff">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
                    <div>
                        <div style="font-weight:bold;font-size:16px;color:#333;margin-bottom:2px" id="${cardId}_name">${item.name || 'Unnamed'}</div>
                        <div style="font-size:11px;color:#666">Available: <strong id="${cardId}_avail" style="color:#2e7d32">0</strong></div>
                    </div>
                    <div style="display:flex;gap:8px;align-items:center">
                        <button onclick="openPDDesignPicker('${cardId}')" style="background:#f2f2f2;border:1px solid #ddd;padding:6px 10px;border-radius:2px;font-size:11px;font-weight:bold;color:#666;cursor:pointer">CHANGE DESIGN</button>
                        <button style="background:#d9e1e8;color:#555;border:none;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer"><i class="fa fa-file-alt" style="font-size:13px"></i></button>
                        <button onclick="removePackCardArea('${cardId}')" style="background:#ffcccc;color:#e53935;border:none;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer"><i class="fa fa-trash" style="font-size:13px"></i></button>
                    </div>
                </div>
                <div style="display:flex;gap:16px;align-items:flex-end">
                    <div style="width:60px;height:60px;background:#eee;border-radius:2px;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid #ddd" id="${cardId}_img">
                        ${getDesignImg(item.designId) ? `<img src="${getDesignImg(item.designId)}" style="width:100%;height:100%;object-fit:cover"/>` : `<i class="fa fa-tshirt" style="color:#aaa"></i>`}
                    </div>
                    <div style="flex:1">
                        <input type="number" id="${cardId}_qty" value="${item.qty || ''}" placeholder="Quantity*" style="width:100%;border:none;border-bottom:1px solid #ccc;padding:8px 0;font-size:14px;outline:none;color:#333;font-family:inherit;background:transparent;margin-bottom:8px" />
                        <div style="display:flex;gap:8px">
                            <input type="text" id="${cardId}_size" value="${item.size || ''}" placeholder="Size" oninput="refreshPDStock('${cardId}')" style="flex:1;border:none;border-bottom:1px solid #eee;padding:4px 0;font-size:12px;outline:none;color:#666;font-family:inherit;background:transparent;" />
                            <input type="text" id="${cardId}_color" value="${item.color || ''}" placeholder="Color" oninput="refreshPDStock('${cardId}')" style="flex:1;border:none;border-bottom:1px solid #eee;padding:4px 0;font-size:12px;outline:none;color:#666;font-family:inherit;background:transparent;" />
                        </div>
                    </div>
                </div>
                <input type="hidden" id="${cardId}_designId" value="${item.designId || ''}"/>
            </div>`;
            document.getElementById('packCardsArea').insertAdjacentHTML('beforeend', html);
            refreshPDStock(cardId);
        });
    } else {
        addPackCardArea();
    }

    updatePackTotalCount();
    document.getElementById('packDesignModal').style.display = 'flex';
}

// Ensure lists render on load or when switching tabs
const _originalShowSection = showSection;
showSection = function (id, el) {
    _originalShowSection(id, el);
    if (id === 'challansSection') {
        challans = JSON.parse(localStorage.getItem('vastra_challans') || '[]');
        renderChallanList();
    }
    if (id === 'packSection') {
        renderPackList();
    }
    if (id === 'salesReturnSection') {
        salesReturns = JSON.parse(localStorage.getItem('vastra_salesReturns') || '[]');
        renderSRList();
    }
    if (id === 'analysisSection') {
        changeAnalysisTab('top');
    }
    if (id === 'returnAnalysisSection') {
        changeReturnTab('customer');
    }
};

// ═════════════════════ ANALYSIS LOGIC ═══════════════════════
let currentAnalysisTab = 'top';

function refreshAnalysis() {
    showToast('Calculating reports...');
    changeAnalysisTab(currentAnalysisTab);
}

function changeAnalysisTab(tab) {
    currentAnalysisTab = tab;
    // Reset tabs
    ['Top', 'Low', 'Customer'].forEach(t => {
        const el = document.getElementById('tab' + t);
        if (el) {
            if (t.toLowerCase() === tab) {
                el.style.background = '#0088cc';
                el.style.color = '#fff';
            } else {
                el.style.background = '#f0f0f0';
                el.style.color = '#555';
            }
        }
    });

    const area = document.getElementById('analysisContentArea');
    let challansData = JSON.parse(localStorage.getItem('vastra_challans') || '[]');
    let packsData = JSON.parse(localStorage.getItem('vastra_packs') || '[]');
    let srData = JSON.parse(localStorage.getItem('vastra_salesReturns') || '[]');
    
    // Date Filtering
    const startVal = document.getElementById('analysisStart')?.value;
    const endVal = document.getElementById('analysisEnd')?.value;
    
    if (startVal || endVal) {
        const start = startVal ? new Date(startVal + 'T00:00:00') : null;
        const end = endVal ? new Date(endVal + 'T23:59:59') : null;

        const filterDateFn = (item) => {
            const dateStr = item.date || item.dateTime || item.returnDate || item.createdAt;
            if (!dateStr) return true;
            const itemDate = parseDateDDMMYYYY(dateStr);
            if (start && itemDate < start) return false;
            if (end && itemDate > end) return false;
            return true;
        };

        challansData = challansData.filter(filterDateFn);
        packsData = packsData.filter(filterDateFn);
        srData = srData.filter(filterDateFn);
    }
    const designsList = designs.filter(d => !d.deleted);

    const getDesignImage = (dName) => {
        const item = designsList.find(d => d.name === dName);
        return item && item.imgSrc ? item.imgSrc : '';
    };
    const getDesignSizeValue = (dName) => {
        const item = designsList.find(d => d.name === dName);
        return (item && item.size && item.size !== '–') ? item.size : '';
    };

    if (tab === 'top' || tab === 'low') {
        const allDesigns = new Set();
        const shippedMap = {};
        const returnedMap = {};
        const packedMap = {};

        packsData.forEach(p => {
            if (p.items) {
                p.items.forEach(itm => {
                    const name = itm.name || 'Unnamed';
                    allDesigns.add(name);
                    packedMap[name] = (packedMap[name] || 0) + parseInt(itm.qty || 0);
                });
            }
        });

        challansData.forEach(c => {
            if (c.items) {
                c.items.forEach(itm => {
                    const name = itm.designName || 'Unnamed';
                    allDesigns.add(name);
                    shippedMap[name] = (shippedMap[name] || 0) + parseInt(itm.qty || 0);
                });
            }
        });

        srData.forEach(sr => {
            if (sr.items) {
                sr.items.forEach(itm => {
                    const name = itm.designName || 'Unnamed';
                    allDesigns.add(name);
                    returnedMap[name] = (returnedMap[name] || 0) + parseInt(itm.qty || 0);
                });
            }
        });

        const arr = Array.from(allDesigns).map(name => {
            const packed = packedMap[name] || 0;
            const shipped = shippedMap[name] || 0;
            const returned = returnedMap[name] || 0;
            const netSold = shipped - returned;
            const available = packed + returned - shipped;

            return {
                name,
                packed,
                sold: netSold,
                available,
                imgSrc: getDesignImage(name),
                size: getDesignSizeValue(name)
            };
        });

        if (tab === 'top') {
            arr.sort((a, b) => b.sold - a.sold);
        } else {
            arr.sort((a, b) => a.sold - b.sold);
        }

        if (arr.length === 0) {
            area.innerHTML = '<div style="padding:20px;text-align:center;color:#888;">No data found. Pack designs and create challans to see analysis.</div>';
            return;
        }

        area.innerHTML = arr.map((item, idx) => {
            const availColor = item.available > 0 ? '#2e7d32' : item.available < 0 ? '#c62828' : '#888';
            return `
            <div style="display:flex;align-items:center;background:#fff;border:1px solid #eee;margin-bottom:10px;padding:12px;border-radius:4px;">
                <div style="font-weight:bold;font-size:16px;color:#888;width:30px;">#${idx + 1}</div>
                <div style="width:50px;height:50px;background:#f5f5f5;border-radius:4px;overflow:hidden;margin-right:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    ${item.imgSrc ? `<img src="${item.imgSrc}" style="width:100%;height:100%;object-fit:cover"/>` : `<i class="fa fa-tshirt" style="color:#aaa;"></i>`}
                </div>
                <div style="flex:1;">
                    <div style="font-size:15px;font-weight:bold;color:#333;margin-bottom:2px">${item.name}</div>
                    ${item.size ? `<div style="font-size:11px;color:#888;">Size: ${item.size}</div>` : ''}
                </div>
            </div>`;
        }).join('');

    } else if (tab === 'customer') {
        const custMap = {};
        challansData.forEach(c => {
            const cName = c.customerName || 'Unknown Customer';
            if (!custMap[cName]) custMap[cName] = { total: 0, items: {} };
            if (c.items) {
                c.items.forEach(itm => {
                    const dName = itm.designName || 'Unnamed';
                    const q = parseInt(itm.qty || 0);
                    custMap[cName].items[dName] = (custMap[cName].items[dName] || 0) + q;
                    custMap[cName].total += q;
                });
            }
        });

        const arr = Object.keys(custMap).map(name => ({
            name,
            total: custMap[name].total,
            items: custMap[name].items
        })).sort((a, b) => b.total - a.total);

        if (arr.length === 0) {
            area.innerHTML = '<div style="padding:20px;text-align:center;color:#888;">No customer sales data found. Create delivery challans to see customer analysis.</div>';
            return;
        }

        area.innerHTML = arr.map((cust, idx) => {
            return `
            <div style="display:flex;align-items:center;background:#fff;border:1px solid #eee;margin-bottom:10px;padding:12px;border-radius:4px;justify-content:space-between;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="font-weight:bold;font-size:16px;color:#888;width:30px;">#${idx + 1}</div>
                    <div style="font-size:15px;font-weight:bold;color:#333;">${cust.name}</div>
                </div>
                <div style="font-size:14px;color:#0088cc;font-weight:bold;">Total: ${cust.total} pcs</div>
            </div>`;
        }).join('');
    }
}


/* ================================================
   SALES RETURN
================================================ */
let salesReturns = JSON.parse(localStorage.getItem('vastra_salesReturns') || '[]');
let srSelectedCustomerId = null;
let packSelectedCustomerId = null;
let _addingToSRDetail = false;

function openCreateSalesReturn() {
    srSelectedCustomerId = null;
    document.getElementById('srCustomerDisplay').textContent = 'Select Customer*';
    document.getElementById('srCustomerDisplay').className = 'challan-placeholder';
    document.getElementById('srChallanDisplay').textContent = 'Delivery Challan';
    document.getElementById('srChallanDisplay').className = 'challan-placeholder';
    document.getElementById('srAgentDisplay').textContent = 'Select Agent';
    document.getElementById('srAgentDisplay').className = 'challan-placeholder';
    window._srSelectedChallanId = null;
    window._srSelectedAgent = null;
    ['srBillNumber', 'srLRNo', 'srDiscount', 'srShipping', 'srTransport', 'srCreditNoteNo', 'srSize', 'srColor'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('srPhotoPreview').innerHTML = '';
    document.getElementById('srItemsArea').innerHTML =
        '<div class="challan-items-empty"><div class="challan-empty-icon sm"><i class="fa fa-tshirt"></i></div></div>';
    // Set dates
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    document.getElementById('srReturnDate').value =
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    document.getElementById('srBillDate').value =
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    document.getElementById('srModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeSalesReturn() {
    document.getElementById('srModal').style.display = 'none';
    document.body.style.overflow = '';
}

function srPhotoPreview(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('srPhotoPreview').innerHTML =
            `<img src="${e.target.result}" style="width:72px;height:72px;object-fit:cover;border-radius:8px;margin:6px 0;"/>`;
    };
    reader.readAsDataURL(file);
}

function openCustomerSelectSR() {
    // Use the same customer modal but set a flag
    window._srCustomerPick = true;
    window._packCustomerPick = false;
    openCustomerSelect();
}

function openCustomerSelectPack() {
    // Use the same customer modal but set a flag
    window._packCustomerPick = true;
    window._srCustomerPick = false;
    openCustomerSelect();
}

// Patch selectCustomer to handle SR and Pack mode
const _origSelectCustomer = selectCustomer;
selectCustomer = function (id) {
    if (window._srCustomerPick) {
        const c = customers.find(x => x.id === id);
        if (!c) return;
        srSelectedCustomerId = id;
        const el = document.getElementById('srCustomerDisplay');
        el.textContent = c.name;
        el.className = 'challan-selected';
        window._srCustomerPick = false;
        closeCustomerSelect();
    } else if (window._packCustomerPick) {
        const c = customers.find(x => x.id === id);
        if (!c) return;
        packSelectedCustomerId = id;
        const el = document.getElementById('packCustomerDisplay');
        el.textContent = c.name;
        el.className = 'challan-selected';
        window._packCustomerPick = false;
        closeCustomerSelect();
    } else {
        _origSelectCustomer(id);
    }
};

function addSalesReturnItem() {
    designPickerContext = 'salesReturn';
    document.getElementById('designPickerSearch').value = '';
    renderDesignPickerGrid(designs);
    document.getElementById('designPickerModal').style.display = 'flex';
}

// Patch handleDesignSelect for salesReturn context
const _origHandleDesignSelect = handleDesignSelect;
handleDesignSelect = function (id) {
    if (designPickerContext === 'salesReturn' || designPickerContext === 'salesReturnDetail') {
        openQtyDialog(id);
    } else {
        _origHandleDesignSelect(id);
    }
};

// Patch confirmAddItem to handle SR context
const _origConfirmAddItem = confirmAddItem;
confirmAddItem = function () {
    if (!_pendingDesign) return;

    if (designPickerContext === 'salesReturn') {
        const qty = parseInt(document.getElementById('qtyInput').value) || 1;
        const rate = parseFloat(document.getElementById('rateInput').value) || 0;
        const size = document.getElementById('sizeInput').value || '';
        const color = document.getElementById('colorInput').value || '';
        const total = (qty * rate).toFixed(2);

        const area = document.getElementById('srItemsArea');
        area.querySelector('.challan-items-empty')?.remove();

        const row = document.createElement('div');
        row.className = 'challan-item-row';
        const uid = Date.now();
        row.id = 'sritem_' + uid;
        row.dataset.designId = _pendingDesign.id;
        row.dataset.designName = _pendingDesign.name || '';
        row.dataset.qty = qty;
        row.dataset.rate = rate;
        row.dataset.size = size;
        row.dataset.color = color;
        row.dataset.total = total;
        row.dataset.hsn = _pendingDesign.hsn || '';
        row.dataset.gstRate = _pendingDesign.gstRate || '0';
        row.dataset.gstMode = _pendingDesign.gstMode || 'igst';
        row.innerHTML = `
            <div class="challan-item-thumb">
                ${_pendingDesign.imgSrc ? `<img src="${_pendingDesign.imgSrc}" alt=""/>` : '<i class="fa fa-tshirt"></i>'}
            </div>
            <div class="challan-item-info">
                <strong>${_pendingDesign.name || 'Design'}</strong>
                <div style="font-size:10px;color:#888">HSN: ${_pendingDesign.hsn || '-'}</div>
                <div style="font-size:11px;color:#666">${size ? 'Size: ' + size : ''} ${color ? 'Color: ' + color : ''}</div>
                <span>₹${rate} × ${qty} = <b style="color:#fb8c00">₹${total}</b></span>
            </div>
            <div class="challan-item-qty"><strong>${qty}</strong><span>Qty</span></div>
            <button class="challan-item-del" onclick="document.getElementById('sritem_${uid}').remove()" title="Remove"><i class="fa fa-times"></i></button>
        `;
        area.appendChild(row);
        closeQtyDialog();
        showToast(`${_pendingDesign.name} added ✅`);
        _pendingDesign = null;
        return;
    }

    if (designPickerContext === 'salesReturnDetail') {
        const qty = parseInt(document.getElementById('qtyInput').value) || 1;
        const rate = parseFloat(document.getElementById('rateInput').value) || 0;
        const size = document.getElementById('sizeInput').value || '';
        const color = document.getElementById('colorInput').value || '';
        const total = (qty * rate).toFixed(2);

        if (currentSRDetail) {
            currentSRDetail.items = currentSRDetail.items || [];
            currentSRDetail.items.push({
                designId: _pendingDesign.id, designName: _pendingDesign.name || '',
                qty, rate, size, color, total: parseFloat(total),
                hsn: _pendingDesign.hsn || '',
                gstRate: _pendingDesign.gstRate || '0',
                gstMode: _pendingDesign.gstMode || 'igst'
            });
            renderSRDetail(currentSRDetail);
        }
        closeQtyDialog();
        showToast(`${_pendingDesign.name} added ✅`);
        _pendingDesign = null;
        _addingToSRDetail = false;
        return;
    }

    _origConfirmAddItem();
};

function saveSalesReturn() {
    try {
        const custEl = document.getElementById('srCustomerDisplay');
        if (!srSelectedCustomerId || custEl.textContent.trim() === 'Select Customer*') {
            showToast('❌ Please select a Customer!');
            return;
        }

        const items = [];
        document.querySelectorAll('#srItemsArea .challan-item-row').forEach(row => {
            items.push({
                designId: row.dataset.designId || '',
                designName: row.dataset.designName || '',
                qty: parseFloat(row.dataset.qty) || 0,
                rate: parseFloat(row.dataset.rate) || 0,
                size: row.dataset.size || '',
                color: row.dataset.color || '',
                total: parseFloat(row.dataset.total) || 0,
                hsn: row.dataset.hsn || '',
                gstRate: row.dataset.gstRate || '0',
                gstMode: row.dataset.gstMode || 'igst',
            });
        });

        if (items.length === 0) {
            showToast('❌ Please add at least one item!');
            return;
        }

        const sr = {
            id: Date.now(),
            customerId: srSelectedCustomerId,
            customerName: custEl.textContent.trim(),
            number: auto_sr_no(),
            billNumber: document.getElementById('srBillNumber').value,
            billDate: document.getElementById('srBillDate').value,
            lrNo: document.getElementById('srLRNo').value,
            discount: document.getElementById('srDiscount').value,
            shipping: document.getElementById('srShipping').value,
            transport: document.getElementById('srTransport').value,
            size: document.getElementById('srSize').value,
            color: document.getElementById('srColor').value,
            returnDate: document.getElementById('srReturnDate').value,
            creditNoteNo: document.getElementById('srCreditNoteNo').value,
            createdAt: formatDateDDMMYYYY(new Date()),
            createdTime: formatDateTime(new Date()),
            challanId: window._srSelectedChallanId || null,
            challanNum: (window._srSelectedChallanId) ?
                (JSON.parse(localStorage.getItem('vastra_challans') || '[]').find(x => x.id === window._srSelectedChallanId)?.number || '') : '',
            items,
            createdBy: localStorage.getItem('vastra_currentUser') || 'Admin',
            updatedAt: Date.now()
        };
        salesReturns.push(sr);
        localStorage.setItem('vastra_salesReturns', JSON.stringify(salesReturns));
        closeSalesReturn();
        renderSRList();
        showToast('Sales Return saved! ↩️');
    } catch (err) {
        console.error('saveSalesReturn ERROR:', err);
        alert('Error saving: ' + err.message);
    }
}

function auto_sr_no() {
    return 'SR-' + String(salesReturns.length + 1).padStart(4, '0');
}

function renderSRList() {
    const list = document.getElementById('srList');
    const empty = document.getElementById('srEmpty');
    const searchInput = document.getElementById('srSearchInput');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    if (salesReturns.length === 0 && !query) {
        list.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    let filteredSRs = salesReturns;
    if (query) {
        filteredSRs = salesReturns.filter(sr =>
            (sr.number && sr.number.toLowerCase().includes(query)) ||
            (sr.customerName && sr.customerName.toLowerCase().includes(query)) ||
            (sr.items && sr.items.some(i => i.designName && i.designName.toLowerCase().includes(query)))
        );
    }

    if (filteredSRs.length === 0) {
        list.innerHTML = '<div style="padding:20px;text-align:center;color:#888;">No sales returns found matching your search.</div>';
        return;
    }

    list.innerHTML = filteredSRs.slice().reverse().map(sr => {
        const firstItem = (sr.items && sr.items.length > 0) ? sr.items[0] : null;
        const img = firstItem ? getDesignImg(firstItem.designId) : '';

        let designName = '-';
        if (sr.items && sr.items.length > 0) {
            const uniqueDesigns = [...new Set(sr.items.map(i => i.designName || 'Unnamed'))];
            designName = uniqueDesigns.join(', ');
        }

        return `
        <div class="challan-card" onclick="openSRDetail(${sr.id})" style="display:flex;align-items:center;padding:12px;cursor:pointer;background:#fff;border-radius:2px;box-shadow:0 1px 3px rgba(0,0,0,0.1);margin-bottom:10px;">
            <div style="width:52px;height:52px;background:#FFF3E0;border-radius:6px;display:flex;align-items:center;justify-content:center;margin-right:12px;overflow:hidden;flex-shrink:0;border:1px solid #FFE0B2;">
                ${img ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover"/>` : `<i class="fa fa-undo-alt" style="color:#fb8c00"></i>`}
            </div>
            <div style="flex:1;">
                <div style="font-weight:700;font-size:15px;color:#111">${sr.number} - <span style="color:#e65100">${designName}</span></div>
                <div style="font-size:12px;color:#8A95A3;margin-top:3px">
                    ${sr.customerName || '-'} • ${formatDateDDMMYYYY(sr.createdAt)}
                    <span style="background:#e1f0f8; color:#0077c2; border-radius:4px; padding:1px 6px; font-size:10px; font-weight:bold; margin-left:8px; border:1px solid #b3d7ef;">
                        <i class="fa fa-user" style="font-size:9px;"></i> ${(sr.createdBy || 'Admin').toUpperCase()}
                    </span>
                </div>
                <div style="font-size:12px;color:#fb8c00;margin-top:2px">
                    ${(sr.items || []).length} item(s) • Qty: ${srSumQty(sr)}
                    ${srSizeStr(sr) ? `<span style="color:#666;font-size:11px;margin-left:5px">(${srSizeStr(sr)})</span>` : ''}
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
                <button onclick="event.stopPropagation();deleteSR(${sr.id})" style="background:#FFEBEE;border:none;color:#c62828;border-radius:8px;padding:8px 12px;cursor:pointer;font-size:12px;font-weight:600;"><i class="fa fa-trash"></i></button>
                <i class="fa fa-chevron-right" style="color:#ccc;font-size:14px;margin-left:4px"></i>
            </div>
        </div>`;
    }).join('');
}

function srSumQty(sr) {
    return (sr.items || []).reduce((s, i) => s + (i.qty || 0), 0);
}

function srSizeStr(sr) {
    const sizeWise = (sr.items || []).reduce((acc, itm) => {
        if (itm.size) {
            acc[itm.size] = (acc[itm.size] || 0) + (parseFloat(itm.qty) || 0);
        }
        return acc;
    }, {});
    return Object.entries(sizeWise).map(([s, q]) => `${s}:${q}`).join(', ');
}

function deleteSR(id) {
    if (!confirm('Delete this sales return?')) return;
    const sr = salesReturns.find(x => x.id === id);
    if (sr) {
        sr.deleted = true;
        sr.updatedAt = Date.now();
    } else {
        salesReturns = salesReturns.filter(sr => sr.id !== id);
    }
    localStorage.setItem('vastra_salesReturns', JSON.stringify(salesReturns));
    refreshStockViews();
    showToast('Sales Return deleted');
}

// Init SR list
renderSRList();


/* ================================================
   SALES RETURN DETAIL VIEW
================================================ */
let currentSRDetail = null;

function openSRDetail(id) {
    currentSRDetail = salesReturns.find(sr => sr.id === id);
    if (!currentSRDetail) return;
    document.getElementById('srDetailTitle').textContent = currentSRDetail.number;
    renderSRDetail(currentSRDetail);
    document.getElementById('srDetailModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeSRDetail() {
    document.getElementById('srDetailModal').style.display = 'none';
    document.body.style.overflow = '';
    currentSRDetail = null;
}

function renderSRDetail(sr) {
    const items = sr.items || [];
    const totalQty = items.reduce((s, i) => s + (i.qty || 0), 0);
    document.getElementById('srdTotalItems').textContent = items.length;
    document.getElementById('srdTotalQty').textContent = totalQty;
    document.getElementById('srdCreatedAt').textContent = sr.createdTime || sr.createdAt;
    document.getElementById('srdCustomer').textContent = sr.customerName;
    const srdByEl = document.getElementById('srdCreatedBy');
    if (srdByEl) srdByEl.textContent = (sr.createdBy || 'Admin').toUpperCase();
    document.getElementById('srdTransport').textContent = sr.transport || '-';
    document.getElementById('srdBillNo').textContent = sr.billNumber || '-';
    document.getElementById('srdBillDate').value = sr.billDate || '';
    document.getElementById('srdLRNo').value = sr.lrNo || '';
    document.getElementById('srdDiscount').value = sr.discount || '';
    document.getElementById('srdShipping').value = sr.shipping || '';
    document.getElementById('srdCreditNoteNo').value = sr.creditNoteNo || '';
    document.getElementById('srdAgent').value = sr.agent || '';
    const area = document.getElementById('srdItemsArea');
    if (!items.length) {
        area.innerHTML = '<div class="challan-items-empty"><div class="challan-empty-icon sm"><i class="fa fa-tshirt"></i></div><p style="color:var(--gray-4);margin-top:10px">No items</p></div>';
        return;
    }
    area.innerHTML = items.map((item, idx) => `
        <div class="cd-item-card">
            <div class="cd-item-header">
                <div style="display:flex;align-items:center;gap:10px">
                    <div class="challan-item-thumb">${getDesignImg(item.designId) ? `<img src="${getDesignImg(item.designId)}" alt=""/>` : '<i class="fa fa-tshirt"></i>'}</div>
                    <div>
                        <strong style="font-size:14px">${item.designName}</strong>
                        <div style="font-size:11px;color:#888">HSN: ${item.hsn || getDesignHSN(item.designId) || '-'}</div>
                    </div>
                </div>
                <button class="cd-icon-btn del" onclick="removeSRDItem(${idx})"><i class="fa fa-trash"></i></button>
            </div>
            <table class="cd-item-table">
                <thead><tr><th>SIZE</th><th>COLOR</th><th>QTY</th><th>RATE</th><th></th></tr></thead>
                <tbody><tr>
                    <td><input type="text" value="${item.size || ''}" placeholder="Size" class="cd-table-input" oninput="updateSRDItem(${idx},'size',this.value)"/></td>
                    <td><input type="text" value="${item.color || ''}" placeholder="Color" class="cd-table-input" oninput="updateSRDItem(${idx},'color',this.value)"/></td>
                    <td><input type="number" value="${item.qty}" class="cd-table-input" id="srd_qty_${idx}" oninput="updateSRDItem(${idx},'qty',this.value)"/></td>
                    <td><input type="number" value="${item.rate || 0}" class="cd-table-input" id="srd_rate_${idx}" oninput="updateSRDItem(${idx},'rate',this.value)"/></td>
                    <td><button onclick="removeSRDItem(${idx})" style="background:none;border:none;color:#c62828;font-size:18px;cursor:pointer"><i class="fa fa-times-circle"></i></button></td>
                </tr></tbody>
            </table>
            <div id="srd_total_${idx}" style="padding:6px 0;font-size:13px;font-weight:600;color:#fb8c00">Total: ${item.qty} x Rs.${item.rate || 0} = Rs.${((item.qty||0)*(item.rate||0)).toFixed(2)}</div>
        </div>`).join('');
}

function removeSRDItem(idx) {
    if (!currentSRDetail) return;
    currentSRDetail.items.splice(idx, 1);
    renderSRDetail(currentSRDetail);
}

function updateSRDItem(idx, field, val) {
    if (!currentSRDetail) return;
    const item = currentSRDetail.items[idx];
    if (!item) return;
    if (field === 'qty' || field === 'rate') {
        item[field] = parseFloat(val) || 0;
        item.total = item.qty * item.rate;
        // Update the total display line live
        const totalEl = document.getElementById(`srd_total_${idx}`);
        if (totalEl) {
            totalEl.textContent = `Total: ${item.qty} × ₹${item.rate || 0} = ₹${((item.qty || 0) * (item.rate || 0)).toFixed(2)}`;
        }
        // Update overall qty counters
        const totalQty = currentSRDetail.items.reduce((s, i) => s + (parseFloat(i.qty) || 0), 0);
        const totalItemsEl = document.getElementById('srdTotalItems');
        const totalQtyEl = document.getElementById('srdTotalQty');
        if (totalItemsEl) totalItemsEl.textContent = currentSRDetail.items.length;
        if (totalQtyEl) totalQtyEl.textContent = totalQty;
    } else {
        item[field] = val;
    }
}

function addItemToSRDetail() {
    _addingToSRDetail = true;
    designPickerContext = 'salesReturnDetail';
    document.getElementById('designPickerSearch').value = '';
    renderDesignPickerGrid(designs);
    document.getElementById('designPickerModal').style.display = 'flex';
}

function updateSalesReturn() {
    if (!currentSRDetail) return;
    currentSRDetail.billDate = document.getElementById('srdBillDate').value;
    currentSRDetail.lrNo = document.getElementById('srdLRNo').value;
    currentSRDetail.discount = document.getElementById('srdDiscount').value;
    currentSRDetail.shipping = document.getElementById('srdShipping').value;
    currentSRDetail.creditNoteNo = document.getElementById('srdCreditNoteNo').value;
    currentSRDetail.updatedBy = localStorage.getItem('vastra_currentUser') || 'Admin';
    currentSRDetail.updatedAt = Date.now();
    const idx = salesReturns.findIndex(sr => sr.id === currentSRDetail.id);
    if (idx !== -1) { salesReturns[idx] = { ...currentSRDetail }; }
    localStorage.setItem('vastra_salesReturns', JSON.stringify(salesReturns));
    showToast('Sales Return updated! ✅');
    renderSRList();
    // Re-render detail so everything refreshes
    renderSRDetail(currentSRDetail);
}

function convertSRToInvoice() {
    if (!currentSRDetail) return;
    // Reuse the same Create Invoice modal as Delivery Challan
    currentInvoiceChallan = {
        ...currentSRDetail,
        customerName: currentSRDetail.customerName,
        number: currentSRDetail.number,
        transport: currentSRDetail.transport || '',
        items: (currentSRDetail.items || []).map(itm => ({
            designId: itm.designId,
            designName: itm.designName,
            qty: itm.qty,
            rate: itm.rate || 0,
            imgSrc: '',
            hsn: itm.hsn || '',
            gstRate: itm.gstRate || '0',
            gstMode: itm.gstMode || 'igst'
        }))
    };
    document.getElementById('invCustomerName').textContent = currentSRDetail.customerName;
    document.getElementById('invChallanNum').textContent = currentSRDetail.number;
    document.getElementById('invTransportField').value = currentSRDetail.transport || '';
    const now = new Date();
    document.getElementById('invDate').value = now.toISOString().split('T')[0];

    let firstItem = (currentSRDetail.items && currentSRDetail.items.length > 0) ? currentSRDetail.items[0] : null;
    invGSTRate = firstItem ? (parseFloat(firstItem.gstRate) || 0) : 0;
    invGSTMode = firstItem ? (firstItem.gstMode || 'igst') : 'igst';
    invDiscRate = parseFloat(currentSRDetail.discount) || 0;

    document.getElementById('invDiscInput').value = invDiscRate;
    setInvGSTMode(invGSTMode);

    document.getElementById('invGSTTypeDisplay').textContent = 'Registered';
    document.getElementById('invStateDisplay').textContent = 'State of Supply*';
    document.getElementById('invStateDisplay').className = 'inv-placeholder';
    document.getElementById('invCityDisplay').textContent = 'City of Supply*';
    document.getElementById('invCityDisplay').className = 'inv-placeholder';
    renderInvItems();
    calcInvTotals();
    document.getElementById('createInvoiceModal').style.display = 'flex';
}

function printSRInvoice(sr) {
    const items = sr.items || [];
    const totalQty = items.reduce((s, i) => s + parseInt(i.qty), 0);
    const itemTotal = items.reduce((s, i) => s + (i.qty * parseFloat(i.rate || 0)), 0);
    const discRate = parseFloat(sr.discount) || 0;
    const discAmt = itemTotal * (discRate / 100);
    const subTotal = itemTotal - discAmt;

    // Item-wise Tax grouping for summary table
    const taxGroups = {};
    let totalTaxAmt = 0;
    const gstMode = sr.items && sr.items[0] ? (sr.items[0].gstMode || 'igst') : 'igst';

    items.forEach(itm => {
        const hsn = itm.hsn || getDesignHSN(itm.designId) || '-';
        const amt = itm.qty * itm.rate;
        const itmDiscAmt = amt * (discRate / 100);
        const taxable = amt - itmDiscAmt;
        const rate = parseFloat(itm.gstRate) || 0;
        const tax = taxable * rate / 100;
        totalTaxAmt += tax;

        if (!taxGroups[hsn]) {
            taxGroups[hsn] = { taxableValue: 0, qty: 0, cgst: 0, sgst: 0, igst: 0, rate: rate };
        }
        taxGroups[hsn].taxableValue += taxable;
        taxGroups[hsn].qty += parseInt(itm.qty) || 0;

        if (gstMode === 'igst') {
            taxGroups[hsn].igst += tax;
        } else {
            taxGroups[hsn].cgst += tax / 2;
            taxGroups[hsn].sgst += tax / 2;
        }
    });

    const grandTotal = subTotal + totalTaxAmt;
    const amountInWords = `Indian Rupees ${Number(grandTotal.toFixed(2)).toLocaleString('en-IN')} Only`;
    const dateOnly = sr.returnDate ? formatDateDDMMYYYY(sr.returnDate) : sr.createdAt;

    const itemRows = items.map((item, idx) => {
        const amt = (item.qty * (item.rate || 0)).toFixed(0);
        return `<tr>
            <td style="border:1px solid #ccc;padding:8px;text-align:center">${idx + 1}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:left">${item.designName}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:center">${item.hsn || getDesignHSN(item.designId) || '-'}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:center">${item.color || '-'}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:center">${item.size || '-'}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:center">${item.qty}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:center">${item.rate || 0}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:right">${Number(amt).toLocaleString('en-IN')}</td>
        </tr>`;
    }).join('');

    const taxRows = Object.keys(taxGroups).map(hsn => {
        const g = taxGroups[hsn];
        const totalTax = g.cgst + g.sgst + g.igst;
        const rateDisplay = g.rate;
        return `<tr>
            <td style="border-left:none">${hsn}</td>
            <td>${Number(g.taxableValue.toFixed(2)).toLocaleString('en-IN')}</td>
            <td>${g.qty}</td>
            ${gstMode !== 'igst' ? `
            <td>${(rateDisplay / 2).toFixed(1)}%</td>
            <td>${Number(g.cgst.toFixed(2)).toLocaleString('en-IN')}</td>
            <td>${(rateDisplay / 2).toFixed(1)}%</td>
            <td>${Number(g.sgst.toFixed(2)).toLocaleString('en-IN')}</td>
            <td>${Number(totalTax.toFixed(2)).toLocaleString('en-IN')}</td>
            <td style="border-right:none;font-size:9px">CGST AMT : ${Number(g.cgst.toFixed(2)).toLocaleString('en-IN')}<br/>SGST AMT : ${Number(g.sgst.toFixed(2)).toLocaleString('en-IN')}</td>
            ` : `
            <td>${rateDisplay}%</td>
            <td>${Number(g.igst.toFixed(2)).toLocaleString('en-IN')}</td>
            <td>${Number(g.igst.toFixed(2)).toLocaleString('en-IN')}</td>
            <td style="border-right:none;font-size:9px">IGST AMT : ${Number(g.igst.toFixed(2)).toLocaleString('en-IN')}</td>
            `}
        </tr>`;
    }).join('');

    const sup = getSupplierProfile();
    const cust = customers.find(c => (sr.customerId && c.id === sr.customerId) || c.name === sr.customerName) || {};

    const w = window.open('', '_blank', 'width=850,height=1000');
    w.document.write(`<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <title>Credit Note ${sr.number}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: Arial, sans-serif; color: #000; background: #fff; padding: 20px; font-size: 11px; }
      .page { max-width: 800px; margin: 0 auto; border: 1px solid #ccc; padding: 0; }
      .title { text-align: center; font-weight: bold; font-size: 13px; padding: 8px; border-bottom: 1px solid #ccc; background:#FFF3E0; color:#e65100; }
      .header-grid { display: flex; border-bottom: 1px solid #ccc; }
      .seller-info { flex: 1.2; padding: 12px; border-right: 1px solid #ccc; }
      .meta-info { flex: 1; display: flex; flex-direction: column; }
      .meta-row { display: flex; border-bottom: 1px solid #ccc; }
      .meta-cell { flex: 1; padding: 6px 12px; border-right: 1px solid #ccc; }
      .meta-cell:last-child { border-right: none; }
      .buyer-grid { display: flex; }
      .buyer-left { flex: 1; border-right: 1px solid #ccc; padding: 12px; }
      .buyer-right { flex: 1; padding: 12px; }
      .tbl { width: 100%; border-collapse: collapse; text-align: center; }
      .tbl th { border: 1px solid #ccc; padding: 8px; background-color: #FFF3E0; font-weight: bold; border-top: none; }
      .tbl td { border: 1px solid #ccc; padding: 6px; }
      .totals-area { display: flex; text-align: right; }
      .totals-blank { flex: 2; border-right: 1px solid #ccc; border-bottom: 1px solid #ccc;}
      .totals-calc { flex: 1; padding: 4px; border-bottom: 1px solid #ccc;}
      .calc-row { display: flex; justify-content: space-between; padding: 4px 12px; }
      .footer-grid { display: flex; border-bottom: 1px solid #ccc; }
      .terms { flex: 1; padding: 12px; border-right: 1px solid #ccc; font-size: 10px; }
      .sign { flex: 1; padding: 12px; text-align: right; display: flex; flex-direction: column; justify-content: space-between; }
      .bottom-credit { display: flex; justify-content: space-between; padding: 12px; margin-top: 10px;}
      .print-btn {
        display: block; width: 220px; margin: 24px auto;
        padding: 12px 0; background: #e65100; color: #fff;
        border: none; border-radius: 4px; font-size: 15px; font-weight: bold;
        cursor: pointer; text-align: center;
      }
      @page { margin: 0; }
      @media print {
        body { padding: 1cm; }
        .page { border: 1px solid #000; }
        .print-btn { display: none !important; }
      }
    </style>
    </head><body>
    
    <div class="page">
        <div class="title">Credit Note / Sales Return</div>
        
        <div class="header-grid">
            <div class="seller-info">
                Supplier Name: <strong>${sup.name || 'Honest export'}</strong><br/>
                Address: <strong>${sup.address || '4, 405, MARUTI A VENUE BLDGA, RAJ LAXMI SOC.,NR HANS RESIDANCY, VED ROAD, Surat, Gujarat, 395004'}</strong><br/>
                Gst No: <strong>${sup.gst || '24FMJPM2024L1ZZ'}</strong><br/>
                City: <strong>${sup.city || 'Surat'}</strong>, Pincode: <strong>${sup.pincode || '395004'}</strong><br/>
                State: <strong>${sup.state || 'Gujarat'}</strong>, Code : <strong>${sup.stateCode || '24'}</strong><br/>
                Phone No: <strong>${sup.phone || '9924297264'}</strong>
            </div>
            
            <div class="meta-info">
                <div class="meta-row">
                    <div class="meta-cell">Credit Note No<br/><strong>${sr.number}</strong></div>
                    <div class="meta-cell">Date<br/><strong>${dateOnly}</strong></div>
                </div>
                <div class="meta-row">
                    <div class="meta-cell">Bill No:<br/><strong>${sr.billNumber || '-'}</strong></div>
                    <div class="meta-cell">Bill Date:<br/><strong>${sr.billDate ? formatDateDDMMYYYY(sr.billDate) : '-'}</strong></div>
                </div>
                <div class="meta-row" style="border-bottom:none;">
                    <div style="padding: 6px 12px;">L.R. No: ${sr.lrNo || '-'}<br/>Credit Note No: ${sr.creditNoteNo || '-'}</div>
                </div>
            </div>
        </div>
        
        <div class="buyer-grid">
            <div class="buyer-left">
                Buyer's Name: <strong>${sr.customerName}</strong><br/>
                Address: ${cust.address || ''}<br/>
                GST No: ${cust.gst || ''}<br/>
                City: ${sr.city || cust.city || ''}, Pincode: <strong>${cust.pincode || (CITY_PINCODE_MAP[sr.city || cust.city] || '')}</strong><br/>
                State: <strong>${sr.state || cust.state || 'Gujarat'}</strong>, Code : <strong>${cust.stateCode || '-'}</strong>
            </div>
            <div class="buyer-right">
                Transport Name: ${sr.transport || '-'}<br/>
                L.R. No: ${sr.lrNo || '-'}<br/>
                Shipping: ₹${sr.shipping || '0'}<br/>
                Discount: ${sr.discount || '0'}%
            </div>
        </div>
        
        <table class="tbl">
            <thead>
                <tr>
                    <th style="width:5%">Sr No.</th>
                    <th style="width:40%;text-align:left">Description</th>
                    <th style="width:8%">HSN</th>
                    <th style="width:8%">Color</th>
                    <th style="width:8%">Size</th>
                    <th style="width:10%">Return<br/>Qty</th>
                    <th style="width:10%">Rate</th>
                    <th style="width:11%;border-right:none">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${itemRows}
            </tbody>
            <tfoot>
                <tr style="font-weight:bold;">
                    <td colspan="2" style="border:1px solid #ccc;padding:6px;text-align:center">Total</td>
                    <td style="border:1px solid #ccc;padding:6px"></td>
                    <td style="border:1px solid #ccc;padding:6px"></td>
                    <td style="border:1px solid #ccc;padding:6px"></td>
                    <td style="border:1px solid #ccc;padding:6px">${totalQty}</td>
                    <td colspan="2" style="border:1px solid #ccc;padding:6px;border-right:none;"></td>
                </tr>
            </tfoot>
        </table>

        <!-- Tax Table -->
        <div style="margin-top:10px">
            <table style="width:100%;border-collapse:collapse;font-size:10px;text-align:center">
                <thead style="background:#f9f9f9">
                    <tr>
                        <th rowspan="2" style="border:1px solid #ccc;border-left:none">HSN/SAC</th>
                        <th rowspan="2" style="border:1px solid #ccc">Taxable Value</th>
                        <th rowspan="2" style="border:1px solid #ccc">Qty</th>
                        ${gstMode !== 'igst' ? `
                        <th colspan="2" style="border:1px solid #ccc">Central Tax</th>
                        <th colspan="2" style="border:1px solid #ccc">State Tax</th>
                        ` : `
                        <th colspan="2" style="border:1px solid #ccc">Integrated Tax</th>
                        `}
                        <th rowspan="2" style="border:1px solid #ccc">Total Tax Amount</th>
                        <th rowspan="2" style="border:1px solid #ccc;border-right:none">Remarks</th>
                    </tr>
                    <tr>
                        ${gstMode !== 'igst' ? `
                        <th style="border:1px solid #ccc">Rate</th><th style="border:1px solid #ccc">Amount</th>
                        <th style="border:1px solid #ccc">Rate</th><th style="border:1px solid #ccc">Amount</th>
                        ` : `
                        <th style="border:1px solid #ccc">Rate</th><th style="border:1px solid #ccc">Amount</th>
                        `}
                    </tr>
                </thead>
                <tbody>
                    ${taxRows}
                    <tr style="font-weight:bold">
                        <td style="border-left:none">Total</td>
                        <td>${Number(subTotal.toFixed(2)).toLocaleString('en-IN')}</td>
                        <td>${totalQty}</td>
                        ${gstMode !== 'igst' ? `
                        <td></td>
                        <td>${Number((totalTaxAmt / 2).toFixed(2)).toLocaleString('en-IN')}</td>
                        <td></td>
                        <td>${Number((totalTaxAmt / 2).toFixed(2)).toLocaleString('en-IN')}</td>
                        <td>${Number(totalTaxAmt.toFixed(2)).toLocaleString('en-IN')}</td>
                        ` : `
                        <td></td>
                        <td>${Number(totalTaxAmt.toFixed(2)).toLocaleString('en-IN')}</td>
                        <td>${Number(totalTaxAmt.toFixed(2)).toLocaleString('en-IN')}</td>
                        `}
                        <td style="border-right:none"></td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="totals-area">
            <div class="totals-blank"></div>
            <div class="totals-calc">
                <div class="calc-row"><span>Item Total</span><span>₹${Number(itemTotal).toLocaleString('en-IN')}</span></div>
                <div class="calc-row"><span>Discount(${discRate}%)</span><span>- ₹${Number(discAmt).toLocaleString('en-IN')}</span></div>
                <div class="calc-row"><span>Tax Amount</span><span>+ ₹${Number(totalTaxAmt.toFixed(2)).toLocaleString('en-IN')}</span></div>
                <div class="calc-row" style="font-weight:bold;margin-top:4px;border-top:1px solid #ccc;padding-top:4px"><span>Total Amount</span><span>₹${Number(grandTotal.toFixed(2)).toLocaleString('en-IN')}</span></div>
            </div>
        </div>
        
        <div style="padding:4px 8px;font-size:10px;">
            Amount (in words)<br/>
            <strong>${amountInWords}</strong>
        </div>
        
        <div class="footer-grid">
            <div class="terms">
                <strong>Terms & Conditions:</strong><br/><br/>
                ${(sup.terms || '1. E. & O.E. 2. This Credit Note is issued against returned goods. 3. Amount will be adjusted against future invoices.').replace(/\n/g, '<br/>')}
            </div>
            <div class="sign">
                <div>for <strong>${sup.name || 'Dhruvik'}</strong></div>
                <div style="margin-top:40px">Authorised Signatory</div>
            </div>
        </div>
    </div>
    
    <div class="bottom-credit">
        <div>Created by : <strong>${sr.enteredBy || 'Admin'}</strong></div>
        <div>Powered by <strong>Dhruvik</strong></div>
    </div>
    
    <button class="print-btn" onclick="window.print()">🖨️ PRINT CREDIT NOTE</button>
    
    </body></html>`);
}
/* ── Sales Return: Challan Picker ─────────────── */
function openSRChallanPicker() {
    const challansData = JSON.parse(localStorage.getItem('vastra_challans') || '[]');
    if (challansData.length === 0) {
        showToast('No delivery challans found!');
        return;
    }
    // Build a simple picker overlay
    let overlay = document.getElementById('srChallanPickerOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'srChallanPickerOverlay';
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-sheet challan-sheet" style="max-height:70vh">
                <div class="modal-header">
                    <button class="modal-back" onclick="document.getElementById('srChallanPickerOverlay').style.display='none'"><i class="fa fa-arrow-left"></i></button>
                    <h2 class="modal-title">Select Delivery Challan</h2>
                </div>
                <div id="srChallanPickerList" style="flex:1;overflow-y:auto;padding:12px"></div>
            </div>`;
        document.body.appendChild(overlay);
    }
    const listEl = document.getElementById('srChallanPickerList');
    listEl.innerHTML = challansData.map(c => `
        <div style="padding:12px;border-bottom:1px solid #eee;cursor:pointer;display:flex;justify-content:space-between;align-items:center" onclick="selectSRChallan(${c.id})">
            <div>
                <strong>${c.number}</strong>
                <div style="font-size:12px;color:#888">${c.customerName} • ${formatDateDDMMYYYY(c.createdAt)}</div>
            </div>
            <div style="font-size:12px;color:var(--blue);font-weight:600">${(c.items || []).length} items</div>
        </div>`).join('');
    overlay.style.display = 'flex';
}

function selectSRChallan(id) {
    const challansData = JSON.parse(localStorage.getItem('vastra_challans') || '[]');
    const c = challansData.find(x => x.id === id);
    if (!c) return;
    window._srSelectedChallanId = id;
    document.getElementById('srChallanDisplay').textContent = c.number + ' - ' + c.customerName;
    document.getElementById('srChallanDisplay').className = 'challan-selected';
    document.getElementById('srChallanPickerOverlay').style.display = 'none';
}

/* ── Sales Return: Agent uses existing openAgentSelect('sr') ── */


/* ================================================
   RETURN ANALYSIS
================================================ */
let currentReturnAnalysisTab = 'customer';

function refreshReturnAnalysis() {
    showToast('Calculating return reports...');
    changeReturnTab(currentReturnAnalysisTab);
}

function changeReturnTab(tab) {
    currentReturnAnalysisTab = tab;
    ['RetCustomer', 'RetDesign'].forEach(t => {
        const el = document.getElementById('tab' + t);
        if (el) {
            const isActive = (t === 'RetCustomer' && tab === 'customer') || (t === 'RetDesign' && tab === 'design');
            el.style.background = isActive ? '#fb8c00' : '#f0f0f0';
            el.style.color = isActive ? '#fff' : '#555';
        }
    });

    const area = document.getElementById('returnContentArea');
    let srData = JSON.parse(localStorage.getItem('vastra_salesReturns') || '[]');
    
    // Date Filtering
    const startVal = document.getElementById('returnAnalysisStart')?.value;
    const endVal = document.getElementById('returnAnalysisEnd')?.value;
    
    if (startVal || endVal) {
        const start = startVal ? new Date(startVal + 'T00:00:00') : null;
        const end = endVal ? new Date(endVal + 'T23:59:59') : null;
        
        srData = srData.filter(sr => {
            const dateStr = sr.returnDate || sr.createdAt;
            if (!dateStr) return true;
            const itemDate = parseDateDDMMYYYY(dateStr);
            if (start && itemDate < start) return false;
            if (end && itemDate > end) return false;
            return true;
        });
    }

    const designsList = designs.filter(d => !d.deleted);

    const getDesignImage = (dName) => {
        const item = designs.find(d => d.name === dName);
        return item && item.imgSrc ? item.imgSrc : '';
    };

    if (tab === 'customer') {
        const custData = {}; // customerName -> { total: 0, items: [] }
        srData.forEach(sr => {
            const cName = sr.customerName || 'Unknown';
            if (!custData[cName]) custData[cName] = { total: 0, items: [] };

            if (sr.items) {
                sr.items.forEach(itm => {
                    const q = parseInt(itm.qty || 0);
                    custData[cName].total += q;
                    custData[cName].items.push({
                        design: itm.designName || 'Unnamed',
                        qty: q,
                        size: itm.size || '',
                        color: itm.color || '',
                        date: sr.returnDate || sr.createdAt,
                        challanId: sr.challanId,
                        challanNum: sr.challanNum || '',
                        srId: sr.id
                    });
                });
            }
        });

        const arr = Object.keys(custData).map(name => ({
            name, total: custData[name].total, items: custData[name].items
        })).sort((a, b) => b.total - a.total);

        if (arr.length === 0) {
            area.innerHTML = '<div style="padding:20px;text-align:center;color:#888;">No return data found.</div>';
            return;
        }

        area.innerHTML = arr.map((cust, idx) => {
            const itemsHtml = cust.items.map(itm => `
                <div style="font-size:12px;display:flex;justify-content:space-between;border-bottom:1px dashed #eee;padding:6px 0;cursor:pointer" onclick="openSRDetail(${itm.srId})">
                    <div style="flex:1;">
                        <span style="font-weight:600;color:#333">${itm.design}</span> 
                        <span style="color:#888;margin-left:4px">${itm.size} ${itm.color}</span>
                        <div style="font-size:10px;color:#fb8c00">${itm.date}${itm.challanNum ? ' • ' + itm.challanNum : ''}</div>
                    </div>
                    <strong>${itm.qty} pcs</strong>
                </div>`).join('');

            return `
            <div style="background:#fff;border:1px solid #ddd;border-radius:4px;margin-bottom:12px;overflow:hidden;">
                <div style="background:#f9f9f9;padding:12px 14px;border-bottom:1px solid #ddd;display:flex;justify-content:space-between;align-items:center">
                    <div style="font-size:15px;font-weight:bold;color:#111;">#${idx + 1} ${cust.name}</div>
                    <div style="font-size:13px;color:#e65100;font-weight:bold;">Total: ${cust.total} pcs</div>
                </div>
                <div style="padding:8px 14px;">
                    ${itemsHtml}
                </div>
            </div>`;
        }).join('');

    } else if (tab === 'design') {
        const designData = {}; // designName -> { total: 0, items: [] }
        srData.forEach(sr => {
            if (sr.items) {
                sr.items.forEach(itm => {
                    const dName = itm.designName || 'Unnamed';
                    if (!designData[dName]) designData[dName] = { total: 0, items: [] };

                    const q = parseInt(itm.qty || 0);
                    designData[dName].total += q;
                    designData[dName].items.push({
                        customer: sr.customerName || 'Unknown',
                        qty: q,
                        size: itm.size || '',
                        color: itm.color || '',
                        date: sr.returnDate || sr.createdAt,
                        challanId: sr.challanId,
                        challanNum: sr.challanNum || '',
                        srId: sr.id // Add Sales Return ID
                    });
                });
            }
        });

        const arr = Object.keys(designData).map(name => ({
            name,
            total: designData[name].total,
            items: designData[name].items,
            imgSrc: getDesignImage(name)
        })).sort((a, b) => b.total - a.total);

        if (arr.length === 0) {
            area.innerHTML = '<div style="padding:20px;text-align:center;color:#888;">No return data found.</div>';
            return;
        }

        area.innerHTML = arr.map((design, idx) => {
            const itemsHtml = design.items.map(itm => `
                <div style="font-size:12px;display:flex;justify-content:space-between;border-bottom:1px dashed #eee;padding:6px 0;cursor:pointer" onclick="openSRDetail(${itm.srId})">
                    <div style="flex:1;">
                        <span style="font-weight:600;color:#333">${itm.customer}</span> 
                        <span style="color:#888;margin-left:4px">${itm.size} ${itm.color}</span>
                        <div style="font-size:10px;color:#fb8c00">${itm.date}${itm.challanNum ? ' • ' + itm.challanNum : ''}</div>
                    </div>
                    <strong>${itm.qty} pcs</strong>
                </div>`).join('');

            return `
            <div style="background:#fff;border:1px solid #ddd;border-radius:4px;margin-bottom:12px;overflow:hidden;">
                <div style="background:#f9f9f9;padding:12px 14px;border-bottom:1px solid #ddd;display:flex;align-items:center;">
                    <div style="width:36px;height:36px;border-radius:4px;background:#eee;margin-right:12px;overflow:hidden;flex-shrink:0">
                        ${design.imgSrc ? `<img src="${design.imgSrc}" style="width:100%;height:100%;object-fit:cover"/>` : ''}
                    </div>
                    <div style="flex:1;">
                        <div style="font-size:15px;font-weight:bold;color:#111;">${design.name}</div>
                    </div>
                    <div style="font-size:13px;color:#e65100;font-weight:bold;">Total: ${design.total} pcs</div>
                </div>
                <div style="padding:8px 14px;">
                    ${itemsHtml}
                </div>
            </div>`;
        }).join('');
    }
}

// ═════════════════════ LIVE STOCK SECTION ═════════════════════
let isLiveStockSetWise = false;

function renderLiveStock() {
    const listEl = document.getElementById('liveStockList');
    if (!listEl) return;

    let allDesigns = designs.filter(d => !d.deleted);
    let overallStockTotal = 0;

    // Apply Filters
    const query = (document.getElementById('liveStockSearchInput')?.value || '').toLowerCase();
    if (query) {
        allDesigns = allDesigns.filter(d => d.name.toLowerCase().includes(query));
    }

    // Sort designs numerically (e.g., 199, 200, 201)
    allDesigns.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true, sensitivity: 'base' }));
    if (isLiveStockSetWise) {
        allDesigns = allDesigns.filter(d => d.setWise === true);
    }

    if (allDesigns.length === 0) {
        listEl.innerHTML = '<div style="text-align:center;color:#888;margin-top:20px;">No designs found matching your criteria.</div>';
        document.getElementById('overallStockTotal').textContent = '0';
        return;
    }

    let html = '';
    allDesigns.forEach(d => {
        const stock = getDesignStock(d.name);
        overallStockTotal += stock.available;

        const imgSrc = d.imgSrc || '';
        const imgHTML = imgSrc ? `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;" />` : '';

        html += `
        <div onclick="openLiveStockDetail('${d.name.replace(/'/g, "\\'")}')" style="cursor: pointer; background: #fff; border: 1px solid #eab676; border-radius: 4px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
            <!-- Top Orange Bar -->
            <div style="background:#fff3e0;display:flex;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #eab676;align-items:center;">
                <div style="color:#e65100;font-weight:bold;font-size:16px;">${d.name}</div>
            </div>
            
            <div style="padding:16px;background:#fefefe;">
                <div style="color:#666;font-size:14px;margin-bottom:12px;">Rate: <strong style="color:#333">${d.price || '0'}</strong></div>
                
                <div style="display:flex;align-items:center;background:#f9f9f9;padding:12px;border-radius:4px;gap:16px;">
                    <div style="width:65px;height:65px;background:#eee;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
                        ${imgHTML}
                    </div>
                    <div style="flex:1;">
                        <div style="color:#777;margin-bottom:6px;font-size:14px;">Total Stock: <strong style="color:#111;">${stock.available}</strong></div>
                        <div style="color:#777;font-size:14px;">Default: <strong style="color:#555;">${stock.available}</strong></div>
                    </div>
                </div>
            </div>
        </div>`;
    });

    listEl.innerHTML = html;
    document.getElementById('overallStockTotal').textContent = overallStockTotal;
}

// ── Live Stock Button Actions ──
function showLiveStockFilter() {
    // Optionally implement a real modal filter for tags or categories.
    showToast('Advanced filter options coming soon!');
}

function openLiveStockSearch(isOpen) {
    const container = document.getElementById('liveStockSearchContainer');
    const icon = document.getElementById('liveStockSearchIcon');
    const inputEl = document.getElementById('liveStockSearchInput');

    if (isOpen) {
        container.style.display = 'flex';
        icon.style.display = 'none';
        inputEl.focus();
    } else {
        container.style.display = 'none';
        icon.style.display = 'block';
        inputEl.value = '';
        renderLiveStock();
    }
}

function toggleSetWise() {
    isLiveStockSetWise = !isLiveStockSetWise;
    const btn = event.currentTarget || document.querySelector('[onclick="toggleSetWise()"]');
    if (btn) btn.style.color = isLiveStockSetWise ? '#e65100' : '#888';
    renderLiveStock();
    showToast(isLiveStockSetWise ? 'Showing Set-Wise Designs' : 'Showing All Designs');
}

function openCalculator() {
    document.getElementById('calculatorModal').style.display = 'flex';
}

function exportLiveStockExcel() {
    let allDesigns = designs.filter(d => !d.deleted).sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true, sensitivity: 'base' }));
    const startDate = document.getElementById('liveStockExportStart').value;
    const endDate = document.getElementById('liveStockExportEnd').value;

    let csvContent = "Design Name,Rate,Opening Stock,In (Packed),Out (Sold),Returned,Current Stock,Current Value\n";

    allDesigns.forEach(d => {
        // If dates are provided, we calculate movement
        let stock = { available: 0, packed: 0, sold: 0, returned: 0, opening: 0 };

        if (startDate && endDate) {
            const start = parseFilterDate(startDate);
            const end = parseFilterDate(endDate, true);

            // This is a simplified movement calculation
            const allPacks = JSON.parse(localStorage.getItem('vastra_packs') || '[]');
            const allChallans = JSON.parse(localStorage.getItem('vastra_challans') || '[]');
            const allReturns = JSON.parse(localStorage.getItem('vastra_salesReturns') || '[]');

            // Current Stock (Today)
            const currentStock = getDesignStock(d.name).available;

            // Transactions In Range
            let rangePacked = 0;
            allPacks.forEach(p => {
                const dt = parseDateDDMMYYYY(p.dateTime || p.createdAt);
                if (dt >= start && dt <= end) {
                    (p.items || []).forEach(itm => { if (itm.designName === d.name || itm.name === d.name) rangePacked += (parseFloat(itm.qty) || 0); });
                }
            });
            let rangeSold = 0;
            allChallans.forEach(c => {
                const dt = parseDateDDMMYYYY(c.date || c.createdAt);
                if (dt >= start && dt <= end) {
                    (c.items || []).forEach(itm => { if (itm.designName === d.name) rangeSold += (parseFloat(itm.qty) || 0); });
                }
            });
            let rangeReturned = 0;
            allReturns.forEach(sr => {
                const dt = parseDateDDMMYYYY(sr.returnDate || sr.createdAt);
                if (dt >= start && dt <= end) {
                    (sr.items || []).forEach(itm => { if (itm.designName === d.name) rangeReturned += (parseFloat(itm.qty) || 0); });
                }
            });

            // If no activity and no stock, maybe skip? But let's show all for now.
            if (isLiveStockSetWise && !d.setWise) return;

            const name = d.name.replace(/"/g, '""');
            const price = (d.price || '0').toString().replace(/"/g, '""');
            const currentValue = (parseFloat(currentStock) * parseFloat(d.price || 0)).toFixed(2);
            csvContent += `"${name}", "${price}", "-", "${rangePacked}", "${rangeSold}", "${rangeReturned}", "${currentStock}", "${currentValue}"\n`;
        } else {
            // No date range, just show current totals
            if (isLiveStockSetWise && !d.setWise) return;
            const s = getDesignStock(d.name);
            const name = d.name.replace(/"/g, '""');
            const price = (d.price || '0').toString().replace(/"/g, '""');
            const currentValue = (parseFloat(s.available) * parseFloat(d.price || 0)).toFixed(2);
            csvContent += `"${name}", "${price}", "-", "-", "-", "-", "${s.available}", "${currentValue}"\n`;
        }
    });

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Live_Stock_Report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

// Helper to format date specifically for Excel to prevent #######
function formatExcelDate(dateObj) {
    if (!dateObj) return '';
    try {
        const d = parseDateDDMMYYYY(dateObj);
        if (isNaN(d.getTime())) return '';
        const day = String(d.getDate()).padStart(2, '0');
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        // Leading space forces Excel to treat it as text
        return ` ${day} -${month} -${year} `;
    } catch (e) { return ''; }
}

function toggleFilter(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = (el.style.display === 'none') ? 'block' : 'none';

    // Set default dates if empty
    const startId = id.replace('Bar', 'Start');
    const endId = id.replace('Bar', 'End');
    const startInput = document.getElementById(startId);
    const endInput = document.getElementById(endId);
    if (startInput && !startInput.value) {
        const d = new Date();
        d.setDate(d.getDate() - 30); // Default to last 30 days
        startInput.value = d.toISOString().split('T')[0];
    }
    if (endInput && !endInput.value) {
        endInput.value = new Date().toISOString().split('T')[0];
    }
}

// Helper to parse YYYY-MM-DD from input as local date
function parseFilterDate(str, isEnd = false) {
    if (!str) return null;
    const parts = str.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (isEnd) d.setHours(23, 59, 59, 999);
    else d.setHours(0, 0, 0, 0);
    return d;
}

function exportChallansExcel() {
    let list = JSON.parse(localStorage.getItem('vastra_challans') || '[]');
    const startDate = document.getElementById('challanExportStart').value;
    const endDate = document.getElementById('challanExportEnd').value;

    if (startDate && endDate) {
        const start = parseFilterDate(startDate);
        const end = parseFilterDate(endDate, true);
        list = list.filter(c => {
            const d = parseDateDDMMYYYY(c.date || c.createdAt);
            d.setHours(0, 0, 0, 0); // Normalize to date only for comparison
            return d >= start && d <= end;
        });
    }

    if (list.length === 0) {
        showToast('No data found for the selected range!');
        return;
    }

    // Updated headers: Date, Customer Name, Order, Design No, Qty, Amount, Created By
    let csvContent = "Date,Customer Name,Order,Design No,Qty,Amount,Created By\n";

    list.forEach(c => {
        const date = formatExcelDate(c.date || c.createdAt);
        const customer = (c.customerName || '').replace(/"/g, '""');
        const order = (c.number || '').toString().replace(/"/g, '""');

        if (c.items && c.items.length > 0) {
            c.items.forEach(item => {
                const designNo = (item.designName || '').replace(/"/g, '""');
                const qty = item.qty || 0;
                const rate = item.rate || 0;
                const amount = (parseFloat(qty) * parseFloat(rate)).toFixed(2);
                const createdBy = (c.createdBy || 'Admin').toUpperCase().replace(/"/g, '""');
                csvContent += `"${date}", "${customer}", "${order}", "${designNo}", "${qty}", "${amount}", "${createdBy}"\n`;
            });
        } else {
            // For challans without items (if any), add a row anyway or skip. 
            const createdBy = (c.createdBy || 'Admin').toUpperCase().replace(/"/g, '""');
            csvContent += `"${date}", "${customer}", "${order}", "", "0", "0.00", "${createdBy}"\n`;
        }
    });

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Delivery_Challan_Report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function exportPackDesignsExcel() {
    let list = JSON.parse(localStorage.getItem('vastra_packs') || '[]');
    const startDate = document.getElementById('packExportStart').value;
    const endDate = document.getElementById('packExportEnd').value;

    if (startDate && endDate) {
        const start = parseFilterDate(startDate);
        const end = parseFilterDate(endDate, true);
        list = list.filter(p => {
            const d = parseDateDDMMYYYY(p.dateTime || p.createdAt);
            d.setHours(0, 0, 0, 0); // Normalize to date only
            return d >= start && d <= end;
        });
    }

    if (list.length === 0) {
        showToast('No data found for the selected range!');
        return;
    }

    let csvContent = "Date,Customer,Design No,Size,Qty,Rate,Amount,Created By\n";

    list.forEach(p => {
        const date = formatExcelDate(p.dateTime || p.createdAt);
        const customer = (p.customerName || '').replace(/"/g, '""');

        if (p.items && p.items.length > 0) {
            p.items.forEach(item => {
                const designName = (item.designName || item.name || '').replace(/"/g, '""');
                const qty = item.qty || 0;
                const rate = item.rate || 0;
                const amount = (parseFloat(qty) * parseFloat(rate)).toFixed(2);
                const createdBy = (p.createdBy || 'Admin').toUpperCase().replace(/"/g, '""');
                csvContent += `"${date}", "${customer}", "${designName}", "${item.size || '-'}", "${qty}", "${rate}", "${amount}", "${createdBy}"\n`;
            });
        }
    });

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Pack_Design_Report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function exportSalesReturnsExcel() {
    let list = JSON.parse(localStorage.getItem('vastra_salesReturns') || '[]');
    const startDate = document.getElementById('srExportStart').value;
    const endDate = document.getElementById('srExportEnd').value;

    if (startDate && endDate) {
        const start = parseFilterDate(startDate);
        const end = parseFilterDate(endDate, true);
        list = list.filter(sr => {
            const d = parseDateDDMMYYYY(sr.returnDate || sr.createdAt);
            d.setHours(0, 0, 0, 0); // Normalize to date only
            return d >= start && d <= end;
        });
    }

    if (list.length === 0) {
        showToast('No data found for the selected range!');
        return;
    }

    let csvContent = "Date,SR No,Customer,Design No,Size,Qty,Rate,Amount,Created By\n";

    list.forEach(sr => {
        const date = formatExcelDate(sr.returnDate || sr.createdAt);
        const customer = (sr.customerName || '').replace(/"/g, '""');
        const srNo = (sr.number || '').toString().replace(/"/g, '""');

        if (sr.items && sr.items.length > 0) {
            sr.items.forEach(item => {
                const designName = (item.designName || item.name || '').replace(/"/g, '""');
                const qty = item.qty || 0;
                const rate = item.rate || 0;
                const amount = (parseFloat(qty) * parseFloat(rate)).toFixed(2);
                const createdBy = (sr.createdBy || 'Admin').toUpperCase().replace(/"/g, '""');
                csvContent += `"${date}", "${srNo}", "${customer}", "${designName}", "${item.size || '-'}", "${qty}", "${rate}", "${amount}", "${createdBy}"\n`;
            });
        }
    });

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Sales_Return_Report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

// ── Calculator Logic ──
function calcAppend(val) {
    const display = document.getElementById('calcDisplay');
    if (display.value === '0' && val !== '.') {
        display.value = val;
    } else {
        display.value += val;
    }
}

function calcClear() {
    document.getElementById('calcDisplay').value = '0';
}

function calcEval() {
    const display = document.getElementById('calcDisplay');
    try {
        // Safe evaluation
        display.value = new Function('return ' + display.value)();
    } catch (e) {
        display.value = 'Error';
        setTimeout(calcClear, 1500);
    }
}

// ══════════════════ LIVE STOCK DETAIL VIEW ════════════════════
let currentLSDesign = null;

function openLiveStockDetail(designName) {
    currentLSDesign = designName;
    const stock = getDesignStock(designName);
    document.getElementById('lsDetailTitle').textContent = designName;
    document.getElementById('lsDetailTotalStock').textContent = stock.available;

    showSection('liveStockDetailSection', document.querySelector('.sidebar-item.active'));

    // Default Tab
    const defaultTab = document.querySelector('.ls-tab');
    if (defaultTab) changeLSTab('LEDGER', defaultTab);
}

function closeLiveStockDetail() {
    currentLSDesign = null;
    showSection('liveStockSection', document.querySelector('.sidebar-item.active'));
}

function changeLSTab(tabName, el) {
    document.querySelectorAll('.ls-tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');

    const contentArea = document.getElementById('lsDetailContent');
    if (!currentLSDesign) return;

    // Gather records
    const packs = JSON.parse(localStorage.getItem('vastra_packs') || '[]');
    const challans = JSON.parse(localStorage.getItem('vastra_challans') || '[]');
    const returns = JSON.parse(localStorage.getItem('vastra_salesReturns') || '[]');

    let records = [];

    // Packaged (+ stock)
    packs.forEach(p => {
        if (!p.items) return;
        p.items.forEach(itm => {
            // Robust match like getDesignStock
            const isMatch = itm.name === currentLSDesign || itm.designId == (designs.find(d => d.name === currentLSDesign)?.id);
            if (isMatch && itm.qty > 0) {
                const d = parseDateDDMMYYYY(p.createdAt || p.dateTime);
                records.push({
                    type: 'PACKAGED',
                    dateStr: formatDateDDMMYYYY(d),
                    rawDate: d,
                    title: p.customerName || p.note || `Pack #${String(p.id).slice(-4)} `,
                    subtitle: p.customerName ? (p.note || '-') : '-',
                    qty: parseInt(itm.qty),
                    size: itm.size || '-',
                    sign: '+',
                    id: p.id,
                    deleted: p.deleted, // Added
                    createdBy: p.createdBy || p.enteredBy || '-'
                });
            }
        });
    });

    // Delivered (- stock)
    challans.forEach(c => {
        // Include deleted ones for ledger visibility but clearly mark them
        if (!c.items) return;
        c.items.forEach(itm => {
            const isMatch = itm.designName === currentLSDesign || itm.designId == (designs.find(d => d.name === currentLSDesign)?.id);
            if (isMatch && itm.qty > 0) {
                const d = parseDateDDMMYYYY(c.createdAt || c.date);
                records.push({
                    type: 'DELIVERED',
                    dateStr: formatDateDDMMYYYY(d),
                    rawDate: d,
                    title: c.number,
                    subtitle: c.customerName || '-',
                    qty: parseInt(itm.qty),
                    size: itm.size || '-',
                    sign: '-',
                    id: c.id,
                    deleted: c.deleted, // Added flag
                    createdBy: (c.createdBy || '-').toUpperCase()
                });
            }
        });
    });

    // Sales Returned (+ stock)
    returns.forEach(sr => {
        if (!sr.items) return;
        sr.items.forEach(itm => {
            const isMatch = itm.designName === currentLSDesign || itm.designId == (designs.find(d => d.name === currentLSDesign)?.id);
            if (isMatch && itm.qty > 0) {
                const d = parseDateDDMMYYYY(sr.createdAt || sr.returnDate);
                records.push({
                    type: 'SALES RETURNED',
                    dateStr: formatDateDDMMYYYY(d),
                    rawDate: d,
                    title: 'Ret: ' + (sr.challanNum || sr.number || 'Return'),
                    subtitle: sr.customerName || '-',
                    qty: parseInt(itm.qty),
                    size: itm.size || '-',
                    sign: '+',
                    id: sr.id,
                    deleted: sr.deleted, // Added
                    createdBy: (sr.createdBy || '-').toUpperCase()
                });
            }
        });
    });

    // Filter by Tab
    if (tabName !== 'LEDGER') {
        records = records.filter(r => r.type === tabName);
    }

    // Sort chronologically (oldest first for balance calculation)
    records.sort((a, b) => {
        if (a.rawDate - b.rawDate !== 0) return a.rawDate - b.rawDate;
        return (a.id || 0) - (b.id || 0);
    });

    let runningTotal = 0;
    records.forEach(r => {
        if (!r.deleted) {
            if (r.sign === '+') runningTotal += r.qty;
            else runningTotal -= r.qty;
        }
        r.balance = runningTotal;
    });

    // Re-sort newest first for display
    records.sort((a, b) => {
        if (b.rawDate - a.rawDate !== 0) return b.rawDate - a.rawDate;
        return (b.id || 0) - (a.id || 0);
    });

    if (records.length === 0) {
        contentArea.innerHTML = `
        <div style="text-align:center;padding:40px 20px;">
            <div style="width:100px;height:100px;background:#e1f0f8;border-radius:50%;margin:0 auto 20px auto;display:flex;align-items:center;justify-content:center;">
                <i class="fa fa-clipboard-list" style="font-size:40px;color:#a0d4ef;"></i>
            </div>
            <div style="font-size:16px;color:#555;">No ${tabName.toLowerCase()} found!</div>
        </div>`;
        return;
    }

    let html = '';

    // --- Header Summary (Dynamic based on tab) ---
    let headerTitle = 'Total Available Stock';
    let sizeWiseSummary = {};
    let totalHeaderQty = 0;

    if (tabName === 'LEDGER') {
        headerTitle = 'Total Available Stock';
        totalHeaderQty = getDesignStock(currentLSDesign).available;
        sizeWiseSummary = getDesignSizeWiseStock(currentLSDesign);
    } else {
        headerTitle = `Total ${tabName.charAt(0) + tabName.slice(1).toLowerCase()} Qty`;
        // Since 'records' is already filtered by tabName if not LEDGER, we sum them
        records.forEach(r => {
            totalHeaderQty += r.qty;
            const s = r.size || 'No-Size';
            sizeWiseSummary[s] = (sizeWiseSummary[s] || 0) + r.qty;
        });
    }

    const sizeStr = Object.entries(sizeWiseSummary)
        .filter(([s, q]) => q !== 0)
        .map(([s, q]) => `<span style="margin-left:12px; font-weight:normal; font-size:12px; border-left: 1px solid rgba(255,255,255,0.3); padding-left: 12px;">${s.toUpperCase()}: <b>${q}</b></span>`)
        .join('');

    html += `
        <div style="display:flex;background:#fff;margin-bottom:12px;box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
        <div style="flex:1;background:#1e4368;color:#fff;padding:12px 16px;font-size:14px;display:flex;align-items:center;flex-wrap:wrap;">
            <span style="font-weight:bold;opacity:0.9;">${headerTitle} :</span>
            ${sizeStr}
        </div>
        <div style="width:100px;background:#0088cc;color:#fff;padding:12px 16px;font-weight:bold;font-size:18px;display:flex;align-items:center;justify-content:flex-end;border-left:2px solid rgba(255,255,255,0.1);">
            ${totalHeaderQty}
        </div>
    </div>`;

    // Grouping by Month/Year
    const grouped = {};
    records.forEach(r => {
        const d = r.rawDate;
        const monthYear = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        const monthShort = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        const day = String(d.getDate()).padStart(2, '0');

        if (!grouped[monthYear]) grouped[monthYear] = [];
        r.displayMonth = monthShort;
        r.displayDay = day;
        grouped[monthYear].push(r);
    });

    for (const [monthYear, events] of Object.entries(grouped)) {
        html += `<div style="padding:10px 16px;font-size:15px;color:#005082;background:#eef5f9;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-weight:bold;">${monthYear}</div>`;

        events.forEach(ev => {
            const isCancelled = ev.deleted === true;
            const qtyColor = isCancelled ? '#9e9e9e' : (ev.sign === '+' ? '#2e7d32' : '#e53935');
            const displayQty = isCancelled ? `<span style="text-decoration:line-through">${ev.sign} ${ev.qty}</span>` : `${ev.sign} ${ev.qty}`;
            const statusText = isCancelled ? '<span style="background:#ffebee;color:#c62828;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;display:inline-flex;align-items:center;gap:3px;"><i class="fa fa-times-circle"></i> CANCELLED / DELETED</span>' : (ev.sign === '+' ? '<i class="fa fa-plus-circle"></i> ADDED' : '<i class="fa fa-minus-circle"></i> MINUS');

            const clickAction = isCancelled ? '' : (ev.type === 'PACKAGED' ? `editPack(${ev.id})` : ev.type === 'DELIVERED' ? `openChallanDetail(${ev.id})` : `openSRDetail(${ev.id})`);

            html += `
            <div onclick="${clickAction}" style="background:#fff;padding:16px;border-bottom:1px solid #eee;display:flex;align-items:flex-start;gap:16px;cursor:${isCancelled ? 'default' : 'pointer'};opacity:${isCancelled ? '0.6' : '1'}">
                <div style="width:55px;height:55px;background:${isCancelled ? '#f5f5f5' : '#e8f4f8'};border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;">
                    <div style="font-size:11px;color:#333;font-weight:bold;line-height:1;">${ev.displayMonth}</div>
                    <div style="font-size:20px;color:#111;font-weight:bold;line-height:1;margin-top:2px;">${ev.displayDay}</div>
                </div>
                
                <div style="flex:1;">
                    <div style="font-size:15px;color:#111;font-weight:600;margin-bottom:2px;">
                        ${ev.title || '-'} ${ev.subtitle && ev.subtitle !== '-' ? ` - <span style="color:var(--blue)">${ev.subtitle}</span>` : ''}
                    </div>
                    <div style="margin-bottom:10px; display:flex; gap:8px; align-items:center;">
                        <span style="background:#e1f0f8; color:#0077c2; border-radius:4px; padding:3px 8px; font-size:11px; font-weight:bold; display:inline-flex; align-items:center; gap:5px; border:1px solid #b3d7ef;">
                            <i class="fa fa-user" style="font-size:10px;"></i> ${(ev.createdBy || 'Admin').toUpperCase()}
                        </span>
                        ${ev.subtitle && ev.subtitle !== '-' ? `
                        <span style="background:#fff3e0; color:#e65100; border-radius:4px; padding:3px 8px; font-size:11px; font-weight:bold; display:inline-flex; align-items:center; gap:5px; border:1px solid #ffe0b2;">
                            <i class="fa fa-building" style="font-size:10px;"></i> ${ev.subtitle.toUpperCase()}
                        </span>` : ''}
                    </div>
                    <div style="font-size:13px;color:#888;display:flex;gap:12px;flex-wrap:wrap;">
                        <span>Design: <b>${currentLSDesign || '-'}</b></span>
                        <span style="background:#f0f0f0; padding:1px 6px; border-radius:4px; color:#333;">Size: <b>${(ev.size || '-').toUpperCase()}</b></span>
                    </div>
                    <div style="font-size:13px;color:#888;margin-top:4px;">
                        ${ev.type === 'PACKAGED' ? 'Packed' : ev.type === 'DELIVERED' ? 'Delivery' : 'Returned'} Qty: <b>${ev.qty}</b> 
                        <span style="color:${qtyColor}; font-weight:bold; margin-left:10px;">
                           ${statusText}
                        </span>
                    </div>
                </div>

                <div style="align-self:center;">
                    ${isCancelled ? '' : '<button style="background:#e1f0f8; color:#0077c2; border:none; padding:6px 10px; border-radius:4px; font-size:11px; font-weight:bold; cursor:pointer;">VIEW</button>'}
                </div>
                
                <div style="text-align:right; min-width:80px;">
                    <div style="font-size:16px;font-weight:bold;color:${qtyColor};margin-bottom:4px;">${displayQty}</div>
                    <div style="font-size:12px;color:#666;background:#f5f5f5;padding:2px 4px;border-radius:4px;">Balance: <b>${ev.balance}</b></div>
                </div>
            </div>`;
        });
    }

    contentArea.innerHTML = html;
}

// ── TOTAL SELL REPORT ──────────────────────────────
function generateTotalSellReport() {
    const startStr = document.getElementById('sellReportStartDate').value;
    const endStr = document.getElementById('sellReportEndDate').value;

    if (!startStr || !endStr) {
        showToast('Please select both start and end dates!');
        return;
    }

    const startDate = new Date(startStr);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(endStr);
    endDate.setHours(0, 0, 0, 0);

    const challanData = JSON.parse(localStorage.getItem('vastra_challans') || '[]');
    const reportData = {}; // keyed by "DesignName|Size"

    challanData.forEach(c => {
        const cDateObj = parseDateDDMMYYYY(c.date || c.createdAt);
        cDateObj.setHours(0, 0, 0, 0);

        if (c.items && cDateObj >= startDate && cDateObj <= endDate) {
            c.items.forEach(itm => {
                const name = itm.designName || itm.name || 'Unknown';
                const size = itm.size || '-';
                const key = `${name}|${size}`;

                if (!reportData[key]) {
                    reportData[key] = { name, size, qty: 0 };
                }
                reportData[key].qty += parseFloat(itm.qty) || 0;
            });
        }
    });

    renderTotalSellReport(reportData);
}

function renderTotalSellReport(data) {
    const resultsArea = document.getElementById('sellReportResults');
    const sortedKeys = Object.keys(data).sort((a, b) => {
        // Sort by name first (numerically), then by size
        if (data[a].name !== data[b].name) {
            return String(data[a].name || '').localeCompare(String(data[b].name || ''), undefined, { numeric: true, sensitivity: 'base' });
        }
        return String(data[a].size || '').localeCompare(String(data[b].size || ''), undefined, { numeric: true, sensitivity: 'base' });
    });

    if (sortedKeys.length === 0) {
        resultsArea.innerHTML = `
            <div style="text-align:center;color:#888;margin-top:50px;background:#fff;padding:40px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                <i class="fa fa-info-circle fa-2x" style="margin-bottom:15px;color:#ddd;"></i>
                <p>No sales found for the selected date range.</p>
            </div>`;
        return;
    }

    let totalQty = 0;

    let html = `
        <div style="background:#fff;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.1);overflow:hidden;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <thead style="background:#0088cc;color:#fff;">
                    <tr>
                        <th style="padding:15px 12px;text-align:left;">Design Name</th>
                        <th style="padding:15px 12px;text-align:center;">Size</th>
                        <th style="padding:15px 12px;text-align:center;">Total Qty</th>
                    </tr>
                </thead>
                <tbody>
                    `;

    sortedKeys.forEach(key => {
        const itm = data[key];
        totalQty += itm.qty;
        html += `
                    <tr style="border-bottom:1px solid #eee;">
                        <td style="padding:12px;"><strong>${itm.name}</strong></td>
                        <td style="padding:12px;text-align:center;">${itm.size}</td>
                        <td style="padding:12px;text-align:center;font-weight:600;color:#0088cc;">${itm.qty}</td>
                    </tr>
                    `;
    });

    html += `
                </tbody>
                <tfoot style="background:#f1f3f5;font-weight:bold;border-top:2px solid #ddd;">
                    <tr>
                        <td style="padding:15px 12px;" colspan="2">GRAND TOTAL</td>
                        <td style="padding:15px 12px;text-align:center;font-size:16px;">${totalQty}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
        <div style="margin-top:20px;text-align:right;padding-bottom:20px;">
            <button onclick="window.print()" style="background:#2e7d32;color:#fff;border:none;padding:12px 24px;border-radius:4px;cursor:pointer;font-weight:bold;box-shadow:0 2px 4px rgba(0,0,0,0.2);">
                <i class="fa fa-print"></i> PRINT REPORT
            </button>
        </div>
    `;

    resultsArea.innerHTML = html;
}

// ── LOW STOCK ALERT ──────────────────────────────
function renderLowStockAlert() {
    console.log("Rendering Low Stock Alert...");
    const resultsArea = document.getElementById('lowStockResults');
    if (!resultsArea) return;

    resultsArea.innerHTML = '<div style="text-align:center;padding:50px;color:#888;"><i class="fa fa-spinner fa-spin fa-2x"></i><br/><br/>Analyzing 15-day sales patterns...</div>';

    setTimeout(() => {
        const challans = JSON.parse(localStorage.getItem('vastra_challans') || '[]');

        console.log("Total Challans:", challans.length);
        console.log("Total Designs:", designs.length);

        // Calculate date 15 days ago
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        fifteenDaysAgo.setHours(0, 0, 0, 0);

        const salesStats = {}; // designName -> last15DaySales

        challans.forEach(c => {
            let cDate = parseDateDDMMYYYY(c.date || c.createdAt);
            cDate.setHours(0, 0, 0, 0);

            if (cDate >= fifteenDaysAgo && c.items) {
                c.items.forEach(itm => {
                    const name = itm.designName || itm.name;
                    if (name) {
                        if (!salesStats[name]) salesStats[name] = 0;
                        salesStats[name] += (parseFloat(itm.qty) || 0);
                    }
                });
            }
        });

        console.log("Sales Stats (15 days):", salesStats);

        const lowStockList = [];

        designs.filter(d => !d.deleted).forEach(d => {
            const last15DaySales = salesStats[d.name] || 0;
            const predictedNext15Days = Math.ceil(last15DaySales);
            const stockObj = getDesignStock(d.name);
            const currentStock = stockObj.available;

            console.log(`Checking ${d.name}: Stock = ${currentStock}, Predicted Demand = ${predictedNext15Days} `);

            // If current stock is less than predicted demand for next 15 days
            // OR if it's the test item, force it for visibility
            if (currentStock < predictedNext15Days || d.name === "TEST-LOW-STOCK-ITEM") {
                lowStockList.push({
                    name: d.name,
                    size: (d.size && d.size !== '–') ? d.size : '',
                    currentStock,
                    predictedDemand: predictedNext15Days,
                    requirement: Math.max(0, predictedNext15Days - currentStock),
                    avgDaily: (last15DaySales / 15).toFixed(2),
                    imgSrc: d.imgSrc || ''
                });
            }
        });

        console.log("Low Stock Items found:", lowStockList.length);

        if (lowStockList.length === 0) {
            resultsArea.innerHTML = `
                <div style="text-align:center;color:#2e7d32;margin-top:50px;background:#e8f5e9;padding:40px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                    <i class="fa fa-check-circle fa-3x" style="margin-bottom:15px;"></i>
                    <p style="font-size:18px;font-weight:bold;">Stock is Healthy!</p>
                    <p>All designs have enough stock to meet the predicted demand for the next 15 days.</p>
                </div>`;
            return;
        }

        // Sort by highest requirement
        lowStockList.sort((a, b) => b.requirement - a.requirement);

        let html = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:20px;">
            `;

        lowStockList.forEach(item => {
            html += `
            <div style="background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.08);overflow:hidden;border-left:6px solid #e53935;transition:transform 0.2s;cursor:default;">
                    <div style="padding:16px;display:flex;gap:15px;align-items:center;">
                        <div style="width:80px;height:80px;background:#f0f0f0;border-radius:8px;overflow:hidden;flex-shrink:0;box-shadow:inset 0 0 5px rgba(0,0,0,0.1);">
                            ${item.imgSrc ? `<img src="${item.imgSrc}" style="width:100%;height:100%;object-fit:cover" />` : '<div style="display:flex;justify-content:center;align-items:center;height:100%;color:#ccc;font-size:24px;"><i class="fa fa-tshirt"></i></div>'}
                        </div>
                        <div style="flex:1;">
                            <h4 style="margin:0 0 4px 0;color:#1a1a1a;font-size:17px;font-weight:700;">${item.name}</h4>
                            ${item.size ? `<div style="font-size:13px;color:#666;margin-bottom:4px;">Size: <strong style="color:#333;">${item.size}</strong></div>` : ''}
                            <div style="display:inline-block;background:#fef2f2;color:#ef4444;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:bold;margin-bottom:8px;">LOW STOCK</div>
                            <div style="font-size:13px;color:#666;">Sales Velocity: <strong style="color:#333;">${item.avgDaily} pcs/day</strong></div>
                        </div>
                    </div>
                    <div style="background:#fffafb;padding:15px;display:flex;justify-content:space-between;border-top:1px solid #fee2e2;text-align:center;">
                        <div>
                            <div style="font-size:10px;color:#999;text-transform:uppercase;font-weight:bold;letter-spacing:0.5px;margin-bottom:4px;">In Stock</div>
                            <div style="font-size:20px;font-weight:800;color:#333;">${item.currentStock}</div>
                        </div>
                        <div style="border-left:1px solid #fee2e2;padding-left:15px;padding-right:15px;">
                            <div style="font-size:10px;color:#999;text-transform:uppercase;font-weight:bold;letter-spacing:0.5px;margin-bottom:4px;">15-Day Need</div>
                            <div style="font-size:20px;font-weight:800;color:#333;">${item.predictedDemand}</div>
                        </div>
                        <div style="background:#e53935;color:#fff;padding:5px 12px;border-radius:8px;min-width:70px;display:flex;flex-direction:column;justify-content:center;">
                            <div style="font-size:9px;text-transform:uppercase;font-weight:700;letter-spacing:0.5px;opacity:0.9;">Order</div>
                            <div style="font-size:20px;font-weight:800;">+${item.requirement}</div>
                        </div>
                    </div>
                </div>
        `;
        });

        html += `</div>`;
        resultsArea.innerHTML = html;
        if (lowStockList.length > 0) showToast(`Found ${lowStockList.length} designs with low stock.`);
    }, 500);
}


function exportTotalSellReportExcel() {
    const startStr = document.getElementById('sellReportStartDate').value;
    const endStr = document.getElementById('sellReportEndDate').value;

    if (!startStr || !endStr) {
        showToast('Please select both start and end dates!');
        return;
    }

    const startDate = new Date(startStr);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(endStr);
    endDate.setHours(23, 59, 59, 999);

    const challanData = JSON.parse(localStorage.getItem('vastra_challans') || '[]');
    const reportData = {};

    challanData.forEach(c => {
        const cDateObj = parseDateDDMMYYYY(c.date || c.createdAt);
        if (c.items && cDateObj >= startDate && cDateObj <= endDate) {
            c.items.forEach(itm => {
                const name = itm.designName || itm.name || 'Unknown';
                const size = itm.size || '-';
                const key = `${name}|${size}`;
                if (!reportData[key]) reportData[key] = { name, size, qty: 0, rate: itm.rate || 0, creators: new Set() };
                reportData[key].qty += parseFloat(itm.qty) || 0;
                if (c.createdBy) reportData[key].creators.add(c.createdBy.toUpperCase());
                else reportData[key].creators.add('ADMIN');
            });
        }
    });

    const entries = Object.values(reportData).sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true, sensitivity: 'base' }));
    if (entries.length === 0) {
        showToast('No data found for the selected range!');
        return;
    }

    let csvContent = "Design Name,Size,Total Sold Qty,Rate,Total Amount,Created By (List)\n";
    entries.forEach(itm => {
        const totalAmount = (parseFloat(itm.qty) * parseFloat(itm.rate)).toFixed(2);
        const creators = itm.creators ? Array.from(itm.creators).join('; ') : 'Admin';
        csvContent += `"${itm.name.replace(/"/g, '""')}","${itm.size}","${itm.qty}","${itm.rate}","${totalAmount}","${creators}"\n`;
    });

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Total_Sell_Report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function exportDesignLedgerExcel() {
    if (!currentLSDesign) return;
    const startStr = document.getElementById('lsDetailExportStart').value;
    const endStr = document.getElementById('lsDetailExportEnd').value;

    // Get all events for the current design
    const packs = JSON.parse(localStorage.getItem('vastra_packs') || '[]');
    const challans = JSON.parse(localStorage.getItem('vastra_challans') || '[]');
    const returns = JSON.parse(localStorage.getItem('vastra_salesReturns') || '[]');

    let events = [];
    packs.forEach(p => {
        const d = parseDateDDMMYYYY(p.dateTime || p.createdAt);
        (p.items || []).forEach(itm => {
            if (itm.name === currentLSDesign || itm.designName === currentLSDesign) {
                events.push({ date: d, type: 'PACKED', title: p.customerName || 'Self', qty: itm.qty, sign: '+', size: itm.size || '-', rate: itm.rate || 0, createdBy: p.createdBy || 'Admin' });
            }
        });
    });
    challans.forEach(c => {
        const d = parseDateDDMMYYYY(c.date || c.createdAt);
        (c.items || []).forEach(itm => {
            if (itm.designName === currentLSDesign) {
                events.push({ date: d, type: 'SOLD', title: c.customerName || '-', qty: itm.qty, sign: '-', size: itm.size || '-', rate: itm.rate || 0, createdBy: c.createdBy || 'Admin' });
            }
        });
    });
    returns.forEach(r => {
        const d = parseDateDDMMYYYY(r.returnDate || r.createdAt);
        (r.items || []).forEach(itm => {
            if (itm.designName === currentLSDesign) {
                events.push({ date: d, type: 'RETURNED', title: r.customerName || '-', qty: itm.qty, sign: '+', size: itm.size || '-', rate: itm.rate || 0, createdBy: r.createdBy || 'Admin' });
            }
        });
    });

    if (startStr && endStr) {
        const start = parseFilterDate(startStr);
        const end = parseFilterDate(endStr, true);
        events = events.filter(e => e.date >= start && e.date <= end);
    }

    events.sort((a, b) => b.date - a.date);

    if (events.length === 0) {
        showToast('No ledger entries found for the selected range!');
        return;
    }

    let csvContent = "Date,Type,Particulars,Size,Quantity,Rate,Amount,Created By\n";
    events.forEach(e => {
        const dStr = formatExcelDate(e.date);
        const amount = (parseFloat(e.qty) * parseFloat(e.rate)).toFixed(2);
        const createdBy = (e.createdBy || 'Admin').toUpperCase();
        csvContent += `"${dStr}","${e.type}","${(e.title || '').replace(/"/g, '""')}","${e.size}","${e.sign}${e.qty}","${e.rate}","${amount}","${createdBy}"\n`;
    });

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${currentLSDesign}_Ledger_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
// ── GLOBAL BARCODE SCANNER ────────────────────────
let _barcodeBuffer = "";
let _barcodeTimeout = null;

document.addEventListener('keydown', function (e) {
    // Ignore if target is a complex input type (unless it's a simple text input)
    // Actually, simple text might be the search box?
    // Let's capture fast keyboard events only.
    if (e.key === 'Enter') {
        if (_barcodeBuffer.length >= 2) {
            handleGlobalBarcode(_barcodeBuffer);
        }
        _barcodeBuffer = "";
        clearTimeout(_barcodeTimeout);
        return;
    }

    if (e.key && e.key.length === 1) {
        _barcodeBuffer += e.key;
        clearTimeout(_barcodeTimeout);
        _barcodeTimeout = setTimeout(() => {
            _barcodeBuffer = ""; // Reset if typing slows down (human typing is >50ms per keystroke usually)
        }, 50); // 50ms is very generous for a barcode scanner which types at 1-5ms per char
    }
});

function handleGlobalBarcode(code) {
    // Check if the scanned string exactly matches any design name
    const bCode = code.trim().toLowerCase();
    const matchedDesign = designs.find(d => String(d.name).trim().toLowerCase() === bCode);

    if (!matchedDesign) return; // If code does not match a design, silently ignore.

    const isNewChallanOpen = document.getElementById('challanModal')?.style.display === 'flex';
    const isDetailChallanOpen = document.getElementById('challanDetailModal')?.style.display === 'flex';

    // Close the design picker if it was open by chance
    const picker = document.getElementById('designPickerModal');
    if (picker) picker.style.display = 'none';

    if (isDetailChallanOpen) {
        // Add to existing detail
        _addingToDetail = true;
        openQtyDialog(matchedDesign.id);
    } else if (isNewChallanOpen) {
        // Add to new challan creation
        _addingToDetail = false;
        openQtyDialog(matchedDesign.id);
    } else {
        // Not in challan workflow currently, so start a NEW challan and then add item
        // Close all other modals first
        document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');

        // Show challans section
        const challanNav = document.querySelector('.sidebar-item[onclick*="challansSection"]');
        if (challanNav) showSection('challansSection', challanNav);

        // Open new challan form
        openCreateChallan();
        _addingToDetail = false;

        // Wait for modal to render and then open qty dialog
        setTimeout(() => openQtyDialog(matchedDesign.id), 150);
    }
}
