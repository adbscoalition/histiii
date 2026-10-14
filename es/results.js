import {describeScore} from '../histi4-results.js?v=editorial-1';
import {SHARING} from './data.js';
const BANDS={
 unscored:['Aún sin puntuación','Todavía no hay un resultado que interpretar.','Aún no hay respuestas puntuadas. Puedes dejarlo así o volver a algunas preguntas. Dejar algo en blanco no te coloca en el punto medio de la escala.'],
 'private-strong':['Mayormente privado','Preferirías reservarte la mayor parte.','En las respuestas incluidas, normalmente elegiste mantener la información privada o dar muy pocos detalles. Esto describe tus elecciones, no afirma que nunca te abras a otras personas.'],
 private:['Tendencia a la privacidad','Compartirías algunas cosas, pero reservarías más.','Tus respuestas tienden a guardar la información para ti o compartir una parte menor de la historia. Quizá haya temas de los que hablarías con gusto; el número global no muestra todas esas diferencias.'],
 middle:['Cerca del punto medio','Entre la privacidad y la apertura.','Tus respuestas quedan cerca del punto medio. Puedes haber elegido niveles intermedios o combinar mucha apertura sobre algunos temas con privacidad sobre otros. Los temas de abajo ayudan a distinguir estas posibilidades.'],
 open:['Tendencia a la apertura','Bastantes cosas te parecen compartibles.','En las respuestas incluidas, tendiste a compartir más en lugar de menos. Puede significar conversaciones más completas sobre algunos asuntos, mientras otros detalles siguen siendo privados. No tiene que ser una elección de todo o nada.'],
 'open-strong':['Mayormente abierto','Compartirías bastante información.','Muchas respuestas incluidas estaban cerca del extremo abierto. Imaginaste compartir bastante información o detalle. No significa que todos los temas te resulten igual de fáciles ni que debas compartirlos.']
};
const CONTEXT={
 G1:'Pensabas en alguien a quien no conoces personalmente. Una conversación casual sobre intereses y una conversación sobre tu vida privada son cosas diferentes; este resultado mantiene esa distinción.',
 G2:'Pensabas en alguien a quien conoces de manera casual. Puede conocer el panorama general sin saber los detalles. El resultado trata de qué más te sentirías a gusto contándole.',
 G3:'Pensabas en una amistad. Quizá ya conozca partes de tu vida, así que considera los detalles que todavía no sabe. La amistad no exige compartir toda la historia.',
 G4:'Pensabas en tu cónyuge o pareja. Compartir una vida permite conservar límites propios. Este resultado describe las respuestas elegidas, no la cercanía ni la salud de la relación.'
};
export function relationship(score,group){const key=describeScore(score).key,[label,title,description]=BANDS[key];return{key,label,title,description,person:SHARING[group],context:CONTEXT[group]};}
const TOPICS={
 A1:{scope:'Intereses cotidianos, preferencias, aficiones y rutinas.',prompt:'¿Qué cosas cotidianas te resulta fácil compartir y cuáles siguen siendo solo para ti?',
 private:'Al imaginar compartir con {person}, tus respuestas reservan más de tu vida cotidiana: lo que disfrutas, tus gustos y tus rutinas. Esto describe cuánto detalle elegiste, no tu sociabilidad.',
 middle:'Tus intereses y rutinas quedan cerca del punto medio con {person}. Algunas cosas pueden resultar fáciles de mencionar y otras seguir siendo personales. El mismo promedio también puede venir de elegir niveles intermedios en varias preguntas.',
 open:'Los aspectos cotidianos de tu vida parecen relativamente compartibles con {person}: lo que disfrutas, lo que te interesa y cómo pasas el tiempo. Tus respuestas tienden a permitir que sepa más de esos detalles cotidianos.',
 detail:'Hablar de una canción favorita no es lo mismo que describir toda tu rutina. Este ámbito reúne esas elecciones, así que puede ayudar recordar qué preguntas resultaron fáciles y cuáles te hicieron detenerte.'},
 A2:{scope:'Cambios de vida, hitos personales y sus detalles.',prompt:'¿Compartirías la noticia de un acontecimiento, sus detalles o ninguna de las dos cosas?',
 private:'En cambios de vida e hitos personales, tus respuestas tienden a contar poco —o guardártelo— al pensar en {person}. Decir que algo ocurrió puede ser diferente de explicar todo lo que lo rodea.',
 middle:'Los acontecimientos quedan cerca del punto medio con {person}. Quizá compartas la noticia básica sin todos los detalles o te sientas diferente según el acontecimiento. El número no dice qué parte de la historia omitirías.',
 open:'Imaginaste contarle a {person} más sobre cambios e hitos, no solo la noticia. Según la pregunta, puede incluir lo ocurrido, el contexto o cómo fue la experiencia para ti.',
 detail:'Una mudanza, un empleo nuevo y un cambio difícil no tienen por qué sentirse igual de personales. Algunos hechos también involucran historias ajenas. Puedes hablar de tu experiencia sin explicar cada detalle.'},
 B:{scope:'Contexto, datos personales básicos y formas de contacto.',prompt:'¿Qué datos básicos tienen un propósito en esta relación?',
 private:'Tus elecciones limitan bastante los datos básicos que darías a {person}. Una información puede parecer corriente y aun así identificarte, permitir que te contacten o revelar más de tu contexto de lo que quieres.',
 middle:'Los datos básicos quedan cerca del punto medio con {person}. Quizá te sientas a gusto dando una idea general, pero no información exacta, o tus elecciones varíen según el dato. Ambas posibilidades pueden dar una puntuación similar.',
 open:'Mostraste más disposición a que {person} conozca datos básicos de tu contexto o cómo contactarte. Son niveles elegidos en una situación imaginada, no una petición de proporcionar aquí esos datos.',
 detail:'Decir aproximadamente dónde vives no es lo mismo que dar una dirección precisa. Quién pregunta, para qué lo necesita y la exactitud del dato pueden importar. Esta puntuación no recomienda compartir.'},
 C:{scope:'Temas más personales, como las finanzas, la salud y la ubicación.',prompt:'¿Qué propósito o contexto importaría antes de hablar de un tema sensible?',
 private:'Tus respuestas reservan más aspectos sensibles de tu vida ante {person}. Estas preguntas cubren temas personales como salud, finanzas y ubicación. En esta parte elegiste principalmente revelar menos.',
 middle:'Los temas sensibles producen un resultado más mixto o intermedio con {person}. Quizá hablarías de un asunto y no de otro, o darías una idea general sin detalles. Ninguna posibilidad te obliga a decir más.',
 open:'Imaginaste hablar con {person} de más información sensible y con más detalle en las respuestas incluidas. Este ámbito incluye asuntos tan distintos como salud, finanzas y ubicación; un promedio abierto no los vuelve intercambiables.',
 detail:'Puede ayudar pensar en la conversación: por qué lo contarías, qué omitirías y si podrías cambiar de opinión. No es una recomendación de compartir; solo tú eliges el límite.'},
 D:{scope:'Identificadores, credenciales, documentos y registros muy sensibles.',prompt:'¿Qué querrías mantener privado sin importar la cercanía? Nunca compartas aquí contraseñas o códigos reales.',
 private:'Para los datos muy sensibles, tus respuestas tienden a mantenerlos privados ante {person}. Aquí hay documentos de identidad, información de cuentas y credenciales: datos muy diferentes de una conversación cotidiana.',
 middle:'Los datos muy sensibles promedian cerca del punto medio con {person}. Puede ser una mezcla de elecciones abiertas y privadas, no la misma comodidad con cada elemento. Importan más las preguntas individuales que tratar el promedio como permiso.',
 open:'Tus elecciones sobre información muy sensible ante {person} se acercan al extremo abierto. Léelas solo como respuestas hipotéticas. No demuestra que entregar credenciales, documentos de identidad o datos de cuentas sea seguro.',
 detail:'Una puntuación abierta o una referencia no da permiso para revelar información. Nunca introduzcas contraseñas, códigos ni datos identificativos reales en HISTI. Esto no recomienda compartir; la cercanía no elimina la necesidad de límites.'}
};
export function topic(key,bucket,group){const reading=relationship(bucket.score,group),copy=TOPICS[key],band=reading.key==='middle'?'middle':bucket.score<0?'private':'open';return{...reading,scope:copy.scope,prompt:copy.prompt,detail:copy.detail,description:reading.key==='unscored'?'Este tema aún no tiene puntuación. Quizá lo dejaste para después, lo omitiste o elegiste una respuesta sin ponderación. No tener puntuación no equivale a un resultado neutral.':copy[band].replaceAll('{person}',reading.person)};}
export function pattern(result,metadata){
 const entries=Object.entries(result.categories).filter(([,b])=>Number.isFinite(b.score));let title='Un poco de contexto.',description;
 if(!entries.length)description='Aún no hay temas puntuados para comparar. Puedes detenerte aquí o volver a una pregunta fácil de responder. No hace falta completar nada que quieras mantener privado.';
 else if(entries.length===1)description=`Por ahora, este resultado solo cubre «${metadata[entries[0][0]].label}». No dice cómo responderías sobre otros temas. Puedes volver después o dejarlos sin responder.`;
 else{const sorted=[...entries].sort((a,b)=>b[1].score-a[1].score),high=sorted[0],low=sorted.at(-1),distinct=high[1].score-low[1].score>=40;title=distinct?'Dónde difieren tus respuestas.':'Una mirada a los distintos temas.';description=distinct?`Tus respuestas sobre «${metadata[high[0]].label}» están más cerca del extremo abierto que las de «${metadata[low[0]].label}». Vale la pena mirar esa diferencia: sentir comodidad con un tipo de información no implica sentirla con otro.`:'Los temas respondidos están bastante cerca en la escala. Aun así, cada promedio puede contener elecciones distintas. Busca las preguntas en las que querías dar más detalle o reservarte algo.';}
 return{title,description,note:result.answered<result.total?'Este resultado sigue siendo parcial. Los promedios pueden basarse en cantidades distintas de respuestas, por lo que el patrón puede cambiar al continuar.':'Son promedios generales por tema, no un juicio sobre ti ni sobre la persona en la que pensabas.'};
}
export function coverage(result){return `${result.answered} de ${result.total} preguntas puntuadas · ${Object.values(result.categories).filter(b=>b.score!==null).length} de ${Object.keys(result.categories).length} ámbitos representados`;}
export const shorten=text=>text.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim()||text;
export const plain=reading=>({description:shorten(reading.description),detail:reading.detail,context:reading.context});
export function scoringDetail(result,{pna,unknown,na}){return `Este resultado incluye ${result.answered} de ${result.total} preguntas. Respuestas «Prefiero no responder»: ${pna} (1 punto por pregunta). Se excluyen «No lo sé»: ${unknown} y «No se aplica»: ${na}. Preguntas restantes sin puntuar: ${result.total-result.answered-unknown-na}.`;}
