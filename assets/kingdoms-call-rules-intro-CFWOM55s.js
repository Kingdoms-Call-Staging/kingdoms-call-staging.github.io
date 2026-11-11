// src/ui/shared/the-pages-element-with-the-id.ts
/** The element of `page` with the id `id`, of the kind `kind`. Throws a TypeError naming the id when the page holds no
*  element with it, or holds one of another kind. `page` is the page's own document unless a test hands another. */
function theElementWithTheId(id, kind, page = document) {
	const found = page.getElementById(id);
	if (found === null) throw new TypeError(`the page holds no element with the id "${id}"`);
	if (!(found instanceof kind)) throw new TypeError(`the page's element with the id "${id}" is a <${found.tagName.toLowerCase()}>, not of the kind asked for`);
	return found;
}
// src/rulebook/toc.ts
(function() {
	const toc = theElementWithTheId("toc", HTMLElement), btn = document.getElementById("tocToggle");
	if (btn) btn.addEventListener("click", function() {
		const open = toc.classList.toggle("open");
		btn.setAttribute("aria-expanded", open ? "true" : "false");
	});
	toc.addEventListener("click", function(e) {
		if (theTagOfWhatWasClicked(e) === "A" && window.matchMedia("(max-width:860px)").matches) {
			toc.classList.remove("open");
			if (btn) btn.setAttribute("aria-expanded", "false");
		}
	});
})();
/** The tag of the element a click landed on (`e.target.tagName`): a click is always on an element; any other target has
*  no tag, and none throws the TypeError reading its tag threw. */
function theTagOfWhatWasClicked(e) {
	const target = e.target;
	if (target === null) throw new TypeError("a click's target is null");
	return target instanceof Element ? target.tagName : void 0;
}
