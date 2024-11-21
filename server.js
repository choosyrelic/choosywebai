const express = require('express');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const path = require('path');
const cookieParser = require('cookie-parser'); // Add cookie-parser for reading cookies
const rateLimit = require('express-rate-limit');

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

  // Spawn a new process to run the Ollama AI command
  const ollama = spawn('/usr/local/bin/ollama', ['run', 'ChoosyAI']);

  let responseText = ''; // Variable to store the response from Ollama

  // Listen for data from the spawned process's stdout
  ollama.stdout.on('data', (data) => {
    responseText += data.toString(); // Append data to responseText as it streams in
  });

  // Handle process closure and send response back to client
  ollama.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).json({ error: 'Error running Ollama locally' });
    }
    
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
    
    console.log(`ChoosyAI: ${responseText.trim()}`);
    res.json({ 
      reply: responseText.trim(),
      timestamp: conversation.ai.timestamp
    });
  });

  // Add error handling for the spawn process
  ollama.on('error', (error) => {
    console.error('Ollama process error:', error);
    res.status(500).json({ error: 'Failed to start Ollama process' });
  });

  // Send the formatted message to Ollama's stdin
  ollama.stdin.write(`${formattedMessage}\n`);
  ollama.stdin.end();
});

// Start the server and listen on port 3000
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
