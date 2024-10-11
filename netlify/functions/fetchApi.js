// fetchApi.js

async function getEnvVars() {
  try {
    const response = await fetch('/.netlify/functions/getEnv'); // Call the Netlify function
    const data = await response.json(); // Parse the response

    const CLIENT_ID = data.CLIENT_ID;
    const API_KEY = data.API_KEY;

    console.log('CLIENT_ID:', CLIENT_ID); 
    console.log('API_KEY:', API_KEY);

    // Use CLIENT_ID and API_KEY for further API calls or logic
    // For example:
    // callGoogleAPI(CLIENT_ID, API_KEY);

  } catch (error) {
    console.error('Error fetching environment variables:', error);
  }
}

getEnvVars(); // Call this function on page load or when needed
