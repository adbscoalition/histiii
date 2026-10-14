import { FULL_TEXT } from './full-text.js';
import { TEXT_120, TEXT_60 } from './short-text.js';
export const RECIPIENTS_ZH = {
 G1:{label:'陌生人／一般人',slug:'stranger',description:'你不认识的人，且对方没有特别需要这些信息的理由。'},
 G2:{label:'熟人',slug:'acquaintance',description:'你一般认识、但不属于亲近圈子的人。'},
 G3:{label:'朋友',slug:'friend',description:'你自己视为朋友的人。'},
 G4:{label:'配偶／伴侣',slug:'partner',description:'你的配偶或稳定交往的恋爱伴侣；需要时可以设想这个情境。'}
};
export const SHARING_ZH = {G1:'陌生人或一般人',G2:'一位熟人',G3:'一位朋友',G4:'配偶或伴侣'};
const LABELS = {
 'Keep completely private':'完全保密','Share narrowly':'少量分享','Context-dependent':'视情况而定','Share openly':'较开放地分享','Share completely openly':'完全开放地分享',
 'Not at all comfortable':'完全不自在','Slightly comfortable':'略感自在','Depends on context':'视情况而定','Comfortable':'感到自在','Completely comfortable':'完全自在','Very comfortable':'很自在',
 'No':'否','Yes':'是','No sharing':'不分享','Very broad information only':'仅非常笼统的信息','Limited detail':'少量细节','Moderate detail / context-dependent':'适量细节／视情况而定','Substantial detail':'较多细节','Nearly complete detail':'几乎全部细节','Full or exact detail':'完整或确切细节',
 'No birthday details':'不分享生日信息','Age range only':'仅年龄段','Exact age':'确切年龄','Birth year':'出生年份','Birth month':'出生月份','Month + day':'月份和日期','Full date of birth':'完整出生日期',
 'State / region':'州／地区','City':'城市','Neighborhood':'社区','Street':'街道','Building / house number':'楼号／门牌号','Apartment / unit':'公寓／单元号',
 'Not willing':'完全不愿意','Slightly willing':'稍微愿意','Generally willing':'总体愿意','Fully willing':'完全愿意','No medical information':'不分享医疗信息','General health status only':'仅大致健康状况','Broad condition category':'大致疾病类别','Specific diagnosis':'具体诊断','Treatment summary':'治疗概况','Detailed medical history':'详细病史','Complete medical record':'完整病历'
};
const CATEGORIES_ZH = {A1:'日常活动',A2:'重大人生事件',B:'基本信息',C:'敏感信息',D:'高度敏感信息'};
const YN_60 = {'A1-003':'喜欢的一位音乐人／艺术家的名字，或一部具体的、最喜欢的电影／节目','A1-010':'你使用的社交平台或社交媒体服务','A1-014':'你希望别人如何联系你或与你沟通','B-001':'你的名字（不含姓氏）','B-005':'你的大致家乡或现居城市／地区，以及所在时区','B-007':'你的网络用户名／账号名，或公开资料的链接'};
// Source variants use repeated category/relationship templates. Preserve their
// differing assumptions (prior knowledge, shared events, and practical need).
function variants(row, topic, format) {
 const category=row[0].split('-')[0], short=format==='60', subject=short&&row[3]==='yn'?YN_60[row[0]]:topic;
 if(row[3]==='yn') return category==='A1' ? [
  `对方之前并不了解你，你们也没有共同经历。你会向这位对象分享以下信息吗：${subject}？`,
  `对方与你一般认识，但不知道这项具体信息。你会向对方分享以下信息吗：${subject}？`,
  `对方可能知道大致情况。如果这位朋友还不知道这项细节，你会分享以下信息吗：${subject}？`,
  `对方可能因你们共同的生活而已经知道这些。如果配偶或伴侣还不知道，你会与对方分享或讨论以下信息吗：${subject}？`
 ] : [
  `对方之前并不了解你。你会向这位对象分享以下个人基本信息吗：${subject}？`,
  `对方与你一般认识。如果对方还不知道，你会分享以下基本信息吗：${subject}？`,
  `对方可能知道你的一些基本情况。如果对方还不知道这项细节，你会分享以下信息吗：${subject}？`,
  `对方可能因你们共同的生活而知道一些基本情况。如果对方还不知道这项细节，你会分享以下信息吗：${subject}？`
 ];
 if(category==='A1') return [
  `对方之前并不了解你，你们也没有共同经历。向这位对象分享有关“${topic}”的信息，你会觉得多自在？`,
  `对方与你一般认识，但不知道这些具体细节。向对方分享有关“${topic}”的信息，你会觉得多自在？`,
  `对方可能已经知道大致情况。分享对方还不知道的、有关“${topic}”的更多细节，你会觉得多自在？`,
  short ? `对方可能因你们共同的生活而知道其中一部分。对于让对方了解并讨论“${topic}”，包括对方可能还不知道的细节，你会觉得多自在？` : `对方可能因你们共同的生活而知道其中一部分。对于让对方了解并讨论有关“${topic}”的、尚不知道的更多私人细节，你会觉得多自在？`
 ];
 if(category==='A2') return [
  `你们没有共同经历。如果你的生活中发生了以下事情——${topic}——告诉这位对象这件事${short?'，并分享相关个人细节':''}，你会觉得多自在？`,
  `对方与你一般认识，但可能不知道这件事。如果你的生活中发生了以下事情——${topic}——向对方讲述它，你会觉得多自在？`,
  `对方可能已经知道${short?'大致情况':'事情发生过'}。如果发生了以下事情——${topic}——分享对方还不知道的个人经历或私人细节，你会觉得多自在？`,
  `对方可能已经知道这件事，或与你共同经历过${short?'其中一部分':''}。如果发生了以下事情——${topic}——讨论你的个人经历，以及对方未直接经历或尚不知道的更多私人细节，你会觉得多自在？`
 ];
 if(category==='B') return [
  `对方之前并不了解你。向这位对象分享以下个人基本信息，你会觉得多自在：${topic}？`,
  `对方与你一般认识。如果对方还不知道，分享以下基本信息，你会觉得多自在：${topic}？`,
  `对方可能已经知道你的一些基本情况。对于让这位朋友知道以下信息，你会觉得多自在：${topic}？`,
  `对方可能因你们共同的生活而已经知道${short?'其中一部分':'这些信息'}。对于让配偶或伴侣知道以下信息，你会觉得多自在：${topic}？`
 ];
 if(category==='C') return [
  `对方之前并不知情，也没有实际需要。向这位对象透露以下敏感信息，你会觉得多自在：${topic}？`,
  `对方与你一般认识，但没有实际需要。向对方透露以下敏感信息，你会觉得多自在：${topic}？`,
  short ? `即使对方是朋友，也请假设对方没有实际需要。对于让这位朋友知道或取得以下信息，你会觉得多自在：${topic}？` : `对方可能知道大致情况，但不知道这项具体的敏感细节。向对方分享它，你会觉得多自在：${topic}？`,
  short ? `对方可能因你们共同的生活而知道一些个人信息。在没有实际需要时，对于让对方知道或取得以下信息，你会觉得多自在：${topic}？` : `对方可能因同住或共同生活而已经知道其中一部分。对于让对方知道或取得以下具体敏感信息，你会觉得多自在：${topic}？`
 ];
 return [
  `对方没有实际、职业、医疗、${short?'财务或法律':'法律或服务相关的'}需要。你会在多大程度上愿意向对方提供以下高度敏感信息或相应访问权限：${topic}？`,
  `对方与你一般认识，但没有实际需要。你会在多大程度上愿意向对方提供以下高度敏感信息或相应访问权限：${topic}？`,
  `即使对方是朋友，也请假设对方没有实际需要。你会在多大程度上愿意让对方知道或取得以下信息：${topic}？`,
  `对方可能因你们共同的生活而知道一些个人信息。在没有实际需要时，你会在多大程度上愿意让对方知道或取得以下信息：${topic}？`
 ];
}
export function localizeDataset(source, format) {
 const text=format==='60'?TEXT_60:format==='120'?TEXT_120:FULL_TEXT;
 if(Object.keys(text).length!==source.FAMILIES.length) throw new Error('Chinese question count does not match source');
 return {...source,
  FAMILIES:source.FAMILIES.map(row=>{
   const translated=text[row[0]]; if(!translated) throw new Error('Missing Chinese question '+row[0]);
   const anchors=row[5].map(a=>{if(!LABELS[a[1]])throw new Error('Missing Chinese anchor '+a[1]);return [a[0],LABELS[a[1]],a[2]];});
   return [row[0],...translated,row[3],row[4],anchors,...(row[6]?[variants(row,translated[0],format)]:[])];
  }),
  CATEGORY_META:Object.fromEntries(Object.entries(source.CATEGORY_META).map(([key,meta])=>[key,{...meta,label:CATEGORIES_ZH[key]}])),
  RECIPIENTS:RECIPIENTS_ZH
 };
}
