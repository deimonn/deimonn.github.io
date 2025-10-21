/*── compile-db.js ── Compilation of database ──*
 │
 │ Copyright (c) 2025 Deimonn
 │
 │ This file is licensed under the MIT License.
 │
 │ See https://deimonn.dev/license.txt for license information.
 │
 */

// SPDX-License-Identifier: MIT

import fs from "fs";

import * as marked from "marked";

// Utility for reading files to strings.
function readFile(path) {
    return fs.readFileSync(path, { encoding: "utf-8" });
}

// Parse inputs.
const db = [];

const repo = process.argv[2];
const prefix = process.argv[3];

const output = `dist/${repo}/db.json`;
const inputs = process.argv.slice(4);

for (const input of inputs) {
    // Initialize entry and push it to database.
    const entry = {
        path: input
    };

    db.push(entry);

    // Generate link.
    const href = input.substring(15 + prefix.length, input.length - 3);
    entry.href = `/${repo}/${href}`;

    // Read file contents.
    entry.content = readFile(input);

    // Determine title.
    const lines = entry.content.trim().split("\n");
    if (lines.length != 0 && lines[0].startsWith("# ")) {
        entry.title = await marked.parseInline(lines[0].substring(2));
    } else {
        entry.title = entry.href;
    }
}

// Write database to disk.
fs.writeFileSync(output, JSON.stringify(db));
