import { LangConfig } from './extension';
import { TAILWIND_MODIFIERS } from './tailwindModifiers';

export interface Options {
	shouldRemoveDuplicates: boolean;
	shouldPrependCustomClasses: boolean;
	customTailwindPrefix: string;
	separator?: RegExp;
	replacement?: string;
}

/**
 * Sorts a string of CSS classes according to a predefined order.
 * @param classString The string to sort
 * @param sortOrder The default order to sort the array at
 *
 * @returns The sorted string
 */
export const sortClassString = (
	classString: string,
	sortOrder: string[],
	options: Options
): string => {
	let classArray = classString.split(options.separator || /\s+/g);

	if (options.shouldRemoveDuplicates) {
		classArray = removeDuplicates(classArray);
	}

	// prepend custom tailwind prefix to all tailwind sortOrder-classes
	const sortOrderClone = [...sortOrder];
	if (options.customTailwindPrefix.length > 0) {
		for (var i = 0; i < sortOrderClone.length; i++) {
			sortOrderClone[i] = options.customTailwindPrefix + sortOrderClone[i];
		}
	}

	classArray = sortClassArray(
		classArray,
		sortOrderClone,
		options.shouldPrependCustomClasses
	);

	return classArray.join(options.replacement || ' ').trim();
};

const isTailwindClass = (el: string, sortOrder: string[]) => sortOrder.indexOf(el) !== -1
const isTailwindModifierClass = (el: string, sortOrder: string[]) => el.includes(':') && TAILWIND_MODIFIERS.indexOf(el.split(':')[0]) !== -1 && sortOrder.indexOf(el.split(':')[1]) !== -1

const sortClassArray = (
	classArray: string[],
	sortOrder: string[],
	shouldPrependCustomClasses: boolean
): string[] => {
	const [tailwindClasses, allTailwindModifiersClasses, customClasses] = [
		classArray.filter(
			(el) => isTailwindClass(el, sortOrder)
		),
		classArray.filter(
			(el) => isTailwindModifierClass(el, sortOrder)
		),
		classArray.filter(
			(el) => !isTailwindClass(el, sortOrder) && !isTailwindModifierClass(el, sortOrder)
		),
	]

	/**
	 * This array contains the classes with tailwind modifiers, sorted first by modifiers
	 * and then by the sort in sortOrder:
	 * 
	 * input: "xl:mx-6 lg:mx-4 sm:bg-gray-200 hover:bg-blue-100 lg:bg-gray-400 hover:text-blue-100 xl:bg-gray-600 sm:mx-2"
	 * output: "hover:text-blue-100 hover:bg-blue-100 sm:mx-2 sm:bg-gray-200 lg:mx-4 lg:bg-gray-400 xl:mx-6 xl:bg-gray-600"
	 * 
	 * The Tailwind modifier order is defined in ./tailwindModifiers.ts
	 */
	const allSortedTailwindModifiersClasses = TAILWIND_MODIFIERS
		.map((modifier) =>
			allTailwindModifiersClasses.filter((el) => el.split(':')[0] === modifier)
		)
		.map((tailwindModifierClass) => tailwindModifierClass.sort((a, b) => sortOrder.indexOf(a.split(':')[1]) - sortOrder.indexOf(b.split(':')[1])))
		.reduce((allSortedTailwindModifiersClasses, sortedTailwindModifiersClasses) => {
			return allSortedTailwindModifiersClasses.concat(sortedTailwindModifiersClasses)
		}, [])

	return [
		...(shouldPrependCustomClasses ? customClasses : []),
		...tailwindClasses.sort((a, b) => sortOrder.indexOf(a) - sortOrder.indexOf(b)),
		...allSortedTailwindModifiersClasses,
		...(!shouldPrependCustomClasses ? customClasses : []),
	]
};

const removeDuplicates = (classArray: string[]): string[] => [
	...new Set(classArray),
];

function isArrayOfStrings(value: unknown): value is string[] {
	return (
		Array.isArray(value) && value.every((item) => typeof item === 'string')
	);
}

export type Matcher = {
	regex: RegExp[];
	separator?: RegExp;
	replacement?: string;
};

function buildMatcher(value: LangConfig): Matcher {
	if (typeof value === 'string') {
		return {
			regex: [new RegExp(value, 'gi')],
		};
	} else if (isArrayOfStrings(value)) {
		return {
			regex: value.map((v) => new RegExp(v, 'gi')),
		};
	} else if (value == undefined) {
		return {
			regex: [],
		};
	} else {
		return {
			regex:
				typeof value.regex === 'string'
					? [new RegExp(value.regex, 'gi')]
					: isArrayOfStrings(value.regex)
						? value.regex.map((v) => new RegExp(v, 'gi'))
						: [],
			separator:
				typeof value.separator === 'string'
					? new RegExp(value.separator, 'g')
					: undefined,
			replacement: value.replacement || value.separator,
		};
	}
}

export function buildMatchers(value: LangConfig | LangConfig[]): Matcher[] {
	if (value == undefined) {
		return [];
	} else if (Array.isArray(value)) {
		if (!value.length) {
			return [];
		} else if (!isArrayOfStrings(value)) {
			return value.map((v) => buildMatcher(v));
		}
	}
	return [buildMatcher(value)];
}

export function getTextMatch(
	regexes: RegExp[],
	text: string,
	callback: (text: string, startPosition: number) => void,
	startPosition: number = 0
): void {
	if (regexes.length >= 1) {
		let wrapper: RegExpExecArray | null;
		while ((wrapper = regexes[0].exec(text)) !== null) {
			const wrapperMatch = wrapper[0];
			const valueMatchIndex = wrapper.findIndex(
				(match, idx) => idx !== 0 && match
			);
			const valueMatch = wrapper[valueMatchIndex];

			const newStartPosition =
				startPosition + wrapper.index + wrapperMatch.lastIndexOf(valueMatch);

			if (regexes.length === 1) {
				callback(valueMatch, newStartPosition);
			} else {
				getTextMatch(regexes.slice(1), valueMatch, callback, newStartPosition);
			}
		}
	}
}
