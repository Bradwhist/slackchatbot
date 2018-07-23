const { RTMClient } = require('@slack/client');

const express = require('express')

//initialize express
const app = express();

//Slack
const token = process.env.SLACK_TOKEN;

// The client is initialized and then started to get an active connection to the platform
const rtm = new RTMClient(token);



rtm.on('message', event=>{
    const conversationId = event.channel;

    //   Skip messages that are from a bot or my own user ID
  if ( (event.subtype && event.subtype === 'bot_event') ||
  (!event.subtype && event.user === rtm.activeUserId) ) {
return;
}


//     rtm.sendMessage('Hello there', conversationId)
//   .then((res) => {
//     // `res` contains information about the posted message
    
//   })


})

rtm.start();



// // The RTM client can send simple string messages
// rtm.sendMessage('Hello there', conversationId)
//   .then((res) => {
//     // `res` contains information about the posted message
//     console.log('Message sent: ', res.ts);
//   })
//   .catch(console.error);




app.get('/', (req,res)=>res.send('Hello World'))
app.post('/hey', (req,res)=>res.send('Hey'))


app.listen(7777, () => console.log('Example app listening on port 7777!'))