/* Combined Yachting — standalone mobile action menu v3.
 * Works with both approved polished header and legacy header. No Firebase imports.
 * Existing action elements are moved, never cloned, to preserve click handlers.
 */
(() => {
  'use strict';
  const id = 'cy-mobile-menu-v3-styles';
  if (!document.getElementById(id)) {
    const s = document.createElement('style');
    s.id = id;
    s.textContent = `
      .cy-menu-toggle { display:none; align-items:center; justify-content:center; gap:8px; min-height:44px; padding:9px 15px;
        background:#1c2b40; border:1px solid #657a92; border-radius:10px; color:#fff; font:700 14px system-ui,sans-serif; cursor:pointer; }
      .cy-menu-toggle:focus-visible { outline:3px solid #84c8ff; outline-offset:2px; }
      .cy-menu-icon { font-size:22px; line-height:1; }
      @media(max-width:767px) {
        header .cy-menu-toggle { display:inline-flex!important; position:relative; z-index:2; margin-left:auto; }
        header .cy-topbar { display:flex!important; flex-wrap:wrap!important; align-items:center!important; }
        header .cy-topbar>.brand { width:auto!important; max-width:calc(100% - 130px)!important; }
        header .cy-topbar .logo,header .cy-topbar .official-logo { max-width:100%!important; }
        header .cy-page-heading { order:2!important; width:100%!important; padding-left:0!important; border-left:0!important; font-size:18px!important; }
        header .cy-user-bar { order:3!important; width:100%!important; margin-left:0!important; justify-content:space-between!important; }
        header .cy-toolbar { display:none!important; width:100%!important; padding-top:12px!important; }
        header.cy-menu-open .cy-toolbar,
        header .cy-app-head.cy-menu-open .cy-toolbar { display:block!important; }
        header .cy-toolbar .actions { display:grid!important; grid-template-columns:repeat(2,minmax(0,1fr))!important; width:100%!important;
          gap:9px!important; max-height:55vh; overflow-y:auto; overscroll-behavior:contain; }
        header .cy-toolbar .actions >button,header .cy-toolbar .actions >a {
          width:100%!important; min-width:0!important; min-height:44px!important; white-space:normal!important;
          font-size:12px!important; padding:9px 7px!important; overflow-wrap:break-word!important; }
        header .cy-app-head { padding:12px!important; }
      }
      @media(max-width:360px){header .cy-toolbar .actions{grid-template-columns:1fr!important}}
      @media(min-width:768px){header .cy-toolbar{display:block!important}header .cy-menu-toggle{display:none!important}}
      @media print{header .cy-menu-toggle{display:none!important}}
    `;
    document.head.appendChild(s);
  }
  let installedOn = null;
  let initialized = false;
  function install() {
    const header = document.querySelector('header');
    const head = header?.querySelector('.head');
    const actions = head?.querySelector('.actions');
    if (!header || !head || !actions) return false;
    if (head === installedOn && document.getElementById('cy-menu-toggle')) return true;
    // The approved header creates .cy-topbar and .cy-toolbar asynchronously;
    // if present, reuse both. For older versions create only the toolbar wrapper.
    let topbar = head.querySelector('.cy-topbar');
    let toolbar = head.querySelector('.cy-toolbar');
    if (!topbar) {
      topbar = document.createElement('div');
      topbar.className = 'cy-topbar';
      const brand = head.querySelector('.brand');
      if (brand) topbar.append(brand);
      head.prepend(topbar);
    }
    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.className = 'cy-toolbar';
      toolbar.append(actions);
      head.append(toolbar);
    }
    header.querySelector('#cy-menu-toggle')?.remove();
    const button = document.createElement('button');
    button.id = 'cy-menu-toggle';
    button.type = 'button';
    button.className = 'cy-menu-toggle';
    button.setAttribute('aria-controls','cy-mobile-action-menu');
    button.setAttribute('aria-expanded','false');
    button.setAttribute('aria-label','Open inspection actions menu');
    button.innerHTML = '<span class="cy-menu-icon" aria-hidden="true">☰</span><span class="cy-menu-label">Menu</span>';
    toolbar.id='cy-mobile-action-menu';
    topbar.append(button);
    const setOpen=(open)=>{
      const next=Boolean(open) && window.matchMedia('(max-width:767px)').matches;
      header.classList.toggle('cy-menu-open', next);
      head.classList.toggle('cy-menu-open', next);
      button.setAttribute('aria-expanded',String(next));
      button.setAttribute('aria-label',next?'Close inspection actions menu':'Open inspection actions menu');
      button.querySelector('.cy-menu-icon').textContent=next?'×':'☰';
      button.querySelector('.cy-menu-label').textContent=next?'Close':'Menu';
    };
    button.addEventListener('click',()=>setOpen(button.getAttribute('aria-expanded')!=='true'));
    toolbar.addEventListener('click',e=>{
      if (e.target.closest('button,a') && window.matchMedia('(max-width:767px)').matches) setOpen(false);
    });
    if (!initialized) {
      document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelector('#cy-menu-toggle')?.click()});
      window.addEventListener('resize',()=>{if(window.innerWidth>=768){header.classList.remove('cy-menu-open');head.classList.remove('cy-menu-open');button.setAttribute('aria-expanded','false');}});
      initialized=true;
    }
    installedOn=head;
    return true;
  }
  // Run after module scripts have had a chance to build the approved header.
  const start=()=>{
    let ticks=0;
    const timer=setInterval(()=>{
      ticks++;
      const headerIsPolished=Boolean(document.querySelector('header .cy-app-head .cy-topbar'));
      if (headerIsPolished || ticks>=6) {
        if (install() && headerIsPolished) {clearInterval(timer);return;}
      }
      if(ticks>=60)clearInterval(timer);
    },200);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
