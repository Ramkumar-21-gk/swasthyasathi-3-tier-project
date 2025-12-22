// Website
// ===== Custom Scroll Highlight =====
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-link");

window.addEventListener("scroll", () => {
  let current = "";
  sections.forEach((section) => {
    const sectionTop = section.offsetTop - 100;
    const sectionHeight = section.clientHeight;
    if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
      current = section.getAttribute("id");
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("href").includes(current)) {
      link.classList.add("active");
    }
  });
});

// ===== Close mobile nav on click =====
document.querySelectorAll(".nav-link").forEach((link) =>
  link.addEventListener("click", () => {
    const navbarCollapse = document.querySelector(".navbar-collapse");
    if (navbarCollapse.classList.contains("show")) {
      new bootstrap.Collapse(navbarCollapse).toggle();
    }
  })
);

// About Image Section Start
// Automatic Image Slider
const images = [
  "../assets/images/service1.png",
  "../assets/images/service2.png",
  "../assets/images/service3.png",
];

let index = 0;
const aboutImage = document.getElementById("aboutImage");

setInterval(() => {
  index = (index + 1) % images.length;
  aboutImage.style.opacity = 0;
  setTimeout(() => {
    aboutImage.src = images[index];
    aboutImage.style.opacity = 1;
  }, 500);
}, 3000);
// About Image Section End
