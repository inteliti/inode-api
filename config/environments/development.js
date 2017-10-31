var nconf = require('nconf');
nconf.set('url', 'localhost');

nconf.set('database', {
	host: 'localhost',
	port: 28015,
	db: 'rdb_multi_tenant'
});

nconf.set('auth', {
	secret: 'love'
});
