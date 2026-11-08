The browser regression uses the actual published search page, index and minified Tipue plugin, with this checkout served by request interception at its normal HTTPS origin. It does not contact the live site. The real public jQuery CDN and other external theme resources remain browser dependencies; Google Analytics is suppressed. Each case uses a fresh disposable headless context.

Prepare the exact locked Playwright version and its Chromium inside this checkout, then run the existing browser regression:

```sh
bash tests/setup-browser.sh
npm --prefix tests test
```

Setup uses `npm ci` with the committed lockfile and downloads Chromium under `tests/node_modules`. It does not install global packages or use an authenticated profile. The check explicitly uses that local browser. Validated with Node 26.13.0 and Playwright 1.64.0-alpha-1790635538000. Keep the dependency and browser artifacts together when removing a disposable checkout. The test reads the original search page from commit 017625404e9175f82a7a8efcbdc9a04cdaa1c334; retain that Git history for its before controls.

The original page demonstrates blocked HTTP jQuery; a second control changes only jQuery to HTTPS and still cannot return the known result. The repaired page must load all 20 index entries, return the Zika article and follow its link, and show the existing Nothing found message for an absent query. Search-resource failures and unexpected errors fail the check. Existing font mixed-content warnings, the legacy theme's a.charAt error and two broken decorative icon URLs are recorded separately; article-page theme errors after following the result are outside the search repair.
