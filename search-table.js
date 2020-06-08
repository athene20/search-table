// Vanilla JS table filter
// Source: https://blog.pagesd.info/2019/10/01/search-filter-table-javascript/

// IE11 호환용
// ChildNode.before polyfill
// from: https://github.com/jserz/js_piece/blob/master/DOM/ChildNode/before()/before().md
(function (arr) {
	arr.forEach(function (item) {
		if (item.hasOwnProperty('before')) {
			return;
		}
		Object.defineProperty(item, 'before', {
			configurable: true,
			enumerable: true,
			writable: true,
			value: function before() {
				var argArr = Array.prototype.slice.call(arguments),
					docFrag = document.createDocumentFragment();
				argArr.forEach(function (argItem) {
					var isNode = argItem instanceof Node;
					docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
				});
				this.parentNode.insertBefore(docFrag, this);
			}
		});
	});
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

document.addEventListener("DOMContentLoaded", function () {
	"use strict";

	var TableFilter = (function () {
		var search;

		function dquery(selector) {
			// Returns an array of elements corresponding to the selector
			return Array.prototype.slice.call(document.querySelectorAll(selector));
		}

		function onInputEvent(e) {
			// Retrieves the text to search
			var input = e.target;
			search = input.value.toLocaleLowerCase();
			// Get the lines where to search
			// (the data-table attribute of the input is used to identify the table to be filtered)
			var selector = "." + input.getAttribute("data-table") + " tbody tr";
			var rows = dquery(selector);
			// Searches for the requested text on all rows of the table
			[].forEach.call(rows, filter);
		}

		function filter(row) {
			// Caching the tr line in lowercase
			if (row.lowerTextContent === undefined) row.lowerTextContent = row.textContent.toLocaleLowerCase();
			// Hide the line if it does not contain the search text
			row.style.display = row.lowerTextContent.indexOf(search) === -1 ? "none" : "table-row";
		}

		function getRandomInt() {
			var min = Math.ceil(1);
			var max = Math.floor(999);
			return Math.floor(Math.random() * (max - min)) + min; // 최대값은 제외, 최소값은 포함
		}

		return {
			init: function () {
				// find all tables and make search field if table has searchable class
				forEach(document.getElementsByTagName('table'), function (table) {
					if (table.className.search(/\bsearchable\b/) != -1) {
						//make data-table attribute for input
						var target = document.createAttribute("data-table");
						target.value = "searchable" + getRandomInt().toString();
						// make input field
						var input = document.createElement("input");
						input.setAttributeNode(target);
						// make wrapper div
						var div = document.createElement("div");
						div.appendChild(input);
						// make label for input
						var strong = document.createElement("span");
						strong.textContent = "search : ";
						// append to a document
						table.before(strong);
						table.before(div);
						table.classList.add(target.value);
					}
				});

				// get the list of input fields with a data-table attribute
				var inputs = dquery("input[data-table]");
				[].forEach.call(inputs, function (input) {
					// Triggers the search as soon as you enter a search filter
					input.oninput = onInputEvent;
					// If we already have a value (following navigation back), we relaunch the search
					if (input.value !== "") input.oninput({
						target: input
					});
				});
			}
		};
	})();

	TableFilter.init();
});