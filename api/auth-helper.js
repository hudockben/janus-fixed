import { sql } from '@vercel/postgres';
import crypto from 'crypto';

// Verify and decode token (same logic as in auth.js)
function verifyToken(token) {
  if (!token) return null;

  try {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return null;

    // Verify signature
    const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64');

    if (signature !== expectedSignature) return null;

    // Decode payload
    const payloadStr = Buffer.from(payloadB64, 'base64').toString('utf-8');
    const payload = JSON.parse(payloadStr);

    return payload;
  } catch (err) {
    console.error('Token verification failed:', err);
    return null;
  }
}

// Verify authentication token and return user info
export async function getUserFromToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  // Verify user still exists in database
  const { rows } = await sql`
    SELECT id, email, name FROM users WHERE id = ${payload.userId}
  `;

  if (rows.length === 0) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    user: rows[0]
  };
}

// Middleware to require authentication
export async function requireAuth(req, res) {
  const auth = await getUserFromToken(req);

  if (!auth) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }

  return auth;
}
