# content-change

Observe and react to changes in distributed nodes in web components, Shadow DOM v0.

It behaves, and is used similarly to [Shadow DOM v1's "slotchange" event](https://hayato.io/2016/shadowdomv1/#events-to-react-the-change-of-distributions).

> Just 2.1k gzipped

## Why
Shadow DOM v0, unlike Shadow DOM v1, has no specification for watching changes to distributed nodes. Because the support for v1 is not as high as v0 at this point, this library exists to provide the ability to watch distribution changes to content elements in v0, while still working with the webcomponents.js polyfill library.

## Install
You can install it from npm
```
npm install --save content-change
```

If you're not using package management, you can [download a ZIP](https://github.com/kevinokerlund/content-change/archive/master.zip) file and use `lib/content-change.min.js`.

## Setup
The script must be located before web components are imported. If you are using the `webcomponents.js` polyfill, it doesn't matter if is located before or after the inclusion of `webcomponent.js`.
```html
<script src="yourpath/content-change.min.js"></script>
<!-- now import your web components -->
```

This library is UMD wrapped and if you are using a module bundler, you have a couple of different options. You can just import the package to the appropriate location, or you can import the one and only function available, `watch`.
```javascript
import ContentChange from 'content-change';

// or just import the watch function
import {watch} from 'content-change';
``` 

If the library is directly sourced to the window, it operates on the `ContentChange` global namespace (`window.ContentChange`).

#Usage
Only 1 mutation observer is created per host. No additional MutationObservers are not spawned on distributed nodes. Because this library provides functionality that is non-spec, it does not modify the api's and objects of any Shadow DOM behavior.

### Specifying which components to watch
A simple call inside of either the `createdCallback`, or the `attachedCallback` is made:

```javascript
ContentChange.watch(hostElement);
```

`watch` accepts the host element as an argument.

There is a benefit to this approach as you can specify which components are watched, rather than this library attempting to watch all created components.

### Reacting to changes in distributed nodes
The final piece is to specify which `content` elements should have an event handler. The event is called `contentchange` and is triggered on `content` elements. This is done exactly like the `slotchange` event on the `slot` elements in Shadow DOM v1.

```javascript
// get the content element you want to watch for distributed changes in from the shadow dom
const content = shadow.querySelector('selectorForYourContentElement');
// Add the listener
content.addEventListener('contentchange', e => {
	console.log(e);
});
```

## Reacting to the different event details
Because the event is created with CustomEvent, the information you will look for in the event will be under the detail key:
`e.detail`. There are three different event `type`'s, you can recieve:

* nodesAdded
* nodesRemoved
* mutation

### Reacting to newly distributed nodes
The event detail will contain an object that looks like the following:
```javascript
{
    "type": "nodesAdded",
    "nodesAdded": [Nodes] // An array of added nodes
}
```

### Reacting to nodes that are no longer distributed
The event detail will contain an object that looks like the following:
```javascript
{
    "type": "nodesRemoved",
    "nodesRemoved": [Nodes] // An array of removed nodes
}
```

### Reacting to mutations in distributed nodes
When a currently distributed node has a change occur on it, that does not cause it to no longer be distributed, you will recieve a `MutationRecord` in an object that looks like the following:
```javascript
{
    "type": "mutation",
    "mutation": MutationRecord
}
```
This can be attribute changes, added or removed nodes on the distributed node, characterData changes, etc.

# Browser support
| Chrome | Firefox | Safari | IE | Edge | Chrome Android | Mobile Safari |
|:------:|:-------:|:------:|:--:|:----:|:--------------:|:-------------:|
|    ✓   |    ✓    |   7+   | 11 |   ✓  |        ✓       |       ✓       |
This table attempts to reflect the same support of webcomponents.js. However, there is no support for IE10 for content-change.js while there is partial IE10 support for web componenets using the webcomponentsjs polyfill.

# A full example
I will soon make a small github page so that a live example may be viewed. For now, the contents of the files will be placed here:

#### example-component.html
A simple web component
```html
<template id="example-component">
	<div>I am an example component</div>
	<!-- Distribute paragraphs -->
	<content select="p"></content>
</template>

<script>
	(function () {

		var doc = (document._currentScript || document.currentScript).ownerDocument;
		var objectPrototype = Object.create(HTMLElement.prototype);

		objectPrototype.createdCallback = function () {
			var shadow = this.createShadowRoot();
			var template = doc.querySelector('#example-component');
			shadow.appendChild(template.content.cloneNode(true));

			// Watch this components distributed nodes ("this" is currently the host element)
			window.ContentChange.watch(this);

			var pContent = shadow.querySelector('content[select="p"]');
			pContent.addEventListener('contentchange', function (e) {
				// "this" is the content element
				console.log(this, e.detail);
			});
		};

		document.registerElement('example-component', {
			prototype: objectPrototype
		});

	})();
</script>

```
#### index.html
The web page that the web component will be rendered on
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>Watch Changes in distributed nodes in Shadow DOM v0</title>

	<script src="https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/0.7.23/webcomponents.min.js"></script>
	<script src="lib/content-change.js"></script>
	<link rel="import" href="example-component.html">
</head>
<body>

<example-component>
	<p>This will be a distributed node</p>
</example-component>

<script>
	// Manipulate the example-component so we see changes
	var example = document.querySelector('example-component');
	var p = document.createElement('p');
	p.textContent = 'Dynamically created';

	// Add to the component at some point
	window.setTimeout(function () {
		example.appendChild(p);
	}, 500);

	// Modify a distributed node some point later
	window.setTimeout(function () {
		p.classList.add('foo');
	}, 750);

	// Remove a distributed node
	window.setTimeout(function () {
		example.removeChild(p);
	}, 1000);
</script>

</body>
</html>

```
