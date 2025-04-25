/**
 * Fluentia - Software Planning Tool
 * AI Chat Module - Handles AI code generation based on connected tools
 */

// AI Chat State
let aiChatState = {
    currentStep: 0,
    answers: [],
    questions: [
      "", // Will be generated based on selected tools
      "", // Will be generated based on Q1 answer
      ""  // Will be generated based on Q1+Q2 answers
    ],
    sourceToolName: "",
    targetToolName: "",
    currentConnection: null, // Store reference to current connection
    visible: false,
    position: { x: null, y: null } // For draggable positioning
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
      return;
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
    if (!aiChatBox) return;
    
    // Reset the chat state
    aiChatState = {
      currentStep: 0,
      answers: [],
      questions: ["", "", ""],
      sourceToolName: sourceToolName,
      targetToolName: targetToolName,
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
    
    // Add initial message
    appendAiMessage(`I'll help you connect ${sourceToolName} with ${targetToolName}. Let me ask a few quick questions.`);
    
    // Set focus on input
    setTimeout(() => aiUserInput.focus(), 300);
    
    // Generate the first question
    generateNextQuestion();
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
    
    // Store the answer
    aiChatState.answers.push(answer);
    
    // Clear the input
    aiUserInput.value = '';
    
    // Display user's message
    appendUserMessage(answer);
    
    // Move to the next step
    aiChatState.currentStep++;
    
    // Check if we need to ask another question or generate code
    if (aiChatState.currentStep < 3) {
      // Generate the next question
      generateNextQuestion();
    } else {
      // Generate the final code
      generateFinalCode();
      
      // Reset for a new potential chat session
      setTimeout(() => {
        aiChatState.currentStep = 0;
        aiChatState.answers = [];
      }, 2000);
    }
  }
  
  // Generate the next question based on the current step and previous answers
  async function generateNextQuestion() {
    appendAiMessage("Thinking...", "ai-thinking");
    
    let prompt;
    const sourceToolName = aiChatState.sourceToolName;
    const targetToolName = aiChatState.targetToolName;
    
    switch (aiChatState.currentStep) {
      case 0:
        // First question about the specific use case - shorter and more focused
        prompt = `I need to connect ${sourceToolName} with ${targetToolName} in code.
        Ask one brief technical question (max 10 words) about the specific use case or requirements.
        Only return the question, nothing else.`;
        break;
        
      case 1:
        // Second question - shorter and more focused
        prompt = `Connecting ${sourceToolName} with ${targetToolName}.
        Use case: ${aiChatState.answers[0]}
        Ask one brief technical question (max 10 words) about data format or configuration.
        Only return the question, nothing else.`;
        break;
        
      case 2:
        // Third question - shorter and more focused
        prompt = `Connecting ${sourceToolName} with ${targetToolName}.
        Use case: ${aiChatState.answers[0]}
        Format: ${aiChatState.answers[1]}
        Ask one brief technical question (max 10 words) about error handling or specific implementation detail.
        Only return the question, nothing else.`;
        break;
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
      appendAiMessage("Error generating question. Please describe your requirements.");
    }
  }
  
  // Generate the final code based on all answers
  async function generateFinalCode() {
    appendAiMessage("Generating code...", "ai-thinking");
    
    const requirements = aiChatState.questions.map((q, i) => `${q} → ${aiChatState.answers[i]}`).join('\n');
    const prompt = `Generate concise code to connect ${aiChatState.sourceToolName} with ${aiChatState.targetToolName}.
    
    Requirements:
    ${requirements}
    
    Return ONLY the code with minimal comments. Keep it under 30 lines.
    No explanations, just working code with necessary imports and configuration.`;
    
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
        } else if (typeof updateCodeIconForConnection === 'function') {
          updateCodeIconForConnection(aiChatState.currentConnection);
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
      appendAiMessage("Sorry, I had trouble generating the code. Please try again later.");
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