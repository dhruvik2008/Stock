/* ================================================
   VASTRA – JavaScript
================================================ */

// ── CREDENTIALS ──────────────────────────────────
const FIXED_EMAIL = 'maniyadhruvik07@gmail.com';
const FIXED_PASSWORD = 'maniya@#07';

// ── STATE ─────────────────────────────────────────
let designs = JSON.parse(localStorage.getItem('vastra_designs') || '[]');
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

    // Save session so refresh keeps user logged in
    localStorage.setItem('vastra_session', 'active');

    goToDashboard();
}

function goToDashboard() {
    document.getElementById('authWrapper').style.display = 'none';
    document.getElementById('dashboardWrapper').style.display = 'flex';
    document.getElementById('navUserName').textContent = 'Dhruvik Maniya';
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
    // Clear session so refresh goes back to sign-in
    localStorage.removeItem('vastra_session');

    document.getElementById('dashboardWrapper').style.display = 'none';
    document.getElementById('authWrapper').style.display = 'flex';
    document.getElementById('siEmail').value = '';
    document.getElementById('siPassword').value = '';
    showPage('signInPage');
}

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
    ['designsSection', 'challansSection', 'packSection', 'salesReturnSection', 'analysisSection', 'returnAnalysisSection', 'liveStockSection', 'liveStockDetailSection'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = (id === sectionId) ? 'block' : 'none';

        if (id === sectionId && id === 'liveStockSection') {
            renderLiveStock();
        }
    });
}

// ── MODAL: ADD NEW DESIGN ─────────────────────────
function openAddDesignModal() {
    editingDesignId = null;
    document.querySelector('.modal-title').textContent = 'Add New Design';

    // Reset all fields
    ['dName', 'dPrice', 'dDesc', 'dTags', 'dHSN', 'dGST', 'dMinStock', 'dMinOrder', 'dSample'].forEach(id => {
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
    setVal('dGST', d.gst);
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

// ── SAVE DESIGN (Add + Edit) ──────────────────────
function saveDesign() {
    const name = document.getElementById('dName').value.trim();
    if (!name) {
        alert('Design Name/Number is required!');
        document.getElementById('dName').focus();
        return;
    }

    const updatedData = {
        name,
        price: document.getElementById('dPrice').value.trim() || '–',
        desc: document.getElementById('dDesc').value.trim() || '–',
        categories: [...categories],
        tags: document.getElementById('dTags').value.trim() || '–',
        hsn: document.getElementById('dHSN').value.trim() || '–',
        gst: document.getElementById('dGST').value.trim() || '–',
        minStock: document.getElementById('dMinStock').value.trim() || '–',
        minOrder: document.getElementById('dMinOrder').value.trim() || '–',
        setWise: document.getElementById('dSetWise').checked,
        outOfStock: document.getElementById('dOutOfStock').checked,
        sample: document.getElementById('dSample').value.trim() || '–',
        imgSrc: document.querySelector('#imgPreview img')?.src || null,
    };

    if (editingDesignId !== null) {
        // ── EDIT MODE: update existing design ──
        const idx = designs.findIndex(d => d.id === editingDesignId);
        if (idx !== -1) {
            designs[idx] = { ...designs[idx], ...updatedData };
        }
        showToast('Design updated successfully! ✏️');
    } else {
        // ── ADD MODE: insert new design ──
        designs.push({
            id: Date.now(),
            createdAt: formatDateDDMMYYYY(new Date()),
            ...updatedData,
        });
        showToast('Design saved successfully! 🎉');
    }

    localStorage.setItem('vastra_designs', JSON.stringify(designs));
    closeAddDesignModal();
    renderDesignsTable();
    updateStats();
}

// ── CARD GRID RENDER ──────────────────────────
function renderDesignsTable() {
    const grid = document.getElementById('designsGrid');
    const empty = document.getElementById('designsEmpty');

    if (designs.length === 0) {
        grid.innerHTML = '';
        grid.appendChild(empty);
        empty.style.display = 'block';
        return;
    }

    // Hide the empty placeholder
    empty.style.display = 'none';

    // Rebuild cards (keep empty placeholder in DOM)
    // Remove old cards first
    grid.querySelectorAll('.design-card').forEach(c => c.remove());

    designs.forEach(d => {
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
    designs = designs.filter(d => d.id !== id);
    localStorage.setItem('vastra_designs', JSON.stringify(designs));
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
    if (el) el.textContent = designs.length;
}

// ── HELPER: get design image by ID ────────────────
function getDesignImg(designId) {
    const designs = JSON.parse(localStorage.getItem('vastra_designs') || '[]');
    const d = designs.find(x => x.id === parseInt(designId));
    return (d && d.imgSrc) ? d.imgSrc : '';
}

// ── HELPER: get stock for a design ───────────────
// Stock IN = Pack Design quantity, Stock OUT = Delivery Challan quantity
function getDesignStock(designName, size = null, color = null) {
    const packs = JSON.parse(localStorage.getItem('vastra_packs') || '[]');
    const challans = JSON.parse(localStorage.getItem('vastra_challans') || '[]');
    const returns = JSON.parse(localStorage.getItem('vastra_salesReturns') || '[]');

    // Stock IN: sum all pack quantities and returns for this design+size+color
    let stockIn = 0;
    packs.forEach(p => {
        if (p.items) {
            p.items.forEach(item => {
                const nameMatch = item.name === designName;
                const sizeMatch = !size || item.size === size;
                const colorMatch = !color || item.color === color;
                if (nameMatch && sizeMatch && colorMatch) {
                    stockIn += parseInt(item.qty || 0);
                }
            });
        }
    });

    // Add Sales Returns back to stock
    returns.forEach(sr => {
        if (sr.items) {
            sr.items.forEach(item => {
                const nameMatch = item.designName === designName;
                const sizeMatch = !size || item.size === size;
                const colorMatch = !color || item.color === color;
                if (nameMatch && sizeMatch && colorMatch) {
                    stockIn += parseInt(item.qty || 0);
                }
            });
        }
    });

    // Stock OUT: sum all challan quantities for this design+size+color
    let stockOut = 0;
    challans.forEach(c => {
        if (c.items) {
            c.items.forEach(item => {
                const nameMatch = item.designName === designName;
                const sizeMatch = !size || item.size === size;
                const colorMatch = !color || item.color === color;
                if (nameMatch && sizeMatch && colorMatch) {
                    stockOut += parseInt(item.qty || 0);
                }
            });
        }
    });

    return { stockIn, stockOut, available: stockIn - stockOut };
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
        zIndex: '9999', transition: 'opacity .4s ease',
        opacity: '1',
    });
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, 2500);
}

// ── INIT ──────────────────────────────────────────
// If user was already logged in before refresh → go straight to dashboard
if (localStorage.getItem('vastra_session') === 'active') {
    goToDashboard();
} else {
    renderDesignsTable();
    updateStats();
}


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
    ['challanDiscount', 'challanShipping', 'challanNumber', 'challanTransport', 'challanNote'].forEach(id => {
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
    const designs = JSON.parse(localStorage.getItem('vastra_designs') || '[]');
    document.getElementById('designPickerSearch').value = '';
    renderDesignPickerGrid(designs);
    document.getElementById('designPickerModal').style.display = 'flex';
}

function openPDDesignPicker(cardId) {
    designPickerContext = 'pack';
    activePackCardId = cardId;
    const designs = JSON.parse(localStorage.getItem('vastra_designs') || '[]');
    document.getElementById('designPickerSearch').value = '';
    renderDesignPickerGrid(designs);
    document.getElementById('designPickerModal').style.display = 'flex';
}

function handleDesignSelect(id) {
    if (designPickerContext === 'pack') {
        const designs = JSON.parse(localStorage.getItem('vastra_designs') || '[]');
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
    grid.innerHTML = list.map(d => `
        <div onclick="handleDesignSelect(${d.id})" style="background:#fff;border:1px solid #ddd;border-radius:2px;overflow:hidden;margin-bottom:8px;box-shadow:0 1px 2px rgba(0,0,0,0.05);cursor:pointer;display:flex;flex-direction:column;">
            <div style="width:100%;height:130px;background:#eee;border-bottom:1px solid #ddd;display:flex;align-items:center;justify-content:center">
                ${d.imgSrc ? `<img src="${d.imgSrc}" alt="" style="width:100%;height:100%;object-fit:cover"/>` : '<i class="fa fa-tshirt" style="color:#aaa;font-size:24px"></i>'}
            </div>
            <div style="padding:10px 12px;position:relative;">
                <div style="font-size:12px;color:#888;margin-bottom:4px">Rate: <strong style="color:#333">${d.price || '0'}</strong></div>
                <div style="font-size:14px;color:#111;font-weight:600;">${d.name || 'Unnamed'}</div>
                <i class="fa fa-eye" style="position:absolute;bottom:12px;right:14px;color:#555;font-size:16px;"></i>
            </div>
        </div>`).join('');
}

function filterDesignPicker(q) {
    const designs = JSON.parse(localStorage.getItem('vastra_designs') || '[]');
    renderDesignPickerGrid(q ? designs.filter(d => (d.name || '').toLowerCase().includes(q.toLowerCase())) : designs);
}

function closeDesignPicker() {
    document.getElementById('designPickerModal').style.display = 'none';
}

function openQtyDialog(designId) {
    const designs = JSON.parse(localStorage.getItem('vastra_designs') || '[]');
    _pendingDesign = designs.find(d => d.id === designId);
    if (!_pendingDesign) return;

    // Fill dialog header
    document.getElementById('qtyDialogDesignInfo').innerHTML = `
        <div class="qty-dialog-thumb">
            ${_pendingDesign.imgSrc ? `<img src="${_pendingDesign.imgSrc}" alt=""/>` : '<i class="fa fa-tshirt"></i>'}
        </div>
        <div>
            <div class="qty-dialog-dname">${_pendingDesign.name || 'Design'}</div>
            ${_pendingDesign.price && _pendingDesign.price !== '–' ? `<div class="qty-dialog-dprice">₹${_pendingDesign.price} / unit</div>` : ''}
        </div>`;
    document.getElementById('qtyInput').value = 1;
    document.getElementById('rateInput').value = _pendingDesign.price || '';
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
    const qty = parseInt(document.getElementById('qtyInput').value) || 1;
    const rate = parseFloat(document.getElementById('rateInput').value) || 0;
    const size = document.getElementById('sizeInput').value || '';
    const color = document.getElementById('colorInput').value || '';
    const total = (qty * rate).toFixed(2);

    const area = _addingToDetail
        ? document.getElementById('cdItemsArea')
        : document.getElementById('challanItemsArea');

    if (!_addingToDetail) area.querySelector('.challan-items-empty')?.remove();

    if (_addingToDetail && currentDetailChallan) {
        currentDetailChallan.items = currentDetailChallan.items || [];
        currentDetailChallan.items.push({
            designId: _pendingDesign.id, designName: _pendingDesign.name || '',
            imgSrc: '', qty, rate, size, color, total: parseFloat(total)
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
    row.innerHTML = `
        <div class="challan-item-thumb">
            ${_pendingDesign.imgSrc ? `<img src="${_pendingDesign.imgSrc}" alt=""/>` : '<i class="fa fa-tshirt"></i>'}
        </div>
        <div class="challan-item-info">
            <strong>${_pendingDesign.name || 'Design'}</strong>
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
            console.log('Row dataset:', JSON.stringify(row.dataset));
            items.push({
                designId: row.dataset.designId || '',
                designName: row.dataset.designName || '',
                qty: parseFloat(row.dataset.qty) || 0,
                rate: parseFloat(row.dataset.rate) || 0,
                total: parseFloat(row.dataset.total) || 0,
            });
        });

        console.log('Items collected:', items.length);

        if (items.length === 0) {
            showToast('❌ Please add at least one item!');
            return;
        }

        const challan = {
            id: Date.now(),
            customerId: selectedCustomerId,
            customerName: custEl.textContent.trim(),
            number: document.getElementById('challanNumber').value || auto_challan_no(),
            transport: document.getElementById('challanTransport').value,
            date: document.getElementById('challanDate').value,
            note: document.getElementById('challanNote').value,
            createdAt: formatDateDDMMYYYY(new Date()),
            createdTime: formatDateTime(new Date()),
            items,
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
    if (challans.length === 0) {
        list.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    list.innerHTML = challans.slice().reverse().map(c => {
        const firstItem = (c.items && c.items.length > 0) ? c.items[0] : null;
        const img = firstItem ? getDesignImg(firstItem.designId) : '';
        const designName = firstItem ? firstItem.designName : '-';

        return `
        <div class="challan-card" onclick="openChallanDetail(${c.id})" style="display:flex;align-items:center;padding:12px;cursor:pointer;background:#fff;border-radius:2px;box-shadow:0 1px 3px rgba(0,0,0,0.1);margin-bottom:10px;">
            <div style="width:52px;height:52px;background:#f5f5f5;border-radius:6px;display:flex;align-items:center;justify-content:center;margin-right:12px;overflow:hidden;flex-shrink:0;border:1px solid #eee;">
                ${img ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover"/>` : `<i class="fa fa-file-invoice" style="color:#ccc"></i>`}
            </div>
            <div style="flex:1;">
                <div style="font-weight:700;font-size:15px;color:#111">${c.number} - <span style="color:var(--blue)">${designName}</span></div>
                <div style="font-size:12px;color:#8A95A3;margin-top:3px">${c.customerName} • \</div>
                <div style="font-size:12px;color:var(--blue);margin-top:2px">${(c.items || []).length} item(s) • Qty: ${sumQty(c)}</div>
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
    challans = challans.filter(c => c.id !== id);
    localStorage.setItem('vastra_challans', JSON.stringify(challans));
    renderChallanList();
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
        return `<div class="customer-item" onclick="selectCustomer(${c.id})">
            <div class="customer-avatar-sm">${avatarHTML}</div>
            <div class="customer-item-info">
                <strong>${c.name}</strong>
                <span>${c.mobile || ''}</span>
            </div>
        </div>`;
    }).join('');
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
                    <div><strong style="font-size:14px">${item.designName}</strong></div>
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
    const idx = challans.findIndex(c => c.id === currentDetailChallan.id);
    if (idx !== -1) { challans[idx] = { ...currentDetailChallan }; }
    localStorage.setItem('vastra_challans', JSON.stringify(challans));
    showToast('Challan updated! ✅');
    renderChallanList();
}

function addItemToDetail() {
    _addingToDetail = true;
    const designs = JSON.parse(localStorage.getItem('vastra_designs') || '[]');
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
    invGSTRate = 0; invDiscRate = 0; invGSTMode = 'igst';
    document.getElementById('invGSTRateInput').value = 0;
    document.getElementById('invDiscInput').value = 0;
    document.getElementById('invGSTTypeDisplay').textContent = 'Registered';
    document.getElementById('invStateDisplay').textContent = 'State of Supply*';
    document.getElementById('invStateDisplay').className = 'inv-placeholder';
    document.getElementById('invCityDisplay').textContent = 'City of Supply*';
    document.getElementById('invCityDisplay').className = 'inv-placeholder';
    renderInvItems();
    calcInvTotals();
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

function renderInvItems() {
    const items = (currentInvoiceChallan?.items) || [];
    const totalQty = items.reduce((s, i) => s + (i.qty || 0), 0);
    const area = document.getElementById('invItemsArea');
    document.getElementById('invTotalItems').textContent = items.length;
    document.getElementById('invTotalQty').textContent = totalQty.toFixed(1);
    area.innerHTML = items.map(item => {
        const itemAmt = item.qty * item.rate;
        const discAmt = itemAmt * invDiscRate / 100;
        const afterDsc = itemAmt - discAmt;
        const taxAmt = afterDsc * invGSTRate / 100;
        const netAmt = afterDsc + taxAmt;
        const taxLine = invGSTMode === 'igst'
            ? `<div class="inv-calc-row"><span>IGST@${invGSTRate}%</span><span style="color:green">₹${taxAmt.toFixed(2)} (+)</span></div>`
            : `<div class="inv-calc-row"><span>CGST@${(invGSTRate / 2).toFixed(1)}%</span><span style="color:green">₹${(taxAmt / 2).toFixed(2)} (+)</span></div>
               <div class="inv-calc-row"><span>SGST@${(invGSTRate / 2).toFixed(1)}%</span><span style="color:green">₹${(taxAmt / 2).toFixed(2)} (+)</span></div>`;
        return `<div class="inv-item-card">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
                <div class="challan-item-thumb">${(item.imgSrc || getDesignImg(item.designId)) ? `<img src="${item.imgSrc || getDesignImg(item.designId)}" alt=""/>` : '<i class="fa fa-tshirt"></i>'}</div>
                <strong>${item.designName}</strong>
            </div>
            <div class="inv-item-stats">
                <div class="inv-stat"><div class="inv-stat-label">Quantity:</div><div class="inv-stat-val">${item.qty}</div></div>
                <div class="inv-stat"><div class="inv-stat-label">Price:</div><div class="inv-stat-val">${item.rate}</div></div>
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
    const itemTotal = items.reduce((s, i) => s + i.qty * i.rate, 0);
    const discAmt = itemTotal * invDiscRate / 100;
    const subTotal = itemTotal - discAmt;
    const taxAmt = subTotal * invGSTRate / 100;
    const grand = subTotal + taxAmt;
    document.getElementById('invItemTotal').textContent = `₹${itemTotal.toFixed(2)}`;
    document.getElementById('invDiscAmt').textContent = `₹${discAmt.toFixed(2)}`;
    document.getElementById('invSubTotal').textContent = `₹${subTotal.toFixed(2)}`;
    document.getElementById('invGrandTotal').textContent = `₹${grand.toFixed(2)}`;
    if (invGSTMode === 'igst') {
        document.getElementById('invTaxLabel').textContent = `IGST@${invGSTRate}%:`;
        document.getElementById('invTaxAmt').textContent = `₹${taxAmt.toFixed(2)}`;
        document.getElementById('invCGSTRow').style.display = 'none';
        document.getElementById('invIGSTRow').style.display = 'flex';
    } else {
        document.getElementById('invTaxLabel2').textContent = `CGST@${(invGSTRate / 2).toFixed(1)}%:`;
        document.getElementById('invTaxAmt2').textContent = `₹${(taxAmt / 2).toFixed(2)}`;
        document.getElementById('invTaxLabel3').textContent = `SGST@${(invGSTRate / 2).toFixed(1)}%:`;
        document.getElementById('invTaxAmt3').textContent = `₹${(taxAmt / 2).toFixed(2)}`;
        document.getElementById('invCGSTRow').style.display = 'flex';
        document.getElementById('invIGSTRow').style.display = 'none';
    }
}

function saveInvoice() {
    if (!currentInvoiceChallan) return;
    const items = currentInvoiceChallan.items || [];
    const itemTotal = items.reduce((s, i) => s + i.qty * i.rate, 0);
    const discAmt = itemTotal * invDiscRate / 100;
    const subTotal = itemTotal - discAmt;
    const taxAmt = subTotal * invGSTRate / 100;
    const grand = subTotal + taxAmt;
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
        gstRate: invGSTRate, gstMode: invGSTMode, discRate: invDiscRate,
        items, itemTotal, discAmt, subTotal, taxAmt, grand,
        createdAt: formatDateTime(new Date()),
    };
    invoices.push(invoice);
    localStorage.setItem('vastra_invoices', JSON.stringify(invoices));
    closeCreateInvoice();
    showToast(`Invoice ${invNum} saved! 🧾`);
    setTimeout(() => printInvoice(invoice), 400);
}

function printInvoice(inv) {
    const items = inv.items || [];
    const totalQty = items.reduce((s, i) => s + parseInt(i.qty), 0);
    const itemTotal = items.reduce((s, i) => s + (i.qty * parseFloat(i.rate)), 0);
    const discAmt = itemTotal * (inv.discRate / 100);
    const subTotal = itemTotal - discAmt;

    // Tax calculations
    let cgstRate = 0, sgstRate = 0, igstRate = 0;
    let cgstAmt = 0, sgstAmt = 0, igstAmt = 0;

    if (inv.gstMode === 'igst') {
        igstRate = inv.gstRate;
        igstAmt = subTotal * (igstRate / 100);
    } else {
        cgstRate = inv.gstRate / 2;
        sgstRate = inv.gstRate / 2;
        cgstAmt = subTotal * (cgstRate / 100);
        sgstAmt = subTotal * (sgstRate / 100);
    }

    const grandTotal = subTotal + cgstAmt + sgstAmt + igstAmt;

    const itemRows = items.map((item, idx) => {
        const amt = (item.qty * item.rate).toFixed(0);
        return `<tr>
            <td style="border:1px solid #ccc;padding:8px;text-align:center">${idx + 1}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:left">${item.designName}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:center">61130000</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:center">${item.color || '-'}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:center">${item.size || '-'}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:center">${item.qty}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:center">${item.rate}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:right">${Number(amt).toLocaleString('en-IN')}</td>
        </tr>`;
    }).join('');

    // Num to words dummy function (for demo, simple implementation can be added later)
    const amountInWords = `Indian Rupees ${Number(grandTotal).toLocaleString('en-IN')} Only`;

    const createdAt = inv.createdAt || formatDateTime(new Date());
    const dateOnly = inv.date || formatDateDDMMYYYY(new Date());

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
                <tr>
                    <td style="border-left:none">${sup.hsn || '61130000'}</td>
                    <td>${Number(subTotal).toLocaleString('en-IN')}</td>
                    <td>${totalQty}</td>
                    ${inv.gstMode !== 'igst' ? `
                    <td>${cgstRate}%</td>
                    <td>${Number(cgstAmt).toLocaleString('en-IN')}</td>
                    <td>${sgstRate}%</td>
                    <td>${Number(sgstAmt).toLocaleString('en-IN')}</td>
                    <td>${Number(cgstAmt + sgstAmt).toLocaleString('en-IN')}</td>
                    <td style="border-right:none;font-size:9px">CGST<br/>AMT :${Number(cgstAmt).toLocaleString('en-IN')}<br/><br/>SGST<br/>AMT :${Number(sgstAmt).toLocaleString('en-IN')}</td>
                    ` : `
                    <td>${igstRate}%</td>
                    <td>${Number(igstAmt).toLocaleString('en-IN')}</td>
                    <td>${Number(igstAmt).toLocaleString('en-IN')}</td>
                    <td>${Number(igstAmt).toLocaleString('en-IN')}</td>
                    <td style="border-right:none;font-size:9px">IGST<br/>AMT :${Number(igstAmt).toLocaleString('en-IN')}</td>
                    `}
                </tr>
                <tr style="font-weight:bold">
                    <td style="border-left:none">Total</td>
                    <td>${Number(subTotal).toLocaleString('en-IN')}</td>
                    <td>${totalQty}</td>
                    ${inv.gstMode !== 'igst' ? `
                    <td></td>
                    <td>${Number(cgstAmt).toLocaleString('en-IN')}</td>
                    <td></td>
                    <td>${Number(sgstAmt).toLocaleString('en-IN')}</td>
                    <td>${Number(cgstAmt + sgstAmt).toLocaleString('en-IN')}</td>
                    ` : `
                    <td></td>
                    <td>${Number(igstAmt).toLocaleString('en-IN')}</td>
                    <td>${Number(igstAmt).toLocaleString('en-IN')}</td>
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
        <div>Created by : <strong>${inv.enteredBy || 'Admin'}</strong></div>
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

    // Set current date/time to dd-MMM-yyyy HH:MM:ss format
    const now = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dd = String(now.getDate()).padStart(2, '0');
    const mmm = months[now.getMonth()];
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const formattedDate = `${dd}-${mmm}-${yyyy} ${hh}:${min}:${ss}`;

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

    const items = [];
    cards.forEach(card => {
        const cId = card.id;
        const dId = document.getElementById(`${cId}_designId`).value;
        const qty = parseInt(document.getElementById(`${cId}_qty`).value) || 0;
        const size = document.getElementById(`${cId}_size`).value || '';
        const color = document.getElementById(`${cId}_color`).value || '';
        const name = document.getElementById(`${cId}_name`).textContent;
        const img = document.getElementById(`${cId}_img`).querySelector('img')?.src || '';

        if (dId && qty > 0) {
            items.push({ designId: parseInt(dId), name, qty, size, color });
        }
    });

    if (items.length === 0) {
        alert("Please select at least one design and enter quantity!");
        return;
    }

    const dateTime = document.getElementById('pdDateTime').value;
    const note = document.getElementById('pdNote').value;

    const pack = {
        id: activeEditingPackId || Date.now(),
        items,
        dateTime,
        note,
        enteredBy: 'Dhruvik',
        createdAt: formatDateTime(new Date())
    };

    const vastra_packs = JSON.parse(localStorage.getItem('vastra_packs') || '[]');
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
    vastra_packs = vastra_packs.filter(p => p.id !== activeEditingPackId);
    localStorage.setItem('vastra_packs', JSON.stringify(vastra_packs));

    closePackDesign();
    showToast(`Pack deleted! 🗑️`);
    renderPackList();
}

function renderPackList() {
    const packs = JSON.parse(localStorage.getItem('vastra_packs') || '[]');
    const listEl = document.getElementById('packList');
    const emptyEl = document.getElementById('packEmpty');

    if (packs.length === 0) {
        listEl.innerHTML = '';
        emptyEl.style.display = 'flex';
        return;
    }

    emptyEl.style.display = 'none';

    let html = '';
    packs.slice().reverse().forEach((p, idx) => {
        const totalQty = p.items.reduce((s, i) => s + parseInt(i.qty), 0);
        const packNum = `PACKAG-${packs.length - idx}`;

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
                <div style="font-size:15px;color:#111;font-weight:bold;margin-bottom:4px">${firstItem ? firstItem.name : 'No Design'}</div>
                <div style="display:flex;gap:12px;font-size:12px;color:#666;flex-wrap:wrap;margin-bottom:2px">
                    <div>Packed: <strong style="color:#0088cc">${totalQty}</strong></div>
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
    document.getElementById('btnDeletePack').style.display = 'block';
    document.getElementById('btnSavePack').textContent = 'UPDATE';

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

// Ensure packs render on load or when switching tabs
const _originalShowSection = showSection;
showSection = function (id, el) {
    _originalShowSection(id, el);
    if (id === 'packSection') {
        renderPackList();
    }
    if (id === 'analysisSection') {
        changeAnalysisTab('top');
    }
};

// ═════════════════════ ANALYSIS LOGIC ═══════════════════════
function changeAnalysisTab(tab) {
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
    const challansData = JSON.parse(localStorage.getItem('vastra_challans') || '[]');
    const packsData = JSON.parse(localStorage.getItem('vastra_packs') || '[]');
    const srData = JSON.parse(localStorage.getItem('vastra_salesReturns') || '[]');
    const designsList = JSON.parse(localStorage.getItem('vastra_designs') || '[]');

    const getDesignImage = (dName) => {
        const item = designsList.find(d => d.name === dName);
        return item && item.imgSrc ? item.imgSrc : '';
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
                imgSrc: getDesignImage(name)
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
                    <div style="font-size:15px;font-weight:bold;color:#333;margin-bottom:4px">${item.name}</div>
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
    ['srBillNumber', 'srLRNo', 'srDiscount', 'srShipping', 'srTransport', 'srCreditNoteNo'].forEach(id => {
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
    openCustomerSelect();
}

// Patch selectCustomer to handle SR mode
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
    } else {
        _origSelectCustomer(id);
    }
};

function addSalesReturnItem() {
    designPickerContext = 'salesReturn';
    const designs = JSON.parse(localStorage.getItem('vastra_designs') || '[]');
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
        row.innerHTML = `
            <div class="challan-item-thumb">
                ${_pendingDesign.imgSrc ? `<img src="${_pendingDesign.imgSrc}" alt=""/>` : '<i class="fa fa-tshirt"></i>'}
            </div>
            <div class="challan-item-info">
                <strong>${_pendingDesign.name || 'Design'}</strong>
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
                qty, rate, size, color, total: parseFloat(total)
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
                total: parseFloat(row.dataset.total) || 0,
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
            returnDate: document.getElementById('srReturnDate').value,
            creditNoteNo: document.getElementById('srCreditNoteNo').value,
            createdAt: formatDateDDMMYYYY(new Date()),
            createdTime: formatDateTime(new Date()),
            challanId: window._srSelectedChallanId || null,
            challanNum: (window._srSelectedChallanId) ?
                (JSON.parse(localStorage.getItem('vastra_challans') || '[]').find(x => x.id === window._srSelectedChallanId)?.number || '') : '',
            items,
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
    if (salesReturns.length === 0) {
        list.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    list.innerHTML = salesReturns.slice().reverse().map(sr => {
        const firstItem = (sr.items && sr.items.length > 0) ? sr.items[0] : null;
        const img = firstItem ? getDesignImg(firstItem.designId) : '';
        const designName = firstItem ? firstItem.designName : '-';

        return `
        <div class="challan-card" onclick="openSRDetail(${sr.id})" style="display:flex;align-items:center;padding:12px;cursor:pointer;background:#fff;border-radius:2px;box-shadow:0 1px 3px rgba(0,0,0,0.1);margin-bottom:10px;">
            <div style="width:52px;height:52px;background:#FFF3E0;border-radius:6px;display:flex;align-items:center;justify-content:center;margin-right:12px;overflow:hidden;flex-shrink:0;border:1px solid #FFE0B2;">
                ${img ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover"/>` : `<i class="fa fa-undo-alt" style="color:#fb8c00"></i>`}
            </div>
            <div style="flex:1;">
                <div style="font-weight:700;font-size:15px;color:#111">${sr.number} - <span style="color:#e65100">${designName}</span></div>
                <div style="font-size:12px;color:#8A95A3;margin-top:3px">${sr.customerName} • \</div>
                <div style="font-size:12px;color:#fb8c00;margin-top:2px">${(sr.items || []).length} item(s) • Qty: ${srSumQty(sr)}</div>
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

function deleteSR(id) {
    if (!confirm('Delete this sales return?')) return;
    salesReturns = salesReturns.filter(sr => sr.id !== id);
    localStorage.setItem('vastra_salesReturns', JSON.stringify(salesReturns));
    renderSRList();
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
                    <div><strong style="font-size:14px">${item.designName}</strong></div>
                </div>
                <button class="cd-icon-btn del" onclick="removeSRDItem(${idx})"><i class="fa fa-trash"></i></button>
            </div>
            <table class="cd-item-table">
                <thead><tr><th>SIZE</th><th>COLOR</th><th>QTY</th><th>RATE</th><th></th></tr></thead>
                <tbody><tr>
                    <td><input type="text" value="${item.size || ''}" placeholder="Size" class="cd-table-input" onchange="updateSRDItem(${idx},'size',this.value)"/></td>
                    <td><input type="text" value="${item.color || ''}" placeholder="Color" class="cd-table-input" onchange="updateSRDItem(${idx},'color',this.value)"/></td>
                    <td><input type="number" value="${item.qty}" class="cd-table-input" onchange="updateSRDItem(${idx},'qty',this.value)"/></td>
                    <td><input type="number" value="${item.rate}" class="cd-table-input" onchange="updateSRDItem(${idx},'rate',this.value)"/></td>
                    <td><button onclick="removeSRDItem(${idx})" style="background:none;border:none;color:#c62828;font-size:18px;cursor:pointer"><i class="fa fa-times-circle"></i></button></td>
                </tr></tbody>
            </table>
            <div style="padding:6px 0;font-size:13px;font-weight:600">Total: ${item.qty}</div>
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
    } else {
        item[field] = val;
    }
}

function addItemToSRDetail() {
    _addingToSRDetail = true;
    designPickerContext = 'salesReturnDetail';
    const designs = JSON.parse(localStorage.getItem('vastra_designs') || '[]');
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
    const idx = salesReturns.findIndex(sr => sr.id === currentSRDetail.id);
    if (idx !== -1) { salesReturns[idx] = { ...currentSRDetail }; }
    localStorage.setItem('vastra_salesReturns', JSON.stringify(salesReturns));
    showToast('Sales Return updated! ✅');
    renderSRList();
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
            imgSrc: ''
        }))
    };
    document.getElementById('invCustomerName').textContent = currentSRDetail.customerName;
    document.getElementById('invChallanNum').textContent = currentSRDetail.number;
    document.getElementById('invTransportField').value = currentSRDetail.transport || '';
    const now = new Date();
    document.getElementById('invDate').value = now.toISOString().split('T')[0];
    invGSTRate = 0; invDiscRate = parseFloat(currentSRDetail.discount) || 0; invGSTMode = 'igst';
    document.getElementById('invGSTRateInput').value = 0;
    document.getElementById('invDiscInput').value = invDiscRate;
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
    const grandTotal = subTotal;
    const amountInWords = `Indian Rupees ${Number(grandTotal).toLocaleString('en-IN')} Only`;
    const dateOnly = sr.returnDate ? formatDateDDMMYYYY(sr.returnDate) : sr.createdAt;

    const itemRows = items.map((item, idx) => {
        const amt = (item.qty * (item.rate || 0)).toFixed(0);
        return `<tr>
            <td style="border:1px solid #ccc;padding:8px;text-align:center">${idx + 1}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:left">${item.designName}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:center">61130000</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:center">${item.color || '-'}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:center">${item.size || '-'}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:center">${item.qty}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:center">${item.rate || 0}</td>
            <td style="border:1px solid #ccc;padding:8px;text-align:right">${Number(amt).toLocaleString('en-IN')}</td>
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
                    <div class="meta-cell">Bill Date:<br/><strong>\</strong></div>
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
        
        <div class="totals-area">
            <div class="totals-blank"></div>
            <div class="totals-calc">
                <div class="calc-row"><span>Item Total</span><span>₹${Number(itemTotal).toLocaleString('en-IN')}</span></div>
                <div class="calc-row"><span>Discount(${discRate}%)</span><span>- ₹${Number(discAmt).toLocaleString('en-IN')}</span></div>
                <div class="calc-row" style="font-weight:bold;margin-top:4px"><span>Credit Amount</span><span>₹${Number(grandTotal).toLocaleString('en-IN')}</span></div>
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
    w.document.close();
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
                <div style="font-size:12px;color:#888">${c.customerName} • \</div>
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
function changeReturnTab(tab) {
    ['RetCustomer', 'RetDesign'].forEach(t => {
        const el = document.getElementById('tab' + t);
        if (el) {
            const isActive = (t === 'RetCustomer' && tab === 'customer') || (t === 'RetDesign' && tab === 'design');
            el.style.background = isActive ? '#fb8c00' : '#f0f0f0';
            el.style.color = isActive ? '#fff' : '#555';
        }
    });

    const area = document.getElementById('returnContentArea');
    const srData = JSON.parse(localStorage.getItem('vastra_salesReturns') || '[]');
    const designs = JSON.parse(localStorage.getItem('vastra_designs') || '[]');

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

    let allDesigns = JSON.parse(localStorage.getItem('vastra_designs') || '[]');
    let overallStockTotal = 0;

    // Apply Filters
    const query = (document.getElementById('liveStockSearchInput')?.value || '').toLowerCase();
    if (query) {
        allDesigns = allDesigns.filter(d => d.name.toLowerCase().includes(query));
    }
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
        <div onclick="openLiveStockDetail('${d.name.replace(/'/g, "\\'")}')" style="cursor:pointer;background:#fff;border:1px solid #eab676;border-radius:4px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);overflow:hidden;">
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
    let allDesigns = JSON.parse(localStorage.getItem('vastra_designs') || '[]');
    if (isLiveStockSetWise) {
        allDesigns = allDesigns.filter(d => d.setWise === true);
    }

    if (allDesigns.length === 0) {
        showToast('No data to export!');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Design Name,Rate,Total Stock,Default Stock\n";

    allDesigns.forEach(d => {
        const stock = getDesignStock(d.name);
        let name = d.name.replace(/"/g, '""');
        let price = (d.price || '0').toString().replace(/"/g, '""');
        csvContent += `"${name}","${price}","${stock.available}","${stock.available}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Live_Stock_Report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Exporting Live Stock report...');
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
            if (itm.name === currentLSDesign && itm.qty > 0) {
                records.push({
                    type: 'PACKAGED',
                    dateStr: p.createdAt || p.packDate, // Assuming ISO or DD-MMM-YYYY
                    rawDate: new Date(p.createdAt || p.packDate || Date.now()),
                    title: p.packNum,
                    subtitle: '-', // No dedicated customer usually for pack
                    qty: parseInt(itm.qty),
                    sign: '+'
                });
            }
        });
    });

    // Delivered (- stock)
    challans.forEach(c => {
        if (!c.items) return;
        c.items.forEach(itm => {
            if (itm.designName === currentLSDesign && itm.qty > 0) {
                records.push({
                    type: 'DELIVERED',
                    dateStr: c.createdAt || c.date,
                    rawDate: new Date(c.createdAt || c.date || Date.now()),
                    title: c.number,
                    subtitle: c.customerName || '-',
                    qty: parseInt(itm.qty),
                    sign: '-'
                });
            }
        });
    });

    // Sales Returned (+ stock)
    returns.forEach(sr => {
        if (!sr.items) return;
        sr.items.forEach(itm => {
            if (itm.designName === currentLSDesign && itm.qty > 0) {
                records.push({
                    type: 'SALES RETURNED',
                    dateStr: sr.createdAt || sr.returnDate,
                    rawDate: new Date(sr.createdAt || sr.returnDate || Date.now()),
                    title: 'Ret: ' + (sr.challanNum || 'No Challan'),
                    subtitle: sr.customerName || '-',
                    qty: parseInt(itm.qty),
                    sign: '+'
                });
            }
        });
    });

    // Filter by Tab
    if (tabName !== 'LEDGER' && tabName !== 'PENDING ORDER' && tabName !== 'PURCHASE') {
        records = records.filter(r => r.type === tabName);
    }

    if (tabName === 'PENDING ORDER' || tabName === 'PURCHASE') {
        records = []; // Mock empty for these specific tabs as per current Vastra schema
    }

    // Sort chronologically (oldest to newest ensures correct running total)
    // Actually, design image shows newest first, grouped by month.
    records.sort((a, b) => b.rawDate - a.rawDate);

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

    // Grouping by Month/Year
    const grouped = {};
    records.forEach(r => {
        const d = r.rawDate;
        const monthYear = d.toLocaleString('en-US', { month: 'long', year: 'numeric' }); // e.g. "March 2026"
        const monthShort = d.toLocaleString('en-US', { month: 'short' }).toUpperCase(); // "MAR"
        const day = String(d.getDate()).padStart(2, '0'); // "05"

        if (!grouped[monthYear]) grouped[monthYear] = [];

        r.displayMonth = monthShort;
        r.displayDay = day;
        grouped[monthYear].push(r);
    });

    let html = '';

    // We append the Total Available Stock logic at the absolute top for LEDGER
    if (tabName === 'LEDGER') {
        const currentTotal = getDesignStock(currentLSDesign).available;
        html += `
        <div style="display:flex;background:#fff;margin-bottom:12px;">
            <div style="flex:1;background:#2b6a8e;color:#fff;padding:12px 16px;font-size:14px;display:flex;align-items:center;">
                Total Available Stock :
            </div>
            <div style="width:120px;background:#0088cc;color:#fff;padding:12px 16px;font-weight:bold;font-size:16px;display:flex;align-items:center;justify-content:flex-end;">
                ${currentTotal}
            </div>
        </div>`;
    }

    // A running total concept makes sense mathematically, but currently we may not have historical starting stock mapped perfectly. We display the snapshot values directly from the event.
    for (const [monthYear, events] of Object.entries(grouped)) {
        html += `<div style="padding:10px 16px;font-size:15px;color:#005082;background:#eef5f9;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-weight:bold;">${monthYear}</div>`;

        events.forEach(ev => {
            const qtyColor = ev.sign === '+' ? '#2e7d32' : '#e53935'; // green or red
            const displayQty = ev.sign === '+' ? `+${ev.qty}` : `-${ev.qty}`;

            html += `
            <div style="background:#fff;padding:16px;border-bottom:1px solid #eee;display:flex;align-items:flex-start;gap:16px;">
                <div style="width:55px;height:55px;background:#e8f4f8;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;">
                    <div style="font-size:11px;color:#333;font-weight:bold;line-height:1;">${ev.displayMonth}</div>
                    <div style="font-size:20px;color:#111;font-weight:bold;line-height:1;margin-top:2px;">${ev.displayDay}</div>
                </div>
                
                <div style="flex:1;">
                    <div style="font-size:15px;color:#111;font-weight:600;margin-bottom:2px;">${ev.title}</div>
                    <div style="font-size:13px;color:#555;margin-bottom:8px;">${ev.subtitle}</div>
                    <div style="font-size:13px;color:#888;">Design No.: ${currentLSDesign}</div>
                    <div style="font-size:13px;color:#888;">Packed Quantity: ${ev.qty}.0</div>
                </div>
                
                <div style="text-align:right;">
                    <div style="font-size:16px;font-weight:bold;color:${qtyColor};margin-bottom:4px;">${displayQty}</div>
                    <div style="font-size:12px;color:#666;">Total Qty: ${displayQty}</div>
                </div>
            </div>`;
        });
    }

    contentArea.innerHTML = html;
}