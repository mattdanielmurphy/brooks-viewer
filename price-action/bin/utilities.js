"use strict";

const cheerio = require('cheerio');

const axios = require('axios').default;

const fs = require('fs').promises;

const path = require('path');

async function fetchHtml(url) {
  const {
    data
  } = await axios.get(url);
  return cheerio.load(data);
}

async function writeLocalFile(pathName, content) {
  const saveDir = 'exports';
  await fs.rm(path.join(__dirname, saveDir, pathName)).catch(() => {});
  return await fs.writeFile(path.join(__dirname, saveDir, pathName), content);
}

async function makeLocalFolder() {
  const dirNames = [].slice.call(arguments);
  const dirPath = path.join(__dirname, 'exports', ...dirNames);
  return await fs.mkdir(dirPath, {
    recursive: true
  }).catch(() => {});
}

module.exports = {
  fetchHtml,
  writeLocalFile,
  makeLocalFolder
};
//# sourceMappingURL=utilities.js.map