import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

// Middleware to run /api serverless functions in local Vite dev server
function apiDevServerPlugin(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        try {
          const urlObj = new URL(req.url, 'http://localhost');
          const pathname = urlObj.pathname;

          let handler: any = null;
          if (pathname === '/api/financial') {
            // @ts-expect-error dynamic JS import in Vite
            const mod = await import('./api/financial.js');
            handler = mod.default;
          } else if (pathname === '/api/create-preference') {
            // @ts-expect-error dynamic JS import in Vite
            const mod = await import('./api/create-preference.js');
            handler = mod.default;
          }

          if (!handler) {
            return next();
          }

          // Buffer request body if method is POST/PUT/DELETE
          if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method || '')) {
            let bodyStr = '';
            req.on('data', chunk => bodyStr += chunk);
            req.on('end', async () => {
              try {
                (req as any).body = bodyStr ? JSON.parse(bodyStr) : {};
              } catch {
                (req as any).body = {};
              }
              (req as any).query = Object.fromEntries(urlObj.searchParams.entries());

              // Mock Vercel response helper
              (res as any).status = (statusCode: number) => {
                res.statusCode = statusCode;
                return res;
              };
              (res as any).json = (data: any) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
                return res;
              };

              await handler(req, res);
            });
          } else {
            (req as any).query = Object.fromEntries(urlObj.searchParams.entries());
            (res as any).status = (statusCode: number) => {
              res.statusCode = statusCode;
              return res;
            };
            (res as any).json = (data: any) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return res;
            };
            await handler(req, res);
          }
        } catch (err: any) {
          console.error('Erro na rota de API local:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiDevServerPlugin()],
});
