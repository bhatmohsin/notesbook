const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Access the API key and client ID securely from environment variables
  const apiKey = process.env.API_KEY;
  const clientId = process.env.CLIENT_ID;

  try {
    // Example API call using both API_KEY and CLIENT_ID (replace with your actual API URL)
    const apiUrl = `https://api.example.com/data?api_key=${apiKey}&client_id=${clientId}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    
    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data', details: error.message }),
    };
  }
};