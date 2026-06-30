import test from 'node:test';
import assert from 'node:assert/strict';

import { themeLibraryPresets } from './themeLibrary';
import { publishThemeById } from './themeLibraryViewModel';
import { getPublishedTheme, loadThemeLibrary, saveThemeLibrary } from './themeLibraryStore';

function createStorage() {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

test('theme library store loads presets when storage is empty', () => {
  const themes = loadThemeLibrary(createStorage());

  assert.equal(themes.length, themeLibraryPresets.length);
  assert.equal(getPublishedTheme(themes).id, 'luxe-atelier');
});

test('theme library store persists the published theme status', () => {
  const storage = createStorage();
  const publishedThemes = publishThemeById(themeLibraryPresets, 'editorial-veil');

  saveThemeLibrary(publishedThemes, storage);

  const loadedThemes = loadThemeLibrary(storage);
  assert.equal(getPublishedTheme(loadedThemes).id, 'editorial-veil');
  assert.equal(loadedThemes.filter((theme) => theme.status === 'Published').length, 1);
});
