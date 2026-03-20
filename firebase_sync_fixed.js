/* ================================================
   VASTRA – Firebase Realtime Sync Layer
   Anonymous Auth + Realtime Database
================================================ */

// ── Firebase Config ──────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyDwEizmM_UjbRSdAulHt7xSKbCpBTGOIkI",
    authDomain: "vastra-786d6.firebaseapp.com",
    databaseURL: "https://vastra-786d6-default-rtdb.firebaseio.com",
    projectId: "vastra-786d6",
    storageBucket: "vastra-786d6.firebasestorage.app",
    messagingSenderId: "604552274531",
    appId: "1:604552274531:web:643a307dc44d0c9c7c0e56",
    measurementId: "G-N9H2ZVRWHB"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const fbAuth = firebase.auth();
const fbDB = firebase.database();

// ── Data keys to sync ────────────────────────────
// Note: vastra_designs is handled specially via VastraDB
const SYNC_KEYS = [
    'vastra_challans',
    'vastra_packs',
    'vastra_customers',
    'vastra_agents',
    'vastra_invoices',
    'vastra_salesReturns',
    'vastra_categoryTypes'
];

// ── State ────────────────────────────────────────
let fbUserId = null;
let fbReady = false;
let _suppressFirebaseWrite = false; // prevent write loops

// ── Anonymous Auth ───────────────────────────────
function firebaseInit() {
    fbAuth.signInAnonymously()
        .then(() => {
            console.log('✅ Firebase Anonymous Auth successful');
        })
        .catch((error) => {
            console.error('❌ Firebase Auth failed:', error.message);
            if (typeof showToast === 'function') {
                showToast('Firebase connection failed. Data will stay local only. If on live site, please whitelist domain in Firebase Auth Settings.');
            }
        });

    fbAuth.onAuthStateChanged((user) => {
        if (user) {
            fbUserId = user.uid;
            fbReady = true;
            console.log('🔑 Firebase User ID:', fbUserId);
            startFirebaseListeners();
            pushAllToFirebase();
            pushDesignsToFirebase(); // Special handle for VastraDB designs
        } else {
            fbUserId = null;
            fbReady = false;
        }
    });
}

// ── Shared Storage Push ──────────────────────────
function pushAllToFirebase() {
    if (!fbReady) return;

    SYNC_KEYS.forEach(key => {
        const localData = localStorage.getItem(key);
        const ref = fbDB.ref(`vastra_shared_data/${key}`);

        ref.once('value').then(snapshot => {
            const fbData = snapshot.val();
            if (fbData) {
                const fbJSON = JSON.stringify(fbData);
                if (fbJSON !== localData) {
                    _suppressFirebaseWrite = true;
                    localStorage.setItem(key, fbJSON);
                    _suppressFirebaseWrite = false;
                    console.log(`⬇️ Pulled ${key} from Firebase`);
                    if (typeof refreshUIForKey === 'function') refreshUIForKey(key);
                }
            } else if (localData && localData !== '[]' && localData !== 'null') {
                ref.set(JSON.parse(localData)).catch(e => console.error(e));
            }
        });
    });
}

// ── Special Sync for VastraDB (Designs) ──────────
async function pushDesignsToFirebase() {
    if (!fbReady || typeof VastraDB === 'undefined') return;

    try {
        const localDesigns = await VastraDB.getAll();
        const ref = fbDB.ref(`vastra_shared_data/vastra_designs`);

        ref.once('value').then(async (snapshot) => {
            const fbData = snapshot.val();
            if (fbData && Array.isArray(fbData)) {
                // To avoid deep comparison overhead on large arrays, simple JSON string check
                const fbJSON = JSON.stringify(fbData);
                const localJSON = JSON.stringify(localDesigns);

                if (fbJSON !== localJSON) {
                    _suppressFirebaseWrite = true;
                    await VastraDB.saveAll(fbData);
                    _suppressFirebaseWrite = false;
                    console.log(`⬇️ Pulled vastra_designs from Firebase`);
                    if (typeof refreshUIForKey === 'function') refreshUIForKey('vastra_designs');
                }
            } else if (localDesigns && localDesigns.length > 0) {
                // Firebase is empty but local has data
                ref.set(localDesigns).catch(e => console.error(e));
            }
        });
    } catch (e) {
        console.error("VastraDB sync init error:", e);
    }
}

// Global hook to manually sync designs when VastraDB is updated
window.syncDesignsToFirebaseManual = async function () {
    if (!fbReady || _suppressFirebaseWrite || typeof VastraDB === 'undefined') return;
    try {
        const localDesigns = await VastraDB.getAll();
        fbDB.ref(`vastra_shared_data/vastra_designs`).set(localDesigns)
            .then(() => console.log('✅ Synced vastra_designs to Firebase (Manual Hook)'))
            .catch(e => console.error('Sync failed vastra_designs:', e));
    } catch (e) {
        console.error("Manual sync designs error:", e);
    }
}

// ── Listeners for real-time changes ──────────────
function startFirebaseListeners() {
    if (!fbReady) return;

    // Standard local storage keys
    SYNC_KEYS.forEach(key => {
        const ref = fbDB.ref(`vastra_shared_data/${key}`);
        ref.on('value', (snapshot) => {
            if (_suppressFirebaseWrite) return;
            const fbData = snapshot.val();
            if (!fbData) return;

            const fbJSON = JSON.stringify(fbData);
            const localJSON = localStorage.getItem(key) || '[]';

            if (fbJSON !== localJSON) {
                _suppressFirebaseWrite = true;
                localStorage.setItem(key, fbJSON);
                _suppressFirebaseWrite = false;
                console.log(`🔄 Synced ${key} from Firebase`);
                if (typeof refreshUIForKey === 'function') refreshUIForKey(key);
            }
        });
    });

    // VastraDB Listener
    const designRef = fbDB.ref(`vastra_shared_data/vastra_designs`);
    designRef.on('value', async (snapshot) => {
        if (_suppressFirebaseWrite || typeof VastraDB === 'undefined') return;
        const fbData = snapshot.val();
        if (!fbData || !Array.isArray(fbData)) return;

        try {
            const localDesigns = await VastraDB.getAll();
            const fbJSON = JSON.stringify(fbData);
            const localJSON = JSON.stringify(localDesigns);

            if (fbJSON !== localJSON) {
                _suppressFirebaseWrite = true;
                await VastraDB.saveAll(fbData);
                _suppressFirebaseWrite = false;
                console.log(`🔄 Synced vastra_designs from Firebase (Real-time)`);
                if (typeof refreshUIForKey === 'function') refreshUIForKey('vastra_designs');
            }
        } catch (e) {
            console.error("Listener vastra_designs error:", e);
        }
    });
}

function syncToFirebase(key) {
    if (!fbReady || _suppressFirebaseWrite) return;
    const localData = localStorage.getItem(key);
    if (!localData) return;

    fbDB.ref(`vastra_shared_data/${key}`)
        .set(JSON.parse(localData))
        .then(() => console.log(`✅ Synced ${key} to Firebase`))
        .catch(err => console.warn(`Sync failed for ${key}:`, err));
}

// ── Refresh UI ───────────────────────────────────
function refreshUIForKey(key) {
    const activeEl = document.activeElement;
    const activeId = activeEl ? activeEl.id : null;
    const selStart = activeEl && activeEl.selectionStart !== undefined ? activeEl.selectionStart : null;
    const selEnd = activeEl && activeEl.selectionEnd !== undefined ? activeEl.selectionEnd : null;

    try {
        switch (key) {
            case 'vastra_designs':
                if (typeof VastraDB !== 'undefined') {
                    VastraDB.getAll().then(res => {
                        window.designs = res;
                        if (typeof renderDesignsTable === 'function') renderDesignsTable();
                        if (typeof updateStats === 'function') updateStats();
                    });
                }
                break;
            case 'vastra_challans':
                window.challans = JSON.parse(localStorage.getItem('vastra_challans') || '[]');
                if (typeof renderChallanList === 'function') renderChallanList();
                if (typeof updateStats === 'function') updateStats();
                break;
            case 'vastra_packs':
                if (typeof renderPackList === 'function') renderPackList();
                break;
            case 'vastra_customers':
                window.customers = JSON.parse(localStorage.getItem('vastra_customers') || '[]');
                if (typeof updateStats === 'function') updateStats();
                break;
            case 'vastra_agents':
                window.agents = JSON.parse(localStorage.getItem('vastra_agents') || '[{"id":1,"name":"Direct","location":"-","agency":"","mobile":"","avatar":null}]');
                break;
            case 'vastra_salesReturns':
                window.salesReturns = JSON.parse(localStorage.getItem('vastra_salesReturns') || '[]');
                if (typeof renderSRList === 'function') renderSRList();
                break;
            case 'vastra_invoices':
                if (typeof window.invoices !== 'undefined') {
                    window.invoices = JSON.parse(localStorage.getItem('vastra_invoices') || '[]');
                }
                break;
            case 'vastra_categoryTypes':
                window.categoryTypes = JSON.parse(localStorage.getItem('vastra_categoryTypes') || '[]');
                break;
        }
    } catch (e) {
        console.warn('UI refresh error for ' + key + ':', e);
    }

    if (activeId) {
        setTimeout(() => {
            const el = document.getElementById(activeId);
            if (el) {
                el.focus();
                if (selStart !== null && el.setSelectionRange) {
                    try { el.setSelectionRange(selStart, selEnd); } catch (e) { }
                }
            }
        }, 100);
    }
}

// ── Override localStorage.setItem ────────────────
const _originalSetItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = function (key, value) {
    _originalSetItem(key, value);

    if (SYNC_KEYS.includes(key) && !_suppressFirebaseWrite) {
        syncToFirebase(key);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    firebaseInit();

    // Hook into VastraDB to automatically push designs to Firebase after saveAll
    if (typeof VastraDB !== 'undefined' && typeof VastraDB.saveAll === 'function') {
        const _origSaveAll = VastraDB.saveAll.bind(VastraDB);
        VastraDB.saveAll = async function (data) {
            const result = await _origSaveAll(data);
            if (typeof window.syncDesignsToFirebaseManual === 'function') {
                // Background sync
                window.syncDesignsToFirebaseManual();
            }
            return result;
        };
    }
});