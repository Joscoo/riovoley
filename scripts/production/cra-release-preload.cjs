'use strict';
// Isolated process only: do not load or expand any .env files during a signed release build.
const {createRequire}=require('node:module'),assert=require('node:assert/strict');
const expected=Object.fromEntries(Object.entries(process.env).filter(([name])=>name.startsWith('REACT_APP_')));
const fromCra=createRequire(require.resolve('react-scripts/config/env.js'));
fromCra('dotenv').config=()=>({parsed:{}});
const actual=require('react-scripts/config/env.js')('').raw;
for(const [name,value]of Object.entries(expected))assert.equal(actual[name],value,'RELEASE_CLIENT_ENV_CHANGED');
assert.ok(Object.keys(actual).filter(name=>name.startsWith('REACT_APP_')).every(name=>Object.hasOwn(expected,name)),'UNEXPECTED_RELEASE_CLIENT_ENV');
