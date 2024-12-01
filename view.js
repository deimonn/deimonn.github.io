/*── view.js ── Docs viewer scripting ──*
 │
 │ Copyright (c) 2024 Deimonn (a.k.a. Nahuel S. Cisterna)
 │
 │ This file is licensed under the MIT License.
 │
 │ See https://raw.githubusercontent.com/deimonn/deimonn.github.io/master/LICENSE for license information.
 │
 */

// SPDX-License-Identifier: MIT

// Imports.
import { createHighlighter } from "https://cdn.jsdelivr.net/npm/shiki@1.24.0/+esm";

// Constants.
const rawGitHubContent = `https://raw.githubusercontent.com`;

// Utility to escape file paths.
function escapeFilePath(path) {
    return encodeURIComponent(path).replaceAll("%2F", "/").replaceAll("%23", "#");
}

// Utility to throw on failed fetch.
function assertSuccess(response) {
    if (!response.ok) {
        throw new Error(
            `Failed to fetch ${response.url}: ${response.status} ${response.statusText}`
        );
    }
}

// Open side nav button.
const sidebar = document.querySelector("#dd-sidebar");
const sidebarOpenButton = document.querySelector("#dd-open-nav");

let sidebarOpen = false;

sidebarOpenButton.addEventListener("click", () => {
    if (sidebarOpen) {
        sidebarOpen = false;
        sidebar.style = "";
        sidebarOpenButton.innerHTML = /* HTML */ `<sl-icon name="list"></sl-icon>`;
    } else {
        sidebarOpen = true;
        sidebar.style = "display: block";
        sidebarOpenButton.innerHTML = /* HTML */ `<sl-icon name="arrow-left"></sl-icon>`;
    }
});

try {
    // Parse parameters.
    const params = new URLSearchParams(window.location.search);

    // Fetch the project/repository name. Required; redirect to home if missing.
    const repo = params.get("r");
    if (!repo) {
        window.location.pathname = "/";
    }

    // Update title and repository.
    document.title = `${repo} - deimonn.dev`;

    const projectTitle = document.querySelector("#dd-project-title");
    projectTitle.innerHTML = repo;
    projectTitle.setAttribute("href", `/view?r=${repo}`);

    const projectGitHub = document.querySelector("#dd-project-github");
    projectGitHub.setAttribute("href", `https://github.com/deimonn/${repo}`);

    // Configure highlighting.
    const languages = ["c", "cpp", "c++", "bash", "sh", "shell", "zsh"];
    const highlighter = await createHighlighter({
        langs: ["c", "cpp", "shell"],
        themes: [
            "light-plus",
            await fetch("/shiki/themes/oro.json").then(response => {
                assertSuccess(response);
                return response.json();
            })
        ]
    });

    // Configure marked.
    marked.use(markedGfmHeadingId.gfmHeadingId());
    marked.use({
        async: true
    });

    // Fetch repository tags.
    const tagsUri = `${rawGitHubContent}/deimonn/${repo}/refs/heads/master/docs.tags.json`;
    const tags = await fetch(tagsUri).then(response => {
        if (response.status == 404) {
            return [];
        }

        assertSuccess(response);
        return response.json();
    });

    // Figure out current tag.
    const tag = params.get("t") ?? (tags.length > 0 ? tags[0] : "master");
    const ref = tag === "master" ? "heads/master" : `tags/${tag}`;

    // Update tags.
    const projectTags = document.querySelector("#dd-project-tags");

    projectTags.children[0].innerHTML = /* HTML */ `
        <sl-icon slot="prefix" name="tag-fill"></sl-icon> ${tag}
    `;

    projectTags.children[1].innerHTML = /* HTML */ `
        <a href="/view?r=${repo}&t=master">
          <sl-menu-item>master</sl-menu-item>
        </a>
    `;

    for (const tag of tags) {
        projectTags.children[1].innerHTML += /* HTML */ `
            <a href="/view?r=${repo}&t=${tag}">
              <sl-menu-item>${tag}</sl-menu-item>
            </a>
        `;
    }

    // Update home link.
    projectTitle.setAttribute("href", `/view?r=${repo}&t=${tag}`);

    // Fetch index file.
    const dataUri = `${rawGitHubContent}/deimonn/${repo}/refs/${ref}/docs.index.json`;
    const data = await fetch(dataUri).then(response => {
        assertSuccess(response);
        return response.json();
    });

    // Build navigation.
    const projectNav = document.querySelector("#dd-project-nav");

    projectNav.innerHTML = "";

    for (const category of data.categories) {
        projectNav.innerHTML += /* HTML */ `<h2>${category.name}</h2>`;

        for (const file of category.files) {
            projectNav.innerHTML += /* HTML */ `
                <li>
                  <a href="/view?r=${repo}&t=${tag}&f=${escapeFilePath(file.path)}">
                    ${file.name}
                  </a>
                  <br>
                </li>
            `;
        }
    }

    // Fetch document.
    const path = params.get("f") ?? data.index;

    const contentUri = `${rawGitHubContent}/deimonn/${repo}/refs/${ref}/${path}`;
    const content = await fetch(contentUri).then(response => {
        assertSuccess(response);
        return response.text();
    });

    // Render document.
    let render = await marked.parse(content, {
        walkTokens: async token => {
            // Process relative links.
            if (token.type === "link") {
                // Hash link; nothing to do.
                if (token.href.startsWith('#')) {
                    return;
                }

                // Other link.
                const re = /^[a-z]+:\/\//i;
                if (!re.test(token.href)) {
                    let base = path.split('/');
                    let href = token.href.split('/');

                    base.pop();
                    while (href[0] == '..') {
                        base.pop();
                        href.splice(0, 1);
                    }

                    let file = base.join("/") + "/" + href.join("/");
                    if (file.startsWith("/")) {
                        file = file.slice(1);
                    }

                    file = escapeFilePath(file);

                    if (token.href.split('#')[0].endsWith(".md")) {
                        token.href = `/view?r=${repo}&t=${tag}&f=${file}`;
                    } else {
                        token.href = `${rawGitHubContent}/deimonn/${repo}/refs/${ref}/${file}`;
                    }
                }
            }

            // Process code blocks.
            if (token.type === "code") {
                let lang = (token.lang ?? "text").toLowerCase();
                if (!languages.includes(lang)) {
                    lang = "text";
                }

                token.type = "html";
                token.pre = true;
                token.block = true;

                token.text = await highlighter.codeToHtml(token.text, {
                    lang,
                    themes: {
                        light: "light-plus",
                        dark: "oro"
                    }
                });
            }
        }
    });

    // Sanitize.
    render = DOMPurify.sanitize(render);

    // Update document.
    document.querySelector("#dd-document").innerHTML = render;

    // Update table of contents.
    const headings = markedGfmHeadingId.getHeadingList();
    const toc = document.querySelector("#dd-toc");

    toc.innerHTML = /* HTML */ `<h2>Table of Contents</h2>`;

    for (const heading of headings) {
        toc.innerHTML += /* HTML */ `
            <a href="#${heading.id}" style="margin-left: ${heading.level - 1}em">
              - ${heading.raw}
            </a>
            <br>
        `;
    }

    // Move to heading if specified.
    if (window.location.hash != "") {
        document.querySelector(window.location.hash).scrollIntoView();
    }
} catch (e) {
    document.querySelector("#dd-error-text").innerHTML = e.toString();
    document.querySelector("#dd-error-alert").toast();
    throw e;
}
