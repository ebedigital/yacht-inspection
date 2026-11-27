// Unified navigation and login gate for the Firebase test site.
// Uses the SAME initialized Firebase project as the existing firebase-cloud.js.
// Do not store passwords or credentials in this file.
import './firebase-cloud.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';
const auth = getAuth(), db=getFirestore();
async function approved(user) {
 if (!user)return false;
 const snap=await getDoc(doc(db,'users',user.uid));
 const profile=snap.exists()?snap.data():{};
 return profile.active===true && ['admin','technician'].includes(profile.role);
}
const isDashboard = document.body.dataset.cyPage === 'dashboard';
const $ = id => document.getElementById(id);
function makeVisible() { document.getElementById('cy-auth-visibility')?.remove(); document.getElementById('authLoading')?.remove(); }
function goHome() { location.replace('./index.html'); }
function showError(msg) { const n=$('loginError'); if(n){ n.textContent=msg; n.hidden=false; } }
async function showDashboard(user) {
  const profile=await getDoc(doc(db,'users',user.uid));
  const role=profile.exists()?profile.data().role:'none';
  document.documentElement.dataset.cyRole=role;
  if($('userRole')) $('userRole').textContent=role==='admin'?'Administrator':'Technician';
  $('loginView').hidden = true;
  $('dashboardView').hidden = false;
  $('signedInUser').textContent = user.email || 'Authorized user';
}
function showLogin() {
  $('dashboardView').hidden = true;
  $('loginView').hidden = false;
}
if (isDashboard) {
  $('loginForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const email=$('loginEmail').value.trim(),password=$('loginPassword').value;
    const submit=$('loginSubmit');
    submit.disabled=true;submit.textContent='Signing in…';
    $('loginError').hidden=true;
    try {
      await setPersistence(auth,$('rememberMe').checked?browserLocalPersistence:browserSessionPersistence);
      await signInWithEmailAndPassword(auth,email,password);
      $('loginPassword').value='';
    }catch(err){
      // Avoid exposing whether an account exists.
      showError('Could not sign in. Check your email/password and try again.');
      console.error('Firebase sign-in:',err.code||err.message);
    }finally{submit.disabled=false;submit.textContent='Sign In';}
  });
  $('logoutButton').addEventListener('click',()=>signOut(auth));
  onAuthStateChanged(auth,async user=>{
    try { if(user && await approved(user)){showDashboard(user);}
      else {showLogin();if(user)showError('Your account is not yet approved by an administrator.');}
    }catch(e){showLogin();showError('Unable to verify account permissions.');console.error(e);}
    makeVisible();
  },e=>{
    showError('Unable to verify login. Check your internet connection.');showLogin();makeVisible();console.error(e);
  });
}else {
  onAuthStateChanged(auth,async user=>{
    try {if (user && await approved(user)) makeVisible(); else goHome();}
    catch(e){ console.error('Authorization check failed:',e);goHome(); }
  },e=>{console.error('Auth state error:',e);goHome();});
}
