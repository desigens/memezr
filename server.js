var express = require('express');
var app = express();
var fs = require('fs');
var exphbs  = require('express3-handlebars');

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

var data = require('./data.json');

app.use('/css', express.static('public/css'));
app.use('/js', express.static('public/js'));

app.use('/images', express.static('public/images', {
    setHeaders: function(res, path, stat) {
        // res.set('Access-Control-Allow-Origin', '*');
        // res.set('Access-Control-Allow-Credentials', 'true');
        // res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    }
}));

app.get('/', function(req, res) {
	res.redirect('/karl');
    // res.sendFile(__dirname + '/src/templates/index.html');
});

app.get('/*', function(req, res) {
	var name = req.params[0];

	if (!data[name] || !fs.existsSync('public/' + data[name].image)) {
		res.sendStatus(404);
	} else {
		res.render('main', {
			data: JSON.stringify(data[name])
		});
	}
	
});

var server = app.listen(3939);
