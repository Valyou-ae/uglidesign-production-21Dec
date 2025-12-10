import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static files with cache control
  // JS/CSS files have hashes in names, so they can be cached longer
  // But we set moderate cache to ensure updates are picked up
  app.use(express.static(distPath, {
    etag: false,
    maxAge: '1h',
    setHeaders: (res, filePath) => {
      // HTML files should never be cached
      if (filePath.endsWith('.html')) {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
      }
    }
  }));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
