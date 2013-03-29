// jelly
// learningy thingy.

var pkg = require('./package.json'),
    config = require('./config'),
    express = require('express'),
    mongoose = require('mongoose'),
    db = mongoose.connection,
    api = require('./api'),
    http = require('http'),
    fs = require('fs'),
    path = require('path');

// Allow namespacing (for API)
require('express-namespace');

// Database setup
mongoose.connect(config.mongo.url);
mongoose.set('debug', config.mongo.debug);
db.on('error', console.error.bind(console, 'Connection Error:'));
db.once('open', function () {
  console.log ("Database connection established.");
});

var app = express();

app.configure(function(){
  app.set('port', config.port || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.engine('html', function (path, options, fn) {
    if ('function' == typeof options) {
      fn = options, options = {};
    }
    fs.readFile(path, 'utf8', fn);
  });
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.configure('production', function(){
  app.use(function (req, res, next, err) {
    res.send('There was an error, sorry.');
  });
});

// Serve the API
api.init(app);

// Serve the templates
app.get('/template/:file', function (req, res) {
  res.render('template/' + req.params.file, {
    layout: false
  });
});

// Serve the front end
app.get('/*?', function (req, res) {
  res.render('index', {
    layout: false
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Server listening on port " + app.get('port'));
});
