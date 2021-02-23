import { sortClassString, getTextMatch, buildRegexes } from '../src/utils';
import 'jest';
import * as _ from 'lodash';

const pjson = require('../package.json');

const sortOrder: string[] =
	pjson.contributes.configuration[0].properties['headwind.defaultSortOrder']
		.default;
const customClass: string = 'yoda';

const randomizedClassString = _.shuffle(sortOrder).join(' ');
const randomizedClassStringWithCustom = _.shuffle([
	...sortOrder,
	customClass,
]).join(' ');

describe('sortClassString', () => {
	it('should return a sorted class list string', () => {
		const result = sortClassString(randomizedClassString, sortOrder, {
			shouldRemoveDuplicates: true,
			shouldPrependCustomClasses: false,
			customTailwindPrefix: '',
		});
		expect(result).toBe(sortOrder.join(' '));
	});

	it('should return a sorted class list string with appended custom classes', () => {
		const result = sortClassString(randomizedClassStringWithCustom, sortOrder, {
			shouldRemoveDuplicates: true,
			shouldPrependCustomClasses: false,
			customTailwindPrefix: '',
		});
		expect(result).toBe([...sortOrder, customClass].join(' '));
	});

	it('should return a sorted class list string with prepended custom classes', () => {
		const result = sortClassString(randomizedClassStringWithCustom, sortOrder, {
			shouldRemoveDuplicates: true,
			shouldPrependCustomClasses: true,
			customTailwindPrefix: '',
		});
		expect(result).toBe([customClass, ...sortOrder].join(' '));
	});
});

describe('removeDuplicates', () => {
	it('should remove duplicate classes', () => {
		const randomizedAndDuplicatedClassString =
			randomizedClassString + ' ' + _.shuffle(sortOrder).join(' ');

		const result = sortClassString(
			randomizedAndDuplicatedClassString,
			sortOrder,
			{
				shouldRemoveDuplicates: true,
				shouldPrependCustomClasses: false,
				customTailwindPrefix: '',
			}
		);
		expect(result).toBe(sortOrder.join(' '));
	});

	it('should remove not delete duplicate classes when flag is set', () => {
		const randomizedAndDuplicatedClassString =
			'container random random' + ' ' + _.shuffle(sortOrder).join(' ');

		const result = sortClassString(
			randomizedAndDuplicatedClassString,
			sortOrder,
			{
				shouldRemoveDuplicates: false,
				shouldPrependCustomClasses: false,
				customTailwindPrefix: '',
			}
		);
		expect(result).toBe(
			['container', ...sortOrder, 'random', 'random'].join(' ')
		);
	});
});

describe('extract className (jsx) string with single regex', () => {
	const classString = 'w-64 h-full bg-blue-400 relative';

	const generateEditorText = (classNameString: string) => `
		export const Layout = ({ children }) => (
			<div>
				<div className=${classNameString}></div>
				<div>{children}</div>
			</div>
		)`;

	const startPosition = 74;

	const multiLineClassString = `
		w-64
		h-full
		bg-blue-400
		relative
	`;

	it.each([
		[
			'simple single quotes',
			generateEditorText(`'${classString}'`),
			classString,
			startPosition
		],
		[
			'simple double quotes',
			generateEditorText(`"${classString}"`),
			classString,
			startPosition
		],
		[
			'curly braces around single quotes',
			generateEditorText(`{ '${classString}' }`),
			classString,
			startPosition + 2
		],
		[
			'curly braces around double quotes',
			generateEditorText(`{ "${classString}" }`),
			classString,
			startPosition + 2
		],
		[
			'simple clsx single quotes',
			generateEditorText(`{ clsx('${classString}' }`),
			classString,
			startPosition + 7
		],
		[
			'simple clsx double quotes',
			generateEditorText(`{ clsx("${classString}" }`),
			classString,
			startPosition + 7
		],
		[
			'simple classname single quotes',
			generateEditorText(`{ classname('${classString}' }`),
			classString,
			startPosition + 12
		],
		[
			'simple classname double quotes',
			generateEditorText(`{ classname("${classString}" }`),
			classString,
			startPosition + 12
		],
		[
			'simple foo func single quotes',
			generateEditorText(`{ foo('${classString}' }`),
			classString,
			startPosition + 6
		],
		[
			'simple foo func double quotes',
			generateEditorText(`{ foo("${classString}" }`),
			classString,
			startPosition + 6
		],
		[
			'foo func multi str single quotes (only extracts first string)',
			generateEditorText(`{ foo('${classString}', 'class1 class2' }`),
			classString,
			startPosition + 6
		],
		[
			'foo func multi str double quotes (only extracts first string)',
			generateEditorText(`{ foo("${classString}", "class1, class2" }`),
			classString,
			startPosition + 6
		],
		[
			'foo func multi var single quotes',
			generateEditorText(`{ clsx(foo, bar, '${classString}', foo, bar }`),
			classString,
			startPosition + 17
		],
		[
			'foo func multi var double quotes',
			generateEditorText(`{ clsx(foo, bar, "${classString}", foo, bar }`),
			classString,
			startPosition + 17
		],
		[
			'foo func multi var multi str single quotes',
			generateEditorText(
				`{ clsx(foo, bar, '${classString}', foo, 'class1 class2', bar }`
			),
			classString,
			startPosition + 17
		],
		[
			'foo func multi var multi str double quotes',
			generateEditorText(
				`{ clsx(foo, bar, "${classString}", foo, "class1 class2", bar }`
			),
			classString,
			startPosition + 17
		],
		[
			'complex foo func single quotes multi lines',
			generateEditorText(`
								{ clsx(
								    foo,
								    bar,
								    '${classString}',
								    foo,
								    'class1 class2',
								    bar
								}`),
			classString,
			startPosition + 63
		],
		[
			'simple multi line double quotes',
			generateEditorText(`\"${multiLineClassString}\"`),
			multiLineClassString,
			startPosition
		],
		[
			'complex foo func double quotes multi lines',
			generateEditorText(`
								  { clsx(
									  foo,
									  bar,
									  "${classString}",
									  foo,
									  "class1 class2",
									  bar
								  }`),
			classString,
			startPosition + 62
		],
		['class attribute', `class="${classString}"`, classString, 7],
		[
			'string literal',
			`export function FormGroup({className = '', ...props}) {
			  return <div className={\`${classString} \$\{className\}\`} {...props} />
			}`,
			`${classString} \$\{className\}`,
			85
		],
	])('%s', (testName, editorText, expectedTextMatch, expectedStartPosition) => {
		const stringRegex = "(?:\\bclass(?:Name)?\\s*=[\\w\\d\\s_,{}()[\\]]*[\"'`]([\\w\\d\\s_\\-:/${}]+)[\"'`][\\w\\d\\s_,{}()[\\]]*)|(?:\\btw\\s*`([\\w\\d\\s_\\-:/]*)`)";
			const callback = jest.fn();

			getTextMatch(
				buildRegexes(stringRegex),
				editorText.toString(),
				callback
			);

			expect(callback).toHaveBeenCalledWith(expectedTextMatch, expectedStartPosition);
	});
});

describe('extract className (jsx) string(s) with multiple regexes', () => {
	const configRegex: { [key: string]: string } = pjson.contributes.configuration[0].properties['headwind.classRegex'].default;
	const jsxLanguages = [
		'javascript',
		'javascriptreact',
		'typescript',
		'typescriptreact',
	];

	const classString = 'w-64 h-full bg-blue-400 relative';

	const generateEditorText = (classNameString: string) => `
		export const Layout = ({ children }) => (
			<div>
				<div className=${classNameString}></div>
				<div>{children}</div>
			</div>
		)`;

	const startPosition = 74;

	const multiLineClassString = `
		w-64
		h-full
		bg-blue-400
		relative
	`;

	it.each([
		[
			'simple single quotes',
			generateEditorText(`'${classString}'`),
			classString,
			startPosition
		],
		[
			'simple double quotes',
			generateEditorText(`"${classString}"`),
			classString,
			startPosition
		],
		[
			'curly braces around single quotes',
			generateEditorText(`{ '${classString}' }`),
			classString,
			startPosition + 2
		],
		[
			'curly braces around double quotes',
			generateEditorText(`{ "${classString}" }`),
			classString,
			startPosition + 2
		],
		[
			'simple clsx single quotes',
			generateEditorText(`{ clsx('${classString}' }`),
			classString,
			startPosition + 7
		],
		[
			'simple clsx double quotes',
			generateEditorText(`{ clsx("${classString}" }`),
			classString,
			startPosition + 7
		],
		[
			'simple classname single quotes',
			generateEditorText(`{ classname('${classString}' }`),
			classString,
			startPosition + 12
		],
		[
			'simple classname double quotes',
			generateEditorText(`{ classname("${classString}" }`),
			classString,
			startPosition + 12
		],
		[
			'simple foo func single quotes',
			generateEditorText(`{ foo('${classString}' }`),
			classString,
			startPosition + 6
		],
		[
			'simple foo func double quotes',
			generateEditorText(`{ foo("${classString}" }`),
			classString,
			startPosition + 6
		],
		// [
		// 	'foo func multi str single quotes (only extracts first string)',
		// 	generateEditorText(`{ foo('${classString}', 'class1 class2' }`),
		// 	classString,
		// ],
		// [
		// 	'foo func multi str double quotes (only extracts first string)',
		// 	generateEditorText(`{ foo("${classString}", "class1, class2" }`),
		// 	classString,
		// ],
		[
			'foo func multi var single quotes',
			generateEditorText(`{ clsx(foo, bar, '${classString}', foo, bar }`),
			classString,
			startPosition + 17
		],
		[
			'foo func multi var double quotes',
			generateEditorText(`{ clsx(foo, bar, "${classString}", foo, bar }`),
			classString,
			startPosition + 17,
		],
		// [
		// 	'foo func multi var multi str single quotes',
		// 	generateEditorText(
		// 		`{ clsx(foo, bar, '${classString}', foo, 'class1 class2', bar }`
		// 	),
		// 	classString,
		// ],
		// [
		// 	'foo func multi var multi str double quotes',
		// 	generateEditorText(
		// 		`{ clsx(foo, bar, "${classString}", foo, "class1 class2", bar }`
		// 	),
		// 	classString,
		// ],
		// [
		// 	'complex foo func single quotes multi lines',
		// 	generateEditorText(`
		// 						{ clsx(
		// 						    foo,
		// 						    bar,
		// 						    '${classString}',
		// 						    foo,
		// 						    'class1 class2',
		// 						    bar
		// 						}`),
		// 	classString,
		// ],
		[
			'simple multi line double quotes',
			generateEditorText(`\"${multiLineClassString}\"`),
			multiLineClassString,
			startPosition
		],
		// [
		// 	'complex foo func double quotes multi lines',
		// 	generateEditorText(`
		// 						  { clsx(
		// 							  foo,
		// 							  bar,
		// 							  "${classString}",
		// 							  foo,
		// 							  "class1 class2",
		// 							  bar
		// 						  }`),
		// 	classString,
		// ],
		['class attribute', `class="${classString}"`, classString, 7],
		[
			'string literal',
			`export function FormGroup({className = '', ...props}) {
			  return <div className={\`${classString} \$\{className\}\`} {...props} />
			}`,
			`${classString} \$\{className\}`, 85
		],
	])('%s', (testName, editorText, expectedTextMatch, expectedStartPosition) => {
		for (const jsxLanguage of jsxLanguages) {
			const callback = jest.fn();

			getTextMatch(
				buildRegexes(configRegex[jsxLanguage]),
				editorText.toString(),
				callback
			);

			expect(callback).toHaveBeenCalledWith(expectedTextMatch, expectedStartPosition)
		}
	});
});
