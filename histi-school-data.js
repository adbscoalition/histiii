// Shared school-edition construction. Source text lives in the two edition modules.
const WEIGHTS = { A1:23, A2:25, B:25, C:20 };
const PHRASES = { G1:'a student you don’t know', G2:'a classmate', G3:'a friend', G4:'a trusted adult' };
const REFLECTIONS = {
  A1:'Which everyday things feel easy to talk about, and which feel just for you?',
  A2:'Would you share the event, your feelings about it, or neither?',
  B:'How might your comfort change depending on who is asking?',
  C:'What boundary would help you feel comfortable? Use imaginary examples only.'
};

export function createSchoolEdition(source) {
  const name = source.edition === 'middle' ? 'Middle School' : 'High School';
  const FAMILIES = source.items.map(item => [
    item.code, item.title, item.prompt, item.type, item.max,
    item.type === 'yn' ? [[0,'No',0],[1,'Yes',item.max]]
      : source.guideLabels.map((label,index) => [index + 1,label,item.max * index / 4]),
    Array(4).fill(item.prompt)
  ]);
  const CATEGORY_META = Object.fromEntries(Object.entries(source.categories).map(([key,area]) => [key, {
    label:area.label, scope:area.scope, prompt:REFLECTIONS[key], weight:WEIGHTS[key],
    max:source.items.filter(item=>item.code.split('-')[0]===key).reduce((sum,item)=>sum+item.max,0)
  }]));
  const RECIPIENTS = Object.fromEntries(Object.entries(source.recipients).map(([key,person]) => [key,{...person,phrase:PHRASES[key]}]));
  const SCHOOL_INFO = {
    edition:source.edition, name, testName:'HISTI for Schools · ' + name,
    ages:source.ages, classMinutes:source.classMinutes,
    routeBase:'/checkin-school-' + source.edition,
    storagePrefix:'histi.school.' + source.edition,
    reflectionQuestions:source.reflectionQuestions,
    sourceName:source.sourceName, sourceSha256:source.sourceSha256
  };
  const SOURCE_IDS = Object.fromEntries(source.items.map(item=>[item.code,item.sourceIds]));
  return { FAMILIES,CATEGORY_META,RECIPIENTS,SCHOOL_INFO,SOURCE_IDS };
}

// Four eleven-slider parts, then all four yes/no questions in one final part.
export function makeSchoolSlides(families) {
  const levels = families.filter(row => row[3] === 'slider');
  const choices = families.filter(row => row[3] === 'yn');
  const labels = ['Everyday life', 'Everyday life & life changes', 'Life changes & basic information', 'Basic & personal information'];
  const categories = ['A1','A2','B','C'];
  const part = (questions,type,label) => {
    const represented = [...new Set(questions.map(row=>row[0].split('-')[0]))];
    const category = categories.filter(key=>represented.includes(key)).at(-1);
    return {category,categories:represented,type,label,questions};
  };
  const slides = [];
  for(let offset=0;offset<levels.length;offset+=11) slides.push(part(levels.slice(offset,offset+11),'slider',labels[slides.length]));
  if(choices.length) slides.push(part(choices,'yn','Everyday & basic facts'));
  return slides;
}

