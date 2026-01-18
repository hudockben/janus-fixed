export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set in environment variables');
    return res.status(500).json({ 
      error: 'API key not configured. Please add ANTHROPIC_API_KEY to your environment variables in Vercel.' 
    });
  }

  try {
    console.log('Making request to Anthropic API...');
    console.log('Request model:', req.body.model);
    console.log('Request max_tokens:', req.body.max_tokens);

    // Make request to Anthropic
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    console.log('Anthropic API status:', anthropicResponse.status);

    // Parse response
    const responseData = await anthropicResponse.json();

    // If Anthropic returned an error
    if (!anthropicResponse.ok) {
      console.error('Anthropic API error:', JSON.stringify(responseData, null, 2));
      return res.status(anthropicResponse.status).json(responseData);
    }

    // Success
    console.log('Anthropic API success');
    return res.status(200).json(responseData);

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ 
      error: 'Server error: ' + err.message,
      details: err.toString()
    });
  }
}
