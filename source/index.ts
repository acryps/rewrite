import { Component } from "@acryps/page";
import { select, Style, StyleGroup } from "@acryps/style";

export class Rewrite {
	nativeElements = ['img', 'canvas', 'body', 'textarea', 'select', 'option', 'optgroup', 'input'];

	namedElements = {
		'ui-title': 'h1',
		'ui-name': 'h2',
		'ui-description': 'p',
		'ui-section': 'section',
		'ui-navigation': 'nav'
	};

	doubleElements = ['ui-icon'];

	attributeRewrites = {
		'ui-href': {
			tag: 'a',
			attribute: 'href',
			value: (value: string, component: Component) => {
				const destination = component.router.absolute(value, component);

				// return the link as provided if not a route within the application
				// - this works for routes handled by the server (for example PDF exports)
				// - external links
				if (!component.router.getRoute(destination)) {
					return value;
				}

				return destination;
			}
		}
	};

	defaultElement = 'div';

	nameTransformer = (name: string) => name.replace('ui-', '');

	activate() {
		this.activateStyleReset();
		this.activateStyleRewrite();
		this.activateElementRewrite();
	}

	compileStyleReset() {
		return `${[
			this.defaultElement,
			...Object.values(this.namedElements),
			...Object.keys(this.attributeRewrites).map(rewrite => this.attributeRewrites[rewrite].tag).filter(tag => tag)
			].join(',')}{all:unset}`;
	}

	activateStyleReset() {
		const resetStyle = document.createElement('style');
		resetStyle.textContent = this.compileStyleReset();

		document.head.appendChild(resetStyle);
	}

	activateStyleRewrite() {
		const rewriter = this;

		StyleGroup.prototype.wrapSelector = selector => {
			const modified = selector.replace(/(?<![:"[-])\b[a-z0-9][a-z0-9-]*\b/g, match => {
				if (rewriter.nativeElements.includes(match)) {
					return match;
				}

				const classedSelector = `.${rewriter.nameTransformer(match)}`;

				if (match in rewriter.namedElements) {
					return classedSelector;
				}

				if (rewriter.doubleElements.includes(match)) {
					return `:is(${match}, ${classedSelector})`;
				}

				return classedSelector;
			});

			return modified;
		};
	}

	activateElementRewrite() {
		const rewriter = this;
		const createElement = Component.prototype.createElement;

		Component.prototype.createElement = function (tag, attributes, ...children) {
			const source = tag;

			if (rewriter.nativeElements.includes(tag) || rewriter.doubleElements.includes(tag)) {
				tag = tag;
			} else if (tag in rewriter.namedElements) {
				tag = rewriter.namedElements[tag];
			} else {
				tag = rewriter.defaultElement;
			}

			for (let attribute in { ...attributes }) {
				if (attribute in rewriter.attributeRewrites) {
					const rewrite = rewriter.attributeRewrites[attribute];
					let value = attributes[attribute];

					if (rewrite.value) {
						value = rewrite.value(value, this);
					}

					attributes[rewrite.attribute] = value;

					if (rewrite.tag) {
						tag = rewrite.tag;
					}
				}
			}

			const element = createElement.bind(this)(tag, attributes, ...children);
			element.classList.add(rewriter.nameTransformer(source));

			return element;
		};
	}
}
