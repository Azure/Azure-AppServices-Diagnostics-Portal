//
// This script is required because the library /@angular-react/core/src/lib/components/wrapper-component.d.ts
// has a bug in the version we are using. Till we have a fixed version from the author, we are using this as 
// workaround.
//

var fs = require('fs');
var filePath = 'node_modules/@angular-react/core/src/lib/components/wrapper-component.d.ts';
var fileContentsArray = fs.readFileSync(filePath, 'utf8').split('\n');
console.log('Read file contents, going to write now');

if (fileContentsArray[0].indexOf('/// <reference types=') > -1 
  && fileContentsArray[0].indexOf('libs/core/src/lib/@types/geteventlisteners')) {
  console.log("Found line to remove");
  fileContentsArray.splice(0,1);
} else{
  console.log(filePath + ' already updated');
  return;
}

const file = fs.createWriteStream(filePath);
file.on('error', (err) => {
  console.log("Encounter error " + JSON.stringify(err));
});

fileContentsArray.forEach((v) => {
  file.write(v + '\n');
});

file.end();
console.log (filePath + ' updated');