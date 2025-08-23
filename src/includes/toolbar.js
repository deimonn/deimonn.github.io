/*── toolbar.js ── Toolbar scripting ──*
 │
 │ Copyright (c) 2024 Deimonn (a.k.a. Nahuel S. Cisterna)
 │
 │ This file is licensed under the MIT License.
 │
 │ See https://raw.githubusercontent.com/deimonn/deimonn.github.io/master/LICENSE for license information.
 │
 */

// SPDX-License-Identifier: MIT

// Returns the current theme setting.
function getTheme() {
    return window.localStorage.getItem("theme") ?? "system";
}

// Sets and applies a theme site-wide.
function setTheme(theme) {
    const html = document.documentElement;

    // Save theme setting.
    window.localStorage.setItem("theme", theme);

    // Update document class.
    if (theme === "light") {
        html.className = "";
    } else if (theme === "dark") {
        html.className = "sl-theme-dark";
    } else {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            html.className = "sl-theme-dark";
        } else {
            html.className = "";
        }
    }
}

// Updates the icon indicating selected theme in the toolbar.
function refreshSelectedTheme(theme) {
    const themeIcon = document.querySelector("#dd-theme-icon");

    if (theme === "light") {
        themeIcon.setAttribute("name", "sun-fill");
    } else if (theme === "dark") {
        themeIcon.setAttribute("name", "moon-fill");
    } else {
        themeIcon.setAttribute("name", "circle-half");
    }
}

// Back-to-top button.
const backToTop = document.querySelector("#dd-back-to-top");

// Event handler on scroll, to display or hide the back-to-top button.
document.addEventListener("scroll", () => {
    if (window.scrollY > 800) {
        backToTop.setAttribute("style", "");
    } else {
        backToTop.setAttribute("style", "display: none");
    }
});

// Event handler when back-to-top button is clicked.
backToTop.addEventListener("click", () => {
    window.scrollTo(0, 0);
    window.location.hash = "";
});

// Event handler for when a new theme is selected.
document.querySelector("#dd-theme-menu").addEventListener("sl-select", event => {
    const detail = event.detail;
    refreshSelectedTheme(detail.item.value);
    setTheme(detail.item.value);
});

// Refresh the theme when script is loaded.
setTheme(getTheme());
refreshSelectedTheme(getTheme());
