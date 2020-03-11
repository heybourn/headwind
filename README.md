# Headwind

[![CircleCI](https://circleci.com/gh/heybourn/headwind.svg?style=svg)](https://circleci.com/gh/heybourn/headwind)

Headwind is an opinionated Tailwind CSS class sorter for Visual Studio Code. It enforces consistent ordering of classes by parsing your code and reprinting class tags to follow a given order.

> Headwind runs on save, will remove duplicate classes and can even sort entire workspaces.

---

**[Get it from the VS Code Marketplace →](https://marketplace.visualstudio.com/items?itemName=heybourn.headwind)**

**[Use PHPStorm? Get @WalrusSoup's Headwind port →](https://plugins.jetbrains.com/plugin/13376-tailwind-formatter/)**

<img src="https://github.com/heybourn/headwind/blob/master/img/explainer.gif?raw=true" alt="Explainer" width="750px">

## Usage

You can install Headwind via the VS Code Marketplace, or package it yourself using [vsce](https://code.visualstudio.com/api/working-with-extensions/publishing-extension). Headwind works globally once installed and will run on save if a `tailwind.config.js` file is present within your working directory.

You can also trigger Headwind by:

* Pressing CMD + Shift + T on Mac
* Pressing CTRL + ALT + T on Windows

Headwind can sort individual files by running 'Sort Tailwind CSS Classes' via the Command Palette. Workspaces can also be sorted by running 'Sort Tailwind CSS Classes on Entire Workspace'.

Any breakpoints or unknown classes will be moved to the end of the class list, whilst duplicate classes will be removed.

## Customisation

Headwind ships with a default class order (located in [package.json](package.json)). You can edit this (and other settings) to your liking on the extension settings page.

### `headwind.classRegex`:

An object with language IDs as keys and their values determining the regex to search for Tailwind CSS classes.
The default is located in [package.json](package.json) but this can be customized to suit your needs.

There can be multiple capturing groups, that should only contain a string with Tailwind CSS classes (without any apostrophies etc.). If a new group, which doesn't contain the `class` string, is created, ensure that it is non-capturing by using `(?:)`.

Example from `package.json`:

```json
"headwind.classRegex": {
		"html": "\\bclass\\s*=\\s*[\\\"\\']([_a-zA-Z0-9\\s\\-\\:\\/]+)[\\\"\\']",
		"javascriptreact": "(?:\\bclassName\\s*=\\s*[\\\"\\']([_a-zA-Z0-9\\s\\-\\:\\/]+)[\\\"\\'])|(?:\\btw\\s*`([_a-zA-Z0-9\\s\\-\\:\\/]*)`)"
}
```

### `headwind.sortTailwindClasses`:

An array that determines Headwind's default sort order.

### `headwind.removeDuplicates`:

Headwind will remove duplicate class names by default. This can be toggled on or off.

`"headwind.removeDuplicates": false`

### `headwind.prependCustomClasses`:

Headwind will append custom class names by default. They can be prepended instead.

`"headwind.prependCustomClasses": true`

### `headwind.runOnSave`:

Headwind will run on save by default (if a `tailwind.config.js` file is present within your working directory). This can be toggled on or off.

`"headwind.runOnSave": false`

## Contributing

Headwind is open-source and contributions are always welcome. If you're interested in submitting a pull request, please take a moment to review [CONTRIBUTING.md](.github/CONTRIBUTING.md).
