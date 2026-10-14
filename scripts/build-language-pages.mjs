// Read-only deterministic page builder. Callers apply reviewed source patches.
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),root=new URL('../',import.meta.url);
export const TRANSLATED_PAGES=['index','privacy','terms','checkin-page',...['4','120','60'].flatMap(n=>['checkin-'+n,...[1,2,3,4].map(g=>'checkin-'+n+'-g'+g)])];
export const pathFor=(locale,page)=>'/'+(locale?locale+'/':'')+(page==='index'?'':page);
const config={
 zh:{lang:'zh-CN',name:'简体中文',people:['陌生人／一般人','熟人','朋友','配偶／伴侣'],full:'HISTI 完整版',home:'你的分享，你的关系，你的边界。',selector:'选择测评',recipient:'选择分享对象',privacy:'隐私政策',terms:'使用条款',description:'HISTI 人际信息分享透明度指数：思考愿意与谁分享哪些信息。只选择档位，不填写真实隐私。答案与进度仅保存在此浏览器。',notice:'简体中文译稿尚未经过独立的语言或心理测量验证。题目与原版逐项对应，计分规则不变。',misc:'学校版及其他测评目前仅提供英文。',miscLink:'查看其他测评（英文） ↗'},
 es:{lang:'es',name:'Español',people:['Persona desconocida','Persona conocida','Amistad','Cónyuge o pareja'],full:'HISTI completo',home:'Lo que compartes. Tus personas. Tus límites.',selector:'Elige tu check-in',recipient:'Elige una persona',privacy:'Política de privacidad',terms:'Condiciones de uso',description:'HISTI en español: reflexiona sobre qué compartirías y con quién. Elige niveles, no datos privados reales. Tus respuestas y tu progreso se quedan en este navegador.',notice:'La traducción al español no ha pasado una validación lingüística o psicométrica independiente. Corresponde al original pregunta por pregunta y conserva sus reglas de puntuación.',misc:'Las ediciones escolares y los demás tests están disponibles solo en inglés.',miscLink:'Ver otros tests (en inglés) ↗'}
};
const decode=s=>s.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#39;',"'");
const escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
export function buildLanguagePage(locale,page){
 if(!config[locale]||!TRANSLATED_PAGES.includes(page))throw new Error('Unknown translated page');
 const c=config[locale],{t}=require('../'+locale+'/ui.js'),copy=require('../'+locale+'/visitor-text.js');
 const tr=value=>{const s=decode(value.trim()),mapped=copy[s]??t(s);return mapped===s?value:value.replace(value.trim(),escape(mapped));};
 let html=readFileSync(new URL(page+'.html',root),'utf8').replace(/\s*<link rel="alternate" hreflang="[^"]+" href="[^"]+">/g,'').replace(/<a[^>]*data-language-switch[^>]*>[\s\S]*?<\/a>/g,'');
 const canonical='https://www.histi.org'+pathFor(locale,page),english='https://www.histi.org'+pathFor('',page);
 const group=page.match(/-g([1-4])$/)?.[1],form=page.includes('120')?'HISTI-120':page.includes('60')?'HISTI-60':c.full;
 const title=(page==='index'?c.home:page==='privacy'?c.privacy:page==='terms'?c.terms:page==='checkin-page'?c.selector:group?c.people[Number(group)-1]+' | '+form:c.recipient+' | '+form)+' | HISTI '+c.name;
 const data={'@context':'https://schema.org','@type':'WebPage','@id':canonical+'#webpage',url:canonical,name:title,description:c.description,inLanguage:c.lang,isPartOf:{'@id':'https://www.histi.org/#website',name:'HISTI',alternateName:'Human Information-Sharing Transparency Index'},translationOfWork:{'@id':english+'#webpage'}};
 const metadata=`<script type="application/ld+json" id="histi-page-metadata">\n${JSON.stringify(data,null,2)}\n  </script>`;
 if(/<script type="application\/ld\+json"/.test(html))html=html.replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/,metadata);else html=html.replace('</head>',metadata+'\n</head>');
 html=html.replace('<html lang="en"','<html lang="'+c.lang+'"').replace(/<title>[^<]+<\/title>/,'<title>'+title+'</title>');
 html=html.replace(/<meta (name|property)="(description|og:description|twitter:description)" content="[^"]*">/g,(_,kind,key)=>`<meta ${kind}="${key}" content="${c.description}">`).replace(/<meta (name|property)="(title|og:title|twitter:title)" content="[^"]*">/g,(_,kind,key)=>`<meta ${kind}="${key}" content="${title}">`);
 html=html.replace(/<link rel="canonical" href="[^"]+">/,'<link rel="canonical" href="'+canonical+'">').replace(/<meta property="og:url" content="[^"]+">/,'<meta property="og:url" content="'+canonical+'">');
 html=html.replace(/<script src="\/site-settings.js\?v=[^"]+"><\/script>/,`${['index','privacy','terms'].includes(page)?`<script src="/${locale}/visitor-text.js?v=1"></script>\n  `:''}<script src="/${locale}/ui.js?v=3"></script>\n  <script src="/site-settings.js?v=locale-3"></script>`);
 html=html.replace('</head>',['en','zh-CN','es'].map((lang,i)=>`  <link rel="alternate" hreflang="${lang}" href="https://www.histi.org${pathFor(['','zh','es'][i],page)}">`).join('\n')+(locale==='zh'?'\n  <link rel="stylesheet" href="/zh/typography.css?v=3">':'')+'\n</head>');
 const parts=html.split('</head>');
 parts[1]=parts[1].replace(/>([^<>]+)</g,(_,text)=>'>'+tr(text)+'<').replace(/(aria-label|title|data-reading-simple|data-reading-standard)="([^"]*)"/g,(_,key,text)=>`${key}="${tr(text)}"`)
  .replace(/href="(\/(?:checkin-(?:page|4|120|60)(?:-g[1-4])?|privacy|terms)?)(#[^"]*)?"/g,(_,path,hash='')=>`href="/${locale}${path}${hash}"`)
  .replace(/href="\/(#[^"]*)"/g,`href="/${locale}/$1"`);
 html=parts.join('</head>');
 if(page==='checkin-page')html=html.replace(/      <section class="selector-library selector-misc"[\s\S]*?      <\/section>/,`      <section class="selector-library selector-misc" aria-labelledby="misc-checkins-title"><div class="selector-library-heading"><div><h2 id="misc-checkins-title">${locale==='zh'?'其他测评':'Otros tests'}</h2></div></div><p>${c.misc}</p><a class="home-text-link" href="/checkin-page#misc-checkins-title" lang="en">${c.miscLink}</a></section>`);
 if(!['index','privacy','terms'].includes(page)){
  if(page==='checkin-page')html=html.replace('<p class="visitor-help">',`<p class="translation-note">${c.notice}</p><p class="visitor-help">`);
  else html=html.replace('<section class="start-card"',`<p class="translation-note">${c.notice}</p>\n      <section class="start-card"`);
  if(group)html=html.replace('<div class="result-disclaimer">',`<p class="translation-note">${c.notice}</p><div class="result-disclaimer">`);
 }
 if(locale==='zh')html=html.replace('<h1 id="intro-title">分享对象： <span id="intro-recipient"></span>.</h1>','<h1 id="intro-title">分享对象：<span id="intro-recipient"></span></h1>');
 return html;
}
if(process.argv[1]===fileURLToPath(import.meta.url))process.stdout.write(JSON.stringify(buildLanguagePage(process.argv[2],process.argv[3])));
