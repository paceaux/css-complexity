import * as specificity from 'specificity';

/**
 * @class
 * @classdesc Represents a CSS selector.
 */
class Selector {
	/**
	 * @param  {string} selector
	 * @returns {string} the sanitized selector (lowercased, extraneous spaces removed, trimmed)
	 */
	static sanitizeSelector(selector) {
		if (typeof selector !== 'string') throw new Error('selector must be a string');

		const sanitizedSelector = selector
			.toLowerCase()
			.replace(/\s{2,}/g, ' ') // remove double spaces or more
			.trim();

		return sanitizedSelector;
	}

	functionalPseudoSelectors = ['is', 'where', 'has', 'not'];

	selectorCombinators = ['~', '>', '+'];
	/**
    * @typedef RegExQuery
    * @type {RegExp}
    * @description A regular expression for matching CSS combinators ~ + >
    */

	combinatorRegex = new RegExp(`[${this.selectorCombinators.join('')}]`, 'g');

	/**
    * @typedef RegExQuery
    * @type {RegExp}
    * @description A regular expression for matching CSS functional pseudo-selectors :is :where :has :not
    */
	functionalPseudoRegex = new RegExp(`:${this.functionalPseudoSelectors.join('|')}`, 'gi');

	/**
     * @property {string} selector - the selector to parse
     */
	selector = '';

	/**
     * @param  {string} selector - the selector to parse
     * @param  {object} dependencies={specificity} - the dependencies to inject
     */
	constructor(selector = '', dependencies = { specificity }) {
		this.dependencies = dependencies;

		if (selector) {
			this.selector = Selector.sanitizeSelector(selector);
		}
	}

	/**
     * @typedef {'id'|'class'|'type'} SpecificityType
     */

	/**
     * @property {Map<SpecificityType, number>} specificity - the specificity of the selector
     */
	get specificity() {
		const { A, B, C } = this.dependencies.specificity.calculate(this.selector);

		return new Map([
			['id', A],
			['class', B],
			['type', C],
		]);
	}

	/**
     * @property {number} specificityWeight - the weight calculated from specificity
     */
	get specificityWeight() {
		return [...this.specificity.values()].reduce((acc, value) => acc + value, 0);
	}

	/**
     * @typedef {'~'|'>'|'+'} Combinator
     */

	/**
     * @property {Map<Combinator, number>} specificity - the specificity of the selector
     */
	get combinators() {
		// build a map of the combinators from the internal list
		const combinatorMap = new Map();

		this.selectorCombinators.forEach((combinator) => {
			combinatorMap.set(combinator, 0);
		});

		if (this.selector) {
			// the regex here is also built dynamically from our internal list
			const combinatorList = this.selector.match(this.combinatorRegex);

			combinatorList?.forEach((combinator) => {
				combinatorMap.set(combinator, combinatorMap.get(combinator) + 1);
			});
		}

		return combinatorMap;
	}

	/**
     * @property {number} combinatorWeight - the weight calculated from combinators
     */
	get combinatorWeight() {
		return [...this.combinators.values()].reduce((acc, value) => acc + value, 0);
	}

	/**
     * @typedef {'is'|'where'|'has'|'not'} FunctionalPseudoClass
     */

	/**
     * @property {Map<FunctionalPseudoClass, number>} functionalPseudos - the functional pseudo selectors -
     */
	get functionalPseudos() {
		const pseudoMap = new Map();

		// build the map from the internal list of pseudo selectors
		this.functionalPseudoSelectors.forEach((pseudo) => {
			pseudoMap.set(pseudo, 0);
		});

		if (this.selector) {
			// the regex here is also built dynamically from that internal list
			const functionalPseudoList = this.selector.match(this.functionalPseudoRegex);

			functionalPseudoList?.forEach((pseudo) => {
				const trimmedPseudo = pseudo.replace(':', '');
				pseudoMap.set(trimmedPseudo, pseudoMap.get(trimmedPseudo) + 1);
			});
		}
		return pseudoMap;
	}

	/**
     * @property {number} functionalPseudoWeight - the weight calculated from functionalPseudoSelectors
     */
	get functionalPseudoWeight() {
		return [...this.functionalPseudos.values()].reduce((acc, value) => acc + value, 0);
	}

	/**
     * @property {number} functionalPseudoWeight - the weight calculated from functionalPseudoSelectors
     */
	get selectorComplexity() {
		return this.specificityWeight + this.combinatorWeight + this.functionalPseudoWeight;
	}
}

export default Selector;
