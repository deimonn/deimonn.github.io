/*── src/main.js ── Main template code ──*
 │
 │ Copyright (c) 2024-2025 Deimonn
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
    const themeIcon = document.getElementById("dei-themeicon");

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
    const sidebarButton = document.getElementById("dei-openaside");
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
    const backToTop = document.getElementById("dei-backtotop");

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
    const themeMenu = document.getElementById("dei-thememenu");

    // On theme selected, update theme.
    themeMenu.addEventListener("sl-select", (event) => {
        setTheme(event.detail.item.value);
    });
})();

// Create anchors for headings.
(function() {
    for (const heading of document.querySelectorAll("h1, h2, h3, h4, h5")) {
        if (!heading.id || heading.id.startsWith("dei-")) {
            continue;
        }

        heading.innerHTML += /* HTML */ `
            <a href="#${heading.id}" class="dei-anchor">
              <sl-icon name="link-45deg"></sl-icon>
            </a>
        `;
    }
})();

// Scroll to current page in navigation when present.
window.addEventListener("load", () => {
    // Fetch current page in navigation; do nothing if there's none.
    const currentPage = document.getElementById("dei-currentpage");
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
