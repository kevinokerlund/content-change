/**
 * Dispatches the "contentchange" events. The detail may be different,
 * but the eventType is always "contentchange"
 *
 * @param contentElement
 * @param detail
 */
function dispatchContentChangeEvent(contentElement, detail) {
	let event = new CustomEvent("contentchange", {
		detail: detail
	});
	contentElement.dispatchEvent(event);
}


/**
 * Acts as a pass-through for a MutationRecord
 *
 * @param contentElement
 * @param mutationRecord
 */
export function contentChangeEvent(contentElement, mutationRecord) {
	dispatchContentChangeEvent(contentElement, {
		type: 'mutation',
		mutation: mutationRecord
	});
}


/**
 * Sets up a "contentchange" event that passes an array of added nodes
 *
 * @param contentElement
 * @param nodes
 */
export function nodesAddedToContentEvent(contentElement, nodes) {
	dispatchContentChangeEvent(contentElement, {
		type: 'nodesAdded',
		nodesAdded: nodes
	});
}


/**
 * Sets up a "contentchange" event that passes an array of removed nodes
 *
 * @param contentElement
 * @param nodes
 */
export function nodesRemovedFromContentEvent(contentElement, nodes) {
	dispatchContentChangeEvent(contentElement, {
		type: 'nodesRemoved',
		nodesRemoved: nodes
	});
}

export default {};
