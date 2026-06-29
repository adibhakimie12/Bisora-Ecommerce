import assert from 'node:assert/strict';
import { uploadMediaFile } from './media';
import { API_STORAGE_KEYS } from './http';

function createMemoryStorage() {
  const records = new Map<string, string>();
  return {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => records.set(key, value),
    removeItem: (key: string) => records.delete(key),
  };
}

async function testUploadMediaFilePresignsUploadsAndCompletes() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-abc');
  storage.setItem(API_STORAGE_KEYS.tenantId, '42');
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const file = new File(['image-binary'], 'hero.jpg', { type: 'image/jpeg' });

  const result = await uploadMediaFile(file, {
    baseUrl: 'https://api.bisora.test/api',
    storage,
    ownerType: 'product',
    ownerId: '7',
    fetcher: async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });

      if (String(url).endsWith('/media/presign')) {
        return new Response(
          JSON.stringify({
            data: {
              id: 55,
              upload_url: '/api/media/local-upload-placeholder/55',
              headers: { 'Content-Type': 'image/jpeg', 'x-bisora-object-key': '42/public/hero.jpg' },
            },
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (String(url) === 'https://api.bisora.test/api/media/local-upload-placeholder/55') {
        return new Response(JSON.stringify({ media_asset_id: 55 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          data: {
            id: 55,
            status: 'ready',
            public_url: 'https://cdn.bisora.test/42/public/hero.jpg',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    },
  });

  assert.equal(calls[0].url, 'https://api.bisora.test/api/media/presign');
  assert.equal(JSON.parse(calls[0].init.body as string).owner_id, 7);
  assert.equal(calls[1].init.method, 'PUT');
  assert.equal((calls[1].init.headers as Record<string, string>)['x-bisora-object-key'], '42/public/hero.jpg');
  assert.equal(calls[2].url, 'https://api.bisora.test/api/media/complete');
  assert.equal(result.publicUrl, 'https://cdn.bisora.test/42/public/hero.jpg');
}

async function testUploadMediaFilePreparesImagesBeforePresign() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-abc');
  storage.setItem(API_STORAGE_KEYS.tenantId, '42');
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const originalFile = new File([new Uint8Array(6 * 1024 * 1024)], 'hero.png', { type: 'image/png' });
  const compressedFile = new File(['compressed-image'], 'hero.webp', { type: 'image/webp' });

  await uploadMediaFile(originalFile, {
    baseUrl: 'https://api.bisora.test/api',
    storage,
    prepareFile: async () => compressedFile,
    fetcher: async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });

      if (String(url).endsWith('/media/presign')) {
        return new Response(
          JSON.stringify({
            data: {
              id: 56,
              upload_url: '/api/media/local-upload-placeholder/56',
              headers: { 'Content-Type': 'image/webp' },
            },
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (String(url).includes('/media/local-upload-placeholder/56')) {
        return new Response(JSON.stringify({ media_asset_id: 56 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({ data: { id: 56, status: 'ready', public_url: 'https://cdn.bisora.test/42/public/hero.webp' } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    },
  });

  const presignBody = JSON.parse(calls[0].init.body as string);
  assert.equal(presignBody.filename, 'hero.webp');
  assert.equal(presignBody.mime_type, 'image/webp');
  assert.equal(presignBody.size_bytes, compressedFile.size);
  assert.equal(calls[1].init.body, compressedFile);
}

async function testUploadMediaFileRejectsImagesThatRemainTooLarge() {
  const originalFile = new File(['original'], 'hero.png', { type: 'image/png' });
  const stillHugeFile = new File([new Uint8Array(6 * 1024 * 1024)], 'hero.webp', { type: 'image/webp' });
  const calls: Array<{ url: string; init: RequestInit }> = [];

  await assert.rejects(
    () =>
      uploadMediaFile(originalFile, {
        baseUrl: 'https://api.bisora.test/api',
        storage: createMemoryStorage(),
        prepareFile: async () => stillHugeFile,
        fetcher: async (url, init) => {
          calls.push({ url: String(url), init: init ?? {} });
          return new Response('{}', { status: 500 });
        },
      }),
    /5MB/,
  );

  assert.equal(calls.length, 0);
}

await testUploadMediaFilePresignsUploadsAndCompletes();
await testUploadMediaFilePreparesImagesBeforePresign();
await testUploadMediaFileRejectsImagesThatRemainTooLarge();

console.log('media api tests passed');
