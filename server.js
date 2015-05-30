var express = require('express');
var app = express();

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
    res.sendFile(__dirname + '/src/templates/index.html');
});

var server = app.listen(3939);
