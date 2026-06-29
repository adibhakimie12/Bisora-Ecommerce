import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildVariantOptionRepair,
  findClosestVariantKey,
  updateVariantOptionDraft,
} from './variantEditorModel';

test('updateVariantOptionDraft keeps the option id stable while typing the option name', () => {
  const drafts = [{ id: 'option-color', name: '', values: [], pendingValue: '' }];
  const updated = updateVariantOptionDraft(drafts, 0, 'name', 'Color');

  assert.equal(updated[0]?.id, 'option-color');
  assert.equal(updated[0]?.name, 'Color');
});

test('buildVariantOptionRepair converts swapped color option names into color values', () => {
  const repair = buildVariantOptionRepair([
    { id: 'pink', name: 'Pink', values: ['5'], pendingValue: '' },
    { id: 'brown', name: 'Brown', values: ['5'], pendingValue: '' },
  ]);

  assert.equal(repair?.title, 'Color setup looks swapped');
  assert.deepEqual(repair?.options.map((option) => [option.name, option.values]), [
    ['Color', ['Pink', 'Brown']],
    ['Size', ['5']],
  ]);
});

test('buildVariantOptionRepair merges a color accidentally added as another option', () => {
  const repair = buildVariantOptionRepair([
    { id: 'color', name: 'Color', values: ['Pink Colour', 'Brown Colour'], pendingValue: '' },
    { id: 'size', name: 'Size', values: ['5'], pendingValue: '' },
    { id: 'red', name: 'red', values: ['5'], pendingValue: '' },
  ]);

  assert.equal(repair?.title, 'Move color into Color values');
  assert.deepEqual(repair?.options.map((option) => [option.name, option.values]), [
    ['Color', ['Pink Colour', 'Brown Colour', 'Red']],
    ['Size', ['5']],
  ]);
});

test('findClosestVariantKey preserves stock and images when a variant name is repaired', () => {
  const key = findClosestVariantKey('Pink Colour / 5', ['Pink Colour / 5 / 5', 'Brown Colour / 5 / 5']);

  assert.equal(key, 'Pink Colour / 5 / 5');
});
