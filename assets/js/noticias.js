(() => {
  'use strict';

  const SELECTORS = {
    search: '#np-news-search',
    filters: '.np-filter',
    featuredSlot: '#np-featured-slot',
    secondaryList: '#np-secondary-list',
    grid: '#np-news-grid',
    editorial: '#np-editorial',
    moreSection: '#np-more-news',
    emptyState: '#np-empty-state',
    resetFilters: '#np-reset-filters',
    resultsLabel: '#np-results-label',
    title: '#np-page-title',
    subtitle: '#np-page-subtitle',
    navLinks: '.np-nav__link[data-view]',
    pendingLinks: '[data-pending-link]',
    modal: '#np-preview-modal',
    modalImage: '#np-modal-image',
    modalCategory: '#np-modal-category',
    modalTitle: '#np-modal-title',
    modalAuthor: '#np-modal-author',
    modalPreview: '#np-modal-preview',
    modalRead: '#np-modal-read',
    modalClose: '[data-modal-close]',
    toast: '#np-toast',
    navToggle: '.np-nav-toggle',
    nav: '#np-main-nav'
  };

  const CONFIG = {
    dataUrl: '../assets/data/noticias.json',
    favoritesKey: 'newsPoliFavorites',
    detailBaseUrl: './detalle.html',
    toastDuration: 2600
  };

  const state = {
    news: [],
    category: 'Todas',
    query: '',
    view: window.location.hash === '#favoritos' ? 'favorites' : 'news',
    favorites: new Set(),
    lastModalTrigger: null
  };

  const elements = {};

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    cacheElements();
    state.favorites = readFavorites();
    bindEvents();
    syncViewFromHash();

    try {
      state.news = await loadNews();
      render();
    } catch (error) {
      console.error('[NEWS POLI] No fue posible cargar noticias:', error);
      showLoadError();
    }
  }

  function cacheElements() {
    elements.search = document.querySelector(SELECTORS.search);
    elements.filters = [...document.querySelectorAll(SELECTORS.filters)];
    elements.featuredSlot = document.querySelector(SELECTORS.featuredSlot);
    elements.secondaryList = document.querySelector(SELECTORS.secondaryList);
    elements.grid = document.querySelector(SELECTORS.grid);
    elements.editorial = document.querySelector(SELECTORS.editorial);
    elements.moreSection = document.querySelector(SELECTORS.moreSection);
    elements.emptyState = document.querySelector(SELECTORS.emptyState);
    elements.resetFilters = document.querySelector(SELECTORS.resetFilters);
    elements.resultsLabel = document.querySelector(SELECTORS.resultsLabel);
    elements.title = document.querySelector(SELECTORS.title);
    elements.subtitle = document.querySelector(SELECTORS.subtitle);
    elements.navLinks = [...document.querySelectorAll(SELECTORS.navLinks)];
    elements.pendingLinks = [...document.querySelectorAll(SELECTORS.pendingLinks)];
    elements.modal = document.querySelector(SELECTORS.modal);
    elements.modalImage = document.querySelector(SELECTORS.modalImage);
    elements.modalCategory = document.querySelector(SELECTORS.modalCategory);
    elements.modalTitle = document.querySelector(SELECTORS.modalTitle);
    elements.modalAuthor = document.querySelector(SELECTORS.modalAuthor);
    elements.modalPreview = document.querySelector(SELECTORS.modalPreview);
    elements.modalRead = document.querySelector(SELECTORS.modalRead);
    elements.modalClose = [...document.querySelectorAll(SELECTORS.modalClose)];
    elements.toast = document.querySelector(SELECTORS.toast);
    elements.navToggle = document.querySelector(SELECTORS.navToggle);
    elements.nav = document.querySelector(SELECTORS.nav);
  }

  // Capa de datos: el listado se alimenta exclusivamente desde el JSON local.
  async function loadNews() {
    const response = await fetch(CONFIG.dataUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new TypeError('El archivo de noticias debe contener un arreglo JSON.');
    }

    return data
      .filter(isValidNewsItem)
      .sort((a, b) => Number(a.orden ?? 0) - Number(b.orden ?? 0));
  }

  function isValidNewsItem(item) {
    return item && Number.isFinite(Number(item.id)) && item.titulo && item.categoria && item.imagen;
  }

  function bindEvents() {
    elements.search.addEventListener('input', event => {
      state.query = normalizeText(event.target.value.trim());
      render();
    });

    elements.filters.forEach(button => {
      button.addEventListener('click', () => {
        state.category = button.dataset.category || 'Todas';
        updateFilterButtons();
        render();
      });
    });

    elements.resetFilters.addEventListener('click', resetFilters);

    elements.navLinks.forEach(link => {
      link.addEventListener('click', event => {
        const requestedView = link.dataset.view;
        if (!requestedView) return;
        event.preventDefault();
        window.location.hash = requestedView === 'favorites' ? 'favoritos' : 'noticias';
      });
    });

    elements.pendingLinks.forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();
        showToast(`${link.textContent.trim()} quedará conectado cuando se integren las demás vistas.`);
      });
    });

    window.addEventListener('hashchange', () => {
      syncViewFromHash();
      render();
    });

    document.addEventListener('click', handleDelegatedClick);

    elements.modalClose.forEach(control => control.addEventListener('click', closeModal));
    document.addEventListener('keydown', handleKeydown);

    elements.navToggle.addEventListener('click', () => {
      const expanded = elements.navToggle.getAttribute('aria-expanded') === 'true';
      elements.navToggle.setAttribute('aria-expanded', String(!expanded));
      elements.nav.classList.toggle('is-open', !expanded);
    });

    elements.nav.addEventListener('click', event => {
      if (event.target.closest('a')) {
        elements.nav.classList.remove('is-open');
        elements.navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function handleDelegatedClick(event) {
    const favoriteButton = event.target.closest('[data-favorite-id]');
    if (favoriteButton) {
      const id = Number(favoriteButton.dataset.favoriteId);
      toggleFavorite(id);
      return;
    }

    const previewButton = event.target.closest('[data-preview-id]');
    if (previewButton) {
      const id = Number(previewButton.dataset.previewId);
      const newsItem = state.news.find(item => Number(item.id) === id);
      if (newsItem) openModal(newsItem, previewButton);
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' && elements.modal.getAttribute('aria-hidden') === 'false') {
      closeModal();
      return;
    }

    if (event.key === 'Tab' && elements.modal.getAttribute('aria-hidden') === 'false') {
      trapModalFocus(event);
    }
  }

  function syncViewFromHash() {
    state.view = window.location.hash === '#favoritos' ? 'favorites' : 'news';
    updateHeaderForView();
  }

  function updateHeaderForView() {
    const favoritesMode = state.view === 'favorites';
    elements.title.textContent = favoritesMode ? 'Tus favoritos' : 'Últimas noticias';
    elements.subtitle.textContent = favoritesMode
      ? 'Las noticias que guardaste, disponibles en este navegador.'
      : 'Información relevante, actual y cercana.';

    elements.navLinks.forEach(link => {
      const active = link.dataset.view === state.view;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function updateFilterButtons() {
    elements.filters.forEach(button => {
      const active = button.dataset.category === state.category;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function getVisibleNews() {
    const query = state.query;

    return state.news.filter(item => {
      const matchesView = state.view !== 'favorites' || state.favorites.has(Number(item.id));
      const matchesCategory = state.category === 'Todas' || item.categoria === state.category;
      const haystack = normalizeText(`${item.titulo} ${item.descripcion} ${item.categoria} ${item.autor}`);
      const matchesQuery = !query || haystack.includes(query);
      return matchesView && matchesCategory && matchesQuery;
    });
  }

  // Render principal: reorganiza los resultados en jerarquía editorial sin duplicar HTML.
  function render() {
    const visibleNews = getVisibleNews();
    updateHeaderForView();
    updateResultsLabel(visibleNews.length);

    if (!visibleNews.length) {
      elements.editorial.hidden = true;
      elements.moreSection.hidden = true;
      elements.emptyState.hidden = false;
      return;
    }

    elements.emptyState.hidden = true;
    elements.editorial.hidden = false;

    const [featured, ...remaining] = chooseEditorialOrder(visibleNews);
    const secondary = remaining.slice(0, 2);
    const more = remaining.slice(2);

    elements.featuredSlot.innerHTML = createFeaturedCard(featured);
    elements.secondaryList.innerHTML = secondary.map(createSecondaryCard).join('');

    elements.moreSection.hidden = more.length === 0;
    elements.grid.innerHTML = more.map(createGridCard).join('');
  }

  function chooseEditorialOrder(items) {
    if (state.category === 'Todas' && !state.query && state.view === 'news') {
      const preferred = items.find(item => item.destacada);
      if (preferred) {
        return [preferred, ...items.filter(item => item.id !== preferred.id)];
      }
    }
    return items;
  }

  function updateResultsLabel(count) {
    const filtersActive = state.category !== 'Todas' || Boolean(state.query) || state.view === 'favorites';
    if (!filtersActive) {
      elements.resultsLabel.textContent = '';
      return;
    }

    const suffix = count === 1 ? 'noticia' : 'noticias';
    elements.resultsLabel.textContent = `${count} ${suffix} ${state.view === 'favorites' ? 'en favoritos' : 'encontradas'}`;
  }

  function createFeaturedCard(item) {
    const favorite = state.favorites.has(Number(item.id));
    return `
      <article class="np-featured-card np-news-card" data-news-id="${item.id}">
        <div class="np-featured-card__media">
          <img src="${escapeAttribute(item.imagen)}" alt="${escapeAttribute(item.alt || '')}" loading="eager">
          ${createFavoriteButton(item, favorite, 'np-favorite--media')}
        </div>
        <div class="np-featured-card__content">
          <p class="np-news-meta">${escapeHtml(item.categoria)} <span aria-hidden="true">·</span> ${escapeHtml(item.fecha || '')}</p>
          <h2 class="np-featured-card__title">${escapeHtml(item.titulo)}</h2>
          <p class="np-featured-card__description">${escapeHtml(item.descripcion || '')}</p>
          <div class="np-card-actions">
            <button class="np-action np-action--preview" type="button" data-preview-id="${item.id}">Ver más <span aria-hidden="true">→</span></button>
            ${createDetailLink(item, 'Ver noticia')}
          </div>
        </div>
      </article>`;
  }

  function createSecondaryCard(item) {
    const favorite = state.favorites.has(Number(item.id));
    return `
      <article class="np-secondary-card np-news-card" data-news-id="${item.id}">
        <div class="np-secondary-card__media">
          <img src="${escapeAttribute(item.imagen)}" alt="${escapeAttribute(item.alt || '')}" loading="lazy">
        </div>
        <div class="np-secondary-card__content">
          <p class="np-news-meta">${escapeHtml(item.categoria)}</p>
          <h2 class="np-secondary-card__title">${escapeHtml(item.titulo)}</h2>
          <div class="np-card-actions np-card-actions--compact">
            <button class="np-action np-action--preview" type="button" data-preview-id="${item.id}">Ver más <span aria-hidden="true">→</span></button>
            ${createDetailLink(item, 'Ver noticia')}
          </div>
        </div>
        ${createFavoriteButton(item, favorite, 'np-favorite--corner')}
      </article>`;
  }

  function createGridCard(item) {
    const favorite = state.favorites.has(Number(item.id));
    return `
      <article class="np-grid-card np-news-card" data-news-id="${item.id}">
        <div class="np-grid-card__media">
          <img src="${escapeAttribute(item.imagen)}" alt="${escapeAttribute(item.alt || '')}" loading="lazy">
          ${createFavoriteButton(item, favorite, 'np-favorite--media')}
        </div>
        <div class="np-grid-card__content">
          <p class="np-news-meta">${escapeHtml(item.categoria)}</p>
          <h2 class="np-grid-card__title">${escapeHtml(item.titulo)}</h2>
          <p class="np-grid-card__description">${escapeHtml(item.descripcion || '')}</p>
          <div class="np-card-actions np-card-actions--grid">
            <button class="np-action np-action--preview" type="button" data-preview-id="${item.id}">Ver más <span aria-hidden="true">→</span></button>
            ${createDetailLink(item, 'Ver noticia')}
          </div>
        </div>
      </article>`;
  }

  function createFavoriteButton(item, isFavorite, extraClass = '') {
    const label = isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos';
    return `
      <button class="np-favorite ${extraClass} ${isFavorite ? 'is-favorite' : ''}" type="button"
        data-favorite-id="${item.id}" aria-pressed="${String(isFavorite)}" aria-label="${label}: ${escapeAttribute(item.titulo)}">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/>
        </svg>
      </button>`;
  }

  function createDetailLink(item, label) {
    const href = `${CONFIG.detailBaseUrl}?id=${encodeURIComponent(item.id)}&slug=${encodeURIComponent(item.slug || '')}`;
    return `<a class="np-action np-action--detail" href="${href}" title="Abrir detalle de ${escapeAttribute(item.titulo)}">${label} <span aria-hidden="true">→</span></a>`;
  }

  // Favoritos: persistencia mínima y desacoplada mediante localStorage.
  function toggleFavorite(id) {
    const item = state.news.find(newsItem => Number(newsItem.id) === id);
    if (!item) return;

    if (state.favorites.has(id)) {
      state.favorites.delete(id);
      showToast('Noticia retirada de favoritos.');
    } else {
      state.favorites.add(id);
      showToast('Noticia guardada en favoritos.');
    }

    persistFavorites();
    render();
  }

  function readFavorites() {
    try {
      const stored = JSON.parse(localStorage.getItem(CONFIG.favoritesKey) || '[]');
      return new Set(Array.isArray(stored) ? stored.map(Number).filter(Number.isFinite) : []);
    } catch (error) {
      console.warn('[NEWS POLI] No se pudieron leer favoritos:', error);
      return new Set();
    }
  }

  function persistFavorites() {
    try {
      localStorage.setItem(CONFIG.favoritesKey, JSON.stringify([...state.favorites]));
    } catch (error) {
      console.warn('[NEWS POLI] No se pudieron guardar favoritos:', error);
      showToast('Tu navegador no permitió guardar favoritos.');
    }
  }

  // Vista previa: modal parcial; el detalle completo queda como punto de integración.
  function openModal(item, trigger) {
    state.lastModalTrigger = trigger || null;
    elements.modalImage.src = item.imagen;
    elements.modalImage.alt = item.alt || '';
    elements.modalCategory.textContent = `${item.categoria}${item.fecha ? ` · ${item.fecha}` : ''}`;
    elements.modalTitle.textContent = item.titulo;
    elements.modalAuthor.textContent = `Por ${item.autor || 'Equipo NEWS POLI'}`;
    elements.modalPreview.textContent = item.vistaPrevia || item.descripcion || '';
    elements.modalRead.href = `${CONFIG.detailBaseUrl}?id=${encodeURIComponent(item.id)}&slug=${encodeURIComponent(item.slug || '')}`;
    elements.modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('np-modal-open');

    const closeButton = elements.modal.querySelector('.np-modal__close');
    window.setTimeout(() => closeButton?.focus(), 0);
  }

  function closeModal() {
    if (elements.modal.getAttribute('aria-hidden') === 'true') return;
    elements.modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('np-modal-open');
    elements.modalImage.src = '';
    state.lastModalTrigger?.focus();
    state.lastModalTrigger = null;
  }

  function trapModalFocus(event) {
    const focusable = [...elements.modal.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter(element => !element.hasAttribute('hidden'));
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function resetFilters() {
    state.category = 'Todas';
    state.query = '';
    elements.search.value = '';
    updateFilterButtons();
    if (state.view === 'favorites' && state.favorites.size === 0) {
      window.location.hash = 'noticias';
      return;
    }
    render();
  }

  function showLoadError() {
    elements.editorial.hidden = true;
    elements.moreSection.hidden = true;
    elements.emptyState.hidden = false;
    elements.emptyState.querySelector('.np-empty__title').textContent = 'No pudimos cargar las noticias';
    elements.emptyState.querySelector('.np-empty__text').textContent = 'Ejecuta el proyecto con Live Server o con un servidor local para que el navegador pueda leer el archivo JSON.';
    elements.resetFilters.hidden = true;
  }

  let toastTimer = null;
  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => elements.toast.classList.remove('is-visible'), CONFIG.toastDuration);
  }

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('es');
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[char]));
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }
})();
