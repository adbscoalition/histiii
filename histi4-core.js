import { FAMILIES, CATEGORY_META } from './histi4-data.js';

export const CATEGORIES = Object.keys(CATEGORY_META);
export const CATEGORY_TOTAL = Object.values(CATEGORY_META).reduce((sum, item) => sum + item.weight, 0);

export function makeSlides(families = FAMILIES) {
  const slides = [];
  for (const category of CATEGORIES) {
    const rows = families.filter(row => row[0].split('-')[0] === category);
    // Keeping answer types together makes three controls fit and behave consistently.
    for (const type of ['slider', 'yn', 'multi']) {
      const matching = rows.filter(row => row[3] === type);
      const size = type === 'multi' ? 1 : 3;
      for (let i = 0; i < matching.length; i += size) {
        slides.push({ category, type, questions: matching.slice(i, i + size) });
      }
    }
  }
  return slides;
}

export function rubricPoints(row, value) {
  const anchors = row[5];
  if (row[3] === 'multi' && Array.isArray(value)) {
    return Math.min(row[4], value.reduce((sum, index) => sum + (anchors[index]?.[2] || 0), 0));
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  if (row[3] === 'yn') return numeric === 0 ? 0 : numeric === 1 ? row[4] : null;
  if (row[3] === 'slider') {
    const positions = anchors.map((anchor, index) => anchor[0] ?? index);
    if (numeric < positions[0] || numeric > positions.at(-1)) return null;
    for (let i = 0; i < anchors.length - 1; i++) {
      if (numeric <= positions[i + 1]) {
        const span = positions[i + 1] - positions[i];
        const fraction = span ? (numeric - positions[i]) / span : 0;
        return Math.round(anchors[i][2] + fraction * (anchors[i + 1][2] - anchors[i][2]));
      }
    }
    return anchors.at(-1)[2];
  }
  return null;
}

export function signedScore(earned, available) {
  return available > 0 ? Math.round((earned / available) * 200 - 100) : null;
}

export function displayScore(score) {
  if (score === null) return '—';
  return score < 0 ? `P${Math.abs(score)}` : score > 0 ? `O${score}` : 'N0';
}

export function calculate(answers, families = FAMILIES) {
  const categories = Object.fromEntries(CATEGORIES.map(key => [key, { earned: 0, available: 0, answered: 0, total: 0, score: null }]));
  let answered = 0;
  for (const row of families) {
    const category = row[0].split('-')[0];
    const bucket = categories[category];
    if (!bucket) continue;
    bucket.total++;
    const answer = answers[row[0]];
    if (answer?.status !== 'score') continue;
    const points = rubricPoints(row, answer.value);
    if (points === null) continue;
    bucket.earned += points;
    bucket.available += row[4];
    bucket.answered++;
    answered++;
  }
  let weighted = 0, activeWeights = 0;
  for (const key of CATEGORIES) {
    const bucket = categories[key];
    bucket.score = signedScore(bucket.earned, bucket.available);
    if (bucket.score === null) continue;
    weighted += bucket.score * CATEGORY_META[key].weight;
    activeWeights += CATEGORY_META[key].weight;
  }
  return { score: activeWeights ? Math.round(weighted / activeWeights) : null, categories, answered, total: families.length, coverage: families.length ? answered / families.length : 0 };
}
