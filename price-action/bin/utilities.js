"use strict";

const fs = require('fs').promises;

const path = require('path');

async function writeLocalFile(pathName, content) {
  const saveDir = 'exports';
  await fs.rm(path.join(__dirname, saveDir, pathName)).catch(() => {});
  return await fs.writeFile(path.join(__dirname, saveDir, pathName), content);
}

async function makeLocalFolder() {
  const dirNames = [].slice.call(arguments);
  const dirPath = path.join(__dirname, '/..', 'exports', ...dirNames);
  return await fs.mkdir(dirPath, {
    recursive: true
  }).catch(() => {});
}

module.exports = {
  writeLocalFile,
  makeLocalFolder
};
//# sourceMappingURL=utilities.js.map