// Plain-language website explanations only. The original test prompts, answer
// choices, reference values, and scoring are not changed by reading level.
const people = {
  G1:'someone you do not know',G2:'someone you know a little',G3:'a friend',G4:'a partner'
};
const schoolPeople = {G1:'a student you do not know',G2:'a classmate',G3:'a friend',G4:'an adult you trust'};
export function plainRecipient(group, school = false) {
  const person = (school ? schoolPeople : people)[group] || 'this person';
  return `Think of ${person}. Keep the same person in mind. You do not need to enter a name.`;
}
export function plainOverall(reading, group, school = false) {
  const description = {
    unscored:'There is no score yet. You can go back to the questions, or stop here. Blank and unscored answers do not count as middle answers.',
    'private-strong':'You chose to keep most things private in these answers. This does not mean you never share. Look at each topic to see the differences.',
    private:'You chose to share less rather than more. Some topics may still feel easy to talk about. The topic scores show those differences.',
    middle:'Your score is near the middle. You may have picked middle answers, or shared more about some things and less about others.',
    open:'You chose to share more rather than less. You can still keep some details private. This score does not tell you what you should share.',
    'open-strong':'You chose open answers for many of the scored questions. Not every topic has to feel the same. You do not have to share anything because of this score.'
  }[reading.key];
  const person = (school ? schoolPeople : people)[group] || 'this person';
  return {
    description,
    context: school ? `You were thinking of ${person}. You can choose how much to say, even to someone you trust. This is not a grade.`
      : `You were thinking of ${person}. This score is about those answers. It does not judge you or your relationship.`
  };
}
const topics = {
  A1: {subject:'hobbies, likes, and daily routines',detail:'Talking about a favorite song and telling someone your whole routine can feel different. You can choose a different amount of detail for each.'},
  A2: {subject:'life changes and important events',detail:'You can say that something happened without telling the whole story. Events may involve other people too. Share only the part you choose to discuss.'},
  B: {subject:'basic details about yourself',detail:'A broad answer and an exact detail are different. Think about who is asking and why. You do not need to enter names, addresses, or other real details here.'},
  C: {subject:'personal topics like health, money, and location',detail:'Think about why you would tell someone, what you would leave out, and whether you might change your mind. A score is not advice to share.'},
  D: {subject:'very private details like IDs, passwords, and account information',detail:'An open score or a reference marker does not mean sharing is safe. Never enter real passwords, codes, or identifying details in HISTI. A score is not permission to share.'}
};
const schoolTopics = {
  A1: {subject:'hobbies, favorites, and everyday activities',detail:'You can talk about one interest and keep another private. Being friendly does not mean you have to share everything.'},
  A2: {subject:'changes and important events',detail:'You may have imagined some events. That is okay. The score does not prove that an event happened to you. Do not share real private details here.'},
  B: {subject:'general personal and school facts',detail:'You can pause or skip a question. You do not owe an answer just because someone asks. Do not enter real names, addresses, or other identifying details here.'},
  C: {subject:'private messages, photos, school feedback, schedules, or worries',detail:'You can talk about your feelings without showing messages or photos. Use made-up examples only. Do not share exact schedules or someone else’s private details. This is not a grade.'}
};
export function plainTopic(key, bucket, group, school = false) {
  const topic = (school ? schoolTopics : topics)[key] || {subject:'this topic',detail:''};
  const person = (school ? schoolPeople : people)[group] || 'this person';
  let description;
  if (!Number.isFinite(bucket.score)) description = 'There is no score for this topic yet. You may have skipped it or left it for later. No score is different from a middle score.';
  else if (bucket.score <= -20) description = `You chose to keep more about ${topic.subject} private from ${person}. This describes your answers here, not what you have to do.`;
  else if (bucket.score < 20) description = `Your answers about ${topic.subject} are near the middle with ${person}. You may have chosen middle levels, or mixed open and private answers.`;
  else description = `You chose to share more about ${topic.subject} with ${person}. You can still keep other details private. The score does not tell you to share.`;
  return {description, detail:topic.detail};
}
export function plainPattern(result, metadata) {
  const areas = Object.entries(result.categories).filter(([,bucket])=>Number.isFinite(bucket.score));
  const label = key => metadata[key].label.toLowerCase();
  if (!areas.length) return 'There are no scored topics yet. You can go back to a question or stop here. You do not have to answer everything.';
  if (areas.length === 1) return `So far, this result only covers ${label(areas[0][0])}. The other topics have no score yet.`;
  const ordered = [...areas].sort((a,b)=>b[1].score-a[1].score);
  const first = ordered[0],last = ordered.at(-1);
  return first[1].score-last[1].score >= 40
    ? `You chose more sharing for ${label(first[0])} than for ${label(last[0])}. You can feel differently about different types of information.`
    : 'These topic scores are fairly close. Each topic can still include different answers. Look back at any question where you wanted to share more or less.';
}
