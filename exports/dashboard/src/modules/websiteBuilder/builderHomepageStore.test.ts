import test from 'node:test';
import assert from 'node:assert/strict';

import { getDefaultHomepageSections, loadBuilderHomepageState, saveBuilderHomepageState } from './builderHomepageStore';

function createStorage() {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

test('builder homepage store returns theme-specific default sections', () => {
  const luxeSections = getDefaultHomepageSections('luxe-atelier');
  const campaignSections = getDefaultHomepageSections('campaign-glow');

  assert.equal(luxeSections[0].content.heading, 'Define Your Grace');
  assert.equal(campaignSections[0].content.heading, 'Collection');
  assert.ok(luxeSections.some((section) => section.kind === 'featured-products'));
});

test('builder homepage store saves edited sections by theme id', () => {
  const storage = createStorage();
  const state = loadBuilderHomepageState('luxe-atelier', storage);

  saveBuilderHomepageState(
    {
      ...state,
      sections: [
        {
          ...state.sections[0],
          content: {
            ...state.sections[0].content,
            heading: 'Custom Live Homepage',
          },
        },
      ],
    },
    storage,
  );

  const loaded = loadBuilderHomepageState('luxe-atelier', storage);
  assert.equal(loaded.sections[0].content.heading, 'Custom Live Homepage');
  assert.equal(loadBuilderHomepageState('campaign-glow', storage).sections[0].content.heading, 'Collection');
});
