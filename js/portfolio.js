'use strict';

// Enhance existing image links. Without dialog support they open the original.
const gallery = document.querySelector('#project-gallery');
const galleryImage = document.querySelector('#gallery-image');
const galleryTitle = document.querySelector('#gallery-title');
const galleryCaption = document.querySelector('#gallery-caption');
const originalLink = document.querySelector('#gallery-original');
const previousButton = document.querySelector('.gallery-prev');
const nextButton = document.querySelector('.gallery-next');
let galleryLinks = [];
let galleryIndex = 0;
let galleryTrigger;

function showGalleryImage(index) {
  galleryIndex = (index + galleryLinks.length) % galleryLinks.length;
  const link = galleryLinks[galleryIndex];
  galleryImage.src = link.href;
  galleryImage.alt = link.dataset.caption;
  originalLink.href = link.href;
  galleryCaption.textContent = `${link.dataset.caption} · ${galleryIndex + 1} / ${galleryLinks.length}`;
  previousButton.hidden = galleryLinks.length < 2;
  nextButton.hidden = galleryLinks.length < 2;
}

document.querySelector('#portfolio-container').addEventListener('click', event => {
  const link = event.target.closest('[data-gallery]');
  if (!link) return;
  if (typeof gallery.showModal !== 'function' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  const project = link.closest('.project');
  galleryLinks = Array.from(project.querySelectorAll('.project-views a'));
  galleryTrigger = link;
  galleryTitle.textContent = project.querySelector('h3').textContent;
  const imageIndex = galleryLinks.findIndex(imageLink => imageLink.href === link.href);
  showGalleryImage(Math.max(0, imageIndex));
  gallery.showModal();
  document.body.classList.add('gallery-open');
});

document.querySelector('.gallery-close').addEventListener('click', () => gallery.close());
previousButton.addEventListener('click', () => showGalleryImage(galleryIndex - 1));
nextButton.addEventListener('click', () => showGalleryImage(galleryIndex + 1));
gallery.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); showGalleryImage(galleryIndex - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); showGalleryImage(galleryIndex + 1); }
});
gallery.addEventListener('click', event => {
  if (event.target === gallery) {
    const bounds = gallery.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) gallery.close();
  }
});
gallery.addEventListener('close', () => {
  document.body.classList.remove('gallery-open');
  galleryTrigger?.focus();
});

// Keep the existing JSON editing workflow, with the published HTML as a fallback.
async function refreshPortfolio() {
  try {
    const response = await fetch('config/portfolio-config.json');
    if (!response.ok) return;
    const data = await response.json();
    if (!Array.isArray(data.pictures)) return;
    const groups = new Map();
    for (const picture of data.pictures) {
      if (!picture || typeof picture.img !== 'string' || typeof picture.title !== 'string') return;
      if (!groups.has(picture.title)) groups.set(picture.title, []);
      groups.get(picture.title).push(picture);
    }

    const container = document.querySelector('#portfolio-container');
    const existingProjects = Array.from(container.querySelectorAll('.project'));
    const existingByTitle = new Map(existingProjects.map(project => [project.querySelector('h3').textContent, project]));
    for (const [title, pictures] of groups) {
      const existing = existingByTitle.get(title);
      const category = pictures[0].category || '';
      if (existing && existing.dataset.sourceCategory !== category) {
        existing.querySelector('.project-info p').textContent = category === 'proyectos' ? 'Modelado 3D' : category || 'Modelado 3D';
        existing.dataset.sourceCategory = category;
      }
    }
    const sameSelection = groups.size === existingByTitle.size && [...groups].every(([title, pictures]) => {
      const project = existingByTitle.get(title);
      if (!project) return false;
      const links = Array.from(project.querySelectorAll('.project-views a'));
      return links.length === pictures.length && pictures.every((picture, index) =>
        links[index].getAttribute('href') === `img/portfolio/${encodeURIComponent(picture.img)}`
      );
    });
    if (sameSelection) return;
    // Retain the editorial order for known projects, then append new entries.
    const titles = [...existingByTitle.keys()].filter(title => groups.has(title));
    titles.push(...[...groups.keys()].filter(title => !existingByTitle.has(title)));
    const fragment = document.createDocumentFragment();

    for (const title of titles) {
      const pictures = groups.get(title);
      const existing = existingByTitle.get(title);
      const project = (existing || existingProjects[0]).cloneNode(true);
      project.id = existing?.id || `project-custom-${encodeURIComponent(title)}`;
      project.classList.remove('reveal-pending');
      project.querySelector('h3').textContent = title;
      const cover = project.querySelector('.project-cover');
      const imagePath = `img/portfolio/${encodeURIComponent(pictures[0].img)}`;
      const unchangedCover = existing && cover.getAttribute('href') === imagePath;
      cover.href = imagePath;
      cover.dataset.caption = `${title} · Vista 1`;
      cover.setAttribute('aria-label', `Ver galería de ${title}`);
      cover.querySelector('span').textContent = `Ver galería · ${pictures.length} ${pictures.length === 1 ? 'imagen' : 'imágenes'}`;
      const image = cover.querySelector('img');
      image.alt = `${title}, vista arquitectónica`;
      if (!unchangedCover) {
        project.classList.remove('project--compact', 'project--sheet');
        image.src = imagePath;
        image.style.removeProperty('--image-ratio');
        image.removeAttribute('width');
        image.removeAttribute('height');
      }
      if (!existing) {
        project.classList.remove('project--compact', 'project--sheet');
        const category = pictures[0].category || '';
        project.dataset.sourceCategory = category;
        project.querySelector('.project-info p').textContent = category === 'proyectos' ? 'Modelado 3D' : category || 'Modelado 3D';
        project.querySelector('.project-info > span').textContent = 'Modelado / Visualización';
        project.querySelector('.project-description').remove();
      }
      const views = project.querySelector('.project-views');
      views.replaceChildren();
      views.setAttribute('aria-label', `Vistas de ${title}`);
      pictures.forEach((picture, index) => {
        const link = document.createElement('a');
        link.href = `img/portfolio/${encodeURIComponent(picture.img)}`;
        link.dataset.gallery = '';
        link.dataset.caption = `${title} · Vista ${index + 1}`;
        link.textContent = `Vista ${index + 1}`;
        views.append(link);
      });
      fragment.append(project);
    }
    container.replaceChildren(fragment);
  } catch {
    // The static selection and its galleries remain available if the JSON fails.
  }
}

refreshPortfolio();
