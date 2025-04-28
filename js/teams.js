// Team Management Modal Scripts
document.addEventListener('DOMContentLoaded', function() {
    // Add the team button to navbar if not already there
    const navActions = document.querySelector('.nav-actions');
    if (navActions && !document.getElementById('teamManagementBtn')) {
        const teamBtn = document.createElement('button');
        teamBtn.className = 'btn btn-primary team-btn';
        teamBtn.id = 'teamManagementBtn';
        teamBtn.textContent = 'Team';
        
        // Insert before export button
        const exportBtn = navActions.querySelector('.export-btn');
        if (exportBtn) {
            navActions.insertBefore(teamBtn, exportBtn);
        } else {
            navActions.appendChild(teamBtn);
        }
    }

    // Elements
    const teamManagementBtn = document.getElementById('teamManagementBtn');
    const teamManagementModal = document.getElementById('teamManagementModal');
    const closeTeamModalBtn = document.getElementById('closeTeamModalBtn');
    const teamForm = document.getElementById('team-form');
    const teamMembersContainer = document.getElementById('team-members-container');
    const addMemberBtn = document.getElementById('add-member-btn');
    const addMemberModal = document.getElementById('add-member-modal');
    const addMemberForm = document.getElementById('add-member-form');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelAddMemberBtn = document.getElementById('cancel-add-member');
    const resetFormBtn = document.getElementById('reset-form-btn');
    const teamsGrid = document.getElementById('teams-grid');
    const tabs = document.querySelectorAll('.tm-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Initialize variables
    let teams = JSON.parse(localStorage.getItem('fluentia_teams')) || [];
    let currentTeamIndex = -1;
    let membersCount = 0;
    let viewingOnly = false; // Flag to indicate if we're in view-only mode
    let teamToDeleteIndex = -1;
    
    // Open team management modal
    if (teamManagementBtn) {
        teamManagementBtn.addEventListener('click', function() {
            teamManagementModal.style.display = 'flex';
            
            // Reset viewingOnly flag
            viewingOnly = false;
            
            // Refresh teams list
            renderTeams();
        });
    }
    
    // Close team management modal
    if (closeTeamModalBtn) {
        closeTeamModalBtn.addEventListener('click', function() {
            teamManagementModal.style.display = 'none';
        });
    }
    
    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding content
            tabContents.forEach(content => {
                content.style.display = 'none';
                if (content.id === tabId) {
                    content.style.display = 'block';
                }
            });
            
            // Reset viewingOnly flag when switching tabs
            viewingOnly = false;
            
            // Reset form if switching to create tab
            if (tabId === 'create-team') {
                resetForm();
            }
            
            // Refresh teams list when switching to view tab
            if (tabId === 'view-teams') {
                renderTeams();
            }
        });
    });
    
    // Open add member modal
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', () => {
            if (!viewingOnly) {
                addMemberModal.style.display = 'flex';
                addMemberModal.classList.add('active');
                document.getElementById('member-name').focus();
            }
        });
    }
    
    // Close modal handlers
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    if (cancelAddMemberBtn) {
        cancelAddMemberBtn.addEventListener('click', closeModal);
    }
    
    function closeModal() {
        addMemberModal.classList.remove('active');
        addMemberModal.style.display = 'none';
        addMemberForm.reset();
    }
    
    // Handle adding a team member
    if (addMemberForm) {
        addMemberForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const memberName = document.getElementById('member-name').value;
            const memberEmail = document.getElementById('member-email').value;
            const memberPosition = document.getElementById('member-position').value;
            const memberGithub = document.getElementById('member-github').value;
            const memberRole = document.getElementById('member-role').value;
            
            addTeamMember({
                id: Date.now(),
                name: memberName,
                email: memberEmail,
                position: memberPosition,
                github: memberGithub,
                role: memberRole
            }, false);
            
            closeModal();
            showToast('Team member added successfully', 'success');
        });
    }
    
    // Add team member to the form
    function addTeamMember(member, isViewOnly = false) {
        // Increment member count if not in view-only mode
        if (!isViewOnly) {
            membersCount++;
        }
        
        const memberCard = document.createElement('div');
        memberCard.className = `tm-member-card tm-role-${member.role}-card`;
        memberCard.dataset.id = member.id;
        
        // Get role color class
        let roleColorClass = '';
        switch (member.role) {
            case 'owner':
                roleColorClass = 'tm-role-owner';
                break;
            case 'admin':
                roleColorClass = 'tm-role-admin';
                break;
            case 'member':
                roleColorClass = 'tm-role-member';
                break;
            case 'viewer':
                roleColorClass = 'tm-role-viewer';
                break;
            default:
                roleColorClass = 'tm-role-member';
        }
        
        // Format role name for display
        const roleDisplayName = member.role.charAt(0).toUpperCase() + member.role.slice(1);
        
        memberCard.innerHTML = `
            <div class="tm-member-header">
                <div class="tm-member-role-indicator ${roleColorClass}"></div>
                <span class="tm-member-name">${member.name}</span>
                <span class="tm-member-role">${roleDisplayName}</span>
            </div>
            <div style="margin-left: 26px;">
                <div class="tm-member-email">${member.email}</div>
                ${member.position ? `<div class="tm-member-position">${member.position}</div>` : ''}
                ${member.github ? `<div class="tm-member-github"><a href="${member.github}" target="_blank">${member.github.replace('https://github.com/', '@')}</a></div>` : ''}
            </div>
            ${member.role !== 'owner' && !isViewOnly ? `<button type="button" class="tm-member-remove" data-id="${member.id}">&times;</button>` : ''}
        `;
        
        teamMembersContainer.appendChild(memberCard);
        
        // Add remove event listener (except for owner or in view-only mode)
        if (member.role !== 'owner' && !isViewOnly) {
            const removeBtn = memberCard.querySelector('.tm-member-remove');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    memberCard.remove();
                    membersCount--;
                    showToast('Team member removed', 'warning');
                });
            }
        }
    }
    
    // Handle team form submission
    if (teamForm) {
        teamForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Skip form submission if in view-only mode
            if (viewingOnly) {
                return;
            }
            
            // Get form values
            const teamName = document.getElementById('team-name').value;
            const teamProject = document.getElementById('team-project').value;
            const teamDescription = document.getElementById('team-description').value;
            const ownerName = document.getElementById('owner-name').value;
            const ownerEmail = document.getElementById('owner-email').value;
            const ownerPosition = document.getElementById('owner-position').value;
            const ownerGithub = document.getElementById('owner-github').value;
            
            // Create team owner
            const owner = {
                id: Date.now(),
                name: ownerName,
                email: ownerEmail,
                position: ownerPosition,
                github: ownerGithub,
                role: 'owner'
            };
            
            // Get team members from the DOM
            const memberCards = teamMembersContainer.querySelectorAll('.tm-member-card');
            const members = [owner]; // Start with owner
            
            memberCards.forEach(card => {
                // Skip if it's the owner card (which we already added)
                if (card.querySelector('.tm-member-role-indicator.tm-role-owner')) {
                    return;
                }
                
                // Get member info from data attributes and inner content
                const id = card.dataset.id;
                const name = card.querySelector('.tm-member-name').textContent;
                const roleText = card.querySelector('.tm-member-role').textContent.trim();
                const role = roleText.toLowerCase();
                
                // Get email, position and github from the div content
                const email = card.querySelector('.tm-member-email').textContent;
                let position = '';
                let github = '';
                
                const positionElement = card.querySelector('.tm-member-position');
                if (positionElement) {
                    position = positionElement.textContent;
                }
                
                // Check for github link
                const githubLink = card.querySelector('.tm-member-github a');
                if (githubLink) {
                    github = githubLink.href;
                }
                
                members.push({
                    id: parseInt(id),
                    name,
                    email,
                    position,
                    github,
                    role
                });
            });
            
            // Create team object
            const team = {
                id: Date.now(),
                name: teamName,
                project: teamProject,
                description: teamDescription,
                createdAt: new Date().toISOString(),
                members: members
            };
            
            // Add to teams array
            if (currentTeamIndex >= 0) {
                // Update existing team
                teams[currentTeamIndex] = team;
                showToast(`Team "${teamName}" updated successfully`, 'success');
            } else {
                // Add new team
                teams.push(team);
                showToast(`Team "${teamName}" created successfully`, 'success');
            }
            
            // Save to localStorage
            localStorage.setItem('fluentia_teams', JSON.stringify(teams));
            
            // Reset form and state
            resetForm();
            
            // Switch to view teams tab
            document.querySelector('.tm-tab[data-tab="view-teams"]').click();
        });
    }
    
    // Reset form
    if (resetFormBtn) {
        resetFormBtn.addEventListener('click', resetForm);
    }
    
    function resetForm() {
        if (teamForm) teamForm.reset();
        if (teamMembersContainer) teamMembersContainer.innerHTML = '';
        membersCount = 0;
        currentTeamIndex = -1;
        viewingOnly = false;
        
        // Make form fields editable
        enableFormFields();
        
        // Show add member button
        if (addMemberBtn) {
            addMemberBtn.style.display = 'inline-flex';
        }
        
        // Update form button text
        const submitBtn = teamForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Create Team';
        }
    }
    
    function disableFormFields() {
        // Make all form inputs read-only
        const inputs = teamForm.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.setAttribute('readonly', 'readonly');
            input.style.backgroundColor = '#f3f4f6';
            input.style.borderColor = '#e5e7eb';
            input.style.cursor = 'not-allowed';
        });
        
        // Hide form buttons
        const submitBtn = teamForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.style.display = 'none';
        }
        
        // Change reset button to "Back to List"
        if (resetFormBtn) {
            resetFormBtn.textContent = 'Back to Teams';
        }
    }
    
    function enableFormFields() {
        // Make all form inputs editable
        const inputs = teamForm.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.removeAttribute('readonly');
            input.style.backgroundColor = '';
            input.style.borderColor = '';
            input.style.cursor = '';
        });
        
        // Show form buttons
        const submitBtn = teamForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.style.display = 'inline-flex';
        }
        
        // Change reset button back to "Reset"
        if (resetFormBtn) {
            resetFormBtn.textContent = 'Reset';
        }
    }
    
    // Render teams in the view tab
    function renderTeams() {
        if (!teamsGrid) return;
        
        // Check if there are teams
        if (teams.length === 0) {
            teamsGrid.innerHTML = '<p class="no-teams-message">No teams created yet. Create your first team using the \'Create Team\' tab.</p>';
            return;
        }
        
        // Clear teams container
        teamsGrid.innerHTML = '';
        
        // Render each team
        teams.forEach((team, index) => {
            const teamCard = document.createElement('div');
            teamCard.className = 'tm-team-card';
            
            // Get member counts by role
            const memberCounts = team.members.reduce((acc, member) => {
                acc[member.role] = (acc[member.role] || 0) + 1;
                return acc;
            }, {});
            
            // Find the owner
            const owner = team.members.find(member => member.role === 'owner');
            
            // Create avatars for members (max 4 avatars + "more" if needed)
            let avatarsHTML = '';
            const displayedMembers = team.members.slice(0, 4);
            
            displayedMembers.forEach(member => {
                // Get initials for avatar
                const initials = member.name.split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);
                
                avatarsHTML += `<div class="tm-avatar" title="${member.name}">${initials}</div>`;
            });
            
            // Add "more" avatar if needed
            if (team.members.length > 4) {
                const moreCount = team.members.length - 4;
                avatarsHTML += `<div class="tm-avatar tm-avatar-more" title="${moreCount} more members">+${moreCount}</div>`;
            }
            
            teamCard.innerHTML = `
                <div class="tm-team-card-header">
                    <div>
                        <h3 style="margin: 0; font-size: 1.1rem;">${team.name}</h3>
                        <div style="color: var(--gray-600); font-size: 0.85rem; margin-top: 0.25rem;">
                            ${owner ? `Created by ${owner.name}` : ''}
                            <span style="margin-left: 0.5rem; color: var(--gray-400);">
                                ${new Date(team.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <div class="tm-badge tm-badge-primary">${team.members.length} ${team.members.length === 1 ? 'member' : 'members'}</div>
                </div>
                <div class="tm-team-card-body">
                    ${team.description ? `<p style="margin-top: 0; color: var(--gray-700);">${team.description}</p>` : ''}
                    ${team.project ? `<p style="margin-bottom: 0.5rem; font-size: 0.9rem;">Project: <strong>${team.project}</strong></p>` : ''}
                    
                    <div class="tm-team-members-preview">
                        ${avatarsHTML}
                    </div>
                    
                    <div style="display: flex; justify-content: flex-end; margin-top: 1rem;">
                        <button type="button" class="btn btn-secondary btn-sm view-team-btn" data-index="${index}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.25rem; vertical-align: -3px;">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            View Team
                        </button>
                        <button type="button" class="btn btn-primary btn-sm edit-team-btn" style="margin-left: 0.5rem;" data-index="${index}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.25rem; vertical-align: -3px;">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit
                        </button>
                        <button type="button" class="btn btn-danger btn-sm delete-team-btn" style="margin-left: 0.5rem;" data-index="${index}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.25rem; vertical-align: -3px;">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>
            `;
            
            teamsGrid.appendChild(teamCard);
            
            // Add event listeners
            const viewBtn = teamCard.querySelector('.view-team-btn');
            viewBtn.addEventListener('click', () => {
                viewTeam(index);
            });
            
            const editBtn = teamCard.querySelector('.edit-team-btn');
            editBtn.addEventListener('click', () => {
                editTeam(index);
            });
            
            const deleteBtn = teamCard.querySelector('.delete-team-btn');
            deleteBtn.addEventListener('click', () => {
                showDeleteConfirmation(index);
            });
        });
    }
    
    // View team (read-only mode)
    function viewTeam(index) {
        const team = teams[index];
        currentTeamIndex = index;
        viewingOnly = true;
        
        // Set team info
        document.getElementById('team-name').value = team.name;
        document.getElementById('team-project').value = team.project || '';
        document.getElementById('team-description').value = team.description || '';
        
        // Find owner
        const owner = team.members.find(m => m.role === 'owner');
        
        // Set owner info
        if (owner) {
            document.getElementById('owner-name').value = owner.name;
            document.getElementById('owner-email').value = owner.email;
            document.getElementById('owner-position').value = owner.position || '';
            document.getElementById('owner-github').value = owner.github || '';
        }
        
        // Clear existing members
        teamMembersContainer.innerHTML = '';
        membersCount = 0;
        
        // Add all members in view-only mode
        team.members.forEach(member => {
            addTeamMember(member, true);
        });
        
        // Make form fields read-only
        disableFormFields();
        
        // Hide add member button
        if (addMemberBtn) {
            addMemberBtn.style.display = 'none';
        }
        
        // Switch to create tab (which we're repurposing for view)
        document.querySelector('.tm-tab[data-tab="create-team"]').click();
        
        // Scroll to top of modal
        document.querySelector('.tm-modal-content').scrollTop = 0;
        
        // Show toast
        showToast(`Viewing team: ${team.name}`, 'info');
    }
    
    // Edit team
    function editTeam(index) {
        const team = teams[index];
        currentTeamIndex = index;
        viewingOnly = false;
        
        // Set team info
        document.getElementById('team-name').value = team.name;
        document.getElementById('team-project').value = team.project || '';
        document.getElementById('team-description').value = team.description || '';
        
        // Find owner
        const owner = team.members.find(m => m.role === 'owner');
        
        // Set owner info
        if (owner) {
            document.getElementById('owner-name').value = owner.name;
            document.getElementById('owner-email').value = owner.email;
            document.getElementById('owner-position').value = owner.position || '';
            document.getElementById('owner-github').value = owner.github || '';
        }
        
        // Clear existing members
        teamMembersContainer.innerHTML = '';
        membersCount = 0;
        
        // Add non-owner members
        team.members.forEach(member => {
            if (member.role !== 'owner') {
                addTeamMember(member, false);
            }
        });
        
        // Enable form fields
        enableFormFields();
        
        // Show add member button
        if (addMemberBtn) {
            addMemberBtn.style.display = 'inline-flex';
        }
        
        // Update form button text
        const submitBtn = teamForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Update Team';
        }
        
        // Switch to create tab (which we're using for edit)
        document.querySelector('.tm-tab[data-tab="create-team"]').click();
        
        // Scroll to top of modal
        document.querySelector('.tm-modal-content').scrollTop = 0;
        
        // Show toast
        showToast(`Editing team: ${team.name}`, 'info');
    }
    
    // Show delete confirmation
    function showDeleteConfirmation(index) {
        // Create modal if it doesn't exist
        if (!document.getElementById('deleteTeamModal')) {
            const modalHTML = `
                <div class="modal-overlay" id="deleteTeamModal" style="display: none;">
                    <div class="modal-content" style="max-width: 400px;">
                        <div class="modal-header">
                            <h3>Confirm Delete</h3>
                            <button class="modal-close-btn" id="closeDeleteModalBtn">&times;</button>
                        </div>
                        <div class="modal-body">
                            <p id="deleteTeamMessage">Are you sure you want to delete this team?</p>
                            <div class="tm-form-actions">
                                <button type="button" class="btn btn-secondary" id="cancelDeleteBtn">Cancel</button>
                                <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
        
        // Set up modal
        const teamName = teams[index].name;
        const deleteTeamMessage = document.getElementById('deleteTeamMessage');
        const deleteTeamModal = document.getElementById('deleteTeamModal');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
        
        // Store the team index
        teamToDeleteIndex = index;
        
        // Set the confirmation message
        deleteTeamMessage.textContent = `Are you sure you want to delete the team "${teamName}"? This action cannot be undone.`;
        
        // Show the modal
        deleteTeamModal.style.display = 'flex';
        
        // Add click events for the buttons
        confirmDeleteBtn.onclick = confirmDeleteTeam;
        cancelDeleteBtn.onclick = closeDeleteModal;
        closeDeleteModalBtn.onclick = closeDeleteModal;
        
        // Close modal when clicking outside
        window.addEventListener('click', function closeOnClickOutside(event) {
            if (event.target === deleteTeamModal) {
                closeDeleteModal();
                window.removeEventListener('click', closeOnClickOutside);
            }
        });
    }
    
    // Close delete modal
    function closeDeleteModal() {
        const deleteTeamModal = document.getElementById('deleteTeamModal');
        if (deleteTeamModal) {
            deleteTeamModal.style.display = 'none';
        }
        teamToDeleteIndex = -1;
    }
    
    // Confirm team deletion
    function confirmDeleteTeam() {
        if (teamToDeleteIndex >= 0) {
            const teamName = teams[teamToDeleteIndex].name;
            
            // Remove team from array
            teams.splice(teamToDeleteIndex, 1);
            
            // Update localStorage
            localStorage.setItem('fluentia_teams', JSON.stringify(teams));
            
            // Close the modal
            closeDeleteModal();
            
            // Re-render teams list
            renderTeams();
            
            // Show success message
            showToast(`Team "${teamName}" deleted successfully`, 'success');
        }
    }
    
    // Show toast notification
    function showToast(message, type = 'info') {
        // Try to use existing toast container, create if not found
        let toastContainer = document.getElementById('tm-toast-container');
        
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'tm-toast-container';
            toastContainer.className = 'tm-toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `tm-toast tm-toast-${type}`;
        
        // Icon based on type
        let icon = '';
        switch (type) {
            case 'success':
                icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tm-toast-icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
                break;
            case 'error':
                icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tm-toast-icon"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
                break;
            case 'warning':
                icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tm-toast-icon"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
                break;
            default:
                icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tm-toast-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
        }
        
        toast.innerHTML = `${icon}<span>${message}</span>`;
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Show toast with animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Auto hide after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
    
    // Initialize - render teams if any
    renderTeams();
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === teamManagementModal) {
            teamManagementModal.style.display = 'none';
        }
    });
});