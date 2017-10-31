var generatePassword = require('password-generator');
var logger = require('winston');
var util = require('util');
var md5 = require('md5');
var moment = require('moment');
var xss = require('xss');
var striptags = require('striptags');
var utils = require('../../../lib/utils')();
var email = require('../../middlewares/email')();

/**
 * 
 * @param {type} router
 * @param {type} app
 * @param {type} app_model
 * @returns {undefined}
 */
module.exports = function (router, app) {
	'use strict';
	
	var app_model = require('../../persistence_layer/app_model');
	var client_model = require('../../persistence_layer/client_model');

	var Client = app_model.Client;
	var User = app_model.User;
	var Contact = app_model.Contact;

	// This will handle the url calls for /clients/:client_id
	router.route('/:clientId')
			.get(function (req, res, next) {
				// Return client

				var clientId = req.params.clientId;
				
				Client.get(clientId).then(function (client) {
							res.json({success: true, message: 'Get Client Success', document: client});
						})
						.catch(function (error) {
							// Handle error
							res.json({success: false, message: 'Get Client Fail', error: error});
						});
			
			})
			.put(function (req, res, next) {
				// Update client
		
				var clientId = req.params.clientId;
				var r = app_model.r;
				
				var client = {};
				
				if(typeof req.body.company !== 'undefined' )
				{
					client.company = xss(striptags(req.body.company));
				}
				if(typeof req.body.email !== 'undefined' )
				{
					client.email = xss(striptags(req.body.email));
				}
				if(typeof req.body.contactFirstName !== 'undefined' )
				{
					client.contactFirstName = xss(striptags(req.body.contactFirstName));
				}
				if(typeof req.body.contactLastName !== 'undefined' )
				{
					client.contactLastName = xss(striptags(req.body.contactLastName));
				}
				if(typeof req.body.phone !== 'undefined' )
				{
					client.phone = xss(striptags(req.body.phone));
				}
				if(typeof req.body.address !== 'undefined' )
				{
					client.address = xss(striptags(req.body.address));
				}
				if(typeof req.body.city !== 'undefined' )
				{
					client.city = xss(striptags(req.body.city));
				}
				if(typeof req.body.state !== 'undefined' )
				{
					client.state = xss(striptags(req.body.state));
				}
				if(typeof req.body.zip !== 'undefined' )
				{
					client.zip = xss(striptags(req.body.zip));
				}
				if(typeof req.body.suscription_start !== 'undefined' )
				{
					var suscription_start = utils.momentToReQL(moment(xss(striptags(req.body.suscription_start))),r);
					client.suscription_start = suscription_start;
				}
				if(typeof req.body.suscription_end !== 'undefined' )
				{
					var suscription_end =  utils.momentToReQL(moment(xss(striptags(req.body.suscription_end))),r);
					client.suscription_end = suscription_end;
				}
				if(typeof req.body.notes !== 'undefined' )
				{
					client.notes = xss(striptags(req.body.notes));
				}
				if(typeof req.body.status === 'boolean' )
				{
					client.status = req.body.status;
				}
				
				Client.get(clientId).update(client).then(function (client) {
							res.json({success: true, message: 'Update Client Success', document: client});
						})
						.catch(function (error) {
							// Handle error
							console.log(error);
							console.log(error.stack);
							res.json({success: false, message: 'Update Client Fail', error: error});
						});
			})
			.delete(function (req, res, next) {
				// Delete client

				var clientId = req.params.clientId;
				
				Client.get(clientId).then(function (client) {
							client.delete().then(function(result) {
									var success = !client.isSaved();
									res.json({success: success, message: 'Delete Client Success'});
								});
						})
						.catch(function (error) {
							// Handle error
							res.json({success: false, message: 'Delete Client Fail', error: error});
						});
				
			});

	router.route('/')
			.get(function (req, res, next) {
				// List clients
		
				var status = typeof req.query.status !== 'undefined' ? (req.query.status.toLowerCase() === "true") : null;
				var optimized = typeof req.query.optimized !== 'undefined' ? (req.query.optimized.toLowerCase() === "true") : false;
				if(optimized)
				{
					var fields = ['id','company','email','suscription_start','suscription_end','status'];
				}
				else
				{
					var fields = ['id','company','email','suscription_start','suscription_end','status'];
				}
		
				var request = {
					pageCount: typeof req.query.page_count === 'number' ? req.query.page_count : xss(striptags(req.query.page_count)),
					page: typeof req.query.page === 'number' ? req.query.page : xss(striptags(req.query.page)),
					sortBy: xss(striptags(req.query.sort_by)),
					sortOrder: typeof req.query.sort_order === 'number' ? req.query.sort_order : xss(striptags(req.query.sort_order)),
					search: xss(striptags(req.query.search)),
					fields:fields,
					Model: Client,
					filter: function (doc) {
						var search = typeof req.query.search !== 'undefined' ? xss(striptags(req.query.search)) : '';
						if( status !== null ){
							return	(doc('company').match("(?i)"+search).or(
									doc('email').match("(?i)"+search))).and(
									doc('status').eq(status));
						}else{
							return	(doc('company').match("(?i)"+search).or(
									doc('email').match("(?i)"+search)));
						}
							


					}
				};
				
				app_model.getList(request).then(function (result) {
					res.json({success: true, message: 'Clients List Success', result: result});
				}).catch(function (err) {
					/* error :( */
					res.json({success: false, message: 'Clients List Fail', error: err});
				});
			})
			.post(function (req, res, next) {
				// Create client
				
				var r = app_model.r;
				/**
				 * 
				 * @type Client
				 */
				var s1 =  utils.momentToReQL(moment(xss(striptags(req.body.suscription_start))),r);
				var s2 = utils.momentToReQL(moment(xss(striptags(req.body.suscription_end))),r);
				
				var client = new Client({
					company: xss(striptags(req.body.company)),
					email: xss(striptags(req.body.email)),
					contactFirstName: xss(striptags(req.body.contactFirstName)),
					contactLastName: xss(striptags(req.body.contactLastName)),
					phone: xss(striptags(req.body.phone)),
					address: xss(striptags(req.body.address)),
					city: xss(striptags(req.body.city)),
					state: xss(striptags(req.body.state)),
					zip: xss(striptags(req.body.zip)),
					suscription_start: s1,
					suscription_end: s2,
					notes: xss(striptags(req.body.notes)),
					status: true
				});
				
				var newPassword = generatePassword();
				
				var user = new User({
					firstName: xss(striptags(req.body.contactFirstName)),
					lastName: xss(striptags(req.body.contactLastName)),
					password: md5(newPassword),
					role: 'ClientAdmin',
					status: true
				});
				
				var contact = {
					email: xss(striptags(req.body.email)),
					phone: xss(striptags(req.body.phone))
				};

				var contact = new Contact(contact);
				user.contact = contact;
				user.client = client;
				
				user.saveAll({client: true,contact: true}).then(function (dispatcher) {
					
					var createdClient = dispatcher.client;
					
					email.NewUser(dispatcher);
					
					//must init database client
					
					client_model.initClientModel(createdClient.id);

					res.json({success: true,message: 'New Client Success',document: createdClient});
					
				}).catch(function (error) {
					// Handle error
					console.log(error);
					res.json({success: false, message: 'New Client Fail', error: JSON.stringify(error)});
				});
			});
			
};
