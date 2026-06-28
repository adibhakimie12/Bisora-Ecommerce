import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildBuilderPanelGroups,
  getBuilderSelectionLabel,
} from './builderStudioViewModel';

test('getBuilderSelectionLabel returns builder labels for shell surfaces', () => {
  assert.equal(getBuilderSelectionLabel('header', 'Home Hero'), 'Header & Navigation');
  assert.equal(getBuilderSelectionLabel('footer', 'Home Hero'), 'Footer Builder');
  assert.equal(getBuilderSelectionLabel('branding', 'Home Hero'), 'Theme Settings');
});

test('getBuilderSelectionLabel keeps section labels for editable sections', () => {
  assert.equal(getBuilderSelectionLabel('section', 'Hero Banner'), 'Hero Banner');
});

test('buildBuilderPanelGroups returns header groups', () => {
  assert.deepEqual(
    buildBuilderPanelGroups({ activeSurface: 'header', editorTab: 'content' }),
    [
      { id: 'logo', title: 'Logo' },
      { id: 'announcement', title: 'Announcement' },
      { id: 'behavior', title: 'Header Behavior' },
    ],
  );
});

test('buildBuilderPanelGroups keeps header groups for layout tab', () => {
  const groups = buildBuilderPanelGroups({ activeSurface: 'header', editorTab: 'layout' });

  assert.equal(groups[0]?.id, 'logo');
  assert.equal(groups[2]?.id, 'behavior');
  assert.deepEqual(
    groups.map((group) => group.title),
    ['Logo', 'Announcement', 'Header Behavior'],
  );
});

test('buildBuilderPanelGroups returns branding groups', () => {
  assert.deepEqual(
    buildBuilderPanelGroups({ activeSurface: 'branding', editorTab: 'layout' }),
    [
      { id: 'theme', title: 'Theme Tokens' },
      { id: 'layout', title: 'Global Layout' },
      { id: 'background', title: 'Background Defaults' },
    ],
  );
});

test('buildBuilderPanelGroups returns footer groups', () => {
  assert.deepEqual(
    buildBuilderPanelGroups({ activeSurface: 'footer', editorTab: 'style' }),
    [
      { id: 'content', title: 'Footer Content' },
      { id: 'columns', title: 'Columns' },
      { id: 'newsletter', title: 'Newsletter' },
    ],
  );
});

test('buildBuilderPanelGroups returns section content groups', () => {
  assert.deepEqual(
    buildBuilderPanelGroups({ activeSurface: 'section', editorTab: 'content', sectionKind: 'hero' }),
    [
      { id: 'content', title: 'Content' },
      { id: 'media', title: 'Media' },
      { id: 'links', title: 'Links' },
    ],
  );
});

test('buildBuilderPanelGroups returns section layout groups', () => {
  assert.deepEqual(
    buildBuilderPanelGroups({ activeSurface: 'section', editorTab: 'layout', sectionKind: 'categories' }),
    [
      { id: 'layout', title: 'Layout' },
      { id: 'spacing', title: 'Spacing' },
      { id: 'width', title: 'Width' },
    ],
  );
});

test('buildBuilderPanelGroups returns section style groups', () => {
  assert.deepEqual(
    buildBuilderPanelGroups({ activeSurface: 'section', editorTab: 'style', sectionKind: 'featured-products' }),
    [
      { id: 'style', title: 'Style' },
      { id: 'background', title: 'Background' },
      { id: 'advanced', title: 'Advanced' },
    ],
  );
});
