var config = require('nconf');
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var logger = require('winston');

module.exports = function (router, app) {
	'use strict';

	var app_model = require('../../persistence_layer/app_model');
	
	var Contact = app_model.Contact;

	// This will handle the url calls for /users/:user_id
	router.route('/')
			.post(function (req, res, next) {
				
				Contact.filter({email: req.body.email}).getJoin({user: true}).run().then(function (contacts) {
					
					if (contacts.length === 0)
					{
						res.json({success: false, message: 'Authentication failed. User not found.'});
					} else
					{
						var contact = contacts[0];

						// check if password matches
						if (contact.user.password !== req.body.password) {
							res.json({success: false, message: 'Authentication failed. Wrong password.'});
						} else {
							delete contact.user.password;
							var _user = contact.user;
							delete contact.user;
							_user.contact = contact;
							
							// if user is found and password is right
							// create a token
							var token = jwt.sign(_user, config.get('auth:secret'), {
								expiresIn: 86400 // expires in 24 hours
							});

							res.json({
								success: true,
								message: 'Enjoy your token!',
								token: token,
								user: _user
							});
						}
					}


				}).catch(function (error) {
					logger.info(error);
					res.json({success: false, message: 'Authentication failed. Try again later.'});
				});



			});
};
