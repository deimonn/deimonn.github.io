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
const output = process.argv[2];
const inputs = process.argv.slice(3);

for (const input of inputs) {
    // Initialize entry and push it to database.
    const entry = {
        path: input
    }

    db.push(entry);

    // Read file contents.
    entry.content = readFile(input).trim().split("\n");

    // Determine title.
    if (entry.content.length != 0 && entry.content[0].startsWith("# ")) {
        entry.title = await marked.parseInline(entry.content[0].substring(2));
    } else {
        entry.title = entry.path;
    }
}

// Write database to disk.
fs.writeFileSync(output, JSON.stringify(db));
