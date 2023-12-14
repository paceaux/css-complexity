import { describe, it } from 'node:test';
import assert from 'node:assert';

import AtRule from '../src/at-rule.js';

describe('at-rule tests', () => {
	describe('it sanitizes at rules from a static method', () => {
		it('lowercases', () => {
			const condition = AtRule.sanitizeAtRule('SCREEN and (Min-width: 900px)');
			assert.equal(condition, 'screen and (min-width:900px)');
		});
		it('removes space after a :', () => {
			const condition = AtRule.sanitizeAtRule('screen and (min-width: 900px)');
			assert.equal(condition, 'screen and (min-width:900px)');
		});
		it('removes spaces around a :', () => {
			const condition = AtRule.sanitizeAtRule('screen and (min-width : 900px)');
			assert.equal(condition, 'screen and (min-width:900px)');
		});
		it('removes spaces after a (', () => {
			const condition = AtRule.sanitizeAtRule('screen and ( min-width: 900px)');
			assert.equal(condition, 'screen and (min-width:900px)');
		});
		it('removes spaces before a )', () => {
			const condition = AtRule.sanitizeAtRule('screen and ( min-width: 900px )');
			assert.equal(condition, 'screen and (min-width:900px)');
		});
		it('removes double spaces)', () => {
			const condition = AtRule.sanitizeAtRule(' screen and  ( min-width: 900px ) ');
			assert.equal(condition, 'screen and (min-width:900px)');
		});
		it('removes triple   and more         spaces', () => {
			const condition = AtRule.sanitizeAtRule('@media   screen and       ( min-width  : 900px) ');
			assert.equal(condition, '@media screen and (min-width:900px)');
		});
	});
	describe('basic parsing', () => {
		it('can return the at-rule type from static method', () => {
			const atRuleType = AtRule.getAtRuleType('@media screen and (min-width: 900px)');
			assert.equal(atRuleType, 'media');
		});
		it('can return the condition from static method', () => {
			const condition = AtRule.getConditionText('@media screen and (min-width: 900px)');
			assert.equal(condition, 'screen and (min-width: 900px)');
		});
		it('can return the at-rule type from getter', () => {
			const atRule = new AtRule('@media screen and (min-width: 900px)');
			assert.equal(atRule.atRuleType, 'media');
		});
		it('can return the condition from getter', () => {
			const atRule = new AtRule('@media screen and (min-width: 900px)');
			assert.equal(atRule.conditionText, 'screen and (min-width: 900px)');
		});
	})
});
