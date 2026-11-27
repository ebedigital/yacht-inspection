// Combined Yachting — Firebase Cloud Pilot (boat checklist sync)
// Load with <script type="module" src="./firebase-cloud.js"></script> on both pages.
// Do not put service account keys, JobTread credentials, or passwords here.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';

// Paste the EXACT configuration from Firebase Console > Project settings > Your apps.

const firebaseConfig = {
  apiKey: "AIzaSyDySljoNGxGttYptehzi2F4hm2GkF3r3yo",
  authDomain: "combined-yachting-inspection.firebaseapp.com",
  projectId: "combined-yachting-inspection",
  storageBucket: "combined-yachting-inspection.firebasestorage.app",
  messagingSenderId: "984961684653",
  appId: "1:984961684653:web:e08ab45a3c4980a3a9e224"
};


const isWeekly = /weekly\.html$/i.test(location.pathname);
const storageKey = isWeekly ? 'cy-weekly-boats-v2' : 'cy-managed-boats-v1';
const remoteId = isWeekly ? 'weekly' : 'monthly';
const label = isWeekly ? 'Weekly' : 'Monthly';
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const ref = doc(db, 'checklistConfigs', remoteId);
let signedIn = false;

function addToolbar() {
  const host = document.querySelector('header .actions') || document.querySelector('header') || document.body;
  const wrap = document.createElement('div');
  wrap.id = 'cyCloudPanel';
  wrap.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;gap:7px;padding:5px;font-size:12px';
  const status = document.createElement('span'); status.id = 'cyCloudStatus'; status.textContent = 'Cloud: signed out';
  status.style.cssText = 'color:#a9c1dc;margin-right:5px';
  wrap.append(status);
  for (const [id, text] of [['cyCloudLogin','Cloud Login'],['cyCloudPush','Upload Checklists'],['cyCloudPull','Download Checklists'],['cyCloudLogout','Logout']]) {
    const btn = document.createElement('button'); btn.type='button';btn.id=id;btn.textContent=text;
    btn.style.cssText='font-size:12px;padding:8px 10px';wrap.append(btn);
  }
  host.append(wrap);
  const $ = id => document.getElementById(id);
  function setStatus(message) { status.textContent = message; }
  function setLoggedIn(user) {
    signedIn=!!user;
    $('cyCloudLogin').hidden=!!user;
    $('cyCloudLogout').hidden=!user;
    $('cyCloudPush').hidden=!user;
    $('cyCloudPull').hidden=!user;
    setStatus(user ? `Cloud: ${user.email || 'signed in'} (${label})` : 'Cloud: signed out');
  }
  onAuthStateChanged(auth, setLoggedIn, err=>setStatus('Cloud auth error: '+err.message));
  $('cyCloudLogin').addEventListener('click', async () => {
    const email = prompt('Firebase account email:');if(!email)return;
    const password = prompt('Firebase password (avoid entering on shared devices):');if(!password)return;
    try { await signInWithEmailAndPassword(auth,email.trim(),password); }
    catch(e) { alert('Firebase sign-in failed: '+e.message); }
  });
  $('cyCloudLogout').addEventListener('click', async()=>{await signOut(auth);});
  $('cyCloudPush').addEventListener('click', async()=>{
    if(!signedIn)return;
    const current=localStorage.getItem(storageKey);
    if(!current){alert('No locally saved boat checklist settings to upload.');return;}
    let data;try{data=JSON.parse(current)}catch{alert('Local checklist JSON is invalid.');return;}
    if(!data || typeof data!=='object' || Array.isArray(data)){alert('Invalid boat settings');return;}
    if(!confirm(`UPLOAD ${label} boat checklists to the shared cloud? This replaces the current cloud copy. Export a JSON backup first.`))return;
    try {
      const existing=await getDoc(ref);
      if(existing.exists() && !confirm('A cloud checklist already exists. Replace it?'))return;
      await setDoc(ref,{boats:data,schema:isWeekly?'weekly-v2':'monthly-v1',updatedAt:serverTimestamp(),updatedBy:auth.currentUser.uid});
      setStatus(`Cloud: ${label} checklists uploaded`);alert('Cloud upload successful.');
    } catch(e){alert('Cloud upload failed: '+e.message);}
  });
  $('cyCloudPull').addEventListener('click', async()=>{
    if(!signedIn)return;
    try {
      const snapshot=await getDoc(ref);
      if(!snapshot.exists()){alert('No uploaded '+label+' checklists found yet.');return;}
      const payload=snapshot.data();
      if(!payload.boats || typeof payload.boats!=='object' || Array.isArray(payload.boats))throw new Error('Cloud data has invalid boat settings');
      if(payload.schema !== (isWeekly?'weekly-v2':'monthly-v1'))throw new Error('Cloud checklist version mismatch');
      if(!confirm(`DOWNLOAD ${label} boat checklists from cloud? This will REPLACE the local boat settings on this browser and reload the page. Make a JSON backup first.`))return;
      const old=localStorage.getItem(storageKey);
      if(old)localStorage.setItem(`${storageKey}-backup-${Date.now()}`,old);
      localStorage.setItem(storageKey,JSON.stringify(payload.boats));
      location.reload();
    }catch(e){alert('Cloud download failed: '+e.message);}
  });
}
addToolbar();
