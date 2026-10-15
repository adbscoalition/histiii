import {FULL_TEXT} from './full-text.js';
import {TEXT_120,TEXT_60} from './short-text.js';
export const RECIPIENTS={
 G1:{label:'Di-kilala',slug:'stranger',description:'Isang taong hindi mo personal na kilala at walang espesyal na pangangailangan sa impormasyong ito.'},
 G2:{label:'Kakilala',slug:'acquaintance',description:'Isang taong bahagya mo lang kilala, sa labas ng malapit mong personal na samahan.'},
 G3:{label:'Kaibigan',slug:'friend',description:'Isang taong personal mong itinuturing na kaibigan.'},
 G4:{label:'Asawa o kapareha',slug:'partner',description:'Asawa o kapareha mo sa matatag na romantikong relasyon; sumagot nang kathang-isip kung kailangan.'}
};
export const SHARING={G1:'isang di-kilala',G2:'isang kakilala',G3:'isang kaibigan',G4:'iyong asawa o kapareha'};
const LABELS={
 'Keep completely private':'Panatilihing ganap na pribado','Share narrowly':'Kaunti lang ang ibahagi','Context-dependent':'Depende sa konteksto','Share openly':'Ibahagi nang bukas','Share completely openly':'Ibahagi nang lubos na bukas',
 'Not at all comfortable':'Hindi talaga komportable','Slightly comfortable':'Bahagyang komportable','Depends on context':'Depende sa konteksto','Comfortable':'Komportable','Completely comfortable':'Lubos na komportable','Very comfortable':'Napakakomportable','No':'Hindi','Yes':'Oo',
 'No sharing':'Walang ibabahagi','Very broad information only':'Napakapangkalahatang impormasyon lang','Limited detail':'Kaunting detalye','Moderate detail / context-dependent':'Katamtamang detalye / depende sa konteksto','Substantial detail':'Maraming detalye','Nearly complete detail':'Halos kumpletong detalye','Full or exact detail':'Kumpleto o eksaktong detalye',
 'No birthday details':'Walang detalye ng kaarawan','Age range only':'Saklaw ng edad lang','Exact age':'Eksaktong edad','Birth year':'Taon ng kapanganakan','Birth month':'Buwan ng kapanganakan','Month + day':'Buwan at araw','Full date of birth':'Buong petsa ng kapanganakan',
 'State / region':'Estado o rehiyon','City':'Lungsod','Neighborhood':'Kapitbahayan','Street':'Kalye','Building / house number':'Numero ng gusali o bahay','Apartment / unit':'Apartment o yunit',
 'Not willing':'Hindi handa','Slightly willing':'Bahagyang handa','Generally willing':'Karaniwang handa','Fully willing':'Lubos na handa','No medical information':'Walang medikal na impormasyon','General health status only':'Pangkalahatang kalusugan lang','Broad condition category':'Malawak na uri ng kondisyon','Specific diagnosis':'Partikular na diyagnosis','Treatment summary':'Buod ng paggamot','Detailed medical history':'Detalyadong medikal na kasaysayan','Complete medical record':'Buong medikal na rekord'
};
const CATEGORIES={A1:'Pang-araw-araw na gawain',A2:'Mahahalagang pangyayari sa buhay',B:'Pangunahing impormasyon',C:'Sensitibong impormasyon',D:'Napakasensitibong impormasyon'};
const YN_60={'A1-003':'pangalan ng paboritong musikero o artista, o partikular na paboritong pelikula o palabas','A1-010':'mga social platform o social media service na ginagamit mo','A1-014':'paraan na gusto mong kontakin o kausapin ka ng mga tao','B-001':'unang pangalan mo lamang','B-005':'pangkalahatang bayang pinagmulan o kasalukuyang lungsod o rehiyon at time zone mo, nang walang address ng kalye','B-007':'mga username o handle mo, o link sa pampublikong online profile'};
function variants(row,topic,format){
 const category=row[0].split('-')[0],short=format==='60',subject=short&&row[3]==='yn'?YN_60[row[0]]:topic;
 if(row[3]==='yn')return category==='A1'?[
  `Wala siyang dating alam tungkol sa iyo at wala kayong pinagsamahan. Ibabahagi mo ba sa taong ito ang impormasyong ito: ${subject}?`,
  `Bahagya ka niyang kilala, ngunit hindi niya alam ang partikular na detalyeng ito. Ibabahagi mo ba sa kanya ang impormasyong ito: ${subject}?`,
  `Maaaring alam na niya ang pangkalahatang kalagayan. Kung hindi pa niya alam ang detalyeng ito, ibabahagi mo ba ito sa kanya: ${subject}?`,
  `Maaaring alam na niya ito dahil sa magkasama ninyong buhay. Kung hindi pa niya alam ang detalyeng ito, ibabahagi o pag-uusapan mo ba ito sa kanya: ${subject}?`
 ]:[
  `Wala siyang dating alam tungkol sa iyo. Ibabahagi mo ba sa kanya ang pangunahing impormasyong ito tungkol sa iyo: ${subject}?`,
  `Bahagya ka niyang kilala. Kung hindi pa niya alam, ibabahagi mo ba sa kanya ang pangunahing impormasyong ito: ${subject}?`,
  `Maaaring alam na niya ang ilang pangunahing bagay tungkol sa iyo. Kung hindi pa niya alam ang detalyeng ito, ibabahagi mo ba ito: ${subject}?`,
  `Maaaring alam na niya ang ilang pangunahing bagay dahil sa magkasama ninyong buhay. Kung hindi pa niya alam ang detalyeng ito, ibabahagi mo ba ito: ${subject}?`
 ];
 if(category==='A1')return[
  `Wala siyang dating alam tungkol sa iyo at wala kayong pinagsamahan. Gaano ka komportableng magbahagi sa taong ito ng impormasyon tungkol sa “${topic}”?`,
  `Bahagya ka niyang kilala, ngunit hindi niya alam ang mga partikular na detalyeng ito. Gaano ka komportableng magbahagi sa kanya ng impormasyon tungkol sa “${topic}”?`,
  `Maaaring alam na niya ang pangkalahatang kalagayan. Gaano ka komportableng magbahagi ng karagdagang detalye tungkol sa “${topic}” na hindi pa niya alam?`,
  short?`Maaaring alam na niya ang ilan dito dahil sa magkasama ninyong buhay. Gaano ka komportable na malaman at pag-usapan niya ang “${topic},” kasama ang mga detalyeng maaaring hindi pa niya alam?`:`Maaaring alam na niya ang ilan dito dahil sa magkasama ninyong buhay. Gaano ka komportable na malaman at pag-usapan niya ang karagdagang pribadong detalye tungkol sa “${topic}” na hindi pa niya alam?`
 ];
 if(category==='A2')return[
  `Wala kayong pinagsamahan. Kung mangyari ito sa buhay mo — ${topic} —, gaano ka komportableng sabihin sa kanya na nangyari ito${short?' at magbahagi ng kaugnay na personal na detalye':''}?`,
  `Bahagya ka niyang kilala ngunit maaaring hindi niya alam ang pangyayaring ito. Kung mangyari ito sa buhay mo — ${topic} —, gaano ka komportableng sabihin sa kanya?`,
  `Maaaring alam na niya ${short?'ang pangkalahatang kalagayan':'na nangyari ito'}. Kung mangyari ito — ${topic} —, gaano ka komportableng ibahagi ang personal mong karanasan o pribadong detalyeng hindi pa niya alam?`,
  `Maaaring alam na niya ang pangyayari o naranasan ${short?'ang bahagi nito':'ito'} kasama ka. Kung mangyari ito — ${topic} —, gaano ka komportableng pag-usapan ang personal mong karanasan at karagdagang pribadong detalyeng hindi niya direktang naranasan o hindi pa niya alam?`
 ];
 if(category==='B')return[
  `Wala siyang dating alam tungkol sa iyo. Gaano ka komportableng ibahagi sa kanya ang pangunahing impormasyong ito tungkol sa iyo: ${topic}?`,
  `Bahagya ka niyang kilala. Kung hindi pa niya alam, gaano ka komportableng ibahagi ang pangunahing impormasyong ito: ${topic}?`,
  `Maaaring alam na niya ang ilang pangunahing bagay tungkol sa iyo. Gaano ka komportable na malaman ng kaibigang ito ang sumusunod na impormasyon tungkol sa iyo: ${topic}?`,
  `Maaaring alam na niya ${short?'ang ilan dito':'ito'} dahil sa magkasama ninyong buhay. Gaano ka komportable na malaman ng asawa o kapareha mo ang sumusunod na impormasyon tungkol sa iyo: ${topic}?`
 ];
 if(category==='C')return[
  `Hindi niya alam ito at wala siyang praktikal na pangangailangang malaman ito. Gaano ka komportableng ibunyag sa kanya ang sensitibong impormasyong ito: ${topic}?`,
  `Bahagya ka niyang kilala ngunit wala siyang praktikal na pangangailangang malaman ito. Gaano ka komportableng ibunyag sa kanya ang sensitibong impormasyong ito: ${topic}?`,
  short?`Kahit kaibigan mo siya, ipagpalagay na walang praktikal na pangangailangan. Gaano ka komportable na malaman o ma-access ng kaibigang ito ang sumusunod: ${topic}?`:`Maaaring alam niya ang pangkalahatang sitwasyon ngunit hindi ang partikular na sensitibong detalyeng ito. Gaano ka komportableng ibahagi ito: ${topic}?`,
  short?`Maaaring alam na niya ang ilang personal na impormasyon dahil sa magkasama ninyong buhay. Kapag walang praktikal na pangangailangan, gaano ka komportable na malaman o ma-access niya ang sumusunod: ${topic}?`:`Maaaring alam na niya ang ilan dito dahil sa magkasama ninyong tahanan o buhay. Gaano ka komportable na malaman o ma-access niya ang partikular na sensitibong impormasyong ito: ${topic}?`
 ];
 return[
  `Wala siyang praktikal, propesyonal, medikal, ${short?'pinansiyal, o legal':'legal, o kaugnay-sa-serbisyong'} pangangailangan. Gaano ka kabukas na ibigay o ipa-access sa kanya ang napakasensitibong impormasyong ito: ${topic}?`,
  `Bahagya ka niyang kilala ngunit wala siyang praktikal na pangangailangan. Gaano ka kabukas na ibigay o ipa-access sa kanya ang napakasensitibong impormasyong ito: ${topic}?`,
  `Kahit kaibigan mo siya, ipagpalagay na walang praktikal na pangangailangan. Gaano ka kabukas na payagang malaman o ma-access niya ang sumusunod: ${topic}?`,
  `Maaaring alam na niya ang ilang personal na impormasyon dahil sa magkasama ninyong buhay. Kapag walang praktikal na pangangailangan, gaano ka kabukas na payagang malaman o ma-access niya ang sumusunod: ${topic}?`
 ];
}
export function localizeDataset(source,format){
 const text=format==='60'?TEXT_60:format==='120'?TEXT_120:FULL_TEXT;
 if(Object.keys(text).length!==source.FAMILIES.length)throw new Error('Tagalog question count does not match source');
 return{...source,RECIPIENTS,CATEGORY_META:Object.fromEntries(Object.entries(source.CATEGORY_META).map(([key,meta])=>[key,{...meta,label:CATEGORIES[key]}])),FAMILIES:source.FAMILIES.map(row=>{
  const translation=text[row[0]];if(!translation)throw new Error('Missing Tagalog question '+row[0]);
  const anchors=row[5].map(a=>{if(!LABELS[a[1]])throw new Error('Missing Tagalog anchor '+a[1]);return[a[0],LABELS[a[1]],a[2]];});
  return[row[0],...translation,row[3],row[4],anchors,...(row[6]?[variants(row,translation[0],format)]:[])];
 })};
}
