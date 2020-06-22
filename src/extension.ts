'use strict';

import { commands, workspace, ExtensionContext, Range, window } from 'vscode';
import { sortClassString } from './utils';
import { spawn } from 'child_process';
import { rustyWindPath } from 'rustywind';

const config = workspace.getConfiguration();
const configRegex: {[key: string]: string} = config.get('headwind.classRegex') || {};

const sortOrder = config.get('headwind.defaultSortOrder');

const customTailwindPrefixConfig  = config.get('headwind.customTailwindPrefix');
const customTailwindPrefix =
	typeof customTailwindPrefixConfig === 'string'
		? customTailwindPrefixConfig
		: '';

const shouldRemoveDuplicatesConfig = config.get(
	'headwind.removeDuplicates'
);
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

			const classWrapperRegex = new RegExp(configRegex[editorLangId] || configRegex['html'], 'gi');
			let classWrapper: RegExpExecArray | null;
			while (
				(classWrapper = classWrapperRegex.exec(editorText)) !== null
			) {
				const wrapperMatch = classWrapper[0];
				const valueMatchIndex = classWrapper.findIndex((match, idx) => idx !== 0 && match);
				const valueMatch = classWrapper[valueMatchIndex];

				const startPosition =
					classWrapper.index + wrapperMatch.lastIndexOf(valueMatch);
				const endPosition = startPosition + valueMatch.length;

				const range = new Range(
					editor.document.positionAt(startPosition),
					editor.document.positionAt(endPosition)
				);

				const options = {
					shouldRemoveDuplicates,
					shouldPrependCustomClasses,
					customTailwindPrefix
				};

				edit.replace(
					range,
					sortClassString(
						valueMatch,
						Array.isArray(sortOrder) ? sortOrder : [],
						options
					)
				);
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
					shouldRemoveDuplicates ? '' : '--allow-duplicates'
				].filter(arg => arg !== '');

				let rustyWindProc = spawn(rustyWindPath, rustyWindArgs);

				rustyWindProc.stdout.on(
					'data',
					data =>
						data &&
						data.toString() !== '' &&
						console.log('rustywind stdout:\n', data.toString())
				);

				rustyWindProc.stderr.on('data', data => {
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
			workspace.onWillSaveTextDocument(_e => {
				commands.executeCommand('headwind.sortTailwindClasses');
			})
		);
	}
}
