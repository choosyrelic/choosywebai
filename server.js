const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser'); // Add cookie-parser for reading cookies
const rateLimit = require('express-rate-limit');
const axios = require('axios'); // Use axios for API calls

const app = express();

// Add in-memory storage for chat history
const chatHistory = [];
const MAX_HISTORY = 100;

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20 // limit each IP to 20 requests per minute
});

// Middleware for static files and JSON/body parsing
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(cookieParser()); // Use cookie-parser middleware
app.use('/chat', limiter);

// Add system status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Add chat history endpoint
app.get('/history', (req, res) => {
  res.json(chatHistory);
});

// Route to serve the main HTML file when accessing the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint to handle chat messages
app.post('/chat', async (req, res) => {
  // Input validation
  if (!req.body.message || typeof req.body.message !== 'string') {
    return res.status(400).json({ error: 'Invalid message format' });
  }
  if (req.body.message.length > 500) {
    return res.status(400).json({ error: 'Message too long (max 500 characters)' });
  }

  const userMessage = req.body.message.trim();
  const userName = req.cookies.userName || 'User';
  const timestamp = new Date().toISOString();

  // Format message with username to provide context for the AI
  const formattedMessage = `${userName}: ${userMessage}`;
  console.log(formattedMessage); // Log the formatted message

  try {
    const response = await axios.post('https://559f-103-57-84-63.ngrok-free.app/api/generate', {
      prompt: formattedMessage
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const responseText = response.data.reply;

    // Store messages in history
    const conversation = {
      user: {
        name: userName,
        message: userMessage,
        timestamp
      },
      ai: {
        message: responseText.trim(),
        timestamp: new Date().toISOString()
      }
    };

    chatHistory.unshift(conversation);
    if (chatHistory.length > MAX_HISTORY) {
      chatHistory.pop();
    }

    console.log(`Custom API: ${responseText.trim()}`);
    res.json({
      reply: responseText.trim(),
      timestamp: conversation.ai.timestamp
    });

  } catch (error) {
    console.error('API request error:', error);
    res.status(500).json({ error: 'Failed to fetch response from custom API' });
  }
});

// Start the server (port removed as per request)
console.log('Server setup complete');
