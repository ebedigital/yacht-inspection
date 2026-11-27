// Approved responsive header for both inspection pages.
// Presentation only: leaves original button event handlers, Firebase rules, and PDFs intact.
import './firebase-cloud.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';

const headingByPage = /weekly\.html$/i.test(location.pathname) ? 'Weekly Inspection' : 'Monthly Inspection';
const head = document.querySelector('header .head');
const brand = head?.querySelector('.brand');
const actions = head?.querySelector('.actions');

if (head && brand && actions) {
  // Reuse the actual embedded company logo, not a replacement image.
  brand.querySelector('small')?.remove();
  const top = document.createElement('div');
  top.className = 'cy-topbar';
  const title = document.createElement('h2');
  title.className = 'cy-page-heading';
  title.textContent = headingByPage;
  const account = document.createElement('div');
  account.className = 'cy-user-bar';
  const welcome = document.createElement('span');
  welcome.className = 'cy-welcome';
  welcome.textContent = 'Welcome';
  account.append(welcome);
  top.append(brand, title, account);
  const toolbar = document.createElement('div');
  toolbar.className = 'cy-toolbar';
  toolbar.append(actions);
  head.replaceChildren(top, toolbar);
  head.classList.add('cy-app-head');

  // The existing firebase-cloud.js creates controls asynchronously in #cyCloudPanel.
  // Move the live button elements (NOT clones), retaining the original click listeners.
  // Idempotent moves avoid a MutationObserver feedback loop / blinking.
  const placeCloudActions = () => {
    const cloud = document.getElementById('cyCloudPanel');
    if (!cloud) return;
    const moveToToolbar = id => {
      const el=document.getElementById(id);
      if (el && el.parentElement !== actions) actions.append(el);
    };
    moveToToolbar('cyCloudPush');
    moveToToolbar('cyCloudPull');
    for (const id of ['cyCloudLogout','cyCloudLogin']) {
      const el = document.getElementById(id);
      if (el && el.parentElement !== account) account.append(el);
    }
  };
  placeCloudActions();
  // Observe only the original toolbar for initial injection; disconnect after controls appear.
  const observer = new MutationObserver(() => {
    placeCloudActions();
    if (document.getElementById('cyCloudLogout')?.parentElement === account &&
        document.getElementById('cyCloudPush')?.parentElement === actions) observer.disconnect();
  });
  observer.observe(head, {childList:true,subtree:true});
  // If the cloud script inserted controls somewhere outside the header, catch them once.
  if (!document.getElementById('cyCloudPanel')) {
    const outside = new MutationObserver(() => {
      placeCloudActions();
      if (document.getElementById('cyCloudPanel')) outside.disconnect();
    });
    outside.observe(document.body, {childList:true});
  }

  // Friendly greeting based on the authenticated Firebase account.
  // Use profiles' displayName when available, otherwise known pilot account UIDs.
  const knownNames = {
    'HjzA8XMt09hjgK4g6y8ZrkXG67y1': 'John',
    'XSk9Kh3SM8aOPbQh9JkOXJBpAqf2': 'Sheree',
    'xVGIg3BXmHcnz921Pok5Ow9PPEc2': 'Travis'
  };
  onAuthStateChanged(getAuth(), user => {
    const name = user ? (user.displayName || knownNames[user.uid] || user.email?.split('@')[0] || 'Team Member') : '';
    welcome.textContent = user ? `Welcome, ${name}` : 'Welcome';
  });
}
