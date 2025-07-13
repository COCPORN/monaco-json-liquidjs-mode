# Product Requirements Document (PDR): Monaco Mode for LiquidJS with JSON-bound Autocompletion

## Overview

The goal is to create a custom Monaco Editor language mode that simplifies editing LiquidJS templates. This includes syntax highlighting, error checking, and—most importantly—context-aware autocompletion based on a provided example JSON file representing the bound data model.

## Goals

Enable efficient authoring of LiquidJS templates.

Provide syntax highlighting and error checking for LiquidJS syntax.

Provide autocomplete for data keys from an example JSON file.

Support autocompletion inside LiquidJS expressions and filters (e.g., `{{ user.name | capitalize }}`).

Optional: Provide hover tooltips and signature help based on data types.

## User Stories

As a developer, I want syntax highlighting for LiquidJS tags so I can visually distinguish template logic from text.

As a template author, I want autocompletion for {{ }} and {% %} expressions using data keys from my sample JSON so I can write templates faster and with fewer mistakes.

As a power user, I want to hover over template expressions and see data type hints from the JSON model.

## Technical Components

Language Definition
Create a custom Monaco language definition named liquidjs.

Include rules for:

{{ expression }}

{% tag %} blocks

Comments {# ... #}

Highlight control flow (e.g., if, for, endif, endfor) and filters (e.g., | capitalize).

## JSON Integration
Accept a sample JSON data object as input.

Parse the structure recursively to build a symbol table of available keys.

Autocomplete suggestions should reflect nested paths (e.g., user.name, user.address.city).

Autocompletion
Triggered inside {{ ... }} and {% ... %} tags.

Suggest keys from the JSON structure.

Provide a display label, full path, and optionally, type information inferred from the JSON value.

Bonus: Support fuzzy matching.

## Hover / Tooltip Support
When hovering over a data key, show value type (string, number, object, array, etc.).

Optionally include example value from the JSON.

Diagnostics (Optional)
Warn on invalid variable paths not found in the provided JSON model.

Highlight mismatched or unclosed tags (e.g., if, for).

## API / Usage
ts
Copy
Edit
registerLiquidJSLanguage(monaco: MonacoNamespace, sampleData: object): void;
Registers the mode and enables autocompletion using sampleData.

## Stretch Goals
Integration with Monaco's snippet system for common template structures (e.g., loops, conditionals).

Live preview pane integration for rendering the template with the example data.

Ability to mark parts of the JSON as optional or repeatable (e.g., for for loops).

**Hover Provider for Logic Tags**: Extend the hover provider to show tooltips for variables inside logic tags (`{% if user.name == 'John' %}`), not just output tags.


## Preferred technology

Prefer using `pnpm` for package management.

## Example implementation

This might be helpful. If not, please ignore:

```ts
monaco.languages.register({ id: 'liquid' });

monaco.languages.registerCompletionItemProvider('liquid', {
    provideCompletionItems: () => {
        var autocompleteProviderItems = [];
        var keywords = ['assign', 'capture', 'endcapture', 'increment', 'decrement',
                    'if', 'else', 'elsif', 'endif', 'for', 'endfor', 'break',
                    'continue', 'limit', 'offset', 'range', 'reversed', 'cols',
                    'case', 'endcase', 'when', 'block', 'endblock', 'true', 'false',
                    'in', 'unless', 'endunless', 'cycle', 'tablerow', 'endtablerow',
                    'contains', 'startswith', 'endswith', 'comment', 'endcomment',
                    'raw', 'endraw', 'editable', 'endentitylist', 'endentityview', 'endinclude',
                    'endmarker', 'entitylist', 'entityview', 'forloop', 'image', 'include',
                    'marker', 'outputcache', 'plugin', 'style', 'text', 'widget',
                    'abs', 'append', 'at_least', 'at_most', 'capitalize', 'ceil', 'compact',
                    'concat', 'date', 'default', 'divided_by', 'downcase', 'escape',
                    'escape_once', 'first', 'floor', 'join', 'last', 'lstrip', 'map',
                    'minus', 'modulo', 'newline_to_br', 'plus', 'prepend', 'remove',
                    'remove_first', 'replace', 'replace_first', 'reverse', 'round',
                    'rstrip', 'size', 'slice', 'sort', 'sort_natural', 'split', 'strip',
                    'strip_html', 'strip_newlines', 'times', 'truncate', 'truncatewords',
                    'uniq', 'upcase', 'url_decode', 'url_encode'];

        for (var i = 0; i < keywords.length; i++) {
            autocompleteProviderItems.push({ 'label': keywords[i], kind: monaco.languages.CompletionItemKind.Keyword });
        }

        return {suggestions: autocompleteProviderItems};
    }
});

monaco.editor.create(document.getElementById("container"), {
	language: "liquid-json"
});
  
```
