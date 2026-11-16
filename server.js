const express = require('express');
const compression = require('compression');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = Number(process.env.APP_PORT) || 3000;
const HOST = '0.0.0.0';

const rootDir = __dirname;

// Compress HTML, CSS, JS, JSON, and SVG payloads over the wire
app.use(compression({ threshold: 1024 }));

// Serve static assets with HTML extension resolution, cache control, and index fallback
app.use(express.static(rootDir, {
  extensions: ['html'],
  index: 'index.html',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else if (/\.(?:webp|png|jpg|jpeg|svg|ico)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
    } else if (/\.(?:css|js)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    }
  }
}));

// Explicit root route
app.get('/', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(rootDir, 'index.html'), (err) => {
    if (err && !res.headersSent) next(err);
  });
});

// Clean URL routing for subpages (e.g., /privacy -> privacy.html)
app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  if (!/^[a-zA-Z0-9_-]+$/.test(page)) {
    return next();
  }
  const filePath = path.join(rootDir, `${page}.html`);
  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return res.sendFile(filePath, (err) => {
        if (err && !res.headersSent) next(err);
      });
    }
  } catch (err) {
    return next(err);
  }
  next();
});

// 404 fallback handler
app.use((req, res) => {
  const notFoundPath = path.join(rootDir, '404.html');
  if (fs.existsSync(notFoundPath)) {
    res.status(404).sendFile(notFoundPath, (err) => {
      if (err && !res.headersSent) {
        res.status(404).send('404 Not Found');
      }
    });
  } else {
    res.status(404).send('404 Not Found');
  }
});

// Express error-handling middleware (prevents unhandled route/URI errors from crashing the server)
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  const status = err.status || err.statusCode || 500;
  res.status(status).send(status === 400 ? 'Bad Request' : 'Internal Server Error');
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
