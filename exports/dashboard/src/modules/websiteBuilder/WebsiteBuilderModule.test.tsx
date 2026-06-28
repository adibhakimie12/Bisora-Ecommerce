import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { WebsiteBuilderModule } from './WebsiteBuilderModule';

test('builder studio section cards do not nest action buttons inside clickable button containers', () => {
  const html = renderToStaticMarkup(
    React.createElement(WebsiteBuilderModule, {
      section: 'customize',
      themeId: 'luxe-atelier',
    }),
  );

  assert.doesNotMatch(
    html,
    /<button class="w-full rounded-2xl border p-4 text-left transition-colors[^"]*"><div class="flex items-start gap-3">[\s\S]*?<p class="truncate text-sm font-medium text-on-surface">Luxury Hero<\/p>[\s\S]*?<div class="mt-3 flex flex-wrap gap-2"><button type="button"/,
  );
});
