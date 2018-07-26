var mongoose = require("mongoose");

var Schema = mongoose.Schema
var ObjectId = Schema.ObjectId

var MeetingSchema =  new Schema(
  {
    user: {
      type: 'string',
    },
    subject: {
      type: 'string',
    },
    dateTime: {
      type: 'string',
      required: true,
    },
    invitees: {
      type: 'array',
    }
    // email: {
    //   type: String,
    //
    // },
  });

  module.exports = mongoose.model('Meeting', MeetingSchema);
