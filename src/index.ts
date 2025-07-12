import * as monaco from 'monaco-editor';

interface IObject {
    [key: string]: any;
}

function isObject(item: any): item is IObject {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

function mergeDeep(target: IObject, ...sources: IObject[]): IObject {
    if (!sources.length) {
        return target;
    }
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) {
                    Object.assign(target, { [key]: {} });
                }
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}


function getObjectFromPath(obj: any, path: string): any {
    if (!path || path === '') {
        return obj;
    }
    return path.split('.').reduce((currentObject, key) => {
        return currentObject && typeof currentObject === 'object' ? currentObject[key] : undefined;
    }, obj);
}

function validate(model: monaco.editor.ITextModel, monacoNs: typeof monaco, sampleData: object): void {
    const markers: monaco.editor.IMarkerData[] = [];
    const lines = model.getLinesContent();
    const tagStack: { tag: string, line: number }[] = [];

    lines.forEach((line: string, i: number) => {
        const expressions = line.matchAll(/\{\{([^}]+)\}\}/g);
        for (const match of expressions) {
            const expression = match[1].trim().split('|')[0].trim();
            if (expression && getObjectFromPath(sampleData, expression) === undefined) {
                markers.push({
                    message: `Variable "${expression}" not found in data model.`,
                    severity: monacoNs.MarkerSeverity.Error,
                    startLineNumber: i + 1,
                    startColumn: match.index! + 3,
                    endLineNumber: i + 1,
                    endColumn: match.index! + 3 + expression.length,
                });
            }
        }

        const tags = line.matchAll(/\{%([^%]+)%\}/g);
        for (const match of tags) {
            const tagContent = match[1].trim();
            const parts = tagContent.split(' ');
            const tagName = parts[0];

            if (['if', 'for', 'case'].includes(tagName)) {
                tagStack.push({ tag: tagName, line: i + 1 });
            } else if (['endif', 'endfor', 'endcase'].includes(tagName)) {
                const lastTag = tagStack.pop();
                if (!lastTag) {
                    markers.push({
                        message: `Unexpected closing tag "${tagName}".`,
                        severity: monacoNs.MarkerSeverity.Error,
                        startLineNumber: i + 1,
                        startColumn: match.index! + 3,
                        endLineNumber: i + 1,
                        endColumn: match.index! + 3 + tagName.length,
                    });
                } else if (lastTag.tag !== tagName.substring(3)) {
                    markers.push({
                        message: `Mismatched closing tag. Expected "end${lastTag.tag}" but got "${tagName}".`,
                        severity: monacoNs.MarkerSeverity.Error,
                        startLineNumber: i + 1,
                        startColumn: match.index! + 3,
                        endLineNumber: i + 1,
                        endColumn: match.index! + 3 + tagName.length,
                    });
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

export function registerLiquidJSLanguage(monacoNs: typeof monaco, initialSampleData: object | object[]) {
    const languageId = 'liquid-json';
    let currentSampleData: IObject = {};

    const setData = (data: object | object[]) => {
        const dataArray = (Array.isArray(data) ? data : [data]) as IObject[];
        currentSampleData = mergeDeep({}, ...dataArray);

        monacoNs.editor.getModels().forEach((model: monaco.editor.ITextModel) => {
            if (model.getLanguageId() === languageId) {
                validate(model, monacoNs, currentSampleData);
            }
        });
    };

    setData(initialSampleData);

    monacoNs.languages.register({ id: languageId });

    monacoNs.languages.setLanguageConfiguration(languageId, {
        brackets: [['{%', '%}'], ['{{', '}}'], ['{#', '#}']],
        autoClosingPairs: [
            { open: '{%', close: ' %}' },
            { open: '{{', close: ' }}' },
            { open: '{#', close: ' #}' },
        ]
    });

    const liquidKeywords = ['assign', 'capture', 'endcapture', 'increment', 'decrement', 'if', 'else', 'elsif', 'endif', 'for', 'endfor', 'break', 'continue', 'limit', 'offset', 'range', 'reversed', 'cols', 'case', 'endcase', 'when', 'block', 'endblock', 'true', 'false', 'in', 'unless', 'endunless', 'cycle', 'tablerow', 'endtablerow', 'contains', 'startswith', 'endswith', 'comment', 'endcomment', 'raw', 'endraw', 'abs', 'append', 'at_least', 'at_most', 'capitalize', 'ceil', 'compact', 'concat', 'date', 'default', 'divided_by', 'downcase', 'escape', 'escape_once', 'first', 'floor', 'join', 'last', 'lstrip', 'map', 'minus', 'modulo', 'newline_to_br', 'plus', 'prepend', 'remove', 'remove_first', 'replace', 'replace_first', 'reverse', 'round', 'rstrip', 'size', 'slice', 'sort', 'sort_natural', 'split', 'strip', 'strip_html', 'strip_newlines', 'times', 'truncate', 'truncatewords', 'uniq', 'upcase', 'url_decode', 'url_encode'];

    monacoNs.languages.setMonarchTokensProvider(languageId, {
        keywords: liquidKeywords,
        tokenizer: {
            root: [
                [/{{/, { token: 'delimiter.expression', next: '@expression' }],
                [/{%/, { token: 'delimiter.tag', next: '@tag' }],
                [/{#/, { token: 'comment', next: '@comment' }]
            ],
            expression: [
                [/}}/, { token: 'delimiter.expression', next: '@pop' }],
                [/./, '']
            ],
            tag: [
                [/%}/, { token: 'delimiter.tag', next: '@pop' }],
                [/[a-zA-Z_][\w]*/, {
                    cases: {
                        '@keywords': 'keyword',
                        '@default': ''
                    }
                }],
            ],
            comment: [
                [/#}/, { token: 'comment', next: '@pop' }],
                [/./, 'comment']
            ]
        }
    });

    monacoNs.languages.registerCompletionItemProvider(languageId, {
        triggerCharacters: ['.', ' '],
        provideCompletionItems: (model: monaco.editor.ITextModel, position: monaco.Position) => {
            const textUntilPosition = model.getValueInRange({ startLineNumber: 1, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column });
            const word = model.getWordUntilPosition(position);
            const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };

            const lastOpen = textUntilPosition.lastIndexOf('{{');
            const lastClose = textUntilPosition.lastIndexOf('}}');

            if (lastOpen > lastClose) {
                const expressionText = textUntilPosition.substring(lastOpen + 2).trim();
                const parts = expressionText.split(/\|/)[0].trim().split('.');
                const parentPath = parts.slice(0, -1).join('.');
                const parentObject = getObjectFromPath(currentSampleData, parentPath);

                if (parentObject && typeof parentObject === 'object') {
                    return {
                        suggestions: Object.keys(parentObject).map(key => ({
                            label: key,
                            kind: isObject(parentObject[key]) ? monacoNs.languages.CompletionItemKind.Module : monacoNs.languages.CompletionItemKind.Variable,
                            insertText: key,
                            range: range,
                        }))
                    };
                }
                return { suggestions: [] };
            }

            const keywordSuggestions = liquidKeywords.map(keyword => ({ label: keyword, kind: monacoNs.languages.CompletionItemKind.Keyword, insertText: keyword, range: range }));
            const topLevelKeySuggestions = Object.keys(currentSampleData).map(key => ({ label: key, kind: monacoNs.languages.CompletionItemKind.Variable, insertText: key, range: range }));
            return { suggestions: [...keywordSuggestions, ...topLevelKeySuggestions] };
        }
    });

    monacoNs.editor.onDidCreateModel((model: monaco.editor.ITextModel) => {
        if (model.getLanguageId() === languageId) {
            const listener = model.onDidChangeContent(() => {
                validate(model, monacoNs, currentSampleData);
            });
            model.onWillDispose(() => listener.dispose());
            validate(model, monacoNs, currentSampleData);
        }
    });

    return {
        update: (newSampleData: object | object[]) => {
            setData(newSampleData);
        }
    };
}
