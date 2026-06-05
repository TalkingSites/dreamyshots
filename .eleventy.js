const fs   = require('fs');
const path = require('path');

module.exports = function(eleventyConfig) {

  // ── Passthrough ──────────────────────────────────────────────────────────
  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });

  // ── Gallery image scanner ─────────────────────────────────────────────────
  // Used by gallery.njk to enumerate images for the lightbox.
  eleventyConfig.addGlobalData('galleries', function() {
    const cache     = {};
    const imageExts = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']);

    function scanDir(dirPath) {
      const fullPath = path.join(__dirname, 'src', dirPath);
      try {
        if (!fs.existsSync(fullPath)) return [];
        return fs.readdirSync(fullPath)
          .filter(f => imageExts.has(path.extname(f).toLowerCase()))
          .sort();
      } catch(e) { return []; }
    }

    const galleries = {};
    galleries.scan = function(dirPath) {
      if (!cache[dirPath]) cache[dirPath] = scanDir(dirPath);
      return cache[dirPath];
    };
    return galleries;
  });

  // ── Gallery collection ────────────────────────────────────────────────────
  // One entry per event shoot (src/gallery/*.md).
  // Adds thumbnailImage: the first image whose filename contains "thumbnail".
  eleventyConfig.addCollection('gallery', function(collectionApi) {
    const imageExts = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

    return collectionApi.getFilteredByGlob('src/gallery/*.md')
      .map(item => {
        if (item.data.gallery) {
          const dirPath  = `assets/images/gallery/${item.data.gallery}`;
          const fullPath = path.join(__dirname, 'src', dirPath);
          try {
            if (fs.existsSync(fullPath)) {
              const files = fs.readdirSync(fullPath);
              const thumb = files.find(f =>
                f.toLowerCase().includes('thumbnail') &&
                imageExts.has(path.extname(f).toLowerCase())
              );
              item.data.thumbnailImage = thumb ? `/${dirPath}/${thumb}` : null;
            } else {
              item.data.thumbnailImage = null;
            }
          } catch(e) {
            item.data.thumbnailImage = null;
          }
        }
        return item;
      })
      .sort((a, b) => b.date - a.date);
  });

  // ── Filters ───────────────────────────────────────────────────────────────
  eleventyConfig.addFilter('hasGallery', (content) =>
    !!(content && content.includes('<div class="gallery">')));

  eleventyConfig.addFilter('stripLeadingSlash', (str) =>
    str ? str.replace(/^\//, '') : str);

  eleventyConfig.addFilter('jsonify', (value) => JSON.stringify(value));

  eleventyConfig.addFilter('concat', (arr1, arr2) => [
    ...(Array.isArray(arr1) ? arr1 : []),
    ...(Array.isArray(arr2) ? arr2 : [])
  ]);

  // Limit an array to n items (for gallery preview grids)
  eleventyConfig.addFilter('limit', (arr, n) =>
    Array.isArray(arr) ? arr.slice(0, n) : arr);

  // Extracts the hostname from a URL for "Visit example.org" links.
  eleventyConfig.addFilter('domain', (url) => {
    try { return new URL(url).hostname; } catch(e) { return url; }
  });

  // ── Eleventy config ───────────────────────────────────────────────────────
  return {
    dir: {
      input:    'src',
      includes: '_includes',
      layouts:  '_includes/layouts',
      data:     '_data',
      output:   '_site'
    },
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine:     'njk'
  };
};
