#!/usr/bin/env node
"use strict";

var _fs = _interopRequireDefault(require("fs"));

var _htmlToText = require("html-to-text");

var _lowdb = _interopRequireDefault(require("lowdb"));

var _cliOptions = _interopRequireDefault(require("./cli-options"));

var _path = _interopRequireDefault(require("path"));

var _puppeteer = _interopRequireDefault(require("puppeteer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const fs = _fs.default.promises;

require('dotenv').config();

async function setUpPuppeteer() {
  const browser = await _puppeteer.default.launch({
    headless: false
  });
  const page = await browser.newPage(); // Show console logs from within page.evaluate

  page.on('console', msg => {
    for (let i = 0; i < msg.args().length; ++i) console.log(`${i}: ${msg.args()[i]}`);
  });
  return [browser, page];
}

async function signIn(page) {
  await page.waitForSelector('input[name="username"]');
  await page.type('input[name="username"]', process.env.USERNAME);
  await page.type('input[name="password"]', process.env.PASSWORD);
  await Promise.all([// Wait for click that triggers navigation
  page.waitForNavigation({
    waitUntil: 'domcontentloaded'
  }), page.click('input[name="login"]')]);
  await page.waitForSelector('.maintitle');
}

async function getListOfPosts(page) {
  return await await page.evaluate(() => {
    const elements = document.querySelectorAll('.row3 .name');
    const results = [];

    for (const el of elements) {
      const author = el.firstChild.innerText;
      const numReplies = el.parentNode.parentNode.querySelectorAll('span.postdetails a[href^="postings_popup.php"]')[0].innerText;
      const title = el.parentNode.parentNode.querySelectorAll('a.topictitle')[0].innerText;
      const href = el.parentNode.parentNode.querySelectorAll('a.topictitle')[0].href;
      results.push([title, author, numReplies, href]);
    }

    return results;
  });
}

async function getAnalysisPostsForMonth(page, year, month) {
  const posts = await getListOfPosts(page);
  return await posts.filter(([title, author, numReplies]) => {
    function titleDoesNotContain() {
      const args = [].slice.call(arguments);
      return args.every(string => !title.toLowerCase().includes(string.toLowerCase()));
    }

    return titleDoesNotContain('no webinar', 'holiday') && author === 'AlBrooks' || author === 'BPAAdmin' && numReplies > 0;
  });
}

async function processPosts(page, analysisPosts) {
  for (const post of analysisPosts) {
    const [postTitle,,, url] = post;
    await page.goto(url);
    await page.waitForSelector('div.quote'); // first quote:
    //   each bar is after a <br>

    const analysisHTML = await page.evaluate(() => document.querySelectorAll('div.quote')[0].innerHTML);
    const analysis = (0, _htmlToText.htmlToText)(analysisHTML);
    console.log(analysis);
  }
}

async function scrape() {
  const [year, month] = await (0, _cliOptions.default)();
  const [browser, page] = await setUpPuppeteer();
  await page.goto('https://www.brookspriceaction.com/viewforum.php?f=1');
  await signIn(page);
  const analysisPosts = await getAnalysisPostsForMonth(page, year, month);
  await processPosts(page, analysisPosts.slice(0, 1)); // browser.close()
}

scrape();
//# sourceMappingURL=index.js.map