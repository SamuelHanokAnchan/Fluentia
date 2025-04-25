/**
 * Fluentia - Software Planning Tool
 * Questions Module - Handles tools questions and answers
 */

// Global storage for answers
let PROJECT_ANSWERS = {};
const ANSWERS_STORAGE_KEY = 'fluentia_answers';

// Initialize the question-answer system
function initQuestionSystem() {
    // Load existing answers if any
    loadAnswers();
    
    // Listen for node creation events
    document.addEventListener('toolNodeCreated', function(e) {
        if (e.detail && e.detail.node && e.detail.toolData) {
            setTimeout(() => {
                showQuestionsForNode(e.detail.node, e.detail.toolData);
            }, 500); // Slight delay to ensure node is rendered
        }
    });
}

// Load saved answers from local storage
function loadAnswers() {
    try {
        const savedAnswers = localStorage.getItem(ANSWERS_STORAGE_KEY);
        if (savedAnswers) {
            PROJECT_ANSWERS = JSON.parse(savedAnswers);
            console.log("Loaded saved answers:", PROJECT_ANSWERS);
        }
    } catch (error) {
        console.error("Error loading saved answers:", error);
        // Initialize as empty object if loading fails
        PROJECT_ANSWERS = {};
    }
}

// Save answers to local storage
function saveAnswers() {
    try {
        localStorage.setItem(ANSWERS_STORAGE_KEY, JSON.stringify(PROJECT_ANSWERS));
        console.log("Answers saved successfully");
    } catch (error) {
        console.error("Error saving answers:", error);
        showToast("Error saving your answers", "error");
    }
}

// Show question box for a node
function showQuestionsForNode(node, toolData) {
    if (!node || !toolData) return;
    
    // Check if tool has questions
    if (!toolData.questions || !Array.isArray(toolData.questions) || toolData.questions.length === 0) {
        console.log(`No questions for tool: ${toolData.name}`);
        return;
    }
    
    // Get project name
    const projectName = document.getElementById('projectName').textContent || 'Untitled Project';
    
    // Initialize project in answers storage if needed
    if (!PROJECT_ANSWERS[projectName]) {
        PROJECT_ANSWERS[projectName] = {};
    }
    
    // Initialize tool in project answers if needed
    if (!PROJECT_ANSWERS[projectName][toolData.id]) {
        PROJECT_ANSWERS[projectName][toolData.id] = {};
    }
    
    // Create question box
    const questionBox = document.createElement('div');
    questionBox.className = 'question-box';
    questionBox.id = `question-box-${toolData.id}`;
    questionBox.innerHTML = `
        <div class="question-box-header">
            <h4>${toolData.name} Questions</h4>
            <button class="question-box-close">×</button>
        </div>
        <div class="question-content">
            <div class="question-progress">Question 1 of ${toolData.questions.length}</div>
            <div class="question-text">${toolData.questions[0]}</div>
            <textarea class="question-answer" placeholder="Enter your answer here..."></textarea>
            <div class="question-actions">
                <button class="btn-next-question">Next</button>
            </div>
        </div>
    `;
    
    // Position the question box near the node
    const nodeRect = node.getBoundingClientRect();
    const workspaceContainer = document.getElementById('workspaceContainer');
    const workspaceRect = workspaceContainer.getBoundingClientRect();
    
    questionBox.style.position = 'absolute';
    questionBox.style.top = `${nodeRect.bottom + 10}px`;
    questionBox.style.left = `${nodeRect.left}px`;
    questionBox.style.zIndex = '100';
    
    // Add to workspace
    workspaceContainer.appendChild(questionBox);
    
    // Initialize question state
    const questionState = {
        currentIndex: 0,
        totalQuestions: toolData.questions.length
    };
    
    // Load existing answer if available
    const currentQuestionKey = toolData.questions[0];
    const savedAnswer = PROJECT_ANSWERS[projectName][toolData.id][currentQuestionKey];
    if (savedAnswer) {
        questionBox.querySelector('.question-answer').value = savedAnswer;
    }
    
    // Handle close button
    questionBox.querySelector('.question-box-close').addEventListener('click', function() {
        // Save current answer before closing
        const answer = questionBox.querySelector('.question-answer').value.trim();
        if (answer) {
            const currentQuestion = toolData.questions[questionState.currentIndex];
            PROJECT_ANSWERS[projectName][toolData.id][currentQuestion] = answer;
            saveAnswers();
        }
        
        questionBox.remove();
    });
    
    // Handle next button
    questionBox.querySelector('.btn-next-question').addEventListener('click', function() {
        // Save current answer
        const answer = questionBox.querySelector('.question-answer').value.trim();
        const currentQuestion = toolData.questions[questionState.currentIndex];
        
        if (answer) {
            PROJECT_ANSWERS[projectName][toolData.id][currentQuestion] = answer;
            saveAnswers();
        } else {
            // Alert if no answer provided
            showToast("Please provide an answer before continuing", "warning");
            return;
        }
        
        // Move to next question or finish
        questionState.currentIndex++;
        if (questionState.currentIndex < questionState.totalQuestions) {
            // Update progress indicator
            questionBox.querySelector('.question-progress').textContent = 
                `Question ${questionState.currentIndex + 1} of ${questionState.totalQuestions}`;
            
            // Update question text
            const nextQuestion = toolData.questions[questionState.currentIndex];
            questionBox.querySelector('.question-text').textContent = nextQuestion;
            
            // Clear or load existing answer
            const nextSavedAnswer = PROJECT_ANSWERS[projectName][toolData.id][nextQuestion];
            questionBox.querySelector('.question-answer').value = nextSavedAnswer || '';
            
            // Update button text for last question
            if (questionState.currentIndex === questionState.totalQuestions - 1) {
                questionBox.querySelector('.btn-next-question').textContent = 'Finish';
            }
        } else {
            // All questions answered
            questionBox.remove();
            showToast(`All questions for ${toolData.name} completed!`, "success");
        }
    });
}

// Add a custom event to createToolNode function to trigger question display
// Modify the original createToolNode function to dispatch this event
const originalCreateToolNode = window.createToolNode || function() {};

window.createToolNode = function(id, toolData, x, y) {
    const node = originalCreateToolNode(id, toolData, x, y);
    
    if (node) {
        // Dispatch custom event for question system
        const event = new CustomEvent('toolNodeCreated', {
            detail: { node, toolData }
        });
        document.dispatchEvent(event);
    }
    
    return node;
};

// Export node answers as JSON
function exportNodeAnswers() {
    try {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(PROJECT_ANSWERS, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "fluentia_answers.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    } catch (error) {
        console.error("Error exporting answers:", error);
        showToast("Error exporting answers", "error");
    }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize after a short delay to ensure other components are loaded
    setTimeout(initQuestionSystem, 1000);
    
    // Add export button to toolbar
    const toolbarDropdown = document.querySelector('.toolbar .dropdown:nth-child(1) .dropdown-content');
    if (toolbarDropdown) {
        const exportBtn = document.createElement('a');
        exportBtn.href = '#';
        exportBtn.textContent = 'Export Answers';
        exportBtn.addEventListener('click', exportNodeAnswers);
        toolbarDropdown.appendChild(exportBtn);
    }
});