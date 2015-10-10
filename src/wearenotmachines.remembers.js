/**
 * WeAreNotMachines::Remembers - a tiny client side memory
 */
$.fn.remembers = function() {

	var r = this;

	this.scopes = [];
	this.data = {};

	this.shout = function() {
		alert("Hello!");
	}

	this.addScope = function(element) {
		var scope;
		if (scope = this.getScope(element)!==undefined) {
			if ($.inArray(scope, r.scopes)) r.scopes.push(scope);
		}
	}

	this.getScope = function(element) {
		return $(element).data("remember");
	}

	this.fetch = function(element) {

		element = $(element);
		var fetched = {};

		//collect all the data for the element scope
		var scopeName = this.getScope(element);
		//is this a simple element with a data-remember-value to store?
		if (element.attr("data-remember-value")!==undefined) {
			fetched = element.attr("data-remember-value");
			this.data[scopeName] = fetched;
			return element;
		}
		//does the element has a set of elements with matching scope (set as data-remember-label)
		var matchers = $('[data-remember-label="'+scopeName+'"]');
		if (matchers.length) {
			this.fetchFromMatchers(scopeName, matchers);
			return element;
		}	
		//does the element reference a source - this could be a function or a piece of stored data eg in window
		if (element.attr("data-remember-source")!==undefined) {
			this.fetchFromSource(scopeName, element);
			return element;
		}
		return element;
	}

	this.fetchFromMatchers = function(scope, matchers) {
		//work out the data structure - flat array or a hash - hash will contain elements with data-remember-key, array will not
		var asHash = false;
		var vals = {};
		matchers.each(function(i, e) {
			e = $(e);
			var key,value;
			if (e.attr("data-remember-key")!==undefined) {
				asHash = true;
				key = e.attr("data-remember-key");
			} else {
				key = i;
			}
			value = e.attr("data-remember-value")!==undefined ? e.attr("data-remember-value") : r.parseValue(e);
			vals[key] = value;
		});
		if (asHash) {
			r.data[scope] = vals
		} else {
			r.data[scope] = [];
			for (var n in vals) {
				r.data[scope].push(vals[n]);
			}
		}
	}

	this.fetchFromSource = function(scope, element) {
		element = $(element);
		var source = element.attr("data-remember-source");
		//unwrap the source to find out what it is
		var scopes = source.split(".");
		var unwrappedSource = undefined;
		for (var s in scopes) {
			unwrappedSource = undefined==unwrappedSource ? window[scopes[s]] : unwrappedSource[scopes[s]];
		}
		r.data[scope] = typeof unwrappedSource == "function" ? unwrappedSource() : unwrappedSource;
	}

	this.parseValue = function(element) {
		if (element.is("select") || element.is("input") || element.is("textarea")) {
			return element.val();
		} else {
			return element.text();
		}
	}

	this.each(function(i, e) {
		r.addScope(e);
		r.fetch(e);
	});

	console.log(r.data);


}