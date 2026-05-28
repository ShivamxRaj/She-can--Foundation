const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup security headers with Helmet, with CSP customized for Google Fonts & styling
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://kit.fontawesome.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://ka-f.fontawesome.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://ka-f.fontawesome.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "https://ka-f.fontawesome.com"]
      },
    },
  })
);

// Enable CORS
app.use(cors());

// Parse incoming request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log request information (simple custom middleware)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${req.ip}`);
  next();
});

// Import and mount contact API routes
const contactRoutes = require('./routes/contact');
app.use('/api', contactRoutes);

// Serve styles.css and client JS files statically from the root folder
app.use(express.static(path.join(__dirname)));

// Route specifically serving the admin panel interface
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Fallback to main landing page index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` She Can Foundation Contact Form server is active`);
  console.log(` Running on: http://localhost:${PORT}`);
  console.log(` Admin URL:  http://localhost:${PORT}/admin`);
  console.log(`=================================================`);
});
