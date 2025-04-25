/**
 * Fluentia - Software Planning Tool
 * Connections Module - Handles jsPlumb connections
 */

// Add jsPlumb endpoints to a node
function addEndpointsToNode(id) {
    if (!jsPlumbInstance) return;
    
    // Add endpoints at the appropriate positions
    const endpointOptions = {
        isSource: true,
        isTarget: true,
        connector: ["Straight"],
        maxConnections: -1,
        endpoint: ["Dot", { radius: 5 }],
        paintStyle: { fill: "#3b82f6" },
        hoverPaintStyle: { fill: "#10b981" },
        // Add a callback to track connections for undo/redo
        beforeDrop: function(params) {
            // Store connection info for history
            addToHistory({
                type: 'addConnection',
                sourceId: params.sourceId,
                targetId: params.targetId,
                connection: null // Will be filled in after connect
            });
            
            // Get the tool names for the connected nodes
            const sourceNode = document.getElementById(params.sourceId);
            const targetNode = document.getElementById(params.targetId);
            
            if (sourceNode && targetNode) {
                const sourceToolName = sourceNode.querySelector('.tool-node-title')?.textContent || 'Unknown Tool';
                const targetToolName = targetNode.querySelector('.tool-node-title')?.textContent || 'Unknown Tool';
                
                // Get the connection that was just created (with slight delay to ensure it exists)
                setTimeout(() => {
                    const connections = jsPlumbInstance.getConnections({
                        source: params.sourceId,
                        target: params.targetId
                    });
                    
                    if (connections && connections.length > 0) {
                        const conn = connections[0];
                        
                        // Initialize with empty code snippet
                        conn.codeSnippet = "";
                        
                        // Trigger the AI chat with these tools
                        showAiChatForConnectedTools(sourceToolName, targetToolName, conn);
                    }
                }, 300);
            }
            
            // Allow the connection
            return true;
        }
    };
    
    // Top endpoint
    jsPlumbInstance.addEndpoint(id, { ...endpointOptions, anchor: "TopCenter" });
    
    // Right endpoint
    jsPlumbInstance.addEndpoint(id, { ...endpointOptions, anchor: "RightMiddle" });
    
    // Bottom endpoint
    jsPlumbInstance.addEndpoint(id, { ...endpointOptions, anchor: "BottomCenter" });
    
    // Left endpoint
    jsPlumbInstance.addEndpoint(id, { ...endpointOptions, anchor: "LeftMiddle" });
}

// Setup context menu for connections
function setupContextMenu() {
    if (!jsPlumbInstance) return;
    
    // Setup hover handlers for all connections
    setupConnectionHoverHandlers();
    
    // Context menu for connections
    jsPlumbInstance.bind("contextmenu", function (component, event) {
        event.preventDefault();
        
        if ($(component).hasClass("jtk-connector")) {
            // Remove any existing context menus
            $(".custom-menu").remove();
            
            // Create custom menu for connection with AI code generation option
            $("<div class='custom-menu'><button class='delete-btn'>Delete Connection</button><button class='ai-code-btn'>Generate Code</button></div>")
                .appendTo("body")
                .css({top: event.pageY + "px", left: event.pageX + "px"});
                
            // Store reference to the connection
            window.selectedConnection = component;
        }
    });
    
    // Handle connection deletion
    $("body").on("click", ".delete-btn", function () {
        if (window.selectedConnection) {
            // Get connection info for history
            const conn = window.selectedConnection;
            
            // Add to history
            addToHistory({
                type: 'removeConnection',
                sourceId: conn.sourceId,
                targetId: conn.targetId,
                connection: conn
            });
            
            // Delete the connection
            jsPlumbInstance.deleteConnection(conn);
            window.selectedConnection = null;
            
            showToast("Connection deleted", "success");
        }
        $(".custom-menu").remove();
    });
    
    // Handle AI code generation button
    $("body").on("click", ".ai-code-btn", function () {
        if (window.selectedConnection) {
            const conn = window.selectedConnection;
            const sourceNode = document.getElementById(conn.sourceId);
            const targetNode = document.getElementById(conn.targetId);
            
            if (sourceNode && targetNode) {
                const sourceToolName = sourceNode.querySelector('.tool-node-title')?.textContent || 'Unknown Tool';
                const targetToolName = targetNode.querySelector('.tool-node-title')?.textContent || 'Unknown Tool';
                
                // Show the AI chat for this connection
                showAiChatForConnectedTools(sourceToolName, targetToolName, conn);
            }
            
            window.selectedConnection = null;
        }
        $(".custom-menu").remove();
    });
    
    // Remove context menu when clicking elsewhere
    $(document).on("click", function () {
        $(".custom-menu").remove();
    });
}

// This is the function that was missing but is referenced in workspace.js
function bindConnectionEvents() {
    if (!jsPlumbInstance) return;
    
    // Bind to connection events to add code icon and functionality
    jsPlumbInstance.bind("connection", function(info) {
        // Initialize connection properties
        info.connection.codeSnippet = info.connection.codeSnippet || "";
        
        // Update code icon for this connection
        updateCodeIconForConnection(info.connection);
    });
    
    // Apply to existing connections
    const connections = jsPlumbInstance.getAllConnections();
    connections.forEach(conn => {
        updateCodeIconForConnection(conn);
    });
}

// Add a code icon to a connection using overlays
function addCodeIconToConnection(connection) {
    try {
        // Remove any existing code icon overlay
        if (connection.codeIconOverlay) {
            connection.removeOverlay("codeIcon");
        }
        
        // Only add the overlay if the connection has code
        if (connection.codeSnippet && connection.codeSnippet.trim() !== "") {
            // Add an overlay to the connection
            connection.addOverlay([
                "Custom", {
                    id: "codeIcon",
                    create: function() {
                        // Create the element
                        const codeIcon = document.createElement('div');
                        codeIcon.className = 'code-icon-overlay';
                        codeIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>';
                        
                        // Add click handler
                        codeIcon.addEventListener('click', function(e) {
                            e.stopPropagation();
                            showCodeModal(connection);
                        });
                        
                        return codeIcon;
                    },
                    location: 0.5, // Middle of the connection
                    cssClass: "code-icon-container"
                }
            ]);
            
            // Store reference to the overlay
            connection.codeIconOverlay = true;
            
            // Highlight the connection
            if (jsPlumbInstance) {
                try {
                    jsPlumbInstance.select({source: connection.sourceId, target: connection.targetId}).addClass("has-code");
                } catch (err) {
                    console.log("Unable to add class to connection", err);
                }
            }
        }
    } catch (error) {
        console.error("Error adding code icon:", error);
    }
}

// Update the code icon for a connection
function updateCodeIconForConnection(connection) {
    try {
        // Check if connection has code
        if (connection.codeSnippet && connection.codeSnippet.trim() !== '') {
            addCodeIconToConnection(connection);
        } else if (connection.codeIconOverlay) {
            // If no code but overlay exists, remove it
            connection.removeOverlay("codeIcon");
            connection.codeIconOverlay = false;
        }
    } catch (error) {
        console.error("Error updating code icon:", error);
    }
}

// Setup hover handler for connections
function setupConnectionHoverHandlers() {
    if (!jsPlumbInstance) return;
    
    // Add hover handlers to all connections
    const connections = jsPlumbInstance.getAllConnections();
    connections.forEach(conn => {
        setupSingleConnectionHover(conn);
    });
}

// Setup hover handler for a single connection
function setupSingleConnectionHover(connection) {
    $(connection.canvas).hover(
        // Mouse enter - no action needed for overlay approach
        function() {},
        // Mouse leave - no action needed for overlay approach
        function() {}
    );
}

// Show code modal with connection code
function showCodeModal(connection) {
    if (!connection.codeSnippet) return;
    
    const codeModal = document.getElementById('connectionCodeModal');
    const codeBlock = document.getElementById('connectionCodeBlock');
    const codeTitle = document.getElementById('connectionCodeTitle');
    
    if (!codeModal || !codeBlock || !codeTitle) {
        console.error('Code modal elements not found');
        return;
    }
    
    // Get source and target tool names
    const sourceNode = document.getElementById(connection.sourceId);
    const targetNode = document.getElementById(connection.targetId);
    
    let title = "Connection Code";
    if (sourceNode && targetNode) {
        const sourceToolName = sourceNode.querySelector('.tool-node-title')?.textContent || 'Source';
        const targetToolName = targetNode.querySelector('.tool-node-title')?.textContent || 'Target';
        title = `${sourceToolName} → ${targetToolName}`;
    }
    
    // Set modal content
    codeTitle.textContent = title;
    codeBlock.textContent = connection.codeSnippet;
    
    // Position and show the modal in the center of the screen
    codeModal.style.display = 'block';
}