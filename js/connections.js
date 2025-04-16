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
    
    // Context menu for connections
    jsPlumbInstance.bind("contextmenu", function (component, event) {
        event.preventDefault();
        
        if ($(component).hasClass("jtk-connector")) {
            // Remove any existing context menus
            $(".custom-menu").remove();
            
            // Create custom menu for connection
            $("<div class='custom-menu'><button class='delete-btn'>Delete Connection</button></div>")
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
    
    // Remove context menu when clicking elsewhere
    $(document).on("click", function () {
        $(".custom-menu").remove();
    });
}