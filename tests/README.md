The browser regression uses the actual published search page, index and minified Tipue plugin, with this checkout served by request interception at its normal HTTPS origin. It does not contact the live site. The real public jQuery CDN and other external theme resources remain browser dependencies; Google Analytics is suppressed. Each case uses a fresh disposable headless context.

Run with Node.js and an explicitly selected installed Playwright module:

```sh
node tests/search-browser.mjs /absolute/path/to/playwright/index.mjs
```

Validated with Node 26.12.1 and Playwright 1.64.0-alpha-1790635538000 using its cached Chromium. No repository dependency installation or authenticated browser profile is needed. The test reads the original search page from commit 017625404e9175f82a7a8efcbdc9a04cdaa1c334; retain that Git history for its before controls.

The original page demonstrates blocked HTTP jQuery; a second control changes only jQuery to HTTPS and still cannot return the known result. The repaired page must load all 20 index entries, return the Zika article and follow its link, and show the existing Nothing found message for an absent query. Search-resource failures and unexpected errors fail the check. Existing font mixed-content warnings, the legacy theme's a.charAt error and two broken decorative icon URLs are recorded separately; article-page theme errors after following the result are outside the search repair.
