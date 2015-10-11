/**
 * WeAreNotMachines::Remembers - a tiny client side memory
 */
(function($) {
	$.fn.remembers = function() {

		var r = this;

		window.remembers = r;
		this.scopes = [];
		this.data = {};


		var addScope = function(element) {
			var scope;
			if ((scope = getScope(element))!==undefined) {
				if ($.inArray(scope, r.scopes)) r.scopes.push(scope);
			}
		}

		var getScope = function(element) {
			return $(element).data("remember");
		}

		var fetch = function(element) {

			element = $(element);
			var fetched = {};

			element.attr("data-remembered",'');

			//collect all the data for the element scope
			var scopeName = getScope(element);
			//is this a simple element with a data-remember-value to store?
			if (element.attr("data-remember-value")!==undefined) {
				fetched = element.attr("data-remember-value");
				r.data[scopeName] = fetched;
				return element;
			}
			//does the element has a set of elements with matching scope (set as data-remember-label)
			var matchers = $('[data-remember-label="'+scopeName+'"]');
			if (matchers.length) {
				fetchFromMatchers(scopeName, matchers);
				return element;
			}
			//does the element reference a source - this could be a function or a piece of stored data eg in window
			if (element.attr("data-remember-source")!==undefined) {
				fetchFromSource(scopeName, element);
				return element;
			}
			return element;
		}

		var fetchFromMatchers = function(scope, matchers) {
			//work out the data structure - flat array or a hash - hash will contain elements with data-remember-key, array will not
			var asHash = false;
			var vals = {};
			matchers.each(function(i, e) {
				e = $(e);
				e.attr("data-remembered", '');
				var key,value;
				if (e.attr("data-remember-key")!==undefined) {
					asHash = true;
					key = e.attr("data-remember-key");
				} else {
					key = i;
				}
				value = e.attr("data-remember-value")!==undefined ? e.attr("data-remember-value") : parseValue(e);
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

		var fetchFromSource = function(scope, element) {
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

		var parseValue = function(element) {
			if (element.is("select") || element.is("input") || element.is("textarea")) {
				return element.val();
			} else {
				return element.text();
			}
		}

		this.update = function(event) {
			event.preventDefault();
			var ret = fetch(event.target);
			r.store();
			return ret;
		}


		this.getData = function() {
			return r.data;
		}

		this.getScopes = function() {
			return r.scopes;
		}

		this.getInstance = function() {
			return this;
		}

		this.debug = function(scope) {
			debugData = undefined!==scope || r.data[scope] ? r.data[scope] : r.data;
			$("[data-role='remember-debug']").each(function(i,d) {
				if ($(d).attr("data-remember-scope")==scope) {
					$(d).html("<pre>"+JSON.stringify(debugData, null, '\t')+"</pre>");
				}
			});
			return debugData;
		}

		this.store = function() {
			var rawCookie = JSON.stringify(r.data);
			var date = new Date();
			date.setTime(date.getTime()+(7*24*60*60*1000));
			var expires = "; expires="+date.toGMTString();
			document.cookie = "remember="+rawCookie+expires;

		}

		this.findCookie = function() {
			var rawCookies = document.cookie.split(";");
			for (var c in rawCookies) {
				var cVals = rawCookies[c].split("=");
				if (cVals.length>1 && cVals[0]=="remember") {
					return JSON.parse(cVals[1]);
				}
			}
			return {};
		}

		this.forget = function(what) {
			delete r.data[what];
			return this.store();
		}

		this.each(function(i, e) {
			addScope(e);
			fetch(e);
			//allow anchors and buttons to update themselves automatically
			if ($(e).is("a") || $(e).is("button") || $(e).is("input[type='submit']") || $(e).is("input[type='button']")) {
				$(e).on("click", r.update);
			}

		});

		return this;
	}
}(jQuery));