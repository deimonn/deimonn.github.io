# *── Makefile ── Makefile for deimonn.dev ──*
# │
# │ Copyright (c) 2025 Deimonn
# │
# │ This file is licensed under the MIT License.
# │
# │ See https://deimonn.dev/license.txt for license information.
# │
# *

# SPDX-License-Identifier: MIT

.DEFAULT_GOAL = all

# List of all targets.
targets =

# Licenses.
dist/license.txt: LICENSE
	cp -f $< $@

targets += dist/license.txt

# Scripts.
dist/main.js: src/main.js
	cp -f $< $@

targets += dist/main.js

# Oro theme.
obj/oro-theme.zip:
	curl -Lo $@ https://github.com/deimonn/oro-theme/releases/download/v2.8.0/oro-theme-2.8.0.vsix
obj/oro-theme.json: obj/oro-theme.zip
	unzip -p $< extension/dist/mainTheme.json > $@

# 404 page.
dist/404.html: src/templates/error.html src/main.html
	# Generate intermediate.
	TEMPLATE_NAME=error \
	TEMPLATE_HTML=$$(cat $<) \
	PAGE_ICON=/assets/icons/error.png \
	PAGE_TITLE="404 Not Found - deimonn.dev" \
	envsubst '$$TEMPLATE_NAME,$$TEMPLATE_HTML,$$PAGE_ICON,$$PAGE_TITLE' \
		< src/main.html > obj/404.html.in
	
	# Generate final.
	ERROR_TITLE="404 Not Found" \
	ERROR_DESCRIPTION="The page you're trying to access could not be found" \
	envsubst '$$ERROR_TITLE,$$ERROR_DESCRIPTION' \
		< obj/404.html.in > $@

targets += dist/404.html

# Home page.
dist/index.html: src/templates/home.html src/main.html
	TEMPLATE_NAME=home \
	TEMPLATE_HTML=$$(cat $<) \
	PAGE_ICON=/assets/icons/home.png \
	PAGE_TITLE=deimonn.dev \
	envsubst '$$TEMPLATE_NAME,$$TEMPLATE_HTML,$$PAGE_ICON,$$PAGE_TITLE' \
		< src/main.html > $@

targets += dist/index.html

# Documentation for 'void-guides'.
void_guides_sources = \
	src/submodules/void-guides/index.md \
	$(wildcard src/submodules/void-guides/*/*.md)
void_guides_outputs = \
	$(patsubst src/submodules/void-guides/%.md,dist/void-guides/%.html,$(void_guides_sources))

obj/void-guides.list: $(void_guides_sources)
	echo '$(sort $(void_guides_sources))' > $@

dist/void-guides/%.html: \
    src/templates/docs.html src/main.html src/submodules/void-guides/%.md \
    compile-markdown.js obj/oro-theme.json obj/void-guides.list
	
	# Create directories.
	mkdir -p "$$(dirname $(subst dist/void-guides/,obj/void-guides/,$@))"
	mkdir -p "$$(dirname $@)"
	
	# Compile markdown.
	node compile-markdown.js \
		void-guides void-guides/ \
		$(patsubst dist/void-guides/%.html,%,$@)
	
	# Generate page from template.
	TEMPLATE_NAME="docs" \
	TEMPLATE_HTML="$$(cat $<)" \
	PAGE_ICON="/assets/icons/docs.png" \
	envsubst '$$TEMPLATE_NAME,$$TEMPLATE_HTML,$$PAGE_ICON' \
		< src/main.html > $(patsubst dist/void-guides/%.html,obj/void-guides/%.in.html,$@)
	
	PAGE_TITLE="$$(cat $(patsubst dist/void-guides/%.html,obj/void-guides/%.name.txt,$@)) - void-guides - deimonn.dev" \
	DOCS_REPO="void-guides" \
	DOCS_MAINHTML="$$(cat $(patsubst dist/void-guides/%.html,obj/void-guides/%.html,$@))" \
	DOCS_NAVHTML="$$(cat $(patsubst dist/void-guides/%.html,obj/void-guides/%.nav.html,$@))" \
	DOCS_TOCHTML="$$(cat $(patsubst dist/void-guides/%.html,obj/void-guides/%.toc.html,$@))" \
	envsubst '$$PAGE_TITLE,$$DOCS_REPO,$$DOCS_MAINHTML,$$DOCS_NAVHTML,$$DOCS_TOCHTML' \
		< $(patsubst dist/void-guides/%.html,obj/void-guides/%.in.html,$@) > $@

targets += $(void_guides_outputs)

# *───────*
# │ Phony
# *

# Build.
.PHONY: all
all: assets dirs $(targets)

# Clean up artifacts.
.PHONY: clean
clean: ; -rm -rf dist/ obj/

# Create the build directories.
.PHONY: dirs
dirs: ; mkdir -p dist/ obj/

# Copy assets.
.PHONY: assets
assets:
	mkdir -p dist/assets
	cp -ruf src/assets/* dist/assets/

# Debugging utility.
debug-% : ; $(info $* is a $(flavor $*) variable set to [$($*)]) @true
