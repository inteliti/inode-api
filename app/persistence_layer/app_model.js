var Promise = require("bluebird");
var config = require('nconf');
var logger = require('winston');
var utils = require('../../lib/utils')();

/**
 * 
 * En este modulo se debe manejar el acceso al modelo de datos del cliente
 * 
 * 
 * @param {type} app
 * @param {type} db_app
 * @returns {nm$_db_client.module.exports.module}
 */
var app_model = {};

/**
 * 
 * 
 */
app_model.init = function ()
{
	return new Promise(function (resolve, reject) {
		
		
		var host = config.get('database:host');
		var port = config.get('database:port');
		var db = config.get('database:db');
		
		/**
		 * 
		 * 
		 */
		var db_app = require('thinky')({
			host: host || 'localhost',
			port: port || 28015,
			db: db || 'test'
		});

		/**
		 * 
		 * 
		 */
		var r = db_app.r;
		app_model.r = r;
		
		app_model.User = require('../models/user')(db_app);
		app_model.Client = require('../models/client')(db_app);
		app_model.Contact = require('../models/contact')(db_app);
		
		app_model.Client.hasMany(app_model.User, "users", "id", "clientId");
		app_model.User.belongsTo(app_model.Client, "client", "clientId", "id");
		
		app_model.User.hasOne(app_model.Contact, "contact", "id", "userId");
		app_model.Contact.belongsTo(app_model.User, "user", "userId", "id");
		
		resolve();
		
	});

};


//TODO lanzar error si no hay conexion con la BD



/**
 * 
 * 
 */

/**
 * 
 * @param {type} request
 * @returns {Promise}
 */
app_model.getList = function (request)
{
	return new Promise(function (resolve, reject) {
		
		var pageCount = _isValidIntParam(request.pageCount) ? parseInt(request.pageCount) : 20;
		var page = _isValidIntParam(request.page) ? parseInt(request.page) - 1 : 0;
		var skip = page * pageCount;
		var Model = request.Model;
		var needJoin = typeof request.modelJoin !== 'undefined' ? true : false;
		var modelJoin = request.modelJoin;
		var sortBy = typeof request.sortBy !== 'undefined' && request.sortBy !== '' ? request.sortBy : Model.getSortBy;
		var sortOrder = _isValidIntParam(request.sortOrder) ? parseInt(request.sortOrder) : -1;
		var fields = typeof request.fields !== 'undefined' ? request.fields : ['id'];
		var filter = typeof request.filter === 'function' ? request.filter : function (doc) {
			return true;
		};
		
		var total = 0;
		
		if(pageCount===-1 && needJoin)
		{
			Model.getJoin(modelJoin).filter(filter).count().execute().then(function(response){
				total = response;
				Model.getJoin(modelJoin).orderBy(sortOrder === 1 ? app_model.r.asc(sortBy) : app_model.r.desc(sortBy))
						.filter(filter)
						.pluck(fields)
						.execute()
						.then(function (responses) {

							var list = {
								total : total,
								docs : responses
							};
							resolve(list);
					
					
					
				})
				.catch(function (err) {
					console.log(err);
					reject(err);
				});
			})
			.catch(function (err) {
				console.log(err);
				reject(err);
			});
		}
		else if(pageCount===-1 && !needJoin)
		{
			Model.filter(filter).count().execute().then(function(response){
				total = response;
				Model.orderBy(sortOrder === 1 ? app_model.r.asc(sortBy) : app_model.r.desc(sortBy))
						.filter(filter)
						.pluck(fields)
						.execute()
						.then(function (responses) {

							var list = {
								total : total,
								docs : responses
							};
							resolve(list);
					
					
					
				})
				.catch(function (err) {
					console.log(err);
					reject(err);
				});
			})
			.catch(function (err) {
				console.log(err);
				reject(err);
			});
		}
		else if(pageCount!==-1 && needJoin)
		{
			Model.getJoin(modelJoin).filter(filter).count().execute().then(function(response){
				total = response;
				Model.getJoin(modelJoin).orderBy(sortOrder === 1 ? app_model.r.asc(sortBy) : app_model.r.desc(sortBy))
						.filter(filter)
						.skip(skip)
						.limit(pageCount)
						.pluck(fields)
						.execute()
						.then(function (responses) {
							var list = {
								page : page+1,
								pageCount : pageCount,
								total : total,
								docs : responses
							};
							resolve(list);
				})
				.catch(function (err) {
					console.log(err);
					reject(err);
				});
			})
			.catch(function (err) {
				console.log(err);
				reject(err);
			});
		}
		else if(pageCount!==-1 && !needJoin)
		{
			Model.filter(filter).count().execute().then(function(response){
				total = response;
				Model.orderBy(sortOrder === 1 ? app_model.r.asc(sortBy) : app_model.r.desc(sortBy))
						.filter(filter)
						.skip(skip)
						.limit(pageCount)
						.pluck(fields)
						.execute()
						.then(function (responses) {
							var list = {
								page : page+1,
								pageCount : pageCount,
								total : total,
								docs : responses
							};
							resolve(list);
				})
				.catch(function (err) {
					console.log(err);
					reject(err);
				});
			})
			.catch(function (err) {
				console.log(err);
				reject(err);
			});
		}
		else
		{
			//TODO CATCH ERROR MUST DEFINE PAGE COUNT OR NEED JOIN
		}
		

	});
};

/**
 * 
 * @param {type} param
 * @returns {Boolean}
 */
function _isValidIntParam(param)
{
	if (typeof param === 'undefined')
	{
		return false;
	}
	if (!utils.isInt(param))
	{
		return false;
	}
	return true;
}



/**
 * 
 */
module.exports = app_model;