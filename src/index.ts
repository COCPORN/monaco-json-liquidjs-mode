import * as monaco from 'monaco-editor';

function getNestedObjectPaths(obj: {[key: string]: any}, parentKey: string = ''): string[] {
    let keys: string[] = [];
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const newKey = parentKey ? `${parentKey}.${key}` : key;
            keys.push(newKey);
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                keys = keys.concat(getNestedObjectPaths(obj[key], newKey));
            }
        }
    }
    return keys;
}

export function registerLiquidJSLanguage(monacoNs: typeof monaco, sampleData: object): void {
    monacoNs.languages.register({ id: 'liquid-json' });

    const liquidKeywords = ['assign', 'capture', 'endcapture', 'increment', 'decrement',
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

    const dataKeys = getNestedObjectPaths(sampleData);

    monacoNs.languages.registerCompletionItemProvider('liquid-json', {
        provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };

            const lineContent = model.getLineContent(position.lineNumber);
            const textBefore = lineContent.substring(0, position.column -1);

            let suggestions = [];

            // Keyword suggestions
            suggestions.push(...liquidKeywords.map(keyword => ({
                label: keyword,
                kind: monacoNs.languages.CompletionItemKind.Keyword,
                insertText: keyword,
                range: range
            })));
            
            // Nested object suggestions
            const liquidExpressionMatch = textBefore.match(/\{\{\s*([\w\.]*)$/);
            if(liquidExpressionMatch) {
                const currentPath = liquidExpressionMatch[1];
                const parts = currentPath.split('.');
                
                let keys = dataKeys;
                if (parts.length > 1) {
                    const parentPath = parts.slice(0, -1).join('.');
                    keys = dataKeys.filter(k => k.startsWith(parentPath + '.') && k.split('.').length === parts.length);
                } else {
                    keys = dataKeys.filter(k => k.split('.').length === 1);
                }

                suggestions.push(...keys.map(key => ({
                    label: key,
                    kind: monacoNs.languages.CompletionItemKind.Variable,
                    insertText: key,
                    range: range
                })));
            } else {
                 suggestions.push(...dataKeys.filter(k => k.split('.').length === 1).map(key => ({
                    label: key,
                    kind: monacoNs.languages.CompletionItemKind.Variable,
                    insertText: key,
                    range: range
                })));
            }


            return { suggestions: suggestions };
        }
    });
}
