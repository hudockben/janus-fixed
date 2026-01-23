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
    // Use a default user ID for now (no authentication)
    const userId = 1;

    // Ensure table exists with user_id column
    await sql`
      CREATE TABLE IF NOT EXISTS automations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        automation_id BIGINT NOT NULL,
        name TEXT NOT NULL,
        schedule TEXT NOT NULL,
        time TEXT NOT NULL,
        condition TEXT NOT NULL,
        threshold TEXT,
        notify_email TEXT,
        notify_method TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, automation_id)
      )
    `;

    // Add user_id column if it doesn't exist (migration for existing tables)
    try {
      await sql`ALTER TABLE automations ADD COLUMN IF NOT EXISTS user_id INTEGER`;
    } catch (err) {
      // Column might already exist, that's ok
      console.log('user_id column may already exist');
    }

    // GET - Retrieve user's automations
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT * FROM automations
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;

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

      console.log(`Retrieved ${automations.length} automations for user ${userId}`);
      return res.status(200).json({ automations });
    }

    // POST - Save user's automations (full replacement)
    if (req.method === 'POST') {
      const { automations } = req.body;

      if (!Array.isArray(automations)) {
        return res.status(400).json({ error: 'automations must be an array' });
      }

      // Clear existing automations for this user and insert new ones
      await sql`DELETE FROM automations WHERE user_id = ${userId}`;

      for (const auto of automations) {
        await sql`
          INSERT INTO automations (
            user_id, automation_id, name, schedule, time, condition,
            threshold, notify_email, notify_method, active
          ) VALUES (
            ${userId}, ${auto.id}, ${auto.name}, ${auto.schedule}, ${auto.time},
            ${auto.condition}, ${auto.threshold || null},
            ${auto.notifyEmail || null}, ${auto.notifyMethod}, ${auto.active}
          )
        `;
      }

      console.log(`Saved ${automations.length} automations for user ${userId}`);
      return res.status(200).json({ success: true, count: automations.length });
    }

    // DELETE - Clear all user's automations
    if (req.method === 'DELETE') {
      await sql`DELETE FROM automations WHERE user_id = ${userId}`;
      console.log(`Deleted all automations for user ${userId}`);
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
