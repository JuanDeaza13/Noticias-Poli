// NEWS POLI - Página de Contacto: menú móvil, validación del formulario y confirmación de envío.
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    bindNavToggle();
    bindContactForm();
  }

  function bindNavToggle() {
    const toggle = document.querySelector('.np-nav-toggle');
    const nav = document.getElementById('np-main-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    nav.addEventListener('click', event => {
      if (event.target.closest('.np-nav__link, .np-nav__cta')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function bindContactForm() {
    const form = document.getElementById('np-contact-form');
    if (!form) return;

    const successBanner = document.getElementById('np-form-success');
    const fields = {
      nombre: {
        input: document.getElementById('np-nombre'),
        group: document.getElementById('np-group-nombre'),
        error: document.getElementById('np-error-nombre'),
        validate: value => (value.trim().length === 0 ? 'Este campo es obligatorio.' : '')
      },
      correo: {
        input: document.getElementById('np-correo'),
        group: document.getElementById('np-group-correo'),
        error: document.getElementById('np-error-correo'),
        validate: value => {
          if (value.trim().length === 0) return 'Este campo es obligatorio.';
          const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
          return isValidEmail ? '' : 'Ingresa un correo electrónico válido.';
        }
      },
      mensaje: {
        input: document.getElementById('np-mensaje'),
        group: document.getElementById('np-group-mensaje'),
        error: document.getElementById('np-error-mensaje'),
        validate: value => (value.trim().length === 0 ? 'Este campo es obligatorio.' : '')
      }
    };

    Object.values(fields).forEach(field => {
      field.input.addEventListener('blur', () => validateField(field));
      field.input.addEventListener('input', () => {
        if (field.group.classList.contains('is-invalid')) {
          validateField(field);
        }
      });
    });

    form.addEventListener('submit', event => {
      event.preventDefault();
      successBanner.classList.remove('is-visible');

      const isValid = Object.values(fields)
        .map(field => validateField(field))
        .every(Boolean);

      if (!isValid) {
        const firstInvalid = form.querySelector('.is-invalid .np-form-input, .is-invalid .np-form-textarea');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      successBanner.classList.add('is-visible');
      showToast('Tu mensaje fue enviado con éxito.');
      form.reset();
      Object.values(fields).forEach(field => {
        field.group.classList.remove('is-invalid');
        field.error.textContent = '';
      });
    });
  }

  function validateField(field) {
    const message = field.validate(field.input.value);
    field.error.textContent = message;
    field.group.classList.toggle('is-invalid', Boolean(message));
    return !message;
  }

  function showToast(message) {
    const toast = document.getElementById('np-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => toast.classList.remove('is-visible'), 3200);
  }
})();
