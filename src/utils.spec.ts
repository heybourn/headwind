import { sortClassString } from './utils';
import 'jest';
import * as _ from 'lodash';

const pjson = require('../package.json');

const sortOrder: string[] =
	pjson.contributes.configuration[0].properties['headwind.defaultSortOrder']
		.default;

const randomizedClassString = _.shuffle(sortOrder).join(' ');

describe('sortClassString', () => {
	it('should return a sorted class list string', () => {
		const result = sortClassString(randomizedClassString, sortOrder);
		expect(result).toBe(sortOrder.join(' '));
	});
});
