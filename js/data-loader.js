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
    if (!projectGrid || !PROJECTS_DATA || PROJECTS_DATA.length === 0) {
        console.error("Cannot initialize project buttons: Missing projectGrid element or project data");
        return;
    }
    
    // Clear existing buttons
    projectGrid.innerHTML = '';
    
    // Create a button for each project type
    PROJECTS_DATA.forEach(project => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary';
        
        // Define custom icon based on project ID
        let icon = '';
        switch(project.id) {
            case 'full-stack':
                icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width: 1.25rem; height: 1.25rem;">
                    <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>`;
                btn.innerHTML = `${icon} ${project.name} (${project.id})`;
                console.log(`Creating button for project: ${project.name}, ID: ${project.id}`);

                break;
            case 'data-engineering':
                icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width: 1.25rem; height: 1.25rem;">
                    <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                    <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                    <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                </svg>`;
                break;
            case 'cloud-computing':
                icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width: 1.25rem; height: 1.25rem;">
                    <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
                </svg>`;
                break;
            case 'api-development':
                icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width: 1.25rem; height: 1.25rem;">
                    <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>`;
                break;
            case 'mobile-development':
                icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width: 1.25rem; height: 1.25rem;">
                    <path fill-rule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                </svg>`;
                break;
            case 'security-software-development':
                icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width: 1.25rem; height: 1.25rem;">
                    <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>`;
                break;
            case 'frontend-development':
                icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width: 1.25rem; height: 1.25rem;">
                    <path fill-rule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clip-rule="evenodd" />
                </svg>`;
                break;
            case 'embedded-systems-development':
                icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width: 1.25rem; height: 1.25rem;">
                    <path d="M13 7H7v6h6V7z" />
                    <path fill-rule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clip-rule="evenodd" />
                </svg>`;
                break;
            case 'desktop-development':
                icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width: 1.25rem; height: 1.25rem;">
                    <path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clip-rule="evenodd" />
                </svg>`;
                break;
            case 'application-development':
                icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width: 1.25rem; height: 1.25rem;">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>`;
                break;
            default:
                icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width: 1.25rem; height: 1.25rem;">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>`;
        }

        
        // Set button content with icon
        btn.innerHTML = `${icon} ${project.name}`;
        
        // Store project type ID as data attribute
        btn.setAttribute('data-project-id', project.id);
        
        btn.onclick = () => {
            // Store selected project type
            localStorage.setItem('selectedProjectType', project.id);
            
            // Show name input
            const nameInput = document.getElementById('nameInput');
            if (nameInput) {
                nameInput.style.display = 'block';
            } else {
                console.error("Cannot find nameInput element");
            }
        };
        
        projectGrid.appendChild(btn);
    });
    
    console.log(`Added ${PROJECTS_DATA.length} project buttons to grid`);
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
    if (!ALL_TOOLS || ALL_TOOLS.length === 0) {
        console.warn("Search attempted but tools data not loaded yet");
        return [];
    }
    
    if (!query || query.trim() === '') return [];
    
    const cleanQuery = query.toLowerCase().trim();
    
    return ALL_TOOLS.filter(tool => {
        return tool.name.toLowerCase().includes(cleanQuery) || 
               (tool.description && tool.description.toLowerCase().includes(cleanQuery)) ||
               (tool.category && tool.category.toLowerCase().includes(cleanQuery));
    });
}

/**
 * Get AI suggestions for a tool
 * @param {Object} toolData - The tool data
 * @return {Array} Array of suggested related tools
 */
function getAISuggestionsForTool(toolData) {
    if (!toolData || !ALL_TOOLS || ALL_TOOLS.length === 0) {
        return [];
    }
    
    // If this is a main tool with subtools, return its subtools as suggestions
    if (toolData.subTools && toolData.subTools.length > 0) {
        return toolData.subTools;
    }
    
    // If this is a subtool, find its parent tool and return other subtools from same parent
    if (toolData.category) {
        // Find the parent tool
        const parentTool = ALL_TOOLS.find(tool => 
            tool.name === toolData.category && Array.isArray(tool.subTools)
        );
        
        if (parentTool && parentTool.subTools) {
            // Return other subtools from the same parent (excluding the current one)
            return parentTool.subTools.filter(subtool => subtool.id !== toolData.id);
        }
    }
    
    // If no direct relationships, return tools from the same category
    return ALL_TOOLS.filter(tool => 
        tool.id !== toolData.id && 
        tool.category === toolData.category
    ).slice(0, 5); // Limit to 5 suggestions
}