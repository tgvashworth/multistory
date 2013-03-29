var mongoose = require('mongoose'),
    createdAt = require('./plugins/createdAt'),
    Schema = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId;

var moment = require('moment');

var logSchema = new Schema({
  event: { type: String, index: true }
}, {
  // The log schema is unsafe becuase we don't really care if it fails
  safe: false
});

logSchema.plugin(createdAt, { index: true });

// Log a single event
logSchema.statics.a = function (event) {
  event = event || 'unknown';
  this
    .create({
      event: event
    }, function () {});
};

// Retrieve all events since a certain time, specified by an object containing
// a year, month, date, hour, minute and second.
logSchema.statics.since = function (date, m) {

  var periods = ['year', 'month', 'day', 'hour', 'minute', 'second'],
      period;

  Object.keys(date).forEach(function (key) {
    date[key] = parseInt(date[key], 10);
  });

  // gtm is the lower bound on the log date
  var gtm = m || moment([
    date.year,
    (date.month - 1) || undefined,
    date.date,
    date.hour,
    date.minute,
    date.second
  ]);

  // ltm is the upper bound on the date (initially: now)
  ltm = moment();

  // If we have parameters passed we need to limit the scope of the dates
  if (Object.keys(date).length > 0) {
    period = periods[Object.keys(date).length - 1];
    ltm = moment(gtm.toDate()).endOf(period);
  }

  return this
    .find()
    .select('-_id -__v')
    .where('createdAt')
    .gte(gtm.toDate())
    .lte(ltm.toDate())
    .sort('-createdAt');
};

logSchema.statics.last = function (date) {

  var m = moment(),
      altered = [];

  // Roll back in time the required amount
  Object.keys(date).forEach(function (key) {
    var val = parseFloat(date[key], 10);
    if (val !== 0 && !val) return;
    if (!m[key]) return;
    // Ue the moment method to move back in time
    m = m[key](-val);
    altered.push(key);
  });

  return this
    .since({}, m);
};

// logSchema.statics.aggregatedQuery = function (data, cb) {

//   var m = moment(),
//       altered = [];

//   console.log(data);

//   // Roll back in time the required amount
//   Object.keys(data).forEach(function (key) {
//     var val = parseFloat(data[key], 10);
//     if (val !== 0 && !val) return;
//     if (m[key]) {
//       // Ue the moment method to move back in time according to the
//       // aggregation query, adding the $gte operator
//       m = m[key](-val);
//       altered.push(key);
//     }
//   });

//   // Turn it into a time query
//   var query = timeQuery(m);
//   altered.forEach(function (key) {
//     if (!query[key]) return;
//     query[key] = { $gte: query[key] };
//     // Remove all keys after this one, to make the sure we get all data
//     dateKeys.slice(dateKeys.indexOf(key) + 1).forEach(function (dateKey) {
//       delete query[dateKey];
//     });
//   });
//   console.log(query);

//   this
//     .find(query)
//     .exec(function (err, results) {
//       if (err) return cb(err);
//       var result = {
//         events: {}
//       };
//       results.forEach(function (log) {
//         log = log.toObject();
//         result.events = sumObject(log.events, result.events);
//       });
//       cb(err, result);
//     });
// };

module.exports = mongoose.model('Log', logSchema);