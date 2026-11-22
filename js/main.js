'use strict';

const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#site-nav');
const mobileLayout = window.matchMedia('(max-width: 650px)');

function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
}

function updateMenuLayout() {
  closeMenu();
  menuToggle.hidden = !mobileLayout.matches;
}

header.classList.add('nav-enhanced');
updateMenuLayout();
mobileLayout.addEventListener('change', updateMenuLayout);
menuToggle.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!expanded));
  navigation.classList.toggle('is-open', !expanded);
});
navigation.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuToggle.focus();
  }
});
document.addEventListener('click', event => {
  if (!header.contains(event.target)) closeMenu();
});

const navigationLinks = Array.from(navigation.querySelectorAll('a'));
const navigationSections = navigationLinks.map(link => document.querySelector(link.hash));

function updateNavigation() {
  header.classList.toggle('is-scrolled', window.scrollY > 48);
  let currentIndex = 0;
  navigationSections.forEach((section, index) => {
    if (section.getBoundingClientRect().top <= window.innerHeight * 0.4) currentIndex = index;
  });
  navigationLinks.forEach((link, index) => {
    if (index === currentIndex) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

window.addEventListener('scroll', updateNavigation, { passive: true });
updateNavigation();

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('reveal-pending');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(element => {
    element.classList.add('reveal-pending');
    observer.observe(element);
  });
}
