import test from 'node:test';
import assert from 'node:assert/strict';

import { saveBlogPostsToApi, syncBlogPostsFromApi } from './blogStore';
import { defaultWebsitePages, saveWebsitePagesToApi, syncWebsitePagesFromApi } from './websitePagesStore';

class FakeStorage {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }
}

const originalWindow = globalThis.window;

test.afterEach(() => {
  globalThis.window = originalWindow;
});

function installApiWindow() {
  const storage = new FakeStorage();
  storage.setItem('bisora.apiToken', 'token-123');
  storage.setItem('bisora.tenantId', '77');
  globalThis.window = {
    localStorage: storage,
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as Window & typeof globalThis;
}

test('syncWebsitePagesFromApi hydrates builder pages from store settings', async () => {
  installApiWindow();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        data: {
          id: 1,
          tenant_id: 77,
          name: 'Demo',
          slug: 'demo',
          currency: 'MYR',
          timezone: 'Asia/Kuala_Lumpur',
          settings: {
            website_pages: [{ ...defaultWebsitePages[0], title: 'Backend Homepage' }],
          },
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );

  try {
    const pages = await syncWebsitePagesFromApi();
    assert.equal(pages[0].title, 'Backend Homepage');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('saveWebsitePagesToApi persists builder pages into store settings', async () => {
  installApiWindow();
  const originalFetch = globalThis.fetch;
  let requestBody = '';
  globalThis.fetch = async (_url, init) => {
    requestBody = String(init?.body ?? '');

    return new Response(
      JSON.stringify({
        data: {
          id: 1,
          tenant_id: 77,
          name: 'Demo',
          slug: 'demo',
          currency: 'MYR',
          timezone: 'Asia/Kuala_Lumpur',
          settings: {},
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  try {
    await saveWebsitePagesToApi([{ ...defaultWebsitePages[0], title: 'Saved Homepage' }]);
    assert.equal(JSON.parse(requestBody).settings.website_pages[0].title, 'Saved Homepage');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('syncBlogPostsFromApi hydrates blog posts from store settings', async () => {
  installApiWindow();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        data: {
          id: 1,
          tenant_id: 77,
          name: 'Demo',
          slug: 'demo',
          currency: 'MYR',
          timezone: 'Asia/Kuala_Lumpur',
          settings: {
            blog_posts: [
              {
                id: 'blog-backend',
                title: 'Backend Blog',
                status: 'Published',
                keyword: 'backend blog',
                summary: 'Saved in backend.',
                coverImage: 'Cover',
              },
            ],
          },
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );

  try {
    const posts = await syncBlogPostsFromApi();
    assert.equal(posts[0].title, 'Backend Blog');
    assert.equal(posts[0].slug, '/blog/backend-blog');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('saveBlogPostsToApi persists blog posts into store settings', async () => {
  installApiWindow();
  const originalFetch = globalThis.fetch;
  let requestBody = '';
  globalThis.fetch = async (_url, init) => {
    requestBody = String(init?.body ?? '');

    return new Response(
      JSON.stringify({
        data: {
          id: 1,
          tenant_id: 77,
          name: 'Demo',
          slug: 'demo',
          currency: 'MYR',
          timezone: 'Asia/Kuala_Lumpur',
          settings: {},
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  try {
    const posts = await syncBlogPostsFromApi({ fallback: [] });
    assert.equal(posts.length, 0);

    await saveBlogPostsToApi([
      {
        id: 'blog-save',
        title: 'Saved Blog',
        status: 'Draft',
        slug: '/blog/saved-blog',
        keyword: 'saved blog',
        primaryKeyword: 'saved blog',
        summary: 'Draft.',
        metaDescription: 'Draft.',
        seoTitle: 'Saved Blog',
        coverImage: 'Cover',
        author: 'Bisora Team',
        publishDate: '2026-05-24',
        content: 'Draft content',
        outline: [],
        relatedProductIds: [],
        relatedCollectionIds: [],
        relatedPostIds: [],
        ctaBlocks: [],
        contentFlow: {
          hook: '',
          problem: '',
          solution: '',
          productMention: '',
          cta: '',
        },
      },
    ]);
    assert.equal(JSON.parse(requestBody).settings.blog_posts[0].title, 'Saved Blog');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
