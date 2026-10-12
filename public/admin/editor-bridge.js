(() => {
  if (parent === window) return;
  const style=document.createElement('style');style.textContent='[data-cms-node]:hover{outline:2px dashed #a43d1b!important;outline-offset:4px;cursor:pointer!important}[data-cms-selected]{outline:3px solid #a43d1b!important;outline-offset:4px}.reveal{opacity:1!important;transform:none!important}';document.head.append(style);
  // Editing mode freezes carousels and counters so the source wording remains selectable.
  document.querySelectorAll('form').forEach(f=>f.addEventListener('submit',e=>e.preventDefault()));
  document.addEventListener('click',event=>{
    event.preventDefault();event.stopImmediatePropagation();
    const element=event.target.closest('[data-cms-node]');if (!element) return;
    document.querySelector('[data-cms-selected]')?.removeAttribute('data-cms-selected');element.setAttribute('data-cms-selected','');
    parent.postMessage({type:'AOL_SELECT',node:element.dataset.cmsNode},location.origin);
  },true);
  window.addEventListener('message',event=>{
    if (event.origin!==location.origin || event.source!==parent) return;
    const d=event.data;if (!d || d.type!=='AOL_PATCH') return;
    for (const f of d.fields || []) {
      const n=document.querySelector(`[data-cms-node="${CSS.escape(f.node)}"]`);if (!n) continue;
      if (f.attribute) {n.setAttribute(f.attribute,f.value);if (f.attribute==='src' && n.tagName==='IMG') n.removeAttribute('srcset');}
      else {const child=n.childNodes[f.index];if (child?.nodeType===3) child.nodeValue=f.value;}
    }
  });
  parent.postMessage({type:'AOL_READY'},location.origin);
})();
