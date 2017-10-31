var changeCase = require('change-case');
var express = require('express');
var requireDir = require('require-dir');
var openRoutes = requireDir('./open');
var restrictedRoutes = requireDir('./restricted');
var auth = require('../middlewares/auth');
var logger = require('winston');
var acl = require('express-acl');
var cors = require('cors');


module.exports = function (app) {
	'use strict';
	
	acl.config({
		filename: __dirname + '/../../config/acl/nacl.json'
	});
	
	//alow cors
	app.use(cors({
		"origin": "*",
		"methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
		"preflightContinue": false
	}));
	
	// Initialize all routes
	Object.keys(openRoutes).forEach(function (routeName) {

		var router = express.Router();
		// You can add some middleware here 
		// router.use(someMiddleware);
		
		// Initialize the route to add its functionality to router
		require('./open/' + routeName)(router, app);
		
		// Add router to the speficied route name in the app
		app.use('/' + changeCase.paramCase(routeName), router);
	});

	
	// Initialize all routes
	Object.keys(restrictedRoutes).forEach(function (routeName) {
		var router = express.Router();
		// You can add some middleware here 
		// router.use(someMiddleware);

		app.use(auth.isAuthenticated);

		router.use(acl.authorize);

		// Initialize the route to add its functionality to router
		require('./restricted/' + routeName)(router, app);

		// Add router to the speficied route name in the app
		app.use('/' + changeCase.paramCase(routeName), router);
	});
};

