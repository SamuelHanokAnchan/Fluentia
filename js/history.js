/**
 * Fluentia - Software Planning Tool
 * History Module - Handles undo/redo functionality
 */

// Initialize undo/redo functionality
function initUndoRedo() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const menuUndo = document.getElementById('menuUndo');
    const menuRedo = document.getElementById('menuRedo');
    
    // Click handlers
    if (undoBtn) {
        undoBtn.addEventListener('click', performUndo);
    }
    
    if (redoBtn) {
        redoBtn.addEventListener('click', performRedo);
    }
    
    // Menu items
    if (menuUndo) {
        menuUndo.addEventListener('click', (e) => {
            e.preventDefault();
            performUndo();
        });
    }
    
    if (menuRedo) {
        menuRedo.addEventListener('click', (e) => {
            e.preventDefault();
            performRedo();
        });
    }
    
    // Also add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Undo: Ctrl+Z
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            performUndo();
        }
        // Redo: Ctrl+Y or Ctrl+Shift+Z
        if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
            e.preventDefault();
            performRedo();
        }
    });
    
    // Initial button state
    updateUndoRedoButtons();
}

// Add a command to history
function addToHistory(command) {
    // If we're not at the end of the history, remove everything after current index
    if (historyIndex < commandHistory.length - 1) {
        commandHistory = commandHistory.slice(0, historyIndex + 1);
    }
    
    // Add new command
    commandHistory.push(command);
    historyIndex = commandHistory.length - 1;
    
    // Keep history within size limit
    if (commandHistory.length > MAX_HISTORY) {
        commandHistory.shift();
        historyIndex--;
    }
    
    updateUndoRedoButtons();
}

// Update undo/redo button states
function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const menuUndo = document.getElementById('menuUndo');
    const menuRedo = document.getElementById('menuRedo');
    
    if (undoBtn) {
        undoBtn.disabled = historyIndex <= 0;
    }
    
    if (redoBtn) {
        redoBtn.disabled = historyIndex >= commandHistory.length - 1;
    }
    
    // Also update menu items
    if (menuUndo) {
        if (historyIndex <= 0) {
            menuUndo.classList.add('disabled');
        } else {
            menuUndo.classList.remove('disabled');
        }
    }
    
    if (menuRedo) {
        if (historyIndex >= commandHistory.length - 1) {
            menuRedo.classList.add('disabled');
        } else {
            menuRedo.classList.remove('disabled');
        }
    }
}

// Perform undo operation
function performUndo() {
    // Check if there's anything to undo and history is properly initialized
    if (historyIndex >= 0 && commandHistory.length > 0) {
        const command = commandHistory[historyIndex];
        console.log("Undoing command:", command);
        
        // Execute the undo action
        executeUndo(command);
        
        // Update history index after successful undo
        historyIndex--;
        
        // Update button states
        updateUndoRedoButtons();
        
        // Show feedback
        showToast("Undo successful", "success");
    } else {
        console.log("Nothing to undo");
    }
}

// Perform redo operation
function performRedo() {
    // Check if there's anything to redo and history is properly initialized
    if (historyIndex < commandHistory.length - 1) {
        // First increment the index, then get the command
        historyIndex++;
        const command = commandHistory[historyIndex];
        console.log("Redoing command:", command);
        
        // Execute the redo action
        executeRedo(command);
        
        // Update button states
        updateUndoRedoButtons();
        
        // Show feedback
        showToast("Redo successful", "success");
    } else {
        console.log("Nothing to redo");
    }
}

// Execute undo for a command
function executeUndo(command) {
    if (!command) return;
    
    switch (command.type) {
        case 'addNode':
            // Remove the node
            if (document.getElementById(command.id) && jsPlumbInstance) {
                jsPlumbInstance.remove(command.id);
            }
            break;
            
        case 'removeNode':
            // Recreate the node
            createToolNode(command.id, command.data, command.x, command.y);
            break;
            
        case 'moveNode':
            // Move back to original position
            const node = document.getElementById(command.id);
            if (node) {
                node.style.left = command.oldX + 'px';
                node.style.top = command.oldY + 'px';
                if (jsPlumbInstance) {
                    jsPlumbInstance.repaintEverything();
                }
            }
            break;
            
        case 'addConnection':
            // Remove the connection
            if (jsPlumbInstance) {
                const connections = jsPlumbInstance.getConnections({
                    source: command.sourceId,
                    target: command.targetId
                });
                
                if (connections && connections.length > 0) {
                    jsPlumbInstance.deleteConnection(connections[0]);
                }
            }
            break;
            
        case 'removeConnection':
            // Recreate the connection
            if (jsPlumbInstance) {
                jsPlumbInstance.connect({
                    source: command.sourceId,
                    target: command.targetId
                });
            }
            break;
    }
}

// Execute redo for a command
function executeRedo(command) {
    if (!command) return;
    
    switch (command.type) {
        case 'addNode':
            // Recreate the node
            createToolNode(command.id, command.data, command.x, command.y);
            break;
            
        case 'removeNode':
            // Remove the node again
            if (document.getElementById(command.id) && jsPlumbInstance) {
                jsPlumbInstance.remove(command.id);
            }
            break;
            
        case 'moveNode':
            // Move to the new position
            const node = document.getElementById(command.id);
            if (node) {
                node.style.left = command.newX + 'px';
                node.style.top = command.newY + 'px';
                if (jsPlumbInstance) {
                    jsPlumbInstance.repaintEverything();
                }
            }
            break;
            
        case 'addConnection':
            // Recreate the connection
            if (jsPlumbInstance) {
                jsPlumbInstance.connect({
                    source: command.sourceId,
                    target: command.targetId
                });
            }
            break;
            
        case 'removeConnection':
            // Remove the connection again
            if (jsPlumbInstance) {
                const connections = jsPlumbInstance.getConnections({
                    source: command.sourceId,
                    target: command.targetId
                });
                
                if (connections && connections.length > 0) {
                    jsPlumbInstance.deleteConnection(connections[0]);
                }
            }
            break;
    }
}