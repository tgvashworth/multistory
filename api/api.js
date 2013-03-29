var capishe = require('capishe'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.Types.ObjectId,
    models = require('./models'),
    Log = models.Log;

var log = {};

log.a = function (event) {
  return function (req, res, next) {
    models.Log.a(event);
    next();
  };
};

var api = {
  prefix: '/api'
};


// ===================
// Routes
// ===================

// ===================
// Begin init function
api.init = function (app) {
  app.namespace(api.prefix, function () {
// ===================

// ===================
// Root
// ===================

app.get('/*?', capishe.noop({
  status: 'breezy'
}));

// ===================
// End init function
  });
};
// ===================

module.exports = api;