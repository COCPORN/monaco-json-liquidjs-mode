import * as monaco from 'monaco-editor';

export function registerLiquidJSLanguage(monacoNs: typeof monaco, sampleData: object): void {
    monacoNs.languages.register({ id: 'liquid-json' });

    monacoNs.languages.registerCompletionItemProvider('liquid-json', {
        provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };

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
                autocompleteProviderItems.push({
                    label: keywords[i],
                    kind: monacoNs.languages.CompletionItemKind.Keyword,
                    insertText: keywords[i],
                    range: range
                });
            }

            // Add sample data keys to autocomplete
            const dataKeys = Object.keys(sampleData);
            for (const key of dataKeys) {
                autocompleteProviderItems.push({
                    label: key,
                    kind: monacoNs.languages.CompletionItemKind.Variable,
                    insertText: key,
                    range: range
                });
            }

            return { suggestions: autocompleteProviderItems };
        }
    });
}
