const express = require('express');
const router = express.Router();
const { handleFormSubmission } = require('./formHandler');
const { dbAll, dbRun } = require('../db/database');

// Hardcoded Admin Credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'shecan2024';
// A simple static session token for demonstration
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'she_can_secure_session_token_2026';

/**
 * Middleware to verify admin token
 */
function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized access. Please log in.' });
  }
  next();
}

/**
 * POST /api/contact
 * Endpoint to submit contact form. Enforces validation and rate limits.
 */
router.post('/contact', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  
  // Extract client's IP address
  // Supports reverse proxies (like Nginx, Heroku, Cloudflare) or falls back to socket address
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  try {
    const result = await handleFormSubmission({ name, email, phone, subject, message, ipAddress });
    return res.status(201).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message,
      errors: error.errors || []
    });
  }
});

/**
 * POST /api/admin/login
 * Endpoint to authenticate admin user.
 */
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: ADMIN_TOKEN
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid username or password.'
  });
});

/**
 * GET /api/admin/submissions
 * Protected endpoint returning all submissions.
 */
router.get('/admin/submissions', requireAdmin, async (req, res) => {
  try {
    // Return submissions sorted by newest first
    const submissions = await dbAll('SELECT * FROM submissions ORDER BY created_at DESC');
    return res.status(200).json({
      success: true,
      count: submissions.length,
      submissions
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return res.status(500).json({ error: 'Failed to retrieve submissions.' });
  }
});

/**
 * DELETE /api/admin/submissions/:id
 * Protected endpoint to delete a specific submission.
 */
router.delete('/admin/submissions/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await dbRun('DELETE FROM submissions WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Submission not found.' });
    }
    return res.status(200).json({ success: true, message: 'Submission deleted successfully.' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    return res.status(500).json({ error: 'Failed to delete submission.' });
  }
});

module.exports = router;
