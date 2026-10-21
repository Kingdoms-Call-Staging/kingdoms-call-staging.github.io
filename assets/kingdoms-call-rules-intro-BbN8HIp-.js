//#region src/rulebook/toc.ts
(function() {
	var toc = document.getElementById("toc"), btn = document.getElementById("tocToggle");
	if (btn) btn.addEventListener("click", function() {
		var open = toc.classList.toggle("open");
		btn.setAttribute("aria-expanded", open ? "true" : "false");
	});
	toc.addEventListener("click", function(e) {
		if (e.target.tagName === "A" && window.matchMedia("(max-width:860px)").matches) {
			toc.classList.remove("open");
			if (btn) btn.setAttribute("aria-expanded", "false");
		}
	});
})();
//#endregion
