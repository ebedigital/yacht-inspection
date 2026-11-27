// Combined Yachting: faster real-time checklist sync and completed-inspection archive.
// Replaces cloud-next.js only; uses the existing Firebase configuration and Firestore rules.
import './firebase-cloud.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';
import { getFirestore, doc, collection, onSnapshot, getDoc, setDoc, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';

const auth = getAuth();
const db = getFirestore();
const weekly = /weekly\.html$/i.test(location.pathname);
const kind = weekly ? 'weekly' : 'monthly';
const key = weekly ? 'cy-weekly-boats-v2' : 'cy-managed-boats-v1';
const configRef = doc(db, 'checklistConfigs', kind);
const panel = document.getElementById('cyNextCloudPanel');
const status = document.getElementById('cySyncStatus');
const saveButton = document.getElementById('cySaveRecord');
let unsubscribe = null;
let pending = null;
let role = 'none';
let approved = false;
let initialized = false;
let lastCloud = null;
let saving = false;
let editing = false;
let generation = 0;
const SAVE_DELAY_MS = 400; // previously 1800ms

function note(message) { if (status) status.textContent = 'Cloud sync: ' + message; }
function localValue() { return localStorage.getItem(key) || '{}'; }
function valid(boats) { return !!boats && typeof boats === 'object' && !Array.isArray(boats) && Object.keys(boats).length > 0; }
function signedIn() { return !!auth.currentUser && approved; }
function cancelSession() {
  generation++;
  if (unsubscribe) unsubscribe();
  unsubscribe = null;
  clearTimeout(pending);
  pending = null;
  approved = false;
  initialized = false;
  role = 'none';
  saving = false;
  editing = false;
  lastCloud = null;
}
async function getRole(user) {
  const profile = await getDoc(doc(db, 'users', user.uid));
  const data = profile.exists() ? profile.data() : {};
  return data.active === true && ['admin', 'technician'].includes(data.role) ? data.role : 'none';
}

async function upload() {
  pending = null;
  if (!signedIn() || role !== 'admin' || !initialized || saving) return;
  let boats;
  try { boats = JSON.parse(localValue()); }
  catch { note('Invalid local checklist data'); return; }
  if (!valid(boats)) { note('No boats to upload'); return; }
  const before = JSON.stringify(boats);
  if (before === lastCloud) { editing = false; note('Up to date'); return; }
  const session = generation;
  saving = true;
  note('Saving changes…');
  try {
    await setDoc(configRef, { boats, schema: weekly ? 'weekly-v2' : 'monthly-v1', updatedAt: serverTimestamp(), updatedBy: auth.currentUser.uid });
    if (session !== generation) return;
    lastCloud = before;
    // If the user changed more items during the upload, save them too.
    const changedAgain = localValue() !== before;
    editing = changedAgain;
    note(changedAgain ? 'Saving more changes…' : 'Saved to Firebase');
    if (changedAgain) scheduleUpload();
  } catch (error) {
    if (session !== generation) return;
    editing = true;
    note('Save failed or offline — retry when connected');
    console.error('Checklist upload failed:', error);
  } finally { if (session === generation) saving = false; }
}
function scheduleUpload() {
  clearTimeout(pending);
  pending = setTimeout(upload, SAVE_DELAY_MS);
}
window.cyChecklistEdited = () => {
  // Retain local edits even when network/auth setup is still pending.
  editing = true;
  note('Changes pending…');
  if (initialized && role === 'admin') scheduleUpload();
};
function applyCloud(boats) {
  if (!valid(boats)) return;
  const fromCloud = JSON.stringify(boats);
  lastCloud = fromCloud;
  initialized = true;
  if (editing || saving) {
    note('Local changes pending; cloud updates on hold');
    if (role === 'admin' && !saving) scheduleUpload();
    return;
  }
  if (localValue() === fromCloud) { note('Up to date (' + role + ')'); return; }
  if (window.cyInspectionUnsaved?.()) {
    note('New boats available — save inspection draft before refreshing');
    return;
  }
  try {
    const old = localStorage.getItem(key);
    if (old) localStorage.setItem(key + '-autosync-backup-' + Date.now(), old);
    if (window.cyApplyCloudChecklist?.(boats) === true) {
      localStorage.setItem(key, fromCloud);
      note('Boats and checklists updated (' + role + ')');
    } else {
      note('New boats available — save draft and refresh');
    }
  } catch(error) {
    console.error('Checklist refresh failed:', error);
    note('Cloud update needs review; local data preserved');
  }
}

onAuthStateChanged(auth, async user => {
  cancelSession();
  const session = generation;
  if (!user) { if (panel) panel.style.display = 'none'; return; }
  try {
    role = await getRole(user);
    if (session !== generation) return;
    approved = role !== 'none';
    if (panel) panel.style.display = 'block';
    if (!approved) { note('Account not approved'); return; }
    if (saveButton) saveButton.style.display = 'inline-block';
    document.documentElement.dataset.cyRole = role;
    if (role === 'technician') {
      document.getElementById('cyCloudPush')?.setAttribute('hidden', '');
      const manager = document.getElementById('boatModal') || document.getElementById('manageWeekly');
      if (manager) manager.style.display = 'none';
    }
    note('Connecting…');
    unsubscribe = onSnapshot(configRef, {includeMetadataChanges: true}, snap => {
      if (session !== generation) return;
      if (!snap.exists()) {
        lastCloud = null;
        initialized = true;
        note('No shared checklist yet. Admin can upload the first copy.');
        return;
      }
      const data = snap.data();
      if (!valid(data.boats) || data.schema !== (weekly ? 'weekly-v2' : 'monthly-v1')) {
        note('Unexpected cloud checklist format');
        return;
      }
      // Do not interpret offline cached data as a successful cloud save.
      if (snap.metadata.fromCache && !navigator.onLine) {
        note('Offline — showing cached boats');
      }
      applyCloud(data.boats);
    }, error => {
      initialized = false;
      note('Read error: ' + (error.code || 'unknown'));
      console.error(error);
    });
  } catch(error) {
    if (session === generation) note('Access check failed: ' + error.message);
    console.error(error);
  }
});

// React quickly when returning to the app on a phone. The Firestore listener is
// already live; this also retries local pending edits after reconnecting.
window.addEventListener('online', () => {
  if (editing && initialized && role === 'admin') scheduleUpload();
  else note('Connected; checking for updates…');
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && editing && initialized && role === 'admin') scheduleUpload();
});

saveButton?.addEventListener('click', async () => {
  if (!signedIn()) { alert('Please sign in to save records.'); return; }
  const snap = window.cyInspectionSnapshot?.();
  if (!snap || !snap.boat || !snap.date || !snap.inspector) { alert('Select boat, date and inspector first.'); return; }
  if (snap.missing) { alert('Not Satisfactory findings require notes before cloud saving.'); return; }
  if (snap.completed !== snap.total) { alert('Complete all checklist items first. You can still save a draft locally.'); return; }
  if (!confirm('Save this completed ' + kind + ' inspection to Firestore? This saves its data, not the PDF file.')) return;
  saveButton.disabled = true;
  try {
    const record = {...snap, createdAt: serverTimestamp(), createdBy: auth.currentUser.uid, createdByEmail: auth.currentUser.email || '', status: 'completed'};
    const result = await addDoc(collection(db, 'inspections'), record);
    alert('Inspection saved. Record ID: ' + result.id + '\nPDFs are generated locally.');
  } catch(error) { alert('Cloud record save failed: ' + error.message); console.error(error); }
  finally { saveButton.disabled = false; }
});
