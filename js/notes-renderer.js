const CONFIG = {
    jsonPath: "/notes.json",
    defaultSubject: "Biochemistry",
    semesterMap: {
        "semester_1": "Sem-1",
        "semester_2": "Sem-2",
        "semester_3": "Sem-3",
        "semester_4": "Sem-4",
        "semester_5": "Sem-5",
        "semester_6": "Sem-6"
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('notes-container');
    if (!container) return;

    const semesterId = container.getAttribute('data-semester');
    const semesterKey = CONFIG.semesterMap[semesterId];
    
    if (!semesterKey) {
        console.error(`Invalid semester ID: ${semesterId}`);
        container.innerHTML = '<p>Error: Invalid semester configuration.</p>';
        return;
    }

    try {
        const response = await fetch(CONFIG.jsonPath);
        if (!response.ok) throw new Error('Failed to load notes');
        const data = await response.json();
        
        // Transform data for easier rendering: Filter by semester
        const semesterData = getNotesForSemester(data, semesterKey);

        if (Object.keys(semesterData).length === 0) {
            renderEmptyState(container);
            return;
        }

        renderNotes(semesterData, container);
        setupSearch(semesterData, container);

    } catch (error) {
        console.error('Error loading notes:', error);
        container.innerHTML = '<p>Error loading notes. Please try again later.</p>';
    }
});

function getNotesForSemester(data, semesterKey) {
    const result = {};
    if (!data.subjects) return result;

    for (const [subject, semesters] of Object.entries(data.subjects)) {
        if (semesters[semesterKey]) {
            result[subject] = semesters[semesterKey];
        }
    }
    return result;
}

function renderEmptyState(container) {
    container.innerHTML = `
        <div class="pricing-item" style="width: 100%; text-align: center; padding: 2rem;">
            <div class="pricing-plan">
                <div class="pricing-body">
                    <h3>Coming Soon</h3>
                    <p>Notes for this semester are being added. Please check back later.</p>
                </div>
            </div>
        </div>
    `;
}

function renderNotes(data, container) {
    container.innerHTML = '';
    
    const subjects = Object.keys(data).sort();
    
    if (subjects.length === 0) {
        container.innerHTML = '<p>No matching notes found.</p>';
        return;
    }

    subjects.forEach(subject => {
        const notes = data[subject];
        const subjectCard = document.createElement('div');
        subjectCard.className = 'pricing-item';
        
        let notesHtml = '';
        if (notes.length === 0) {
            notesHtml = '<li><span style="color: #666; font-style: italic;">No notes available yet.</span></li>';
        } else {
            notes.forEach(note => {
                let icon = 'fa-download';
                let link = note.url;
                let label = note.title;
                
                if (note.type === 'missing' || link === 'not_found.html') {
                    notesHtml += `
                        <li class="note-item">
                            <span class="note-title">${label}</span>
                            <span class="note-status coming-soon">Coming Soon</span>
                        </li>`;
                } else {
                    notesHtml += `
                        <li class="note-item">
                            <span class="note-title">${label}</span>
                            <a href="${link}" target="_blank" class="download-btn">
                                <i class="fa ${icon}"></i> Download
                            </a>
                        </li>
                    `;
                }
            });
        }

        subjectCard.innerHTML = `
            <div class="pricing-plan">
                <div class="pricing-header">
                    <h3>${subject}</h3>
                </div>
                <div class="pricing-body">
                    <ul>
                        ${notesHtml}
                    </ul>
                </div>
            </div>
        `;
        container.appendChild(subjectCard);
    });
}

function setupSearch(data, container) {
    let searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    // Clone input to remove listeners from main.js to avoid conflicts
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    searchInput = newSearchInput;

    let debounceTimer;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const term = e.target.value.toLowerCase();
            const filteredData = {};

            Object.keys(data).forEach(subject => {
                const notes = data[subject];
                
                // Check if subject matches
                const subjectMatch = subject.toLowerCase().includes(term);
                
                // Check if any notes match
                const matchingNotes = notes.filter(note => 
                    note.title.toLowerCase().includes(term) || 
                    (note.type && note.type.toLowerCase().includes(term))
                );

                if (subjectMatch) {
                    // If subject matches, show all notes (or maybe just matching ones? 
                    // Standard behavior usually shows all if category matches, but let's be specific)
                    // Let's show all notes if subject matches, otherwise only matching notes.
                    filteredData[subject] = notes;
                } else if (matchingNotes.length > 0) {
                    filteredData[subject] = matchingNotes;
                }
            });

            renderNotes(filteredData, container);
        }, 100); // 100ms debounce
    });
}
