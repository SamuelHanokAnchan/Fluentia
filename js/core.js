/**
 * Fluentia - Software Planning Tool
 * Core initialization module
 */

// ===== Configuration & Constants =====
// Projects configuration
const PROJECTS = [
    'Application Development',
    'Desktop Development',
    'Full Stack Development',
    'Mobile Development',
    'Security Software Development',
    'API Development',
    'Cloud Computing',
    'Frontend Development',
    'Embedded Systems Development',
    'Data Engineering'
];

// Tools array - database of available tools 
const TOOLS = [
    { id: 17, name: 'API', logo_path: 'images/software_pics/API.png', category: 'General'},
    { id: 18, name: 'DataBase',  logo_path: 'images/software_pics/database.png', category: 'General' },
    { id: 20, name: 'Machine Learning Model', logo_path: 'images/software_pics/ml.png', category: 'General'},
    { id: 22, name: 'Kafka', logo_path: 'images/software_pics/kafka.png', category: 'Development'},
    { id: 23, name: 'Python', logo_path: 'images/software_pics/python.png', category: 'Development'},
    { id: 24, name: 'Front End', logo_path: 'images/software_pics/frontend.png', category: 'General'},
    { id: 25, name: 'Visualization', logo_path: 'images/software_pics/viz.jpg', category: 'General'},
    { id: 26, name: 'Web Application', logo_path: 'images/software_pics/webapp.jpg', category: 'General'},

    { id: 1, name: 'Yahoo Finance', logo_path: 'images/software_pics/Yahoo_finance.png', category: 'API' },
    { id: 2, name: 'NumPy', logo_path: 'images/software_pics/numpy.png', category: 'Python' },
    { id: 3, name: 'Pandas', logo_path: 'images/software_pics/pandas.png', category: 'Python' },
    { id: 4, name: 'Matplotlib', logo_path: 'images/software_pics/matplotlib.png', category: 'Python' },
    { id: 5, name: 'TensorFlow', logo_path: 'images/software_pics/tensorflow.png', category: 'Python' },
    { id: 6, name: 'Producer', logo_path: 'images/software_pics/producer.png', category: 'Kafka' },
    { id: 7, name: 'Broker', logo_path: 'images/software_pics/broker.png', category: 'Kafka' },
    { id: 8, name: 'Consumer', logo_path: 'images/software_pics/consumer.jpg', category: 'Kafka' },
    { id: 9, name: 'MongoDB', logo_path: 'images/software_pics/mongobd.png', category: 'Database' },
    { id: 10, name: 'Random Forest', logo_path: 'images/software_pics/ml.png', category: 'Machine Learning Model' },
    { id: 11, name: 'ARIMA', logo_path: 'images/software_pics/ml.png', category: 'Machine Learning Model' },
    { id: 12, name: 'Logistic Regression', logo_path: 'images/software_pics/ml.png', category: 'Machine Learning Model' },
    { id: 13, name: 'HTML, CSS, JS', logo_path: 'images/software_pics/HTML.png', category: 'Front end' },
    { id: 14, name: 'React', logo_path: 'images/software_pics/react.png', category: 'Front end' },
    { id: 15, name: 'Vue.js', logo_path: 'images/software_pics/vue.png', category: 'Front end' },
    { id: 16, name: 'Swift', logo_path: 'images/software_pics/swift.png', category: 'Front end' },
    { id: 21, name: 'Grafana', logo_path: 'images/software_pics/grafana.png', category: 'Visualization' },
    { id: 19, name: 'Flask', logo_path: 'images/software_pics/flask.png', category:'Web Application'}
];

// Mapping between main categories and their specific categories
const CATEGORY_MAP = {
    'Python': 'Python',
    'API': 'API',
    'DataBase': 'Database',
    'Machine Learning Model': 'Machine Learning Model',
    'Kafka': 'Kafka',
    'Front End': 'Front end',
    'Visualization': 'Visualization',
    'Web Application': 'Web Application'
};

// Constants for events and settings
const MAX_HISTORY = 50; // Maximum number of actions to store
const SAVE_KEY = 'fluentia_project'; // LocalStorage save key
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
function initApp() {
    // Cache DOM elements
    cacheElements();
    
    // Initialize project buttons
    initProjectButtons();
    
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
    
    console.log("Fluentia application initialized");
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

// Initialize project buttons
function initProjectButtons() {
    if (!projectGrid) return;
    
    PROJECTS.forEach(project => {
        const btn = document.createElement('button');
        btn.className = `btn ${project === 'Data Engineering' ? 'btn-primary' : 'btn-secondary'}`;
        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width: 1.25rem; height: 1.25rem;">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            ${project}
        `;
        btn.onclick = () => {
            if(project === 'Data Engineering') {
                document.getElementById('nameInput').style.display = 'block';
            }
        };
        projectGrid.appendChild(btn);
    });
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

// ===== Application Initialization =====
// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);