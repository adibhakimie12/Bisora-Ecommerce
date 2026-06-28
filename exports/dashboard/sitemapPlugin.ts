import type { IncomingMessage, ServerResponse } from 'http';
import type { Plugin } from 'vite';
import { buildRobotsTxt } from './src/modules/seo/robots';
import { generateSitemapXml, writeSitemapSnapshot } from './sitemapSnapshot';

async function readJsonBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}

export function sitemapPlugin(siteUrl: string): Plugin {
  return {
    name: 'bisora-sitemap-plugin',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        if (!req.url) {
          next();
          return;
        }

        if (req.method === 'GET' && req.url === '/sitemap.xml') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/xml');
          res.end(generateSitemapXml(siteUrl));
          return;
        }

        if (req.method === 'GET' && req.url === '/robots.txt') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/plain');
          res.end(buildRobotsTxt({ siteUrl }));
          return;
        }

        if (req.method === 'POST' && req.url === '/__internal/sitemap-refresh') {
          const payload = await readJsonBody(req);
          writeSitemapSnapshot(payload);
          res.statusCode = 204;
          res.end();
          return;
        }

        next();
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: generateSitemapXml(siteUrl),
      });
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: buildRobotsTxt({ siteUrl }),
      });
    },
  };
}
