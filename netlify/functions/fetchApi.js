const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const apiKey = process.env.API_KEY;
  const clientId = process.env.CLIENT_ID;

  try {
    // Instead of making an API call, we're just returning the credentials
    return {
      statusCode: 200,
      body: JSON.stringify({ apiKey, clientId }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch credentials', details: error.message }),
    };
  }
};