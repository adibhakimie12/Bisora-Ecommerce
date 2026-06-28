import test from 'node:test';
import assert from 'node:assert/strict';

import { themeLibraryPresets } from './themeLibrary';
import {
  buildThemeLibraryCards,
  installThemeById,
  publishThemeById,
} from './themeLibraryViewModel';

test('buildThemeLibraryCards keeps featured theme first', () => {
  const cards = buildThemeLibraryCards(themeLibraryPresets);
  assert.equal(cards[0]?.id, 'luxe-atelier');
  assert.equal(cards[0]?.badge, 'Featured');
});

test('installThemeById promotes draft themes to installed only', () => {
  const seed = themeLibraryPresets.map((theme) =>
    theme.id === 'campaign-glow' ? { ...theme, status: 'Draft' as const } : theme,
  );
  const result = installThemeById(seed, 'campaign-glow');
  assert.equal(result.find((theme) => theme.id === 'campaign-glow')?.status, 'Installed');
  assert.equal(result.find((theme) => theme.id === 'luxe-atelier')?.status, 'Published');
});

test('publishThemeById keeps exactly one published theme', () => {
  const result = publishThemeById(themeLibraryPresets, 'editorial-veil');
  assert.equal(result.filter((theme) => theme.status === 'Published').length, 1);
  assert.equal(result.find((theme) => theme.id === 'editorial-veil')?.status, 'Published');
  assert.equal(result.find((theme) => theme.id === 'luxe-atelier')?.status, 'Installed');
});
