

var config = require('nconf');
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var logger = require('winston');

var app_model = require('../persistence_layer/app_model');

module.exports = {
	isAuthenticated: function (req, res, next) {
		'use strict';

		// check header or url parameters or post parameters for token
		var token = req.body.token || req.param('token') || req.headers['x-access-token'];

		// decode token
		if (token) {

			// verifies secret and checks exp
			jwt.verify(token, config.get('auth:secret'), function (err, decoded) {
				if (err){
					return res.json({success: false, message: 'Failed to authenticate token.'});
				} else {
					req.decoded = decoded;

					next();
				}
			});

		} else {
			// if there is no token
			// return an error
			return res.status(403).send({
				success: false,
				message: 'No token provided.'
			});
		}
	},
	isClientRequest: function (req, res, next) {
		'use strict';

		// check header or url parameters or post parameters for token
		var key = req.body.key || req.param('key') || req.headers['key'];
		
		// decode token
		if (key) {
			
			var Client = app_model.Client;
			// verifies secret and checks exp
			Client.get(key).then(function (client) {
						req.key = key;
						next();
					})
					.catch(function (error) {
						// Handle error
						return res.json({success: false, message: 'Failed to authenticate key'});
					});

		} else {
			// if there is no token
			// return an error
			return res.status(403).send({
				success: false,
				message: 'No key provided.'
			});
		}
	}
	
};

