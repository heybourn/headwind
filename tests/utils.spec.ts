import { sortClassString } from '../src/utils';
import 'jest';
import { shuffle, random } from 'lodash';
import DefaultSorter from '../src/default_sorter';

const start = random(0, DefaultSorter.length - 100);
const sortOrder: string[] = DefaultSorter.slice(start, start + 200);
const customClass: string = 'yoda';

const randomizedClassString = shuffle(sortOrder).join(' ');
const randomizedClassStringWithCustom = shuffle([
	...sortOrder,
	customClass
]).join(' ');

describe('sortClassString', () => {
	it('should return a sorted class list string', () => {
		const result = sortClassString(randomizedClassString, sortOrder, {
			shouldRemoveDuplicates: true,
			shouldPrependCustomClasses: false
		});
		expect(result).toBe(sortOrder.join(' '));
	});

	it('should return a sorted class list string with appended custom classes', () => {
		const result = sortClassString(randomizedClassStringWithCustom, sortOrder, {
			shouldRemoveDuplicates: true,
			shouldPrependCustomClasses: false
		});
		expect(result).toBe([...sortOrder, customClass].join(' '));
	});

	it('should return a sorted class list string with prepended custom classes', () => {
		const result = sortClassString(randomizedClassStringWithCustom, sortOrder, {
			shouldRemoveDuplicates: true,
			shouldPrependCustomClasses: true
		});
		expect(result).toBe([customClass, ...sortOrder].join(' '));
	});
});

describe('removeDuplicates', () => {
	it('should remove duplicate classes', () => {
		const randomizedAndDuplicatedClassString =
			randomizedClassString + ' ' + shuffle(sortOrder).join(' ');

		const result = sortClassString(
			randomizedAndDuplicatedClassString,
			sortOrder,
			{
				shouldRemoveDuplicates: true,
				shouldPrependCustomClasses: false
			}
		);
		expect(result).toBe(sortOrder.join(' '));
	});

	it('should remove not delete duplicate classes when flag is set', () => {
		const randomizedAndDuplicatedClassString =
			'random random' + ' ' + shuffle(sortOrder).join(' ');

		const result = sortClassString(
			randomizedAndDuplicatedClassString,
			sortOrder,
			{
				shouldRemoveDuplicates: false,
				shouldPrependCustomClasses: false
			}
		);
		expect(result).toBe([...sortOrder, 'random', 'random'].join(' '));
	});
});
