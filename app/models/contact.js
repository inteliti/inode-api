var logger = require('winston');
var validator = require('validator');
var md5 = require('md5');

module.exports = function (thinky) {

	var Contact = {};

	//check if model is defined
	if (thinky.models["Contact"] === undefined)
	{
		
		var type = thinky.type;

		Contact = thinky.createModel("Contact", {
			email: type.string().required().validator(validator.isEmail),
			phone: type.string().required(),
			userId: type.string().required()
		}, {
			pk: "email"
		});
		
		
		//default index to sort
		Contact.getSortBy = 'email';
		
		
		
	} else
	{
		Contact = thinky.models["User"];
	}
	
	return Contact;
};

