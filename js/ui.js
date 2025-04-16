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
                
                if (projectNameElement) {
                    projectNameElement.textContent = projectName;
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
                    }
                );
            } else {
                // No content to lose, show modal directly
                if (modal) modal.style.display = 'flex';
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

// Initialize responsive layout
function initResponsiveLayout() {
    const leftPane = document.getElementById('leftPane');
    const rightPane = document.getElementById('rightPane');
    const toggleLeftPane = document.getElementById('toggleLeftPane');
    const toggleRightPane = document.getElementById('toggleRightPane');
    const showLeftPane = document.getElementById('showLeftPane');
    const showRightPane = document.getElementById('showRightPane');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    
    // Toggle left pane - ensure proper direct DOM manipulation
    if (toggleLeftPane && leftPane) {
        toggleLeftPane.addEventListener('click', function() {
            // Using direct style manipulation for more reliable behavior
            if (leftPane.classList.contains('collapsed')) {
                leftPane.classList.remove('collapsed');
                this.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';
            } else {
                leftPane.classList.add('collapsed');
                this.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';
            }
            
            // Log for debugging
            console.log("Left pane toggled, collapsed:", leftPane.classList.contains('collapsed'));
        });
    }
    
    // Toggle right pane - ensure proper direct DOM manipulation
    if (toggleRightPane && rightPane) {
        toggleRightPane.addEventListener('click', function() {
            // Using direct style manipulation for more reliable behavior  
            if (rightPane.classList.contains('collapsed')) {
                rightPane.classList.remove('collapsed');
                this.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';
            } else {
                rightPane.classList.add('collapsed');
                this.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';
            }
            
            // Log for debugging
            console.log("Right pane toggled, collapsed:", rightPane.classList.contains('collapsed'));
        });
    }
    
    // Show left pane button
    if (showLeftPane && leftPane) {
        showLeftPane.addEventListener('click', function() {
            console.log("Show left pane button clicked");
            leftPane.classList.remove('collapsed');
            if (toggleLeftPane) {
                toggleLeftPane.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';
            }
            showToast("Tools panel opened", "success");
        });
    }
    
    // Show right pane button
    if (showRightPane && rightPane) {
        showRightPane.addEventListener('click', function() {
            console.log("Show right pane button clicked");
            rightPane.classList.remove('collapsed');
            if (toggleRightPane) {
                toggleRightPane.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';
            }
            showToast("AI Suggestions panel opened", "success");
        });
    }
    
    // Direct click handlers as failsafe
    document.addEventListener('click', function(e) {
        // Check if the click was on one of our show buttons by class
        if (e.target.closest('.show-left-pane') && leftPane) {
            console.log("Show left pane button delegate clicked");
            leftPane.classList.remove('collapsed');
        }
        
        if (e.target.closest('.show-right-pane') && rightPane) {
            console.log("Show right pane button delegate clicked");
            rightPane.classList.remove('collapsed');
        }
    });
    
    // Mobile menu toggle
    if (mobileMenuToggle && mobileMenu) {
        // Populate mobile menu
        populateMobileMenu();
        
        mobileMenuToggle.addEventListener('click', () => {
            const isVisible = mobileMenu.style.display === 'flex';
            mobileMenu.style.display = isVisible ? 'none' : 'flex';
        });
        
        // Close mobile menu when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (mobileMenu.style.display === 'flex' && 
                !mobileMenu.contains(e.target) && 
                e.target !== mobileMenuToggle) {
                mobileMenu.style.display = 'none';
            }
        });
    }
    
    // Handle window resize
    window.addEventListener('resize', handleWindowResize);
    
    // Initial check
    handleWindowResize();
}

// Populate the mobile menu
function populateMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (!mobileMenu) return;
    
    // Clear existing content
    mobileMenu.innerHTML = '';
    
    // Add main menu items
    const menuItems = [
        { text: 'File', submenu: ['New', 'Import', 'Save', 'Load', 'Export as PDF', 'Move to...'] },
        { text: 'Edit', submenu: ['Undo', 'Redo', 'Cut', 'Copy', 'Paste', 'Find and Replace'] },
        { text: 'View', submenu: ['Zoom In', 'Zoom Out', 'Reset Zoom', 'Toggle Grid'] },
        { text: 'Insert', submenu: ['New Page', 'Import Page', 'Comment', 'PDF', 'Tool', 'Image'] },
        { text: 'Share', submenu: ['Add Collaborator', 'Copy Fluentia Link', 'Share Project', 'Publish'] },
        { text: 'Help', submenu: ['About', 'Find Feature', 'Learning Center', 'Community', 'Help Center'] }
    ];
    
    menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'mobile-menu-item';
        menuItem.textContent = item.text;
        menuItem.addEventListener('click', () => {
            // Logic for handling menu item click
            console.log('Mobile menu item clicked:', item.text);
            
            // Placeholder for submenu handling
            // In a real implementation, you might want to show a submenu here
        });
        
        mobileMenu.appendChild(menuItem);
    });
}

// Handle window resize for responsive layout
function handleWindowResize() {
    const width = window.innerWidth;
    const leftPane = document.getElementById('leftPane');
    const rightPane = document.getElementById('rightPane');
    
    if (width <= 768) {
        // Mobile view
        if (leftPane && !leftPane.classList.contains('collapsed')) {
            leftPane.classList.add('collapsed');
        }
        
        if (rightPane && !rightPane.classList.contains('collapsed')) {
            rightPane.classList.add('collapsed');
        }
    }
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