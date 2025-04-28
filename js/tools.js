/**
 * Fluentia - Software Planning Tool
 * Tools Module - Handles tool management, search, and AI suggestions
 */

// Initialize search functionality
function initSearchFunctionality() {
    if (!searchInput) {
        console.error("searchInput element not found");
        return;
    }
    
    console.log("Initializing search functionality");
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeoutId);
        searchTimeoutId = setTimeout(() => {
            // Ensure the data is loaded before searching
            if (!ALL_TOOLS || ALL_TOOLS.length === 0) {
                console.warn("Cannot search: Tools data not loaded yet");
                showToast("Still loading tools data, please try again in a moment", "warning");
                return;
            }
            
            console.log("Searching for:", e.target.value);
            // Use the search function that works with JSON data
            const results = searchToolsFromJSON(e.target.value);
            displaySearchResults(results);
        }, 300); // Debounce time
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper') && resultsDropdown) {
            resultsDropdown.innerHTML = '';
        }
    });
    
    console.log("Search functionality initialized");
}

// Display search results in the dropdown
function displaySearchResults(results) {
    if (!resultsDropdown) {
        console.error("resultsDropdown element not found");
        return;
    }
    
    if (!results || results.length === 0) {
        resultsDropdown.innerHTML = '<div class="no-results">No matching tools found</div>';
        return;
    }
    
    resultsDropdown.style.display = 'block';
    
    resultsDropdown.innerHTML = results.map(tool => `
        <div class="result-item" data-tool='${JSON.stringify(tool)}'>
            <img src="${tool.imagePath || getDefaultImageForCategory(tool.category)}" alt="${tool.name}" class="tool-logo">
            <div class="tool-info">
                <div class="tool-name">${tool.name}</div>
                <div class="tool-description">${tool.category} Tool</div>
            </div>
        </div>
    `).join('');
    
    // Add click handlers to search results
    document.querySelectorAll('.result-item').forEach(item => {
        item.addEventListener('click', handleToolSelection);
    });
    
    console.log(`Displayed ${results.length} search results`);
}

// Handle tool selection from search results
function handleToolSelection(e) {
    // Prevent event bubbling
    e.stopPropagation();
    
    try {
        const toolData = JSON.parse(this.dataset.tool);
        console.log("Tool selected:", toolData.name);
        
        // Add to left pane
        addToolToPane(toolData);
        
        // Clear search
        if (searchInput) searchInput.value = '';
        if (resultsDropdown) resultsDropdown.innerHTML = '';
        
        // Show AI suggestions for the selected tool
        updateAISuggestions(toolData);
    } catch (error) {
        console.error("Error handling tool selection:", error);
        showToast("Error adding tool", "error");
    }
}

// Add tool to the left pane
function addToolToPane(toolData) {
    if (!resultsContainer) {
        console.error("resultsContainer element not found");
        return;
    }
    
    // Check if this tool is already in the pane
    const existingTools = resultsContainer.querySelectorAll('.added-item');
    let isDuplicate = false;
    
    existingTools.forEach(item => {
        try {
            const itemData = JSON.parse(item.getAttribute('data-tool'));
            if (itemData.id === toolData.id) {
                isDuplicate = true;
                item.classList.add('highlight');
                setTimeout(() => {
                    item.classList.remove('highlight');
                }, 1500);
            }
        } catch (error) {
            console.error("Error checking for duplicate tool:", error);
        }
    });
    
    if (isDuplicate) {
        showToast(`${toolData.name} is already in your toolkit`, "warning");
        return;
    }
    
    const toolElement = document.createElement('div');
    toolElement.className = 'added-item';
    toolElement.setAttribute('data-tool', JSON.stringify(toolData));
    
    // Make sure we have an image path
    const imagePath = toolData.imagePath || getDefaultImageForCategory(toolData.category);
    
    toolElement.innerHTML = `
        <img src="${imagePath}" alt="${toolData.name}" class="tool-logo">
        <span>${toolData.name}</span>
        <span class="platform-badge">${toolData.category}</span>
        <div class="delete-item-btn" title="Remove from toolkit">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"></path>
                <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
        </div>
    `;
    
    // Add delete button handler
    const deleteButton = toolElement.querySelector('.delete-item-btn');
    if (deleteButton) {
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering drag
            toolElement.remove();
            showToast(`Removed ${toolData.name} from toolkit`, "success");
        });
    }
    
    // Add click handler to show AI suggestions when clicking on the tool
    toolElement.addEventListener('click', () => {
        // Highlight the selected tool
        const allTools = resultsContainer.querySelectorAll('.added-item');
        allTools.forEach(t => t.classList.remove('selected'));
        toolElement.classList.add('selected');
        
        // Show AI suggestions for this tool
        updateAISuggestions(toolData);
    });
    
    // Add proper tooltip functionality
    toolElement.addEventListener('mouseenter', function(e) {
        try {
            if (toolData.description) {
                // Only show tooltip if chat is not active
                const aiChatBox = document.getElementById('aiChatBox');
                if (aiChatBox && aiChatBox.style.display === 'flex') {
                    return;
                }
                
                // Create or update tooltip with description
                let tooltip = document.getElementById('tool-tooltip');
                if (!tooltip) {
                    tooltip = document.createElement('div');
                    tooltip.id = 'tool-tooltip';
                    tooltip.className = 'tool-tooltip';
                    document.body.appendChild(tooltip);
                }
                
                tooltip.textContent = toolData.description;
                tooltip.style.display = 'block';
                
                // Position tooltip - Check if there's enough space on the right
                const rect = this.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                
                // Calculate if tooltip would go off-screen to the right
                const tooltipWidth = tooltip.offsetWidth || 250; // Fallback to estimated width if not yet rendered
                
                if (rect.right + tooltipWidth + 20 > viewportWidth) {
                    // Not enough space on right, show tooltip on the left side
                    tooltip.style.left = (rect.left - tooltipWidth - 10) + 'px';
                    tooltip.style.top = rect.top + 'px';
                    
                    // Change arrow direction to point right
                    tooltip.classList.add('tooltip-left');
                    tooltip.classList.remove('tooltip-right');
                } else {
                    // Enough space on right, show tooltip on the right side
                    tooltip.style.left = (rect.right + 10) + 'px';
                    tooltip.style.top = rect.top + 'px';
                    
                    // Change arrow direction to point left
                    tooltip.classList.add('tooltip-right');
                    tooltip.classList.remove('tooltip-left');
                }
            }
        } catch (error) {
            console.error("Error showing tool description:", error);
        }
    });
    
    toolElement.addEventListener('mouseleave', function() {
        const tooltip = document.getElementById('tool-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    });

    // Additional document-level check to ensure tooltips disappear
    document.addEventListener('mousemove', function(e) {
        const tooltip = document.getElementById('tool-tooltip');
        if (tooltip && tooltip.style.display === 'block') {
            // Check if mouse is over the tooltip or the target element
            const isOverTooltip = e.target === tooltip || tooltip.contains(e.target);
            const isOverElement = e.target.classList.contains('added-item') || 
                                 e.target.closest('.added-item');
            
            if (!isOverTooltip && !isOverElement) {
                tooltip.style.display = 'none';
            }
        }
    });
    
    resultsContainer.appendChild(toolElement);
    
    // Make the element draggable
    try {
        $(toolElement).draggable({
            helper: 'clone',
            cursor: 'move',
            opacity: 0.7,
            zIndex: 1000,
            // Store reference to original item
            start: function(event, ui) {
                $(ui.helper).data('original-item', this);
            }
        });
    } catch (error) {
        console.error("Error making tool draggable:", error);
    }
    
    showToast(`Added ${toolData.name} to toolkit`, "success");
    
    // Automatically show AI suggestions for the newly added tool
    updateAISuggestions(toolData);
    
    // Make right pane visible if it's collapsed
    const rightPane = document.getElementById('rightPane');
    if (rightPane && rightPane.classList.contains('collapsed')) {
        const showRightPane = document.getElementById('showRightPane');
        if (showRightPane) {
            // Add highlight pulse to the button to draw user's attention
            showRightPane.classList.add('highlight-pulse');
            setTimeout(() => {
                showRightPane.classList.remove('highlight-pulse');
            }, 3000);
        }
    }
}

// Create a tool node in the workspace
function createToolNode(id, toolData, x, y) {
    const workspace = document.getElementById('workspace');
    if (!workspace) {
        console.error("workspace element not found");
        return null;
    }
    
    // Create node element
    const node = document.createElement('div');
    node.id = id;
    node.className = 'tool-node';
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.setAttribute('data-tool', JSON.stringify(toolData));
    
    // Make sure we have an image path
    const imagePath = toolData.imagePath || getDefaultImageForCategory(toolData.category);
    
    // Add content to node - with delete button INSIDE the node
    node.innerHTML = `
        <img src="${imagePath}" alt="${toolData.name}">
        <div class="tool-node-title">${toolData.name}</div>
        <div class="delete-node-btn" title="Delete node">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"></path>
                <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
        </div>
    `;
    
    // Add to workspace
    workspace.appendChild(node);
    
    // Add node click handler to show AI suggestions
    node.addEventListener('click', function(e) {
        // Only handle click if it's not on the delete button
        if (!e.target.closest('.delete-node-btn')) {
            updateAISuggestions(toolData);
            
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
    });
    
    // Add delete button handler
    const deleteBtn = node.querySelector('.delete-node-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Add to history before removing
            addToHistory({
                type: 'removeNode',
                id: id,
                data: toolData,
                x: parseInt(node.style.left),
                y: parseInt(node.style.top)
            });
            
            // Remove the node and its connections
            if (jsPlumbInstance) {
                jsPlumbInstance.remove(id);
            }
            
            if (document.getElementById(id)) {
                document.getElementById(id).remove();
            }
            
            showToast(`Removed ${toolData.name} node`, 'success');
        });
    }
    
    // Make draggable with jQuery UI
    try {
        $(node).draggable({
            containment: 'parent',
            cursor: 'move',
            start: function(event, ui) {
                // Store initial position for undo history
                $(this).data('startPos', {
                    left: parseInt($(this).css('left')),
                    top: parseInt($(this).css('top'))
                });
            },
            stop: function(event, ui) {
                // Get initial and final positions
                const startPos = $(this).data('startPos');
                const endPos = {
                    left: parseInt($(this).css('left')),
                    top: parseInt($(this).css('top'))
                };
                
                // Only add to history if position changed
                if (startPos.left !== endPos.left || startPos.top !== endPos.top) {
                    addToHistory({
                        type: 'moveNode',
                        id: id,
                        oldX: startPos.left,
                        oldY: startPos.top,
                        newX: endPos.left,
                        newY: endPos.top
                    });
                }
                
                // Repaint connections
                if (jsPlumbInstance) {
                    jsPlumbInstance.repaintEverything();
                }
            }
        });
    } catch (error) {
        console.error("Error making node draggable:", error);
    }
    
    // Add jsPlumb endpoints directly
    addEndpointsToNode(id);
    
    // Add to history
    addToHistory({
        type: 'addNode',
        id: id,
        data: toolData,
        x: x,
        y: y
    });
    
    return node;
}

// Update AI suggestions based on selected tool
async function updateAISuggestions(toolData) {
    const aiContent = document.getElementById('aiSuggestionsContent');
    if (!aiContent) {
        console.error("aiSuggestionsContent element not found");
        return;
    }
    
    // Show loading indicator in the suggestions panel
    aiContent.innerHTML = `
        <div class="ai-recommendations">
            <div class="ai-section-header">
                <h4>Finding recommendations for ${toolData.name}...</h4>
                <p>Please wait while AI analyzes compatibility</p>
            </div>
            <div style="display: flex; justify-content: center; padding: 2rem;">
                <div class="loading-spinner" style="width: 40px; height: 40px;"></div>
            </div>
        </div>
    `;
    
    try {
        // Get AI-generated tool suggestions
        const relatedTools = await getAISuggestionsForTool(toolData);
        
        // If no suggestions were returned, show a message
        if (!relatedTools || relatedTools.length === 0) {
            aiContent.innerHTML = `
                <div class="ai-recommendations">
                    <div class="ai-section-header">
                        <h4>AI Recommendations for ${toolData.name}</h4>
                        <p>${toolData.description || toolData.category + ' Tool'}</p>
                    </div>
                    <div class="ai-connections">
                        <div class="ai-section-header">
                            <h4>No Suggestions Available</h4>
                            <p>Couldn't find recommendations for this tool. Try another tool or check back later.</p>
                        </div>
                        <div style="text-align: center; padding: 2rem;">
                            <span style="font-size: 3rem;">😢</span>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        // Build the suggestion content
        let suggestionsHTML = `
            <div class="ai-recommendations">
                <div class="ai-section-header">
                    <h4>AI Recommendations for ${toolData.name}</h4>
                    <p>${toolData.description || toolData.category + ' Tool'}</p>
                </div>
        `;
        
        // Add tool relationships section
        suggestionsHTML += `
            <div class="ai-connections">
                <div class="ai-section-header">
                    <h4>Recommended Related Tools</h4>
                    <p>Tools that work well with ${toolData.name}</p>
                </div>
                <div class="connections-list">
        `;
        
        // Add each related tool - ensure image path is always set
        relatedTools.forEach(relatedTool => {
            // Make sure we have an image path
            const imagePath = relatedTool.imagePath || getDefaultImageForCategory(relatedTool.category);
            
            suggestionsHTML += `
                <div class="connection-item" data-tool='${JSON.stringify(relatedTool)}' style="cursor: pointer;">
                    <div>
                        <img src="${imagePath}" 
                            alt="${relatedTool.name}" 
                            style="width: 24px; height: 24px; margin-right: 8px; vertical-align: middle;">
                        <span>${relatedTool.name}</span>
                    </div>
                    <div class="connection-tools">
                        <span class="badge">${relatedTool.category}</span>
                    </div>
                </div>
            `;  
        });
        
        suggestionsHTML += `
                </div>
            </div>
        `;
        
        // Add a tip about the tools
        suggestionsHTML += `
            <div class="ai-tip">
                <div class="ai-section-header">
                    <h4>AI Insight</h4>
                    <p>These tools are commonly used with ${toolData.name} in ${document.getElementById('projectName')?.getAttribute('data-project-type') || 'this type of'} projects.</p>
                </div>
            </div>
        `;
        
        suggestionsHTML += `</div>`;
        
        // Update the AI content
        aiContent.innerHTML = suggestionsHTML;
        
        // Add event listeners to related tool items
        const connectionItems = aiContent.querySelectorAll('.connection-item');
        connectionItems.forEach(item => {
            item.addEventListener('click', function() {
                try {
                    const relatedToolData = JSON.parse(this.getAttribute('data-tool'));
                    addToolToPane(relatedToolData);
                } catch (error) {
                    console.error("Error adding related tool:", error);
                    showToast("Error adding related tool", "error");
                }
            });
            
            // Add proper tooltip functionality
            item.addEventListener('mouseenter', function(e) {
                try {
                    const toolData = JSON.parse(this.getAttribute('data-tool'));
                    if (toolData.description) {
                        // Only show tooltip if chat is not active
                        const aiChatBox = document.getElementById('aiChatBox');
                        if (aiChatBox && aiChatBox.style.display === 'flex') {
                            return;
                        }
                        
                        // Create or update tooltip with description
                        let tooltip = document.getElementById('tool-tooltip');
                        if (!tooltip) {
                            tooltip = document.createElement('div');
                            tooltip.id = 'tool-tooltip';
                            tooltip.className = 'tool-tooltip';
                            document.body.appendChild(tooltip);
                        }
                        
                        tooltip.textContent = toolData.description;
                        tooltip.style.display = 'block';
                        
                        // Position tooltip - Check if there's enough space on the right
                        const rect = this.getBoundingClientRect();
                        const viewportWidth = window.innerWidth;
                        
                        // Calculate if tooltip would go off-screen to the right
                        const tooltipWidth = tooltip.offsetWidth || 250; // Fallback to estimated width if not yet rendered
                        
                        if (rect.right + tooltipWidth + 20 > viewportWidth) {
                            // Not enough space on right, show tooltip on the left side
                            tooltip.style.left = (rect.left - tooltipWidth - 10) + 'px';
                            tooltip.style.top = rect.top + 'px';
                            
                            // Change arrow direction to point right
                            tooltip.classList.add('tooltip-left');
                            tooltip.classList.remove('tooltip-right');
                        } else {
                            // Enough space on right, show tooltip on the right side
                            tooltip.style.left = (rect.right + 10) + 'px';
                            tooltip.style.top = rect.top + 'px';
                            
                            // Change arrow direction to point left
                            tooltip.classList.add('tooltip-right');
                            tooltip.classList.remove('tooltip-left');
                        }
                    }
                } catch (error) {
                    console.error("Error showing tool description:", error);
                }
            });
            
            item.addEventListener('mouseleave', function() {
                const tooltip = document.getElementById('tool-tooltip');
                if (tooltip) {
                    tooltip.style.display = 'none';
                }
            });
        });
    } catch (error) {
        console.error("Error updating AI suggestions:", error);
        
        // Show error message in the panel
        aiContent.innerHTML = `
            <div class="ai-recommendations">
                <div class="ai-section-header">
                    <h4>AI Recommendations for ${toolData.name}</h4>
                    <p>${toolData.description || toolData.category + ' Tool'}</p>
                </div>
                <div class="ai-connections">
                    <div class="ai-section-header">
                        <h4>Error Loading Recommendations</h4>
                        <p>Couldn't connect to AI service. Please try again later.</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// Fix for tool tooltips not disappearing when mouse leaves
function fixToolTooltips() {
    // Create a global mousemove event listener to close tooltips
    document.addEventListener('mousemove', function(e) {
        const tooltip = document.getElementById('tool-tooltip');
        
        if (tooltip && tooltip.style.display === 'block') {
            // Check if mouse is over the tooltip or a relevant element
            const isOverTooltip = e.target === tooltip || tooltip.contains(e.target);
            const isOverElement = e.target.classList.contains('alternative-item') || 
                                e.target.classList.contains('added-item') ||
                                e.target.closest('.alternative-item') ||
                                e.target.closest('.added-item');
            
            if (!isOverTooltip && !isOverElement) {
                tooltip.style.display = 'none';
            }
        }
    });
    
    // Add this function to the window load event
    window.addEventListener('load', function() {
        console.log("Adding tooltip fix handlers");
        fixToolTooltipEventHandlers();
    });
}

// Function to fix tooltip event handlers on specific elements
function fixToolTooltipEventHandlers() {
    // Fix tooltip handlers for all existing relevant elements
    document.querySelectorAll('.alternative-item, .added-item').forEach(item => {
        // Remove existing event listeners by cloning and replacing
        const clone = item.cloneNode(true);
        if (item.parentNode) {
            item.parentNode.replaceChild(clone, item);
        }
        
        // Add event listener for click
        clone.addEventListener('click', function() {
            try {
                if (this.classList.contains('alternative-item') || this.classList.contains('added-item')) {
                    const toolData = JSON.parse(this.getAttribute('data-tool'));
                    if (toolData) {
                        addToolToPane(toolData);
                    }
                }
            } catch (error) {
                console.error("Error handling click:", error);
            }
        });
        
        // Force set proper mouseleave handler
        clone.addEventListener('mouseleave', function() {
            const tooltip = document.getElementById('tool-tooltip');
            if (tooltip) {
                tooltip.style.display = 'none';
            }
        });
    });
    
    console.log("Tool tooltip event handlers fixed");
}

// Call the fix function during initialization
fixToolTooltips();