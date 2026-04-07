/* ================================================
   VASTRA – Firebase Realtime Sync Layer (Smart Merge)
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
    'vastra_categoryTypes',
    'vastra_role_permissions',
    'vastra_supplier'
];

// ── State ────────────────────────────────────────
let fbUserId = null;
let fbReady = false;
let fbConnected = false;
let _suppressFirebaseWrite = false; // prevent write loops
let _syncDebounceTimers = {};
let _lastLocalJSON = {}; // Cache to avoid redundant stringify/parse

// ── Status UI ────────────────────────────────────
function updateSyncStatus(status) {
    const el = document.getElementById('syncStatusIndicator');
    if (!el) return;
    
    switch(status) {
        case 'online':
            el.innerHTML = '<i class="fa fa-cloud" style="color:#4caf50"></i>';
            el.title = 'Connected to Cloud';
            break;
        case 'offline':
            el.innerHTML = '<i class="fa fa-cloud" style="color:#9e9e9e"></i>';
            el.title = 'Offline';
            break;
        case 'syncing':
            el.innerHTML = '<i class="fa fa-sync fa-spin" style="color:#0088cc"></i>';
            el.title = 'Syncing...';
            break;
    }
}

// ── Helpers ──────────────────────────────────────
function smartMerge(local, remote) {
    if (!remote) return local;
    if (!local) return remote;

    // For non-array objects (supplier, permissions), just take the newest if available
    if (!Array.isArray(local) || !Array.isArray(remote)) {
        if (remote.updatedAt && local.updatedAt) {
            return remote.updatedAt > local.updatedAt ? remote : local;
        }
        return remote; // Default to remote if no timestamps
    }

    const map = new Map();
    // Add local items
    local.forEach(item => {
        if (item && item.id) map.set(item.id, item);
    });
    // Merge remote items
    remote.forEach(remoteItem => {
        if (!remoteItem || !remoteItem.id) return;
        const localItem = map.get(remoteItem.id);
        if (!localItem || (remoteItem.updatedAt || 0) >= (localItem.updatedAt || 0)) {
            map.set(remoteItem.id, remoteItem);
        }
    });

    return Array.from(map.values());
}

// ── Anonymous Auth ───────────────────────────────
function firebaseInit() {
    // Monitor connection
    fbDB.ref(".info/connected").on("value", (snap) => {
        fbConnected = (snap.val() === true);
        if (fbConnected) {
            console.log('🌐 Firebase Connected');
            updateSyncStatus('online');
        } else {
            console.log('🌐 Firebase Disconnected');
            updateSyncStatus('offline');
        }
    });

    fbAuth.signInAnonymously()
        .then(() => console.log('✅ Firebase Auth successful'))
        .catch(err => console.error('❌ Firebase Auth failed:', err));

    fbAuth.onAuthStateChanged((user) => {
        if (user) {
            fbUserId = user.uid;
            fbReady = true;
            console.log('🔑 Firebase Ready:', fbUserId);
            startFirebaseListeners();
            // Initial sync: fetch everything first
            SYNC_KEYS.forEach(key => pullAndMerge(key));
            pullAndMergeDesigns();
            startDeepSyncPoller();
        } else {
            fbUserId = null;
            fbReady = false;
        }
    });
}

// ── Pull and Merge ───────────────────────────────
async function pullAndMerge(key) {
    if (!fbReady) return;
    updateSyncStatus('syncing');
    const ref = fbDB.ref(`vastra_shared_data/${key}`);
    ref.once('value').then(snapshot => {
        const fbData = snapshot.val();
        if (!fbData) {
            updateSyncStatus('online');
            return;
        }

        const localData = JSON.parse(localStorage.getItem(key) || (key.includes('supplier') || key.includes('permission') ? '{}' : '[]'));
        const merged = smartMerge(localData, fbData);

        const mergedJSON = JSON.stringify(merged);
        const localJSON = JSON.stringify(localData);
        _lastLocalJSON[key] = mergedJSON;
        
        if (mergedJSON !== localJSON) {
            _suppressFirebaseWrite = true;
            localStorage.setItem(key, mergedJSON);
            _suppressFirebaseWrite = false;
            console.log(`⬇️ Merged ${key} from Cloud`);
            if (typeof refreshUIForKey === 'function') refreshUIForKey(key);
            
            // Note: We don't need to push back here because the listener/transaction logic will handle it if needed
        }
        updateSyncStatus('online');
    });
}

async function pullAndMergeDesigns() {
    if (!fbReady || typeof VastraDB === 'undefined') return;
    updateSyncStatus('syncing');
    const ref = fbDB.ref(`vastra_shared_data/vastra_designs`);
    ref.once('value').then(async (snapshot) => {
        let fbData = snapshot.val();
        if (!fbData) {
            updateSyncStatus('online');
            return;
        }
        if (!Array.isArray(fbData) && typeof fbData === 'object') fbData = Object.values(fbData);

        const localDesigns = await VastraDB.getAll();
        const merged = smartMerge(localDesigns, fbData);
        // Sort merged designs numerically
        merged.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true, sensitivity: 'base' }));
        const mergedJSON = JSON.stringify(merged);
        _lastLocalJSON['vastra_designs'] = mergedJSON;

        if (mergedJSON !== JSON.stringify(localDesigns)) {
            _suppressFirebaseWrite = true;
            await VastraDB.saveAll(merged);
            _suppressFirebaseWrite = false;
            console.log(`⬇️ Merged vastra_designs from Cloud`);
            if (typeof refreshUIForKey === 'function') refreshUIForKey('vastra_designs');

            // Push back merged result
            window.syncDesignsToFirebaseManual();
        }
        updateSyncStatus('online');
    });
}

// ── Real-time Listeners ──────────────────────────
function startFirebaseListeners() {
    if (!fbReady) return;

    SYNC_KEYS.forEach(key => {
        fbDB.ref(`vastra_shared_data/${key}`).on('value', (snapshot) => {
            if (_suppressFirebaseWrite) return;
            const fbData = snapshot.val();
            if (!fbData) return;

            const fbDataStr = JSON.stringify(fbData);

            // Optimization: If the string matches our last known local state, skip merge check
            if (fbDataStr === _lastLocalJSON[key]) return;

            const localDataStr = localStorage.getItem(key) || (key.includes('supplier') ? '{}' : '[]');

            // Authoritative Mirroring: If cloud data is different, adopt it entirely
            // This prevents old/deleted data from 'mixing back' (bhego thay che)
            // But it causes auto-deletion of new items before they sync.
            // FIXED: Using smartMerge here too.
            const localData = JSON.parse(localDataStr);
            const merged = smartMerge(localData, fbData);
            const mergedStr = JSON.stringify(merged);

            if (mergedStr !== localDataStr) {
                _suppressFirebaseWrite = true;
                localStorage.setItem(key, mergedStr);
                _suppressFirebaseWrite = false;
                _lastLocalJSON[key] = mergedStr; // Keep cache in sync
                console.log(`✨ Automatic Sync (Merge): ${key}`);
                if (typeof refreshUIForKey === 'function') refreshUIForKey(key);
            }
        });
    });

    fbDB.ref(`vastra_shared_data/vastra_designs`).on('value', async (snapshot) => {
        if (_suppressFirebaseWrite || typeof VastraDB === 'undefined') return;
        let fbData = snapshot.val();
        if (!fbData) fbData = []; // Handle empty deletion
        if (!Array.isArray(fbData) && typeof fbData === 'object') fbData = Object.values(fbData);

        try {
            const fbDataStr = JSON.stringify(fbData);
            // Optimization: If the string matches our last known local state, skip IndexedDB check
            if (fbDataStr === _lastLocalJSON['vastra_designs']) return;

            const localDesigns = await VastraDB.getAll();
            const localDataStr = JSON.stringify(localDesigns);

            // Authoritative Mirroring for Designs (IndexedDB)
            // FIXED: Using smartMerge for designs too to prevent auto-delete
            const merged = smartMerge(localDesigns, fbData);
            const mergedStr = JSON.stringify(merged);

            if (mergedStr !== localDataStr) {
                _suppressFirebaseWrite = true;
                _lastLocalJSON['vastra_designs'] = mergedStr;
                await VastraDB.saveAll(merged);
                _suppressFirebaseWrite = false;
                console.log(`✨ Automatic Sync (Merge): vastra_designs`);
                if (typeof refreshUIForKey === 'function') refreshUIForKey('vastra_designs');
            }
        } catch (e) {
            console.error("Listener vastra_designs error:", e);
        }
    });
}

// ── Debounced Sync ───────────────────────────────
// ── Transactional Sync ──────────────────────────
function syncToFirebase(key) {
    if (!fbReady || _suppressFirebaseWrite) return;

    clearTimeout(_syncDebounceTimers[key]);
    _syncDebounceTimers[key] = setTimeout(() => {
        const localDataRaw = localStorage.getItem(key);
        if (!localDataRaw || localDataRaw === _lastLocalJSON[key]) return;

        const localData = JSON.parse(localDataRaw);
        updateSyncStatus('syncing');

        fbDB.ref(`vastra_shared_data/${key}`).transaction((currentCloudData) => {
            // Transactional Merge: merge local intent with current cloud state
            return smartMerge(localData, currentCloudData);
        }, (error, committed, snapshot) => {
            if (error) {
                console.error(`Sync transaction failed for ${key}:`, error);
            } else if (committed) {
                const finalData = snapshot.val();
                const finalJSON = JSON.stringify(finalData);
                _lastLocalJSON[key] = finalJSON;
                
                // If cloud had newer/different items that were merged, update local storage
                if (finalJSON !== localDataRaw) {
                    _suppressFirebaseWrite = true;
                    localStorage.setItem(key, finalJSON);
                    _suppressFirebaseWrite = false;
                    console.log(`✅ ${key} synced & merged with cloud updates`);
                    if (typeof refreshUIForKey === 'function') refreshUIForKey(key);
                } else {
                    console.log(`✅ ${key} synced to cloud`);
                }
            }
            updateSyncStatus('online');
        });
    }, 100); // Super fast: 100ms debounce
}

window.syncDesignsToFirebaseManual = async function () {
    if (!fbReady || _suppressFirebaseWrite || typeof VastraDB === 'undefined') return;

    clearTimeout(_syncDebounceTimers['vastra_designs']);
    _syncDebounceTimers['vastra_designs'] = setTimeout(async () => {
        try {
            const localDesigns = await VastraDB.getAll();
            const localDataStr = JSON.stringify(localDesigns);
            
            if (localDataStr === _lastLocalJSON['vastra_designs']) return;

            updateSyncStatus('syncing');
            
            fbDB.ref(`vastra_shared_data/vastra_designs`).transaction((currentCloudData) => {
                if (!currentCloudData) return localDesigns;
                // Convert object form to array if necessary (Firebase RTDB quirk)
                let fbData = currentCloudData;
                if (!Array.isArray(fbData) && typeof fbData === 'object') fbData = Object.values(fbData);
                return smartMerge(localDesigns, fbData);
            }, async (error, committed, snapshot) => {
                if (error) {
                    console.error('Design sync transaction failed:', error);
                } else if (committed) {
                    const finalData = snapshot.val();
                    let fbData = finalData;
                    if (!Array.isArray(fbData) && typeof fbData === 'object') fbData = Object.values(fbData);
                    
                    const finalJSON = JSON.stringify(fbData);
                    _lastLocalJSON['vastra_designs'] = finalJSON;

                    if (finalJSON !== localDataStr) {
                        _suppressFirebaseWrite = true;
                        await VastraDB.saveAll(fbData);
                        _suppressFirebaseWrite = false;
                        console.log('✅ designs synced & merged with cloud updates');
                        if (typeof refreshUIForKey === 'function') refreshUIForKey('vastra_designs');
                    } else {
                        console.log('✅ designs synced to cloud');
                    }
                }
                updateSyncStatus('online');
            });
        } catch (e) {
            console.error("Manual sync designs error:", e);
        }
    }, 150); // Super fast: 150ms debounce
}

// ── Background Deep Sync (Every 30s as safety net) ──────────
// Fetch the entire shared node in ONE request to save network/mobile data
function startDeepSyncPoller() {
    setInterval(async () => {
        if (!fbReady || !fbConnected || _suppressFirebaseWrite) return;
        
        console.log('🔄 Deep Sync: Batch verification...');
        updateSyncStatus('syncing');

        try {
            const snapshot = await fbDB.ref('vastra_shared_data').once('value');
            const cloudBatch = snapshot.val();
            if (!cloudBatch) return;

            // Handle standard keys
            SYNC_KEYS.forEach(key => {
                const cloudData = cloudBatch[key];
                if (cloudData) {
                    const cloudJSON = JSON.stringify(cloudData);
                    // Consistency check: Only merge if Cloud differs from what we last thought was local
                    if (cloudJSON !== _lastLocalJSON[key]) {
                        const localData = JSON.parse(localStorage.getItem(key) || (key.includes('supplier') ? '{}' : '[]'));
                        const merged = smartMerge(localData, cloudData);
                        const mergedJSON = JSON.stringify(merged);
                        
                        if (mergedJSON !== JSON.stringify(localData)) {
                            _suppressFirebaseWrite = true;
                            localStorage.setItem(key, mergedJSON);
                            _suppressFirebaseWrite = false;
                            _lastLocalJSON[key] = mergedJSON;
                            console.log(`⬇️ Batch update applied for ${key}`);
                            if (typeof refreshUIForKey === 'function') refreshUIForKey(key);

                            // If we have local additions not in cloud, they will be pushed via listeners/transactions
                        } else {
                            // Local and Cloud are effectively same, update cache
                            _lastLocalJSON[key] = mergedJSON;
                        }
                    }
                }
            });

            // Handle designs specially
            const cloudDesigns = cloudBatch['vastra_designs'];
            if (cloudDesigns && typeof VastraDB !== 'undefined') {
                let fbData = cloudDesigns;
                if (!Array.isArray(fbData) && typeof fbData === 'object') fbData = Object.values(fbData);
                const fbDataStr = JSON.stringify(fbData);
                
                if (fbDataStr !== _lastLocalJSON['vastra_designs']) {
                    const localDesigns = await VastraDB.getAll();
                    const merged = smartMerge(localDesigns, fbData);
                    // Sort numerically
                    merged.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true, sensitivity: 'base' }));
                    const mergedStr = JSON.stringify(merged);
                    
                    if (mergedStr !== JSON.stringify(localDesigns)) {
                        _suppressFirebaseWrite = true;
                        _lastLocalJSON['vastra_designs'] = mergedStr;
                        await VastraDB.saveAll(merged);
                        _suppressFirebaseWrite = false;
                        console.log(`⬇️ Batch update applied for vastra_designs`);
                        if (typeof refreshUIForKey === 'function') refreshUIForKey('vastra_designs');
                    } else {
                        _lastLocalJSON['vastra_designs'] = mergedStr;
                    }
                }
            }
        } catch (e) {
            console.error("Deep sync poller error:", e);
        } finally {
            updateSyncStatus('online');
        }
    }, 15000); // 15 seconds is a healthy balance between real-time and server load
}

// ── UI Refresh ───────────────────────────────────
function refreshUIForKey(key) {
    try {
        switch (key) {
            case 'vastra_designs':
                if (typeof VastraDB !== 'undefined') {
                    VastraDB.getAll().then(res => {
                        // Sort designs numerically
                        designs = res.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true, sensitivity: 'base' }));
                        if (typeof renderDesignsTable === 'function') renderDesignsTable();
                        if (typeof updateStats === 'function') updateStats();
                    });
                }
                break;
            case 'vastra_challans':
                challans = JSON.parse(localStorage.getItem('vastra_challans') || '[]');
                if (typeof renderChallanList === 'function') renderChallanList();
                if (typeof updateStats === 'function') updateStats();
                // Refresh detail if open
                if (typeof currentDetailChallan !== 'undefined' && currentDetailChallan && typeof renderChallanDetail === 'function') {
                    const fresh = challans.find(c => c.id === currentDetailChallan.id);
                    if (fresh) renderChallanDetail(fresh);
                }
                // Refresh stock views
                if (typeof renderLiveStock === 'function') renderLiveStock();
                if (typeof renderLowStockAlert === 'function') renderLowStockAlert();
                break;
            case 'vastra_packs':
                if (typeof renderPackList === 'function') renderPackList();
                if (typeof renderLiveStock === 'function') renderLiveStock();
                if (typeof renderLowStockAlert === 'function') renderLowStockAlert();
                break;
            case 'vastra_customers':
                customers = JSON.parse(localStorage.getItem('vastra_customers') || '[]');
                if (typeof updateStats === 'function') updateStats();
                if (typeof renderCustomerSelectList === 'function') renderCustomerSelectList();
                break;
            case 'vastra_agents':
                agents = JSON.parse(localStorage.getItem('vastra_agents') || '[]');
                if (typeof renderAgentList === 'function') renderAgentList();
                break;
            case 'vastra_salesReturns':
                salesReturns = JSON.parse(localStorage.getItem('vastra_salesReturns') || '[]');
                if (typeof renderSRList === 'function') renderSRList();
                if (typeof renderLiveStock === 'function') renderLiveStock();
                if (typeof renderLowStockAlert === 'function') renderLowStockAlert();
                break;
            case 'vastra_invoices':
                if (typeof invoices !== 'undefined') invoices = JSON.parse(localStorage.getItem('vastra_invoices') || '[]');
                break;
            case 'vastra_categoryTypes':
                categoryTypes = JSON.parse(localStorage.getItem('vastra_categoryTypes') || '[]');
                if (typeof renderCategoryTypeList === 'function') renderCategoryTypeList();
                break;
            case 'vastra_role_permissions':
                if (typeof applyPermissions === 'function') applyPermissions();
                if (typeof renderPermissionsTable === 'function') renderPermissionsTable();
                break;
            case 'vastra_supplier':
                // Implicit refresh
                break;
        }
    } catch (e) {
        console.warn('UI refresh error for ' + key + ':', e);
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

    // Hook into VastraDB to automatically push designs to Firebase after saveAll or saveItem
    if (typeof VastraDB !== 'undefined') {
        if (typeof VastraDB.saveAll === 'function') {
            const _origSaveAll = VastraDB.saveAll.bind(VastraDB);
            VastraDB.saveAll = async function (data) {
                const result = await _origSaveAll(data);
                if (!_suppressFirebaseWrite) window.syncDesignsToFirebaseManual();
                return result;
            };
        }
        if (typeof VastraDB.saveItem === 'function') {
            const _origSaveItem = VastraDB.saveItem.bind(VastraDB);
            VastraDB.saveItem = async function (item) {
                const result = await _origSaveItem(item);
                if (!_suppressFirebaseWrite) window.syncDesignsToFirebaseManual();
                return result;
            };
        }
    }
});
