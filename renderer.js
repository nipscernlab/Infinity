const { ipcRenderer } = require('electron');

const fs = require('fs');
const path = require('path');
const os = require('os');
// Get the user's home directory
const homeDir = os.homedir();
const { shell } = require('electron');
const { app, ipcMain } = require('electron');



const software = [
    {
        id: 'vscode',
        name: 'Visual Studio Code',
        icon: `<img src="./icons/vscode.svg" alt="Visual Studio Code Icon" style="width: 64px; height: 64px;" />`
    },
    
    {
        id: 'brackets',
        name: 'Brackets',
        icon: `<img src="./icons/brackets.svg" alt="Brackets Icon" style="width: 64px; height: 64px;" />`
    },
    {
        id: 'drawio',
        name: 'Draw.io',
        icon: `<img src="./icons/drawio.svg" alt="Draw.io Icon" style="width: 64px; height: 64px;" />`
    },
    {
        id: 'sumatra',
        name: 'Sumatra PDF',
        icon: `<img src="./icons/sumatra.svg" alt="Sumatra PDF Icon" style="width: 64px; height: 64px;" />`
    },
    {
        id: 'sapho',
        name: 'SAPHO',
        icon: `<img src="./icons/sapho.png" alt="SAPHO Icon" style="width: 64px; height: 64px;" />`
    },
    {
        id: 'github-desktop',
        name: 'GitHub Desktop',
        icon: `<img src="./icons/github-desktop.png" alt="GitHub Desktop Icon" style="width: 64px; height: 64px;" />`
    },
    {
        id: 'visual-studio',
        name: 'Visual Studio',
        icon: `<img src="./icons/visual-studio.svg" alt="Visual Studio Icon" style="width: 64px; height: 64px;" />`
    },
    {
        id: 'firefox',
        name: 'Firefox',
        icon: `<img src="./icons/firefox.svg" alt="Firefox Icon" style="width: 64px; height: 64px;" />`
    },
    {
        id: 'quartus',
        name: 'Quartus',
        icon: `<img src="./icons/quartus.png" alt="Quartus Icon" style="width: 64px; height: 64px;" />`
    },
    {
        id: 'everything',
        name: 'Everything',
        icon: `<img src="./icons/everything.png" alt="Everything Icon" style="width: 64px; height: 64px;" />`
    },
    {
        id: 'codeblocks',
        name: 'Clode::Blocks',
        icon: `<img src="./icons/codeblocks.png" alt="Code::Blocks Icon" style="width: 64px; height: 64px;" />`
    },
    {
        id: 'inno-setup',
        name: 'Inno Setup',
        icon: `<img src="./icons/inno-setup.png" alt="Inno Setup Icon" style="width: 94px; height: 64px;" />`
    }
];

const softwareInfo = {
    vscode: {
        description: "Visual Studio Code is a source code editor developed by Microsoft for Windows, Linux, and macOS.",
        version: "1.64.0",
        website: "https://code.visualstudio.com/"
    },
    brackets: {
        description: "Brackets is a modern, open-source text editor that understands web design.",
        version: "1.14.2",
        website: "http://brackets.io/"
    },
    drawio: {
        description: "Draw.io is an online diagramming tool to create flowcharts and other diagrams.",
        version: "14.0.0",
        website: "https://www.diagrams.net/"
    },
    sumatra: {
        description: "Sumatra PDF is a lightweight PDF, eBook (ePub, Mobi), and comic book reader for Windows.",
        version: "3.4.5",
        website: "https://www.sumatrapdfreader.org/free-pdf-reader.html"
    },
    sapho: {
        description: "SAPHO is a scalable architecture processor for hardware optimization.",
        version: "1.0.0",
        website: "https://example.com/sapho" // Update with actual link
    },
    "github-desktop": {
        description: "GitHub Desktop is a seamless way to contribute to projects on GitHub and GitHub Enterprise.",
        version: "2.9.3",
        website: "https://desktop.github.com/"
    },
    "visual-studio": {
        description: "Visual Studio is an integrated development environment (IDE) from Microsoft for developing applications.",
        version: "2022",
        website: "https://visualstudio.microsoft.com/"
    },
    firefox: {
        description: "Mozilla Firefox is a free and open-source web browser developed by the Mozilla Foundation.",
        version: "111.0",
        website: "https://www.mozilla.org/firefox/"
    },
    quartus: {
        description: "Quartus Prime is a software suite for FPGA design and programming, developed by Intel.",
        version: "22.1",
        website: "https://www.intel.com/content/www/us/en/programmable/quartus-prime/overview.html"
    },
    everything: {
        description: "Everything is a desktop search utility for Windows that can locate files and folders by name instantly.",
        version: "1.4.1.1009",
        website: "https://www.voidtools.com/"
    },
    codeblocks: {
        description: "Code::Blocks is a free, open-source C, C++, and Fortran IDE built to meet the most demanding needs of its users.",
        version: "20.03",
        website: "http://www.codeblocks.org/"
    },
    "inno-setup": {
        description: "Inno Setup is a free installer for Windows programs, providing a simple way to create installers.",
        version: "6.2.0",
        website: "https://jrsoftware.org/isinfo.php"
    }
};



const downloadStates = new Map();

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function createDownloadCard(softwareItem) {
    const card = document.createElement('div');
    card.className = 'download-card';
    card.innerHTML = `
        <div class="download-header">
            <div class="software-info">
                ${softwareItem.icon}
                <h3>${softwareItem.name}</h3>
            </div>
            <span class="status">Ready to download</span>
        </div>
        <div class="software-details">
            <p>${softwareInfo[softwareItem.id].description}</p>
            <p><strong>Version:</strong> ${softwareInfo[softwareItem.id].version}</p>
            <a href="${softwareInfo[softwareItem.id].website}" target="_blank">Learn more</a><br><br>
        </div>
        <div class="progress-bar">
            <div class="progress" id="${softwareItem.id}-progress"></div>
        </div>
        <div class="size-info" id="${softwareItem.id}-size"></div>
        <div class="buttons" id="${softwareItem.id}-buttons">
            <button class="download-btn" onclick="startDownload('${softwareItem.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Download
            </button>
            <button class="pause-btn" onclick="pauseDownload('${softwareItem.id}')" style="display: none">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>
                </svg>
                Pause
            </button>
            <button class="resume-btn" onclick="resumeDownload('${softwareItem.id}')" style="display: none">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Resume
            </button>
            <button class="install-btn" onclick="openInstaller('${softwareItem.id}')" disabled>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
                Install
            </button>
            <button class="cancel-btn" onclick="cancelDownload('${softwareItem.id}')" style="display: none">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Cancel
            </button>
        </div>
    `;
    return card;
}

// Initialize downloads
function initializeDownloads() {
    const container = document.getElementById('downloads-container');
    software.forEach(item => {
        container.appendChild(createDownloadCard(item));
        downloadStates.set(item.id, { progress: 0, completed: false });
    });
}

// Download handlers
window.startDownload = function(softwareId) {
    const buttonsContainer = document.getElementById(`${softwareId}-buttons`);
    const card = buttonsContainer.closest('.download-card');
    card.querySelector('.status').textContent = 'Downloading...';
    buttonsContainer.querySelector('.download-btn').style.display = 'none';
    buttonsContainer.querySelector('.pause-btn').style.display = 'inline-flex';
    ipcRenderer.send('start-download', softwareId);
};

window.pauseDownload = function(softwareId) {
    const buttonsContainer = document.getElementById(`${softwareId}-buttons`);
    const card = buttonsContainer.closest('.download-card');
    buttonsContainer.querySelector('.pause-btn').style.display = 'none';
    buttonsContainer.querySelector('.resume-btn').style.display = 'inline-flex';
    card.querySelector('.status').textContent = 'Paused';
    ipcRenderer.send('pause-download', softwareId);
};

window.resumeDownload = function(softwareId) {
    const buttonsContainer = document.getElementById(`${softwareId}-buttons`);
    const card = buttonsContainer.closest('.download-card');
    buttonsContainer.querySelector('.resume-btn').style.display = 'none';
    buttonsContainer.querySelector('.pause-btn').style.display = 'inline-flex';
    card.querySelector('.status').textContent = 'Downloading...';
    ipcRenderer.send('resume-download', softwareId);
};

window.cancelDownload = function(softwareId) {
    const buttonsContainer = document.getElementById(`${softwareId}-buttons`);
    const card = buttonsContainer.closest('.download-card');
    buttonsContainer.querySelector('.cancel-btn').style.display = 'none'; // Hide cancel button
    buttonsContainer.querySelector('.pause-btn').style.display = 'none'; // Hide pause button
    buttonsContainer.querySelector('.resume-btn').style.display = 'none'; // Hide resume button
    buttonsContainer.querySelector('.download-btn').style.display = 'inline-flex'; // Show download button
    const progressBar = document.getElementById(`${softwareId}-progress`);
    progressBar.style.width = `0%`; // Reset progress bar
    const sizeInfo = document.getElementById(`${softwareId}-size`);
    sizeInfo.textContent = ''; // Clear size info
    card.querySelector('.status').textContent = 'Download cancelled';
    
    // Send IPC message to cancel download process
    ipcRenderer.send('cancel-download', softwareId);

    // Remove downloaded file if exists
    const downloadPath = path.join(os.homedir(), 'Downloads', `${softwareId}.exe`); // Update the file name as per your download logic
    fs.unlink(downloadPath, (err) => {
        if (err) {
            console.error(`Failed to delete ${downloadPath}:`, err);
        } else {
            console.log(`Deleted ${downloadPath}`);
        }
    });

    downloadStates.delete(softwareId); // Remove from download states
};

window.openInstaller = function(softwareId) {
    ipcRenderer.send('open-installer', softwareId);
};

// Theme switcher
const themeSwitch = document.getElementById('theme-switch');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function setTheme(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Handle search input
const searchInput = document.querySelector('.search-input'); // Adjust selector if needed

// Define valid software IDs and corresponding button IDs
const softwareButtonIds = {
    'vscode': 'vscode-id', // Adjust to actual ID if different
    'brackets': 'brackets-id',
    // Add other software mappings here
};

const infinityManagerPath = path.join(homeDir, 'Downloads', 'Infinity Manager'); // Replace with the actual path to the Infinity Manager folder
const PronPath = path.join('D:', 'notnotpron', '');

// Handle search input
searchInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const command = searchInput.value.trim().toLowerCase(); // Get and trim input value

        // Check for theme commands
        if (command === '/light') {
            setTheme(false); // Set to light theme
        } else if (command === '/dark') {
            setTheme(true); // Set to dark theme
        }
        
        // Check for download command
        else if (command.startsWith('/download-')) {
            const softwareId = command.split('/download-')[1]; // Extract the software ID
            if (softwareId) {
                startDownload(softwareId); // Directly call startDownload with the softwareId
            } else {
                console.log(`Invalid software ID: ${softwareId}`); // Optional feedback for invalid IDs
            }
        }
        
        // Check for open command
        else if (command === '/open') {
            shell.openPath(infinityManagerPath)
                .then(() => console.log('Infinity Manager folder opened'))
                .catch(error => console.error('Error opening folder:', error));
        }

        // Check for pron command
        else if (command === '/pron') {
            shell.openPath(PronPath)
                .then(() => console.log('Pron folder opened'))
                .catch(error => console.error('Error opening folder:', error));
        }

        // Check for delete command
        else if (command === '/del') {
            const clearDownloadsButton = document.getElementById('clear-downloads');
            clearDownloadsButton.click(); // Simulate button click
        }

        // Check for pause command
        else if (command.startsWith('/pause-')) {
            const softwareId = command.split('/pause-')[1]; // Extract the software ID
            const pauseButton = document.querySelector(`#${softwareId}-buttons .pause-btn`);
            if (pauseButton) {
                pauseButton.click(); // Simulate button click for pause
            } else {
                console.log(`No pause button found for software ID: ${softwareId}`); // Optional feedback
            }
        }

        // Check for resume command
        else if (command.startsWith('/resume-')) {
            const softwareId = command.split('/resume-')[1]; // Extract the software ID
            const resumeButton = document.querySelector(`#${softwareId}-buttons .resume-btn`);
            if (resumeButton) {
                resumeButton.click(); // Simulate button click for resume
            } else {
                console.log(`No resume button found for software ID: ${softwareId}`); // Optional feedback
            }
        }

        else if (command === '/help') {
            console.log(`Available commands:
            /light - Switch to light theme
            /dark - Switch to dark theme
            /download-<softwareId> - Start download for specified software
            /pause-<softwareId> - Pause download for specified software
            /resume-<softwareId> - Resume download for specified software
            /cancel-<softwareId> - Cancel download for specified software
            /status - Show current download statuses
            /open - Open the Infinity Manager folder
            /pron - Open the Pron folder
            /del - Clear all downloads`);
        }
        
        else if (command === '/clear') {
            searchInput.value = '';
            searchInput.focus(); // Focus back on the search input
        }
        
        else if (command.startsWith('/info-')) {
            const softwareId = command.split('/info-')[1];
            // Logic to retrieve and display software info
        }

        // Check for kill command
        if (command === '/kill') {
            console.log('Attempting to send close-app message...');
            const confirmExit = confirm('Are you sure you want to exit the application?');
            if (confirmExit) {
                ipcRenderer.send('close-app');
                console.log('close-app message sent');
            }
        }

        // Clear the search input after command execution
        searchInput.value = '';
    }
});




// Initialize theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    setTheme(savedTheme === 'dark');
} else {
    setTheme(prefersDark.matches);
}

themeSwitch.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setTheme(!isDark);
});

// Event listeners
ipcRenderer.on('download-progress', (event, { software, progress }) => {
    const progressBar = document.getElementById(`${software}-progress`);
    const sizeInfo = document.getElementById(`${software}-size`);
    const percentage = Math.floor(progress.percent * 100);
    progressBar.style.width = `${percentage}%`;
    const card = progressBar.closest('.download-card');
    card.querySelector('.status').textContent = `Downloading: ${percentage}%`;
    sizeInfo.textContent = `${formatSize(progress.transferred)} / ${formatSize(progress.total)}`;
});

ipcRenderer.on('download-complete', (event, { software }) => {
    const progressBar = document.getElementById(`${software}-progress`);
    const card = progressBar.closest('.download-card');
    const buttonsContainer = document.getElementById(`${software}-buttons`);
    card.querySelector('.status').textContent = 'Download Complete';
    buttonsContainer.querySelector('.pause-btn').style.display = 'none';
    buttonsContainer.querySelector('.resume-btn').style.display = 'none';
    buttonsContainer.querySelector('.install-btn').disabled = false;
    downloadStates.get(software).completed = true;
});


ipcRenderer.on('download-error', (event, { software, error }) => {
    const progressBar = document.getElementById(`${software}-progress`);
    const card = progressBar.closest('.download-card');
    const buttonsContainer = document.getElementById(`${software}-buttons`);
    card.querySelector('.status').textContent = `Error: ${error}`;
    buttonsContainer.querySelector('.download-btn').style.display = 'inline-flex';
    buttonsContainer.querySelector('.pause-btn').style.display = 'none';
    buttonsContainer.querySelector('.resume-btn').style.display = 'none';
});

ipcRenderer.on('download-paused', (event, { software }) => {
    const progressBar = document.getElementById(`${software}-progress`);
    const card = progressBar.closest('.download-card');
    card.querySelector('.status').textContent = 'Paused';
});


// Initialize the downloads when the page loads
document.addEventListener('DOMContentLoaded', initializeDownloads);

// Construct the path to the downloads folder
const downloadsFolder = path.join(homeDir, 'Downloads', 'Infinity Manager');

document.getElementById('clear-downloads').addEventListener('click', () => {
    // Confirm action
    const confirmation = confirm("Are you sure you want to delete all downloaded software?");
    if (confirmation) {
        fs.readdir(downloadsFolder, (err, files) => {
            if (err) {
                console.error("Could not list the directory.", err);
                return;
            }

            // Delete each file in the directory
            files.forEach((file) => {
                const filePath = path.join(downloadsFolder, file);
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error(`Error deleting file ${filePath}`, err);
                    }
                });
            });

            alert("All downloads have been cleared.");
        });
    }
    
});

document.getElementById('open-folder-btn').addEventListener('click', () => {
    ipcRenderer.send('open-infinity-folder');
});
// Handle the close-app message from renderer
ipcMain.on('close-app', () => {
    console.log('Received close-app message. Force quitting application...');
    app.quit(); // Force the app to quit
});
