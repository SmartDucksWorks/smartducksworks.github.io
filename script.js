// Handle the order button alert
document.querySelectorAll('.order-button').forEach(button => {
  button.addEventListener('click', function() {
    alert('Thank you for your interest! Our order system is coming soon.');
  });
});

// Handle hamburger menu toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('active');
  hamburger.classList.toggle('active');
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('header')) {
    navLinks.classList.remove('active');
    hamburger.classList.remove('active');
  }
});

// Select all testimonial elements within the testimonials-container
const testimonials = document.querySelectorAll('.testimonials-container .testimonial');
let currentIndex = 0;

// Function to update which testimonials are visible
function updateTestimonials() {
  // First hide all testimonials (by removing 'visible' class)
  testimonials.forEach((testimonial) => {
    testimonial.classList.remove('visible');
  });

  // If on mobile, show only one testimonial
  if (window.innerWidth <= 768) {
    testimonials[currentIndex].classList.add('visible');
  } else {
    // Show current and next testimonial (by adding 'visible' class) for larger screens
    testimonials[currentIndex].classList.add('visible');
    testimonials[(currentIndex + 1) % testimonials.length].classList.add('visible');
  }

  // Move to the next testimonial
  currentIndex = (currentIndex + 1) % testimonials.length;
}

// Show the first two testimonials on load for desktop, and one for mobile
document.addEventListener('DOMContentLoaded', () => {
  if (window.innerWidth <= 768) {
    testimonials[0].classList.add('visible');
  } else {
    testimonials[0].classList.add('visible');
    testimonials[1].classList.add('visible');
  }
});

// Cycle testimonials every 2 seconds
setInterval(updateTestimonials, 2000);


// Initialize Formspree button (this requires Formspree script to be loaded first)
/* window.formbutton = window.formbutton || function() {
  (formbutton.q = formbutton.q || []).push(arguments);
};
formbutton("create", {
  action: "https://formspree.io/f/mdovkpvo",
  title: "SmartDucks" +
         "<i style='font-size: 50px;" +
                   "position: absolute;" +
                   "z-index: -1;" +
                   "right: 0;'>&#x1F31F;</i>",
  description: "Interested in multi-site purchase?",
  theme: "classic",
  styles: {
      color: "#233d4d",
      button: {
          backgroundColor: "#fab125",
          fill: "#fcf5e7",
      },
      shim: {
          backgroundColor: "rgba(0,0,0,0)"
      },
      title: {
          fontFamily: "Helvetica",
          fontSize: "2.8em",
          backgroundColor: "#233d4d",
          textShadow: "3px 3px 0 #000000," +
                      "-1px -1px 0 #000000," +
                      "1px -1px 0 #000000," +
                      "-1px 1px 0 #000000," +
                      "1px 1px 0 #000000"
      },
      modal: {
          background: "#fab125",
      },
      description: {
          backgroundColor: "#fcf5e7"
      },
      input: {
          backgroundColor: "#fcf5e7",
          boxShadow: "0px 0px 3px rgba(0,0,0,0.1)",
          border: "1px solid rgba(0,0,0,0.1)"
      },
      submitLabel: {
          marginTop: "18px"
      },
      closeButton: {
          display: "none"
      }
  },
  initiallyVisible: ""
});*/
