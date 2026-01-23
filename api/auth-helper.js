import { sql } from '@vercel/postgres';

// Simple session store (in production, use Redis or database)
// This is shared with auth.js
const sessions = new Map();

// Export for use in auth.js
export { sessions };

// Verify authentication token and return user_id
export async function verifyToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const session = sessions.get(token);

  if (!session) {
    return null;
  }

  // Verify user still exists in database
  const { rows } = await sql`
    SELECT id, email, name FROM users WHERE id = ${session.userId}
  `;

  if (rows.length === 0) {
    sessions.delete(token);
    return null;
  }

  return {
    userId: session.userId,
    email: session.email,
    user: rows[0]
  };
}

// Middleware to require authentication
export async function requireAuth(req, res) {
  const auth = await verifyToken(req);

  if (!auth) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }

  return auth;
}
