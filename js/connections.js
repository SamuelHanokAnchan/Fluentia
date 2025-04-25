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

// Setup hover handlers for all connections
function setupConnectionHoverHandlers() {
    if (!jsPlumbInstance) return;
    
    // Bind to connection events
    jsPlumbInstance.bind("connection", function(info) {
        setupSingleConnectionHover(info.connection);
    });
    
    // Add hover handlers to existing connections
    const connections = jsPlumbInstance.getAllConnections();
    connections.forEach(conn => {
        setupSingleConnectionHover(conn);
    });
}

// Setup hover handler for a single connection
function setupSingleConnectionHover(connection) {
    $(connection.canvas).hover(
        // Mouse enter
        function(event) {
            // Only show if the connection has code
            if (connection.codeSnippet && connection.codeSnippet.trim() !== "") {
                showConnectionCode(connection, event);
            }
        },
        // Mouse leave
        function() {
            hideConnectionCode();
        }
    );
    
    // Also track mouse movement while hovering to update the modal position
    $(connection.canvas).mousemove(function(event) {
        if (connection.codeSnippet && 
            connection.codeSnippet.trim() !== "" && 
            $('#connectionCodeModal').is(':visible')) {
            showConnectionCode(connection, event);
        }
    });
}