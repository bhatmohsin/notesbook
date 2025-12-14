document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('subject-container');
    const searchInput = document.getElementById('myInput');

    if (!container) return;

    // Show loading state
    container.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-light);">Loading previous year papers...</p>';

    try {
        const response = await fetch('/old-papers.json');
        if (!response.ok) {
            // If json not found (e.g. before first build), clear loading message
            container.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-light);">No papers available at the moment.</p>';
            return;
        }
        
        const data = await response.json();
        renderPapers(data, container);
        
        // Setup search
        if (searchInput) {
            // Remove inline onkeyup if it exists or just add listener
            searchInput.removeAttribute('onkeyup'); 
            searchInput.addEventListener('keyup', (e) => filterSubjects(e.target.value));
        }

    } catch (error) {
        console.error('Error loading papers:', error);
        container.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-light);">Unable to load papers. Please try again later.</p>';
    }
});

function renderPapers(data, container) {
    container.innerHTML = ''; // Clear existing content

    // Sort subjects alphabetically
    const sortedSubjects = Object.keys(data).sort();

    if (sortedSubjects.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 20px;">No papers found.</p>';
        return;
    }

    sortedSubjects.forEach(subject => {
        const semesterData = data[subject];
        const subjectBlock = document.createElement('div');
        subjectBlock.className = 'subject-block';
        subjectBlock.style.display = 'block'; // Show by default

        let tableRows = '';
        
        // Sort semesters (Sem-1, Sem-2, ...)
        const sortedSemesters = Object.keys(semesterData).sort((a, b) => {
            const numA = parseInt(a.replace('Sem-', ''));
            const numB = parseInt(b.replace('Sem-', ''));
            return numA - numB;
        });

        sortedSemesters.forEach(sem => {
            const papers = semesterData[sem];
            
            let downloadButtons = papers.map(paper => 
                `<a href="${paper.link}" target="_blank" class="btn-1" style="margin-right: 5px; margin-bottom: 5px; display: inline-block;">${paper.year}</a>`
            ).join('');

            // Format semester name (e.g., "Sem-1" -> "1st Semester")
            const semNum = sem.replace('Sem-', '');
            let semName = `${semNum}th Semester`;
            if (semNum === '1') semName = '1st Semester';
            else if (semNum === '2') semName = '2nd Semester';
            else if (semNum === '3') semName = '3rd Semester';

            tableRows += `
                <tr>
                    <td>${semName}</td>
                    <td>${downloadButtons}</td>
                </tr>
            `;
        });

        subjectBlock.innerHTML = `
            <h4 class="subject-title">${subject}</h4>
            <table>
                <thead>
                    <tr>
                        <th>Semester</th>
                        <th>Download</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        `;

        container.appendChild(subjectBlock);
    });
}

function filterSubjects(query) {
    const input = query.toLowerCase();
    const subjectBlocks = document.querySelectorAll(".subject-block");

    subjectBlocks.forEach(block => {
        const title = block.querySelector(".subject-title").textContent.toLowerCase();
        if (title.includes(input)) {
            block.style.display = "block";
        } else {
            block.style.display = "none";
        }
    });
}
