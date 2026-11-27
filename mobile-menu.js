// Combined Yachting: responsive mobile action menu for Weekly and Monthly.
// The original buttons are not cloned, so their existing handlers stay attached.
import './header-polish.js';

const header = document.querySelector('header .cy-app-head');
const topbar = header?.querySelector('.cy-topbar');
const toolbar = header?.querySelector('.cy-toolbar');
if (header && topbar && toolbar) {
  const style = document.createElement('style');
  style.textContent = `
    .cy-menu-toggle { display:none; align-items:center; justify-content:center; gap:9px;
      min-height:44px; min-width:100px; background:#1c2b40; color:#f2f5fa;
      border:1px solid #526984; border-radius:10px; font-weight:750; cursor:pointer; }
    .cy-menu-toggle .cy-menu-icon { font-size:22px; line-height:1; }
    @media (max-width: 767px) {
      header .cy-topbar { align-items:center!important; flex-wrap:wrap; gap:10px!important; }
      header .cy-topbar .brand { width:auto!important; max-width:calc(100% - 118px)!important; }
      header .cy-topbar .brand .official-logo,
      header .cy-topbar .brand .logo { width:min(205px, 100%)!important; }
      header .cy-page-heading { order:2!important; width:100%; padding:0!important;
        margin:0!important; border:0!important; font-size:18px!important; }
      header .cy-user-bar { order:3!important; width:100%!important;
        margin:0!important; justify-content:space-between!important; gap:9px!important; }
      header .cy-welcome { font-size:14px!important; white-space:normal!important; }
      header .cy-user-bar button { min-height:38px; padding:7px 12px!important; }
      header .cy-menu-toggle { display:inline-flex!important; order:1; margin-left:auto; }
      header .cy-toolbar { display:none!important; padding:12px 0 0!important; }
      header .cy-app-head.cy-menu-open .cy-toolbar { display:block!important; }
      header .cy-toolbar .actions { display:grid!important; grid-template-columns:1fr 1fr;
        align-items:stretch!important; gap:9px!important; width:100%!important;
        max-height:min(55vh,440px); overflow-y:auto; overscroll-behavior:contain; }
      header .cy-toolbar .actions > button,
      header .cy-toolbar .actions > a { width:100%!important; min-width:0!important;
        white-space:normal!important; overflow-wrap:break-word; min-height:46px!important;
        font-size:12px!important; padding:10px 8px!important; }
      header .head.cy-app-head { padding:12px 14px!important; }
      header .cy-topbar { padding-bottom:11px!important; }
    }
    @media (max-width: 380px) {
      header .cy-toolbar .actions { grid-template-columns:1fr; }
    }
    @media (min-width: 768px) {
      header .cy-toolbar { display:block!important; }
      header .cy-menu-toggle { display:none!important; }
    }
    @media print { .cy-menu-toggle { display:none!important; } }
  `;
  document.head.append(style);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'cy-menu-toggle';
  button.setAttribute('aria-label', 'Open inspection actions menu');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'cy-mobile-action-menu');
  button.innerHTML = '<span class="cy-menu-icon" aria-hidden="true">☰</span><span class="cy-menu-label">Menu</span>';
  toolbar.id = 'cy-mobile-action-menu';
  topbar.append(button);

  const isMobile = () => matchMedia('(max-width: 767px)').matches;
  const setOpen = open => {
    const next = Boolean(open) && isMobile();
    header.classList.toggle('cy-menu-open', next);
    button.setAttribute('aria-expanded', String(next));
    button.setAttribute('aria-label', next ? 'Close inspection actions menu' : 'Open inspection actions menu');
    button.querySelector('.cy-menu-icon').textContent = next ? '×' : '☰';
    button.querySelector('.cy-menu-label').textContent = next ? 'Close' : 'Menu';
  };
  button.addEventListener('click', () => setOpen(!header.classList.contains('cy-menu-open')));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && header.classList.contains('cy-menu-open')) {
      setOpen(false);
      button.focus();
    }
  });
  document.addEventListener('pointerdown', event => {
    if (header.classList.contains('cy-menu-open') && !header.contains(event.target)) setOpen(false);
  });
  toolbar.addEventListener('click', event => {
    if (isMobile() && event.target.closest('button, a')) setOpen(false);
  });
  matchMedia('(min-width: 768px)').addEventListener('change', event => {
    if (event.matches) setOpen(false);
  });
}
