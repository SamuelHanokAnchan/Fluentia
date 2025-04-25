/**
 * Fluentia - Software Planning Tool
 * Workspace Module - Handles workspace manipulation (zoom, pan, grid)
 */

// Set up zoom controls
function setupZoomControls() {
    const workspace = document.getElementById('workspace');
    const zoomIn = document.getElementById('zoomIn');
    const zoomOut = document.getElementById('zoomOut');
    const resetZoom = document.getElementById('resetZoom');
    
    if (!workspace || !zoomIn || !zoomOut || !resetZoom) return;
    
    // Zoom in button
    zoomIn.addEventListener('click', () => {
        zoomWorkspace(ZOOM_STEP);
    });
    
    // Zoom out button
    zoomOut.addEventListener('click', () => {
        zoomWorkspace(-ZOOM_STEP);
    });
    
    // Reset button
    resetZoom.addEventListener('click', () => {
        resetWorkspaceView();
    });
    
    // Mouse wheel zoom
    workspace.addEventListener('wheel', (e) => {
        e.preventDefault();
        
        // Get mouse position relative to workspace
        const rect = workspace.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Determine zoom direction
        if (e.deltaY < 0 && currentZoom < MAX_ZOOM) {
            // Zoom in
            zoomWorkspace(ZOOM_STEP);
        } else if (e.deltaY > 0 && currentZoom > MIN_ZOOM) {
            // Zoom out
            zoomWorkspace(-ZOOM_STEP);
        }
    });
}

// Function to zoom workspace by a given delta
function zoomWorkspace(delta) {
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + delta));
    
    // Only update if zoom actually changed
    if (newZoom !== currentZoom) {
        currentZoom = newZoom;
        applyTransform();
    }
}

// Reset workspace view (zoom and pan)
function resetWorkspaceView() {
    currentZoom = 1;
    panX = 0;
    panY = 0;
    applyTransform();
}

// Toggle workspace grid visibility
function toggleWorkspaceGrid() {
    const workspace = document.getElementById('workspace');
    if (!workspace) return;
    
    if (workspace.style.backgroundImage) {
        // Grid is visible, hide it
        workspace.style.backgroundImage = 'none';
        showToast('Grid hidden', 'success');
    } else {
        // Grid is hidden, show it
        workspace.style.backgroundImage = `
            linear-gradient(to right, rgba(200, 200, 200, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(200, 200, 200, 0.2) 1px, transparent 1px)
        `;
        workspace.style.backgroundSize = '20px 20px';
        showToast('Grid shown', 'success');
    }
}

// Set up panning functionality
function setupPanning() {
    const workspace = document.getElementById('workspace');
    const container = document.getElementById('workspaceContainer');
    
    if (!workspace || !container) return;
    
    // Mouse down on workspace (not on a node)
    workspace.addEventListener('mousedown', (e) => {
        // Only start panning if clicking directly on the workspace (not on a node or connection)
        if (e.target === workspace) {
            isDragging = true;
            startX = e.clientX - panX;
            startY = e.clientY - panY;
            workspace.style.cursor = 'grabbing';
        }
    });
    
    // Mouse move
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        panX = e.clientX - startX;
        panY = e.clientY - startY;
        applyTransform();
    });
    
    // Mouse up - stop panning
    document.addEventListener('mouseup', () => {
        isDragging = false;
        workspace.style.cursor = 'default';
    });
    
    // Mouse leave - stop panning
    container.addEventListener('mouseleave', () => {
        isDragging = false;
        workspace.style.cursor = 'default';
    });
}

// Apply transform to workspace (zoom and pan)
function applyTransform() {
    const workspace = document.getElementById('workspace');
    if (!workspace) return;
    
    workspace.style.transform = `scale(${currentZoom}) translate(${panX / currentZoom}px, ${panY / currentZoom}px)`;
    
    // Update jsPlumb zoom level
    if (jsPlumbInstance) {
        jsPlumbInstance.setZoom(currentZoom);
        
        // Repaint all connections after zooming/panning
        jsPlumbInstance.repaintEverything();
    }
}

// Setup connection type selector
function setupConnectionTypeSelector() {
    const connectionType = document.getElementById('connectionType');
    if (!connectionType) return;
    
    connectionType.addEventListener('change', (e) => {
        const type = e.target.value;
        
        if (!jsPlumbInstance) return;
        
        let connectorSettings;
        switch(type) {
            case 'straight':
                connectorSettings = ['Straight'];
                break;
            case 'flowchart':
                connectorSettings = ['Flowchart', { cornerRadius: 5 }];
                break;
            case 'bezier':
                connectorSettings = ['Bezier', { curviness: 50 }];
                break;
            default:
                connectorSettings = ['Straight'];
        }
        
        // Apply new settings to default connections
        jsPlumbInstance.importDefaults({
            Connector: connectorSettings
        });
        
        // Apply new settings to existing connections
        jsPlumbInstance.getConnections().forEach(connection => {
            connection.setConnector(connectorSettings);
        });
        
        // Repaint all connections
        jsPlumbInstance.repaintEverything();
        
        showToast(`Connection style updated to ${type}`, 'success');
    });
}

// Clear the workspace
function clearWorkspace() {
    if (jsPlumbInstance) {
        // Remove all connections
        jsPlumbInstance.deleteEveryConnection();
        
        // Remove all endpoints
        jsPlumbInstance.deleteEveryEndpoint();
    }
    
    // Clear the workspace
    const workspace = document.getElementById('workspace');
    if (workspace) {
        workspace.innerHTML = '';
    }
    
    // Reset history
    commandHistory = [];
    historyIndex = -1;
    updateUndoRedoButtons();
}

// Initialize workspace for jsPlumb
// Initialize workspace for jsPlumb
function initWorkspace() {
    const workspace = document.getElementById('workspace');
    const container = document.getElementById('workspaceContainer');
    
    if (!workspace || !container) return;
    
    // Initialize jsPlumb
    jsPlumbInstance.setContainer(workspace);
    
    // Configure jsPlumb defaults
    jsPlumbInstance.importDefaults({
        ConnectionsDetachable: true,
        ReattachConnections: true,
        ConnectionOverlays: [
            ["Arrow", { location: 1, id: 'arrow', width: 10, length: 10 }]
        ]
    });
    
    // Set up zoom controls
    setupZoomControls();
    
    // Set up panning
    setupPanning();
    
    // Make workspace droppable with jQuery UI
    try {
        $("#workspace").droppable({
            accept: ".added-item",
            drop: function(event, ui) {
                try {
                    // Get the original element (not the helper clone)
                    const originalItem = ui.helper.data('original-item') || ui.draggable;
                    
                    // Get tool data
                    const toolData = JSON.parse($(originalItem).attr('data-tool'));
                    
                    // Create a unique ID for the new node
                    toolCounter++;
                    const id = `tool-${toolCounter}`;
                    
                    // Get drop position relative to the workspace considering zoom and pan
                    const workspaceOffset = $(workspace).offset();
                    const x = (ui.offset.left - workspaceOffset.left) / currentZoom;
                    const y = (ui.offset.top - workspaceOffset.top) / currentZoom;
                    
                    // Create the node in the workspace
                    setTimeout(() => {
                        createToolNode(id, toolData, x, y);
                    }, 0);
                    
                    // Remove the original item from the left pane
                    $(originalItem).remove();
                } catch (error) {
                    console.error("Error during drop:", error);
                    showToast("Error adding tool to workspace", "error");
                }
            }
        });
    } catch (error) {
        console.error("Error setting up droppable:", error);
    }
    
    // Setup connection type selector
    setupConnectionTypeSelector();
    
    // Setup context menu for connections
    setupContextMenu();
    
    // Bind connection events - call our new function
    bindConnectionEvents();
}