#!/usr/bin/env node
// M4-U4 test infrastructure, not a game-playing bot or an acceptance certificate.
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const URL = 'https://tobiasfranziskus.github.io/Check/';
const SELFTEST = process.argv.includes('--selftest');
const sec = Number(process.env.M4_U4_SELFTEST_SECONDS || 2);
if (process.argv.some(x => x.startsWith('--') && x !== '--selftest'))
  throw Error('Only --selftest is supported. Real runs always require 60 minutes.');
if (SELFTEST && (!Number.isFinite(sec) || sec <= 0 || sec > 10))
  throw Error('Selftest duration must be between 0 and 10 seconds.');
const horizon = SELFTEST ? sec * 1000 : 3600000;
function findChrome() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  const paths = process.platform === 'darwin'
    ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium']
    : process.platform === 'win32'
    ? [path.join(process.env.PROGRAMFILES || 'C:/Program Files','Google','Chrome','Application','chrome.exe'),
       path.join(process.env['PROGRAMFILES(X86)'] || 'C:/Program Files (x86)','Google','Chrome','Application','chrome.exe')]
    : ['/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'];
  return paths.find(p => fs.existsSync(p));
}
function run() {
  if (!SELFTEST && process.platform === 'linux' && !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY)
    throw Error('Visible desktop required; headless does not qualify.');
  const binary = findChrome();
  if (!binary || !fs.existsSync(binary)) throw Error('Install Chrome or set CHROME_BIN.');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(),'aphros-u4-'));
  const dir = SELFTEST && process.env.M4_U4_SELFTEST_OUTPUT
    ? process.env.M4_U4_SELFTEST_OUTPUT
    : path.join(os.homedir(),'AphrosVoid-M4-U4-Testberichte');
  fs.mkdirSync(dir,{recursive:true});
  const file = path.join(dir,new Date().toISOString().replace(/[:.]/g,'-')+(SELFTEST?'-SELFTEST':'')+'.json');
  const began = process.hrtime.bigint(), utc = new Date().toISOString();
  let closed = false, reached = false;
  const args = ['--user-data-dir='+profile,'--no-first-run','--no-default-browser-check',
    '--new-window','--window-size=1250,850',URL];
  if (process.platform === 'linux' && process.getuid?.() === 0) args.unshift('--no-sandbox');
  const child = spawn(binary,args,{stdio:'ignore'});
  function record(status) {
    const seconds = Number(process.hrtime.bigint()-began)/1e9;
    const data = { milestone:'M4-U4',status,selftest:SELFTEST,started_utc:utc,
      recorded_utc:new Date().toISOString(),url:URL,elapsed_real_seconds:+seconds.toFixed(3),
      required_seconds:3600,isolated_profile:true,page_loaded_verified:false,
      user_actions_verified:false,gameplay_and_scoring_verified:false,
      acceptance:'NOT_ESTABLISHED' };
    fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
    console.log(status+' after '+data.elapsed_real_seconds+' seconds; '+file);
  }
  function cleanup() {
    try { fs.rmSync(profile,{recursive:true,force:true}); }
    catch(e) { console.error('Temporary profile cleanup failed: '+e.message); }
  }
  const timer = setTimeout(() => {
    reached = true; record(SELFTEST?'SELFTEST_TIMER_ONLY':'60_MIN_TIME_WINDOW_ONLY');
    console.log('Close browser after observer finishes. Only independent notes can verify gameplay.');
  },horizon);
  child.once('error',e => {
    if(closed)return; closed=true; clearTimeout(timer);
    record('BROWSER_START_FAILED_'+(e.code||e.message));cleanup();process.exitCode=1;
  });
  child.once('exit',() => {
    if(closed)return; closed=true; clearTimeout(timer);
    record(SELFTEST?'SELFTEST_NOT_GAMEPLAY':reached?'60_MIN_TIME_WINDOW_ONLY':'INCOMPLETE_BEFORE_60_MIN');
    cleanup();if(!SELFTEST&&!reached)process.exitCode=2;
  });
  process.once('SIGINT',()=>child.kill());
  process.once('SIGTERM',()=>child.kill());
  console.log((SELFTEST?'SELFTEST':'M4-U4')+' isolated browser started at '+URL);
  console.log('Existing browser profiles and saved careers are not accessed.');
}
try{run();}catch(e){console.error('M4-U4 blocked: '+e.message);process.exitCode=1;}
