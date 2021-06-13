import {
	sortClassString,
	getTextMatch,
	buildMatchers,
	Matcher,
} from '../src/utils';
import { LangConfig } from '../src/extension';
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
	it('sorts half classes properly', () => {
		const result = sortClassString(
			'mt-4 mb-0.5 flex inline-block inline px-0.5 pt-10 random-class justify-items absolute relative another-random-class',
			sortOrder,
			{
				shouldRemoveDuplicates: true,
				shouldPrependCustomClasses: false,
				customTailwindPrefix: '',
			}
		);
		expect(result).toBe(
			'inline-block inline flex absolute relative px-0.5 pt-10 mt-4 mb-0.5 random-class justify-items another-random-class'
		);
	});

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

	it.each<[RegExp | undefined, string | undefined, string]>([
		[undefined, undefined, ' '],
		[/\+\+/g, undefined, '++'],
		[undefined, ',', ' '],
		[/\./g, '.', '.'],
	])(
		'should handle a `%s` class name separator with a `%s` class name separator replacement',
		(separator, replacement, join) => {
			const validClasses = sortOrder.filter((c) => !c.includes(join));
			const randomizedClassString = _.shuffle(validClasses).join(join);

			const result = sortClassString(randomizedClassString, sortOrder, {
				shouldRemoveDuplicates: true,
				shouldPrependCustomClasses: false,
				customTailwindPrefix: '',
				separator,
				replacement,
			});

			expect(result).toBe(validClasses.join(replacement || ' '));
		}
	);
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

	const beforeText = `export const Layout = ({ children }) => {
			const doNotSort = "hello flex";

			return (<div>
				<div className=`;
	const afterText = `></div>
				<div>{children}</div>
			</div>)
		}`;

	const generateEditorText = (classNameString: string) =>
		`${beforeText}${classNameString}${afterText}`;

	const startPosition = beforeText.length;

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
			startPosition + 1,
		],
		[
			'simple double quotes',
			generateEditorText(`"${classString}"`),
			classString,
			startPosition + 1,
		],
		[
			'curly braces around single quotes',
			generateEditorText(`{ '${classString}' }`),
			classString,
			startPosition + "{ '".length,
		],
		[
			'curly braces around double quotes',
			generateEditorText(`{ "${classString}" }`),
			classString,
			startPosition + '{ "'.length,
		],
		[
			'simple clsx single quotes',
			generateEditorText(`{ clsx('${classString}') }`),
			classString,
			startPosition + "{ clsx('".length,
		],
		[
			'simple clsx double quotes',
			generateEditorText(`{ clsx("${classString}") }`),
			classString,
			startPosition + '{ clsx("'.length,
		],
		[
			'simple classname single quotes',
			generateEditorText(`{ classname('${classString}') }`),
			classString,
			startPosition + "{ classname('".length,
		],
		[
			'simple classname double quotes',
			generateEditorText(`{ classname("${classString}") }`),
			classString,
			startPosition + '{ classname("'.length,
		],
		[
			'simple foo func single quotes',
			generateEditorText(`{ foo('${classString}') }`),
			classString,
			startPosition + "{ foo('".length,
		],
		[
			'simple foo func double quotes',
			generateEditorText(`{ foo("${classString}") }`),
			classString,
			startPosition + '{ foo("'.length,
		],
		[
			'foo func multi str single quotes (only extracts first string)',
			generateEditorText(`{ foo('${classString}', 'class1 class2') }`),
			classString,
			startPosition + "{ foo('".length,
		],
		[
			'foo func multi str double quotes (only extracts first string)',
			generateEditorText(`{ foo("${classString}", "class1, class2") }`),
			classString,
			startPosition + '{ foo("'.length,
		],
		[
			'foo func multi var single quotes',
			generateEditorText(`{ clsx(foo, bar, '${classString}', foo, bar) }`),
			classString,
			startPosition + "{ clsx(foo, bar, '".length,
		],
		[
			'foo func multi var double quotes',
			generateEditorText(`{ clsx(foo, bar, "${classString}", foo, bar) }`),
			classString,
			startPosition + '{ clsx(foo, bar, "'.length,
		],
		[
			'foo func multi var multi str single quotes',
			generateEditorText(
				`{ clsx(foo, bar, '${classString}', foo, 'class1 class2', bar) }`
			),
			classString,
			startPosition + "{ clsx(foo, bar, '".length,
		],
		[
			'foo func multi var multi str double quotes',
			generateEditorText(
				`{ clsx(foo, bar, "${classString}", foo, "class1 class2", bar) }`
			),
			classString,
			startPosition + '{ clsx(foo, bar, "'.length,
		],
		[
			'complex foo func single quotes multi lines',
			generateEditorText(`{ clsx(
								    foo,
								    bar,
								    '${classString}',
								    foo,
								    'class1 class2',
								    bar)
								}`),
			classString,
			startPosition +
				`{ clsx(
								    foo,
								    bar,
								    '`.length,
		],
		[
			'simple multi line double quotes',
			generateEditorText(`\"${multiLineClassString}\"`),
			multiLineClassString,
			startPosition + 1,
		],
		[
			'complex foo func double quotes multi lines',
			generateEditorText(`{ clsx(
									  foo,
									  bar,
									  "${classString}",
									  foo,
									  "class1 class2",
									  bar
								  }`),
			classString,
			startPosition +
				`{ clsx(
									  foo,
									  bar,
									  "`.length,
		],
		['class attribute', `class="${classString}"`, classString, 7],
		[
			'string literal',
			`export function FormGroup({className = '', ...props}) {
			  return <div className={\`${classString} \$\{className\}\`} {...props} />
			}`,
			`${classString} \$\{className\}`,
			`export function FormGroup({className = '', ...props}) {
			  return <div className={\``.length,
		],
	])('%s', (testName, editorText, expectedTextMatch, expectedStartPosition) => {
		const stringRegex =
			'(?:\\bclass(?:Name)?\\s*=[\\w\\d\\s_,{}()[\\]]*["\'`]([\\w\\d\\s_\\-:/${}]+)["\'`][\\w\\d\\s_,{}()[\\]]*)|(?:\\btw\\s*`([\\w\\d\\s_\\-:/]*)`)';
		const callback = jest.fn();

		for (const matcher of buildMatchers(stringRegex)) {
			getTextMatch(matcher.regex, editorText.toString(), callback);
		}

		expect(callback).toHaveBeenCalledWith(
			expectedTextMatch,
			expectedStartPosition
		);
	});
});

describe('extract className (jsx) string(s) with multiple regexes', () => {
	const configRegex: { [key: string]: string } =
		pjson.contributes.configuration[0].properties['headwind.classRegex']
			.default;
	const jsxLanguages = [
		'javascript',
		'javascriptreact',
		'typescript',
		'typescriptreact',
	];

	const classString = 'w-64 h-full bg-blue-400 relative';

	const beforeText = `
		export const Layout = ({ children }) => {
			const doNotSort = "hello flex";

			return (<div>
				<div className=`;

	const afterText = `></div>
				<div>{children}</div>
			</div>
		)}`;

	const generateEditorText = (classNameString: string) =>
		`${beforeText}${classNameString}${afterText}`;

	const startPosition = beforeText.length;

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
			startPosition + 1,
		],
		[
			'simple double quotes',
			generateEditorText(`"${classString}"`),
			classString,
			startPosition + 1,
		],
		[
			'curly braces around single quotes',
			generateEditorText(`{ '${classString}' }`),
			classString,
			startPosition + "{ '".length,
		],
		[
			'curly braces around double quotes',
			generateEditorText(`{ "${classString}" }`),
			classString,
			startPosition + '{ "'.length,
		],
		[
			'simple clsx single quotes',
			generateEditorText(`{ clsx('${classString}') }`),
			classString,
			startPosition + "{ clsx('".length,
		],
		[
			'simple clsx double quotes',
			generateEditorText(`{ clsx("${classString}") }`),
			classString,
			startPosition + '{ clsx("'.length,
		],
		[
			'simple classname single quotes',
			generateEditorText(`{ classname('${classString}') }`),
			classString,
			startPosition + "{ className('".length,
		],
		[
			'simple classname double quotes',
			generateEditorText(`{ classname("${classString}") }`),
			classString,
			startPosition + '{ className("'.length,
		],
		[
			'simple foo func single quotes',
			generateEditorText(`{ foo('${classString}') }`),
			classString,
			startPosition + "{ foo('".length,
		],
		[
			'simple foo func double quotes',
			generateEditorText(`{ foo("${classString}") }`),
			classString,
			startPosition + '{ foo("'.length,
		],
		[
			'foo func multi var single quotes',
			generateEditorText(`{ clsx(foo, bar, '${classString}', foo, bar) }`),
			classString,
			startPosition + "{ clsx(foo, bar, '".length,
		],
		[
			'foo func multi var double quotes',
			generateEditorText(`{ clsx(foo, bar, "${classString}", foo, bar) }`),
			classString,
			startPosition + '{ clsx(foo, bar, "'.length,
		],
		[
			'simple multi line double quotes',
			generateEditorText(`\"${multiLineClassString}\"`),
			multiLineClassString,
			startPosition + 1,
		],
		['class attribute', `class="${classString}"`, classString, 7],
		[
			'string literal',
			`export function FormGroup({className = '', ...props}) {
			  return <div className={\`${classString} \$\{className\}\`} {...props} />
			}`,
			`${classString} \$\{className\}`,
			`export function FormGroup({className = '', ...props}) {
			  return <div className={\``.length,
		],
	])('%s', (testName, editorText, expectedTextMatch, expectedStartPosition) => {
		for (const jsxLanguage of jsxLanguages) {
			const callback = jest.fn();

			for (const matcher of buildMatchers(configRegex[jsxLanguage])) {
				getTextMatch(matcher.regex, editorText.toString(), callback);
			}

			expect(callback).toHaveBeenCalledWith(
				expectedTextMatch,
				expectedStartPosition
			);
		}
	});

	it('should do nothing if no regexes (empty array) are provided', () => {
		const callback = jest.fn();
		getTextMatch([], 'test', callback);
		expect(callback).toHaveBeenCalledTimes(0);
	});

	it.each([
		[
			'simple multi string',
			`className={clsx("hello", "world")}`,
			[
				{ match: 'hello', startPosition: 'className={clsx("'.length },
				{ match: 'world', startPosition: 'className={clsx("hello", "'.length },
			],
		],
		[
			'foo func multi str single quotes',
			generateEditorText(`{ foo('${classString}', 'class1 class2') }`),
			[
				{ match: classString, startPosition: startPosition + "{ foo('".length },
				{
					match: 'class1 class2',
					startPosition:
						startPosition +
						"{ foo('".length +
						classString.length +
						"', '".length,
				},
			],
		],
		[
			'foo func multi str double quotes',
			generateEditorText(`{ foo("${classString}", "class1 class2") }`),
			[
				{ match: classString, startPosition: startPosition + '{ foo("'.length },
				{
					match: 'class1 class2',
					startPosition:
						startPosition +
						'{ foo("'.length +
						classString.length +
						'", "'.length,
				},
			],
		],
		[
			'foo func multi var multi str single quotes',
			generateEditorText(
				`{ clsx(foo, bar, '${classString}', foo, 'class1 class2', bar) }`
			),
			[
				{
					match: classString,
					startPosition: startPosition + "{ clsx(foo, bar, '".length,
				},
				{
					match: 'class1 class2',
					startPosition:
						startPosition + `{ clsx(foo, bar, '${classString}', foo, '`.length,
				},
			],
		],
		[
			'foo func multi var multi str double quotes',
			generateEditorText(
				`{ clsx(foo, bar, "${classString}", foo, "class1 class2", bar) }`
			),
			[
				{
					match: classString,
					startPosition: startPosition + '{ clsx(foo, bar, "'.length,
				},
				{
					match: 'class1 class2',
					startPosition:
						startPosition + `{ clsx(foo, bar, "${classString}", foo, "`.length,
				},
			],
		],
		[
			'complex foo func single quotes multi lines',
			generateEditorText(`{ clsx(
								    foo,
								    bar,
								    '${classString}',
								    foo,
								    'class1 class2',
								    bar)
								}`),
			[
				{
					match: classString,
					startPosition:
						startPosition +
						`{ clsx(
								    foo,
								    bar,
								    '`.length,
				},
				{
					match: 'class1 class2',
					startPosition:
						startPosition +
						`{ clsx(
								    foo,
								    bar,
								    '${classString}',
								    foo,
								    '`.length,
				},
			],
		],
		[
			'complex foo func double quotes multi lines',
			generateEditorText(`{ clsx(
									  foo,
									  bar,
									  "${classString}",
									  foo,
									  "class1 class2",
									  bar
								  }`),
			[
				{
					match: classString,
					startPosition:
						startPosition +
						`{ clsx(
									  foo,
									  bar,
									  "`.length,
				},
				{
					match: 'class1 class2',
					startPosition:
						startPosition +
						`{ clsx(
									  foo,
									  bar,
									  "${classString}",
									  foo,
									  "`.length,
				},
			],
		],
	])('%s', (testName, editorText, expectedResults) => {
		for (const jsxLanguage of jsxLanguages) {
			const callback = jest.fn();

			for (const matcher of buildMatchers(configRegex[jsxLanguage])) {
				getTextMatch(matcher.regex, editorText.toString(), callback);
			}

			expect(callback).toHaveBeenCalledTimes(expectedResults.length);
			expect(typeof expectedResults !== 'string').toBeTruthy();

			if (typeof expectedResults !== 'string') {
				expectedResults.forEach((expectedResult, idx) => {
					expect(callback).toHaveBeenNthCalledWith(
						idx + 1,
						expectedResult.match,
						expectedResult.startPosition
					);
				});
			}
		}
	});
});

describe('twin macro - extract tw prop (jsx) string(s) with multiple regexes', () => {
	const configRegex: { [key: string]: string } =
		pjson.contributes.configuration[0].properties['headwind.classRegex']
			.default;
	const jsxLanguages = [
		'javascript',
		'javascriptreact',
		'typescript',
		'typescriptreact',
	];

	it.each([
		[
			'simple twin macro example',
			`import 'twin.macro'

			const Input = () => <input tw="border hover:border-black" />
			`,
			[
				{
					match: 'border hover:border-black',
					startPosition: `import 'twin.macro'

			const Input = () => <input tw="`.length,
				},
			],
		],
		[
			'simple twin macro example',
			`import 'twin.macro'

			const Input = () => <input tw={!error ? "border hover:border-black" : "border border-red-500"} />
			`,
			[
				{
					match: 'border hover:border-black',
					startPosition: `import 'twin.macro'

			const Input = () => <input tw={!error ? "`.length,
				},
				{
					match: 'border border-red-500',
					startPosition: `import 'twin.macro'

			const Input = () => <input tw={!error ? "border hover:border-black" : "`.length,
				},
			],
		],
	])('%s', (testName, editorText, expectedResults) => {
		for (const jsxLanguage of jsxLanguages) {
			const callback = jest.fn();

			for (const matcher of buildMatchers(configRegex[jsxLanguage])) {
				getTextMatch(matcher.regex, editorText.toString(), callback);
			}

			expect(callback).toHaveBeenCalledTimes(expectedResults.length);
			expect(typeof expectedResults !== 'string').toBeTruthy();

			if (typeof expectedResults !== 'string') {
				expectedResults.forEach((expectedResult, idx) => {
					expect(callback).toHaveBeenNthCalledWith(
						idx + 1,
						expectedResult.match,
						expectedResult.startPosition
					);
				});
			}
		}
	});
});

describe('buildMatchers', () => {
	it.each<[string, LangConfig | LangConfig[], Matcher[]]>([
		['undefined', undefined, []],
		['empty', [], []],
		[
			'layered regexes',
			[
				'(?:\\bclass(?:Name)?\\s*=\\s*(?:{([\\w\\d\\s_\\-:/${}()[\\]"\'`,]+)})|(["\'`][\\w\\d\\s_\\-:/]+["\'`]))|(?:\\btw\\s*(`[\\w\\d\\s_\\-:/]+`))',
				'(?:["\'`]([\\w\\d\\s_\\-:/${}()[\\]"\']+)["\'`])',
			],
			[
				{
					regex: [
						/(?:\bclass(?:Name)?\s*=\s*(?:{([\w\d\s_\-:/${}()[\]"'`,]+)})|(["'`][\w\d\s_\-:/]+["'`]))|(?:\btw\s*(`[\w\d\s_\-:/]+`))/gi,
						/(?:["'`]([\w\d\s_\-:/${}()[\]"']+)["'`])/gi,
					],
				},
			],
		],
		[
			'multiple layered regexes',
			[
				[
					'(?:\\bclass(?:Name)?\\s*=\\s*(?:{([\\w\\d\\s_\\-:/${}()[\\]"\'`,]+)})|(["\'`][\\w\\d\\s_\\-:/]+["\'`]))|(?:\\btw\\s*(`[\\w\\d\\s_\\-:/]+`))',
					'(?:["\'`]([\\w\\d\\s_\\-:/${}()[\\]"\']+)["\'`])',
				],
				[
					'(?:\\bclass(?:Name)?\\s*=\\s*(?:{([\\w\\d\\s_\\-:/${}()[\\]"\'`,]+)})|(["\'`][\\w\\d\\s_\\-:/]+["\'`]))|(?:\\btw\\s*(`[\\w\\d\\s_\\-:/]+`))',
					'(?:["\'`]([\\w\\d\\s_\\-:/${}()[\\]"\']+)["\'`])',
				],
			],
			[
				{
					regex: [
						/(?:\bclass(?:Name)?\s*=\s*(?:{([\w\d\s_\-:/${}()[\]"'`,]+)})|(["'`][\w\d\s_\-:/]+["'`]))|(?:\btw\s*(`[\w\d\s_\-:/]+`))/gi,
						/(?:["'`]([\w\d\s_\-:/${}()[\]"']+)["'`])/gi,
					],
				},
				{
					regex: [
						/(?:\bclass(?:Name)?\s*=\s*(?:{([\w\d\s_\-:/${}()[\]"'`,]+)})|(["'`][\w\d\s_\-:/]+["'`]))|(?:\btw\s*(`[\w\d\s_\-:/]+`))/gi,
						/(?:["'`]([\w\d\s_\-:/${}()[\]"']+)["'`])/gi,
					],
				},
			],
		],
		[
			'matcher',
			{
				regex: [
					'(?:\\bclass(?:Name)?\\s*=\\s*(?:{([\\w\\d\\s_\\-:/${}()[\\]"\'`,]+)})|(["\'`][\\w\\d\\s_\\-:/]+["\'`]))|(?:\\btw\\s*(`[\\w\\d\\s_\\-:/]+`))',
					'(?:["\'`]([\\w\\d\\s_\\-:/${}()[\\]"\']+)["\'`])',
				],
				separator: '\\+\\+',
				replacement: '++',
			},
			[
				{
					regex: [
						/(?:\bclass(?:Name)?\s*=\s*(?:{([\w\d\s_\-:/${}()[\]"'`,]+)})|(["'`][\w\d\s_\-:/]+["'`]))|(?:\btw\s*(`[\w\d\s_\-:/]+`))/gi,
						/(?:["'`]([\w\d\s_\-:/${}()[\]"']+)["'`])/gi,
					],
					separator: /\+\+/g,
					replacement: '++',
				},
			],
		],
		[
			'empty matcher',
			{},
			[
				{
					regex: [],
					separator: undefined,
					replacement: undefined,
				},
			],
		],
		[
			'various',
			[
				[
					'(?:\\bclass(?:Name)?\\s*=\\s*(?:{([\\w\\d\\s_\\-:/${}()[\\]"\'`,]+)})|(["\'`][\\w\\d\\s_\\-:/]+["\'`]))|(?:\\btw\\s*(`[\\w\\d\\s_\\-:/]+`))',
				],
				'(?:["\'`]([\\w\\d\\s_\\-:/${}()[\\]"\']+)["\'`])',
				{
					regex: [
						'(?:\\bclass(?:Name)?\\s*=\\s*(?:{([\\w\\d\\s_\\-:/${}()[\\]"\'`,]+)})|(["\'`][\\w\\d\\s_\\-:/]+["\'`]))|(?:\\btw\\s*(`[\\w\\d\\s_\\-:/]+`))',
						'(?:["\'`]([\\w\\d\\s_\\-:/${}()[\\]"\']+)["\'`])',
					],
					replacement: ' ',
				},
				{
					regex: '(?:["\'`]([\\w\\d\\s_\\-:/${}()[\\]"\']+)["\'`])',
					separator: '\\.',
					replacement: '.',
				},
			],
			[
				{
					regex: [
						/(?:\bclass(?:Name)?\s*=\s*(?:{([\w\d\s_\-:/${}()[\]"'`,]+)})|(["'`][\w\d\s_\-:/]+["'`]))|(?:\btw\s*(`[\w\d\s_\-:/]+`))/gi,
					],
				},
				{
					regex: [/(?:["'`]([\w\d\s_\-:/${}()[\]"']+)["'`])/gi],
				},
				{
					regex: [
						/(?:\bclass(?:Name)?\s*=\s*(?:{([\w\d\s_\-:/${}()[\]"'`,]+)})|(["'`][\w\d\s_\-:/]+["'`]))|(?:\btw\s*(`[\w\d\s_\-:/]+`))/gi,
						/(?:["'`]([\w\d\s_\-:/${}()[\]"']+)["'`])/gi,
					],
					separator: undefined,
					replacement: ' ',
				},
				{
					regex: [/(?:["'`]([\w\d\s_\-:/${}()[\]"']+)["'`])/gi],
					separator: /\./g,
					replacement: '.',
				},
			],
		],
	])('should handle %s configs', (_name, langConfig, matchers) => {
		expect(buildMatchers(langConfig)).toStrictEqual(matchers);
	});
});
