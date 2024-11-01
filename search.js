const searchInput = document.querySelector('.search-input'); // Adjust selector if needed
let commandHistory = []; // Array to store previous commands
let historyIndex = -1; // To track the current index in history

searchInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const command = searchInput.value.trim().toLowerCase();

        // Add command to history and reset index
        if (command) {
            commandHistory.push(command); // Store command in history
            historyIndex = commandHistory.length; // Reset index to end
        }

        // (Existing command handling logic goes here...)

        // Clear the search input after command execution
        searchInput.value = '';
    } else if (event.key === 'ArrowUp') {
        // Navigate up through command history
        if (historyIndex > 0) {
            historyIndex--; // Move back in history
            searchInput.value = commandHistory[historyIndex]; // Display previous command
        }
        event.preventDefault(); // Prevent default behavior
    } else if (event.key === 'ArrowDown') {
        // Navigate down through command history
        if (historyIndex < commandHistory.length - 1) {
            historyIndex++; // Move forward in history
            searchInput.value = commandHistory[historyIndex]; // Display next command
        } else {
            historyIndex = commandHistory.length; // Reset to end
            searchInput.value = ''; // Clear input
        }
        event.preventDefault(); // Prevent default behavior
    }
});
