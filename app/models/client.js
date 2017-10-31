var validator = require('validator');
var logger = require('winston');

module.exports = function (thinky) {

	var Client = {};

	if (thinky.models["Client"] === undefined)
	{
		//logger.info('Creating new Client Model');
		var type = thinky.type;

		Client = thinky.createModel("Client", {
			id: type.string(),
			company: type.string().required(),
			email: type.string().required().validator(validator.isEmail),
			contactFirstName: type.string().required(),
			contactLastName: type.string().required(),
			phone: type.string(),
			address : type.string(),
			city : type.string(),
			state : type.string(),
			zip : type.string(),
			suscription_start: type.date().required(),
			suscription_end: type.date().required(),
			notes: type.string(),
			status: type.boolean().default(true),
			createdAt: type.date().default(thinky.r.now())
		});

		//default index to sort
		Client.getSortBy = 'company';
		

	} else
	{
		logger.info('Use last Client Model');
		Client = thinky.models["Client"];
	}
	
	return Client;
};

