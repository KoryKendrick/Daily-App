/* Bundles index.html + styles.css + app.js into one self-contained file.
   Run: node build-single-file.js   ->   daily-app-single-file.html          */
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');

const out = html
  .replace('<link rel="stylesheet" href="styles.css" />', '<style>\n' + css + '\n</style>')
  .replace('<script src="app.js"></script>', '<script>\n' + js + '\n</script>')
  // no separate files to point at in a single-file build
  .replace(/\s*<link rel="manifest"[^>]*>/, '')
  .replace(/\s*<link rel="icon"[^>]*>/, '')
  .replace(/\s*<link rel="apple-touch-icon"[^>]*>/, '');

fs.writeFileSync('daily-app-single-file.html', out);
console.log('daily-app-single-file.html  ' + (out.length / 1024).toFixed(1) + ' KB');
