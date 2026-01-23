import { sql } from '@vercel/postgres';
import crypto from 'crypto';
import { sessions } from './auth-helper.js';

// Hash password using crypto
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

// Verify password
function verifyPassword(password, salt, hash) {
  const hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === hashVerify;
}

// Generate session token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Ensure users table exists
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // SIGNUP
    if (req.method === 'POST' && req.url.includes('/signup')) {
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

      // Create session
      const token = generateToken();
      sessions.set(token, {
        userId: user.id,
        email: user.email,
        createdAt: Date.now()
      });

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
    if (req.method === 'POST' && req.url.includes('/login')) {
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

      // Create session
      const token = generateToken();
      sessions.set(token, {
        userId: user.id,
        email: user.email,
        createdAt: Date.now()
      });

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

    // VERIFY TOKEN (Check if logged in)
    if (req.method === 'GET' && req.url.includes('/verify')) {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const session = sessions.get(token);

      if (!session) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Get user details
      const { rows } = await sql`
        SELECT id, email, name, created_at
        FROM users
        WHERE id = ${session.userId}
      `;

      if (rows.length === 0) {
        sessions.delete(token);
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
    if (req.method === 'POST' && req.url.includes('/logout')) {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (token) {
        sessions.delete(token);
      }

      console.log('User logged out');

      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (err) {
    console.error('Auth API error:', err);
    return res.status(500).json({
      error: 'Server error: ' + err.message,
      details: err.toString()
    });
  }
}
