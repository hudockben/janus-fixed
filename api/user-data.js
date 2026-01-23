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
      CREATE TABLE IF NOT EXISTS user_data (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        data_type TEXT NOT NULL,
        name TEXT NOT NULL,
        url TEXT,
        file_type TEXT,
        file_size INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Add user_id column if it doesn't exist (migration for existing tables)
    try {
      await sql`ALTER TABLE user_data ADD COLUMN IF NOT EXISTS user_id INTEGER`;
    } catch (err) {
      // Column might already exist, that's ok
      console.log('user_id column may already exist');
    }

    // GET - Retrieve user's data
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT * FROM user_data
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;

      // Group data by type
      const recentFiles = rows
        .filter(row => row.data_type === 'recent_file')
        .slice(0, 10)
        .map(row => ({
          name: row.name,
          fileType: row.file_type,
          fileSize: row.file_size,
          timestamp: row.created_at
        }));

      const recentLinks = rows
        .filter(row => row.data_type === 'recent_link')
        .slice(0, 10)
        .map(row => ({
          url: row.url,
          title: row.name,
          timestamp: row.created_at
        }));

      console.log(`Retrieved user data for user ${userId}:`, { files: recentFiles.length, links: recentLinks.length });
      return res.status(200).json({ recentFiles, recentLinks });
    }

    // POST - Save user's data
    if (req.method === 'POST') {
      const { recentFiles, recentLinks } = req.body;

      // Clear existing data for this user
      await sql`DELETE FROM user_data WHERE user_id = ${userId}`;

      // Insert recent files
      if (Array.isArray(recentFiles)) {
        for (const file of recentFiles) {
          await sql`
            INSERT INTO user_data (
              user_id, data_type, name, file_type, file_size
            ) VALUES (
              ${userId}, 'recent_file', ${file.name}, ${file.fileType || null}, ${file.fileSize || null}
            )
          `;
        }
      }

      // Insert recent links
      if (Array.isArray(recentLinks)) {
        for (const link of recentLinks) {
          await sql`
            INSERT INTO user_data (
              user_id, data_type, name, url
            ) VALUES (
              ${userId}, 'recent_link', ${link.title || 'Untitled'}, ${link.url}
            )
          `;
        }
      }

      const totalCount = (recentFiles?.length || 0) + (recentLinks?.length || 0);
      console.log(`Saved ${totalCount} user data items for user ${userId}`);
      return res.status(200).json({ success: true, count: totalCount });
    }

    // DELETE - Clear all user's data
    if (req.method === 'DELETE') {
      await sql`DELETE FROM user_data WHERE user_id = ${userId}`;
      console.log(`Deleted all user data for user ${userId}`);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('User data API error:', err);
    return res.status(500).json({
      error: 'Server error: ' + err.message,
      details: err.toString()
    });
  }
}
