#!/usr/bin/env node
'use strict';

const { ClassicLevel } = require('classic-level');
const fs = require('fs');
const path = require('path');

const MODULE_ROOT = path.join(__dirname, '..');
const SOURCES_ROOT = path.join(MODULE_ROOT, '..', 'biblioteka-master');

const CHECKS = [
  { kind: 'items', source: 'wod-melee/packs/_source/vampiremelee', dest: 'vampiremelee' },
  { kind: 'items', source: 'wod-ranged/packs/_source/vampireranged', dest: 'vampireranged' },
  { kind: 'items', source: 'wod-dostoinstva/packs/_source/vampiremerits', dest: 'vampiremerits' },
  { kind: 'items', source: 'wod-nedostatki/packs/_source/vampiredemerits', dest: 'vampiredemerits' },
  { kind: 'items', source: 'wod-disciplines/packs/_source/vampiredisciplines', dest: 'vampiredisciplines' },
  { kind: 'items', source: 'wod-rites/packs/_source/vampirerites', dest: 'vampirerites' },
];

const PREFIX = { items: '!items!' };

function countExcludingFolders(dir) {
  let count = 0;
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith('.')) continue; // skip tool/editor cache dirs (e.g. .impeccable, .git)
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      count += countExcludingFolders(full);
    } else if (name.endsWith('.json') && !name.startsWith('_folder')) {
      count++;
    }
  }
  return count;
}

function countJsonFilesFlat(dir) {
  return fs.readdirSync(dir).filter((n) => n.endsWith('.json')).length;
}

function expectedCount(kind, dir) {
  return kind === 'items' ? countExcludingFolders(dir) : countJsonFilesFlat(dir);
}

async function countPackKeys(destDir, prefix) {
  const db = new ClassicLevel(destDir, { keyEncoding: 'utf8', valueEncoding: 'utf8' });
  await db.open();
  let count = 0;
  for await (const key of db.keys()) {
    if (key.startsWith(prefix)) count++;
  }
  await db.close();
  return count;
}

async function main() {
  let failed = false;

  for (const check of CHECKS) {
    const sourceDir = path.join(SOURCES_ROOT, check.source);
    const destDir = path.join(MODULE_ROOT, 'packs', check.dest);
    const prefix = PREFIX[check.kind];

    if (!fs.existsSync(destDir)) {
      console.error(`FAIL [${check.dest}]: ${destDir} does not exist — run "npm run build" first`);
      failed = true;
      continue;
    }

    const expected = expectedCount(check.kind, sourceDir);
    const actual = await countPackKeys(destDir, prefix);

    if (expected !== actual) {
      console.error(`FAIL [${check.dest}]: expected ${expected} "${prefix}" records, found ${actual}`);
      failed = true;
    } else {
      console.log(`OK   [${check.dest}]: ${actual} "${prefix}" records`);
    }
  }

  if (failed) process.exit(1);
  console.log('All packs verified.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
