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

mongoose.connect(process.env.MONGODB_URI);
var Models = require('./models');
var User = Models.User;
var Doc = Models.Doc;

//oAuth2Client
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
)

// const {tokens} = await oauth2Client.getToken(code)
// oauth2Client.setCredentials(tokens);


// console.log('open URI:', oauth2Client.generateAuthUrl({
//   access_type: 'SLACK-ID',
//   state: 'slack id',
//   scope: [
//     'https://www.googleapis.com/auth/calendar',
//   ]
// }))

//API Create Calendar event
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
      console.log(tokens.refresh_token);
    }
    console.log(tokens.access_token);
  });

  const calendar = google.calendar({version: 'v3', auth: oauth2Client});
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
  } else {
    console.log('No upcoming events found.');
  }
});
}

// makeCalendarAPICall({
//   access_token: '',
//   token_type: 'Bearer',
//   refresh_token: '',
//   expiry_date: 1530585071407
// })
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
      ]
    })
    rtm.sendMessage(linkUrl, conversationId);
  } else {
    makeCalendarAPICall(user.token);
  }
})
.catch(err => console.log(err))
    //  console.log(intentParams);
      //rtm.sendMessage('Reminder made', conversationId)
      ///////////////////////////
      // calendar.events.insert({
      //   calendarId: 'primary', // Go to setting on your calendar to get Id
      //   'resource': {
      //     'summary': 'Google I/O 2015',
      //     'location': '800 Howard St., San Francisco, CA 94103',
      //     'description': 'A chance to hear more about Google\'s developer products.',
      //     'start': {
      //       'dateTime': '2018-07-04T02:00:35.462Z',
      //       'timeZone': 'America/Los_Angeles'
      //     },
      //     'end': {
      //       'dateTime': '2018-07-04T02:10:35.462Z',
      //       'timeZone': 'America/Los_Angeles'
      //     },
      //     'attendees': [
      //       // {'email': 'lpage@example.com'},
      //       // {'email': 'sbrin@example.com'}
      //     ]
      //   }
      // }, (err, {data}) => {
      //   if (err) return console.log('The API returned an error: ' + err);
      //   console.log(data)
      // })
      ///////////////////////////
  }
    //var intentParams = response[0].queryResult.parameters.fields;
    //retTestMessage = '  Task:    ' + response[0].queryResult.parameters.fields.Task.stringValue + '  Subject:   ' + response[0].queryResult.parameters.fields.Subject.stringValue + '  Date:    ' + response[0].queryResult.parameters.fields.Date.stringValue;

    rtm.sendMessage(response[0].queryResult.fulfillmentText, conversationId);
  //}

})
.catch(err => console.log(err))
})

rtm.start();
/// Google OAuth2 callback_id
app.get(process.env.REDIRECT_URL.replace(/https?:\/\/.+\//, '/'), (req, res) => {
  oauth2Client.getToken(req.query.code, function (err, token) {
    if (err) return console.error(err.message)
      oauth2Client.setCredentials(token)
      console.log('XXXXXXXXXXXXXXXXXXXXXX');
    //console.log('token', token, 'req.query:', req.query) // req.query.state <- meta-data
    var newUser = new Models.User({
      slackId: req.query.state,
      token: token,
    })
    newUser.save()
    .then(response => {
      makeCalendarAPICall(response.token);
      User.find()
      .then(users => console.log(users))
    })
    res.send('ok')
  })
})
/////////////////////////////
//app.get('/', (req,res)=>res.send('Hello World'))
app.post('/hey', (req,res)=>res.send('Hey'))


app.listen(1337, () => console.log('Example app listening on port 7777!'))
       // web.chat.postMessage({
       //   'channel': event.channel,
       //   'as_user': true,
       //   'text': 'I would like to offer a banana',
       //   'attachments': [
       //     {
       //       'text': 'Do you accept?',
       //       'fallback': 'You did not accept :(',
       //       'callback_id': 'banana',
       //       'color': '#3AA3E3',
       //       'attachment_type': 'default',
       //       'actions': [
       //         {
       //           'name': 'option',
       //           'text': 'Yes',
       //           'type': 'button'
       //         },
       //         {
       //           'name': 'option',
       //           'text': 'No',
       //           'type': 'button'
       //         }
       //       ]
       //     }
       //   ]
       // })

     //rtm.sendMessage(retTestMessage, conversationId);

    //  console.log('intent', response[0].queryResult.parameters.fields.Date);

     // axios({
     //   method: 'post',
     //   url: 'https://www.googleapis.com/calendar/v3/calendars/primary/events',
     //   data: {
     //     attachments: {
     //       fileUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Alpaca_%2831562329701%29.jpg/1200px-Alpaca_%2831562329701%29.jpg',
     //     },
     //
     //     end: {},
     //
     //
     //     start: {},
     //     description: event.text,
     //
     //   }
     // })
     // .then (response2 => console.log('RESPONSE2'))
     // .catch(err => console.log('ERR'))









//     rtm.sendMessage('Hello there', conversationId)
//   .then((res) => {
//     // `res` contains information about the posted message

//   })








// // The RTM client can send simple string messages
// rtm.sendMessage('Hello there', conversationId)
//   .then((res) => {
//     // `res` contains information about the posted message
//     console.log('Message sent: ', res.ts);
//   })
//   .catch(console.error);







// const projectId = process.env.DIALOGFLOW_PROJECT_ID; //https://dialogflow.com/docs/agents#settings
// const sessionId = 'quickstart-session-id';
// const query = 'hello';
// const languageCode = 'en-US';
//
// // Instantiate a DialogFlow client.
// const dialogflow = require('dialogflow');
// const sessionClient = new dialogflow.SessionsClient();
//
// // Define session path
// const sessionPath = sessionClient.sessionPath(projectId, sessionId);
//
// // The text query request.
// const request = {
//   session: sessionPath,
//   queryInput: {
//     text: {
//       text: query,
//       languageCode: languageCode,
//     },
//   },
// };
//
// // Send request and log result
// sessionClient
//   .detectIntent(request)
//   .then(responses => {
//     console.log('Detected intent');
//     const result = responses[0].queryResult;
//     console.log(`  Query: ${result.queryText}`);
//     console.log(`  Response: ${result.fulfillmentText}`);
//     if (result.intent) {
//       console.log(`  Intent: ${result.intent.displayName}`);
//     } else {
//       console.log(`  No intent matched.`);
//     }
//   })
//   .catch(err => {
//     console.error('ERROR:', err);
//   });
//////////////////////////////////////////////////////////////////////////////////
// import {RTMClient, WebClient} from '@slack/client'
// import {dialogFlow} from './dialogFlow.js'
// var app = require('express')()
// var bodyparser = require('body-parser')
//
// const token = 'xoxb-402864850977-402868052193-GCD3YfYvIn8ZRTLTfW8o8fWS'
// const web = new WebClient(token)
// const rtm = new RTMClient(token)
// rtm.start()
// rtm.on('message', function (event) {
//   console.log(event)
//   if (event.bot_id === 'BBWMVV3FG') return
//   web.chat.postMessage({
//     'channel': event.channel,
//     'as_user': true,
//     'text': 'I would like to offer a banana',
//     'attachments': [
//       {
//         'text': 'Do you accept?',
//         'fallback': 'You did not accept :(',
//         'callback_id': 'banana',
//         'color': '#3AA3E3',
//         'attachment_type': 'default',
//         'actions': [
//           {
//             'name': 'option',
//             'text': 'Yes',
//             'type': 'button'
//           },
//           {
//             'name': 'option',
//             'text': 'No',
//             'type': 'button'
//           }
//         ]
//       }
//     ]
//   })
// })
//
// app.post('/scheduler', function (req, res) {
//   console.log('fooooo', req.body)
//   res.send('ok')
// })
//
// app.listen(1337, () => {
//   console.log(`Server is running on port ${app.get('port')}`)
// })





// web.chat.postMessage({
//   'channel': event.channel,
//   'as_user': true,
//   'text': 'Confirm Reminder:',
//   'attachments': [
//     {
//       'text': intentParams.Subject.stringValue,
//       'fallback': 'You did not accept :(',
//       'callback_id': 'banana',
//       'color': '#3AA3E3',
//       'attachment_type': 'default',
//       'actions': [
//         {
//           'name': 'option',
//           'text': 'Correct',
//           'type': 'button'
//         },
//         {
//           'name': 'option',
//           'text': 'Not Correct',
//           'type': 'button'
//         }
//       ]
//     },
//     {
//       'text': intentParams.date.stringValue,
//       'fallback': 'You did not accept :(',
//       'callback_id': 'banana',
//       'color': '#3AA3E3',
//       'attachment_type': 'default',
//       'actions': [
//         {
//           'name': 'option',
//           'text': 'Correct',
//           'type': 'button'
//         },
//         {
//           'name': 'option',
//           'text': 'Not Correct',
//           'type': 'button'
//         }
//       ]
//     }
//   ]
// })
