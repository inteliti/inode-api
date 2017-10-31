var config = require('nconf');
var logger = require('winston');
var moment = require('moment');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var ejs = require('ejs');
var fs = require('fs');
var from_email = 'Fuel4U <velox.dyn@gmail.com>';
var to_email = 'ediaz@inteliti.com'; //email for debug
var admin_mail = 'ediaz@inteliti.com';


process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
/**
 * 
 *
 * 
 * 
 * @param {type} app
 * @param {type} db_app
 * @returns {nm$_db_client.module.exports.module}
 * @param {String} from_number - Sender's phone number.
 * @param {String} to_number - Recipient's phone number.
 * @param {String} msg - SMS body.
 * @param {JSON} parameter - JSON  contains variables that indicate the route created and the number of use.
 * @param {JSON} parameter.number - Telephone number of user.
 * @param {JSON} parameter.date - Start date route.
 * @param {JSON} parameter.departure - Route origin.
 * @param {JSON} parameter.destination -  Route destination.
 * @param {JSON} parameter.station -  Contains data of the gas stations in the route.
 * @param {JSON} parameter.station.StationName -  Name of the gas station.
 * @param {JSON} parameter.station.StationExit -  Exit where the gas station is located.
 * @param {JSON} parameter.station.FillGasAmount -  Amount of gallons per load.
 * @param {JSON} parameter.station.CostTotal -  Total cost of refueling. 
 * @param {JSON} parameter.TotalCost -  Total cost of the route.
 * @param {JSON} parameter.name -  Name of user.
 * @param {JSON} parameter.email -  Email of user.
 * @param {JSON} parameter.password -  Password of user.
 */
module.exports = function () {
	var module = {};
	
	
	
	module.NewUser = function (parameter) {

		var debug = config.get('AmazonSES:debug');

		var str = fs.readFileSync(__dirname + '/ejs/email_NewUser.ejs', 'utf8');
		console.log('debug');
		console.log(debug);
		console.log(parameter);
		if (debug === 0) {
			to_email = parameter.contact.email;

		}

		var messageHtml = ejs.render(str, {parameter:parameter});

		var transport = nodemailer.createTransport(smtpTransport({
			host: 'email-smtp.us-west-2.amazonaws.com',
			port: 465,
			secure: true,
			auth: {
				user: config.get('AmazonSES:user'),
				pass: config.get('AmazonSES:pass')
			}
		}));

		console.log(to_email);

		var mailOptions = {
			from: from_email, // sender address
			to: to_email, // list of receivers
			subject: 'Fuel4U - New User ', // Subject line
			html: messageHtml // html body
		};

		transport.sendMail(mailOptions, function (error, info) {
			if (error) {
				logger.info(error);
			} else {
				logger.info('Message sent: ' + info.response);
			}
		});


		return {parameter: 'send'};
	};



	module.RessetPassword = function (parameter) {
		var debug = config.get('AmazonSES:debug');

		var str = fs.readFileSync(__dirname + '/ejs/email_ResetPassword.ejs', 'utf8');

		if (debug === 0) {
			to_email = parameter.contact.email;

		}

		var messageHtml = ejs.render(str, {parameter:parameter});

		var transport = nodemailer.createTransport(smtpTransport({
			host: 'email-smtp.us-west-2.amazonaws.com',
			port: 465,
			secure: true,
			auth: {
				user: config.get('AmazonSES:user'),
				pass: config.get('AmazonSES:pass')
			}
		}));

		var mailOptions = {
			from: from_email, // sender address
			to: to_email, // list of receivers
			subject: 'Fuel4U - Reset Password ', // Subject line
			html: messageHtml // html body
		};

		transport.sendMail(mailOptions, function (error, info) {
			if (error) {
				logger.info(error);
			} else {
				logger.info('Message sent: ' + info.response);
			}
		});

		return {parameter: 'send'};

	};


	module.NewRoute = function (parameter) {
		var debug = config.get('AmazonSES:debug');

		var str = fs.readFileSync(__dirname + '/ejs/email_NewRoute.ejs', 'utf8');

		if (debug === 0) {
			to_email = parameter.email;

		}
		
		parameter.date = moment.parseZone(parameter.date,'dddd, MMMM Do YYYY, hh:mm a').format("dddd, MMMM Do YYYY");
		
		var messageHtml = ejs.render(str, {parameter:parameter});

		var transport = nodemailer.createTransport(smtpTransport({
			host: 'email-smtp.us-west-2.amazonaws.com',
			port: 465,
			secure: true,
			auth: {
				user: config.get('AmazonSES:user'),
				pass: config.get('AmazonSES:pass')
			}
		}));

		var mailOptions = {
			from: from_email, // sender address
			to: to_email + ', ' + admin_mail, // list of receivers
			subject: 'Fuel4U - New Route Notification ', // Subject line
			html: messageHtml // html body
		};

		transport.sendMail(mailOptions, function (error, info) {
			if (error) {
				logger.info(error);
			} else {
				logger.info('Message sent: ' + info.response);
			}
		});

		return {parameter: 'send'};

	};

	module.TodayRoute = function (parameter) {
		var debug = config.get('AmazonSES:debug');
		var str = fs.readFileSync(__dirname + '/ejs/email_TodayRoute.ejs', 'utf8');

		if (debug === 0) {
			to_email = parameter.email;

		}

		var messageHtml = ejs.render(str, {parameter:parameter});

		var transport = nodemailer.createTransport(smtpTransport({
			host: 'email-smtp.us-west-2.amazonaws.com',
			port: 465,
			secure: true,
			auth: {
				user: config.get('AmazonSES:user'),
				pass: config.get('AmazonSES:pass')
			}
		}));

		var mailOptions = {
			from: from_email, // sender address
			to: to_email, // list of receivers
			subject: 'Fuel4U - New Route Today ', // Subject line
			html: messageHtml // html body
		};

		transport.sendMail(mailOptions, function (error, info) {
			if (error) {
				logger.info(error);
			} else {
				logger.info('Message sent: ' + info.response);
			}
		});

		return {parameter: 'send'};

	};
	
	return module;
};