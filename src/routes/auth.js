const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Database } = require('../database/connection');
const { logger } = require('../utils/logger');
const { validate } = require('../middleware/validation');
const { signupSchema, loginSchema, emailSchema } = require('../schemas/auth.schema');
const { 
  authLimiter, 
  registrationLimiter, 
  waitlistLimiter, 
  accountLockout 
} = require('../middleware/rateLimit');

const router = express.Router();

// Register new user
router.post('/register', registrationLimiter, validate(signupSchema), async (req, res) => {
  try {
    const { email, password, firstName, lastName, companyName, phone } = req.body;

    const db = Database.getInstance();

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'User with this email already exists'
      });
    }

    // Hash password with configurable rounds
    const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const passwordHash = await bcrypt.hash(password, bcryptRounds);

    // Create user
    const result = await db.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, company_name, phone)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, first_name, last_name, company_name, role, created_at
    `, [email.toLowerCase(), passwordHash, firstName, lastName, companyName, phone]);

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        companyName: user.company_name,
        role: user.role,
        createdAt: user.created_at
      },
      token
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed. Please try again.'
    });
  }
});

// Login user
router.post('/login', authLimiter, accountLockout, validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const db = Database.getInstance();

    // Get user from database
    const result = await db.query(`
      SELECT id, email, password_hash, first_name, last_name, company_name, role, is_active
      FROM users 
      WHERE email = $1
    `, [email.toLowerCase()]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        error: 'Account is disabled. Please contact support.'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Update last login
    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    logger.info(`User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        companyName: user.company_name,
        role: user.role
      },
      token
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed. Please try again.'
    });
  }
});

// Verify token (middleware endpoint)
router.get('/verify', authLimiter, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const db = Database.getInstance();

    // Get current user info
    const result = await db.query(`
      SELECT id, email, first_name, last_name, company_name, role, is_active, last_login
      FROM users 
      WHERE id = $1 AND is_active = true
    `, [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid token or user not found'
      });
    }

    const user = result.rows[0];

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        companyName: user.company_name,
        role: user.role,
        lastLogin: user.last_login
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired'
      });
    }

    logger.error('Token verification error:', error);
    res.status(500).json({
      error: 'Token verification failed'
    });
  }
});

// Refresh token
router.post('/refresh', authLimiter, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);

    // Verify current token (allow expired)
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });

    const db = Database.getInstance();

    // Check if user still exists and is active
    const result = await db.query(`
      SELECT id, email, role, is_active
      FROM users 
      WHERE id = $1 AND is_active = true
    `, [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'User not found or inactive'
      });
    }

    const user = result.rows[0];

    // Generate new token
    const newToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    res.json({
      message: 'Token refreshed successfully',
      token: newToken
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Token refresh failed'
    });
  }
});

// Join waitlist
router.post('/waitlist', waitlistLimiter, validate({ email: emailSchema }), async (req, res) => {
  try {
    const { email } = req.body;

    const db = Database.getInstance();

    // Check if email already exists in waitlist
    const existingEntry = await db.query(
      `SELECT id FROM waitlist WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (existingEntry.rows.length > 0) {
      return res.status(200).json({
        message: 'You\'re already on our waitlist! We\'ll be in touch soon.',
        alreadyExists: true
      });
    }

    // Add to waitlist
    const result = await db.query(`
      INSERT INTO waitlist (email, joined_at, ip_address, user_agent)
      VALUES ($1, NOW(), $2, $3)
      RETURNING id, email, joined_at
    `, [
      email.toLowerCase(), 
      req.ip || req.connection.remoteAddress,
      req.get('User-Agent')
    ]);

    const waitlistEntry = result.rows[0];

    logger.info(`New waitlist signup: ${email}`);

    res.status(201).json({
      message: 'Successfully joined the waitlist! We\'ll notify you when MyBidFit launches.',
      waitlistEntry: {
        id: waitlistEntry.id,
        email: waitlistEntry.email,
        joinedAt: waitlistEntry.joined_at
      }
    });

  } catch (error) {
    logger.error('Waitlist signup error:', error);
    
    // Handle potential database constraint errors
    if (error.code === '23505') { // Unique constraint violation
      return res.status(200).json({
        message: 'You\'re already on our waitlist! We\'ll be in touch soon.',
        alreadyExists: true
      });
    }

    res.status(500).json({
      error: 'Failed to join waitlist. Please try again.'
    });
  }
});

module.exports = router;