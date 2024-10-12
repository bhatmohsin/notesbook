const fetch = require('node-fetch'); // Import node-fetch to make API calls

exports.handler = async function(event, context) {
  // Access the API key and client ID securely from environment variables
  const apiKey = process.env.API_KEY; // Make sure to set this in your Netlify dashboard
  const clientId = process.env.CLIENT_ID; // Make sure to set this in your Netlify dashboard

  try {
    // Example API call using both API_KEY and CLIENT_ID
    const apiUrl = `https://www.googleapis.com/auth/drive.file`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    
    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json", // Set content type to JSON
        "Access-Control-Allow-Origin": "*", // Allow all origins for CORS
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data', details: error.message }),
    };
  }
};