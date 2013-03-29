var mongoose = require('mongoose'),
    createdAt = require('./plugins/createdAt'),
    uuid = require('node-uuid'),
    crypto = require('crypto'),
    Schema = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId;

var userSchema = new Schema({
});

// Remove for production (or userSchema.set('autoIndex', false);)
userSchema.index({ });

userSchema.plugin(createdAt, { index: true });

module.exports = mongoose.model('User', userSchema);