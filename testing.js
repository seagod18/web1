// Theme toggle functionality
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// Check for saved theme preference
if (localStorage.getItem('theme') === 'light') {
  body.classList.add('light-mode');
}

themeToggle.addEventListener('click', () => {
  body.classList.toggle('light-mode');
  
  // Save theme preference
  if (body.classList.contains('light-mode')) {
    localStorage.setItem('theme', 'light');
  } else {
    localStorage.setItem('theme', 'dark');
  }
});

// Scroll animations
const sections = document.querySelectorAll('section');
const timelineItems = document.querySelectorAll('.timeline-item');
const backToTop = document.getElementById('back-to-top');

function checkScroll() {
  // Add visible class to sections when they enter viewport
  sections.forEach(section => {
    const sectionTop = section.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;
    
    if (sectionTop < windowHeight * 0.75) {
      section.classList.add('visible');
    }
  });
  
  // Add visible class to timeline items when they enter viewport
  timelineItems.forEach(item => {
    const itemTop = item.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;
    
    if (itemTop < windowHeight * 0.75) {
      item.classList.add('visible');
    }
  });
  
  // Show back-to-top button when scrolled down
  if (window.scrollY > 500) {
    backToTop.classList.add('visible');
  } else {
    backToTop.classList.remove('visible');
  }
}

// Animate skill bars when in viewport
function animateSkillBars() {
  const skillBars = document.querySelectorAll('.skill-progress');
  skillBars.forEach(bar => {
    const barTop = bar.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;
    
    if (barTop < windowHeight * 0.75) {
      const progress = bar.getAttribute('data-progress');
      bar.style.width = `${progress}%`;
    }
  });
}

// Scroll to section when clicking on navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    const targetSection = document.querySelector(targetId);
    
    window.scrollTo({
      top: targetSection.offsetTop - 80,
      behavior: 'smooth'
    });
  });
});

// Back to top functionality
backToTop.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

// Initialize animations on load and scroll
window.addEventListener('load', () => {
  checkScroll();
  animateSkillBars();
});

window.addEventListener('scroll', () => {
  checkScroll();
  animateSkillBars();
});

// Form submission (demo)
const contactForm = document.querySelector('.contact-form');
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  alert('Thank you for your message! This is just a demo - no messages are actually sent.');
  contactForm.reset();
});
