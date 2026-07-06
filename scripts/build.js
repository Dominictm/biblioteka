#!/usr/bin/env node
'use strict';

const { ClassicLevel } = require('classic-level');
const fs = require('fs');
const path = require('path');

const MODULE_ROOT = path.join(__dirname, '..');
const SOURCES_ROOT = path.join(MODULE_ROOT, '..', 'biblioteka-master');

const STATS_TEMPLATE = {
  compendiumSource: null,
  duplicateSource: null,
  exportSource: null,
  coreVersion: '13.351',
  systemId: 'worldofdarkness',
  systemVersion: '7.1.2',
  lastModifiedBy: null,
};

function readJsonFilesRecursive(dir) {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      files.push(...readJsonFilesRecursive(full));
    } else if (name.endsWith('.json')) {
      files.push(full);
    }
  }
  return files;
}

async function compileItems(sourceDir, destDir) {
  if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true });
  fs.mkdirSync(destDir, { recursive: true });

  const db = new ClassicLevel(destDir, { keyEncoding: 'utf8', valueEncoding: 'utf8' });
  await db.open();

  const folders = [];
  const items = [];
  for (const full of readJsonFilesRecursive(sourceDir)) {
    const doc = JSON.parse(fs.readFileSync(full, 'utf8'));
    if (path.basename(full).startsWith('_folder')) folders.push(doc);
    else items.push(doc);
  }

  const now = Date.now();
  const batch = db.batch();
  for (const doc of folders) {
    doc._stats = { ...STATS_TEMPLATE, createdTime: now, modifiedTime: now };
    batch.put(`!folders!${doc._id}`, JSON.stringify(doc));
  }
  for (const doc of items) {
    batch.put(`!items!${doc._id}`, JSON.stringify(doc));
  }
  await batch.write();
  await db.close();

  return { folders: folders.length, items: items.length };
}

async function compileActors(sourceDir, destDir) {
  if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true });
  fs.mkdirSync(destDir, { recursive: true });

  const db = new ClassicLevel(destDir, { keyEncoding: 'utf8', valueEncoding: 'utf8' });
  await db.open();

  const batch = db.batch();
  let count = 0;
  for (const name of fs.readdirSync(sourceDir)) {
    if (!name.endsWith('.json')) continue;
    const doc = JSON.parse(fs.readFileSync(path.join(sourceDir, name), 'utf8'));
    batch.put(`!actors!${doc._id}`, JSON.stringify(doc));
    count++;
  }
  await batch.write();
  await db.close();

  return { actors: count };
}

async function compileJournals(sourceDir, destDir) {
  if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true });
  fs.mkdirSync(destDir, { recursive: true });

  const db = new ClassicLevel(destDir, { keyEncoding: 'utf8', valueEncoding: 'utf8' });
  await db.open();

  const batch = db.batch();
  let journals = 0;
  let pages = 0;
  for (const name of fs.readdirSync(sourceDir)) {
    if (!name.endsWith('.json')) continue;
    const doc = JSON.parse(fs.readFileSync(path.join(sourceDir, name), 'utf8'));
    const docPages = doc.pages || [];
    const journalDoc = { ...doc, pages: docPages.map((p) => p._id) };
    batch.put(`!journal!${doc._id}`, JSON.stringify(journalDoc));
    journals++;
    for (const page of docPages) {
      batch.put(`!journal.pages!${doc._id}.${page._id}`, JSON.stringify(page));
      pages++;
    }
  }
  await batch.write();
  await db.close();

  return { journals, pages };
}

const LIBRARIES = [
  { kind: 'items', source: 'wod-melee/packs/_source/vampiremelee', dest: 'vampiremelee' },
  { kind: 'items', source: 'wod-ranged/packs/_source/vampireranged', dest: 'vampireranged' },
  { kind: 'items', source: 'wod-dostoinstva/packs/_source/vampiremerits', dest: 'vampiremerits' },
  { kind: 'items', source: 'wod-nedostatki/packs/_source/vampiredemerits', dest: 'vampiredemerits' },
  { kind: 'items', source: 'wod-disciplines/packs/_source/vampiredisciplines', dest: 'vampiredisciplines' },
  { kind: 'items', source: 'wod-rites/packs/_source/vampirerites', dest: 'vampirerites' },
  { kind: 'actors', source: 'wod-npc/packs/_source/actors', dest: 'npcactors' },
  { kind: 'journals', source: 'wod-npc/packs/_source/journals', dest: 'npcjournals' },
];

const COMPILERS = { items: compileItems, actors: compileActors, journals: compileJournals };

async function main() {
  for (const lib of LIBRARIES) {
    const sourceDir = path.join(SOURCES_ROOT, lib.source);
    const destDir = path.join(MODULE_ROOT, 'packs', lib.dest);
    const stats = await COMPILERS[lib.kind](sourceDir, destDir);
    console.log(`[${lib.dest}] ${JSON.stringify(stats)} -> ${destDir}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
