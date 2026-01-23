import { sql } from '@vercel/postgres';
import {
  verifyPassword,
  generateToken,
  ensureUsersTable,
  setCorsHeaders,
  checkRateLimit
} from '../auth-helper.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure users table exists
    await ensureUsersTable();

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Rate limiting check - use email or IP as identifier
    const identifier = email || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const rateLimit = checkRateLimit(`login:${identifier}`);

    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: `Too many login attempts. Please try again in ${rateLimit.retryAfter} seconds.`
      });
    }

    // Find user
    const { rows } = await sql`
      SELECT id, email, name, password_hash, password_salt, created_at
      FROM users
      WHERE email = ${email}
    `;

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];

    // Verify password
    if (!verifyPassword(password, user.password_salt, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create token
    const token = generateToken(user.id, user.email);

    console.log('User logged in:', user.email);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      error: 'Server error: ' + err.message,
      details: err.toString()
    });
  }
}
