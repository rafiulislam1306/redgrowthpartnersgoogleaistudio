const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const rootDir = __dirname;

// Serve static assets with HTML extension resolution and index fallback
app.use(express.static(rootDir, {
  extensions: ['html'],
  index: 'index.html'
}));

// Explicit root route
app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Clean URL routing for subpages (e.g., /privacy -> privacy.html)
app.get('/:page', (req, res, next) => {
  const pageFile = `${req.params.page}.html`;
  const filePath = path.join(rootDir, pageFile);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  next();
});

// 404 fallback handler
app.use((req, res) => {
  const notFoundPath = path.join(rootDir, '404.html');
  if (fs.existsSync(notFoundPath)) {
    res.status(404).sendFile(notFoundPath);
  } else {
    res.status(404).send('404 Not Found');
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
