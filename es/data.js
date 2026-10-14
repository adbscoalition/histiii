import {FULL_TEXT} from './full-text.js';
import {TEXT_120,TEXT_60} from './short-text.js';
export const RECIPIENTS={
 G1:{label:'Persona desconocida',slug:'stranger',description:'Alguien a quien no conoces personalmente y que no tiene una necesidad especial de esa información.'},
 G2:{label:'Persona conocida',slug:'acquaintance',description:'Alguien a quien conoces de manera casual, fuera de tu círculo personal cercano.'},
 G3:{label:'Amistad',slug:'friend',description:'Una persona a quien tú consideras una amistad.'},
 G4:{label:'Cónyuge o pareja',slug:'partner',description:'Tu cónyuge o pareja sentimental estable; responde de forma hipotética si hace falta.'}
};
export const SHARING={G1:'una persona desconocida',G2:'una persona conocida',G3:'una amistad',G4:'tu cónyuge o pareja'};
const LABELS={
 'Keep completely private':'Mantenerlo totalmente privado','Share narrowly':'Compartir poco','Context-dependent':'Depende del contexto','Share openly':'Compartir abiertamente','Share completely openly':'Compartir con total apertura',
 'Not at all comfortable':'Nada a gusto','Slightly comfortable':'Un poco a gusto','Depends on context':'Depende del contexto','Comfortable':'A gusto','Completely comfortable':'Totalmente a gusto','Very comfortable':'Muy a gusto','No':'No','Yes':'Sí',
 'No sharing':'No compartir','Very broad information only':'Solo información muy general','Limited detail':'Pocos detalles','Moderate detail / context-dependent':'Detalle moderado / depende del contexto','Substantial detail':'Bastantes detalles','Nearly complete detail':'Casi todos los detalles','Full or exact detail':'Detalle completo o exacto',
 'No birthday details':'Ningún dato de cumpleaños','Age range only':'Solo el rango de edad','Exact age':'Edad exacta','Birth year':'Año de nacimiento','Birth month':'Mes de nacimiento','Month + day':'Mes y día','Full date of birth':'Fecha de nacimiento completa',
 'State / region':'Estado o región','City':'Ciudad','Neighborhood':'Barrio','Street':'Calle','Building / house number':'Número de edificio o vivienda','Apartment / unit':'Apartamento o unidad',
 'Not willing':'Ninguna disposición','Slightly willing':'Poca disposición','Generally willing':'Disposición en general','Fully willing':'Total disposición','No medical information':'Ninguna información médica','General health status only':'Solo el estado general de salud','Broad condition category':'Categoría general de la condición','Specific diagnosis':'Diagnóstico específico','Treatment summary':'Resumen del tratamiento','Detailed medical history':'Historial médico detallado','Complete medical record':'Expediente médico completo'
};
const CATEGORIES={A1:'Actividades cotidianas',A2:'Acontecimientos importantes',B:'Información básica',C:'Información sensible',D:'Información muy sensible'};
const YN_60={'A1-003':'el nombre de un músico o artista favorito, o una película o programa favorito específico','A1-010':'qué plataformas o servicios de redes sociales usas','A1-014':'cómo prefieres que otras personas te contacten o se comuniquen contigo','B-001':'solo tu nombre de pila','B-005':'tu lugar de origen o ciudad o región actual, en general, y tu zona horaria','B-007':'tus nombres de usuario o enlaces a perfiles públicos'};
function variants(row,topic,format){
 const category=row[0].split('-')[0],short=format==='60',subject=short&&row[3]==='yn'?YN_60[row[0]]:topic.toLowerCase();
 if(row[3]==='yn')return category==='A1'?[
  `Esta persona no sabe nada de ti ni comparte una historia contigo. ¿Compartirías con ella esta información: ${subject}?`,
  `Te conoce de manera casual, pero no conoce este detalle. ¿Compartirías con ella esta información: ${subject}?`,
  `Puede conocer el panorama general. Si no conociera ya este detalle, ¿lo compartirías con esta amistad: ${subject}?`,
  `Puede saberlo ya por la vida que comparten. Si no lo supiera, ¿lo compartirías o conversarías con tu pareja: ${subject}?`
 ]:[
  `No sabe nada de ti. ¿Compartirías con esta persona esta información básica sobre ti: ${subject}?`,
  `Te conoce de manera casual. Si no lo sabe ya, ¿compartirías con ella esta información básica: ${subject}?`,
  `Puede conocer algunos datos básicos sobre ti. Si no conociera este detalle, ¿lo compartirías: ${subject}?`,
  `Puede conocer algunos datos básicos por la vida que comparten. Si no conociera este detalle, ¿lo compartirías: ${subject}?`
 ];
 if(category==='A1')return [
  `Esta persona no sabe nada de ti ni comparte una historia contigo. ¿Hasta qué punto te sentirías a gusto compartiendo información sobre «${topic}» con ella?`,
  `Te conoce de manera casual, pero no conoce estos detalles. ¿Hasta qué punto te sentirías a gusto compartiendo información sobre «${topic}» con ella?`,
  `Puede conocer el panorama general. ¿Hasta qué punto te sentirías a gusto compartiendo detalles adicionales sobre «${topic}» que todavía no conoce?`,
  short?`Puede conocer parte de esto por la vida que comparten. ¿Hasta qué punto te sientes a gusto con que lo sepa y conversen sobre «${topic}», incluidos detalles que quizá no conozca?`:`Puede conocer parte de esto por la vida que comparten. ¿Hasta qué punto te sientes a gusto con que conozca y converse sobre detalles privados adicionales de «${topic}» que todavía no conoce?`
 ];
 if(category==='A2')return [
  `No tienen una historia compartida. Si esto ocurriera en tu vida —${topic}—, ¿hasta qué punto te sentirías a gusto contándole que ocurrió${short?' y compartiendo detalles personales relevantes':''}?`,
  `Te conoce de manera casual, pero puede no saber de este acontecimiento. Si esto ocurriera en tu vida —${topic}—, ¿hasta qué punto te sentirías a gusto contándoselo?`,
  `Puede conocer ${short?'el panorama general':'que el acontecimiento ocurrió'}. Si ocurriera esto —${topic}—, ¿hasta qué punto te sentirías a gusto compartiendo tu experiencia personal o detalles privados que todavía no conoce?`,
  `Puede saber del acontecimiento o haber vivido ${short?'parte de él':'el acontecimiento'} contigo. Si ocurriera esto —${topic}—, ¿hasta qué punto te sentirías a gusto hablando de tu experiencia personal y detalles privados adicionales que no vivió directamente o que todavía no conoce?`
 ];
 if(category==='B')return [
  `No sabe nada de ti. ¿Hasta qué punto te sentirías a gusto compartiendo esta información básica sobre ti con esta persona: ${topic}?`,
  `Te conoce de manera casual. Si no lo sabe ya, ¿hasta qué punto te sentirías a gusto compartiendo esta información básica: ${topic}?`,
  `Puede conocer ya algunos datos básicos sobre ti. ¿Hasta qué punto te sientes a gusto con que esta amistad conozca la siguiente información sobre ti: ${topic}?`,
  `Puede saber ${short?'parte de esto':'esto'} por la vida que comparten. ¿Hasta qué punto te sientes a gusto con que tu cónyuge o pareja conozca la siguiente información sobre ti: ${topic}?`
 ];
 if(category==='C')return [
  `No sabe nada de esto y no tiene una necesidad práctica de conocerlo. ¿Hasta qué punto te sentirías a gusto revelándole esta información sensible: ${topic}?`,
  `Te conoce de manera casual, pero no tiene una necesidad práctica de conocerlo. ¿Hasta qué punto te sentirías a gusto revelándole esta información sensible: ${topic}?`,
  short?`Aunque sea una amistad, supone que no hay una necesidad práctica. ¿Hasta qué punto te sentirías a gusto con que esta amistad conozca o tenga acceso a lo siguiente: ${topic}?`:`Puede conocer la situación general, pero no este detalle sensible específico. ¿Hasta qué punto te sentirías a gusto compartiéndolo: ${topic}?`,
  short?`Puede conocer alguna información personal por la vida que comparten. Cuando no hay una necesidad práctica, ¿hasta qué punto te sientes a gusto con que conozca o tenga acceso a lo siguiente: ${topic}?`:`Puede conocer parte de esto por compartir hogar o vida. ¿Hasta qué punto te sientes a gusto con que conozca o tenga acceso a esta información sensible específica: ${topic}?`
 ];
 return [
  `No tiene una necesidad práctica, profesional, médica, ${short?'económica o legal':'legal o relacionada con un servicio'}. ¿Con qué grado de apertura le darías esta información muy sensible o acceso a ella: ${topic}?`,
  `Te conoce de manera casual, pero no tiene una necesidad práctica. ¿Con qué grado de apertura le darías esta información muy sensible o acceso a ella: ${topic}?`,
  `Aunque sea una amistad, supone que no hay una necesidad práctica. ¿Con qué grado de apertura aceptarías que conozca o tenga acceso a lo siguiente: ${topic}?`,
  `Puede conocer alguna información personal por la vida que comparten. Cuando no hay una necesidad práctica, ¿con qué grado de apertura aceptarías que conozca o tenga acceso a lo siguiente: ${topic}?`
 ];
}
export function localizeDataset(source,format){
 const text=format==='60'?TEXT_60:format==='120'?TEXT_120:FULL_TEXT;
 if(Object.keys(text).length!==source.FAMILIES.length)throw new Error('Spanish question count does not match source');
 return {...source,RECIPIENTS,CATEGORY_META:Object.fromEntries(Object.entries(source.CATEGORY_META).map(([key,meta])=>[key,{...meta,label:CATEGORIES[key]}])),FAMILIES:source.FAMILIES.map(row=>{
  const translation=text[row[0]];if(!translation)throw new Error('Missing Spanish question '+row[0]);
  const anchors=row[5].map(a=>{if(!LABELS[a[1]])throw new Error('Missing Spanish anchor '+a[1]);return[a[0],LABELS[a[1]],a[2]];});
  return [row[0],...translation,row[3],row[4],anchors,...(row[6]?[variants(row,translation[0],format)]:[])];
 })};
}
