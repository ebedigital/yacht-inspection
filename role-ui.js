// Role-based presentation only; security is enforced by Firestore rules.
// The UI never grants permissions merely because a button is hidden/shown.
import './firebase-cloud.js';
import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';
import {getFirestore,doc,getDoc} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';
const auth=getAuth(),db=getFirestore();
let currentRole='none';
function roleFor(user){
 if(!user)return Promise.resolve('none');
 return getDoc(doc(db,'users',user.uid)).then(s=>{
  const p=s.exists()?s.data():{};
  return p.active===true && (p.role==='admin'||p.role==='technician')?p.role:'none';
 });
}
function restrict(){
 const technician=currentRole==='technician';
 document.documentElement.dataset.cyRole=currentRole;
 if(!technician)return;
 // Different admin-only controls in the original Weekly and Monthly forms.
 document.querySelectorAll('[data-cy-admin-only],#manageWeekly,#boatModal,#cyCloudPush').forEach(el=>{
  el.hidden=true;
  el.style.setProperty('display','none','important');
 });
 document.querySelectorAll('button').forEach(btn=>{
  if(/manage boats|export boat list|import boat list|upload checklists|download checklists/i.test(btn.textContent||'')){
   btn.hidden=true;btn.style.setProperty('display','none','important');
  }
 });
 // Hide dynamically inserted legacy cloud toolbar for technician.
 document.querySelectorAll('#cyCloudPanel button').forEach(btn=>{
  if(/upload|download/i.test(btn.textContent||'')){
   btn.hidden=true;btn.style.setProperty('display','none','important');
  }
 });
}
onAuthStateChanged(auth,async user=>{
 try{currentRole=await roleFor(user);}catch(err){console.error('Role UI lookup failed',err);currentRole='none';}
 restrict();
});
const observer=new MutationObserver(()=>restrict());
observer.observe(document.documentElement,{subtree:true,childList:true});
