'use strict';

import { commands, workspace, ExtensionContext, Range, window } from 'vscode';
import { sortClassString } from './utils';
import { spawn } from 'child_process';
import { rustyWindPath } from 'rustywind';

const config = workspace.getConfiguration();
const configRegex: string = config.get('headwind.classRegex') || '';

const sortOrder = config.get('headwind.defaultSortOrder');

const shouldRemoveDuplicatesConfig = config.get(
	'headwind.removeDuplicates'
);
const shouldRemoveDuplicates =
	typeof shouldRemoveDuplicatesConfig === 'boolean'
		? shouldRemoveDuplicatesConfig
		: true;

const HTMLClassAtrributeRegex = new RegExp(configRegex, 'gi');

export function activate(context: ExtensionContext) {
	let disposable = commands.registerTextEditorCommand(
		'headwind.sortTailwindClasses',
		function (editor, edit) {
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
						shouldRemoveDuplicates
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
