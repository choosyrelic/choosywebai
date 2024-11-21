const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const app = express();

// In-memory chat history
const chatHistory = [];
const MAX_HISTORY = 100;

// Base URL for development tunnel
const LOCAL_SERVER_URL = 'https://mkvcj2fz-3001.inc1.devtunnels.ms';

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20 // limit each IP to 20 requests per minute
});

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(cookieParser());
app.use('/chat', limiter);

// System status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    localServerURL: LOCAL_SERVER_URL
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
app.post('/chat', async (req, res) => {
  if (!req.body.message || typeof req.body.message !== 'string') {
    return res.status(400).json({ error: 'Invalid message format' });
  }
  if (req.body.message.length > 500) {
    return res.status(400).json({ error: 'Message too long (max 500 characters)' });
  }

  const userMessage = req.body.message.trim();
  const userName = req.cookies.userName || 'User';
  const timestamp = new Date().toISOString();

  try {
    const response = await axios.post(`${LOCAL_SERVER_URL}/process-chat`, {
      message: userMessage,
      userName
    });

    const conversation = {
      user: {
        name: userName,
        message: userMessage,
        timestamp
      },
      ai: {
        message: response.data.reply,
        timestamp: response.data.timestamp
      }
    };

    chatHistory.unshift(conversation);
    if (chatHistory.length > MAX_HISTORY) {
      chatHistory.pop();
    }

    res.json({
      reply: response.data.reply,
      timestamp: conversation.ai.timestamp
    });
  } catch (error) {
    console.error('Error communicating with local server:', error);
    res.status(500).json({ error: 'Failed to communicate with AI service' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`GitHub server running on port ${PORT}`);
  console.log(`Connected to local server at ${LOCAL_SERVER_URL}`);
}); 
