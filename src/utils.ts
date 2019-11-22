/**
 * Sorts a string of CSS classes according to a predefined order.
 * @param classString The string to sort
 * @param sortOrder The default order to sort the array at
 *
 * @returns The sorted string
 */
export const sortClassString = (
	classString: string,
	sortOrder: string[]
): string => {
	const classArray = classString.split(/\s+/g);

	const duplicatesRemoved = removeDuplicates(classArray);
	const sortedClassArray = sortClassArray(duplicatesRemoved, sortOrder);

	return sortedClassArray.join(' ');
};

const sortClassArray = (
	classArray: string[],
	sortOrder: string[]
): string[] => [
	...classArray
		.filter(el => sortOrder.indexOf(el) !== -1) // take the classes that are in the sort order
		.sort((a, b) => sortOrder.indexOf(a) - sortOrder.indexOf(b)), // and sort them
	...classArray.filter(el => sortOrder.indexOf(el) === -1) // prepend the classes that were not in the sort order
];

const removeDuplicates = (classArray: string[]): string[] => [
	...new Set(classArray)
];
