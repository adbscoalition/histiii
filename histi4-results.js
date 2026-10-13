// Plain-language readings of the existing score. These are descriptive ranges,
// not validated cutoffs, safety advice, or a new scoring rubric.
export function describeScore(score) {
  if (score === null || !Number.isFinite(score)) return {
    key: 'unscored', label: 'Not scored yet', title: 'Nothing to read just yet.',
    description: 'There aren’t any scored answers here yet. You can leave it at that, or return to a few questions. Leaving something blank does not put you in the middle of the scale.'
  };
  if (score <= -70) return {
    key: 'private-strong', label: 'Mostly private', title: 'You’d keep most of it to yourself.',
    description: 'In the answers counted here, you usually chose to keep things private or give very little detail. That is a reading of these choices, not a claim that you never open up.'
  };
  if (score <= -20) return {
    key: 'private', label: 'Leaning private', title: 'You’d share some things, but keep more back.',
    description: 'Your answers lean toward keeping information to yourself or sharing a smaller part of the story. There may still be topics you would happily talk about; the overall number doesn’t show all of those differences.'
  };
  if (score < 20) return {
    key: 'middle', label: 'Near the middle', title: 'Somewhere between private and open.',
    description: 'Your answers come out near the middle of the scale. You may have chosen middle levels, or been very open about some things and private about others. The topics below help tell those possibilities apart.'
  };
  if (score < 70) return {
    key: 'open', label: 'Leaning open', title: 'Quite a bit feels shareable.',
    description: 'You tended to choose more sharing rather than less in the answers counted here. That can mean fuller conversations about some subjects, while other details still stay private. It isn’t an all-or-nothing choice.'
  };
  return {
    key: 'open-strong', label: 'Mostly open', title: 'You’d share quite a lot.',
    description: 'Many of your counted answers were near the open end of the scale. You pictured sharing quite a lot of information or detail. This does not mean every subject feels equally easy, or that you should share any of it.'
  };
}

export const TOPIC_READINGS = {
  A1: { scope: 'Everyday interests, preferences, hobbies, and routines.', prompt: 'Which everyday things feel easy to share, and which still feel just for you?' },
  A2: { scope: 'Life changes, personal milestones, and the details around them.', prompt: 'Would you share the headline of an event, its details, or neither?' },
  B: { scope: 'Background, personal basics, and ways someone might contact you.', prompt: 'Which basic details serve a purpose in this relationship?' },
  C: { scope: 'More personal topics, including finances, health, and location.', prompt: 'What purpose or context would matter before discussing a sensitive topic?' },
  D: { scope: 'Highly sensitive identifiers, credentials, documents, and records.', prompt: 'What would you want to keep private, regardless of how close you feel? Never share real passwords or codes here.' }
};

const RELATIONSHIPS = {
  G1: { person: 'someone you don’t know', context: 'You were thinking of someone you don’t know personally. A passing conversation about your interests and a conversation about your private life are different things; this result keeps them separate.' },
  G2: { person: 'an acquaintance', context: 'You were thinking of someone you know casually. They may know the broad picture without knowing the details. The result is about what else you would feel comfortable telling them.' },
  G3: { person: 'a friend', context: 'You were thinking of a friend. They may already know parts of your life, so consider the details they don’t know yet. Being friends doesn’t have to mean sharing every part of the story.' },
  G4: { person: 'a spouse or partner', context: 'You were thinking of a spouse or partner. A shared life can still include separate boundaries. This result describes the answers you chose, not how close or healthy the relationship is.' }
};
const SCHOOL_RELATIONSHIPS = {
  G1: { person: 'an unfamiliar student', context: 'You pictured a student you don’t know. You can talk about ordinary interests without deciding to tell them more personal things. There is no amount you are supposed to share.' },
  G2: { person: 'a classmate', context: 'You pictured someone you know a little from school. Being in the same class doesn’t make every subject public. You can be comfortable with one topic and keep another to yourself.' },
  G3: { person: 'a friend', context: 'You pictured a friend who may know some of the story already. Your answers were about the parts they don’t know. You don’t have to tell a friend everything to be a friend.' },
  G4: { person: 'a trusted adult', context: 'You pictured one adult you feel able to talk to. Even with someone you trust, you can take your time and choose how much to say. This result is not a grade or a measure of honesty.' }
};

export function describeRelationship(score, group, { school = false } = {}) {
  const reading = describeScore(score);
  const relationship = (school ? SCHOOL_RELATIONSHIPS : RELATIONSHIPS)[group];
  return { ...reading, person: relationship?.person || 'this person', context: relationship?.context || 'Read this with the person you had in mind. A different person or situation might bring different answers.' };
}

// Each subject gets its own explanation. Nothing here infers personality,
// relationship quality, or the reasons behind a person's answers.
const TOPIC_COPY = {
  A1: {
    private: 'When you picture sharing with {person}, your answers keep more of your everyday life to yourself: the things you enjoy, your tastes, and your routines. That says how much detail you chose here, not how sociable you are.',
    middle: 'Your everyday interests and routines land near the middle with {person}. Some may feel easy to mention, while others stay personal. The same average can also come from choosing middle levels across several questions.',
    open: 'The everyday parts of your life look relatively shareable with {person}: what you enjoy, what you’re interested in, and how you spend your time. Your answers lean toward letting them know more about those ordinary details.',
    detail: 'Talking about a favorite song is different from describing your whole routine. This area brings those everyday choices together, so it can help to remember which questions felt easy and which gave you pause.'
  },
  A2: {
    private: 'For life changes and personal milestones, your answers lean toward keeping the story brief—or keeping it to yourself—when you think of {person}. There can be a difference between saying an event happened and explaining everything around it.',
    middle: 'Life events come out near the middle with {person}. You might share the basic news but not all the details, or feel differently about different events. The number alone can’t tell which part of a story you would leave out.',
    open: 'You pictured telling {person} more about life changes and milestones, rather than just giving the headline. That could include what happened, the background, or what the experience was like for you, depending on the question.',
    detail: 'A move, a new job, and a difficult change need not feel equally personal. Some events also involve other people’s stories. You can talk about your own experience without choosing to explain every detail.'
  },
  B: {
    private: 'Your choices keep basic personal details fairly limited with {person}. Information can seem ordinary and still identify you, help someone contact you, or tell them more about your background than you want them to know.',
    middle: 'Basic details sit near the middle with {person}. You may be comfortable giving a general picture but not exact information, or your choices may vary from one kind of detail to another. Both can lead to a similar score.',
    open: 'You were more willing to let {person} know basic things about your background or how to contact you. These are the levels you chose in an imagined situation, not a request to supply any of those details here.',
    detail: 'There is a difference between saying roughly where you live and giving a precise address. Who is asking, what they need it for, and how exact the detail is can all matter. This score is not a recommendation to share.'
  },
  C: {
    private: 'Your answers keep more sensitive parts of your life private from {person}. These questions cover personal subjects such as health, finances, and location. You mostly chose less disclosure in this part of the check-in.',
    middle: 'Sensitive topics bring a more mixed or middle-level result with {person}. You might be willing to talk about one subject and not another, or share a broad outline without the details. Neither possibility means you have to say more.',
    open: 'You pictured discussing more sensitive information with {person}, with more detail in the answers counted here. This area can include subjects as different as health, finances, and location, so an open average doesn’t make them interchangeable.',
    detail: 'It may help to think about the conversation itself: why you would tell them, what you would leave out, and whether you could change your mind. This is not a recommendation to share; only you can choose the boundary.'
  },
  D: {
    private: 'For very sensitive details, your answers leaned toward keeping them private from {person}. This area includes things like identifying documents, account information, and credentials—details that are quite different from ordinary conversation.',
    middle: 'Very sensitive details average near the middle with {person}. That could be a mix of open and private choices, rather than equal comfort with every item. The separate questions matter more here than treating the average as permission.',
    open: 'Your choices were toward the open end for very sensitive information with {person}. Read that as a description of hypothetical answers only. It does not establish that handing over credentials, identifying documents, or account details would be safe.',
    detail: 'An open score or a reference marker is not permission to disclose. Never enter real passwords, codes, or identifying details in HISTI. This is not a recommendation to share; closeness to someone does not remove the need for boundaries.'
  }
};
const SCHOOL_TOPIC_COPY = {
  A1: {
    private: 'You kept more of your everyday interests and preferences to yourself when you pictured {person}. That might include hobbies, entertainment, or how you spend your time. This score doesn’t say whether you are friendly or outgoing.',
    middle: 'Your everyday interests and preferences land near the middle with {person}. You may want to talk about some things and keep others for yourself, or choose a small amount of detail across several subjects.',
    open: 'You pictured talking more freely with {person} about ordinary parts of your life, such as hobbies, favorites, and everyday activities. That doesn’t mean you chose to share everything, or that you need to do so.',
    detail: 'You can like talking about a game and still keep another interest private. Think about what felt easy to discuss, rather than using the number to decide what you should tell someone.'
  },
  A2: {
    private: 'For changes and memorable events, your answers kept more of the story to yourself with {person}. An event can be easy to mention but harder to explain, especially when it involves feelings or other people.',
    middle: 'Changes and milestones came out near the middle with {person}. You may want to share that something happened but not the whole story, or answer differently for different events.',
    open: 'You pictured giving {person} more of the story about changes and memorable events. That could mean the event itself or what it was like for you. It does not mean you have to discuss a real event now.',
    detail: 'Some questions may have been imagined because the event hasn’t happened to you. That is okay. Keep imagined situations separate from real details; this result doesn’t prove that you have experienced any particular event.'
  },
  B: {
    private: 'You chose to keep more general personal and school facts private from {person}. A fact can feel ordinary and still be something you only want certain people to know.',
    middle: 'General personal and school facts sit near the middle with {person}. You may be happy to give a broad answer but not an exact detail, or feel differently depending on which fact is being asked about.',
    open: 'You pictured being more willing to tell {person} general personal and school facts. Your choices describe your comfort in these situations; HISTI is not asking you to enter the facts themselves.',
    detail: 'Someone asking a question does not make your answer owed to them. You can pause, leave it blank, or change your mind. This result is not a recommendation to share real names, addresses, or other identifying details.'
  },
  C: {
    private: 'Your answers kept more personal school-life topics private from {person}: things like messages, photos, feedback, schedules, or worries about fitting in. Keeping a topic private is different from having nothing to say about it.',
    middle: 'Personal school-life topics brought a middle or mixed result with {person}. Talking about a worry and showing private messages are different choices. You may feel comfortable with one and not with the other.',
    open: 'You pictured being more willing to discuss personal school-life topics with {person}. These answers may cover messages, photos, feedback, schedules, or worries about fitting in. An open average does not make every one of those things okay to share.',
    detail: 'You can talk about how a situation feels without showing messages, photos, exact schedules, or someone else’s private information. Use imaginary examples only. This score is not a recommendation to share, and it is never a grade.'
  }
};

export function describeTopic(key, bucket, { group, school = false } = {}) {
  const reading = describeScore(bucket.score);
  const topic = (school ? SCHOOL_TOPIC_COPY : TOPIC_COPY)[key];
  const person = describeRelationship(bucket.score, group, { school }).person;
  const subject = { A1: 'everyday life', A2: 'life changes and milestones', B: 'basic details', C: school ? 'personal school-life topics' : 'sensitive information', D: 'very sensitive details' }[key] || 'this topic';
  const band = reading.key === 'middle' ? 'middle' : bucket.score < 0 ? 'private' : 'open';
  const description = reading.key === 'unscored'
    ? `There isn’t a score for ${subject} yet. You may have left it for later, skipped it, or chosen an answer that isn’t weighted. A missing score is not the same as a neutral result.`
    : (topic?.[band] || reading.description).replaceAll('{person}', person);
  return { ...reading, ...TOPIC_READINGS[key], description, detail: topic?.detail || '' };
}

export function describePattern(result, metadata) {
  const entries = Object.entries(result.categories).filter(([, bucket]) => Number.isFinite(bucket.score));
  const name = key => (metadata[key]?.label || key).toLowerCase();
  let description, title = 'A little context.';
  if (!entries.length) description = 'There are no scored topics to compare yet. You can stop here or go back to a question that feels easy to answer. There is no need to fill in anything you want to leave private.';
  else if (entries.length === 1) description = `So far, this result only covers ${name(entries[0][0])}. It doesn’t tell you how you’d answer about the other topics. You can come back to those later, or leave them unanswered.`;
  else {
    const ordered = [...entries].sort((a, b) => b[1].score - a[1].score);
    const high = ordered[0], low = ordered.at(-1);
    const distinct = high[1].score - low[1].score >= 40;
    title = distinct ? 'Where your answers differ.' : 'Reading across the topics.';
    description = distinct
      ? `Your answers about ${name(high[0])} sit farther toward the open end than your answers about ${name(low[0])}. That difference is worth looking at: being comfortable with one kind of information doesn’t mean being comfortable with another.`
      : 'The topics you’ve answered sit fairly close together on the scale. Even so, a topic average can contain different choices. Look for the individual questions where you wanted to give more detail—or keep something back.';
  }
  return {
    title,
    description,
    note: result.answered < result.total ? 'This is still a partial result. Topic averages may be based on different numbers of answers, so the pattern can change as you continue.' : 'These are broad topic averages, not a judgment about you or the person you had in mind.'
  };
}

export function coverageText(result) {
  const areas = Object.values(result.categories).filter(bucket => bucket.score !== null).length;
  return `${result.answered} of ${result.total} questions scored · ${areas} of ${Object.keys(result.categories).length} areas represented`;
}

// Supplied relationship references, not population norms or scoring inputs.
// Signed values use the existing P100 (-100) → N0 (0) → O100 (+100) scale.
export const REFERENCE_SCORES = Object.freeze({
  G1: Object.freeze({ A1: 30, A2: 0, B: -40, C: -90, D: -90 }),
  G2: Object.freeze({ A1: 50, A2: 20, B: 0, C: -20, D: -70 }),
  G3: Object.freeze({ A1: 60, A2: 35, B: 50, C: 50, D: -70 }),
  G4: Object.freeze({ A1: 70, A2: 60, B: 75, C: 50, D: 0 })
});

export function referenceScore(test, group, key) {
  if (!['full', '120', '60'].includes(test)) return null;
  const value = REFERENCE_SCORES[group]?.[key];
  return Number.isFinite(value) ? value : null;
}

export function compareReference(score, reference) {
  if (!Number.isFinite(score) || !Number.isFinite(reference)) return null;
  const difference = Math.round((score - reference) * 10) / 10;
  if (difference === 0) return 'Your result lines up with this reference.';
  const distance = Math.abs(difference);
  return `${distance} point${distance === 1 ? '' : 's'} more ${difference < 0 ? 'private' : 'open'} than this reference.`;
}

// At most one small set of native animations. Replaying, leaving, or resetting
// cancels the previous set; no frame loop, number-counting loop, or exit timer.
export function createResultReveal(isReduced) {
  const active = new Set();
  function cancel() {
    for (const animation of active) animation.cancel();
    active.clear();
  }
  function play(panel) {
    cancel();
    if (isReduced()) return;
    const entries = [
      [panel.querySelector('.result-introduction'), 0, 640, 'translateY(18px)'],
      [panel.querySelector('.result-score-panel'), 100, 720, 'translateY(18px) scale(.96)'],
      [panel.querySelector('.result-score-line'), 240, 760, 'translateY(12px) scale(.9)'],
      [panel.querySelector('.spectrum-marker:not([hidden])'), 450, 560, 'translate(-50%,-50%) scale(.45)'],
      [panel.querySelector('.result-perspective'), 460, 620, 'translateY(10px)'],
      ...[...panel.querySelectorAll('.category-card')].map((node, index) => [node, 540 + index * 75, 560, 'translateY(16px)'])
    ];
    for (const [node, delay, duration, from] of entries) {
      if (!node || typeof node.animate !== 'function') continue;
      const marker = node.classList.contains('spectrum-marker');
      const end = marker ? 'translate(-50%,-50%) scale(1)' : 'none';
      const animation = node.animate([
        { opacity: 0, transform: from },
        { opacity: 1, transform: marker ? 'translate(-50%,-50%) scale(1.12)' : 'translateY(-2px) scale(1.008)', offset: .72 },
        { opacity: 1, transform: end }
      ], { duration, delay, easing: 'cubic-bezier(.22,.8,.25,1)', fill: 'backwards' });
      active.add(animation);
      animation.finished.then(() => { active.delete(animation); animation.cancel(); }, () => active.delete(animation));
    }
  }
  return { play, cancel };
}
