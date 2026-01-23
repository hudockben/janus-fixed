import { sql } from '@vercel/postgres';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  ensureUsersTable,
  setCorsHeaders
} from '../auth-helper.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    // Ensure users table exists
    await ensureUsersTable();

    // SIGNUP
    if (action === 'signup' && req.method === 'POST') {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Validate password strength
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      // Check if user exists
      const { rows: existing } = await sql`SELECT id FROM users WHERE email = ${email}`;
      if (existing.length > 0) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const { salt, hash } = hashPassword(password);

      // Create user
      const { rows } = await sql`
        INSERT INTO users (email, password_hash, password_salt, name)
        VALUES (${email}, ${hash}, ${salt}, ${name || null})
        RETURNING id, email, name, created_at
      `;

      const user = rows[0];

      // Create token
      const token = generateToken(user.id, user.email);

      console.log('User signed up:', user.email);

      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.created_at
        }
      });
    }

    // LOGIN
    if (action === 'login' && req.method === 'POST') {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
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
    }

    // VERIFY
    if (action === 'verify' && req.method === 'GET') {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const payload = verifyToken(token);

      if (!payload) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Get fresh user details
      const { rows } = await sql`
        SELECT id, email, name, created_at
        FROM users
        WHERE id = ${payload.userId}
      `;

      if (rows.length === 0) {
        return res.status(401).json({ error: 'User not found' });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: rows[0].id,
          email: rows[0].email,
          name: rows[0].name,
          createdAt: rows[0].created_at
        }
      });
    }

    // LOGOUT
    if (action === 'logout' && req.method === 'POST') {
      console.log('User logged out');
      return res.status(200).json({ success: true });
    }

    // Invalid action
    return res.status(404).json({ error: 'Not found' });

  } catch (err) {
    console.error(`${action} error:`, err);
    return res.status(500).json({
      error: 'Server error: ' + err.message,
      details: err.toString()
    });
  }
}
