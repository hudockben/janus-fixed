import { sql } from '@vercel/postgres';
import crypto from 'crypto';

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

// Generate JWT-like token with user data encoded
function generateToken(userId, email) {
  const payload = {
    userId,
    email,
    iat: Date.now()
  };
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr).toString('base64');

  // Sign with secret (in production, use proper JWT library and secret from env)
  const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64');

  return `${payloadB64}.${signature}`;
}

// Verify and decode token
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

    // VERIFY TOKEN (Check if logged in)
    if (req.method === 'GET' && req.url.includes('/verify')) {
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

    // LOGOUT (client-side only, just return success)
    if (req.method === 'POST' && req.url.includes('/logout')) {
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

// Export verifyToken for use in other API routes
export { verifyToken };
