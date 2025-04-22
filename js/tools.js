/**
 * Fluentia - Software Planning Tool
 * Tools Module - Handles tool management, search, and AI suggestions
 */

// Initialize search functionality
function initSearchFunctionality() {
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeoutId);
        searchTimeoutId = setTimeout(() => {
            // Use the new search function that works with JSON data
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
}

// Display search results in the dropdown
function displaySearchResults(results) {
    if (!resultsDropdown) return;
    
    if (!results || results.length === 0) {
        resultsDropdown.innerHTML = '<div class="no-results">No matching tools found</div>';
        return;
    }
    
    resultsDropdown.innerHTML = results.map(tool => `
        <div class="result-item" data-tool='${JSON.stringify(tool)}'>
            <img src="${tool.imagePath || 'images/tools/default.png'}" alt="${tool.name}" class="tool-logo">
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
}

// Handle tool selection from search results
function handleToolSelection(e) {
    // Prevent event bubbling
    e.stopPropagation();
    
    try {
        const toolData = JSON.parse(this.dataset.tool);
        
        // Add to left pane
        addToolToPane(toolData);
        
        // Clear search
        if (searchInput) searchInput.value = '';
        if (resultsDropdown) resultsDropdown.innerHTML = '';
        
        // Show AI suggestions if applicable (we'll implement this later)
        // updateAISuggestions(toolData);
    } catch (error) {
        console.error("Error handling tool selection:", error);
        showToast("Error adding tool", "error");
    }
}

// Add tool to the left pane
function addToolToPane(toolData) {
    if (!resultsContainer) return;
    
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
    
    toolElement.innerHTML = `
        <img src="${toolData.imagePath || 'images/tools/default.png'}" alt="${toolData.name}" class="tool-logo">
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
}

// Create a tool node in the workspace
function createToolNode(id, toolData, x, y) {
    const workspace = document.getElementById('workspace');
    if (!workspace) return null;
    
    // Create node element
    const node = document.createElement('div');
    node.id = id;
    node.className = 'tool-node';
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    
    // Add content to node - with delete button INSIDE the node
    node.innerHTML = `
        <img src="${toolData.imagePath || 'images/tools/default.png'}" alt="${toolData.name}">
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

// Update AI suggestions based on selected tool (placeholder for now)
function updateAISuggestions(toolData) {
    const aiContent = document.getElementById('aiSuggestionsContent');
    if (!aiContent) return;
    
    aiContent.innerHTML = `
        <div style="padding: 1rem;">
            <p>AI recommendations will be implemented in a future update.</p>
            <p>Selected tool: ${toolData.name}</p>
        </div>
    `;
}