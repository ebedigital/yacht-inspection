// Combined Yachting staged feature: automatic checklist sync + explicit completed-inspection archive.
// Requires firebase-cloud.js (existing configured copy) and admin/technician Firestore rules.
import './firebase-cloud.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';
import { getFirestore, doc, collection, onSnapshot, getDoc, setDoc, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';
const auth=getAuth(), db=getFirestore();
const weekly=/weekly\.html$/i.test(location.pathname);
const kind=weekly?'weekly':'monthly', key=weekly?'cy-weekly-boats-v2':'cy-managed-boats-v1';
const ref=doc(db,'checklistConfigs',kind);
const box=document.getElementById('cyNextCloudPanel');
const status=document.getElementById('cySyncStatus');
const saveButton=document.getElementById('cySaveRecord');
let unlisten=null, pending=null, editing=false, active=false, role='none', syncReady=false, lastCloud=null, saving=false;
function note(t){if(status)status.textContent='Cloud sync: '+t;}
function localValue(){return localStorage.getItem(key) || '{}';}
function valid(data){return !!data && typeof data==='object' && !Array.isArray(data) && Object.keys(data).length>0;}
function activeUser(){return auth.currentUser && active;}
async function access(user){
 const profile=await getDoc(doc(db,'users',user.uid));
 const d=profile.exists()?profile.data():{};
 return d.active===true && ['admin','technician'].includes(d.role)?d.role:'none';
}
function stop(){if(unlisten){unlisten();unlisten=null;}if(pending)clearTimeout(pending);pending=null;syncReady=false;active=false;role='none';}
async function upload(){
 if(!activeUser()||role!=='admin')return;
 let boats;try{boats=JSON.parse(localValue());}catch{note('Local checklist JSON invalid');return;}
 if(!valid(boats))return;
 const own=JSON.stringify(boats);
 if(own===lastCloud){editing=false;note('Up to date');return;}
 try{
  saving=true;note('Saving checklist changes…');
  await setDoc(ref,{boats,schema:weekly?'weekly-v2':'monthly-v1',updatedAt:serverTimestamp(),updatedBy:auth.currentUser.uid});
  lastCloud=own;editing=false;note('Saved to Firebase');
 }catch(e){note('Save failed — use manual Upload as backup'); console.error('Checklist autosave failed',e);}finally{saving=false;}
}
window.cyChecklistEdited=()=>{
 if(!syncReady||role!=='admin')return;
 editing=true;note('Unsaved checklist edits…');
 clearTimeout(pending);pending=setTimeout(upload,1800);
};
onAuthStateChanged(auth,async user=>{
 stop(); if(!user){box.style.display='none';return;}
 try{role=await access(user);active=role!=='none';
  if(!active){note('Account not approved');box.style.display='block';return;}
  box.style.display='block';saveButton.style.display='inline-block';
  document.documentElement.dataset.cyRole=role;
  if(role==='technician'){
    document.getElementById('cyCloudPush')?.setAttribute('hidden','');
    const manager=document.getElementById('boatModal')||document.getElementById('manageWeekly');
    if(manager)manager.style.display='none'; // UI convenience only; Firestore rules enforce permissions.
  }
  note('Connecting ('+role+')…');
  unlisten=onSnapshot(ref,snap=>{
    if(!snap.exists()){lastCloud=null;syncReady=true;note('No cloud checklist yet. Admin can upload a backup.');return;}
    const data=snap.data();
    if(!valid(data.boats)||data.schema!==(weekly?'weekly-v2':'monthly-v1')){note('Cloud checklist schema mismatch');return;}
    const fromCloud=JSON.stringify(data.boats);
    lastCloud=fromCloud;syncReady=true;
    if(editing||saving){note('Local edit pending; checking cloud version');return;}
    if(localValue()!==fromCloud){
      // Save a local recovery copy, but do not discard an unsaved inspection form.
      const old=localStorage.getItem(key);
      if(old)localStorage.setItem(key+'-autosync-backup-'+Date.now(),old);
      // Do not swap checklist data underneath an unsaved inspection.
      if(window.cyInspectionUnsaved?.()) {
        note('Cloud update available. Save your inspection draft before applying it.');
        return;
      }
      try {
        const applied=window.cyApplyCloudChecklist?.(data.boats)===true;
        if(applied) {
          localStorage.setItem(key,fromCloud);
          note('Latest boats and checkpoints loaded automatically ('+role+')');
        } else {
          note('Cloud update ready; refresh after saving your work.');
        }
      } catch(err) {
        console.error('Checklist UI update failed:',err);
        note('Cloud update needs review; local data kept.');
      }
    }else{note('Up to date ('+role+')');}
  },e=>{syncReady=false;note('Read error: '+(e.code||'unknown'));console.error(e);});
 }catch(e){note('Access check failed: '+e.message);console.error(e);}
});
saveButton.addEventListener('click',async()=>{
 if(!activeUser()){alert('Please sign in to save records.');return;}
 const snap=window.cyInspectionSnapshot?.();
 if(!snap || !snap.boat || !snap.date || !snap.inspector){alert('Please select the boat, date, and inspector first.');return;}
 if(snap.missing){alert('Not Satisfactory findings require notes before cloud saving.');return;}
 if(snap.completed!==snap.total){alert('Complete all checklist items first. You can still use Save Draft locally.');return;}
 const record={...snap,createdAt:serverTimestamp(),createdBy:auth.currentUser.uid,createdByEmail:auth.currentUser.email||'',status:'completed'};
 if(!confirm('Save this completed '+kind+' inspection to Firestore? This records the current answers and checklist, not a PDF file.'))return;
 saveButton.disabled=true;
 try{
   const saved=await addDoc(collection(db,'inspections'),record);
   alert('Inspection record saved to Firestore. ID: '+saved.id+'\nPDFs are still generated locally.');
 }catch(e){alert('Cloud record save failed: '+e.message);console.error(e);}
 finally{saveButton.disabled=false;}
});
