import * as Events from './events';


class Observer {

	/**
	 * @param host | The host element
	 */
	constructor(host) {
		this.host = host;
		this.shadowRoot = this.host.shadowRoot;
		this.currentObservedElements = [];

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
	 * distributed nodes and determines if any are new. If any new are found
	 * they are added to the registry and an event is fired
	 */
	findNewNodes() {
		this.contentElements.forEach(content => {
			let currentDistributedNodes = Array.from(content.getDistributedNodes());

			let entry = this.currentObservedElements.find(obj => obj.content == content);

			let addedNodes = currentDistributedNodes
				.filter(node => !entry.distributedNodes.includes(node));

			if (addedNodes.length) {
				entry.distributedNodes = currentDistributedNodes;
				Events.nodesAddedToContentEvent(content, addedNodes);
			}
		});
	}


	/**
	 * Compares the currently distributed nodes against the original set of
	 * distributed nodes and determines if any are missing. If any new are missing
	 * they are removed from the registry and an event is fired
	 */
	findRemovedNodes() {
		this.contentElements.forEach(content => {
			let currentDistributedNodes = Array.from(content.getDistributedNodes());

			let entry = this.currentObservedElements.find(obj => obj.content == content);

			let removedNodes = entry.distributedNodes
				.filter(node => !currentDistributedNodes.includes(node));

			if (removedNodes.length) {
				entry.distributedNodes = currentDistributedNodes;
				Events.nodesRemovedFromContentEvent(content, removedNodes);
			}
		});
	}


	/**
	 * Sets a MutationObserver on the host element. Watches for additions and
	 * deletions and attribute changes to all types of nodes, including Text Nodes
	 */
	observeHost() {
		let observer = new MutationObserver(mutations => {

			mutations.forEach(mutation => {

				/**
				 * If nodes were added or removed from the host element (childlist mutation type),
				 * then search for added or removed nodes
				 */
				if (mutation.type === 'childList') {
					if (mutation.addedNodes.length) {
						this.findNewNodes();
					}
					if (mutation.removedNodes.length) {
						this.findRemovedNodes();
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
					console.log('IOops');
					this.findNewNodes();
					this.findRemovedNodes();
				}
			});
		});

		observer.observe(this.host, {
			childList: true,
			attributes: true,
			characterData: true,
			subtree: true
		});
	}
}

export default {
	watch: (...args) => new Observer(...args)
}
