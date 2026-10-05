// Plain-language readings of the existing score. These are descriptive ranges,
// not validated cutoffs, safety advice, or a new scoring rubric.
export function describeScore(score) {
  if (score === null || !Number.isFinite(score)) return {
    key: 'unscored', label: 'Not scored yet', title: 'Your reflection is still taking shape.',
    description: 'There are no scored answers to read yet. You can return to the questions and choose what feels closest, without entering any real details.'
  };
  if (score <= -70) return {
    key: 'private-strong', label: 'Strongly private-side', title: 'A strong lean toward privacy.',
    description: 'The answers included in this snapshot lean strongly toward keeping information private or sharing very little.'
  };
  if (score <= -20) return {
    key: 'private', label: 'More private-side', title: 'More private, on your terms.',
    description: 'The answers included in this snapshot lean toward sharing less, keeping details limited, or choosing a narrower circle.'
  };
  if (score < 20) return {
    key: 'middle', label: 'Around the midpoint', title: 'Somewhere in the middle.',
    description: 'The included answers sit near the middle of the private-to-open scale. Similar totals can come from different choices, so the topic scores help show the detail.'
  };
  if (score < 70) return {
    key: 'open', label: 'More open-side', title: 'More open, on your terms.',
    description: 'The answers included in this snapshot lean toward sharing more information or choosing fuller detail.'
  };
  return {
    key: 'open-strong', label: 'Strongly open-side', title: 'A strong lean toward openness.',
    description: 'The answers included in this snapshot lean strongly toward sharing openly or in greater detail.'
  };
}

export const TOPIC_READINGS = {
  A1: { scope: 'Everyday interests, preferences, hobbies, and routines.', prompt: 'Which everyday things feel easy to share, and which still feel just for you?' },
  A2: { scope: 'Life changes, personal milestones, and the details around them.', prompt: 'Would you share the headline of an event, its details, or neither?' },
  B: { scope: 'Background, personal basics, and ways someone might contact you.', prompt: 'Which basic details serve a purpose in this relationship?' },
  C: { scope: 'More personal topics, including finances, health, and location.', prompt: 'What purpose or context would matter before discussing a sensitive topic?' },
  D: { scope: 'Highly sensitive identifiers, credentials, documents, and records.', prompt: 'What would you want to keep private, regardless of how close you feel? Never share real passwords or codes here.' }
};

export function describeTopic(key, bucket) {
  const reading = describeScore(bucket.score);
  const scope = TOPIC_READINGS[key];
  const description = bucket.score === null
    ? 'No scored answers in this area yet. A missing score is not the same as a neutral result.'
    : reading.key === 'middle'
      ? 'Your included choices average near the midpoint in this area. Individual answers may lean in different directions.'
      : `Your included choices lean ${bucket.score < 0 ? 'more private' : 'more open'} in this area${Math.abs(bucket.score) >= 70 ? ', with a stronger lean' : ''}. This describes your responses, not a recommendation to share.`;
  return { ...reading, ...scope, description };
}

export function coverageText(result) {
  const areas = Object.values(result.categories).filter(bucket => bucket.score !== null).length;
  return `${result.answered} of ${result.total} questions scored · ${areas} of 5 areas represented`;
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
