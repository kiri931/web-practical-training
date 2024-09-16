document.getElementById('sendButton').addEventListener('click', async () => {
    const userInput = document.getElementById('userInput').value;
    if (!userInput.trim()) return;

    // Display user message in chatbox
    appendMessage(userInput, 'user-message');

    // Clear input field
    document.getElementById('userInput').value = '';

    try {
        // Send message to Ollama API and handle streaming responses
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gemma2:2b',
                prompt: userInput
            })
        });

        if (!response.body) {
            throw new Error("No response body");
        }

        // Prepare to read the response body as a stream
        const reader = response.body.getReader();
        let decoder = new TextDecoder();
        let botMessageDiv = createBotMessageDiv(); // Create the initial bot message div
        appendToChatbox(botMessageDiv);

        let done = false;
        let botMessage = ''; // Store the accumulating message

        // Read the response body in chunks
        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
                let chunk = decoder.decode(value, { stream: true });

                // Parse the chunk as JSON
                let jsonChunks = chunk.trim().split('\n').filter(Boolean);
                jsonChunks.forEach(jsonChunk => {
                    let jsonResponse = JSON.parse(jsonChunk);
                    botMessage += jsonResponse.response;

                    // Update the bot message div with the latest text
                    botMessageDiv.textContent = botMessage;
                });

                // Scroll chatbox to the bottom
                scrollChatboxToBottom();
            }
        }

    } catch (error) {
        console.error('Error:', error);
        appendMessage('Sorry, something went wrong.', 'bot-message');
    }
});

// Function to create the bot message div
function createBotMessageDiv() {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'bot-message');
    messageDiv.textContent = '';
    return messageDiv;
}

// Function to append a message to the chatbox
function appendMessage(message, className) {
    const chatbox = document.getElementById('chatbox');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', className);
    messageDiv.textContent = message;
    chatbox.appendChild(messageDiv);

    scrollChatboxToBottom();
}

// Function to append an element to the chatbox
function appendToChatbox(element) {
    const chatbox = document.getElementById('chatbox');
    chatbox.appendChild(element);
}

// Function to scroll chatbox to the bottom
function scrollChatboxToBottom() {
    const chatbox = document.getElementById('chatbox');
    chatbox.scrollTop = chatbox.scrollHeight;
}
