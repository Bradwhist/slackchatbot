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


//////////////////////////////
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
