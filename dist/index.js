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
function registerLiquidJSLanguage(monacoNs, sampleData) {
    const languageId = 'liquid-json';
    monacoNs.languages.register({ id: languageId });
    monacoNs.languages.setLanguageConfiguration(languageId, {
        brackets: [
            ['{%', '%}'],
            ['{{', '}}'],
            ['{#', '#}']
        ],
        autoClosingPairs: [
            { open: '{%', close: ' %}' },
            { open: '{{', close: ' }}' },
            { open: '{#', close: ' #}' }
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
    monacoNs.languages.registerCompletionItemProvider(languageId, {
        triggerCharacters: ['.', ' '],
        provideCompletionItems: (model, position) => {
            const textUntilPosition = model.getValueInRange({
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            });
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };
            // Check if we are inside a Liquid expression {{ ... }}
            const lastOpen = textUntilPosition.lastIndexOf('{{');
            const lastClose = textUntilPosition.lastIndexOf('}}');
            if (lastOpen > lastClose) {
                // We are inside an expression
                const expressionText = textUntilPosition.substring(lastOpen + 2).trim();
                const parts = expressionText.split(/\|/)[0].trim().split('.');
                const currentWord = parts[parts.length - 1];
                const parentPath = parts.slice(0, -1).join('.');
                const parentObject = getObjectFromPath(sampleData, parentPath);
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
                            range: range
                        };
                    });
                    return { suggestions: suggestions };
                }
                return { suggestions: [] };
            }
            // If not in an expression, suggest keywords and top-level keys
            const keywordSuggestions = liquidKeywords.map(keyword => ({
                label: keyword,
                kind: monacoNs.languages.CompletionItemKind.Keyword,
                insertText: keyword,
                range: range
            }));
            const topLevelKeySuggestions = Object.keys(sampleData).map(key => ({
                label: key,
                kind: monacoNs.languages.CompletionItemKind.Variable,
                insertText: key,
                range: range
            }));
            return { suggestions: [...keywordSuggestions, ...topLevelKeySuggestions] };
        }
    });
}
