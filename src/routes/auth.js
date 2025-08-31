const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Database } = require('../database/connection');
const { logger } = require('../utils/logger');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, companyName, phone } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Missing required fields: email, password, firstName, lastName'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }

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

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

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
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

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
router.get('/verify', async (req, res) => {
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
router.post('/refresh', async (req, res) => {
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

module.exports = router;