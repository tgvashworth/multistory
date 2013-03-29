var mongoose = require('mongoose'),
    db = mongoose.connection,
    models = require('../../api/models');

mongoose.connect('mongodb://localhost:27017/jelly-dev');
mongoose.set('debug', true);
db.on('error', console.error.bind(console, 'Connection Error:'));
db.once('open', function () {
  console.log ("Database connection established.");
});

var stack = new models.Stack({
  source: {
    title: 'phuu.net',
    content: '<h1>Hello!</h1>'
  }
});

stack.save(function () {
  console.log.apply(console, [].slice.call(arguments));
});