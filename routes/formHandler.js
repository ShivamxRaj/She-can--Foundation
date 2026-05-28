const { dbRun, dbGet } = require('../db/database');

/**
 * Validates a contact form submission.
 * @param {string} name 
 * @param {string} email 
 * @param {string} phone 
 * @param {string} subject 
 * @param {string} message 
 * @returns {Array<string>} Array of validation error messages
 */
function validateSubmission(name, email, phone, subject, message) {
  const errors = [];

  // Name Validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Full name is required.');
  } else if (name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long.');
  }

  // Email Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push('Email address is required.');
  } else if (!emailRegex.test(email.trim())) {
    errors.push('Please enter a valid email address.');
  }

  // Phone Validation (Optional, but if provided must be valid)
  if (phone && phone.trim().length > 0) {
    const phoneRegex = /^\+?[0-9\s\-()]{10,20}$/;
    if (!phoneRegex.test(phone.trim())) {
      errors.push('Please enter a valid phone number (10-20 digits).');
    }
  }

  // Subject Validation
  const allowedSubjects = ['General Inquiry', 'Volunteer', 'Donate', 'Partnership'];
  if (!subject || !allowedSubjects.includes(subject)) {
    errors.push('Please select a valid subject category.');
  }

  // Message Validation
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    errors.push('Message is required.');
  } else if (message.trim().length < 20) {
    errors.push('Message must be at least 20 characters long.');
  }

  return errors;
}

/**
 * Checks if an IP has exceeded the rate limit of 3 submissions per hour.
 * @param {string} ipAddress 
 * @returns {Promise<boolean>} True if rate limit is exceeded, false otherwise
 */
async function isRateLimitExceeded(ipAddress) {
  try {
    // SQLite query checking count of submissions in last 1 hour
    const query = `
      SELECT COUNT(*) AS count 
      FROM submissions 
      WHERE ip_address = ? 
      AND created_at > datetime('now', '-1 hour')
    `;
    const result = await dbGet(query, [ipAddress]);
    return result && result.count >= 3;
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return false;
  }
}

/**
 * Core form submission logic. MCP-ready modular function.
 * @param {Object} data 
 * @param {string} data.name 
 * @param {string} data.email 
 * @param {string} data.phone 
 * @param {string} data.subject 
 * @param {string} data.message 
 * @param {string} data.ipAddress 
 * @returns {Promise<Object>} The status and saved data
 */
async function handleFormSubmission({ name, email, phone, subject, message, ipAddress }) {
  // 1. Clean Inputs
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim();
  const cleanPhone = (phone || '').trim();
  const cleanSubject = (subject || '').trim();
  const cleanMessage = (message || '').trim();

  // 2. Validate
  const validationErrors = validateSubmission(cleanName, cleanEmail, cleanPhone, cleanSubject, cleanMessage);
  if (validationErrors.length > 0) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = validationErrors;
    throw error;
  }

  // 3. Rate Limit Check
  const rateLimitHit = await isRateLimitExceeded(ipAddress);
  if (rateLimitHit) {
    const error = new Error('Rate limit exceeded. Maximum 3 submissions per hour are allowed.');
    error.statusCode = 429;
    throw error;
  }

  // 4. Save to Database
  try {
    const query = `
      INSERT INTO submissions (name, email, phone, subject, message, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await dbRun(query, [cleanName, cleanEmail, cleanPhone, cleanSubject, cleanMessage, ipAddress]);
    
    return {
      success: true,
      message: 'Submission saved successfully.',
      submissionId: result.lastID,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Database insertion error:', error);
    const dbError = new Error('Failed to save submission to the database.');
    dbError.statusCode = 500;
    throw dbError;
  }
}

module.exports = {
  handleFormSubmission,
  validateSubmission,
  isRateLimitExceeded
};
