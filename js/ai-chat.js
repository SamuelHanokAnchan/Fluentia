/**
 * Fluentia - Software Planning Tool
 * AI Chat Module - Handles AI code generation based on connected tools
 */

// AI Chat State
let aiChatState = {
    currentStep: -1, // Start at -1 to get description first
    answers: [],
    questions: [
      "", // Will be dynamically generated based on description
      "", // Will be dynamically generated based on previous answers
      ""  // Will be dynamically generated based on previous answers
    ],
    sourceToolName: "",
    targetToolName: "",
    userDescription: "", // Store the user's initial description
    projectType: "", // Store the project type
    projectName: "", // Store the project name
    currentConnection: null,
    visible: false,
    position: { x: null, y: null }
};
  
// Cache DOM elements
let aiChatBox, aiChatMessages, aiUserInput, aiSendButton, closeAiChat;
  
// Initialize the AI Chat Module
function initAiChat() {
    // Cache DOM elements
    aiChatBox = document.getElementById('aiChatBox');
    aiChatMessages = document.getElementById('aiChatMessages');
    aiUserInput = document.getElementById('aiUserInput');
    aiSendButton = document.getElementById('aiSendButton');
    closeAiChat = document.getElementById('closeAiChat');
    
    if (!aiChatBox || !aiChatMessages || !aiUserInput || !aiSendButton || !closeAiChat) {
        console.error("AI Chat elements not found in the DOM");
        
        // Create them if they don't exist
        createAIChatBox();
        
        // Re-cache elements
        aiChatBox = document.getElementById('aiChatBox');
        aiChatMessages = document.getElementById('aiChatMessages');
        aiUserInput = document.getElementById('aiUserInput');
        aiSendButton = document.getElementById('aiSendButton');
        closeAiChat = document.getElementById('closeAiChat');
    }
    
    // Add event listeners
    aiSendButton.addEventListener('click', handleUserAnswer);
    aiUserInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUserAnswer();
    });
    
    closeAiChat.addEventListener('click', () => {
        hideAiChat();
    });
    
    // Make chat box draggable
    makeChatDraggable();
    
    // Create the code modal element
    createConnectionCodeModal();
    
    console.log("AI Chat module initialized");
}

// Create AI Chat Box if it doesn't exist
function createAIChatBox() {
    const chatBoxHTML = `
        <div id="aiChatBox" class="ai-chat-box" style="display: none;">
            <div class="ai-chat-header">
                <h3>AI Code Generator</h3>
                <button id="closeAiChat" class="close-chat-btn">&times;</button>
            </div>
            <div id="aiChatMessages" class="ai-chat-messages"></div>
            <div class="ai-chat-input">
                <input type="text" id="aiUserInput" placeholder="Type your answer..." />
                <button id="aiSendButton">Send</button>
            </div>
        </div>
    `;
    
    // Append to body
    document.body.insertAdjacentHTML('beforeend', chatBoxHTML);
}
  
// Create connection code modal element
function createConnectionCodeModal() {
    // Check if modal already exists
    if (document.getElementById('connectionCodeModal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'connectionCodeModal';
    modal.className = 'connection-code-modal';
    
    modal.innerHTML = `
        <div class="connection-code-header">
            <span id="connectionCodeTitle">Connection Code</span>
            <button class="close-code-modal-btn" id="closeCodeModalBtn">&times;</button>
        </div>
        <div class="connection-code-content">
            <pre class="connection-code-block" id="connectionCodeBlock"></pre>
            <button class="copy-code-btn" id="copyCodeBtn">Copy Code</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add copy code button functionality
    document.getElementById('copyCodeBtn').addEventListener('click', function() {
        const code = document.getElementById('connectionCodeBlock').textContent;
        navigator.clipboard.writeText(code)
            .then(() => showToast("Code copied to clipboard", "success"))
            .catch(err => console.error('Could not copy text: ', err));
    });
    
    // Add close button functionality
    document.getElementById('closeCodeModalBtn').addEventListener('click', function() {
        document.getElementById('connectionCodeModal').style.display = 'none';
    });
}
  
// Make chat box draggable
function makeChatDraggable() {
    if (!aiChatBox) return;
    
    let offsetX, offsetY, isDragging = false;
    
    aiChatBox.querySelector('.ai-chat-header').addEventListener('mousedown', function(e) {
        isDragging = true;
        offsetX = e.clientX - aiChatBox.getBoundingClientRect().left;
        offsetY = e.clientY - aiChatBox.getBoundingClientRect().top;
        
        // Prevent text selection during drag
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        
        // Check boundaries to keep inside viewport
        const maxX = window.innerWidth - aiChatBox.offsetWidth;
        const maxY = window.innerHeight - aiChatBox.offsetHeight;
        
        const boundedX = Math.max(0, Math.min(x, maxX));
        const boundedY = Math.max(0, Math.min(y, maxY));
        
        // Set new position
        aiChatBox.style.left = boundedX + 'px';
        aiChatBox.style.top = boundedY + 'px';
        aiChatBox.style.right = 'auto';
        aiChatBox.style.bottom = 'auto';
        
        // Save position
        aiChatState.position = { x: boundedX, y: boundedY };
    });
    
    document.addEventListener('mouseup', function() {
        isDragging = false;
    });
}
  
// Show the AI chat and start conversation based on the connected tools
function showAiChatForConnectedTools(sourceToolName, targetToolName, connection) {
    if (!aiChatBox) {
        // Ensure chat box is created
        createAIChatBox();
        
        // Re-cache elements
        aiChatBox = document.getElementById('aiChatBox');
        aiChatMessages = document.getElementById('aiChatMessages');
        aiUserInput = document.getElementById('aiUserInput');
        aiSendButton = document.getElementById('aiSendButton');
        closeAiChat = document.getElementById('closeAiChat');
        
        // Set up event handlers
        aiSendButton.addEventListener('click', handleUserAnswer);
        aiUserInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleUserAnswer();
        });
        
        closeAiChat.addEventListener('click', () => {
            hideAiChat();
        });
        
        makeChatDraggable();
    }
    
    // Get project information
    const projectNameElement = document.getElementById('projectName');
    const projectName = projectNameElement ? projectNameElement.textContent.trim() : "Untitled Project";
    const projectType = projectNameElement ? projectNameElement.getAttribute('data-project-type') || "Unknown" : "Unknown";
    
    // Reset the chat state
    aiChatState = {
        currentStep: -1, // Start at -1 to first get the description
        answers: [],
        questions: ["", "", ""],
        sourceToolName: sourceToolName,
        targetToolName: targetToolName,
        userDescription: "",
        projectType: projectType,
        projectName: projectName,
        currentConnection: connection,
        visible: true,
        position: aiChatState.position // Keep previous position if any
    };
    
    // Set position if first time showing
    if (aiChatState.position.x === null) {
        aiChatBox.style.left = 'auto';
        aiChatBox.style.right = '20px';
        aiChatBox.style.top = 'auto';
        aiChatBox.style.bottom = '20px';
    } else {
        aiChatBox.style.left = aiChatState.position.x + 'px';
        aiChatBox.style.top = aiChatState.position.y + 'px';
        aiChatBox.style.right = 'auto';
        aiChatBox.style.bottom = 'auto';
    }
    
    // Clear previous messages
    aiChatMessages.innerHTML = '';
    
    // Show the chat box
    aiChatBox.style.display = 'flex';
    
    // Add initial message asking for the description
    appendAiMessage(`I'll help you create code to connect ${sourceToolName} with ${targetToolName} for your ${projectType} project "${projectName}".`);
    appendAiMessage(`First, please describe what you want to achieve with this connection. What data or functionality should flow between these tools?`);
    
    // Set focus on input
    setTimeout(() => aiUserInput.focus(), 300);
}
  
// Hide the AI chat
function hideAiChat() {
    if (!aiChatBox) return;
    aiChatBox.style.display = 'none';
    aiChatState.visible = false;
}
  
// Handle user's answer
function handleUserAnswer() {
    const answer = aiUserInput.value.trim();
    if (!answer) return;
    
    // Display user's message
    appendUserMessage(answer);
    
    // Clear the input
    aiUserInput.value = '';
    
    // Handle differently based on current step
    if (aiChatState.currentStep === -1) {
        // This is the initial description
        aiChatState.userDescription = answer;
        aiChatState.currentStep = 0; // Move to first question
        
        // Generate first question based on the description
        generateDynamicQuestion();
    } else {
        // Store the answer to a question
        aiChatState.answers.push(answer);
        
        // Move to the next step
        aiChatState.currentStep++;
        
        // Check if we need to ask another question or generate code
        if (aiChatState.currentStep < 3) {
            // Generate the next question
            generateDynamicQuestion();
        } else {
            // Generate the final code
            generateFinalCode();
            
            // Reset for a new potential chat session
            setTimeout(() => {
                aiChatState.currentStep = -1;
                aiChatState.answers = [];
                aiChatState.userDescription = "";
            }, 2000);
        }
    }
}
  
// Generate a dynamic question based on previous information
async function generateDynamicQuestion() {
    appendAiMessage("Thinking...", "ai-thinking");
    
    const sourceToolName = aiChatState.sourceToolName;
    const targetToolName = aiChatState.targetToolName;
    const userDescription = aiChatState.userDescription;
    const projectType = aiChatState.projectType;
    
    // Construct prompt based on the current conversation state
    let prompt;
    
    if (aiChatState.currentStep === 0) {
        // First question - only have the description
        prompt = `You are a helpful AI assistant analyzing a connection between ${sourceToolName} and ${targetToolName} for a ${projectType} project. 
        
The user has described what they want to achieve as: "${userDescription}"

Based on this description and your knowledge of these technologies, what is the most important technical question you need to ask the user to help generate effective code for this connection? 

Consider what information would be most valuable (e.g., data formats, specific APIs, authentication needs, error handling, etc.) depending on what the user is trying to accomplish.

Your question should be concise (under 15 words), specific, and focused on gathering critical information that would help generate better code.

Respond with ONLY your question, no other text.`;
    } else {
        // Follow-up questions - have previous Q&A
        let context = `I'm helping a user connect ${sourceToolName} with ${targetToolName} for a ${projectType} project.

User's goal: "${userDescription}"`;

        // Add any previous questions and answers
        for (let i = 0; i < aiChatState.currentStep; i++) {
            context += `\nQ: "${aiChatState.questions[i]}"
A: "${aiChatState.answers[i]}"`;
        }

        prompt = `${context}

Based on this conversation so far, what is the next most important technical question I should ask to help generate effective code for this connection?

Choose a question that addresses a different aspect than what we've already covered. Focus on gathering information that would be most helpful for writing code that meets the user's needs.

Your question should be concise (under 15 words), specific, and focused on gathering critical information.

Respond with ONLY your question, no other text.`;
    }
    
    try {
        const question = await callAI(prompt);
        
        // Store the question
        aiChatState.questions[aiChatState.currentStep] = question;
        
        // Remove the "thinking" message
        removeThinkingMessage();
        
        // Display the question
        appendAiMessage(question);
    } catch (error) {
        console.error("Error generating question:", error);
        removeThinkingMessage();
        
        // Fallback questions if API fails
        const fallbackQuestions = [
            "What data format do you want to use for this connection?",
            "Any specific configuration settings you need?",
            "How should errors be handled in this connection?"
        ];
        
        const fallbackQuestion = fallbackQuestions[aiChatState.currentStep];
        aiChatState.questions[aiChatState.currentStep] = fallbackQuestion;
        appendAiMessage(fallbackQuestion);
    }
}
  
// Generate the final code based on all answers
async function generateFinalCode() {
    appendAiMessage("Generating code...", "ai-thinking");
    
    const sourceTool = aiChatState.sourceToolName;
    const targetTool = aiChatState.targetToolName;
    const description = aiChatState.userDescription;
    const projectType = aiChatState.projectType;
    
    // Format the requirements in a clear way
    const conversation = [
        `Project type: ${aiChatState.projectType}`,
        `Project name: ${aiChatState.projectName}`,
        `User wants to: ${description}`,
    ];
    
    // Add all questions and answers
    for (let i = 0; i < aiChatState.currentStep; i++) {
        conversation.push(`Q: ${aiChatState.questions[i]}`);
        conversation.push(`A: ${aiChatState.answers[i]}`);
    }
    
    const requirements = conversation.join('\n');
    
    const prompt = `You're writing code to connect ${sourceTool} with ${targetTool} for a ${projectType} project.

Here's the context from my conversation with the user:
${requirements}

Generate production-ready code that precisely fulfills their needs. Include:
- Necessary imports and configurations
- Well-structured implementation
- Error handling where appropriate
- Brief comments explaining key parts

Focus on delivering exactly what the user described. Return ONLY the code with no additional explanations.`;
    
    try {
        const code = await callAI(prompt);
        
        // Remove the "thinking" message
        removeThinkingMessage();
        
        // Store the code with the connection
        if (aiChatState.currentConnection) {
            aiChatState.currentConnection.codeSnippet = code;
            
            // Update code icon on the connection
            if (typeof addCodeIconToConnection === 'function') {
                addCodeIconToConnection(aiChatState.currentConnection);
            }
        }
        
        // Inform the user that code has been generated
        appendAiMessage("✅ Code generated and attached to the connection! Click the code icon on the connection line to view it.");
        
        // Show success toast
        showToast("Code generated successfully", "success");
        
        // Hide the chat after a delay
        setTimeout(() => {
            hideAiChat();
        }, 3000);
        
    } catch (error) {
        console.error("Error generating code:", error);
        removeThinkingMessage();
        appendAiMessage("Sorry, I had trouble generating the code. Please try again with more specific requirements.");
    }
}
  
// Call the AI model
async function callAI(prompt) {
    try {
        // You can replace this with your actual API call
        const response = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer zTg0D6lABD5ncLQsk6bTQp3pBDVpliGa',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'meta-llama/Meta-Llama-3-8B-Instruct',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1, // Lower temperature for more focused, concise responses
                max_tokens: 500 // Reduced token limit for shorter responses
            })
        });
    
        const data = await response.json();
        return data?.choices?.[0]?.message?.content.trim() || "Could not generate response";
    } catch (error) {
        console.error("Error calling AI:", error);
        throw new Error("Failed to call AI API");
    }
}
  
// Helper function to append AI message
function appendAiMessage(text, className = "") {
    const message = document.createElement('div');
    message.className = `ai-message ${className}`;
    message.textContent = text;
    aiChatMessages.appendChild(message);
    scrollToBottom();
}
  
// Helper function to append user message
function appendUserMessage(text) {
    const message = document.createElement('div');
    message.className = 'user-message';
    message.textContent = text;
    aiChatMessages.appendChild(message);
    scrollToBottom();
}
  
// Helper function to remove "thinking" message
function removeThinkingMessage() {
    const thinkingMessage = aiChatMessages.querySelector('.ai-thinking');
    if (thinkingMessage) {
        aiChatMessages.removeChild(thinkingMessage);
    }
}
  
// Helper function to scroll to the bottom of the chat
function scrollToBottom() {
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
}