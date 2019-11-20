# Headwind

Headwind is an opinionated TailwindCSS class sorter for Visual Studio Code. It enforces consistent ordering of classes by parsing your code and reprinting class tags to follow a given order.

# Getting started

You must have [Node.js](https://nodejs.org/en/) and [vsce](https://github.com/microsoft/vscode-vsce) installed before working with Headwind. You can learn more about these tools and working with Visual Studio Code [here](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).

1. Navigate to your Headwind folder

    ```sh
    cd headwind
    ```

2. Install the dependencies

    ```sh
    npm install
    ```

3. Compile the extension

    ```sh
    npm run compile
    ```

4. Package the extension

    ```sh
    vsce package
    ```
    
4. Open Visual Studio Code and open the 'Extensions' menu. Select the three dots and 'Install from VSIX'. Select the compiled Headwind extension and restart the app.

# Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
