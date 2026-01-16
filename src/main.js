/*── src/main.js ── Main template code ──*
 │
 │ Copyright (c) 2024-2026 Deimonn
 │
 │ This file is licensed under the MIT License.
 │
 │ See https://deimonn.dev/license.txt for license information.
 │
 */

// SPDX-License-Identifier: MIT

// Sets and applies a theme site-wide.
function setTheme(theme) {
    const html = document.documentElement;
    const themeIcon = document.getElementById("theme-icon");

    // Save theme setting.
    localStorage.setItem("theme", theme);

    // Update document class and theme icon.
    if (theme === "light") {
        html.className = "";
        themeIcon.setAttribute("name", "sun-fill");
    } else if (theme === "dark") {
        html.className = "sl-theme-dark";
        themeIcon.setAttribute("name", "moon-fill");
    } else {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            html.className = "sl-theme-dark";
        } else {
            html.className = "";
        }

        themeIcon.setAttribute("name", "circle-half");
    }
}

// Open sidebar button.
(function() {
    const sidebarButton = document.getElementById("open-aside");
    if (!sidebarButton) {
        return;
    }

    const sidebar = document.getElementsByTagName("aside")[0];
    let isOpen = false;

    // On click, show/hide sidebar.
    sidebarButton.addEventListener("click", () => {
        if (isOpen) {
            isOpen = false;
            sidebar.style = "";
            sidebarButton.innerHTML =
                /* HTML */ `<sl-icon name="list"></sl-icon>`;
        } else {
            isOpen = true;
            sidebar.style = "display: block";
            sidebarButton.innerHTML =
                /* HTML */ `<sl-icon name="arrow-left"></sl-icon>`;
        }
    });
})();

// Back-to-top button.
(function() {
    const backToTop = document.getElementById("back-to-top");

    // On scroll, display/hide the button.
    document.addEventListener("scroll", () => {
        if (window.scrollY > 800) {
            backToTop.setAttribute("style", "");
        } else {
            backToTop.setAttribute("style", "display: none");
        }
    });

    // On click, scroll the window.
    backToTop.addEventListener("click", () => {
        window.scrollTo(0, 0);
        window.location.hash = "";
    });
})();

// Theme selection menu.
(function() {
    const themeMenu = document.getElementById("theme-menu");

    // On theme selected, update theme.
    themeMenu.addEventListener("sl-select", (event) => {
        setTheme(event.detail.item.value);
    });
})();

// Create anchors for headings.
(function() {
    for (const heading of document.querySelectorAll("h1, h2, h3, h4, h5")) {
        if (!heading.id) {
            continue;
        }

        heading.innerHTML += /* HTML */ `
            <a href="#${heading.id}" class="anchor">
              <sl-icon name="link-45deg"></sl-icon>
            </a>
        `;
    }
})();

// Search functionality.
(function() {
    // Fetch elements.
    const searchInput = document.getElementById("search-input");
    const navMain = document.getElementById("nav-main");
    const navSearch = document.getElementById("nav-search");

    if (!searchInput | !navMain || !navSearch) {
        return;
    }

    // Initialize.
    const repo = searchInput.dataset.repo;

    let db = null;
    let dbFetch = false;
    let search = null;
    let mainResult = null;

    let searchFocused = false;

    // On input change.
    searchInput.addEventListener("sl-input", async () => {
        search = searchInput.value.trim();

        // Cleared; show main navigation again, hide search results.
        if (search === "") {
            navMain.style = "";
            navSearch.style = "display: none";
            return;
        }

        // Hide main navigation, show search results.
        navMain.style = "display: none";
        navSearch.style = "";

        // Load database if not already loaded.
        if (db === null) {
            // Don't fetch more than once.
            if (dbFetch) {
                return;
            }

            dbFetch = true;

            // Display spinner.
            navSearch.innerHTML = /* HTML */ `
                <div class="search-flex">
                  <sl-spinner></sl-spinner>
                </div>
            `;

            // Download and parse database.
            const response = await fetch(`/${repo}/search-db.json`);
            if (!response.ok) {
                // Display error on failure.
                navSearch.innerHTML = /* HTML */ `
                    <div class="search-flex">
                      <p class="search-error">
                        <sl-icon name="exclamation-octagon"></sl-icon><br>
                        Failed to download database:<br>
                        ${response.status} ${response.statusText}
                      </p>
                    </div>
                `;

                // Allow retrying and give up for this attempt.
                dbFetch = false;
                return;
            }

            db = await response.json();
        }

        // Perform search.
        const results = [];
        const terms = search.split(/ /g);

        for (const entry of db) {
            // Initialize result.
            let result = {
                score: 0,
                titleMatches: [],
                contentMatches: [],
                entry
            };

            // Look for terms.
            let termsMatched = {};
            for (let term of terms) {
                // Ignore terms shorter than 3 characters.
                if (term.length < 3) {
                    continue;
                }

                // Ignore casing.
                const title = entry.title.toLowerCase();
                const content = entry.content.toLowerCase();

                term = term.toLowerCase();

                // In title.
                let match, index = 0;
                while ((match = title.indexOf(term, index)) != -1) {
                    // Increase score.
                    result.score += 5;

                    // Add title match.
                    const titleMatch = entry.title.substring(
                        match,
                        match + term.length
                    );

                    if (!(titleMatch in result.titleMatches)) {
                        result.titleMatches.push(titleMatch);
                    }

                    // Mark term as matched.
                    termsMatched[term] = true;

                    index = match + term.length;
                }

                // In content.
                index = 0;
                while ((match = content.indexOf(term, index)) != -1) {
                    // Increase core.
                    result.score++;

                    // Add content match.
                    const contentMatch = entry.content.substring(
                        match,
                        match + term.length
                    );

                    if (!(contentMatch in result.contentMatches)) {
                        result.contentMatches.push(contentMatch);
                    }

                    // Mark term as matched.
                    termsMatched[term] = true;

                    index = match + term.length;
                }
            }

            // Multiply score based on number of unique terms that were matched.
            result.score *= Object.entries(termsMatched).length;

            // Result has at least some score; push.
            if (result.score > 0) {
                results.push(result);
            }
        }

        // Sort by score.
        results.sort((lhs, rhs) => rhs.score - lhs.score);

        // Clear HTML.
        navSearch.innerHTML = "";

        // No results.
        if (results.length === 0) {
            navSearch.innerHTML += /* HTML */ `
                <div class="search-flex">
                  <p>Search found no results</p>
                </div>
            `;

            return;
        }

        // Too many results; truncate.
        if (results.length > 20) {
            results.length = 20;
            navSearch.innerHTML += /* HTML */ `
                <div class="search-flex">
                  <p>>20 hits; showing most relevant</p>
                </div>
            `;
        }

        navSearch.innerHTML += /* HTML */ `
            <div class="search-flex">
                <p>⏎ Enter goes to first result</p>
            </div>
        `;

        // Generate result HTML.
        for (let result of results) {
            const entry = result.entry;

            let title = entry.title;
            let preview = entry.content;

            // Mark title matches.
            for (const match of result.titleMatches) {
                title = title.replaceAll(match, `\x1B\x0B${match}\x1B\x0C`);
            }

            // Mark content matches.
            for (const match of result.contentMatches) {
                preview = preview.replaceAll(match, `\x1B\x0B${match}\x1B\x0C`);
            }

            // Limit preview to three highlighted lines.
            let lines = 0;

            preview = preview
                .split(/\n/g)
                .filter((x) => {
                    if (lines >= 3) {
                        return false;
                    }

                    if (x.includes("\x1B")) {
                        lines++;
                        return true;
                    }

                    return false;
                })
                .join("\n");

            // Escape content HTML.
            preview = preview
                .replaceAll("&",  "&amp;")
                .replaceAll("<",  "&lt;")
                .replaceAll(">",  "&gt;")
                .replaceAll("\"", "&quot;")
                .replaceAll("'",  "&#39;");

            // Perform replacements.
            title = title
                .replaceAll("\x1B\x0B", `<span class="search-highlight">`)
                .replaceAll("\x1B\x0C", `</span>`);
            preview = preview
                .replaceAll("\x1B\x0B", `<span class="search-highlight">`)
                .replaceAll("\x1B\x0C", `</span>`)
                .replaceAll("\n", "<br>");

            // Append HTML.
            navSearch.innerHTML += /* HTML */ `
                <li>
                  <a href="${entry.href}">
                    ${title}
                    <p>${preview}</p>
                  </a>
                </li>
            `;
        }

        // Set main result.
        mainResult = results[0].entry;
    });

    // On '/', focus search.
    document.addEventListener("keydown", (event) => {
        if (event.key === "/" && !searchFocused) {
            event.preventDefault();
            searchInput.focus();
        }
    });

    // On enter, go to the first result.
    searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            window.location.href = mainResult.href;
        }
    });

    // On escape, clear search.
    searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            searchInput.value = "";
            searchInput.dispatchEvent(new Event("sl-input", {}));
        }
    });

    // Track search input focus state.
    searchInput.addEventListener("focusin", () => searchFocused = true);
    searchInput.addEventListener("focusout", () => searchFocused = false);
})();

// Scroll to current page in navigation when present.
window.addEventListener("load", () => {
    // Fetch current page in navigation; do nothing if there's none.
    const currentPage = document.getElementById("current-page");
    if (!currentPage) {
        return;
    }

    // Save old window scroll because scrollIntoView() is going to mess with it.
    const windowTop = window.scrollY;

    // Scroll to current page in navigation.
    currentPage.scrollIntoView({ behavior: "instant", block: "center" });

    // Restore old window scroll.
    window.scrollTo({ behavior: "instant", top: windowTop });
});

// Theme initialization.
setTheme(localStorage.getItem("theme") ?? "system");
