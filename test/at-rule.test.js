import { describe, it } from 'node:test';
import assert from 'node:assert';

import AtRule from '../src/at-rule.js';

describe('at-rule tests', () => {
	it('can return the at-rule type from static method', () => {
		const atRuleType = AtRule.getAtRuleType('@media screen and (min-width: 900px)');
		assert.equal(atRuleType, 'media');
	});
	it('can return the at-rule type from getter', () => {
		const atRule = new AtRule('@media screen and (min-width: 900px)');
		assert.equal(atRule.atRuleType, 'media');
	});
});
