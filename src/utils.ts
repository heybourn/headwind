import { LangConfig } from './extension';

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
	variantSortOrder: string[],
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
		variantSortOrder,
		options.shouldPrependCustomClasses
	);

	return classArray.join(options.replacement || ' ').trim();
};

interface ClassParts {
	variants: string[];
	className: string;
	original: string;
	length: number;
}

const getClassParts = (className: string) => {
	const classParts = className && className.split(':');
	return {
		original: className,
		length: classParts.length,
		variants:
			classParts.length > 1
				? [...classParts.slice(0, classParts.length - 1)]
				: [],
		className: classParts[classParts.length - 1],
	};
};

const sortBasedOnVariants = (
	classArray: string[],
	variantSortOrder: string[]
) => {
	const classesParted: ClassParts[] = classArray.map(getClassParts);
	const maxLength =
		classesParted.length > 0
			? classesParted.sort((a, b) => b.length - a.length)[0].length
			: 0;
	const sortFunc = (index: number) => {
		return (a: ClassParts, b: ClassParts) => {
			const aVariant = a.variants.length > index ? a.variants[index] : '';
			const bVariant = b.variants.length > index ? b.variants[index] : '';
			const aVariantPath =
				a.variants.length >= index ? a.variants.slice(0, index).join('-') : '';
			const bVariantPath =
				b.variants.length >= index ? b.variants.slice(0, index).join('-') : '';

			if (aVariantPath === bVariantPath) {
				return 0;
			}
			if (aVariant && bVariant) {
				return (
					variantSortOrder.indexOf(aVariant) -
					variantSortOrder.indexOf(bVariant)
				);
			} else if (aVariant) {
				return 1;
			} else {
				// if (bVariant)
				return -1;
			}
		};
	};
	let sortedList = classesParted;

	for (let index = 0; index < maxLength - 1; index++) {
		sortedList = sortedList.sort(sortFunc(index));
	}
	return sortedList.map((el) => el.original);
};

const sortClassArray = (
	classArray: string[],
	sortOrder: string[],
	variantSortOrder: string[],
	shouldPrependCustomClasses: boolean
): string[] => {
	return [
		...classArray.filter(
			(el) =>
				shouldPrependCustomClasses &&
				sortOrder.indexOf(el) === -1 &&
				sortOrder.indexOf(getClassParts(el).className) === -1
		), // append the classes that were not in the sort order if configured this way
		...classArray
			.filter((el) => {
				const className = getClassParts(el).className;
				return (
					sortOrder.indexOf(el) !== -1 &&
					className &&
					sortOrder.indexOf(className) !== -1
				);
			}) // take the classes that are in the sort order
			.sort((a, b) => sortOrder.indexOf(a) - sortOrder.indexOf(b)), // and sort them
		...sortBasedOnVariants(
			classArray.filter((el) => getClassParts(el).variants.length > 0),
			variantSortOrder
		), // and sort them
		...classArray.filter(
			(el) =>
				!shouldPrependCustomClasses &&
				sortOrder.indexOf(el) === -1 &&
				sortOrder.indexOf(getClassParts(el).className) === -1
		), // prepend the classes that were not in the sort order if configured this way
	];
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
