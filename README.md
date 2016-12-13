# content-change

Observe and react to distribution changes in Shadow DOM v0.

It behaves, and is constructed similarly to [Shadow DOM v1's "slotchange" event](https://hayato.io/2016/shadowdomv1/#events-to-react-the-change-of-distributions).

This small library only uses 1 mutation observer per host. Meaning that new MutationObservers are not spawned on distributed nodes.

### Sample Usage:

```html
<!-- host shadow tree -->
<content id="contentHeaders" select="h1, h2"></content>
```

```javascript
/* -- Inside the `createdCallback` of the component -- */

// Instead of adding to the web component apis and such,
// you specify which components to watch as this is non-spec.
// "this" is the host element from the creation of the component
ContentChange.watch(this);

const headerContent = shadow.querySelector('#contentHeaders');
headerContent.addEventListener('contentchange', e => {
	console.log('Changes to distributed nodes:', e);
});
```

#### Reacting to added nodes:
When new nodes are added to the host element that are then distributed to the content element with the listener, you will recieve the following as the event:
```
Object {type: "nodesAdded", nodesAdded: Array[2]}
```

#### Reacting to removed nodes:
When nodes are no longer distributed you will recieve the following:
```
Object {type: "nodesRemoved", nodesRemoved: Array[2]}
```

#### Reacting to changes in distributed nodes (attributes, text nodes, etc):
When a distributed node changes, or a node inside of a distributed node changes, you will receive a MutationRecord from the MutationObserver. 

---

### Status:
Work on this has only just begun. It works in the latest versions of Chrome, Firefox and Safari.
The only holdup for IE and Edge is adding polyfills for things like `Array.from/find`, and normalizing the Custom Event constructor.
