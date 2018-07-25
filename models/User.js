var mongoose = require("mongoose");



var Schema = mongoose.Schema
var ObjectId = Schema.ObjectId

var UserSchema =  new Schema(
  {
    slackId: {
      type: 'string',
    },
    token: {
      type: 'object',
    },
    refresh_token: {
      type: 'string',
    }
    // email: {
    //   type: String,
    //
    // },


  });

  module.exports = mongoose.model('User', UserSchema);
