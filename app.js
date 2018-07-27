const { RTMClient, WebClient } = require('@slack/client');
const {google} = require('googleapis');
const express = require('express');
const bodyParser = require('body-parser');
//initialize express
const app = express();
//dialogflow
const projectId = process.env.DIALOGFLOW_PROJECT_ID; //https://dialogflow.com/docs/agents#settings
const sessionId = 'quickstart-session-id';
const query = 'hello';
const languageCode = 'en-US';
const dialogflow = require('dialogflow');
const sessionClient = new dialogflow.SessionsClient();
const sessionPath = sessionClient.sessionPath(projectId, sessionId);
const axios = require('axios');
const mongoose = require('mongoose');
const moment = require('moment');
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

mongoose.connect(process.env.MONGODB_URI);
var Models = require('./models');
var User = Models.User;
var Doc = Models.Doc;
var Reminder = Models.Reminder;
var Meeting = Models.Meeting;

//oAuth2Client
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
)


///////////////////////////////
//API Get top 10 Calendar event
function makeCalendarAPICall(token) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  )

  oauth2Client.setCredentials(token)

  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      // store the refresh_token in my database!
      console.log('OBNOXIOUS LOG STUFF HERE', tokens.refresh_token);
    }
    console.log('OBNOXIOUS REFRESH TOKEN NOT FOUND', tokens.access_token);
  });

  const calendar = google.calendar({version: 'v3', auth: oauth2Client});
  const gmail = google.gmail({version: 'v1', auth: oauth2Client});

  calendar.events.list({
  calendarId: 'primary', // Go to setting on your calendar to get Id
  timeMin: (new Date()).toISOString(),
  maxResults: 10,
  singleEvents: true,
  orderBy: 'startTime',
}, (err, resp) => {
  if (err) return console.log('The API returned an error: ' + err);
  console.log(resp);
  const events = resp.data.items;
  if (events.length) {
    console.log('Upcoming 10 events:');
    events.map((event, i) => {
      const start = event.start.dateTime || event.start.date;
      console.log(`${start} - ${event.summary}`);
    });
    return resp;
  } else {
    console.log('No upcoming events found.');
  }
});
}
///////////////////////////////////////////////////////////////////
//Conflict Check
  function meetingCheckConflicts(token, newEventStart, callback) {
  var newEventEnd = moment(newEventStart).add(30, 'minutes');
  var conflict = false;
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  )

  oauth2Client.setCredentials(token)

  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      // store the refresh_token in my database!
      console.log('OBNOXIOUS LOG STUFF HERE', tokens.refresh_token);
    }
    console.log('OBNOXIOUS REFRESH TOKEN NOT FOUND', tokens.access_token);
  });

  const calendar = google.calendar({version: 'v3', auth: oauth2Client});
  const gmail = google.gmail({version: 'v1', auth: oauth2Client});

  calendar.events.list({
    calendarId: 'primary', // Go to setting on your calendar to get Id
    timeMin: (new Date()).toISOString(),
    maxResults: 30,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, resp) => {
    if (err) return console.log('The API returned an error: ' + err);
    console.log(resp);
    const events = resp.data.items;
    if (events.length) {
      console.log('Upcoming 10 events:');
      conflict = false;
      for (var i = 0; i < events.length; i ++) {
        const start = events[i].start.dateTime || events[i].start.date;
        const end = events[i].end.dateTime || events[i].end.date;
        if (
          moment(newEventStart).isSame(start) ||
          (moment(newEventStart).isBefore(start) && moment(newEventEnd).isAfter(end)) ||
          (moment(newEventEnd).isAfter(end) && moment(newEventStart).isBefore(start)) ||
          moment(newEventEnd).isSame(end)
        ) {
          conflict = true;
          //////////////////////////////////
          var notFound = true;
          var counter = 0;
          var testStart = newEventStart;
          var testEnd = newEventEnd;
          var nextOpen = null;
          while (notFound && counter < 20) {
            if (
              moment(testStart).isSame(start) ||
              (moment(testStart).isBefore(start) && moment(testEnd).isAfter(end)) ||
              (moment(testEnd).isAfter(end) && moment(testStart).isBefore(start)) ||
              moment(testEnd).isSame(end)
            ) {
              counter++;
              testStart = moment(testStart).add(30, 'minutes');
              testEnd = moment(testEnd).add(30, 'minutes');

            } else {
              nextOpen = moment(testStart).format();
              notFound = false;
            }
          }
          ///////////////////////////////////////
          notFound = true;
          counter = 0;
          testStart = newEventStart;
          testEnd = newEventEnd;
          var prevOpen = null;
          while (notFound && counter < 20) {
            if (
              moment(testStart).isSame(start) ||
              (moment(testStart).isBefore(start) && moment(testEnd).isAfter(end)) ||
              (moment(testEnd).isAfter(end) && moment(testStart).isBefore(start)) ||
              moment(testEnd).isSame(end)
            ) {
              counter++;
              testStart = moment(testStart).subtract(30, 'minutes');
              testEnd = moment(testEnd).subtract(30, 'minutes');

            } else {
              prevOpen = moment(testStart).format();
              notFound = false;
            }
          }
          ///////////////////////////////////////
        }
      }
      console.log('RESULTS OF SEARCH FOR CONFLICT: ', conflict);
    } else {
      console.log('No upcoming events found.');
    }

    callback({conflict: conflict, nextOpen: nextOpen, prevOpen: prevOpen});
  });
}
///////////////////////////////////////////////////////////////////
//Post Event
function postReminderCalendarAPI(token, date, subject) {
  date = date.substring(0, 10);
  console.log('passed in date', date);
  var startDate = moment(date).format("YYYY-MM-DD");
  var endDate = moment(startDate).add(1, 'd').format("YYYY-MM-DD");
  var obj = {
    'summary': subject,
    'end': {
      'date': endDate,
    },
    'start': {
      'date': startDate,
    }
  }
  var calendarObj = {
    'calendarId': 'primary',
    'resource': obj,
  }
  console.log('s', startDate, 'e', endDate);




  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  )

  oauth2Client.setCredentials(token)

  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      // store the refresh_token in my database!
      console.log('OBNOXIOUS LOG STUFF HERE', tokens.refresh_token);
    }
    console.log('OBNOXIOUS REFRESH TOKEN NOT FOUND', tokens.access_token);
  });

  const calendar = google.calendar({version: 'v3', auth: oauth2Client});
  const gmail = google.gmail({version: 'v1', auth: oauth2Client});
  calendar.events.insert(calendarObj, (err, resp) => {
  if (err) return console.log('The API returned an error: ' + err + startDate + endDate);
  console.log(resp);

});
}
///////////////////////////////////////////////////////////////POST Meeting
async function postMeetingCalendarAPI(token, subject, dateTime, invitees) {
  try {
    console.log('logging postMeetingCalenderAPI dateTime', dateTime);
  var startDateTime = dateTime;
  var endDateTime = moment(dateTime).add(30, 'minutes');
  var attendees = [];

  for (var i = 0; i < invitees.length; i ++) {
    var user = await User.findOne({altNames: { $all: [ invitees[i].stringValue ] }})

      if(!user) {
        console.log('no user found');
      } else {
        attendees.push({displayName: user.name, email: user.email})
      }

  }
  var obj = {
    'summary': subject,
    'end': {
      'dateTime': endDateTime,
    },
    'start': {
      'dateTime': startDateTime,
    },
    'attendees': attendees,
  }
  var calendarObj = {
    'calendarId': 'primary',
    'resource': obj,
  }
  console.log('s', startDateTime, 'e', endDateTime);
  // var subDate = date.substring(0, 10);
  // console.log(new Date(subDate));
  // var endDate = new Date(subDate);
  // endDate.setDate(endDate.getDate() + 1);
  // endDate = new Date(endDate);
  // endDate = endDate.toString().substring(0, 10);



  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  )

  oauth2Client.setCredentials(token)

  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      // store the refresh_token in my database!
      console.log('OBNOXIOUS LOG STUFF HERE', tokens.refresh_token);
    }
    console.log('OBNOXIOUS REFRESH TOKEN NOT FOUND', tokens.access_token);
  });

  const calendar = google.calendar({version: 'v3', auth: oauth2Client});
  calendar.events.insert(calendarObj, (err, resp) => {
  if (err) return console.log('The API returned an error: ' + err);
  //console.log(resp);

});
}
catch (err){console.log(err)}
}
///////////////////////////////////////////////////////////////////////////

//Slack
const token = process.env.SLACK_TOKEN;

// The client is initialized and then started to get an active connection to the platform
const rtm = new RTMClient(token);
const web = new WebClient(token)



rtm.on('message', event=>{
  console.log('event', event);
  const conversationId = event.channel;

  //   Skip messages that are from a bot or my own user ID
  if ( (event.subtype && event.subtype === 'bot_event') ||
  (!event.subtype && event.user === rtm.activeUserId) ) {
    return;
  }
  // handlemessage

  //
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: event.text,
        languageCode: languageCode,
      },
    },
  };
  //evaluate request
  sessionClient
  .detectIntent(request)
  .then(response => {
    var retTestMessage = 'Default';

    // console.log(response[0].queryResult.fulfillmentText);
    // console.log(response[0]);

    console.log('QUERY RESULT', response[0]);
    if (response[0].queryResult.intent.displayName === "createReminder" && response[0].queryResult.allRequiredParamsPresent) {
      var paramFields = response[0].queryResult.parameters.fields;
      //console.log('paramFields', paramFields);

      var newReminder = new Reminder({
        subject: paramFields.Subject.stringValue,
        date: paramFields.date.stringValue,
        user: event.user,
      })
      newReminder.save()
      .then(response => {
        console.log('newReminder saved', response);
      })
      .catch(err => console.log(err))
    }
    if (response[0].queryResult.intent.displayName === "createReminderYes") {
      var intentParams = response[0].queryResult.parameters.fields;



      User.findOne({slackId: event.user})
      .then(user => {
        console.log(user);
        if (!user) {

          var linkUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            state: event.user,
            scope: [
              'https://www.googleapis.com/auth/calendar',
              'https://www.googleapis.com/auth/gmail.readonly',
            ]
          })
          rtm.sendMessage(linkUrl, conversationId);
        } else {
          var eventDate = '';
          var eventSubject = '';
          Reminder.findOneAndDelete({user: event.user})
          .then(reminder => {
            eventDate = reminder.date;
            eventSubject = reminder.subject;

            postReminderCalendarAPI(user.token, eventDate, eventSubject);
          })
          .catch(err => console.log(err))

        }
      })
      .catch(err => console.log(err))

    }
    ////////////////And now meetings
    if (response[0].queryResult.intent.displayName === "createMeeting" && response[0].queryResult.allRequiredParamsPresent) {
      var paramFields = response[0].queryResult.parameters.fields;
      //console.log('PARAMFIELDSSSSS', paramFields);
      var dateTime = paramFields.date.stringValue.substring(0, 10) + paramFields.time.stringValue.substring(10, 25);
      //console.log('DATETIMEEEEEE', dateTime);
      var newMeeting = new Meeting({
        subject: paramFields.Subject.stringValue,
        invitees: paramFields.Invitees.listValue.values,
        dateTime: dateTime,
        user: event.user,

      })
      newMeeting.save()
      .then(meeting => {
        console.log('newMeeting saved', meeting);
      })
      .catch(err => console.log(err))
    }

    if(response[0].queryResult.intent.displayName === "createMeetingYes") {
      User.findOne({slackId: event.user})
      .then(user => {
        console.log(user);
        if (!user) {

          var linkUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            state: event.user,
            scope: [
              'https://www.googleapis.com/auth/calendar',
              'https://www.googleapis.com/auth/gmail.readonly'
            ]
          })
          rtm.sendMessage(linkUrl, conversationId);
        } else {
          var eventDate = '';
          var eventSubject = '';



          Meeting.findOne({user: event.user})
          .then(meeting => {
            console.log('meeting in findOneAndDelete', meeting)
            var subject = meeting.subject;
            var dateTime = meeting.dateTime;
            var invitees = meeting.invitees;
            var conflictCount = 0;


            meetingCheckConflicts(user.token, dateTime, async conflict => {
              try {
              if (!conflict.conflict) {
                //checks for invitee conflicts
                for (var i = 0; i < invitees.length; i ++) {
                  var invitedUser = await User.findOne({altNames: { $all: [ invitees[i].stringValue ] }})
                  console.log('invitedUser', invitedUser);
                  if (invitedUser) {
                  meetingCheckConflicts(invitedUser.token, dateTime, conflict => {
                    if (conflict) {
                      conflictCount++;
                    }
                  })
                }
                }
                //
                if (conflictCount === 0) {
                  // REMOVE HERE
                  Meeting.findOneAndDelete({user: event.user})
                  .then(resp => console.log(resp))
                  .catch(err => console.log(err))
                  postMeetingCalendarAPI(user.token, subject, dateTime, invitees);
                } else {
                  console.log('invitee has a conflict BRUH');
                  rtm.sendMessage('One of your comrades is already occupied with party business at ' + dateTime + 'try' + conflict.nextOpen, conversationId);
                }
              } else {
                console.log('conflict found, meeting not posted');
                //rtm.sendMessage('You are already busy on party business at ' + dateTime + '  try  ' + conflict.nextOpen + '  or  ' + conflict.prevOpen, conversationId);
                web.chat.postMessage({
                  'type': "interactive_message",
                    'channel': conversationId,
                    'as_user': true,
                    'text': 'You are busy this time, try another time',
                    'attachments': [
                      {
                        'text': 'Available times',
                        'fallback': 'You did not accept :(',
                        'callback_id': 'banana',
                        'color': '#3AA3E3',
                        'attachment_type': 'button',
                        'actions': [
                          {
                            'name': 'option1',
                            'text': conflict.nextOpen,
                            'type': 'button',
                            'value': JSON.stringify({newOpenTime: conflict.nextOpen}),
                          },
                          {
                            'name': 'option2',
                            'text': conflict.prevOpen,
                            'type': 'button',
                            'value': JSON.stringify({newOpenTime: conflict.prevOpen}),
                          }
                        ]
                      }
                    ]
                })
              };
            }
            catch (err){console.log(err)};
            });
          })
          .catch(err => console.log(err))

        }
      })
      .catch(err => console.log(err))
    }
  ///////////////////////////////
    //var intentParams = response[0].queryResult.parameters.fields;
    //retTestMessage = '  Task:    ' + response[0].queryResult.parameters.fields.Task.stringValue + '  Subject:   ' + response[0].queryResult.parameters.fields.Subject.stringValue + '  Date:    ' + response[0].queryResult.parameters.fields.Date.stringValue;

    rtm.sendMessage(response[0].queryResult.fulfillmentText, conversationId);
  //}

})
.catch(err => console.log(err))
})

rtm.start();
/// Google OAuth2 callback_id
app.get(process.env.REDIRECT_URL.replace(/https?:\/\/.+\//, '/'), async (req, res) => {
  oauth2Client.getToken(req.query.code, async function (err, token) {
    if (err) return console.error(err.message)
      oauth2Client.setCredentials(token)
      console.log('XXXXXXXXXXXXXXXXXXXXXX');
      const gmail = google.gmail({version: 'v1', auth: oauth2Client});
      let profileInfo = await new Promise((resolve, reject) => {
        gmail.users.getProfile({
        userId: 'me',
      }, (err, res) => {
        if (err) reject(err)
        console.log('result of profile', res);
        resolve(res.data);
      })
    })
    //console.log('token', token, 'req.query:', req.query) // req.query.state <- meta-data

    var responseReminder = await Reminder.findOneAndDelete({user: req.query.state})
    // console.log(responseReminder);
    if (responseReminder) {
    var reminderSubject = responseReminder.subject;
    var reminderDate = responseReminder.dateTime;
    var userName = await web.users.info({
       'user': req.query.state,
      });
    //console.log('USERNAME LOGGGGGGED', userName);
    console.log("token set", token);
    var newUser = new User({
      slackId: req.query.state,
      token: token,
      name: userName.user.real_name,
      email: profileInfo.emailAddress,
    })
    newUser.save()
    .then(response => {
      postReminderCalendarAPI(response.token, reminderDate, reminderSubject);
    })
    .catch(err => console.log(err))
  } else {
    var responseMeeting = await Meeting.findOneAndDelete({user: req.query.state})
    var meetingSubject = responseMeeting.subject;
    var meetingDateTime = responseMeeting.dateTime;
    var meetingInvitees = responseMeeting.invitees;
    var conflictCount = 0;
    var userName = await web.users.info({
       'user': req.query.state,
      });
    var newUser = new User({
      slackId: req.query.state,
      token: token,
      name: userName.user.real_name,
      altNames: userName.user.real_name.split(' '),
      email: profileInfo.emailAddress,
    })
    newUser.save()
    .then(response => {

      meetingCheckConflicts(response.token, meetingDateTime, async conflict => {
        try {
        if (!conflict.conflict) {
          //checks for invitee conflicts
          for (var i = 0; i < meetingInvitees.length; i ++) {
            var invitedUser = await User.findOne({altNames: { $all: [ meetingInvitees[i].stringValue ] }})
            console.log('invitedUser', invitedUser);
            if (invitedUser) {
            meetingCheckConflicts(invitedUser.token, meetingDateTime, conflict => {
              if (conflict) {
                conflictCount++;
              }
            })
          }
          }
          //
          if (conflictCount === 0) {
            // REMOVE HERE
            // Meeting.findOneAndDelete({user: event.user})
            // .then(resp => console.log(resp))
            // .catch(err => console.log(err))
            postMeetingCalendarAPI(response.token, meetingSubject, meetingDateTime, meetingInvitees);
          } else {
            console.log('invitee has a conflict BRUH');
            rtm.sendMessage('One of your comrades is already occupied with party business at ' + dateTime + 'try' + conflict.nextOpen, conversationId);
          }
        } else {
          console.log('conflict found, meeting not posted');
          //rtm.sendMessage('You are already busy on party business at ' + dateTime + '  try  ' + conflict.nextOpen + '  or  ' + conflict.prevOpen, conversationId);
          web.chat.postMessage({
            'type': "interactive_message",
              'channel': conversationId,
              'as_user': true,
              'text': 'You are busy this time, try another time',
              'attachments': [
                {
                  'text': 'Available times',
                  'fallback': 'You did not accept :(',
                  'callback_id': 'banana',
                  'color': '#3AA3E3',
                  'attachment_type': 'button',
                  'actions': [
                    {
                      'name': 'option1',
                      'text': conflict.nextOpen,
                      'type': 'button',
                      'value': JSON.stringify({newOpenTime: conflict.nextOpen}),
                    },
                    {
                      'name': 'option2',
                      'text': conflict.prevOpen,
                      'type': 'button',
                      'value': JSON.stringify({newOpenTime: conflict.prevOpen}),
                    }
                  ]
                }
              ]
          })
        };
      }
      catch (err){console.log(err)};
      });




    })
    .catch(err => console.log(err))
  }

    res.send('ok')
  })
})
/////////////////////////////
//Routes
app.post('/slack', (req,res)=> {
  console.log('in slack route', JSON.parse(JSON.parse(req.body.payload).actions[0].value).newOpenTime);
  console.log('userid', JSON.parse(req.body.payload).user.id);
  var newStartDate = JSON.parse(JSON.parse(req.body.payload).actions[0].value).newOpenTime;
  User.findOne({slackId: JSON.parse(req.body.payload).user.id})
  .then(user => {
    console.log(user);
    if (!user) {

      var linkUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        state: user.slackId,
        scope: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/gmail.readonly'
        ]
      })
      rtm.sendMessage(linkUrl, conversationId);
    } else {
      var eventDate = '';
      var eventSubject = '';



      Meeting.findOneAndDelete({user: JSON.parse(req.body.payload).user.id})
      .then(meeting => {
        console.log('meeting in findOneAndDelete', meeting)
        var subject = meeting.subject;
        var dateTime = meeting.dateTime;
        var invitees = meeting.invitees;
      postMeetingCalendarAPI(user.token, subject, newStartDate, invitees);
    })
      .catch(err => console.log(err))
    }
  })
  .catch(err => console.log(err))
})
/////////////////////////////
//app.get('/', (req,res)=>res.send('Hello World'))
app.post('/hey', (req,res)=>res.send('Hey'))


app.listen(1337, () => console.log('Example app listening on port 1337!'))
