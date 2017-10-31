var config = require('nconf');
var logger = require('winston');
var email = require('../../middlewares/email')();
var generatePassword = require('password-generator');
var xss = require('xss');
var striptags = require('striptags');
var md5 = require('md5');

module.exports = function (router, app) {
	'use strict';

	var app_model = require('../../persistence_layer/app_model');
	var Contact = app_model.Contact;

	// This will handle the url calls for /password-resetter/:user_id
	router.route('/')
			.post(function (req, res, next) {

				var user = {};
		
				if (typeof req.body.email !== 'undefined')
				{
					var userMail = xss(striptags(req.body.email));
					var newPassword = generatePassword();
					
					Contact.filter({email: userMail}).getJoin({user: true}).run().then(function (contacts) {
						
							if (contacts.length === 0)
							{
								res.json({success: false, message: 'User not found.'});
							} else
							{
								var user = contacts[0].user;
								
								user.password = md5(newPassword);
								
								user.save().then(function (result) {
													user.password = newPassword;
													
													user.contact = {
														email : userMail
													};
													console.log(user);
													email.RessetPassword(user);
							
													res.json({
														success: true,
														message: 'Password has been reset. Check your mail.'
													});

												}).error(function (error) {
													// Handle error
													res.json({success: false, message: 'Password Reset Fail', error: error});
												});
							}
							
							
						})
						.catch(function (error) {
							// Handle error
							res.json({success: false, message: 'Password Reset Fail', error: error});
						});
				}
			});
};
