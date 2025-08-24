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

// Theme initialization.
setTheme(localStorage.getItem("theme") ?? "system");
