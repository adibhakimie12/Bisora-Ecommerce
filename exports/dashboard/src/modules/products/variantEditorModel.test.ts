import assert from 'node:assert/strict';
import test from 'node:test';

import { updateVariantOptionDraft } from './variantEditorModel';

test('updateVariantOptionDraft keeps the option id stable while typing the option name', () => {
  const drafts = [{ id: 'option-color', name: '', values: [], pendingValue: '' }];
  const updated = updateVariantOptionDraft(drafts, 0, 'name', 'Color');

  assert.equal(updated[0]?.id, 'option-color');
  assert.equal(updated[0]?.name, 'Color');
});
