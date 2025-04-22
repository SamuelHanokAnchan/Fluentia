/**
 * Fluentia - Software Planning Tool
 * JSON Data Loading Module - Handles loading tools data from JSON file
 */

// Global variable to store loaded data
let PROJECTS_DATA = null;
let ALL_TOOLS = [];

/**
 * Load project types and tools data from the JSON file
 * @return {Promise} Promise that resolves when data is loaded
 */
async function loadProjectData() {
    try {
        // Show loading indicator
        toggleLoading(true, "Loading project data...");
        
        // Fetch the JSON file
        const response = await fetch('json/data.json');
        if (!response.ok) {
            throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
        }
        
        // Parse JSON data
        const data = await response.json();
        
        // Store project types
        PROJECTS_DATA = data.projectTypes || [];
        
        // Extract all tools into a flat array for search functionality
        ALL_TOOLS = [];
        
        PROJECTS_DATA.forEach(projectType => {
            if (Array.isArray(projectType.tools)) {
                projectType.tools.forEach(tool => {
                    // Add main tool
                    ALL_TOOLS.push(tool);
                    
                    // Add subtools if any
                    if (Array.isArray(tool.subTools)) {
                        tool.subTools.forEach(subTool => {
                            // Add parent category to subtool
                            subTool.category = tool.name;
                            ALL_TOOLS.push(subTool);
                        });
                    }
                });
            }
        });
        
        console.log(`Loaded ${PROJECTS_DATA.length} project types and ${ALL_TOOLS.length} tools`);
        
        // Hide loading indicator
        toggleLoading(false);
        
        return PROJECTS_DATA;
    } catch (error) {
        console.error("Error loading project data:", error);
        toggleLoading(false);
        showToast(`Error loading project data: ${error.message}`, "error");
        return [];
    }
}

/**
 * Initialize project buttons based on loaded data
 */
function initProjectButtonsFromJSON() {
    if (!projectGrid || !PROJECTS_DATA) return;
    
    // Clear existing buttons
    projectGrid.innerHTML = '';
    
    // Create a button for each project type
    PROJECTS_DATA.forEach(project => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary';
        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width: 1.25rem; height: 1.25rem;">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            ${project.name}
        `;
        
        // Store project type ID as data attribute
        btn.setAttribute('data-project-id', project.id);
        
        btn.onclick = () => {
            // Store selected project type
            localStorage.setItem('selectedProjectType', project.id);
            
            // Show name input
            document.getElementById('nameInput').style.display = 'block';
        };
        
        projectGrid.appendChild(btn);
    });
}

/**
 * Get tools for a specific project type
 * @param {string} projectTypeId - ID of the project type
 * @return {Array} Array of tools for the project type
 */
function getToolsForProjectType(projectTypeId) {
    if (!PROJECTS_DATA) return [];
    
    // Find the project type
    const projectType = PROJECTS_DATA.find(p => p.id === projectTypeId);
    if (!projectType) return [];
    
    return projectType.tools || [];
}

/**
 * Search tools across all project types
 * @param {string} query - Search query
 * @return {Array} Array of matching tools
 */
function searchToolsFromJSON(query) {
    if (!ALL_TOOLS || !query || query.trim() === '') return [];
    
    const cleanQuery = query.toLowerCase().trim();
    
    return ALL_TOOLS.filter(tool => {
        return tool.name.toLowerCase().includes(cleanQuery) || 
               (tool.description && tool.description.toLowerCase().includes(cleanQuery)) ||
               (tool.category && tool.category.toLowerCase().includes(cleanQuery));
    });
}