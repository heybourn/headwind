'use strict';

import { commands, workspace, ExtensionContext, Range } from 'vscode';

import { sortClassString } from './utils';

const config = workspace.getConfiguration();
const configRegex: string = config.get('headwind.classRegex') || '';

const sortOrder = config.get('headwind.defaultSortOrder');
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
					sortClassString(valueMatch, Array.isArray(sortOrder) ? sortOrder : [])
				);
			}
		}
	);
	context.subscriptions.push(disposable);
}
