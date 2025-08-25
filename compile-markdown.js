/*── compile-markdown.js ── Compilation of markdown docs ──*
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
import * as markedGfmHeadingId from "marked-gfm-heading-id";
import * as shiki from "shiki";

// Utility for reading files to strings.
function readFile(path) {
    return fs.readFileSync(path, { encoding: "utf-8" });
}

// Fetch arguments.
const args = process.argv.slice(2);

const repo = args[0];
const target = args[1];

const input = `src/submodules/${repo}/${target}.md`;
const mainOutput = `obj/${repo}/${target}.html`;
const navOutput = `obj/${repo}/${target}.nav.html`;
const tocOutput = `obj/${repo}/${target}.toc.html`;
const nameOutput = `obj/${repo}/${target}.name.txt`;
const listing = readFile(`obj/${repo}.list`).trim().split(' ');

// Fetch highlighter theme.
const oroTheme = JSON.parse(readFile("obj/oro-theme.json"));

oroTheme.name = "oro";

// Configure highlighting.
const highlighter = await shiki.createHighlighter({
    langs: ["c", "cpp", "shell", "xml"],
    themes: ["light-plus", oroTheme]
});

const languages = highlighter.getLoadedLanguages();

// Configure markdown compiler.
marked.use(markedGfmHeadingId.gfmHeadingId());
marked.use({
    async: true
});

// Compile markdown.
let mainHtml = await marked.parse(readFile(input), {
    walkTokens: async (token) => {
        // Process relative links.
        if (token.type === "link") {
            // Same document; nothing to do.
            if (token.href.startsWith("#")) {
                return;
            }

            // Absolute link; make it open in a new tab.
            if (/^[a-z]+:\/\//i.test(token.href)) {
                token.type = "html";
                token.text = /* HTML */ `
                    <a href="${token.href}" target="_blank">${token.text}</a>
                `.trim();

                return;
            }

            // Remove '.md' extension from links.
            token.href = token.href.replace(/(\.md$)|(\.md(?=#))/, "");
            return;
        }

        // Process code blocks.
        if (token.type === "code") {
            // Replace unknown languages with plain text.
            let lang = (token.lang ?? "txt").toLowerCase();
            if (!languages.includes(lang)) {
                lang = "txt";
            }

            // Update token.
            token.type = "html";
            token.text = highlighter.codeToHtml(token.text, {
                lang,
                themes: {
                    light: "light-plus",
                    dark: "oro"
                }
            });

            return;
        }

        // Remove HTML tags.
        if (token.type === "html") {
            console.warn("removed html tag found in markdown: " + token.text);
            token.text = "";
            return;
        }
    }
});

fs.writeFileSync(mainOutput, mainHtml);

// Generate table of contents.
const headings = markedGfmHeadingId.getHeadingList();

let tocHtml = "";

for (const heading of headings) {
    tocHtml += /* HTML */ `
        <a href="#${heading.id}" style="margin-left: ${heading.level - 1}em">
            - ${heading.text}
        </a>
        <br>
    `;
}

fs.writeFileSync(tocOutput, tocHtml);

// Generate title.
let title;
if (headings.length == 0) {
    fs.writeFileSync(nameOutput, title = "untitled");
} else {
    fs.writeFileSync(nameOutput, title = headings[0].text);
}

// Classify files into categories as per directory structure.
const categories = {};
let dictionary = {};

if (fs.existsSync(`src/submodules/${repo}/categories.json`)) {
    dictionary = JSON.parse(readFile(`src/submodules/${repo}/categories.json`));
}

for (const path of listing) {
    // Remove common prefix.
    const file = path.substring(16 + repo.length);
    if (!file.includes("/")) {
        continue;
    }

    // Fetch or create category.
    const [category] = file.split("/");

    if (categories[category] === undefined) {
        categories[category] = {
            name: category in dictionary ? dictionary[category] : category,
            files: []
        };
    }

    // Fetch file title.
    const fileContents = readFile(path).trim().split("\n");

    let fileTitle;
    if (fileContents.length != 0 && fileContents[0].startsWith("# ")) {
        fileTitle = await marked.parseInline(fileContents[0].substring(2));
    } else {
        fileTitle = path;
    }

    // Push file entry to category.
    categories[category].files.push({
        name: fileTitle,
        path: file
    });
}

// Generate navigation.
let navHtml = "";

for (const [_, category] of Object.entries(categories)) {
    navHtml += /* HTML */ `<h2>${category.name}</h2>`;

    for (const file of category.files) {
        if (input == `${repo}/${file.path}`) {
            navHtml += /* HTML */ `
                <li>
                  <b>${file.name}</b>
                  <br>
                </li>
            `;
        } else {
            const path = file.path.substring(0, file.path.length - 3);
            navHtml += /* HTML */ `
                <li>
                  <a href="/${repo}/${path}">${file.name}</a>
                  <br>
                </li>
            `;
        }
    }
}

fs.writeFileSync(navOutput, navHtml);
