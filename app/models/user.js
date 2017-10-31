var logger = require('winston');
var validator = require('validator');
var md5 = require('md5');

module.exports = function (thinky) {

	var User = {};

	//check if model is defined
	if (thinky.models["User"] === undefined)
	{
		
		var type = thinky.type;

		User = thinky.createModel("User", {
			firstName: type.string().required(),
			lastName: type.string().required(),
			password: type.string().required(),
			role: type.string().required(),
			status: type.boolean().default(true),
			clientId: type.string(),
			name: type.virtual().default(function() {
					return this.firstName+" "+this.lastName;
				})
		});
		
		//default index to sort
		User.getSortBy = 'name';
		
	} else
	{
		User = thinky.models["User"];
	}
	
	return User;
};

