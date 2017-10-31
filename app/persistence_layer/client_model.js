var Promise = require("bluebird");
var config = require('nconf');
var utils = require('../../lib/utils')();
var app_model = require('./app_model');
var logger = require('winston');

var host = config.get('database:host');
var port = config.get('database:port');
var globalDB = config.get('database:db');

var client_model = {};

client_model.init = function()
{
	return new Promise(function (resolve, reject) {
		
		host = config.get('database:host');
		port = config.get('database:port');
		globalDB = config.get('database:db');
		
		var Client = app_model.Client;
		
		Client.run().then(function (clients) {
			
			for(var i=0; i < clients.length; i++)
			{
				client_model.initClientModel(clients[i].id);
			}
			resolve();
		})
		.catch(function (err) {
			console.log(err);
			reject(err);
		});
	});
};

client_model.initClientModel = function(clientId)
{
	var db = client_model.getDBName(clientId);
	
	console.log(host);
	console.log(port);
	console.log(db);
	
	client_model[clientId] = {};
	client_model[clientId].db_client = require('thinky')({
		host: host || 'localhost',
		port: port || 28015,
		db: db || 'test'
	});
	
	var r = client_model[clientId].db_client.r;
	
	client_model[clientId].r = r;
	
	//Init client models
	
};

client_model.getDBName = function(clientId)
{
	return globalDB + '_client_'+clientId.replace(/-/g,'');
};

client_model.getList = function (request)
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


module.exports = client_model;
