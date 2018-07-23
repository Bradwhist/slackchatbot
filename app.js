const { RTMClient } = require('@slack/client');


//initialize express
const app = express();

//Slack
const token = process.env.SLACK_TOKEN;

// The client is initialized and then started to get an active connection to the platform
const rtm = new RTMClient(token);
rtm.start();

// This argument can be a channel ID, a DM ID, a MPDM ID, or a group ID
// See the "Combining with the WebClient" topic below for an example of how to get this ID
const conversationId = 'C1232456';

// The RTM client can send simple string messages
rtm.sendMessage('Hello there', conversationId)
  .then((res) => {
    // `res` contains information about the posted message
    console.log('Message sent: ', res.ts);
  })
  .catch(console.error);




app.get('/', (req,res)=>res.send('Hello World'))
app.post('/hey', (req,res)=>res.send('Hey'))


app.listen(7777, () => console.log('Example app listening on port 7777!'))