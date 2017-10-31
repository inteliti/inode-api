var Promise = require('bluebird');

module.exports = function () {
	'use strict';

	var module = {};

	// Speed up calls to hasOwnProperty
	var hasOwnProperty = Object.prototype.hasOwnProperty;

	/**
	 * 
	 * @param {type} obj
	 * @returns {Boolean}
	 */
	module.isEmpty = function (obj)
	{

		// null and undefined are "empty"
		if (obj === null || typeof obj === "undefined")
			return true;

		// Assume if it has a length property with a non-zero value
		// that that property is correct.
		if (obj.length > 0)
			return false;
		if (obj.length === 0)
			return true;

		// If it isn't an object at this point
		// it is empty, but it can't be anything *but* empty
		// Is it empty?  Depends on your application.
		if (typeof obj !== "object")
			return true;

		// Otherwise, does it have any properties of its own?
		// Note that this doesn't handle
		// toString and valueOf enumeration bugs in IE < 9
		for (var key in obj) {
			if (hasOwnProperty.call(obj, key))
				return false;
		}

		return true;
	};



	/**
	 * 
	 * @param {type} value
	 * @returns {Boolean}
	 */
	module.isInt = function (value)
	{
		return !isNaN(value) && (function (x) {
			return (x | 0) === x;
		})(parseFloat(value));
	};

	/**
	 * 
	 * @param {type} value
	 * @param {type} r
	 * @returns {unresolved}
	 */
	module.momentToReQL = function (value, r) {
		if (!value || !value._isAMomentObject) {
			throw new Error("Expecting a moment object");
		}

		return r.time(parseInt(value.format('YYYY')),
				parseInt(value.format('M')),
				parseInt(value.format('D')),
				parseInt(value.format('H')),
				parseInt(value.format('m')),
				parseInt(value.format('s')),
				value.format('Z'));

	};

	/**
	 * 
	 * @param {type} n
	 * @returns {Number}
	 */
	module.round = function (n)
	{
		return Math.round(n * 100) / 100;
	};
	
	module.promiseWhile = Promise.method(function (condition, action) {
		if (!condition())
			return;
		return action().then(module.promiseWhile.bind(null, condition, action));
	});


	return module;
};
