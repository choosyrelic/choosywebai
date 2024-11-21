const messagesContainer = document.getElementById('messages'); // Message display container
const setupContainer = document.getElementById('setup-container'); // Setup container
const usernameDisplay = document.getElementById('usernameDisplay'); // Username display container
const usernameText = document.getElementById('usernameText'); // Element to display the username
const profileIcon = document.getElementById('profile-icon'); // Profile icon

// Function to get a cookie by name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift(); // Return cookie value
}

// Check if user has a saved username in cookies, if not, show the setup container
document.addEventListener('DOMContentLoaded', () => {
    const userName = getCookie('userName'); // Retrieve username from cookies
    if (!userName) {
        setupContainer.style.display = 'block'; // Show the setup container if no username cookie
    } else {
        usernameText.innerText = userName; // Display username
        alert(`Welcome back, ${userName}!`); // Welcome back message
    }
});

// Function to send the user's message and display the response
const sendMessage = async () => {
    const messageInput = document.getElementById('message');
    const messageText = messageInput.value.trim(); // Get trimmed message input
    if (!messageText) return; // Exit if the input is empty

    // Create and display the user's message
    const userMessage = document.createElement('div');
    userMessage.classList.add('message', 'user'); // Add user message classes
    userMessage.innerText = messageText;
    messagesContainer.appendChild(userMessage); // Append user message to container
    messageInput.value = ''; // Clear input field
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to bottom

    // Send the message to the server and wait for the response
    const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }) // Send message as JSON
    });

    // Parse and display the bot's response
    const data = await response.json();
    const botMessage = document.createElement('div');
    botMessage.classList.add('message', 'bot'); // Add bot message classes
    botMessage.innerText = data.reply;

    // Make the bot message clickable to copy the reply to clipboard
    botMessage.onclick = () => {
        navigator.clipboard.writeText(data.reply); // Copy reply text to clipboard

        // Display a success message after copying
        const copySuccessMessage = document.createElement('div');
        copySuccessMessage.innerText = 'Copied!';
        copySuccessMessage.classList.add('copy-success');
        botMessage.appendChild(copySuccessMessage); // Append success message to bot message

        // Remove the success message after 1.5 seconds
        setTimeout(() => {
            botMessage.removeChild(copySuccessMessage);
        }, 1500);
    };

    messagesContainer.appendChild(botMessage); // Append bot message to container
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to show the new message
};

// Event listeners for sending messages
document.getElementById('send-btn').addEventListener('click', sendMessage); // On send button click
document.getElementById('message').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') sendMessage(); // On Enter key press
});

// Submit button functionality for setup
document.getElementById('submit-btn').addEventListener('click', function() {
    const username = document.getElementById('username').value; // Get username input
    if (username) {
        document.cookie = `userName=${username}; path=/; max-age=${60 * 60 * 24 * 365}`; // Save username as cookie for 1 year
        setupContainer.style.display = 'none'; // Close the setup container
        usernameText.innerText = username; // Display the entered username
        usernameDisplay.style.display = 'block'; // Show username display
        alert(`Welcome, ${username}!`); // Display welcome message
    } else {
        alert('Please enter your name'); // Prompt if no name is entered
    }
});

// Function to close the username display
function closeUsernameDisplay() {
    usernameDisplay.style.display = 'none'; // Hide the container
}

// Show username display when profile icon is clicked
profileIcon.addEventListener('click', () => {
    usernameDisplay.style.display = 'block'; // Show the username display
});
