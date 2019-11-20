# Headwind

Headwind is an opinionated TailwindCSS class sorter for Visual Studio Code. It enforces consistent ordering of classes by parsing your code and reprinting class tags to follow a given order.

**[Get it from the VS Code Marketplace →](https://marketplace.visualstudio.com/items?itemName=heybourn.headwind)**

<img src="https://github.com/heybourn/headwind/blob/master/img/explainer.gif?raw=true" alt="Explainer" width="750px">

# Usage

You can install Headwind via the VS Code Marketplace, or package it yourself using [vsce](https://code.visualstudio.com/api/working-with-extensions/publishing-extension). Headwind works globally once installed and can be triggered by:

* Pressing CMD + Shift + T on Mac
* Pressing CTRL + ALT + T on Windows
* Running 'Sort TailwindCSS Classes' via the Command Palette

Performing one of these actions will automatically sort all classes within an opened document. Any custom/unknown classes will be moved to the end of the class list.

# Customisation

Headwind ships with a default class order (located in [package.json](package.json)). You can edit this to your liking on the extension settings page.

<img src="https://github.com/heybourn/headwind/blob/master/img/settings.png?raw=true" alt="Settings" width="750px">

# Contributing

Headwind is open source and contributions are always welcome. If you're interested in submitting a pull request, please take a moment to review [CONTRIBUTING.md](.github/CONTRIBUTING.md).
