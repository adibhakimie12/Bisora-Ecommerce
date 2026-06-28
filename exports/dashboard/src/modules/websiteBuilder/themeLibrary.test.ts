import test from 'node:test';
import assert from 'node:assert/strict';

import {
  featuredThemeId,
  firstWaveThemeIds,
  themeLibraryPresets,
  themeOrder,
} from './themeLibrary';

test('themeLibraryPresets defines the approved first-wave lineup', () => {
  assert.deepEqual(firstWaveThemeIds, [
    'luxe-atelier',
    'editorial-veil',
    'campaign-glow',
    'sage-ritual',
  ]);
  assert.equal(featuredThemeId, 'luxe-atelier');
  assert.deepEqual(themeOrder, [...firstWaveThemeIds]);
  assert.equal(themeLibraryPresets.length, 4);
});

test('featured Luxe Atelier is installed and published by default', () => {
  const featured = themeLibraryPresets.find((theme) => theme.id === featuredThemeId);
  assert.ok(featured);
  assert.equal(featured?.status, 'Published');
  assert.equal(featured?.fitLabel, 'Premium Muslimah Boutique');
  assert.equal(featured?.badge, 'Featured');
});

test('every first-wave theme exposes card tags and preview sections', () => {
  for (const theme of themeLibraryPresets) {
    assert.equal(theme.tags.length, 3);
    assert.equal(theme.previewSections.length >= 2, true);
    assert.equal(theme.previewSections.length <= 3, true);
  }
});

test('card preview sections distinguish first-wave themes', () => {
  const byId = new Map(themeLibraryPresets.map((theme) => [theme.id, theme.previewSections]));
  assert.notDeepEqual(byId.get('luxe-atelier'), byId.get('editorial-veil'));
  assert.notDeepEqual(byId.get('campaign-glow'), byId.get('sage-ritual'));
  assert.deepEqual(byId.get('luxe-atelier'), ['split-hero', 'campaign-strip', 'lookbook-row']);
});

test('builder profiles map each first-wave theme to a distinct default rhythm', () => {
  const profiles = new Map(themeLibraryPresets.map((theme) => [theme.id, theme.builderProfile]));
  assert.equal(profiles.get('luxe-atelier'), 'luxe');
  assert.equal(profiles.get('editorial-veil'), 'editorial');
  assert.equal(profiles.get('campaign-glow'), 'campaign');
  assert.equal(profiles.get('sage-ritual'), 'beauty');
});
