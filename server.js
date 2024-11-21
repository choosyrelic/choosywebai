const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const app = express();

// In-memory chat history
const chatHistory = [];
const MAX_HISTORY = 100;

// Base URL for development tunnel
const BASE_URL = 'https://mkvcj2fz-3000.inc1.devtunnels.ms/';

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20 // limit each IP to 20 requests per minute
});

// Middleware for static files and JSON/body parsing
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(cookieParser());
app.use('/chat', limiter);

// System status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    baseURL: BASE_URL
  });
});

// Chat history endpoint
app.get('/history', (req, res) => {
  res.json(chatHistory);
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Chat endpoint
app.post('/chat', (req, res) => {
  if (!req.body.message || typeof req.body.message !== 'string') {
    return res.status(400).json({ error: 'Invalid message format' });
  }
  if (req.body.message.length > 500) {
    return res.status(400).json({ error: 'Message too long (max 500 characters)' });
  }

  const userMessage = req.body.message.trim();
  const userName = req.cookies.userName || 'User';
  const timestamp = new Date().toISOString();

  // Append user message to chat history
  const conversation = {
    user: {
      name: userName,
      message: userMessage,
      timestamp
    },
    ai: {
      message: 'Response from AI would go here', // Placeholder
      timestamp: new Date().toISOString()
    }
  };

  chatHistory.unshift(conversation);
  if (chatHistory.length > MAX_HISTORY) {
    chatHistory.pop();
  }

  console.log(`Message received from ${userName}: ${userMessage}`);
  console.log(`AI response placeholder logged.`);

  // Respond with a placeholder
  res.json({
    reply: 'This is a placeholder response. The actual AI response should be processed on your desktop.',
    timestamp: conversation.ai.timestamp
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running and exposed at ${BASE_URL}`);
});
