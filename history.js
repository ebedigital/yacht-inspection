// Read-only inspection history for approved Firebase users. Records are saved on demand.
import './firebase-cloud.js';
import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';
import {getFirestore,collection,query,orderBy,limit,getDocs} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';
const auth=getAuth(),db=getFirestore(),host=document.getElementById('cyHistory');
function clean(s){return String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function download(data,id){
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download='inspection-record-'+id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
async function render(){
 if(!auth.currentUser){host.textContent='Sign in to view inspection history.';return;}
 host.textContent='Loading inspection records…';
 try {
  const snap=await getDocs(query(collection(db,'inspections'),orderBy('createdAt','desc'),limit(25)));
  if(snap.empty){host.textContent='No completed inspection records saved yet.';return;}
  host.textContent='';
  for(const record of snap.docs){
   const d=record.data();const row=document.createElement('div');
   row.style.cssText='display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 0;border-bottom:1px solid #34455c';
   const name=document.createElement('span');name.textContent=[d.boat,d.type?.toUpperCase(),d.date].filter(Boolean).join(' · ');
   const btn=document.createElement('button');btn.textContent='Download record JSON';btn.type='button';btn.addEventListener('click',()=>download({...d,recordId:record.id},record.id));
   row.append(name,btn);host.append(row);
  }
 }catch(e){host.textContent='Unable to load records: '+(e.code||e.message);console.error(e);}
}
onAuthStateChanged(auth,u=>{if(u)render();else host.textContent='Sign in to view inspection history.';});
