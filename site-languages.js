import {openDialog,closeDialog,closeDialogImmediately} from './site-dialogs.js?v=utility-1';

export const LANGUAGES=Object.freeze([
 {code:'en',prefix:'',name:'English',word:'Language'},
 {code:'zh-CN',prefix:'zh',name:'简体中文',word:'语言'},
 {code:'es',prefix:'es',name:'Español',word:'Idioma'}
]);
const PAGES=new Set(['','privacy','terms','checkin-page',...['4','120','60'].flatMap(n=>['checkin-'+n,...[1,2,3,4].map(g=>'checkin-'+n+'-g'+g)])]);
export function languageTarget(pathname,code,search='',hash=''){
 const language=LANGUAGES.find(l=>l.code===code)||LANGUAGES[0];
 const page=pathname.replace(/^\/(?:zh|es)(?=\/|$)/,'').replace(/^\/+|\/+$/g,'').replace(/\.html$/,'').replace(/^index$/,'');
 const supported=PAGES.has(page),fallback=language.prefix&&!supported;
 const destination=fallback?'checkin-page':page;
 const path=(language.prefix?'/'+language.prefix:'')+'/'+destination;
 const debug=/^checkin-(4|120|60)-g[1-4]$/.test(destination)&&new URLSearchParams(search).get('debug')==='1'?'?debug=1':'';
 return {href:path+debug+(fallback?'':hash),fallback:Boolean(fallback)};
}

if(typeof document!=='undefined'){
 const t=value=>window.HISTI_LOCALE?.t(value)??value;
 const current=LANGUAGES.find(l=>l.code===document.documentElement.lang)||LANGUAGES[0];
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=t(text);return n;};
 function init(){
  if(document.getElementById('histi-language-btn'))return;
  const trigger=el('button','histi-language-trigger');trigger.id='histi-language-btn';trigger.type='button';
  trigger.setAttribute('aria-label',t('Language'));trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-controls','histi-language-dialog');trigger.setAttribute('aria-expanded','false');
  const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');
  for(const [tag,attributes] of [['circle',{cx:12,cy:12,r:9}],['ellipse',{cx:12,cy:12,rx:4,ry:9}],['path',{d:'M3 12h18'}]]){const n=document.createElementNS(icon.namespaceURI,tag);for(const [k,v]of Object.entries(attributes))n.setAttribute(k,v);icon.append(n);}
  const cycle=el('span','histi-language-cycle');cycle.setAttribute('aria-hidden','true');
  const words=el('span','histi-language-words');
  [...LANGUAGES,LANGUAGES[0]].forEach((language,index)=>{const word=el('span','histi-language-word');word.textContent=language.word;word.lang=language.code;if(index<LANGUAGES.length&&language.code===current.code)word.dataset.current='';words.append(word);});
  cycle.append(words);
  trigger.append(icon,cycle);
  const dialog=el('dialog','histi-language-dialog');dialog.id='histi-language-dialog';dialog.dataset.popupMotion='utility';dialog.setAttribute('aria-labelledby','histi-language-title');
  const head=el('div','histi-language-head'),title=el('h2','','Language');title.id='histi-language-title';
  const close=el('button','histi-language-close','Close');close.type='button';close.setAttribute('aria-label',t('Close language settings'));close.addEventListener('click',()=>{void closeDialog(dialog);});head.append(title,close);
  const intro=el('p','histi-language-intro','Make yourself at home.');
  const field=el('fieldset','histi-language-options');field.append(el('legend','visually-hidden','Website language'));
  const apply=el('a','histi-language-apply','Switch language');
  const note=el('p','histi-language-note','Answers are saved separately for each language. Switching does not erase your progress.');note.id='histi-language-note';
  const availability=el('p','histi-language-availability');availability.setAttribute('role','status');
  let selected=current.code;
  function update(){
   const destination=languageTarget(location.pathname,selected,location.search,location.hash);
   const same=selected===current.code;
   apply.setAttribute('aria-disabled',String(same));
   if(same){apply.removeAttribute('href');apply.tabIndex=-1;}else{apply.href=destination.href;apply.removeAttribute('tabindex');}
   apply.textContent=t(same?'Current language':'Switch language');
   availability.textContent=destination.fallback?t('This page is English-only. This opens the translated check-in selector instead.'):'\u00a0';
   for(const input of field.querySelectorAll('input'))input.checked=input.value===selected;
  }
  for(const language of LANGUAGES){
   const row=el('label','histi-language-option'),input=el('input');input.type='radio';input.name='histi-language';input.value=language.code;input.checked=language.code===current.code;
   const name=el('span','histi-language-name');name.textContent=language.name;name.lang=language.code;name.dataset.noTranslate='';
   const detail=el('small','',language.code===current.code?'Current language':language.code==='zh-CN'?'Simplified Chinese':language.code==='es'?'Spanish':'English');
   const check=el('span','histi-language-check','✓');check.setAttribute('aria-hidden','true');
   row.append(input,name,detail,check);field.append(row);input.addEventListener('change',()=>{selected=language.code;update();});
  }
  apply.setAttribute('aria-describedby',note.id);apply.addEventListener('click',event=>{
   if(apply.getAttribute('aria-disabled')==='true'){event.preventDefault();return;}
   // Dismiss the top-layer panel while the normal page veil fades in behind it.
   void closeDialog(dialog);
  });
  dialog.append(head,intro,field,availability,apply,note);document.body.append(dialog);
  let dock=document.querySelector('.histi-utility-dock');
  if(!dock){dock=el('div','histi-utility-dock');document.body.append(dock);}
  dock.append(trigger);
  const open=()=>{
   window.HISTI_SETTINGS?.closeImmediately?.();
   if(document.querySelector('dialog[open]'))return;
   selected=current.code;update();openDialog(dialog,trigger);dialog.scrollTop=0;
   trigger.setAttribute('aria-expanded','true');field.querySelector('input:checked')?.focus({preventScroll:true});
  };
  trigger.addEventListener('click',open);
  dialog.addEventListener('close',()=>{if(dialog.open)return;trigger.setAttribute('aria-expanded','false');if(!document.hidden&&!document.querySelector('dialog[open]'))trigger.focus({preventScroll:true});});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)void closeDialog(dialog);});
  window.HISTI_LANGUAGES={open,closeImmediately:()=>closeDialogImmediately(dialog)};update();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
}
