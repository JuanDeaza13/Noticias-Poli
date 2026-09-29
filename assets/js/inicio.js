/* NEWS POLI - Inicio (jQuery)
 * Lee assets/data/noticias.json y pinta: noticia destacada, 2 secundarias
 * y 3 en "Más noticias". Comparte con el Listado la clave de favoritos. */
$(function () {
  'use strict';

  var DATA_URL = '../assets/data/noticias.json';
  var FAV_KEY = 'newsPoliFavorites';   // misma clave que noticias.js
  var DETALLE = './detalle.html';
  var toastTimer;

  /* ---------- Utilidades ---------- */
  function esc(t) { return $('<div>').text(t == null ? '' : t).html(); }

  function leerFavoritos() {
    try {
      var a = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
      return Array.isArray(a) ? a.map(Number) : [];
    } catch (e) { return []; }
  }
  function guardarFavoritos(a) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(a)); }
    catch (e) { toast('Tu navegador no permitió guardar favoritos.'); }
  }
  function toast(msg) {
    var $t = $('#ni-toast').text(msg).addClass('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $t.removeClass('is-visible'); }, 2400);
  }

  function urlDetalle(n) {
    return DETALLE + '?id=' + encodeURIComponent(n.id) + '&slug=' + encodeURIComponent(n.slug || '');
  }

  /* ---------- Plantillas ---------- */
  function btnFav(n, extra) {
    var on = leerFavoritos().indexOf(Number(n.id)) > -1;
    return '<button class="np-favorite ' + extra + (on ? ' is-favorite' : '') + '" type="button" data-id="' + n.id +
      '" aria-pressed="' + on + '" aria-label="' + (on ? 'Quitar de favoritos' : 'Agregar a favoritos') + ': ' + esc(n.titulo) + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg></button>';
  }
  function img(n) { return '<img src="' + esc(n.imagen) + '" alt="' + esc(n.alt || n.titulo) + '" loading="lazy">'; }
  function enlace(n, txt) { return '<a class="np-action np-action--detail" href="' + urlDetalle(n) + '">' + txt + ' <span aria-hidden="true">→</span></a>'; }

  function destacada(n) {
    return '<article class="np-news-card np-featured-card">' +
      '<div class="np-featured-card__media">' + img(n) + '</div>' +
      '<div class="np-featured-card__content">' +
      '<p class="np-news-meta">' + esc(n.categoria) + ' · ' + esc(n.fecha) + '</p>' +
      '<h2 class="np-featured-card__title">' + esc(n.titulo) + '</h2>' +
      '<p class="np-featured-card__description">' + esc(n.descripcion) + '</p>' +
      '<div class="np-card-actions">' + enlace(n, 'Leer noticia') + btnFav(n, '') + '</div></div></article>';
  }
  function secundaria(n) {
    return '<article class="np-news-card np-secondary-card">' +
      '<div class="np-secondary-card__media">' + img(n) + '</div>' +
      '<div class="np-secondary-card__content"><p class="np-news-meta">' + esc(n.categoria) + '</p>' +
      '<h3 class="np-secondary-card__title">' + esc(n.titulo) + '</h3>' +
      '<div class="np-card-actions np-card-actions--compact">' + enlace(n, 'Ver más') + '</div></div>' +
      btnFav(n, 'np-favorite--corner') + '</article>';
  }
  function tarjeta(n) {
    return '<article class="np-news-card np-grid-card">' +
      '<div class="np-grid-card__media">' + img(n) + btnFav(n, 'np-favorite--media') + '</div>' +
      '<div class="np-grid-card__content"><p class="np-news-meta">' + esc(n.categoria) + '</p>' +
      '<h3 class="np-grid-card__title">' + esc(n.titulo) + '</h3>' +
      '<div class="np-card-actions np-card-actions--grid">' + enlace(n, 'Ver noticia') + '</div></div></article>';
  }

  /* ---------- Carga de noticias ---------- */
  $('#ni-featured').html('<p class="ni-loading">Cargando noticias…</p>');

  $.getJSON(DATA_URL).done(function (lista) {
    lista.sort(function (a, b) { return (a.orden || 0) - (b.orden || 0); });
    var principal = lista.filter(function (n) { return n.destacada; })[0] || lista[0];
    var resto = lista.filter(function (n) { return n !== principal; });

    $('#ni-featured').hide().html(destacada(principal)).fadeIn(400);
    $('#ni-secondary').hide().html(resto.slice(0, 2).map(secundaria).join('')).fadeIn(500);
    $('#ni-grid').hide().html(resto.slice(2, 5).map(tarjeta).join('')).fadeIn(600);
  }).fail(function () {
    $('#ni-featured').html('<p class="ni-loading">No se pudieron cargar las noticias. Abre el sitio con un servidor (Live Server o GitHub Pages).</p>');
  });

  /* ---------- Favoritos (delegación de eventos con on()) ---------- */
  $(document).on('click', '.np-favorite', function () {
    var id = Number($(this).data('id'));
    var fav = leerFavoritos();
    var pos = fav.indexOf(id);
    if (pos > -1) { fav.splice(pos, 1); toast('Noticia retirada de favoritos.'); }
    else { fav.push(id); toast('Noticia guardada en favoritos.'); }
    guardarFavoritos(fav);
    $('.np-favorite[data-id="' + id + '"]')
      .toggleClass('is-favorite', pos === -1)
      .attr('aria-pressed', pos === -1);
  });

  /* ---------- Menú móvil ---------- */
  $('.np-nav-toggle').on('click', function () {
    var abierto = $(this).attr('aria-expanded') === 'true';
    $(this).attr('aria-expanded', !abierto);
    $('#np-main-nav').toggleClass('is-open', !abierto);
  });

  /* ---------- Suscripción: validación y mensaje ---------- */
  $('#ni-form').on('submit', function (e) {
    e.preventDefault();
    var correo = $.trim($('#ni-mail').val());
    var valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
    $('#ni-msg')
      .toggleClass('is-error', !valido)
      .text(valido ? '¡Gracias por suscribirte! Revisa tu correo.' : 'Escribe un correo válido, por ejemplo nombre@dominio.com.')
      .hide().slideDown(200);
    if (valido) { this.reset(); }
  });
});
