// Read-only page builder. Print one generated page for review; callers apply patches.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require=createRequire(import.meta.url);
const {t}=require('../zh/ui.js');
const root=new URL('../',import.meta.url);
export const ZH_PAGES=['checkin-page',...['4','120','60'].flatMap(form=>['checkin-'+form,...[1,2,3,4].map(n=>'checkin-'+form+'-g'+n)])];
const NOTICE='简体中文译稿尚未经过独立的语言或心理测量验证。题目与原版逐项对应，计分规则不变。';
export function buildZhPage(page){
 if(!ZH_PAGES.includes(page))throw new Error('Unknown Chinese page');
 let html=readFileSync(new URL(page+'.html',root),'utf8');
 html=html.replace(/\s*<link rel="alternate" hreflang="[^"]+" href="[^"]+">/g,'').replace(/<a[^>]*data-language-switch[^>]*>[\s\S]*?<\/a>/g,'');
 const english='https://www.histi.org/'+page,canonical='https://www.histi.org/zh/'+page;
 const data=JSON.parse(html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1]);
 const group=page.match(/-g([1-4])$/)?.[1],form=page.includes('120')?'HISTI-120':page.includes('60')?'HISTI-60':'HISTI 完整版';
 const people=['陌生人／一般人','熟人','朋友','配偶／伴侣'];
 const title=page==='checkin-page'?'选择测评 | HISTI 简体中文':group?`${people[Number(group)-1]} | ${form} 简体中文`:`选择分享对象 | ${form} 简体中文`;
 const description='HISTI 简体中文版：思考自己愿意与谁分享哪些信息。只选择档位，不填写真实隐私信息。答案与进度仅保存在此浏览器。';
 Object.assign(data,{'@id':canonical+'#webpage',url:canonical,name:title,description,inLanguage:'zh-CN',translationOfWork:{'@id':english+'#webpage'}});
 data.isPartOf.disambiguatingDescription='HISTI（Human Information-Sharing Transparency Index）是关于信息分享意愿的自我反思工具，不是学业考试、医学资源或组织。';
 html=html.replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/,`<script type="application/ld+json" id="histi-page-metadata">\n${JSON.stringify(data,null,2)}\n  </script>`);
 html=html.replace('<html lang="en">','<html lang="zh-CN">').replace(/<title>[^<]+<\/title>/,`<title>${title}</title>`);
 html=html.replace(/<meta (name|property)="(description|og:description|twitter:description)" content="[^"]*">/g,(_,kind,key)=>`<meta ${kind}="${key}" content="${description}">`);
 html=html.replace(/<meta (name|property)="(og:title|twitter:title)" content="[^"]*">/g,(_,kind,key)=>`<meta ${kind}="${key}" content="${title}">`);
 html=html.replaceAll(english,canonical);
 // Restore the source-language reference after canonical replacement.
 html=html.replace(/("translationOfWork":\s*\{\s*"@id": ")[^"]+/,`$1${english}#webpage`);
 html=html.replace('</head>',`  <link rel="alternate" hreflang="en" href="${english}">\n  <link rel="alternate" hreflang="zh-CN" href="${canonical}">\n  <link rel="stylesheet" href="/zh/typography.css?v=1">\n</head>`);
 html=html.replace(/<script src="\/site-settings.js\?v=4"><\/script>/,'<script src="/zh/ui.js?v=1"></script>\n  <script src="/site-settings.js?v=locale-1"></script>');
 html=html.replaceAll('/histi4-privacy.js?v=settings-1','/histi4-privacy.js?v=locale-1').replaceAll('/app-histi4.js?v=school-editions-1','/app-histi4.js?v=locale-1');
 const parts=html.split('</head>');
 parts[1]=parts[1].replace(/>([^<>]+)</g,(all,text)=>'>'+t(text)+'<')
  .replace(/(aria-label|title|data-reading-simple)="([^"]*)"/g,(_,key,text)=>`${key}="${t(text)}"`)
  .replace(/href="(\/checkin-(?:page|4|120|60)(?:-g[1-4])?)"/g,'href="/zh$1"')
  .replaceAll('href="/"','href="/zh/checkin-page"').replaceAll('href="/#formats"','href="/zh/checkin-page"');
 html=parts.join('</head>');
 html=html.replace(/<footer[\s\S]*?<\/footer>/g,footer=>footer.replace('href="/privacy">隐私政策（英文）','href="/privacy" aria-label="隐私政策（英文）" title="隐私政策（英文）">隐私政策').replace('href="/terms">使用条款（英文）','href="/terms" aria-label="使用条款（英文）" title="使用条款（英文）">使用条款'));
 html=html.replace('<h1 id="intro-title">分享对象： <span id="intro-recipient"></span>.</h1>','<h1 id="intro-title">分享对象：<span id="intro-recipient"></span></h1>');
 const switchLink=`<a class="language-link" href="/${page}" lang="en" hreflang="en">English</a>`;
 html=html.replace('<div class="histi-header-actions">',`<div class="histi-header-actions">${switchLink}`);
 if(page==='checkin-page'){
  html=html.replace(/      <section class="pace-guide"[\s\S]*?      <\/section>\n/,'');
  html=html.replace(/      <section class="selector-library selector-misc"[\s\S]*?      <\/section>/,'      <section class="selector-library selector-misc" aria-labelledby="misc-checkins-title"><div class="selector-library-heading"><div><p>其他情境，不同视角</p><h2 id="misc-checkins-title">其他测评</h2></div></div><p>学校版及其他测评目前仅提供英文。</p><a class="language-link" href="/checkin-page#misc-checkins-title" lang="en">查看其他测评（英文） ↗</a></section>');
  html=html.replace('<p class="visitor-help">',`<p class="translation-note">${NOTICE}</p><p class="visitor-help">`);
 }else html=html.replace('<section class="start-card"',`<p class="translation-note">${NOTICE}</p>\n      <section class="start-card"`);
 if(group)html=html.replace('<div class="result-disclaimer">',`<p class="translation-note">${NOTICE}</p><div class="result-disclaimer">`);
 return html;
}
if(process.argv[1]===fileURLToPath(import.meta.url))process.stdout.write(JSON.stringify(buildZhPage(process.argv[2])));
