/**
 * Fluentia - Software Planning Tool
 * Core initialization module
 */

// ===== Configuration & Constants =====
// Project save key for localStorage
const SAVE_KEY = 'fluentia_project'; // LocalStorage save key

// Constants for events and settings
const MAX_HISTORY = 50; // Maximum number of actions to store
const MIN_ZOOM = 0.3; // Minimum zoom level
const MAX_ZOOM = 2; // Maximum zoom level
const ZOOM_STEP = 0.1; // How much to zoom in/out per step
const TOAST_DURATION = 3000; // Duration for toast notifications in ms

// ===== Global Variables =====
// DOM elements
let projectGrid, modal, searchInput, resultsDropdown, resultsContainer;
let confirmModal, confirmModalTitle, confirmModalMessage, confirmOkBtn, confirmCancelBtn;
let loadingOverlay;

// Variables for pan and zoom
let currentZoom = 1;
let panX = 0;
let panY = 0;
let isDragging = false;
let startX, startY;
let toolCounter = 0;
let jsPlumbInstance;

// Command history for undo/redo
let commandHistory = [];
let historyIndex = -1;

// Timeout for search debounce
let searchTimeoutId;

// Initializer functions that will run on page load
async function initApp() {
    // Cache DOM elements
    cacheElements();
    
    // Show loading indicator
    toggleLoading(true, "Loading application data...");
    
    try {
        // Load project data from JSON
        await loadProjectData();
        
        // Initialize project buttons from loaded data
        initProjectButtonsFromJSON();
        
        // Initialize modal handlers
        initModalHandlers();
        
        // Initialize search functionality
        initSearchFunctionality();
        
        // Initialize dropdown menus
        initDropdownMenus();
        
        // Initialize jsPlumb instance
        jsPlumbInstance = jsPlumb.getInstance({
            DragOptions: { cursor: 'pointer', zIndex: 2000 },
            ConnectionOverlays: [
                ['Arrow', { location: 1, id: 'arrow', width: 10, length: 10 }]
            ]
        });

        // Initialize undo/redo buttons
        initUndoRedo();
        
        // Initialize responsive layout
        initResponsiveLayout(); 
        
        // Initialize AI chat module
        initAiChat();
        
        console.log("Fluentia application initialized");
        
        // Hide loading indicator
        toggleLoading(false);
    } catch (error) {
        console.error("Error initializing application:", error);
        toggleLoading(false);
        showToast("Error initializing application: " + error.message, "error");
    }
}

// Cache DOM elements for performance
function cacheElements() {
    projectGrid = document.getElementById('projectGrid');
    modal = document.getElementById('modalOverlay');
    searchInput = document.getElementById('searchInput');
    resultsDropdown = document.getElementById('resultsDropdown');
    resultsContainer = document.getElementById('resultsContainer');
    
    // Confirmation modal elements
    confirmModal = document.getElementById('confirmModalOverlay');
    confirmModalTitle = document.getElementById('confirmModalTitle');
    confirmModalMessage = document.getElementById('confirmModalMessage');
    confirmOkBtn = document.getElementById('confirmOkBtn');
    confirmCancelBtn = document.getElementById('confirmCancelBtn');
    
    // Close buttons for modals
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const confirmModalCloseBtn = document.getElementById('confirmModalCloseBtn');
    
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            document.getElementById('nameInput').style.display = 'none';
        });
    }
    
    if (confirmModalCloseBtn) {
        confirmModalCloseBtn.addEventListener('click', () => {
            confirmModal.style.display = 'none';
        });
    }
    
    // Loading overlay
    loadingOverlay = document.getElementById('loadingOverlay');
}

// Initialize confirmation modal handlers
function initConfirmationModal() {
    if (!confirmCancelBtn || !confirmOkBtn) return;
    
    confirmCancelBtn.addEventListener('click', () => {
        confirmModal.style.display = 'none';
    });
    
    // OK button will be set up when showing the confirmation modal
}

// Show a confirmation dialog
function showConfirmation(title, message, onConfirm) {
    if (!confirmModal || !confirmModalTitle || !confirmModalMessage || !confirmOkBtn) {
        console.error("Confirmation modal elements not found");
        return;
    }
    
    // Set content
    confirmModalTitle.textContent = title;
    confirmModalMessage.textContent = message;
    
    // Set confirm button action
    confirmOkBtn.onclick = () => {
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
        confirmModal.style.display = 'none';
    };
    
    // Show modal
    confirmModal.style.display = 'flex';
}

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);