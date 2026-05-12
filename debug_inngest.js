const fs = require('fs');
const t = fs.readFileSync('inngest_debug.txt','utf8');

// Try to find JSON error
const jsonMatch = t.match(/"message":"([^"]+)"/);
if (jsonMatch) {
  console.log("JSON Error:", jsonMatch[1]);
}

// Try to find Error text
const errMatch = t.match(/Error:[^<]+/);
if (errMatch) {
  console.log("Error:", errMatch[0]);
}

// Try to find stack trace in script data
const scriptMatch = t.match(/"stack":"([^"]+)"/);
if (scriptMatch) {
  console.log("Stack:", scriptMatch[1].replace(/\\n/g, '\n'));
}

if (!jsonMatch && !errMatch && !scriptMatch) {
  console.log("No error pattern found. File length:", t.length);
  // Print any text between Error and next HTML tag
  const allErrors = t.match(/[Ee]rror[^<]{0,300}/g);
  if (allErrors) {
    allErrors.forEach(e => console.log("Found:", e));
  }
}
