# Monaco JSON LiquidJS Mode

This project provides a custom language mode for the Monaco Editor, specifically designed for editing [LiquidJS](https://liquidjs.com/) templates. It enhances the editing experience by providing syntax highlighting, context-aware autocompletion based on a provided JSON data model, and live error checking.

## Features

*   **Syntax Highlighting**: Distinguishes between LiquidJS tags (`{% %}`), output expressions (`{{ }}`), comments (`{# #}`), keywords, strings, and numbers.
*   **Context-Aware Autocompletion**:
    *   Suggests LiquidJS keywords and filters.
    *   Provides autocompletion for variables from a user-supplied JSON data object.
    *   Supports nested object path completion (e.g., `user.address.city`).
*   **Live Diagnostics (Error Checking)**:
    *   Flags variables used in templates that are not found in the provided JSON data model.
    *   Detects and marks unclosed or mismatched control flow tags (e.g., `{% if %}` without `{% endif %}`).
*   **Dynamic JSON Updates**: The JSON data model can be updated live after the editor has been initialized, with diagnostics and autocompletion immediately reflecting the new data structure.

## How to Use

### Running the Demo

To see the language mode in action, you can run the included demo page:

1.  **Install Dependencies**:
    ```bash
    pnpm install
    ```

2.  **Build the Code**:
    ```bash
    pnpm run build
    ```

3.  **Start the Server**:
    ```bash
    pnpm start
    ```
    This will start a local web server. You can view the demo at `http://localhost:8080`.

### Integration into Your Project

To use this language mode in your own Monaco Editor instance:

1.  **Include the script**: Make sure the compiled `dist/index.js` is included in your project.

2.  **Register the language**: In your application's code, import and call the `registerLiquidJSLanguage` function.

```javascript
import * as monaco from 'monaco-editor';
import { registerLiquidJSLanguage } from './path/to/dist/index.js';

// The JSON object representing the data available in your templates
const myTemplateData = {
  product: {
    name: 'T-Shirt',
    price: 25.00
  },
  user: {
    name: 'John Doe'
  }
};

// Register the language mode and get the updater object
const liquidJsUpdater = registerLiquidJSLanguage(monaco, myTemplateData);

// Create the editor instance
monaco.editor.create(document.getElementById('container'), {
  value: 'Hello, {{ user.name }}!',
  language: 'liquid-json' // Use the registered language ID
});

// ---

// To update the JSON data later:
const newTemplateData = {
  page: {
    title: 'My Awesome Page'
  }
};
liquidJsUpdater.update(newTemplateData);
```

## API

### `registerLiquidJSLanguage(monaco, initialSampleData)`

*   `monaco`: The `monaco-editor` namespace object.
*   `initialSampleData`: An object representing the initial JSON data model.
*   **Returns**: An object with an `update` method.

### `updater.update(newSampleData)`

*   `newSampleData`: An object with the new JSON data model to be used for autocompletion and validation.

## Development

*   **`src/`**: Contains the TypeScript source code for the language mode.
    *   `index.ts`: The main file containing all the logic for registration, autocompletion, syntax highlighting, and diagnostics.
*   **`dist/`**: Contains the compiled JavaScript output.
*   **`index.html`**: A simple HTML file for demonstrating and testing the language mode.
*   **`package.json`**: Defines project scripts and dependencies.
*   **`tsconfig.json`**: TypeScript compiler configuration.

This project uses `pnpm` for package management.
