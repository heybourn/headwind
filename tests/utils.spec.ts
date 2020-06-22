import { sortClassString } from '../src/utils';
import 'jest';
import * as _ from 'lodash';

const pjson = require('../package.json');

const sortOrder: string[] =
	pjson.contributes.configuration[0].properties['headwind.defaultSortOrder']
		.default;
const customClass: string = 'yoda';

const randomizedClassString = _.shuffle(sortOrder).join(' ');
const randomizedClassStringWithCustom = _.shuffle([...sortOrder, customClass]).join(' ');

describe('sortClassString', () => {
	it('should return a sorted class list string', () => {
		const result = sortClassString(randomizedClassString, sortOrder, {
			shouldRemoveDuplicates: true,
			shouldPrependCustomClasses: false,
			customTailwindPrefix: ''
		});
		expect(result).toBe(sortOrder.join(' '));
	});

	it('should return a sorted class list string with appended custom classes', () => {
		const result = sortClassString(randomizedClassStringWithCustom, sortOrder, {
			shouldRemoveDuplicates: true,
			shouldPrependCustomClasses: false,
			customTailwindPrefix: ''
		});
		expect(result).toBe([...sortOrder, customClass].join(' '));
	});

	it('should return a sorted class list string with prepended custom classes', () => {
		const result = sortClassString(randomizedClassStringWithCustom, sortOrder, {
			shouldRemoveDuplicates: true,
			shouldPrependCustomClasses: true,
			customTailwindPrefix: ''
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
				customTailwindPrefix: ''
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
				customTailwindPrefix: ''
			}
		);
		expect(result).toBe(
			['container', ...sortOrder, 'random', 'random'].join(' ')
		);
	});
});
