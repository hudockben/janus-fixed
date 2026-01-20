import { kv } from '@vercel/kv';

const AUTOMATIONS_KEY = 'janus:automations';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Retrieve all automations
    if (req.method === 'GET') {
      const automations = await kv.get(AUTOMATIONS_KEY) || [];
      console.log('Retrieved automations:', automations.length);
      return res.status(200).json({ automations });
    }

    // POST - Save automations (full replacement)
    if (req.method === 'POST') {
      const { automations } = req.body;

      if (!Array.isArray(automations)) {
        return res.status(400).json({ error: 'automations must be an array' });
      }

      await kv.set(AUTOMATIONS_KEY, automations);
      console.log('Saved automations:', automations.length);
      return res.status(200).json({ success: true, count: automations.length });
    }

    // DELETE - Clear all automations
    if (req.method === 'DELETE') {
      await kv.del(AUTOMATIONS_KEY);
      console.log('Deleted all automations');
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('Automations API error:', err);
    return res.status(500).json({
      error: 'Server error: ' + err.message,
      details: err.toString()
    });
  }
}
