/**
 * Fluentia - Software Planning Tool
 * UI Module - Handles modals, dropdowns, and other UI components
 */

// Initialize modal handlers
function initModalHandlers() {
    const openModalBtn = document.getElementById('openModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const saveBtn = document.getElementById('saveBtn');
    const newProjectBtn = document.getElementById('newProject');
    
    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            if (modal) modal.style.display = 'flex';
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (modal) {
                modal.style.display = 'none';
                document.getElementById('nameInput').style.display = 'none';
                // Clear selected project type
                localStorage.removeItem('selectedProjectType');
            }
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const projectNameInput = document.querySelector('.project-name-input');
            
            if (projectNameInput && projectNameInput.value.trim()) {
                const projectName = projectNameInput.value.trim();
                const projectNameElement = document.getElementById('projectName');
                
                // Get selected project type
                const selectedProjectType = localStorage.getItem('selectedProjectType');
                if (!selectedProjectType) {
                    showToast("No project type selected", "error");
                    return;
                }
                
                // Store project type with project
                if (projectNameElement) {
                    projectNameElement.textContent = projectName;
                    projectNameElement.setAttribute('data-project-type', selectedProjectType);
                }
                
                if (modal) {
                    modal.style.display = 'none';
                    document.getElementById('nameInput').style.display = 'none';
                }
                
                // Show workspace and hide project button
                const openModalBtn = document.getElementById('openModal');
                const workspaceContainer = document.getElementById('workspaceContainer');
                
                if (openModalBtn) openModalBtn.style.display = 'none';
                if (workspaceContainer) {
                    workspaceContainer.style.display = 'block';
                    
                    // Initialize workspace
                    initWorkspace();
                    
                    // Show success message
                    showToast(`Project "${projectName}" created successfully`, 'success');
                }
            }
        });
    }
    
    // New Project button in File menu
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Check if workspace exists and has content
            const workspace = document.getElementById('workspace');
            if (workspace && workspace.children.length > 0) {
                // Ask for confirmation
                showConfirmation(
                    'New Project',
                    'Creating a new project will discard your current changes. Are you sure you want to proceed?',
                    () => {
                        // Clear workspace and show modal
                        clearWorkspace();
                        if (modal) modal.style.display = 'flex';
                        
                        // Hide workspace container and show the "Build a Project" button
                        const openModalBtn = document.getElementById('openModal');
                        const workspaceContainer = document.getElementById('workspaceContainer');
                        
                        if (openModalBtn) openModalBtn.style.display = 'block';
                        if (workspaceContainer) workspaceContainer.style.display = 'none';
                        
                        // Clear selected project type
                        localStorage.removeItem('selectedProjectType');
                    }
                );
            } else {
                // No content to lose, show modal directly
                if (modal) modal.style.display = 'flex';
                
                // Clear selected project type
                localStorage.removeItem('selectedProjectType');
            }
        });
    }
    
    // Handle confirmation modal buttons
    initConfirmationModal();
}

// Initialize dropdown menus
function initDropdownMenus() {
    // Make dropdowns clickable instead of hover
    const dropdownBtns = document.querySelectorAll('.dropdown-btn');
    
    dropdownBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Close any open dropdowns first
            const allDropdownContents = document.querySelectorAll('.dropdown-content');
            allDropdownContents.forEach(content => {
                if (content !== this.nextElementSibling) {
                    content.style.display = 'none';
                }
            });
            
            // Toggle this dropdown
            const dropdownContent = this.nextElementSibling;
            if (dropdownContent) {
                if (dropdownContent.style.display === 'block') {
                    dropdownContent.style.display = 'none';
                } else {
                    dropdownContent.style.display = 'block';
                }
            }
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.dropdown')) {
            const allDropdownContents = document.querySelectorAll('.dropdown-content');
            allDropdownContents.forEach(content => {
                content.style.display = 'none';
            });
        }
    });

    // Connect View menu zoom options to workspace zoom controls
    const menuZoomIn = document.getElementById('menuZoomIn');
    const menuZoomOut = document.getElementById('menuZoomOut');
    const menuResetZoom = document.getElementById('menuResetZoom');
    const toggleGrid = document.getElementById('toggleGrid');
    
    if (menuZoomIn) {
        menuZoomIn.addEventListener('click', (e) => {
            e.preventDefault();
            zoomWorkspace(ZOOM_STEP);
        });
    }

    if (menuZoomOut) {
        menuZoomOut.addEventListener('click', (e) => {
            e.preventDefault();
            zoomWorkspace(-ZOOM_STEP);
        });
    }

    if (menuResetZoom) {
        menuResetZoom.addEventListener('click', (e) => {
            e.preventDefault();
            resetWorkspaceView();
        });
    }
    
    if (toggleGrid) {
        toggleGrid.addEventListener('click', (e) => {
            e.preventDefault();
            toggleWorkspaceGrid();
        });
    }
    
    // Save project handler
    const saveProjectBtns = document.querySelectorAll('.save-project');
    saveProjectBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            saveProject();
        });
    });
    
    // Load project handler
    const loadProjectBtns = document.querySelectorAll('.load-project');
    loadProjectBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            loadProject();
        });
    });
    
    // Status selection handling
    const statusItems = document.querySelectorAll('.status-item');
    statusItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get the status data
            const status = item.getAttribute('data-status');
            const statusText = item.textContent.trim();
            
            // Update the status button
            const statusBtn = document.getElementById('statusBtn');
            if (statusBtn) {
                const statusIndicator = statusBtn.querySelector('.status-indicator');
                const statusTextElement = statusBtn.querySelector('.status-text');
                
                if (statusIndicator) {
                    statusIndicator.className = 'status-indicator ' + status;
                }
                
                if (statusTextElement) {
                    statusTextElement.textContent = statusText;
                }
            }
            
            // Close the dropdown
            const statusDropdown = document.getElementById('statusDropdown');
            if (statusDropdown) {
                statusDropdown.style.display = 'none';
            }
            
            // Show feedback toast
            showToast(`Project status updated to: ${statusText}`, 'success');
        });
    });
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Add close button handler
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        });
    }
    
    // Show toast
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);
    
    // Auto close after duration
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }
    }, TOAST_DURATION);
}

// Toggle loading overlay
function toggleLoading(show, message = "Loading...") {
    if (!loadingOverlay) return;
    
    const loadingText = loadingOverlay.querySelector('.loading-text');
    if (loadingText) {
        loadingText.textContent = message;
    }
    
    loadingOverlay.style.display = show ? 'flex' : 'none';
}