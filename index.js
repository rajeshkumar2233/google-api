
const { google } = require('googleapis');



const { OAuth2 } = google.auth;



// Replace these variables with your own values



const EMAIL_ADDRESS = 'your-email@gmail.com';



const CLIENT_ID = 'your-client-id';



const CLIENT_SECRET = 'your-client-secret';



const REDIRECT_URI = 'http://localhost:3000/auth/google/callback';



const REFRESH_TOKEN = 'your-refresh-token';



const RANDOM_MIN_INTERVAL = 45; // seconds



const RANDOM_MAX_INTERVAL = 120; // seconds



const LABEL_NAME = 'Vacation Replies';



// Create OAuth2 client



const oAuth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);



oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });



// Create Gmail API client



const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });



// Get all unread emails



const getUnreadEmails = async () => {



 const res = await gmail.users.messages.list({

  userId: 'me',

  labelIds: ['INBOX', 'UNREAD']

 });



 if (res.data.resultSizeEstimate === 0) return [];



 const messages = res.data.messages || [];



 // Fetch message details for each message

 const promises = messages.map(async message => {

  const res = await gmail.users.messages.get({

   userId: 'me',

   id: message.id

  });

  return res.data;

 });



 return Promise.all(promises);

};



// Check if an email has already been replied to



const isAlreadyReplied = email => {

 const headers = email.payload.headers || [];



 for (const header of headers) {

  if (header.name === 'From' && header.value === EMAIL_ADDRESS) {

   return true;

  }

 }



 return false;

};



// Send reply to an email



const sendReply = async email => {

 const subject = email.payload.headers.find(h => h.name === 'Subject').value;

 const body = `Hi,\n\nThank you for your email regarding "${subject}". I'm currently out of office on vacation and will not be able to respond until my return on [date].\n\nBest regards,\n[Your name]`;



 // Construct the message to send

 const message = [

  'Content-Type: text/plain; charset="UTF-8"\r\n',

  'MIME-Version: 1.0\r\n',

  'Content-Transfer-Encoding: 7bit\r\n',

  `To: ${email.payload.headers.find(h => h.name === 'From').value}\r\n`,

  `Subject: Re: ${subject}\r\n`,

  '\r\n',

  `${body}\r\n`

 ].join('');



 // Send the message

 await gmail.users.messages.send({

  userId: 'me',

  requestBody: { raw: Buffer.from(message).toString('base64') }

 });



 // Add label to the email

 const res = await gmail.users.labels.list({ userId: 'me' });

 const label = res.data.labels.find(l => l.name === LABEL_NAME) || await gmail.users.labels.create({ userId: 'me', requestBody: { name: LABEL_NAME } });

 await gmail.users.messages.modify({ userId: 'me', id: email.id, requestBody: { addLabelIds: [label.id] } });

};



// Start checking for emails and sending replies



// Start checking for emails and sending replies



const start = async () => {

 while (true) {

  const emails = await getUnreadEmails();

  for (const email of emails) {

   if (!isAlreadyReplied(email)) {

    await sendReply(email);

   }

  }

  const randomInterval = Math.floor(Math.random() * (RANDOM_MAX_INTERVAL - RANDOM_MIN_INTERVAL + 1)) + RANDOM_MIN_INTERVAL;

  console.log(`Waiting ${randomInterval} seconds before checking for new emails...`);

  await new Promise(resolve => setTimeout(resolve, randomInterval * 1000));

 }

};



// Start the script



start().catch(console.error);



