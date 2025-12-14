require('dotenv').config();
const { google } = require('googleapis');
const http = require('http');
const url = require('url');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const PORT = 5500;
const REDIRECT_URI = `http://localhost:${PORT}`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env file.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

// Create a local server to receive the callback
const server = http.createServer(async (req, res) => {
  // Handle the callback request
  if (req.url.includes('code=')) {
    const qs = new url.URL(req.url, REDIRECT_URI).searchParams;
    const code = qs.get('code');

    res.end('Authentication successful! You can close this window and check your terminal.');
    server.close();

    console.log('\nCallback received! Exchanging code for tokens...');

    try {
      const { tokens } = await oauth2Client.getToken(code);
      console.log('\nSUCCESS! Here is your Refresh Token:');
      console.log('---------------------------------------------------');
      console.log(tokens.refresh_token);
      console.log('---------------------------------------------------');
      console.log('\nAdd this to your .env file as GOOGLE_REFRESH_TOKEN=...');
      process.exit(0);
    } catch (err) {
      console.error('Error retrieving access token:', err);
      process.exit(1);
    }
  } else {
      res.end('Waiting for authentication...');
  }
});

server.listen(PORT, () => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force refresh token generation
  });

  console.log(`\nListening on port ${PORT}...`);
  console.log('Please click the link below to authorize:');
  console.log('\n' + authUrl + '\n');
});
