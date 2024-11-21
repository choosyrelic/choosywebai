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
const BASE_URL = 'https://mkvcj2fz-3000.inc1.devtunnels.ms/'; // Your tunnel URL

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20 // Limit each IP to 20 requests per minute
});

// Middleware for static files, JSON/body parsing, and cookies
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

// Serve the main HTML file (index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Chat endpoint to handle user messages and respond with AI-generated responses
app.post('/chat', async (req, res) => {
  // Input validation for the chat message
  if (!req.body.message || typeof req.body.message !== 'string') {
    return res.status(400).json({ error: 'Invalid message format' });
  }
  if (req.body.message.length > 500) {
    return res.status(400).json({ error: 'Message too long (max 500 characters)' });
  }

  const userMessage = req.body.message.trim();
  const userName = req.cookies.userName || 'User'; // Default to 'User' if no username is found in cookies
  const timestamp = new Date().toISOString();

  // Format message for AI (Ollama API)
  const formattedMessage = `${userName}: ${userMessage}`;

  try {
    // Send POST request to Ollama HTTP API
    const response = await axios.post('http://localhost:11434/', {
      message: formattedMessage // Sending the formatted message to Ollama API
    });

    const aiReply = response.data.reply.trim();

    // Store the conversation in the in-memory chat history
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

    // Add the conversation to the top of the chat history, and limit the history to MAX_HISTORY entries
    chatHistory.unshift(conversation);
    if (chatHistory.length > MAX_HISTORY) {
      chatHistory.pop(); // Remove the oldest message if exceeding the limit
    }

    console.log(`Message received from ${userName}: ${userMessage}`);
    console.log(`AI response: ${aiReply}`);

    // Respond with the AI's reply
    res.json({
      reply: aiReply,
      timestamp: conversation.ai.timestamp
    });

  } catch (error) {
    console.error('Error communicating with Ollama API:', error);
    res.status(500).json({ error: 'Failed to communicate with Ollama API' });
  }
});

// Start the server on port 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running and exposed at ${BASE_URL}`);
});
