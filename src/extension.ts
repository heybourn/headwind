'use strict';

import { commands, workspace, ExtensionContext, Range, window } from 'vscode';

import { sortClassString } from './utils';

const { exec } = require('child_process');

const { rustyWindPath } = require('rustywind');

const config = workspace.getConfiguration();
const configRegex: string = config.get('headwind.classRegex') || '';

const sortOrder = config.get('headwind.defaultSortOrder');

const shouldRemoveDuplicates = config.get('headwind.enableRemoveDuplicates');

const HTMLClassAtrributeRegex = new RegExp(configRegex, 'gi');

export function activate(context: ExtensionContext) {
	let disposable = commands.registerTextEditorCommand(
		'headwind.sortTailwindClasses',
		function(editor, edit) {
			const editorText = editor.document.getText();

			let classAttributes: RegExpExecArray | null;
			while (
				(classAttributes = HTMLClassAtrributeRegex.exec(editorText)) !== null
			) {
				const attributeMatch = classAttributes[0];
				const valueMatch = classAttributes[2];

				const startPosition =
					classAttributes.index + attributeMatch.lastIndexOf(valueMatch);
				const endPosition = startPosition + valueMatch.length;

				const range = new Range(
					editor.document.positionAt(startPosition),
					editor.document.positionAt(endPosition)
				);

				edit.replace(
					range,
					sortClassString(
						valueMatch,
						Array.isArray(sortOrder) ? sortOrder : [],
						typeof shouldRemoveDuplicates === 'boolean'
							? shouldRemoveDuplicates
							: true
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
					`Running on headwind on: ${workspaceFolder[0].uri.fsPath}`
				);
				exec(
					`${rustyWindPath} ${workspaceFolder[0].uri.fsPath} --write`,
					(error: string, stdout: string, stderr: string) => {
						if (stdout && stdout === '') {
							console.log('rustywind stdout: ', stdout);
						}
						if (stderr && stderr === '') {
							console.log('rustywind stderr: ', stderr);
							window.showErrorMessage(`Headwind error: ${stderr}`);
						}
						if (error && error === '') {
							console.log('rustywind error: ', error);
							window.showErrorMessage(`Headwind error: ${error}`);
						}
					}
				);
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
