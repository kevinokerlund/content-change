import './polyfills/CustomEvent';
import './polyfills/Array-Find';
import './polyfills/Array-From';
import './polyfills/Array-Includes';

import * as Events from './events';

let Instances = new WeakMap();

class Observer {

	/**
	 * @param host | The host element
	 */
	constructor(host) {
		this.host = host;
		this.shadowRoot = this.host.shadowRoot;
		this.currentObservedElements = [];
		this.mutationObserver = null;

		this.setDistributedNodes();
		this.observeHost();
	}


	/**
	 * Returns all currently distributed nodes. This is needed for comparison when
	 * searching the content elements for new or removes nodes.
	 *
	 * @returns {Array.<*>}
	 */
	get allCurrentDistributedNodes() {
		//@TODO... seems overly complicated
		return [].concat(...this.currentObservedElements.map(a => a.distributedNodes));
	}


	/**
	 * Returns all content elements within the shadowRoot of the host element
	 *
	 * @returns {Array}
	 */
	get contentElements() {
		return Array.from(this.shadowRoot.querySelectorAll('content'));
	}


	/**
	 * Finds all the distributed nodes. Runs when the constructor is called to get
	 * the initial elements the component starts with
	 */
	setDistributedNodes() {
		this.contentElements.forEach(content => {
			let distributedNodes = Array.from(content.getDistributedNodes());
			this.currentObservedElements.push({
				content,
				distributedNodes
			});
		});
	}


	/**
	 * Compares the currently distributed nodes against the original set of
	 * distributed nodes and determines if any are new or are missing (removed)
	 * If any are found they are added to, or removed from the registry and an event is fired.
	 * Attempts to be efficient by only searching for added or removed based on an optional flag
	 *
	 * @param searchFor | should be "added" or "removed" or just falsy
	 */
	discoverAddedAndRemovedNodes(searchFor) {
		this.contentElements.forEach(content => {
			let currentDistributedNodes = Array.from(content.getDistributedNodes());

			let entry = this.currentObservedElements.find(obj => obj.content == content);


			if (!searchFor || searchFor == 'added') {
				let addedNodes = currentDistributedNodes
					.filter(node => !entry.distributedNodes.includes(node));

				if (addedNodes.length) {
					entry.distributedNodes = currentDistributedNodes;
					Events.nodesAddedToContentEvent(content, addedNodes);
				}
			}


			if (!searchFor || searchFor == 'removed') {
				let removedNodes = entry.distributedNodes
					.filter(node => !currentDistributedNodes.includes(node));

				if (removedNodes.length) {
					entry.distributedNodes = currentDistributedNodes;
					Events.nodesRemovedFromContentEvent(content, removedNodes);
				}
			}
		});
	}


	/**
	 * Sets a MutationObserver on the host element. Watches for additions and
	 * deletions and attribute changes to all types of nodes, including Text Nodes
	 */
	observeHost() {
		this.mutationObserver = new MutationObserver(mutations => {

			//@TODO: look at not iterating over the mutations array, and instead just trigger the searches after a mutation

			mutations.forEach(mutation => {

				/**
				 * If nodes were added or removed from the host element (childlist mutation type),
				 * then search for added or removed nodes
				 */
				if (mutation.type === 'childList') {
					if (mutation.addedNodes.length) {
						this.discoverAddedAndRemovedNodes('added');
					}
					if (mutation.removedNodes.length) {
						this.discoverAddedAndRemovedNodes('removed');
					}
				}

				/**
				 * If the mutation contains an exact target and that target is included
				 * in a watched content element, then fire an event letting the
				 * component know a node was changed
				 */
				if (mutation.target && this.allCurrentDistributedNodes.some(el => el.contains(mutation.target))) {
					this.contentElements.forEach(content => {
						let targetElementIsDistributed = Array.from(content.getDistributedNodes())
							.some(node => node.contains(mutation.target));

						if (targetElementIsDistributed) {
							Events.contentChangeEvent(content, mutation);
						}
					});
				}

				/**
				 * This is needed to determine if an element becomes distributed, or
				 * is no longer distributed because of an attribute change. For example,
				 * say a content element selects "h3.foo". And the h3 loses the foo class
				 * at some point, the element is now no longer a distributed element
				 */
				if (mutation.type === 'attributes' && mutation.target.parentNode === this.host) {
					this.discoverAddedAndRemovedNodes();
				}
			});
		});

		this.mutationObserver.observe(this.host, {
			childList: true,
			attributes: true,
			characterData: true,
			subtree: true
		});
	}

	unwatch() {
		this.mutationObserver.disconnect();
	}
}

export default {
	watch: (host) => {
		Instances.set(host, new Observer(host));
	},
	unwatch: (host) => {
		Instances.get(host).unwatch();
		Instances.delete(host);
	}
}
