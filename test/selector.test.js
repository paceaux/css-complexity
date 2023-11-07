import { describe, it } from 'node:test';
import assert from 'node:assert';

import Selector from '../src/selector.js';

describe('testing Selector', () => {
	describe('specificity', () => {
		it('always returns a map with id, class, type', () => {
			const selector = new Selector('*');
			assert.equal(selector.specificity.has('id'), true);
			assert.equal(selector.specificity.has('class'), true);
			assert.equal(selector.specificity.has('type'), true);
		});
		it('determines specificity of 1 on an id', () => {
			const selector = new Selector('#id');
			assert.strictEqual(selector.specificity.get('id'), 1);
		});
		it('determines specificity of 1 on an class', () => {
			const selector = new Selector('.class');
			assert.strictEqual(selector.specificity.get('class'), 1);
		});
		it('determines specificity of 1 on an element', () => {
			const selector = new Selector('element');
			assert.strictEqual(selector.specificity.get('type'), 1);
		});
	});
	describe('combinators', () => {
		it('always has all three combinator types', () => {
			const selector = new Selector('.foo > bar');
			assert.equal(selector.combinators.has('~'), true);
			assert.equal(selector.combinators.has('+'), true);
			assert.equal(selector.combinators.has('>'), true);
		});
		it('finds descendant combinator', () => {
			const selector = new Selector('.foo > bar');
			assert.strictEqual(selector.combinators.get('>'), 1);
		});
		it('finds indirect sibling combinator', () => {
			const selector = new Selector('.foo ~ bar');
			assert.strictEqual(selector.combinators.get('~'), 1);
		});
		it('finds adjacent sibling combinator', () => {
			const selector = new Selector('.foo + bar');
			assert.strictEqual(selector.combinators.get('+'), 1);
		});
		it('finds multiple siblings', () => {
			const selector = new Selector('.foo + bar ~ .baz');
			assert.strictEqual(selector.combinators.get('+'), 1);
			assert.strictEqual(selector.combinators.get('~'), 1);
		});
		it('finds descendant + sibling', () => {
			const selector = new Selector('.foo > bar ~ .baz');
			assert.strictEqual(selector.combinators.get('>'), 1);
			assert.strictEqual(selector.combinators.get('~'), 1);
		});
		it('finds descendants and siblings', () => {
			const selector = new Selector('.foo > bar + .baz ~ .boop');
			assert.strictEqual(selector.combinators.get('>'), 1);
			assert.strictEqual(selector.combinators.get('~'), 1);
			assert.strictEqual(selector.combinators.get('+'), 1);
		});
	});
	describe('functional pseudo selectors', () => {
		it('finds :is', () => {
			const selector = new Selector(':is(.foo, .bar)');
			assert.strictEqual(selector.functionalPseudos.get('is'), 1);
		});
		it('finds :where', () => {
			const selector = new Selector(':where(.foo, .bar)');
			assert.strictEqual(selector.functionalPseudos.get('where'), 1);
		});
		it('finds :has', () => {
			const selector = new Selector(':has(.foo, .bar)');
			assert.strictEqual(selector.functionalPseudos.get('has'), 1);
		});
		it('finds :not', () => {
			const selector = new Selector(':not(.foo, .bar)');
			assert.strictEqual(selector.functionalPseudos.get('not'), 1);
		});
	});
	describe('weights', () => {
		describe('specificity weight', () => {
			it('calculates specificity weight of 1', () => {
				const selector = new Selector('bar');
				assert.strictEqual(selector.specificityWeight, 1);
			});
			it('calculates specificity weight of 2', () => {
				const selector = new Selector('.foo bar');
				assert.strictEqual(selector.specificityWeight, 2);
			});
			it('calculates specificity weight of 3', () => {
				const selector = new Selector('#foo .bar baz');
				assert.strictEqual(selector.specificityWeight, 3);
			});
		});
		describe('combinator weight', () => {
			it('calculates combinator weight of 1', () => {
				const selector = new Selector('boo + bar');
				assert.strictEqual(selector.combinatorWeight, 1);
			});
			it('calculates combinator weight of 2', () => {
				const selector = new Selector('.foo + bar > baz');
				assert.strictEqual(selector.combinatorWeight, 2);
			});
			it('calculates combinator weight of 3', () => {
				const selector = new Selector('.foo + bar > baz ~ .boop');
				assert.strictEqual(selector.combinatorWeight, 3);
			});
			it('calculates combinator weight of 0', () => {
				const selector = new Selector('.foo  bar  baz  .boop');
				assert.strictEqual(selector.combinatorWeight, 0);
			});
		});
		describe('pseudo weight', () => {
			it('calculates functionalPseudo weight of 1', () => {
				const selector = new Selector('boo:is(.foo, .bar)');
				assert.strictEqual(selector.functionalPseudoWeight, 1);
			});
			it('calculates functionalPseudo weight of 2', () => {
				const selector = new Selector('foo:has(:not(.bar))');
				assert.strictEqual(selector.functionalPseudoWeight, 2);
			});
			it('calculates functionalPseudo weight of 3', () => {
				const selector = new Selector('h1:where(.title):not(.foo):is(.bar)');
				assert.strictEqual(selector.functionalPseudoWeight, 3);
			});
			it('calculates functionalPseudo weight of 0', () => {
				const selector = new Selector('.foo');
				assert.strictEqual(selector.functionalPseudoWeight, 0);
			});
		});
	});
	describe('selectorComplexity', () => {
		it('calculates selectorComplexity of 1', () => {
			const selector = new Selector('boo');
			assert.strictEqual(selector.selectorComplexity, 1);
		});
		it('calculates selectorComplexity of 2', () => {
			const selector = new Selector('.foo bar');
			assert.strictEqual(selector.selectorComplexity, 2);
		});
		it('calculates selectorComplexity of 3', () => {
			const selector = new Selector('.foo + .bar');
			assert.strictEqual(selector.selectorComplexity, 3);
		});
		it('calculates selectorComplexity of 4', () => {
			const selector = new Selector('.foo + .bar h1');
			assert.strictEqual(selector.selectorComplexity, 4);
		});
		it('calculates selectorComplexity of 5', () => {
			const selector = new Selector('.foo.bar:not(.baz) h1');
			assert.strictEqual(selector.selectorComplexity, 5);
		});
	});
});
