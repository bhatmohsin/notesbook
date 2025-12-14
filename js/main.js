/*===== Smart Navbar & Menu =====*/
const navbar = document.querySelector(".navbar");
const navMenu = document.querySelector(".menu");
const navToggle = document.querySelector(".menu-btn");
const navLinks = document.querySelectorAll(".nav-link");

let lastScrollY = window.scrollY;

window.addEventListener("scroll", () => {
    // Sticky class for background style
    if (window.scrollY > 20) {
        navbar.classList.add("sticky");
    } else {
        navbar.classList.remove("sticky");
    }

    // Hide/Show on scroll
    if (window.scrollY > lastScrollY && window.scrollY > 100) {
        // Scrolling down & past header
        navbar.classList.add("hide");
    } else {
        // Scrolling up
        navbar.classList.remove("hide");
    }
    lastScrollY = window.scrollY;
});

/*===== Nav Toggler =====*/
if (navToggle) {
    navToggle.addEventListener("click", () => {
        navMenu.classList.toggle("active");
        // Ensure navbar is visible when menu is open
        navbar.classList.remove("hide");
    });
}

/*===== Close Menu on Link Click =====*/
function linkAction() {
    navMenu.classList.remove("active");
}
navLinks.forEach(n => n.addEventListener("click", linkAction));

/*===== Search Functionality =====*/
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const subjects = document.querySelectorAll('.pricing-item');
            
            subjects.forEach(item => {
                const text = item.textContent.toLowerCase();
                if(text.includes(searchTerm)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
});
