import test from 'node:test';
import assert from 'node:assert/strict';

import {
  backgroundStyleOptions,
  builderStudioShellItems,
  builderStudioThemeDefaults,
  imageFitOptions,
  imageFocusOptions,
  imageShapeOptions,
  logoPositionOptions,
} from './builderStudioConfig';

test('builder studio shell exposes the approved stable structure', () => {
  assert.deepEqual(
    builderStudioShellItems.map((item) => item.id),
    ['header', 'sections', 'footer', 'theme-settings'],
  );
});

test('theme defaults map logo position and button shape by first-wave theme', () => {
  assert.equal(builderStudioThemeDefaults['luxe-atelier'].logoPosition, 'center');
  assert.equal(builderStudioThemeDefaults['editorial-veil'].logoPosition, 'left');
  assert.equal(builderStudioThemeDefaults['campaign-glow'].logoPosition, 'split');
  assert.equal(builderStudioThemeDefaults['sage-ritual'].logoPosition, 'left');
});

test('background and logo option lists stay constrained for guided editing', () => {
  assert.deepEqual(logoPositionOptions, ['left', 'center', 'split']);
  assert.deepEqual(backgroundStyleOptions, ['plain', 'gradient', 'image']);
});

test('media option lists stay constrained for guided editing', () => {
  assert.deepEqual(imageFitOptions, ['cover', 'contain']);
  assert.deepEqual(imageFocusOptions, ['top', 'center', 'bottom']);
  assert.deepEqual(imageShapeOptions, ['soft-rounded', 'rounded', 'sharp']);
});
