const fs = require('fs');
const t = fs.readFileSync('inngest_debug.txt','utf8');

// Find all error-like patterns
const patterns = [
  /Failed to load[^"\\]*/g,
  /Error:[^"\\]*/g,
  /Cannot find[^"\\]*/g,
  /MODULE_NOT_FOUND[^"\\]*/g,
];

patterns.forEach(p => {
  const matches = t.match(p);
  if (matches) {
    matches.forEach(m => console.log(m));
    console.log('---');
  }
});
