'use strict';

var config = require('nconf');
var logger = require('winston');

module.exports = function (cb) {
	'use strict';
	
	//init app model (clients, users, stations)
	var app_model = require('../../app/persistence_layer/app_model');
	var client_model = require('../../app/persistence_layer/client_model');
	
	
	app_model.init().then(client_model.init).then(function (result) {
		cb();
	}).catch(function (err) {
		logger.info('Error DB init');
		logger.info(err.stack);
	});
};
