'use strict';

import { spawn } from 'child_process';
import { rustyWindPath } from 'rustywind';
import { commands, ExtensionContext, Range, window, workspace } from 'vscode';
import { buildMatchers, getTextMatch, sortClassString } from './utils';

export type LangConfig =
	| string
	| string[]
	| { regex?: string | string[]; separator?: string; replacement?: string }
	| undefined;

const config = workspace.getConfiguration();
const langConfig: { [key: string]: LangConfig | LangConfig[] } =
	config.get('headwind.classRegex') || {};

const sortOrder = config.get('headwind.defaultSortOrder');
const variantSortOrder = config.get('headwind.defaultVariantSortOrder');

const customTailwindPrefixConfig = config.get('headwind.customTailwindPrefix');
const customTailwindPrefix =
	typeof customTailwindPrefixConfig === 'string'
		? customTailwindPrefixConfig
		: '';

const shouldRemoveDuplicatesConfig = config.get('headwind.removeDuplicates');
const shouldRemoveDuplicates =
	typeof shouldRemoveDuplicatesConfig === 'boolean'
		? shouldRemoveDuplicatesConfig
		: true;

const shouldPrependCustomClassesConfig = config.get(
	'headwind.prependCustomClasses'
);
const shouldPrependCustomClasses =
	typeof shouldPrependCustomClassesConfig === 'boolean'
		? shouldPrependCustomClassesConfig
		: false;

export function activate(context: ExtensionContext) {
	let disposable = commands.registerTextEditorCommand(
		'headwind.sortTailwindClasses',
		function (editor, edit) {
			const editorText = editor.document.getText();
			const editorLangId = editor.document.languageId;

			const matchers = buildMatchers(
				langConfig[editorLangId] || langConfig['html']
			);

			for (const matcher of matchers) {
				getTextMatch(matcher.regex, editorText, (text, startPosition) => {
					const endPosition = startPosition + text.length;
					const range = new Range(
						editor.document.positionAt(startPosition),
						editor.document.positionAt(endPosition)
					);

					const options = {
						shouldRemoveDuplicates,
						shouldPrependCustomClasses,
						customTailwindPrefix,
						separator: matcher.separator,
						replacement: matcher.replacement,
					};

					edit.replace(
						range,
						sortClassString(
							text,
							Array.isArray(sortOrder) ? sortOrder : [],
							Array.isArray(variantSortOrder) ? variantSortOrder : [],
							options
						)
					);
				});
			}
		}
	);

	let runOnProject = commands.registerCommand(
		'headwind.sortTailwindClassesOnWorkspace',
		() => {
			let workspaceFolder = workspace.workspaceFolders || [];
			if (workspaceFolder[0]) {
				window.showInformationMessage(
					`Running Headwind on: ${workspaceFolder[0].uri.fsPath}`
				);

				let rustyWindArgs = [
					workspaceFolder[0].uri.fsPath,
					'--write',
					shouldRemoveDuplicates ? '' : '--allow-duplicates',
				].filter((arg) => arg !== '');

				let rustyWindProc = spawn(rustyWindPath, rustyWindArgs);

				rustyWindProc.stdout.on(
					'data',
					(data) =>
						data &&
						data.toString() !== '' &&
						console.log('rustywind stdout:\n', data.toString())
				);

				rustyWindProc.stderr.on('data', (data) => {
					if (data && data.toString() !== '') {
						console.log('rustywind stderr:\n', data.toString());
						window.showErrorMessage(`Headwind error: ${data.toString()}`);
					}
				});
			}
		}
	);

	context.subscriptions.push(runOnProject);
	context.subscriptions.push(disposable);

	// if runOnSave is enabled organize tailwind classes before saving
	if (config.get('headwind.runOnSave')) {
		context.subscriptions.push(
			workspace.onWillSaveTextDocument((_e) => {
				commands.executeCommand('headwind.sortTailwindClasses');
			})
		);
	}
}
