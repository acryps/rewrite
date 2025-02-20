# @acryps/rewrite JSX Rewriter
Opinionated, library specific ([@acryps/page](https://github.com/acryps/page) and [@acryps/style](https://github.com/acryps/style)) JSX rewriter.

## Introduction
We do something odd, we usually do not use standard HTML tags.

HTML is supposed to contain a contents structure, and no styles, or anything that defines how the content should be shown.
They provide a lot of elements to do this, `<h1>` `<section>` - but not enough.
Many developers resort to using the `<div class="">` element, whenever there is no matching HTML element.
This leads to a confusing mess of native elements and class lists.

We like to keep our HTMLs separate from our styles.
This allowed us to completely revamp one of our larger websites by an intern, with very little changes to the HTML.
You won't find a `<ui-button>` anywhere, we only use `<ui-action>` as this might be a big button, an inline button, a pane, a card ...
```
<ui-home>
	<ui-title>
		Hello World!
	</ui-title>

	<ui-guide>
		Lorem Ipsum
	</ui-guide>

	<ui-actions>
		<ui-action ui-href='/yay'>
			Yay!
		</ui-action>

		<ui-action ui-href='/nay'>
			Nay!
		</ui-action>
	</ui-actions>
</ui-home>
```

This works fine, as the `-` in a tag name denotes the elements as custom elements as defined in the [Custom Elements Specification](https://www.w3.org/TR/custom-elements/).
We have resorted to using `ui-` for anything, that is not purely a HTML element.

SEO is not very good with this approach, just like **doing everything with `<div>` is not very good either**.
You might see that we prefer to write links as `<ui-action ui-href>` and not as an `<a href>` tag, which does hurt both useability and SEO.
Rewrite steps in here and converts all our non-standard stuff into standard elements, to allow us to write our code without the mix-match approach and just write everything as `<ui-***>`.

Our HTML from before will be rendered as
```
<div class="home">
	<h1>
		Hello World!
	</h1>

	<div class="guide">
		Lorem Ipsum
	</div>

	<div class="actions">
		<a href="/yay">
			Yay!
		</a>

		<a href="/nay">
			Nay!
		</a>
	</div>
</div>
```

Including the provided styles prevents default styles from being applied to elements, for example our `<ui-action>` wont be rendered blue and underlined all of the sudden, just because it is a `<a href>` now.

## Usage
In your application main, before ever creating an element (before the router).
```
new Rewrite().activate();
```

If you need to overwrite our defaults, or need granular control over what is rewritten
```
const rewriter = new Rewrite();
rewriter.defaultElement = `span`;

rewriter.activateStyleReset(); // automatically appends resetting styles to <head>s
rewriter.activateStyleRewrite();
rewriter.activateElementRewrite();
```

The style resetter can be obtained by using `rewriter.compileStyleReset()`

## Rules
Shown here are defaults for all types of rules.

The element to use for all elements that are not part of any of the lists above.
A `<ui-test>` will become `<div class="test">`
```
rewriter.defaultElement = 'div';
```

Elements which should not be altered.
An `<img>` will stay an `<img>`
```
rewriter.nativeElements = ['img', 'canvas', 'body', 'textarea', 'select', 'option', 'optgroup', 'input']
```

Elements which should be replaced.
An `<ui-title>` will become a `<h1>`.
CSS `ui-title` will become `.title`
```
rewriter.namedElements = {
	'ui-title': 'h1',
	'ui-name': 'h2',
	'ui-description': 'p',
	'ui-section': 'section',
	'ui-navigation': 'nav'
};
```

Elements where css declarations should be made for the native and named version.
The attribute `ui-icon` will become `:is(ui-icon, .icon)`
```
rewriter.doubleElements = ['ui-icon'];
```

Replaces attributes.
If a tag value is provided, the tag is replaced too
A `<ui-test ui-href='/abc'>` will be replaced with `<a href="/abc" class="test">`
```
rewriter.attributeRewrites = {
	'ui-href': {
		tag: 'a',
		attribute: 'href',
		value: (value: string, component: Component) => { ... } // see source for inner workings
	}
};
```

Transforms names.
An `ui-test` will become a `test`
```
rewriter.nameTransformer = (name: string) => name.replace('ui-', '');
```

## Pitfalls
This only works on elements created in `@acryps/page` components.
It will not work when using `document.createElement` or custom `static createElement` methods (commonly used in SVG bundles).

Style rewrites only work for `@acryps/style` declarations.
Any styles applied outside, using `<style>`, `.style`, `style=` will not work.

Default styles will only be applied for elements defined in
- defaultElement
- namedElements
- attributeRewrites (where a `tag` is provided)
