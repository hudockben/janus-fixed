import { sql } from '@vercel/postgres';

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
    // Ensure table exists
    await sql`
      CREATE TABLE IF NOT EXISTS automations (
        id SERIAL PRIMARY KEY,
        automation_id BIGINT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        schedule TEXT NOT NULL,
        time TEXT NOT NULL,
        condition TEXT NOT NULL,
        threshold TEXT,
        notify_email TEXT,
        notify_method TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // GET - Retrieve all automations
    if (req.method === 'GET') {
      const { rows } = await sql`SELECT * FROM automations ORDER BY created_at DESC`;

      // Convert DB format to app format
      const automations = rows.map(row => ({
        id: row.automation_id,
        name: row.name,
        schedule: row.schedule,
        time: row.time,
        condition: row.condition,
        threshold: row.threshold,
        notifyEmail: row.notify_email,
        notifyMethod: row.notify_method,
        active: row.active
      }));

      console.log('Retrieved automations:', automations.length);
      return res.status(200).json({ automations });
    }

    // POST - Save automations (full replacement)
    if (req.method === 'POST') {
      const { automations } = req.body;

      if (!Array.isArray(automations)) {
        return res.status(400).json({ error: 'automations must be an array' });
      }

      // Clear existing automations and insert new ones
      await sql`DELETE FROM automations`;

      for (const auto of automations) {
        await sql`
          INSERT INTO automations (
            automation_id, name, schedule, time, condition,
            threshold, notify_email, notify_method, active
          ) VALUES (
            ${auto.id}, ${auto.name}, ${auto.schedule}, ${auto.time},
            ${auto.condition}, ${auto.threshold || null},
            ${auto.notifyEmail || null}, ${auto.notifyMethod}, ${auto.active}
          )
        `;
      }

      console.log('Saved automations:', automations.length);
      return res.status(200).json({ success: true, count: automations.length });
    }

    // DELETE - Clear all automations
    if (req.method === 'DELETE') {
      await sql`DELETE FROM automations`;
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
