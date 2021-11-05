// Original : HTML Table Search
// Source: https://github.com/nikhil-vartak/html-table-search-js

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
				const argArr = Array.prototype.slice.call(arguments),
					docFrag = document.createDocumentFragment();
				argArr.forEach(function (argItem) {
					const isNode = argItem instanceof Node;
					docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
				});
				this.parentNode.insertBefore(docFrag, this);
			}
		});
	});
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

document.addEventListener("DOMContentLoaded", function () {
	"use strict";

	function getRandomInt() {
		const min = Math.ceil(10000);
		const max = Math.floor(100000);
		return Math.floor(Math.random() * (max - min)) + min;
	}

	// find all tables and make search field if table has searchable class
	const tables = document.querySelectorAll('table');
	for (let i = 0; i < tables.length; i++) {
		if (tables[i].className.search(/\bsearchable\b/) != -1) {
			//make a unique value for the table
			const target = document.createAttribute("id");
			target.value = "searchable" + getRandomInt().toString();
			// make input field
			const input = document.createElement("input");
			input.style.display = "block";
			input.style.width = "calc(100% - 12px)";
			input.style.background = "transparent";
			input.style.padding = "4px";
			input.style.outline = "none";
			input.style.border = "none";
			input.placeholder = "Enter search text";
			input.setAttributeNode(target);
			// make wrapper div
			const div = document.createElement("div");
			div.style.display = "block";
			div.style.width = "300px";
			div.style.border = "1px solid #333";
			div.style.borderRadius = "4px";
			div.style.padding = "4px";
			div.appendChild(input);
			// append to a document
			tables[i].before(div);
			// add class to a table because the table might already have an ID
			tables[i].classList.add(target.value);

			new TableSearch(target.value).init();
		}
	}
});

const TableSearch = function(searchable, options = null) {
	this.searchBox = document.querySelector('#' + searchable);
	this.dataTable = document.querySelector('.' + searchable);
	this.options = options;
}

TableSearch.prototype = {

	init: function(searchable, options = null) {
		// defaults options
		const settings = {
			firstRowHeader: true, 
			highlightCss: "style='background-color:yellow'",
			noResultsText: "Nothing found!"
		};

		this.options = settings;
		this.searchBox.addEventListener('keyup', this.search.bind(this), false);
	},

	search: function(e) {
		if(e.keyCode == 27) {
			this.searchBox.value = ''; // Clear search on Esc
		}

		this.toggleNoResult('remove');

		const keyword =  this.escapeSpecialChars(this.searchBox.value);
		const textSearchRegex = new RegExp(keyword, "ig"); // case in-sensitive
		let rowDisplay, rowObj, rowHtml, match;
		const firstRowIndex = (this.options.firstRowHeader == true) ? 1 : 0;

		for (let rowIndex = firstRowIndex; rowIndex < this.dataTable.rows.length; rowIndex++) {
			rowDisplay = '';
			rowObj = this.dataTable.rows.item(rowIndex);
			rowHtml = rowObj.innerHTML.replace(/<mark[^/>]*>/g,'').replace(/<\/mark>/g,''); // remove previous highlighting

			if (keyword == '')
				rowDisplay = 'table-row';
			else {
				match = rowHtml.replace(/<[^>]*>/g, '').match(textSearchRegex); // strip html tags and search for keyword
				if(match) {
					// Get unique matches: http://stackoverflow.com/a/21292834/1440057
					match = match.sort().filter(function(element, index, array) { return index == array.indexOf(element); });
					let tempHtml = rowHtml;
					for (let i = 0; i < match.length; i++)
						tempHtml = this.highlight(tempHtml, match[i]);
					
					if (tempHtml.search(/<\/mark>/g) > -1) {
						rowHtml = tempHtml;
						rowDisplay = 'table-row';
					}
					else // Keyword did not match with any column content
						rowDisplay = 'none';
				}
				else // Keyword did not match even in the row text content
					rowDisplay = 'none';
			}

			rowObj.innerHTML = rowHtml;
			rowObj.style.display = rowDisplay;
		}

		// Check if 'no results' row needs to be added
		if (keyword != '' && this.options.noResultsText && this.dataTable.innerHTML.search(/style=\"display: table-row;\"/g) == -1)
			this.toggleNoResult('add');
	},

	highlight: function(rowHtml, match) {
		const row = document.createElement('tr');
		row.innerHTML = rowHtml;

		const textReplaceRegex = new RegExp(this.escapeSpecialChars(match), "g"); // case sensitive
		const highlightMarkup = '<mark ' + this.options.highlightCss + '>' + match + '</mark>';
		let cell = null;
		let htmlOut = '';

		for (let i = 0; i < row.cells.length; i++) {
			cell = row.cells.item(i);
			// Highlighting works only for direct text content, not nested tags.
			// e.g. searching "blog" in <td><a href="url">my blog</a></td> won't work.
			if (cell.children.length == 0) {
				if (cell.textContent.indexOf(match) > -1) {
					// Match found in this cell, highlight it
					htmlOut += '<td>' + cell.textContent.replace(textReplaceRegex, highlightMarkup) + '</td>';
					continue;
				}
			}
			htmlOut += '<td>' + cell.innerHTML + '</td>';
		}

		return htmlOut;
	},

	escapeSpecialChars: function(inStr) {
		return inStr.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	},

	toggleNoResult: function(mode) {
		let noResultsRow;
		if (mode == 'add') {
			noResultsRow = this.dataTable.insertRow(this.dataTable.rows.length);
			noResultsRow.setAttribute('id', 'noResultsRow');
			const noResultsRowCell = noResultsRow.insertCell(0);
			noResultsRowCell.setAttribute('colspan', this.dataTable.rows[0].cells.length);
			noResultsRowCell.setAttribute('align', 'center');
			noResultsRowCell.textContent = this.options.noResultsText;
		}
		else if (mode == 'remove') {
			noResultsRow = this.dataTable.querySelector('#noResultsRow');
			if (noResultsRow != null) {
				this.dataTable.deleteRow(this.dataTable.rows.length - 1);
			}
		}
	}
}
