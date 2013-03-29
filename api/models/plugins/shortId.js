// ==================================
// shortId
//
// Adds a shortId field to a schema and gives it a value when saved for the
// first time, and ensures there's an index.
// ==================================
var shortId = require('shortid');

module.exports = function (schema) {

  schema.add({
    shortId: { type: String, index: true }
  });

  schema.pre('save', function (next) {
    if (!this.shortId) {
      this.shortId = shortId.generate().slice(0, 4);
    }
    next();
  });
};