/**
 * Fluentia - Software Planning Tool
 * Storage Module - Handles project saving and loading
 */

// Save the current project
function saveProject() {
    try {
        // Show loading indicator
        toggleLoading(true, "Saving project...");
        
        // Get project type from data attribute
        const projectNameElement = document.getElementById('projectName');
        const projectType = projectNameElement ? projectNameElement.getAttribute('data-project-type') : null;
        
        // Get the current workspace state
        const projectState = {
            // Basic project info
            name: projectNameElement ? projectNameElement.textContent : 'Untitled Project',
            status: document.querySelector('#statusBtn .status-text').textContent,
            projectType: projectType,
            
            // Nodes
            nodes: [],
            
            // Connections
            connections: []
        };


        // Get all nodes
        const nodes = document.querySelectorAll('.tool-node');
        nodes.forEach(node => {
            // Get tool data from the node
            const nodeId = node.id;
            const nodeTitle = node.querySelector('.tool-node-title').textContent;
            const imgSrc = node.querySelector('img').src;
            
            // Get node position
            const x = parseInt(node.style.left);
            const y = parseInt(node.style.top);
            
            // Save node data
            projectState.nodes.push({
                id: nodeId,
                title: nodeTitle,
                imgSrc: imgSrc,
                x: x,
                y: y
            });
        });
        
        // Get all connections
        if (jsPlumbInstance) {
            const connections = jsPlumbInstance.getAllConnections();
            connections.forEach(conn => {
                projectState.connections.push({
                    sourceId: conn.sourceId,
                    targetId: conn.targetId,
                    type: conn.connector.type
                });
            });
        }
        
        // Convert to JSON string
        const projectJSON = JSON.stringify(projectState);
        
        // Save to local storage
        localStorage.setItem(SAVE_KEY, projectJSON);
        
        setTimeout(() => {
            // Hide loading indicator
            toggleLoading(false);
            
            // Show success message
            showToast('Project saved successfully', 'success');
        }, 500);
        
    } catch (error) {
        console.error("Error saving project:", error);
        toggleLoading(false);
        showToast('Error saving project: ' + error.message, 'error');
    }
}

// Load a saved project
function loadProject() {
    try {
        // Show loading overlay
        toggleLoading(true, "Loading project...");
        
        // Get project from local storage
        const projectJSON = localStorage.getItem(SAVE_KEY);
        
        if (!projectJSON) {
            setTimeout(() => {
                toggleLoading(false);
                showToast('No saved project found', 'warning');
            }, 500);
            return;
        }
        
        // Parse the JSON
        const projectState = JSON.parse(projectJSON);
        
        // Clear current workspace
        clearWorkspace();
        
        // Set project info
        const projectNameElement = document.getElementById('projectName');
        if (projectNameElement) {
            projectNameElement.textContent = projectState.name || 'Untitled Project';
            
            // Set project type attribute if available
            if (projectState.projectType) {
                projectNameElement.setAttribute('data-project-type', projectState.projectType);
            }
        }
        
        // Set status if available
        const statusBtn = document.getElementById('statusBtn');
        if (statusBtn && projectState.status) {
            const statusIndicator = statusBtn.querySelector('.status-indicator');
            const statusTextElement = statusBtn.querySelector('.status-text');
            
            // Find matching status item
            const statusItems = document.querySelectorAll('.status-item');
            let statusClass = 'no-status';
            
            statusItems.forEach(item => {
                if (item.textContent.trim() === projectState.status) {
                    statusClass = item.getAttribute('data-status');
                }
            });
            
            if (statusIndicator) {
                statusIndicator.className = 'status-indicator ' + statusClass;
            }
            
            if (statusTextElement) {
                statusTextElement.textContent = projectState.status;
            }
        }
        
        // Show workspace container and hide build button
        const workspaceContainer = document.getElementById('workspaceContainer');
        const openModalBtn = document.getElementById('openModal');
        
        if (workspaceContainer) {
            workspaceContainer.style.display = 'block';
        }
        
        if (openModalBtn) {
            openModalBtn.style.display = 'none';
        }
        
        // Initialize workspace if needed
        if (!jsPlumbInstance) {
            initWorkspace();
        }
        
        // Create nodes with some delay to ensure workspace is ready
        setTimeout(() => {
            // Create nodes
            projectState.nodes.forEach(node => {
                // Find matching tool in ALL_TOOLS or create minimal toolData
                let toolData = ALL_TOOLS.find(tool => tool.name === node.title) || {
                    id: `unknown-${Date.now()}`,
                    name: node.title,
                    imagePath: node.imgSrc,
                    category: 'Unknown'
                };
                
                // Create node
                createToolNode(node.id, toolData, node.x, node.y);
            });
            
            // Create connections with a slightly longer delay
            setTimeout(() => {
                if (jsPlumbInstance && projectState.connections) {
                    projectState.connections.forEach(conn => {
                        jsPlumbInstance.connect({
                            source: conn.sourceId,
                            target: conn.targetId,
                            type: conn.type
                        });
                    });
                }
                
                // Hide loading and show success
                toggleLoading(false);
                showToast('Project loaded successfully', 'success');
                
            }, 300); // Delay for connections
            
        }, 100); // Delay for nodes
        
    } catch (error) {
        console.error('Error loading project:', error);
        toggleLoading(false);
        showToast('Error loading project: ' + error.message, 'error');
    }
}