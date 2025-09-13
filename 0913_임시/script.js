document.addEventListener('DOMContentLoaded', () => {
    var _a;
    const chatInput = document.getElementById('chatinput');
    const sendButton = document.getElementById('chatinput-send-message-button');
    if (chatInput && sendButton) {
        // Function to adjust textarea height
        const adjustTextareaHeight = () => {
            chatInput.style.height = 'auto'; // Reset height to recalculate
            const newHeight = Math.min(chatInput.scrollHeight, 200); // Max height 200px
            chatInput.style.height = `${newHeight}px`;
        };
        // Function to toggle send button disabled state
        const toggleSendButton = () => {
            sendButton.disabled = chatInput.value.trim() === '';
        };
        // Initial adjustment and button state
        adjustTextareaHeight();
        toggleSendButton();
        // Event listener for input to adjust height and toggle button
        chatInput.addEventListener('input', () => {
            adjustTextareaHeight();
            toggleSendButton();
        });
        // Optional: Handle form submission (e.g., sending message)
        (_a = sendButton.closest('form')) === null || _a === void 0 ? void 0 : _a.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevent default form submission
            const message = chatInput.value.trim();
            if (message) {
                console.log('Sending message:', message);
                // Here you would typically send the message to a backend or display it in the chat UI
                chatInput.value = ''; // Clear input after sending
                adjustTextareaHeight(); // Reset height
                toggleSendButton(); // Disable button
            }
        });
        console.log('Chatbox script initialized.');
    }
});
