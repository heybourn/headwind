import { sortClassString } from '../src/utils';
import 'jest';
import * as _ from 'lodash';

const pjson = require('../package.json');

const sortOrder: string[] =
	pjson.contributes.configuration[0].properties['headwind.defaultSortOrder']
		.default;

const randomizedClassString = _.shuffle(sortOrder).join(' ');

describe('sortClassString', () => {
	it('should return a sorted class list string', () => {
		const result = sortClassString(randomizedClassString, sortOrder, true);
		expect(result).toBe(sortOrder.join(' '));
	});
});

describe('removeDuplicates', () => {
	it('should remove duplicate classes', () => {
		const randomizedAndDuplicatedClassString =
			randomizedClassString + ' ' + _.shuffle(sortOrder).join(' ');

		const result = sortClassString(
			randomizedAndDuplicatedClassString,
			sortOrder,
			true
		);
		expect(result).toBe(sortOrder.join(' '));
	});

	it('should remove not delete duplicate classes when flag is set', () => {
		const randomizedAndDuplicatedClassString =
			'container random random' + ' ' + _.shuffle(sortOrder).join(' ');

		const result = sortClassString(
			randomizedAndDuplicatedClassString,
			sortOrder,
			false
		);
		expect(result).toBe(
			['container', ...sortOrder, 'random', 'random'].join(' ')
		);
	});
});
