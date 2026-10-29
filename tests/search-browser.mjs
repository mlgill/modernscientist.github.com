// Run with: node tests/search-browser.mjs ABSOLUTE_PLAYWRIGHT_MODULE
// Uses a disposable browser context; no authenticated profile or live site writes.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';

assert.equal(process.argv.length, 3, 'Supply the installed Playwright module path explicitly');
assert.ok(path.isAbsolute(process.argv[2]));
const {chromium} = await import(pathToFileURL(process.argv[2]).href);
const root = fileURLToPath(new URL('../', import.meta.url));
const current = await fs.readFile(path.join(root, 'search.html'), 'utf8');
const original = execFileSync('git', ['show', '017625404e9175f82a7a8efcbdc9a04cdaa1c334:search.html'], {cwd: root, encoding: 'utf8'});
const before = original.replace('src="http://ajax.googleapis.com/', 'src="https://ajax.googleapis.com/');
const browser = await chromium.launch({headless: true});
const knownTitle = 'Prediction of Zika Outbreaks';
const knownPath = '/posts/2016/2016-09-28-prediction_of_zika_outbreaks/';
try {
  for (const [name, html, query] of [['original', original, 'Zika'], ['before', before, 'Zika'], ['known', current, 'Zika'], ['none', current, 'zznonexistentsearchcontrolzz']]) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [], failures = [], responses = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {if (message.type() === 'error') errors.push(message.text());});
    page.on('requestfailed', request => failures.push({url: request.url(), error: request.failure()?.errorText}));
    page.on('response', response => responses.push({url: response.url(), status: response.status()}));
    await context.route('https://modernscientist.com/**', async route => {
      const url = new URL(route.request().url());
      let filename = path.join(root, decodeURIComponent(url.pathname));
      try {
        if ((await fs.stat(filename)).isDirectory()) filename = path.join(filename, 'index.html');
        const body = url.pathname === '/search.html' ? html : await fs.readFile(filename);
        const types = {'.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.woff': 'font/woff'};
        await route.fulfill({status: 200, ...(Object.hasOwn(types, path.extname(filename)) ? {contentType: types[path.extname(filename)]} : {}), body});
      } catch {await route.fulfill({status: 404, body: 'Missing fixture resource'});}
    });
    await context.route(/google-analytics\.com\//, route => route.fulfill({status: 204}));
    await page.goto('https://modernscientist.com/search.html?q=' + query, {waitUntil: 'networkidle'});
    const result = await page.locator('#tipue_search_content').innerText();
    if (name === 'original') {
      assert.ok(failures.some(failure => /jquery/.test(failure.url) && failure.error === 'mixed-content'));
      assert.equal(await page.locator('#tipue_search_content a').count(), 0);
    } else if (name === 'before') {
      assert.equal(await page.locator('#tipue_search_content a').count(), 0);
      assert.equal(result.includes(knownTitle), false);
      assert.ok(responses.some(response => new URL(response.url).pathname === '/tipuesearch_content.js' && response.status === 200), 'before control fetches the JavaScript index as JSON');
    } else {
      assert.deepEqual(errors.filter(error => !/insecure stylesheet.*fonts.googleapis.com|a.charAt is not a function|Failed to load resource: the server responded with a status of 404/.test(error)), []);
      assert.ok(responses.some(response => response.url === 'https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js' && response.status === 200));
      const index = responses.filter(response => new URL(response.url).pathname === '/tipuesearch_content.js');
      assert.equal(index.length, 1); assert.equal(index[0].status, 200);
      assert.equal(await page.evaluate(() => tipuesearch.pages.length), 20);
      assert.deepEqual(failures.filter(failure => !failure.url.startsWith('http://fonts.googleapis.com/')), []);
      assert.deepEqual(responses.filter(response => response.status >= 400 && !/^https:\/\/modernscientist.com\/theme\/css\/theme\/images\/(rss|email)\.png\?/.test(response.url)), []);
      if (name === 'known') {
        assert.ok(result.includes(knownTitle));
        const link = page.locator('#tipue_search_content a').filter({hasText: knownTitle}).first();
        assert.equal(new URL(await link.getAttribute('href')).pathname, knownPath);
        await Promise.all([page.waitForNavigation({waitUntil: 'domcontentloaded'}), link.click()]);
        assert.equal(new URL(page.url()).pathname, knownPath);
        assert.equal(await page.locator('h1.entry-title').textContent(), knownTitle);
      } else {
        assert.equal(result.trim(), 'Nothing found');
        assert.equal(await page.locator('#tipue_search_content a').count(), 0);
      }
    }
    console.log(JSON.stringify({case: name, result: ['original', 'before'].includes(name) ? 'broken as expected' : 'passed', errors, failures, badResponses: responses.filter(response => response.status >= 400)}));
    await context.close();
  }
} finally {await browser.close();}
