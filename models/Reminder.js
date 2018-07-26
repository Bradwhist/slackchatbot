var mongoose = require("mongoose");

var Schema = mongoose.Schema
var ObjectId = Schema.ObjectId

var ReminderSchema =  new Schema(
  {
    user: {
      type: 'string',
    },
    subject: {
      type: 'string',
    },
    date: {
      type: 'string',
    },
    // email: {
    //   type: String,
    //
    // },
  });

  module.exports = mongoose.model('Reminder', ReminderSchema);
