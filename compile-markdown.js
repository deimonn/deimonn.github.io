/*── compile-markdown.js ── Compilation of markdown docs ──*
 │
 │ Copyright (c) 2025-2026 Deimonn
 │
 │ This file is licensed under the MIT License.
 │
 │ See https://deimonn.dev/license.txt for license information.
 │
 */

// SPDX-License-Identifier: MIT

import fs from "fs";
import path from "path";

import * as marked from "marked";
import * as markedGfmHeadingId from "marked-gfm-heading-id";
import * as shiki from "shiki";

// Utility for reading files to strings.
function readFile(path) {
    return fs.readFileSync(path, { encoding: "utf-8" });
}

// Fetch arguments.
const args = process.argv.slice(2);

const submodule = args[0];
const repo = args[1];
const prefix = args[2].substring(repo.length + 1);
const target = args[3];

const input = `${submodule}/${prefix}${target}.md`;
const mainOutput = `obj/${repo}/${target}.html`;
const navOutput = `obj/${repo}/${target}.nav.html`;
const tocOutput = `obj/${repo}/${target}.toc.html`;
const nameOutput = `obj/${repo}/${target}.name.txt`;
const nav = JSON.parse(readFile(`obj/${repo}/nav-db.json`));

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
let counter = 0;
let mainHtml = await marked.parse(readFile(input), {
    walkTokens: async (token) => {
        // Process links.
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

            // Relative link to markdown.
            if (/(\.md$)|(\.md(?=#))/.test(token.href)) {
                // Remove extension.
                token.href = token.href.replace(/(\.md$)|(\.md(?=#))/, "");

                // Validate existence.
                let file = `${submodule}/${prefix}`;

                file += path.dirname(target) + "/";
                file += token.href.replace(/#.*$/, "") + ".md";

                if (!fs.existsSync(file)) {
                    console.warn(
                        `${input}: broken link to file '${file}'`
                    );
                }

                return;
            }

            // Other relative link; point to raw user content.
            let dirname = path.dirname(prefix + target);
            let href =
                `https://raw.githubusercontent.com/deimonn/` +
                `${repo}/refs/heads/master/${dirname}/${token.href}`

            token.type = "html";
            token.text = /* HTML */ `
                <a href="${href}" target="_blank">${token.text}</a>
            `.trim();

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

            // Add copy button to code block.
            token.text = /* HTML */ `
                <div class="dei-copycode">
                    <sl-copy-button from="dei-codeblock${counter}.innerText">
                        <sl-icon
                            slot="copy-icon"
                            name="clipboard-fill"
                        ></sl-icon>
                        <sl-icon
                            slot="success-icon"
                            name="clipboard-check-fill"
                        ></sl-icon>
                        <sl-icon
                            slot="error-icon"
                            name="clipboard-x-fill"
                        ></sl-icon>
                    </sl-copy-button>
                    ${token.text}
                </div>
            `;

            token.text = token.text.replace(/<code>/, /* HTML */ `
                <code id="dei-codeblock${counter}">
            `.trim());

            counter++;
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

if (fs.existsSync(`${submodule}/${prefix}categories.json`)) {
    dictionary = JSON.parse(
        readFile(`${submodule}/${prefix}categories.json`)
    );
}

for (const entry of nav) {
    const path = entry.path;

    // Remove common prefix.
    const file = path.substring(submodule.length + prefix.length + 1);
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

    // Push file entry to category.
    categories[category].files.push(entry);
}

// Generate navigation.
let navHtml = "";

for (const [_, category] of Object.entries(categories)) {
    navHtml += /* HTML */ `<h2>${category.name}</h2>`;

    for (const file of category.files) {
        // Current file, highlighted in bold.
        if (input === file.path) {
            navHtml += /* HTML */ `
                <li id="dei-currentpage">
                  <b>${file.title}</b>
                  <br>
                </li>
            `;
        }
        // Other files.
        else {
            navHtml += /* HTML */ `
                <li>
                  <a href="${file.href}">${file.title}</a>
                  <br>
                </li>
            `;
        }
    }
}

fs.writeFileSync(navOutput, navHtml);
