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
      CREATE TABLE IF NOT EXISTS user_data (
        id SERIAL PRIMARY KEY,
        data_type TEXT NOT NULL,
        name TEXT NOT NULL,
        url TEXT,
        file_type TEXT,
        file_size INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // GET - Retrieve all user data
    if (req.method === 'GET') {
      const { rows } = await sql`SELECT * FROM user_data ORDER BY created_at DESC`;

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

      console.log('Retrieved user data:', { files: recentFiles.length, links: recentLinks.length });
      return res.status(200).json({ recentFiles, recentLinks });
    }

    // POST - Save user data
    if (req.method === 'POST') {
      const { recentFiles, recentLinks } = req.body;

      // Clear existing data
      await sql`DELETE FROM user_data`;

      // Insert recent files
      if (Array.isArray(recentFiles)) {
        for (const file of recentFiles) {
          await sql`
            INSERT INTO user_data (
              data_type, name, file_type, file_size
            ) VALUES (
              'recent_file', ${file.name}, ${file.fileType || null}, ${file.fileSize || null}
            )
          `;
        }
      }

      // Insert recent links
      if (Array.isArray(recentLinks)) {
        for (const link of recentLinks) {
          await sql`
            INSERT INTO user_data (
              data_type, name, url
            ) VALUES (
              'recent_link', ${link.title || 'Untitled'}, ${link.url}
            )
          `;
        }
      }

      const totalCount = (recentFiles?.length || 0) + (recentLinks?.length || 0);
      console.log('Saved user data:', totalCount);
      return res.status(200).json({ success: true, count: totalCount });
    }

    // DELETE - Clear all user data
    if (req.method === 'DELETE') {
      await sql`DELETE FROM user_data`;
      console.log('Deleted all user data');
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
