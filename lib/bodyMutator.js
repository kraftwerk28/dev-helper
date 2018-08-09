'use strict';

const fs = require('fs');

module.exports = (fileName, port) => {
  if (!(fileName.endsWith('.html') || fileName.endsWith('.htm'))) {
    throw new Error('file format is not valid');
  }
  const script = fs.readFileSync(__dirname + '/clientws.html', 'utf-8')
    .replace(/\n/g, '')
    .replace(/8080/, port ? port : 8080)
    .concat('\n');

  let content = fs.readFileSync(fileName, 'utf8');
  let i = content.search('</body>');
  i = (i === -1) ? content.length : i;
  return content.slice(0, i) + script + content.slice(i);
};
