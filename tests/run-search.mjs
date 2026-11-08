// Use this checkout's exact locked browser dependency and disposable browser data.
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const result=spawnSync(process.execPath,[fileURLToPath(new URL('./search-browser.mjs',import.meta.url)),fileURLToPath(new URL('./node_modules/playwright/index.mjs',import.meta.url))],{stdio:'inherit',env:{...process.env,PLAYWRIGHT_BROWSERS_PATH:'0'}});
if(result.error)throw result.error;
if(result.signal)throw new Error('Browser check interrupted by '+result.signal);
process.exitCode=result.status;
