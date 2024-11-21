const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser'); // Add cookie-parser for reading cookies
const rateLimit = require('express-rate-limit');
const { exec } = require('child_process'); // Use exec to run curl command

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
app.post('/chat', (req, res) => {
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

  // Construct curl command
  const curlCommand = `curl -X POST https://559f-103-57-84-63.ngrok-free.app/api/generate -H "Content-Type: application/json" -d '{"prompt": "${formattedMessage}"}'`;

  // Execute the curl command
  exec(curlCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`curl error: ${error}`);
      return res.status(500).json({ error: 'Failed to fetch response from custom API' });
    }

    const responseText = stdout.trim();

    // Store messages in history
    const conversation = {
      user: {
        name: userName,
        message: userMessage,
        timestamp
      },
      ai: {
        message: responseText,
        timestamp: new Date().toISOString()
      }
    };

    chatHistory.unshift(conversation);
    if (chatHistory.length > MAX_HISTORY) {
      chatHistory.pop();
    }

    console.log(`Custom API: ${responseText}`);
    res.json({
      reply: responseText,
      timestamp: conversation.ai.timestamp
    });
  });
});

// Start the server (port removed as per request)
console.log('Server setup complete');
