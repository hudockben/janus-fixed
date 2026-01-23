import { sql } from '@vercel/postgres';
import {
  hashPassword,
  generateToken,
  ensureUsersTable,
  setCorsHeaders,
  validatePassword,
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

    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Rate limiting check - use IP as identifier for signup
    const identifier = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const rateLimit = checkRateLimit(`signup:${identifier}`, 3, 60 * 60 * 1000); // 3 attempts per hour

    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: `Too many signup attempts. Please try again in ${Math.ceil(rateLimit.retryAfter / 60)} minutes.`
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
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

  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({
      error: 'Server error: ' + err.message,
      details: err.toString()
    });
  }
}
