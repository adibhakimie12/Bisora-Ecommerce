import test from 'node:test';
import assert from 'node:assert/strict';

import { buildSeoGuideItems, buildSeoHelpQuestions, getSimplifiedSeoState, getTopSeoRecommendations } from './seoHelp';

test('getSimplifiedSeoState maps detailed score labels into seller-friendly states', () => {
  assert.equal(getSimplifiedSeoState('Fair').label, 'Needs Fixing');
  assert.equal(getSimplifiedSeoState('Good').label, 'Almost Ready');
  assert.equal(getSimplifiedSeoState('Strong').label, 'Ready');
});

test('buildSeoHelpQuestions returns beginner-friendly contextual questions', () => {
  const questions = buildSeoHelpQuestions('pages');
  const shareImageQuestion = questions.find((question) => question.id === 'share-image');

  assert.equal(questions.length, 8);
  assert.match(questions[0].question, /SEO ni untuk apa/i);
  assert.ok(shareImageQuestion);
  assert.match(shareImageQuestion.answer, /shared on WhatsApp|social/i);
});

test('getTopSeoRecommendations keeps only the most important cards for the main screen', () => {
  const cards = getTopSeoRecommendations([
    { title: 'One', body: 'a', action: 'Fix' },
    { title: 'Two', body: 'b', action: 'Fix' },
    { title: 'Three', body: 'c', action: 'Fix' },
    { title: 'Four', body: 'd', action: 'Fix' },
  ]);

  assert.deepEqual(cards.map((card) => card.title), ['One', 'Two', 'Three']);
});

test('buildSeoGuideItems returns simple owner-facing guidance blocks', () => {
  const items = buildSeoGuideItems();

  assert.equal(items.length, 4);
  assert.match(items[0].text, /homepage|about|contact/i);
  assert.match(items[2].text, /traffic from Google/i);
});
