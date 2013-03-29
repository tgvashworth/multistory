// ==================================
// createdAt
//
// Adds a createdAt field to a schema and gives it a value when saved for the
// first time.
// ==================================
module.exports = function (schema, options) {

  schema.add({ createdAt: Date });

  schema.pre('save', function (next) {
    if (!this.createdAt) {
      this.createdAt = new Date();
    }
    next();
  });

  if (options && options.index) {
    schema
      .path('createdAt')
      .index(options.index);
  }

};