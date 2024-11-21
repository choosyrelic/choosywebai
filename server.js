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
    timestamp: new Date().toISOString()
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

// Direct communication with Ollama
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
    // Direct communication with Ollama
    const ollamaResponse = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama2',
      prompt: `${userName}: ${userMessage}\nAssistant:`,
      stream: false
    });

    const aiReply = ollamaResponse.data.response;

    const conversation = {
      user: {
        name: userName,
        message: userMessage,
        timestamp
      },
      ai: {
        message: aiReply,
        timestamp: new Date().toISOString()
      }
    };

    chatHistory.unshift(conversation);
    if (chatHistory.length > MAX_HISTORY) {
      chatHistory.pop();
    }

    console.log(`Message from ${userName}: ${userMessage}`);
    console.log(`AI response: ${aiReply}`);

    res.json({
      reply: aiReply,
      timestamp: conversation.ai.timestamp
    });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to communicate with AI service',
      details: error.message 
    });
  }
});

// Export the app for Vercel
module.exports = app; 
