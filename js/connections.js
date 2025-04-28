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
                        
                        // Check compatibility between the tools
                        checkToolsCompatibility(sourceNode, targetNode, conn);
                        
                        // Open AI chat automatically without confirmation dialog
                        setTimeout(() => {
                            showAiChatForConnectedTools(sourceToolName, targetToolName, conn);
                        }, 800);
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

// Check compatibility between two tools
async function checkToolsCompatibility(sourceNode, targetNode, connection) {
    try {
        // Set connection to loading state initially
        jsPlumbInstance.select({source: connection.sourceId, target: connection.targetId}).setPaintStyle({
            stroke: "#64748b", // Gray for loading
            strokeWidth: 2
        });
        
        // Get tool data
        const sourceToolData = JSON.parse(sourceNode.getAttribute('data-tool'));
        const targetToolData = JSON.parse(targetNode.getAttribute('data-tool'));
        
        // Get compatibility rating from AI
        const compatibilityResult = await getToolsCompatibility(sourceToolData, targetToolData);
        
        // Store compatibility data with the connection
        connection.compatibilityData = compatibilityResult;
        
        // Update connection appearance based on compatibility
        updateConnectionAppearance(connection, compatibilityResult.score);
        
        // Add alternative tools to the right panel if low compatibility
        if (compatibilityResult.score < 2) {
            showAlternativeTools(compatibilityResult.alternatives, sourceToolData, targetToolData);
        }
    } catch (error) {
        console.error("Error checking tool compatibility:", error);
        // Set default compatibility
        connection.compatibilityData = {
            score: 1,
            reason: "Could not determine compatibility",
            alternatives: []
        };
        // Update connection with default appearance
        updateConnectionAppearance(connection, 1);
    }
}

// Get compatibility rating between two tools from AI
async function getToolsCompatibility(sourceTool, targetTool) {
    try {
        // Get project information for context
        const projectNameElement = document.getElementById('projectName');
        const projectName = projectNameElement ? projectNameElement.textContent.trim() : "Untitled Project";
        const projectType = projectNameElement ? projectNameElement.getAttribute('data-project-type') || "Unknown" : "Unknown";
        
        // Prepare the prompt for the model - IMPROVED to ensure more varied scores
        const prompt = `You are evaluating the compatibility between two software tools for a ${projectType} project named "${projectName}".

Tool 1: ${sourceTool.name} (${sourceTool.category})
Tool 2: ${targetTool.name} (${targetTool.category})

IMPORTANT: Rate their compatibility on a scale of 0-2 with STRICT evaluation criteria:
0 - INCOMPATIBLE: Significant integration challenges, conflicting paradigms, rarely used together, or requires extensive custom adapters
1 - MODERATE: Can be integrated with some effort, requires configuration or middleware, not a natural pairing
2 - HIGH: Well-established integration patterns, commonly used together, natural fit

IMPORTANT INSTRUCTIONS:
- Be critical in your assessment
- Competing tools or frameworks in the same category should get score 0
- Frontend tools directly connecting to databases without middleware should get score 0
- If integration requires substantial custom code, score 0 or 1
- Only give score 2 for well-documented, established integrations

Also provide 1-3 alternative tools that would work better with ${sourceTool.name} if the compatibility score is less than 2.

Format your response as a JSON object with the following structure:
{
  "score": number (0, 1, or 2),
  "reason": "brief explanation of the compatibility rating",
  "alternatives": [
    {
      "name": "Tool Name",
      "category": "Category",
      "description": "Brief description of why this is a better alternative"
    }
  ]
}

Note: Only include the JSON object in your response, nothing else.`;

        // Call the AI model
        const response = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer zTg0D6lABD5ncLQsk6bTQp3pBDVpliGa',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'meta-llama/Meta-Llama-3-8B-Instruct',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.4, // Slightly higher temperature for more varied responses
                max_tokens: 500
            })
        });
        
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content.trim() || "{}";
        
        // Try to parse the JSON response
        try {
            const result = JSON.parse(content);
            
            // Ensure the result has the expected structure
            return {
                score: Number(result.score), // Keep as is without default to allow 0
                reason: result.reason || "Compatibility uncertain",
                alternatives: Array.isArray(result.alternatives) ? result.alternatives : []
            };
        } catch (jsonError) {
            console.error("Error parsing JSON from model response:", jsonError);
            // Try to extract JSON from the response if it contains text around it
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const result = JSON.parse(jsonMatch[0]);
                    return {
                        score: Number(result.score),
                        reason: result.reason || "Compatibility uncertain",
                        alternatives: Array.isArray(result.alternatives) ? result.alternatives : []
                    };
                } catch (e) {
                    console.error("Failed to extract JSON from response");
                }
            }
            // Return default
            return {
                score: 1,
                reason: "Could not determine compatibility",
                alternatives: []
            };
        }
    } catch (error) {
        console.error("Error getting tools compatibility:", error);
        // Return default value in case of error
        return {
            score: 1,
            reason: "Error determining compatibility",
            alternatives: []
        };
    }
}

// Update connection appearance based on compatibility score
function updateConnectionAppearance(connection, compatibility) {
    if (!connection) return;
    
    // Define colors based on compatibility score
    const colors = {
        'loading': "#64748b", // Gray for loading state
        0: "#ef4444", // Red for incompatible
        1: "#f59e0b", // Orange for somewhat compatible
        2: "#10b981"  // Green for highly compatible
    };
    
    // Define stroke width based on compatibility
    const strokeWidths = {
        'loading': 2,
        0: 3, // Thicker for incompatible (more attention)
        1: 2.5,
        2: 2
    };
    
    // Get correct color based on compatibility score
    const color = colors[compatibility] || colors[1];
    const strokeWidth = strokeWidths[compatibility] || strokeWidths[1];
    
    // Set connection style
    jsPlumbInstance.select({source: connection.sourceId, target: connection.targetId}).setPaintStyle({
        stroke: color,
        strokeWidth: strokeWidth
    });
    
    // Remove any existing label
    if (connection.getOverlay('compatibilityLabel')) {
        connection.removeOverlay('compatibilityLabel');
    }
    
    // Add compatibility label overlay if not a loading state
    if (compatibility !== 'loading') {
        const levelText = compatibility === 0 ? 'Low' : (compatibility === 1 ? 'Medium' : 'High');
        connection.addOverlay([
            "Label", 
            { 
                id: "compatibilityLabel",
                label: `<div class="compatibility-label compatibility-${levelText.toLowerCase()}">${levelText}</div>`,
                location: 0.5,
                cssClass: "compatibility-label-container"
            }
        ]);
    }
}

// Show alternative tools in the right panel
function showAlternativeTools(alternatives, sourceTool, targetTool) {
    if (!alternatives || alternatives.length === 0) return;
    
    // First enhance the alternative tools with images and IDs
    const enhancedAlternatives = alternatives.map(tool => {
        return enhanceToolWithImageAndId(tool);
    });
    
    // Get the AI suggestions panel
    const aiContent = document.getElementById('aiSuggestionsContent');
    if (!aiContent) return;
    
    // Check if there's already content
    const existingContent = aiContent.querySelector('.ai-recommendations');
    
    // Create the alternatives section
    const alternativesSection = document.createElement('div');
    alternativesSection.className = 'ai-alternatives';
    alternativesSection.innerHTML = `
        <div class="ai-section-header">
            <h4>Suggested Alternative Tools</h4>
            <p>${sourceTool.name} and ${targetTool.name} have limited compatibility. Consider these alternatives:</p>
        </div>
        <div class="connections-list alternatives-list">
            ${enhancedAlternatives.map(tool => `
                <div class="connection-item alternative-item" data-tool='${JSON.stringify(tool)}' style="cursor: pointer;">
                    <div>
                        <img src="${tool.imagePath || getDefaultImageForCategory(tool.category)}" 
                            alt="${tool.name}" 
                            style="width: 24px; height: 24px; margin-right: 8px; vertical-align: middle;">
                        <span>${tool.name}</span>
                    </div>
                    <div class="connection-tools">
                        <span class="badge">${tool.category}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    // If there's existing content, add the alternatives section before the tip
    if (existingContent) {
        const aiTip = existingContent.querySelector('.ai-tip');
        if (aiTip) {
            existingContent.insertBefore(alternativesSection, aiTip);
        } else {
            existingContent.appendChild(alternativesSection);
        }
    } else {
        // Create new content with the alternatives
        const newContent = document.createElement('div');
        newContent.className = 'ai-recommendations';
        newContent.innerHTML = `
            <div class="ai-section-header">
                <h4>Compatibility Suggestions</h4>
                <p>Alternative tools that might work better with your current setup.</p>
            </div>
        `;
        newContent.appendChild(alternativesSection);
        aiContent.appendChild(newContent);
    }
    
    // Add click handlers to the alternative items
    const alternativeItems = aiContent.querySelectorAll('.alternative-item');
    alternativeItems.forEach(item => {
        item.addEventListener('click', function() {
            try {
                const toolData = JSON.parse(this.getAttribute('data-tool'));
                addToolToPane(toolData);
            } catch (error) {
                console.error("Error adding alternative tool:", error);
                showToast("Error adding alternative tool", "error");
            }
        });
    });
    
    // Make right pane visible if it's collapsed
    const rightPane = document.getElementById('rightPane');
    if (rightPane && rightPane.classList.contains('collapsed')) {
        rightPane.classList.remove('collapsed');
        const toggleRightPane = document.getElementById('toggleRightPane');
        if (toggleRightPane) {
            toggleRightPane.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';
        }
    }
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
            
            // Create custom menu based on compatibility
            let menuContent = '<button class="delete-btn">Delete Connection</button>';
            
            // Add generate code option if compatibility is greater than 0
            if (!component.compatibilityData || component.compatibilityData.score > 0) {
                menuContent += '<button class="ai-code-btn">Generate Code</button>';
            }
            
            // Add compatibility info option
            menuContent += '<button class="compatibility-info-btn">View Compatibility Info</button>';
            
            $(`<div class='custom-menu'>${menuContent}</div>`)
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
    
    // Handle compatibility info button
    $("body").on("click", ".compatibility-info-btn", function () {
        if (window.selectedConnection && window.selectedConnection.compatibilityData) {
            const conn = window.selectedConnection;
            const data = conn.compatibilityData;
            const sourceNode = document.getElementById(conn.sourceId);
            const targetNode = document.getElementById(conn.targetId);
            
            if (sourceNode && targetNode) {
                const sourceToolName = sourceNode.querySelector('.tool-node-title')?.textContent || 'Unknown Tool';
                const targetToolName = targetNode.querySelector('.tool-node-title')?.textContent || 'Unknown Tool';
                
                // Create compatibility info modal
                const modalHTML = `
                    <div class="modal-overlay compatibility-modal-overlay">
                        <div class="modal-content compatibility-modal">
                            <div class="modal-header">
                                <h3>Tool Compatibility: ${sourceToolName} & ${targetToolName}</h3>
                                <button class="modal-close-btn">&times;</button>
                            </div>
                            <div class="compatibility-details">
                                <div class="compatibility-score-container score-${data.score}">
                                    <div class="compatibility-score">${data.score}</div>
                                    <div class="compatibility-level">${data.score === 0 ? 'Low' : (data.score === 1 ? 'Medium' : 'High')}</div>
                                </div>
                                <div class="compatibility-explanation">
                                    <h4>Analysis</h4>
                                    <p>${data.reason}</p>
                                    ${data.score < 2 && data.alternatives && data.alternatives.length > 0 ? `
                                        <h4>Alternatives to Consider</h4>
                                        <ul class="compatibility-alternatives">
                                            ${data.alternatives.map(alt => `
                                                <li>
                                                    <strong>${alt.name}</strong> (${alt.category}): 
                                                    ${alt.description}
                                                </li>
                                            `).join('')}
                                        </ul>
                                        <p class="alternatives-note">These alternatives are available in the AI Suggestions panel.</p>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add modal to body
                $('body').append(modalHTML);
                
                // Add close button handler
                $('.compatibility-modal-overlay .modal-close-btn').on('click', function() {
                    $('.compatibility-modal-overlay').remove();
                });
                
                // Close when clicking outside
                $('.compatibility-modal-overlay').on('click', function(e) {
                    if ($(e.target).hasClass('compatibility-modal-overlay')) {
                        $('.compatibility-modal-overlay').remove();
                    }
                });
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
    // Create tooltip div if it doesn't exist
    if (!document.getElementById('connection-tooltip')) {
        const tooltip = document.createElement('div');
        tooltip.id = 'connection-tooltip';
        tooltip.className = 'connection-tooltip';
        tooltip.style.display = 'none';
        document.body.appendChild(tooltip);
    }
    
    const tooltip = document.getElementById('connection-tooltip');
    
    $(connection.canvas).hover(
        // Mouse enter
        function(event) {
            // Only show tooltip if chat isn't active
            if (document.getElementById('aiChatBox') && 
                document.getElementById('aiChatBox').style.display === 'flex') {
                return; // Don't show connection tooltip when chat is active
            }
            
            if (connection.compatibilityData) {
                const sourceNode = document.getElementById(connection.sourceId);
                const targetNode = document.getElementById(connection.targetId);
                
                if (sourceNode && targetNode && tooltip) {
                    const sourceToolName = sourceNode.querySelector('.tool-node-title')?.textContent || 'Unknown Tool';
                    const targetToolName = targetNode.querySelector('.tool-node-title')?.textContent || 'Unknown Tool';
                    const compData = connection.compatibilityData;
                    
                    // Set tooltip content based on compatibility
                    let compatibilityClass = compData.score === 0 ? 'low' : (compData.score === 1 ? 'medium' : 'high');
                    
                    tooltip.className = `connection-tooltip compatibility-${compatibilityClass}`;
                    tooltip.innerHTML = `
                        <div class="tooltip-header">
                            <div class="tooltip-title">${sourceToolName} → ${targetToolName}</div>
                            <div class="tooltip-score">Compatibility: ${compData.score === 0 ? 'Low' : (compData.score === 1 ? 'Medium' : 'High')}</div>
                        </div>
                        <div class="tooltip-body">
                            <p>${compData.reason}</p>
                            ${compData.score < 2 ? '<p class="tooltip-hint">Check AI Suggestions for better alternatives</p>' : ''}
                        </div>
                    `;
                    
                    // Position tooltip near mouse pointer
                    tooltip.style.left = (event.pageX + 15) + 'px';
                    tooltip.style.top = (event.pageY - 15) + 'px';
                    tooltip.style.display = 'block';
                }
            }
        },
        // Mouse leave
        function() {
            // Hide tooltip
            if (tooltip) {
                tooltip.style.display = 'none';
            }
        }
    );
    
    // Update tooltip position on mouse move
    $(connection.canvas).mousemove(function(event) {
        if (tooltip && tooltip.style.display === 'block') {
            tooltip.style.left = (event.pageX + 15) + 'px';
            tooltip.style.top = (event.pageY - 15) + 'px';
        }
    });
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

// This is the function that was missing but is referenced in workspace.js
function bindConnectionEvents() {
    if (!jsPlumbInstance) return;
    
    // Bind to connection events to add code icon and functionality
    jsPlumbInstance.bind("connection", function(info) {
        // Initialize connection properties
        info.connection.codeSnippet = info.connection.codeSnippet || "";
        
        // Setup code icon for this connection if it doesn't already exist
        addCodeIconToConnection(info.connection);
        
        // Set up hover functionality
        setupSingleConnectionHover(info.connection);
    });
    
    // Apply to existing connections
    const connections = jsPlumbInstance.getAllConnections();
    connections.forEach(conn => {
        addCodeIconToConnection(conn);
        setupSingleConnectionHover(conn);
    });
}

// Add a code icon to a connection using overlays
// Add a code icon to a connection using overlays - FIXED POSITIONING
// Add a code icon to a connection using overlays - FIXED POSITIONING
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
            
            // Add a CSS class to highlight the connection with code
            jsPlumbInstance.select({source: connection.sourceId, target: connection.targetId}).addClass("has-code");
        }
    } catch (error) {
        console.error("Error adding code icon:", error);
    }
}