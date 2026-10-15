import {FULL_TEXT} from './full-text.js';
import {TEXT_120,TEXT_60} from './short-text.js';
export const RECIPIENTS={
 G1:{label:'Personne inconnue',slug:'stranger',description:'Quelqu’un que vous ne connaissez pas personnellement et qui n’a pas spécialement besoin de ces informations.'},
 G2:{label:'Connaissance',slug:'acquaintance',description:'Quelqu’un que vous connaissez occasionnellement, en dehors de votre cercle personnel proche.'},
 G3:{label:'Ami ou amie',slug:'friend',description:'Une personne que vous considérez personnellement comme un ami ou une amie.'},
 G4:{label:'Conjoint ou partenaire',slug:'partner',description:'Votre conjoint ou partenaire amoureux stable ; répondez de façon hypothétique si nécessaire.'}
};
export const SHARING={G1:'une personne inconnue',G2:'une connaissance',G3:'un ami ou une amie',G4:'votre conjoint ou partenaire'};
const LABELS={
 'Keep completely private':'Garder entièrement privé','Share narrowly':'Partager peu','Context-dependent':'Selon le contexte','Share openly':'Partager ouvertement','Share completely openly':'Partager avec une ouverture totale',
 'Not at all comfortable':'Pas du tout à l’aise','Slightly comfortable':'Un peu à l’aise','Depends on context':'Selon le contexte','Comfortable':'À l’aise','Completely comfortable':'Tout à fait à l’aise','Very comfortable':'Très à l’aise','No':'Non','Yes':'Oui',
 'No sharing':'Ne rien partager','Very broad information only':'Informations très générales seulement','Limited detail':'Peu de détails','Moderate detail / context-dependent':'Détails modérés / selon le contexte','Substantial detail':'Beaucoup de détails','Nearly complete detail':'Presque tous les détails','Full or exact detail':'Détails complets ou exacts',
 'No birthday details':'Aucun détail d’anniversaire','Age range only':'Tranche d’âge seulement','Exact age':'Âge exact','Birth year':'Année de naissance','Birth month':'Mois de naissance','Month + day':'Mois et jour','Full date of birth':'Date de naissance complète',
 'State / region':'État ou région','City':'Ville','Neighborhood':'Quartier','Street':'Rue','Building / house number':'Numéro d’immeuble ou de maison','Apartment / unit':'Appartement ou logement',
 'Not willing':'Pas disposé à partager','Slightly willing':'Peu disposé à partager','Generally willing':'Généralement disposé à partager','Fully willing':'Tout à fait disposé à partager','No medical information':'Aucune information médicale','General health status only':'État général de santé seulement','Broad condition category':'Catégorie générale de l’affection','Specific diagnosis':'Diagnostic précis','Treatment summary':'Résumé du traitement','Detailed medical history':'Antécédents médicaux détaillés','Complete medical record':'Dossier médical complet'
};
const CATEGORIES={A1:'Activités quotidiennes',A2:'Événements de vie importants',B:'Informations de base',C:'Informations sensibles',D:'Informations très sensibles'};
const YN_60={'A1-003':'le nom d’un musicien ou artiste préféré, ou d’un film ou d’une série préféré précis','A1-010':'les réseaux sociaux ou services de médias sociaux que vous utilisez','A1-014':'votre façon préférée d’être contacté ou de communiquer','B-001':'votre prénom seulement','B-005':'votre ville d’origine ou ville ou région actuelle, en général, et votre fuseau horaire, sans adresse de rue','B-007':'vos noms d’utilisateur, identifiants ou liens vers des profils publics'};
function variants(row,topic,format){
 const category=row[0].split('-')[0],short=format==='60',subject=short&&row[3]==='yn'?YN_60[row[0]]:topic;
 if(row[3]==='yn')return category==='A1'?[
  `Cette personne ne connaît rien de vous et vous n’avez pas d’histoire commune. Partageriez-vous avec elle cette information : ${subject} ?`,
  `Elle vous connaît occasionnellement, mais pas ce détail précis. Partageriez-vous avec elle cette information : ${subject} ?`,
  `Elle connaît peut-être la situation générale. Si elle ne connaissait pas déjà ce détail, le partageriez-vous avec elle : ${subject} ?`,
  `Elle connaît peut-être déjà cela par votre vie commune. Si elle ne le savait pas, le partageriez-vous ou en discuteriez-vous avec elle : ${subject} ?`
 ]:[
  `Elle ne connaît rien de vous. Partageriez-vous avec elle cette information de base sur vous : ${subject} ?`,
  `Elle vous connaît occasionnellement. Si elle ne le sait pas déjà, partageriez-vous avec elle cette information de base : ${subject} ?`,
  `Elle connaît peut-être certaines informations de base sur vous. Si elle ne connaissait pas ce détail, le partageriez-vous : ${subject} ?`,
  `Elle connaît peut-être certaines informations de base par votre vie commune. Si elle ne connaissait pas ce détail, le partageriez-vous : ${subject} ?`
 ];
 if(category==='A1')return[
  `Cette personne ne connaît rien de vous et vous n’avez pas d’histoire commune. Dans quelle mesure seriez-vous à l’aise pour partager avec elle des informations sur « ${topic} » ?`,
  `Elle vous connaît occasionnellement, mais pas ces détails précis. Dans quelle mesure seriez-vous à l’aise pour partager avec elle des informations sur « ${topic} » ?`,
  `Elle connaît peut-être la situation générale. Dans quelle mesure seriez-vous à l’aise pour partager des détails supplémentaires sur « ${topic} » qu’elle ne connaît pas déjà ?`,
  short?`Elle en connaît peut-être une partie par votre vie commune. Dans quelle mesure êtes-vous à l’aise pour qu’elle connaisse et discute de « ${topic} », y compris des détails qu’elle ne connaît peut-être pas ?`:`Elle en connaît peut-être une partie par votre vie commune. Dans quelle mesure êtes-vous à l’aise pour qu’elle connaisse et discute de détails privés supplémentaires sur « ${topic} » qu’elle ne connaît pas déjà ?`
 ];
 if(category==='A2')return[
  `Vous n’avez pas d’histoire commune. Si cet événement arrivait dans votre vie — ${topic} —, dans quelle mesure seriez-vous à l’aise pour lui dire qu’il est arrivé${short?' et partager des détails personnels pertinents':''} ?`,
  `Elle vous connaît occasionnellement, mais ignore peut-être cet événement. Si cela arrivait dans votre vie — ${topic} —, dans quelle mesure seriez-vous à l’aise pour le lui raconter ?`,
  `Elle connaît peut-être ${short?'la situation générale':'l’existence de l’événement'}. Si cela arrivait — ${topic} —, dans quelle mesure seriez-vous à l’aise pour partager votre expérience personnelle ou des détails privés qu’elle ne connaît pas déjà ?`,
  `Elle connaît peut-être l’événement ou en a vécu ${short?'une partie':'le déroulement'} avec vous. Si cela arrivait — ${topic} —, dans quelle mesure seriez-vous à l’aise pour parler de votre expérience personnelle et de détails privés supplémentaires qu’elle n’a pas vécus directement ou ne connaît pas déjà ?`
 ];
 if(category==='B')return[
  `Elle ne connaît rien de vous. Dans quelle mesure seriez-vous à l’aise pour partager avec elle cette information de base sur vous : ${topic} ?`,
  `Elle vous connaît occasionnellement. Si elle ne le sait pas déjà, dans quelle mesure seriez-vous à l’aise pour partager cette information de base : ${topic} ?`,
  `Elle connaît peut-être certaines informations de base sur vous. Dans quelle mesure êtes-vous à l’aise pour que cet ami ou cette amie connaisse l’information suivante sur vous : ${topic} ?`,
  `Elle connaît peut-être ${short?'une partie de cela':'cela'} par votre vie commune. Dans quelle mesure êtes-vous à l’aise pour que votre conjoint ou partenaire connaisse l’information suivante sur vous : ${topic} ?`
 ];
 if(category==='C')return[
  `Elle ignore cette information et n’a pas de besoin pratique de la connaître. Dans quelle mesure seriez-vous à l’aise pour lui révéler cette information sensible : ${topic} ?`,
  `Elle vous connaît occasionnellement, mais n’a pas de besoin pratique de savoir cela. Dans quelle mesure seriez-vous à l’aise pour lui révéler cette information sensible : ${topic} ?`,
  short?`Même s’il s’agit d’un ami ou d’une amie, supposez qu’il n’y ait pas de besoin pratique. Dans quelle mesure seriez-vous à l’aise pour que cette personne connaisse ou puisse consulter ceci : ${topic} ?`:`Elle connaît peut-être la situation générale, mais pas ce détail sensible précis. Dans quelle mesure seriez-vous à l’aise pour le partager : ${topic} ?`,
  short?`Elle connaît peut-être des informations personnelles par votre vie commune. Sans besoin pratique, dans quelle mesure êtes-vous à l’aise pour qu’elle connaisse ou puisse consulter ceci : ${topic} ?`:`Elle en connaît peut-être une partie parce que vous partagez un foyer ou une vie. Dans quelle mesure êtes-vous à l’aise pour qu’elle connaisse ou puisse consulter cette information sensible précise : ${topic} ?`
 ];
 return[
  `Elle n’a pas de besoin pratique, professionnel, médical, ${short?'financier ou juridique':'juridique ou lié à un service'}. Avec quelle ouverture lui donneriez-vous cette information très sensible ou son accès : ${topic} ?`,
  `Elle vous connaît occasionnellement, mais n’a pas de besoin pratique. Avec quelle ouverture lui donneriez-vous cette information très sensible ou son accès : ${topic} ?`,
  `Même s’il s’agit d’un ami ou d’une amie, supposez qu’il n’y ait pas de besoin pratique. Avec quelle ouverture accepteriez-vous que cette personne connaisse ou puisse consulter ceci : ${topic} ?`,
  `Elle connaît peut-être des informations personnelles par votre vie commune. Sans besoin pratique, avec quelle ouverture accepteriez-vous qu’elle connaisse ou puisse consulter ceci : ${topic} ?`
 ];
}
export function localizeDataset(source,format){
 const text=format==='60'?TEXT_60:format==='120'?TEXT_120:FULL_TEXT;
 if(Object.keys(text).length!==source.FAMILIES.length)throw new Error('French question count does not match source');
 return{...source,RECIPIENTS,CATEGORY_META:Object.fromEntries(Object.entries(source.CATEGORY_META).map(([key,meta])=>[key,{...meta,label:CATEGORIES[key]}])),FAMILIES:source.FAMILIES.map(row=>{
  const translation=text[row[0]];if(!translation)throw new Error('Missing French question '+row[0]);
  const anchors=row[5].map(a=>{if(!LABELS[a[1]])throw new Error('Missing French anchor '+a[1]);return[a[0],LABELS[a[1]],a[2]];});
  return[row[0],...translation,row[3],row[4],anchors,...(row[6]?[variants(row,translation[0],format)]:[])];
 })};
}
