"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLiquidJSLanguage = registerLiquidJSLanguage;
function getObjectFromPath(obj, path) {
    if (!path) {
        return obj;
    }
    return path.split('.').reduce((currentObject, key) => {
        return currentObject && typeof currentObject === 'object' ? currentObject[key] : undefined;
    }, obj);
}
function validate(model, monacoNs, sampleData) {
    const markers = [];
    const lines = model.getLinesContent();
    const tagStack = [];
    lines.forEach((line, i) => {
        // Check for invalid variables
        const expressions = line.matchAll(/\{\{([^}]+)\}\}/g);
        for (const match of expressions) {
            const expression = match[1].trim().split('|')[0].trim();
            if (getObjectFromPath(sampleData, expression) === undefined) {
                markers.push({
                    message: `Variable "${expression}" not found in data model.`,
                    severity: monacoNs.MarkerSeverity.Error,
                    startLineNumber: i + 1,
                    startColumn: match.index + 3,
                    endLineNumber: i + 1,
                    endColumn: match.index + 3 + expression.length,
                });
            }
        }
        // Check for mismatched tags
        const tags = line.matchAll(/\{%([^%]+)%\}/g);
        for (const match of tags) {
            const tagContent = match[1].trim();
            const parts = tagContent.split(' ');
            const tagName = parts[0];
            if (['if', 'for', 'case'].includes(tagName)) {
                tagStack.push({ tag: tagName, line: i + 1 });
            }
            else if (['endif', 'endfor', 'endcase'].includes(tagName)) {
                if (tagStack.length === 0) {
                    markers.push({
                        message: `Unexpected closing tag "${tagName}".`,
                        severity: monacoNs.MarkerSeverity.Error,
                        startLineNumber: i + 1,
                        startColumn: match.index + 3,
                        endLineNumber: i + 1,
                        endColumn: match.index + 3 + tagName.length,
                    });
                }
                else {
                    const lastTag = tagStack.pop();
                    if (lastTag && lastTag.tag !== tagName.substring(3)) {
                        markers.push({
                            message: `Mismatched closing tag. Expected "end${lastTag.tag}" but got "${tagName}".`,
                            severity: monacoNs.MarkerSeverity.Error,
                            startLineNumber: i + 1,
                            startColumn: match.index + 3,
                            endLineNumber: i + 1,
                            endColumn: match.index + 3 + tagName.length,
                        });
                    }
                }
            }
        }
    });
    tagStack.forEach(unclosedTag => {
        markers.push({
            message: `Unclosed tag "${unclosedTag.tag}".`,
            severity: monacoNs.MarkerSeverity.Error,
            startLineNumber: unclosedTag.line,
            startColumn: 1,
            endLineNumber: unclosedTag.line,
            endColumn: lines[unclosedTag.line - 1].length + 1,
        });
    });
    monacoNs.editor.setModelMarkers(model, 'liquid-json', markers);
}
function registerLiquidJSLanguage(monacoNs, initialSampleData) {
    const languageId = 'liquid-json';
    let currentSampleData = initialSampleData;
    // Register the language once
    monacoNs.languages.register({ id: languageId });
    // Set language configuration
    monacoNs.languages.setLanguageConfiguration(languageId, {
        brackets: [
            ['{%', '%}'],
            ['{{', '}}'],
            ['{#', '#}']
        ],
        autoClosingPairs: [
            { open: '{%', close: ' %}' },
            { open: '{{', close: ' }}' },
            { open: '{#', close: ' #}' },
        ]
    });
    const liquidKeywords = ['assign', 'capture', 'endcapture', 'increment', 'decrement',
        'if', 'else', 'elsif', 'endif', 'for', 'endfor', 'break',
        'continue', 'limit', 'offset', 'range', 'reversed', 'cols',
        'case', 'endcase', 'when', 'block', 'endblock', 'true', 'false',
        'in', 'unless', 'endunless', 'cycle', 'tablerow', 'endtablerow',
        'contains', 'startswith', 'endswith', 'comment', 'endcomment',
        'raw', 'endraw', 'abs', 'append', 'at_least', 'at_most', 'capitalize', 'ceil', 'compact',
        'concat', 'date', 'default', 'divided_by', 'downcase', 'escape',
        'escape_once', 'first', 'floor', 'join', 'last', 'lstrip', 'map',
        'minus', 'modulo', 'newline_to_br', 'plus', 'prepend', 'remove',
        'remove_first', 'replace', 'replace_first', 'reverse', 'round',
        'rstrip', 'size', 'slice', 'sort', 'sort_natural', 'split', 'strip',
        'strip_html', 'strip_newlines', 'times', 'truncate', 'truncatewords',
        'uniq', 'upcase', 'url_decode', 'url_encode'];
    // Set Monarch tokens provider
    monacoNs.languages.setMonarchTokensProvider(languageId, {
        keywords: liquidKeywords,
        tokenizer: {
            root: [
                [/\\{\\{/, ''],
                [/\\{%/, ''],
                [/\\{#/, ''],
                [/{{/, { token: 'delimiter.expression', next: '@expression' }],
                [/{%/, { token: 'delimiter.tag', next: '@tag' }],
                [/{#/, { token: 'comment', next: '@comment' }]
            ],
            expression: [
                [/}}/, { token: 'delimiter.expression', next: '@pop' }],
                [/[^}]+/, '']
            ],
            tag: [
                [/%}/, { token: 'delimiter.tag', next: '@pop' }],
                [/\b(if|for|case)\b/, 'keyword.control'],
                [/\b(endif|endfor|endcase)\b/, 'keyword.control'],
                [/\b(else|elsif|when)\b/, 'keyword.control'],
                [/\b(assign|capture|increment|decrement)\b/, 'keyword'],
                [/[a-zA-Z_][\w]*/, {
                        cases: {
                            '@keywords': 'keyword',
                            '@default': 'identifier'
                        }
                    }],
                [/\|/, 'delimiter'],
                [/"[^"]*"/, 'string'],
                [/'[^']*'/, 'string'],
                [/\d+/, 'number'],
                [/\s+/, '']
            ],
            comment: [
                [/#}/, { token: 'comment', next: '@pop' }],
                [/[^#]+/, 'comment'],
                [/#/, 'comment']
            ]
        }
    });
    // Register completion item provider
    monacoNs.languages.registerCompletionItemProvider(languageId, {
        triggerCharacters: ['.', ' '],
        provideCompletionItems: (model, position) => {
            const textUntilPosition = model.getValueInRange({
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
            });
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
            };
            const lastOpen = textUntilPosition.lastIndexOf('{{');
            const lastClose = textUntilPosition.lastIndexOf('}}');
            if (lastOpen > lastClose) {
                const expressionText = textUntilPosition.substring(lastOpen + 2).trim();
                const parts = expressionText.split(/\|/)[0].trim().split('.');
                const parentPath = parts.slice(0, -1).join('.');
                const parentObject = getObjectFromPath(currentSampleData, parentPath);
                if (parentObject && typeof parentObject === 'object') {
                    const keys = Object.keys(parentObject);
                    const suggestions = keys.map(key => {
                        const value = parentObject[key];
                        const kind = typeof value === 'object' && value !== null
                            ? monacoNs.languages.CompletionItemKind.Module
                            : monacoNs.languages.CompletionItemKind.Variable;
                        return {
                            label: key,
                            kind: kind,
                            insertText: key,
                            range: range,
                        };
                    });
                    return { suggestions: suggestions };
                }
                return { suggestions: [] };
            }
            const keywordSuggestions = liquidKeywords.map(keyword => ({
                label: keyword,
                kind: monacoNs.languages.CompletionItemKind.Keyword,
                insertText: keyword,
                range: range,
            }));
            const topLevelKeySuggestions = Object.keys(currentSampleData).map(key => ({
                label: key,
                kind: monacoNs.languages.CompletionItemKind.Variable,
                insertText: key,
                range: range,
            }));
            return { suggestions: [...keywordSuggestions, ...topLevelKeySuggestions] };
        }
    });
    // Setup validation
    monacoNs.editor.onDidCreateModel(model => {
        if (model.getLanguageId() === languageId) {
            validate(model, monacoNs, currentSampleData);
            const listener = model.onDidChangeContent(() => {
                validate(model, monacoNs, currentSampleData);
            });
            model.onWillDispose(() => {
                listener.dispose();
            });
        }
    });
    // Return the update function
    return {
        update: (newSampleData) => {
            currentSampleData = newSampleData;
            // Re-validate all models with the new data
            monacoNs.editor.getModels().forEach(model => {
                if (model.getLanguageId() === languageId) {
                    validate(model, monacoNs, currentSampleData);
                }
            });
        }
    };
}
