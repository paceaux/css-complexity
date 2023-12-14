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
			assert.equal(atRule.conditionText, 'screen and (min-width:900px)');
		});
	});
	describe('regexing', () => {
		it('will match something with attype', () => {
			const match = 'media'.match(AtRule.atTypeRegex);
			assert.equal(match[0], 'media');
		});
		it('will match something with mediatype', () => {
			const match = 'screen'.match(AtRule.mediaTypeRegex);
			assert.equal(match[0], 'screen');
		});
		it('will match something with operatorType', () => {
			const match = 'or'.match(AtRule.operatorRegex);
			assert.equal(match[0], 'or');
		});
		it('will will not match  something with atType', () => {
			const match = 'foo'.match(AtRule.atTypeRegex);
			assert.notEqual(match, 'foo');
		});
	});
	describe('tokeninzing the at', () => {
		it('will convert @page into a token that isnt conditional', () => {
			const token = AtRule.tokenizeAtType('@page');
			assert.equal(token.type, 'at');
			assert.equal(token.value, 'page');
			assert.equal(token.isConditional, false);
		});
		it('will convert @media  into a token that is conditional', () => {
			const token = AtRule.tokenizeAtType('@media');
			assert.equal(token.type, 'at');
			assert.equal(token.value, 'media');
			assert.equal(token.isConditional, true);
		});
		it('will convert @supports  into a token that is conditional', () => {
			const token = AtRule.tokenizeAtType('@supports');
			assert.equal(token.type, 'at');
			assert.equal(token.value, 'supports');
			assert.equal(token.isConditional, true);
		});
	});
	describe('tokenizing the whole dang thing', () => {
		it('tokenizes a basic media query and gets the right amount back', () => {
			const tokens = AtRule.tokenizeAtRule('@media screen and (min-width: 900px)');
			console.log(tokens);
			console.log(tokens[0], tokens[1], tokens[2]);
			assert.equal(tokens.length, 4);
		});
	});
});
