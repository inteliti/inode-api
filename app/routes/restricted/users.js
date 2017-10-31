var logger = require('winston');
var generatePassword = require('password-generator');
var md5 = require('md5');
var xss = require('xss');
var striptags = require('striptags');
var email = require('../../middlewares/email')();
var Promise = require("bluebird");
var util = require('util');

module.exports = function (router, app) {
	'use strict';

	var app_model = require('../../persistence_layer/app_model');
	var client_model = require('../../persistence_layer/client_model');

	var User = app_model.User;
	var Contact = app_model.Contact;

	// This will handle the url calls for /users/:user_id
	router.route('/:userId')
			.get(function (req, res, next) {
				// Return user

				var userId = req.params.userId;

				User.get(userId).getJoin({contact: true}).then(function (user) {
					
					//Dont send password to the user
					delete user.password;
					
					if (req.decoded.role === 'ServiceAdmin')
					{
						if(user.role==='ServiceAdmin')
						{
							res.json({success: true, message: 'Get User Success', document: user});
						}
						else
						{
							res.json({success: false, message: 'Get User Fail'});
						}
					}
					else
					{
						var clientId = req.decoded.clientId;
						if(user.clientId===clientId)
						{
							res.json({success: true, message: 'Get User Success', document: user});
						}
						else
						{
							res.json({success: false, message: 'Get User Fail'});
						}
					}
				})
				.catch(function (error) {
					// Handle error
					res.json({success: false, message: 'Get User Fail', error: error});
				});

			})
			.put(function (req, res, next) {
				// Update user
				var userId = req.params.userId;
				
				if (req.decoded.role === 'ServiceAdmin')
				{
					User.get(userId).getJoin({contact: true}).then(function (_user) {
						
						if(_user.role === 'ServiceAdmin')
						{
							
							var lastEmail = _user.contact.email;
							//update with new values req y user
							var user = _updateUser(req,_user);

							if(user.role==='ServiceAdmin'  || lastEmail.length === 0)
							{
								
								if(lastEmail!==user.contact.email)
								{
									Contact.get(lastEmail).then(function (contact) {
										contact.delete().then(function (result) {

											user.saveAll({contact: true}).then(function (result) {

												delete result.password;
												res.json({success: true, message: 'Update User Success', document: user});

											}).error(function (error) {
												// Handle error
												res.json({success: false, message: 'Update User Fail', error: error});
											});

										}).catch(function(error){
											res.json({success: false, message: 'Update User Fail', error: error});
										});
									});
								}
								else
								{
									user.saveAll({contact: true}).then(function (result) {

										delete result.password;
										res.json({success: true, message: 'Update User Success', document: user});

									}).error(function (error) {
										// Handle error
										res.json({success: false, message: 'Update User Fail', error: error});
									});
								}
								
								
							}
							else
							{
								res.json({success: false, message: 'Update User Fail'});
							}
							
							
						}
						else
						{
							res.json({success: false, message: 'Update User Fail'});
						}
						
					})
					.catch(function (error) {
						// Handle error
						res.json({success: false, message: 'Update User Fail', error: error});
					});
				}
				else
				{
					var clientId = req.decoded.clientId;
					
					User.filter({id:userId,clientId:clientId}).getJoin({contact: true}).then(function (users) {
						
						if(users.length>0)
						{
							var lastEmail = users[0].contact.email;
							var user = _updateUser(req,users[0]);
							if(user.role === 'ClientAdmin' || lastEmail.length === 0)
							{
								if(lastEmail!==user.contact.email)
								{
									Contact.get(lastEmail).then(function (contact) {
										contact.delete().then(function (result) {

											user.saveAll({contact: true}).then(function (result) {

												delete result.password;
												res.json({success: true, message: 'Update User Success', document: user});

											}).error(function (error) {
												// Handle error
												res.json({success: false, message: 'Update User Fail', error: error});
											});


										}).catch(function(error){});
									});
								}
								else
								{
									user.saveAll({contact: true}).then(function (result) {

										delete result.password;
										res.json({success: true, message: 'Update User Success', document: user});

									}).error(function (error) {
										// Handle error
										res.json({success: false, message: 'Update User Fail', error: error});
									});
								}
							}
							else
							{
								res.json({success: false, message: 'Update User Fail'});
							}
						}
						else
						{
							res.json({success: false, message: 'Update User Fail'});
						}
					})
					.catch(function (error) {
						// Handle error
						res.json({success: false, message: 'Update User Fail', error: error});
					});
				}

				
			})
			.delete(function (req, res, next) {
				// Delete record
				var userId = req.params.userId;
				var clientId = req.decoded.clientId;

				User.get(userId).getJoin({contact: true}).then(function (user) {
					
					if (req.decoded.role === 'ServiceAdmin' && user.role === 'ServiceAdmin')
					{
						user.delete().then(function (result) {
							var success = !user.isSaved();
							res.json({success: success, message: 'Delete User Success'});
						}).catch(function(error){res.json({success: false, message: 'Delete User Fail', error: error});});
					}
					//validar que la cuenta no se quede sin ClientAdmin 
					else if(req.decoded.role === 'ClientAdmin' && user.clientId===clientId)
					{
						_canDeleteUser(user).then(function(canDelete){
							return user.deleteAll();
						}).then(function (result) {
							var success = !user.isSaved();
							res.json({success: success, message: 'Delete User Success'});
						}).catch(function(error){
							res.json({success: false, message: 'Delete User Fail', error: error});
						});
					}
					else
					{
						res.json({success: false, message: 'Delete User Fail'});
					}
				})
				.catch(function (error) {
					// Handle error
					res.json({success: false, message: 'Delete User Fail', error: error});
				});
			});

	router.route('/')
			.get(function (req, res, next) {
				
				var optimized = typeof req.query.optimized !== 'undefined' ? (req.query.optimized.toLowerCase() === "true") : false;
				//var ClientAdmin = typeof req.query.ClientAdmin !== 'undefined' ? (req.query.ClientAdmin.toLowerCase() === "true") : false;
				var role = typeof req.query.role !== 'undefined' ? xss(striptags(req.query.role)) : null;
				var status = typeof req.query.status !== 'undefined' ? (req.query.status.toLowerCase() === "true") : null;
				
				if(optimized)
				{
					var fields = ['id','firstName','lastName'];
				}else
				{
					var fields = ['id','firstName','lastName','status','clientId','role'];
				}
				/**
				 * 
				 * @type type
				 */
				var request = {
					pageCount: typeof req.query.page_count === 'number' ? req.query.page_count : xss(striptags(req.query.page_count)),
					page: typeof req.query.page === 'number' ? req.query.page : xss(striptags(req.query.page)),
					sortBy: xss(striptags(req.query.sort_by)),
					sortOrder: typeof req.query.sort_order === 'number' ? req.query.sort_order : xss(striptags(req.query.sort_order)),
					search: xss(striptags(req.query.search)),
					optimized: typeof req.query.optimized !== 'undefined' ? (req.query.optimized.toLowerCase() === "true") : false,
					fields:fields,
					Model: User,
					modelJoin : { contact: true }
				};

				if (req.decoded.role === 'ServiceAdmin')
				{
					request.filter = function (doc) {
						var search = typeof req.query.search !== 'undefined' ? xss(striptags(req.query.search)) : '';
						if( status !== null && role !== null ){
							return	doc('role').eq("ServiceAdmin").and(
									doc('firstName').add(" ",doc('lastName')).match("(?i)"+search).or(
									doc('lastName').match("(?i)"+search)).or(
									doc('contact')('email').match("(?i)"+search))).and(
									doc('role').eq(role)).and(
									doc('status').eq(status));
						}else if( status !== null ){
							return	doc('role').eq("ServiceAdmin").and(
									doc('firstName').add(" ",doc('lastName')).match("(?i)"+search).or(
									doc('lastName').match("(?i)"+search)).or(
									doc('contact')('email').match("(?i)"+search))).and(
									doc('status').eq(status));
						}else if( role !== null ){
							return	doc('role').eq("ServiceAdmin").and(
									doc('firstName').add(" ",doc('lastName')).match("(?i)"+search).or(
									doc('lastName').match("(?i)"+search)).or(
									doc('contact')('email').match("(?i)"+search))).and(
									doc('role').eq(role));
						}else{
							return	doc('role').eq("ServiceAdmin").and(
									doc('firstName').add(" ",doc('lastName')).match("(?i)"+search).or(
									doc('lastName').match("(?i)"+search).or(
									doc('contact')('email').match("(?i)"+search))));
						}
					};

				} else
				{
					var clientId = req.decoded.clientId;
					//console.log(clientId);
					request.filter = function (doc) {
						var search = typeof req.query.search !== 'undefined' ? xss(striptags(req.query.search)) : '';
						
						if( status !== null && role !== null ){
							return	doc('clientId').eq(clientId).and(
									doc('firstName').add(" ",doc('lastName')).match("(?i)"+search).or(
									doc('lastName').match("(?i)"+search)).or(
									doc('contact')('email').match("(?i)"+search))).and(
									doc('role').eq(role)).and(
									doc('status').eq(status));
						}else if( status !== null ){
							return	doc('clientId').eq(clientId).and(
									doc('firstName').add(" ",doc('lastName')).match("(?i)"+search).or(
									doc('lastName').match("(?i)"+search)).or(
									doc('contact')('email').match("(?i)"+search))).and(
									doc('status').eq(status));
						}else if( role !== null ){
							return	doc('clientId').eq(clientId).and(
									doc('firstName').add(" ",doc('lastName')).match("(?i)"+search).or(
									doc('lastName').match("(?i)"+search)).or(
									doc('contact')('email').match("(?i)"+search))).and(
									doc('role').eq(role));
						}else{
							return	doc('clientId').eq(clientId).and(
									doc('firstName').add(" ",doc('lastName')).match("(?i)"+search).or(
									doc('lastName').match("(?i)"+search)).or(
									doc('contact')('email').match("(?i)"+search)));
						}
						
					};
				}

				app_model.getList(request)
						.then(function(responses) { 
							return _joinContact(responses,User); 
						})
						.then(function (result) {
					
							res.json({success: true, message: 'Users List Success', result: result});
				}).catch(function (err) {
					/* error :( */
					res.json({success: false, message: 'Users List Fail', error: err});
				});
				
			}).post(function (req, res, next) {

				var newPassword = generatePassword();
				
				var userObj = {
					firstName: xss(striptags(req.body.firstName)),
					lastName: xss(striptags(req.body.lastName)),
					password: md5(newPassword),
					role: xss(striptags(req.body.role)),
					status: typeof req.body.status === 'boolean' ? req.body.status : true
				};
				
				var contactObj = {
					email: xss(striptags(req.body.contact.email)),
					phone: xss(striptags(req.body.contact.phone))
				};
				
				if (req.decoded.role === 'ClientAdmin')
				{
					var clientId = req.decoded.clientId;
					userObj.clientId = clientId;
				}
				
				// Create new user
				var user = new User(userObj);
				var contact = new Contact(contactObj);
				
				user.contact = contact;
				
				user.saveAll({contact: true}).then(function (result) {
					// Michel, John and Jessie are saved
					result.password = newPassword;
					email.NewUser(result);
					delete result.password;
					res.json({success: true, message: 'New User Success', document: result});

				}).error(function (error) {
					// Handle error
					res.json({success: false, message: 'New User Fail',error: error});
				});
			});//end POST
			
		
		/**
		 * 
		 * @param {type} users
		 * @param {type} User
		 * @param {type} fields
		 * @returns {unresolved}
		 */
		function _joinContact(users,User)
		{
			return Promise.map(users.docs, function(user) {
							return User.get(user.id).getJoin({contact: true})
									.then(function(user) {
										delete user.password;
										return user;
									});
						})
						.then(function(_users){
							users.docs = _users;
							return users;
						})
						.catch(function(error){
							return error;
						});


		}
		
		function _updateUser(req,user)
		{
			if (typeof req.body.firstName !== 'undefined')
			{
				user.firstName = xss(striptags(req.body.firstName));
			}
			if (typeof req.body.lastName !== 'undefined')
			{
				user.lastName = xss(striptags(req.body.lastName));
			}
			if (typeof req.body.password !== 'undefined')
			{
				user.password = xss(striptags(req.body.password));
			}
			if (typeof req.body.contact.email !== 'undefined')
			{
				user.contact.email = xss(striptags(req.body.contact.email));
			}
			if (typeof req.body.contact.phone !== 'undefined')
			{
				user.contact.phone = xss(striptags(req.body.contact.phone));
			}
			if (typeof req.body.role !== 'undefined')
			{
				user.role = xss(striptags(req.body.role));
			}
			if (typeof req.body.status === 'boolean')
			{
				user.status = req.body.status;
			}
			
			
			//console.log(util.inspect(user, {showHidden: false, depth: 5}));
			return user;
		}
		
		
		
		function _canDeleteUser(user)
		{
			return new Promise(function (resolve, reject) {
				
				
				if(user.role==='ClientAdmin')
				{
					User.filter({role:'ClientAdmin'}).then(function (users) {
						
						if(users.length<=1)
						{
							var error = new Error();
							error.message = 'Client account can not be with less than 1 user.';
							reject(error);
						}
						else
						{
							resolve(true);
						}
						
					});
				}
				else
				{
					var error = new Error();
					error.message = 'Role not recognized.';
					reject(error);
				}
				

				
			});
		}
};
