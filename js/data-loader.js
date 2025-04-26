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
                break;
            case 'data-engineering':
                icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width: 1.25rem; height: 1.25rem;">
                    <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                    <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                    <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                </svg>`;
                break;
            // Other cases...
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
 * Get AI suggestions for a tool using the model
 * @param {Object} toolData - The tool data
 * @return {Promise<Array>} Promise that resolves to array of suggested related tools
 */
async function getAISuggestionsForTool(toolData) {
    if (!toolData) {
        return [];
    }
    
    try {
        // Get project information for context
        const projectNameElement = document.getElementById('projectName');
        const projectName = projectNameElement ? projectNameElement.textContent.trim() : "Untitled Project";
        const projectType = projectNameElement ? projectNameElement.getAttribute('data-project-type') || "Unknown" : "Unknown";
        
        // Prepare the prompt for the model
        const prompt = `You are a software development expert recommending tools that work well with ${toolData.name} in a ${projectType} project named "${projectName}".
        
Please suggest 3-5 of the most commonly used and industry-standard tools that integrate well with ${toolData.name} for this type of project. 

For each tool, provide:
1. The tool name (e.g., "NumPy")
2. A short category label (e.g., "Data Processing")
3. A brief one-line description

Format your response as a JSON array of objects with the following structure:
[
  {
    "name": "Tool Name",
    "category": "Category",
    "description": "Brief description"
  }
]

Note: Only include the JSON array in your response, nothing else.`;

        // Call the AI model
        const suggestedTools = await callAIForToolSuggestions(prompt);
        
        // Enhance the suggested tools with image paths and IDs
        const enhancedTools = suggestedTools.map(tool => enhanceToolWithImageAndId(tool));
        
        return enhancedTools;
    } catch (error) {
        console.error("Error getting AI suggestions:", error);
        // Return an empty array if there's an error
        return [];
    }
}

/**
 * Call the AI model for tool suggestions
 * @param {string} prompt - The prompt to send to the model
 * @return {Promise<Array>} Promise that resolves to array of tool objects
 */
async function callAIForToolSuggestions(prompt) {
    try {
        const response = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer zTg0D6lABD5ncLQsk6bTQp3pBDVpliGa',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'meta-llama/Meta-Llama-3-8B-Instruct',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.2,
                max_tokens: 500
            })
        });
        
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content.trim() || "[]";
        
        // Try to parse the JSON response
        try {
            return JSON.parse(content);
        } catch (jsonError) {
            console.error("Error parsing JSON from model response:", jsonError);
            // Try to extract JSON from the response if it contains text around it
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0]);
                } catch (e) {
                    console.error("Failed to extract JSON from response");
                    return [];
                }
            }
            return [];
        }
    } catch (error) {
        console.error("Error calling AI for tool suggestions:", error);
        return [];
    }
}

/**
 * Get a default image based on tool category
 * @param {string} category - The tool category
 * @return {string} Path to an appropriate default image
 */
function getDefaultImageForCategory(category) {
    // Default image as fallback
    let imagePath = 'images/tools/default.png';
    
    // Make sure we have a category string to check
    if (!category || typeof category !== 'string') {
        return imagePath;
    }
    
    // Try to match category to a common tool image
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('database') || categoryLower.includes('data') || categoryLower.includes('storage')) {
        imagePath = 'images/tools/database.png';
    } else if (categoryLower.includes('framework') || categoryLower.includes('library')) {
        imagePath = 'images/tools/framework.png';
    } else if (categoryLower.includes('testing') || categoryLower.includes('test')) {
        imagePath = 'images/tools/testing.png';
    } else if (categoryLower.includes('ui') || categoryLower.includes('interface') || categoryLower.includes('frontend')) {
        imagePath = 'images/tools/ui.png';
    } else if (categoryLower.includes('api') || categoryLower.includes('service')) {
        imagePath = 'images/tools/api.png';
    } else if (categoryLower.includes('language') || categoryLower.includes('programming')) {
        imagePath = 'images/tools/language.png';
    } else if (categoryLower.includes('devops') || categoryLower.includes('deployment') || categoryLower.includes('cloud')) {
        imagePath = 'images/tools/cloud.png';
    } else if (categoryLower.includes('security') || categoryLower.includes('auth')) {
        imagePath = 'images/tools/security.png';
    } else if (categoryLower.includes('ai') || categoryLower.includes('machine learning') || categoryLower.includes('ml')) {
        imagePath = 'images/tools/ai.png';
    } else if (categoryLower.includes('analytics') || categoryLower.includes('monitor')) {
        imagePath = 'images/tools/analytics.png';
    }
    
    return imagePath;
}

/**
 * Enhance a suggested tool with image path and ID
 * @param {Object} tool - The tool object from AI
 * @return {Object} Enhanced tool object
 */
function enhanceToolWithImageAndId(tool) {
    // Create a clean ID from the name (lowercase, no spaces)
    const id = tool.name.toLowerCase().replace(/\s+/g, '-');
    
    // Check if we have this tool in our existing database
    const existingTool = ALL_TOOLS.find(t => 
        t.name.toLowerCase() === tool.name.toLowerCase() ||
        t.id === id
    );
    
    if (existingTool) {
        // Use existing tool's image and ID if available
        return {
            ...tool,
            id: existingTool.id,
            imagePath: existingTool.imagePath || getDefaultImageForCategory(tool.category)
        };
    }
    
    // For tools not in our database, use a default image based on category
    return {
        ...tool,
        id: id,
        imagePath: getDefaultImageForCategory(tool.category)
    };
}