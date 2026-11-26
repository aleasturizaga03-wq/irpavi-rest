/* ==========================================================
   Chicharronería Irpavi · Lógica principal
   - Celular: pantallas con barra inferior (una pantalla a la vez)
   - Escritorio: página completa con navegación superior
   - Carta: Región → Categoría → Plato → Receta
   Todo el texto dinámico se inserta con textContent (sin innerHTML) => protección XSS.
   ========================================================== */
(() => {
  'use strict';

  /* ---------- Textos de la interfaz ---------- */
  const T = {
    es: {
      skip: 'Saltar al contenido',
      nav_home: 'Inicio', nav_about: 'Nosotros', nav_menu: 'Carta',
      nav_gallery: 'Galería', nav_reviews: 'Opiniones', nav_contact: 'Contacto',
      nav_orders: 'Pedidos',
      hero_title: 'Chicharronería Irpavi',
      hero_sub: 'Todo el sabor de Bolivia en cada plato',
      hero_cta: 'Ver carta', hero_cta2: 'Reservar',
      reserve_wa: 'Reservas por WhatsApp',
      about_title: 'Nosotros',
      about_text: 'Cocinamos platos tradicionales de La Paz, los Valles y el Oriente con recetas heredadas y mucho cariño.',
      a2_q: 'Horarios', a2_a: 'Sábado y domingo, 12:30 a 17:00',
      a3_q: '¿Hacen pedidos para llevar?', a3_a: 'Sí. Escríbenos por WhatsApp o llámanos.',
      menu_title: 'Carta', menu_sub: 'Sabores de nuestra Bolivia',
      gallery_title: 'Galería',
      reviews_title: 'Opiniones', reviews_sub: 'Lo que dicen nuestros clientes',
      contact_title: 'Contacto', contact_sub: 'Reserva o haz tu pedido',
      label_name: 'Nombre', label_email: 'Correo', label_phone: 'Teléfono (opcional)', label_msg: 'Mensaje',
      send: 'Enviar',
      info_address: 'Dirección', info_hours: 'Horario', info_phone: 'Teléfono',
      address: 'Irpavi, La Paz, Bolivia (calle 10)',
      a2_a_short: 'Sábado y domingo, 12:30 a 17:00',
      footer_tag: 'Hecho con cariño desde La Paz',
      err_name: 'Ingresa al menos 3 letras.',
      err_email: 'Ingresa un correo válido.',
      err_phone: 'Ingresa 7 u 8 dígitos.',
      err_msg: 'El mensaje debe tener al menos 10 caracteres.',
      sent: '¡Gracias! Recibimos tu mensaje.',
      theme_label: 'Cambiar tema', lang_label: 'Cambiar idioma',
      music_on: 'Reproducir música', music_off: 'Pausar música',
      music_unavailable: 'Música no disponible',
      prev: 'Anterior', next: 'Siguiente',
      pause: 'Pausar carrusel', play: 'Reproducir carrusel',
      close: 'Cerrar', soon: 'Foto próximamente',
      loading_err: 'No pudimos cargar la carta. Intenta de nuevo.',
      review_author: 'Cliente'
    },
    en: {
      skip: 'Skip to content',
      nav_home: 'Home', nav_about: 'About', nav_menu: 'Menu',
      nav_gallery: 'Gallery', nav_reviews: 'Reviews', nav_contact: 'Contact',
      nav_orders: 'Orders',
      hero_title: 'Chicharronería Irpavi',
      hero_sub: 'All the flavor of Bolivia in every dish',
      hero_cta: 'View menu', hero_cta2: 'Book',
      reserve_wa: 'Book on WhatsApp',
      about_title: 'About us',
      about_text: 'We cook traditional dishes from La Paz, the valleys and the lowlands, with inherited recipes and lots of love.',
      a2_q: 'Opening hours', a2_a: 'Saturday and Sunday, 12:30 pm to 5:00 pm',
      a3_q: 'Do you offer takeaway?', a3_a: 'Yes. Message us on WhatsApp or give us a call.',
      menu_title: 'Menu', menu_sub: 'Flavors of our Bolivia',
      gallery_title: 'Gallery',
      reviews_title: 'Reviews', reviews_sub: 'What our guests say',
      contact_title: 'Contact', contact_sub: 'Book a table or order',
      label_name: 'Name', label_email: 'Email', label_phone: 'Phone (optional)', label_msg: 'Message',
      send: 'Send',
      info_address: 'Address', info_hours: 'Hours', info_phone: 'Phone',
      address: 'Irpavi, La Paz, Bolivia (add full address)',
      a2_a_short: 'Saturday and Sunday, 12:30 pm to 5:00 pm',
      footer_tag: 'Made with love in La Paz',
      err_name: 'Please enter at least 3 letters.',
      err_email: 'Please enter a valid email.',
      err_phone: 'Please enter 7 or 8 digits.',
      err_msg: 'The message must be at least 10 characters.',
      sent: 'Thank you! We received your message.',
      theme_label: 'Toggle theme', lang_label: 'Change language',
      music_on: 'Play music', music_off: 'Pause music',
      music_unavailable: 'Music unavailable',
      prev: 'Previous', next: 'Next',
      pause: 'Pause carousel', play: 'Play carousel',
      close: 'Close', soon: 'Photo coming soon',
      loading_err: 'We could not load the menu. Please try again.',
      review_author: 'Guest'
    }
  };

  /* ---------- Textos de la carta ---------- */
  const CARTA_L = {
    es: { back: 'Volver', ingredients: 'Ingredientes', prep: 'Preparación' },
    en: { back: 'Back', ingredients: 'Ingredients', prep: 'Preparation' }
  };

  /* ---------- Estado ---------- */
  const SCREENS = ['inicio', 'carta', 'pedidos', 'galeria', 'opiniones', 'contacto'];
  const mobileQuery = window.matchMedia('(max-width: 767.98px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let lang = localStorage.getItem('lang') || 'es';
  let theme = localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  let data = null;
  let activeScreen = 'inicio';
  let slideIndex = 0;
  let slideCount = 0;
  let slideTimer = null;
  let carouselPaused = reduceMotion;
  let musicUnavailable = false;

  // Posición dentro de la carta: índices de región, categoría y plato
  let carta = { region: null, category: null, dish: null, filter: 'all' };

  /* ---------- Utilidades ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const t = (key) => (T[lang] && T[lang][key]) || T.es[key] || key;
  const pick = (obj) => obj[lang] || obj.es;
  const isMobile = () => mobileQuery.matches;
  const cartaL = (key) => (CARTA_L[lang] || CARTA_L.es)[key];

  /** Crea un ícono SVG a partir del sprite definido en index.html */
  function icon(id) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'ic');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(ns, 'use');
    use.setAttribute('href', '#' + id);
    svg.append(use);
    return svg;
  }

  /** Crea un elemento con clase y texto opcionales */
  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /* ---------- Acceso inicial (modo demostración) ----------
     No es autenticación real: los roles se conectarán a Supabase posteriormente. */
  function bindWelcome() {
    const dialog = $('#welcome');
    const note = $('.welcome-note', dialog);
    const enter = (role) => {
      sessionStorage.setItem('irpavi_demo_role', role);
      dialog.close();
      if (role === 'cliente') $('#account-btn').setAttribute('aria-label', 'Cliente: acceso de demostración');
    };
    $('#welcome-customer').addEventListener('click', () => enter('cliente'));
    $('#welcome-guest').addEventListener('click', () => enter('invitado'));
    $('#welcome-admin').addEventListener('click', () => {
      note.textContent = 'El acceso administrador todavía no está conectado. No ingreses contraseñas reales; esta versión es una demostración visual.';
    });
    $('#account-btn').addEventListener('click', () => {
      note.textContent = 'Selecciona el tipo de acceso. Las cuentas reales estarán disponibles al conectar la base de datos.';
      if (!dialog.open) dialog.showModal();
    });
    if (!dialog.open) dialog.showModal();
  }

  /* ---------- Tema ---------- */
  function applyTheme(next) {
    theme = next;
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    $('#theme-toggle').setAttribute('aria-pressed', String(next === 'dark'));
  }

  /* ---------- Idioma ---------- */
  function applyLang(next) {
    lang = next;
    localStorage.setItem('lang', next);
    document.documentElement.lang = next;

    $$('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
    $$('[data-i18n-label]').forEach((node) => { node.setAttribute('aria-label', t(node.dataset.i18nLabel)); });
    $('#lang-toggle').textContent = next === 'es' ? 'EN' : 'ES';

    syncMusicUI();
    syncPauseUI();

    if (data) {
      renderCategories();
      renderCarousel();
      renderReviews();
      renderPedidos();
    }
  }

  /* ---------- Pantallas (celular) ---------- */
  function showScreen(name) {
    if (!SCREENS.includes(name)) return;
    activeScreen = name;
    $$('.screen').forEach((s) => s.classList.toggle('is-active', s.dataset.screen === name));
    $$('.bn-btn').forEach((b) => {
      if (b.dataset.go === name) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    $$('.side-link[href]').forEach((a) => {
      const target = a.getAttribute('href').slice(1);
      if (target === name || (name === 'inicio' && ['nosotros','opiniones'].includes(target))) a.classList.add('is-current');
      else a.classList.remove('is-current');
    });
    const main = $('#main');
    if (main) main.scrollTop = 0;
    const active = $('.screen.is-active');
    if (active) active.scrollTop = 0;
    closeSideMenu();
    if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
  }

  function openSideMenu() {
    const menu = $('#side-menu'), overlay = $('#menu-overlay'), toggle = $('#menu-toggle');
    menu.hidden = false; overlay.hidden = false;
    requestAnimationFrame(() => { menu.classList.add('is-open'); overlay.classList.add('is-visible'); });
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
  }
  function closeSideMenu() {
    const menu = $('#side-menu'), overlay = $('#menu-overlay'), toggle = $('#menu-toggle');
    if (!menu || menu.hidden) return;
    menu.classList.remove('is-open'); overlay.classList.remove('is-visible');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    setTimeout(() => { if (!menu.classList.contains('is-open')) { menu.hidden = true; overlay.hidden = true; } }, 240);
  }

  function bindScreens() {
    $$('.bn-btn').forEach((btn) => btn.addEventListener('click', () => showScreen(btn.dataset.go)));
    $('#menu-toggle').addEventListener('click', openSideMenu);
    $('#menu-close').addEventListener('click', closeSideMenu);
    $('#menu-overlay').addEventListener('click', closeSideMenu);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSideMenu(); });

    // Navegación por vistas en escritorio y celular, sin scroll de página completa
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      if (SCREENS.includes(id)) { e.preventDefault(); showScreen(id); }
      else if (['nosotros','opiniones'].includes(id)) {
        e.preventDefault(); showScreen('inicio');
        const target = document.getElementById(id);
        if (target) target.scrollIntoView({block:'start',behavior: reduceMotion ? 'auto' : 'smooth'});
      }
    });
    window.addEventListener('hashchange', () => {
      const requested = location.hash.slice(1);
      if (SCREENS.includes(requested)) showScreen(requested);
    });
    mobileQuery.addEventListener('change', () => showScreen(activeScreen));
  }

  /* ---------- Música de fondo ---------- */
  function syncMusicUI() {
    const btn = $('#music-toggle');
    const audio = $('#bg-music');
    if (musicUnavailable) {
      btn.disabled = true;
      btn.setAttribute('aria-label', t('music_unavailable'));
      btn.setAttribute('aria-pressed', 'false');
      return;
    }
    const on = !audio.paused;
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', t(on ? 'music_off' : 'music_on'));
  }

  function bindMusic() {
    const audio = $('#bg-music');
    const btn = $('#music-toggle');

    btn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play()
          .then(syncMusicUI)
          .catch(() => { musicUnavailable = true; syncMusicUI(); });
      } else {
        audio.pause();
      }
    });

    audio.addEventListener('play', syncMusicUI);
    audio.addEventListener('pause', syncMusicUI);
    audio.addEventListener('error', () => { musicUnavailable = true; syncMusicUI(); });
  }

  /* ---------- Animación al hacer scroll ---------- */
  const io = ('IntersectionObserver' in window)
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 })
    : null;

  function observeReveal(nodes) {
    nodes.forEach((node) => {
      if (!io || reduceMotion) node.classList.add('visible');
      else io.observe(node);
    });
  }

  /* ---------- Carga de datos (fetch) ---------- */
  async function loadData() {
    const res = await fetch('menu.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  /* ---------- Carta: Región → Categoría → Plato → Receta ---------- */
  function pickCard(level, index) {
    carta[level] = index;
    if (level === 'region') { carta.category = null; carta.dish = null; }
    if (level === 'category') carta.dish = null;
    renderCategories();
    if (isMobile()) $('#main').scrollTop = 0;
  }

  function goBack() {
    if (carta.dish !== null) carta.dish = null;
    else if (carta.category !== null) carta.category = null;
    else carta.region = null;
    renderCategories();
    if (isMobile()) $('#main').scrollTop = 0;
  }

  function backButton() {
    const b = el('button', 'back-btn');
    b.type = 'button';
    b.append(icon('i-left'), el('span', '', cartaL('back')));
    b.addEventListener('click', goBack);
    return b;
  }

  function renderRegions(view) {
    const grid = el('div', 'region-grid');
    data.regions.forEach((r, i) => {
      const b = el('button', 'region-card');
      b.type = 'button';
      b.dataset.region = r.id;
      b.setAttribute('aria-label', pick(r.name));

      const bg = el('div', 'region-bg');
      bg.setAttribute('aria-hidden', 'true');

      const txt = el('div', 'region-text');
      txt.append(el('span', 'region-title', pick(r.name)), el('span', 'region-sub', pick(r.sub)));

      b.append(bg, txt);
      b.addEventListener('click', () => pickCard('region', i));
      grid.append(b);
    });
    view.append(grid);
  }

  function renderIndex(view, region) {
    view.append(el('h3', 'panel-title', pick(region.name)));
    const list = el('div', 'index-list');
    region.categories.forEach((c, i) => {
      const b = el('button', 'index-row');
      b.type = 'button';
      b.dataset.pattern = c.pattern;
      b.append(el('span', '', pick(c.title)), el('span', 'index-count', String(c.items.length)));
      b.addEventListener('click', () => pickCard('category', i));
      list.append(b);
    });
    view.append(list);
  }

  function renderDishList(view, cat) {
    view.append(el('h3', 'panel-title', pick(cat.title)));
    const list = el('ul', 'menu-list');
    cat.items.forEach((d, i) => {
      const n = qtyInCart(d.id);
      const li = el('li', 'dish-item');
      if (n > 0) li.classList.add('in-cart');

      const b = el('button', 'dish-row');
      b.type = 'button';
      const info = el('div');
      info.append(el('h4', '', pick(d.name)), el('p', '', pick(d.desc)));
      b.append(info, el('span', 'menu-price', `Bs ${d.price}`));
      b.addEventListener('click', () => pickCard('dish', i));

      if (n > 0) {
        li.append(b, qtyControl(d.id));
      } else {
        const add = el('button', 'add-btn', cartTxt('add'));
        add.type = 'button';
        add.addEventListener('click', () => addToCart(d.id));
        li.append(b, add);
      }
      list.append(li);
    });
    view.append(list);
  }

  function renderDish(view, dish) {
    const wrap = el('article', 'dish-detail');

    const photo = el('div', 'dish-photo');
    if (dish.image) {
      const img = el('img');
      img.src = dish.image;
      img.alt = pick(dish.name);
      img.loading = 'lazy';
      photo.append(img);
    } else {
      photo.append(el('div', 'placeholder', t('soon')));
    }

    const text = el('div', 'dish-text');
    text.append(
      el('h3', 'panel-title', pick(dish.name)),
      el('p', 'dish-desc', pick(dish.desc)),
      el('span', 'menu-price', `Bs ${dish.price}`)
    );

    if (qtyInCart(dish.id) > 0) {
      text.append(qtyControl(dish.id));
    } else {
      const addDetail = el('button', 'add-btn add-detail', cartTxt('add_detail'));
      addDetail.type = 'button';
      addDetail.addEventListener('click', () => addToCart(dish.id));
      text.append(addDetail);
    }

    text.append(el('h4', 'recipe-title', cartaL('ingredients')));

    const ing = el('ul', 'recipe-list');
    dish.ingredients.forEach((x) => ing.append(el('li', '', x)));

    const prep = el('h4', 'recipe-title', cartaL('prep'));
    const steps = el('ol', 'recipe-list');
    dish.steps.forEach((x) => steps.append(el('li', '', x)));

    text.append(ing, prep, steps);
    wrap.append(photo, text);
    view.append(wrap);
  }

  /** Dibuja la carta según el nivel en el que esté el visitante */
  function findDishPosition(dishId) {
    for (let ri = 0; ri < data.regions.length; ri++) {
      for (let ci = 0; ci < data.regions[ri].categories.length; ci++) {
        const items = data.regions[ri].categories[ci].items;
        const di = items.findIndex((d) => d.id === dishId);
        if (di !== -1) return { region: ri, category: ci, dish: di };
      }
    }
    return null;
  }

  function renderMenuCard(dish, region, position) {
    const card = el('article', 'menu-food-card');
    const photo = el('button', 'food-card-photo');
    photo.type = 'button';
    photo.setAttribute('aria-label', `Ver detalles de ${pick(dish.name)}`);
    const img = el('img');
    img.src = dish.image || `assets/${region.id}.jpeg`;
    img.alt = pick(dish.name);
    img.loading = 'lazy';
    img.onerror = () => { if (!img.dataset.fallback) { img.dataset.fallback = '1'; img.src = `assets/${region.id}.jpeg`; } else img.remove(); };
    photo.append(img);
    photo.addEventListener('click', () => { carta.region = position.region; carta.category = position.category; carta.dish = position.dish; renderCategories(); });
    const body = el('div', 'food-card-body');
    const tag = el('span', 'food-region-tag', pick(region.name));
    const title = el('h3', 'food-card-title', pick(dish.name));
    const desc = el('p', 'food-card-desc', pick(dish.desc));
    const footer = el('div', 'food-card-footer');
    footer.append(el('strong', 'food-card-price', `Bs ${dish.price}`));
    const add = el('button', 'add-btn food-add', cartTxt('add'));
    add.type = 'button';
    add.addEventListener('click', () => addToCart(dish.id));
    footer.append(add);
    body.append(tag, title, desc, footer);
    card.append(photo, body);
    if (qtyInCart(dish.id) > 0) {
      card.classList.add('in-cart');
      body.append(qtyControl(dish.id));
    }
    return card;
  }

  function renderCategories() {
    const view = $('#carta-view');
    if (!view || !data) return;
    view.replaceChildren();

    if (carta.dish !== null && carta.region !== null && carta.category !== null) {
      view.append(backButton());
      const region = data.regions[carta.region];
      const dish = region.categories[carta.category].items[carta.dish];
      renderDish(view, dish);
      return;
    }

    const filterbar = el('div', 'menu-region-filters');
    const filters = [
      { id: 'all', label: lang === 'en' ? 'All' : 'Todos' },
      { id: 'andes', label: 'Andes' },
      { id: 'valles', label: lang === 'en' ? 'Valleys' : 'Valles' },
      { id: 'oriente', label: lang === 'en' ? 'Lowlands' : 'Oriente' }
    ];
    filters.forEach((f) => {
      const b = el('button', `menu-filter${carta.filter === f.id ? ' active' : ''}`, f.label);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(carta.filter === f.id));
      b.addEventListener('click', () => { carta.filter = f.id; renderCategories(); });
      filterbar.append(b);
    });
    view.append(filterbar);

    const grid = el('div', 'menu-food-grid');
    data.regions.forEach((region, ri) => {
      if (carta.filter !== 'all' && carta.filter !== region.id) return;
      region.categories.forEach((category, ci) => {
        category.items.forEach((dish, di) => {
          grid.append(renderMenuCard(dish, region, { region: ri, category: ci, dish: di }));
        });
      });
    });
    view.append(grid);
    const note = el('p', 'menu-price-note', lang === 'en' ? 'Reference prices are editable; confirm the restaurant’s final prices before publishing.' : 'Precios de referencia editables; confirmar los precios finales del local antes de publicar.');
    view.append(note);
  }

  /* ---------- Lightbox ---------- */
  function openLightbox(item) {
    const dlg = $('#lightbox');
    const img = $('#lightbox-img');
    const ph = $('#lightbox-placeholder');

    if (item.src) {
      img.src = item.src;
      img.alt = pick(item.alt);
      img.hidden = false;
      ph.hidden = true;
    } else {
      img.removeAttribute('src');
      img.alt = '';
      img.hidden = true;
      ph.hidden = false;
      ph.textContent = t('soon');
    }
    $('#lightbox-caption').textContent = pick(item.alt);

    if (typeof dlg.showModal === 'function') dlg.showModal();
  }

  function bindLightbox() {
    const dlg = $('#lightbox');
    $('#lightbox-close').addEventListener('click', () => dlg.close());
    // Cerrar al tocar el fondo oscuro
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  }

  /* ---------- Carrusel + miniaturas ---------- */
  function goTo(index) {
    if (!slideCount) return;
    slideIndex = (index + slideCount) % slideCount;
    $('#carousel-track').style.transform = `translateX(-${slideIndex * 100}%)`;
    $$('.dot').forEach((d, i) => d.setAttribute('aria-current', String(i === slideIndex)));
  }

  function startAutoplay() {
    clearInterval(slideTimer);
    if (!carouselPaused && slideCount > 1) {
      slideTimer = setInterval(() => goTo(slideIndex + 1), 6000);
    }
  }

  function syncPauseUI() {
    const btn = $('#carousel-pause');
    btn.setAttribute('aria-pressed', String(carouselPaused));
    btn.setAttribute('aria-label', t(carouselPaused ? 'play' : 'pause'));
  }

  function renderCarousel() {
    const track = $('#carousel-track');
    const dots = $('#carousel-dots');
    const thumbs = $('#thumbs');
    track.replaceChildren();
    dots.replaceChildren();
    thumbs.replaceChildren();

    slideCount = data.gallery.length;

    data.gallery.forEach((g, i) => {
      // Slide grande
      const fig = el('figure', 'slide');
      if (g.src) {
        const img = el('img', 'zoomable');
        img.src = g.src;
        img.alt = pick(g.alt);
        img.loading = i === 0 ? 'eager' : 'lazy';
        img.addEventListener('click', () => openLightbox(g));
        fig.append(img);
      } else {
        fig.append(el('div', 'placeholder', t('soon')));
      }
      fig.append(el('figcaption', '', pick(g.alt)));
      track.append(fig);

      // Punto de navegación
      const dot = el('button', 'dot');
      dot.type = 'button';
      dot.setAttribute('aria-label', `${i + 1} / ${slideCount}`);
      dot.addEventListener('click', () => { goTo(i); startAutoplay(); });
      dots.append(dot);

      // Miniatura que se agranda al tocarla
      const thumb = el('button', 'thumb');
      thumb.type = 'button';
      thumb.setAttribute('aria-label', pick(g.alt));
      if (g.src) {
        const timg = el('img');
        timg.src = g.src;
        timg.alt = '';
        timg.loading = 'lazy';
        thumb.append(timg);
      } else {
        thumb.append(el('div', 'placeholder', pick(g.alt)));
      }
      thumb.addEventListener('click', () => openLightbox(g));
      thumbs.append(thumb);
    });

    goTo(Math.min(slideIndex, slideCount - 1));
    startAutoplay();
  }

  function bindCarousel() {
    const root = $('.carousel');
    const track = $('#carousel-track');

    $('.carousel-ctrl.prev').addEventListener('click', () => { goTo(slideIndex - 1); startAutoplay(); });
    $('.carousel-ctrl.next').addEventListener('click', () => { goTo(slideIndex + 1); startAutoplay(); });

    $('#carousel-pause').addEventListener('click', () => {
      carouselPaused = !carouselPaused;
      syncPauseUI();
      startAutoplay();
    });

    // Deslizar con el dedo en el celular
    let startX = null;
    track.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) { goTo(slideIndex + (dx < 0 ? 1 : -1)); startAutoplay(); }
      startX = null;
    });

    // Flechas del teclado con el carrusel enfocado
    root.tabIndex = 0;
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { goTo(slideIndex + 1); startAutoplay(); }
      if (e.key === 'ArrowLeft') { goTo(slideIndex - 1); startAutoplay(); }
    });
  }

  /* ---------- Opiniones ---------- */
  function renderReviews() {
    const wrap = $('#reviews');
    wrap.replaceChildren();

    const savedReviews = (() => {
      try { return JSON.parse(localStorage.getItem('irpavi_local_reviews') || '[]'); } catch { return []; }
    })();
    [...data.reviews, ...savedReviews].forEach((r) => {
      const card = el('article', 'review');
      const stars = el('div', 'stars');
      stars.setAttribute('aria-label', `${r.stars} / 5`);
      for (let i = 0; i < 5; i++) {
        const star = icon('i-star');
        star.style.opacity = i < Number(r.stars || 5) ? '1' : '.28';
        stars.append(star);
      }
      const text = el('p', '', typeof r.text === 'string' ? r.text : pick(r.text));
      const author = el('span', 'author', r.name || t('review_author'));
      card.append(stars, text, author);
      wrap.append(card);
    });
    observeReveal($$('.review', wrap));
  }

  /* Reseñas locales (demostración): no reemplaza una base de datos compartida. */
  function bindReviewForm() {
    const form = $('#review-form');
    if (!form) return;
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const name = $('#review-name').value.trim();
      const stars = Number($('#review-stars').value);
      const text = $('#review-text').value.trim();
      if (name.length < 2 || text.length < 8) return;
      let reviews = [];
      try { reviews = JSON.parse(localStorage.getItem('irpavi_local_reviews') || '[]'); } catch {}
      reviews.unshift({ name, stars, text, createdAt: new Date().toISOString() });
      localStorage.setItem('irpavi_local_reviews', JSON.stringify(reviews));
      form.reset();
      $('#review-status').textContent = '¡Gracias! Tu opinión se agregó en este navegador.';
      renderReviews();
    });
  }

  /* ---------- Formulario con validación ---------- */
  const rules = {
    name: {
      test: (v) => /^[\p{L} .'-]{3,}$/u.test(v.trim()),
      msg: 'err_name'
    },
    email: {
      test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
      msg: 'err_email'
    },
    phone: {
      test: (v) => v.trim() === '' || /^\d{7,8}$/.test(v.replace(/\s/g, '')),
      msg: 'err_phone'
    },
    message: {
      test: (v) => v.trim().length >= 10,
      msg: 'err_msg'
    }
  };

  function validateField(form, key) {
    const input = form.elements.namedItem(key);
    const ok = rules[key].test(input.value);
    input.setAttribute('aria-invalid', String(!ok));
    $('#' + key + '-error').textContent = ok ? '' : t(rules[key].msg);
    return ok;
  }

  function bindForm() {
    const form = $('#contact-form');

    form.addEventListener('focusout', (e) => {
      if (rules[e.target.name]) validateField(form, e.target.name);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const status = $('#form-status');
      status.textContent = '';

      const results = Object.keys(rules).map((key) => validateField(form, key));
      if (results.every(Boolean)) {
        // Aquí se conecta un servicio como Formspree o un endpoint propio
        form.reset();
        Object.keys(rules).forEach((key) => {
          form.elements.namedItem(key).setAttribute('aria-invalid', 'false');
        });
        status.textContent = t('sent');
      } else {
        form.querySelector('[aria-invalid="true"]').focus();
      }
    });
  }

  /* ---------- Pedidos: carrito, confirmación e historial ---------- */
  const CONFIRM_SECONDS = 60;
  const MAX_QTY = 25;

  const CART_L = {
    es: {
      title: 'Pedido', add: 'Agregar', add_detail: 'Agregar al pedido', added: 'Listo',
      less: 'Quitar uno', more: 'Agregar uno', total: 'Total',
      empty: 'Tu pedido está vacío.', go_carta: 'Ver carta',
      confirm: 'Confirmar pedido', pending_title: 'Pedido en confirmación',
      pending_hint: 'Puedes cancelarlo antes de que termine el tiempo.',
      cancel: 'Cancelar pedido', history: 'Historial',
      status_pendiente: 'Pendiente', status_confirmado: 'Confirmado', status_en_espera: 'En espera',
      hint_offline: 'Sin conexión: tu pedido quedó en espera y se confirmará al volver a conectarte.'
    },
    en: {
      title: 'Order', add: 'Add', add_detail: 'Add to order', added: 'Added',
      less: 'Remove one', more: 'Add one', total: 'Total',
      empty: 'Your order is empty.', go_carta: 'View menu',
      confirm: 'Confirm order', pending_title: 'Order being confirmed',
      pending_hint: 'You can cancel it before the time runs out.',
      cancel: 'Cancel order', history: 'History',
      status_pendiente: 'Pending', status_confirmado: 'Confirmed', status_en_espera: 'On hold',
      hint_offline: 'Offline: your order is on hold and will be confirmed when you reconnect.'
    }
  };

  const cartTxt = (key) => (CART_L[lang] || CART_L.es)[key];

  let cart = loadJSON('cart', []);      // [{ id, qty }]
  let orders = loadJSON('orders', []);  // [{ id, date, items, total, status, endsAt }]
  let countdownTimer = null;

  function loadJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
  }

  function saveOrders() {
    localStorage.setItem('orders', JSON.stringify(orders));
  }

  function findDish(id) {
    if (!data) return null;
    for (const r of data.regions) {
      for (const c of r.categories) {
        const dish = c.items.find((x) => x.id === id);
        if (dish) return dish;
      }
    }
    return null;
  }

  function cartLines() {
    return cart
      .map((line) => {
        const dish = findDish(line.id);
        return dish ? { id: dish.id, name: pick(dish.name), price: dish.price, qty: line.qty } : null;
      })
      .filter(Boolean);
  }

  const cartTotal = () => cartLines().reduce((sum, l) => sum + l.price * l.qty, 0);
  const cartCount = () => cart.reduce((sum, l) => sum + l.qty, 0);
  const pendingOrder = () => orders.find((o) => o.status === 'pendiente') || null;
  const secondsLeft = (order) => Math.max(0, Math.ceil((order.endsAt - Date.now()) / 1000));

  function updateCartUI() {
    const badge = $('#cart-count');
    if (!badge) return;
    const n = cartCount();
    badge.textContent = String(n);
    badge.hidden = n === 0;
  }

  const qtyInCart = (id) => {
    const line = cart.find((l) => l.id === id);
    return line ? line.qty : 0;
  };

  function refresh() {
    renderCategories();
    renderPedidos();
  }

  /** Fija la cantidad de un plato (0 lo quita del pedido, máximo 25) */
  function setQty(id, qty) {
    const n = Math.max(0, Math.min(MAX_QTY, qty));
    const line = cart.find((l) => l.id === id);
    if (n === 0) cart = cart.filter((l) => l.id !== id);
    else if (line) line.qty = n;
    else cart.push({ id, qty: n });
    saveCart();
    refresh();
  }

  const addToCart = (id) => setQty(id, qtyInCart(id) + 1);
  const changeQty = (id, delta) => setQty(id, qtyInCart(id) + delta);

  /** Selector − n + con la misma apariencia que en Pedidos */
  function qtyControl(id) {
    const n = qtyInCart(id);
    const wrap = el('div', 'qty qty-inline');

    const minus = el('button', 'qty-btn', '−');
    minus.type = 'button';
    minus.setAttribute('aria-label', cartTxt('less'));
    minus.addEventListener('click', () => setQty(id, n - 1));

    const plus = el('button', 'qty-btn', '+');
    plus.type = 'button';
    plus.disabled = n >= MAX_QTY;
    plus.setAttribute('aria-label', cartTxt('more'));
    plus.addEventListener('click', () => setQty(id, n + 1));

    wrap.append(minus, el('span', 'qty-num', String(n)), plus);
    return wrap;
  }

  function confirmOrder() {
    if (!cart.length || pendingOrder()) return;
    const lines = cartLines();
    orders.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: new Date().toISOString(),
      items: lines.map(({ id, name, price, qty }) => ({ id, name, price, qty })),
      total: cartTotal(),
      status: 'pendiente',
      endsAt: Date.now() + CONFIRM_SECONDS * 1000
    });
    cart = [];
    saveCart();
    saveOrders();
    renderPedidos();
    startCountdown();
  }

  function cancelOrder(id) {
    const order = orders.find((o) => o.id === id);
    if (!order || order.status !== 'pendiente') return;
    // Devuelve los platos al carrito, sin pasar del máximo por plato
    order.items.forEach(({ id: dishId, qty }) => {
      const line = cart.find((l) => l.id === dishId);
      if (line) line.qty = Math.min(MAX_QTY, line.qty + qty);
      else cart.push({ id: dishId, qty: Math.min(MAX_QTY, qty) });
    });
    orders = orders.filter((o) => o.id !== id);
    stopCountdown();
    saveCart();
    saveOrders();
    renderPedidos();
  }

  function finishPending() {
    const order = pendingOrder();
    if (!order) return;
    order.status = navigator.onLine ? 'confirmado' : 'en_espera';
    stopCountdown();
    saveOrders();
    renderPedidos();
  }

  function syncOnline() {
    let changed = false;
    orders.forEach((o) => {
      if (o.status === 'en_espera') { o.status = 'confirmado'; changed = true; }
    });
    if (changed) { saveOrders(); renderPedidos(); }
  }

  function startCountdown() {
    stopCountdown();
    countdownTimer = setInterval(tick, 1000);
    tick();
  }

  function stopCountdown() {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  function tick() {
    const order = pendingOrder();
    if (!order) { stopCountdown(); return; }
    const node = $('#countdown');
    if (node) node.textContent = `${secondsLeft(order)} s`;
    if (secondsLeft(order) === 0) finishPending();
  }

  function renderPedidos() {
    const view = $('#pedidos-view');
    if (!view || !data) return;
    view.replaceChildren();
    updateCartUI();

    const lines = cartLines();
    const pending = pendingOrder();

    view.append(el('h3', 'panel-title', cartTxt('title')));

    if (lines.length) {
      const ul = el('ul', 'cart-list');
      lines.forEach((line) => {
        const li = el('li', 'cart-row');
        const info = el('div');
        info.append(el('h4', '', line.name), el('span', 'menu-price', `Bs ${line.price}`));

        const qty = el('div', 'qty');
        const minus = el('button', 'qty-btn', '−');
        minus.type = 'button';
        minus.setAttribute('aria-label', cartTxt('less'));
        minus.addEventListener('click', () => changeQty(line.id, -1));

        const plus = el('button', 'qty-btn', '+');
        plus.type = 'button';
        plus.disabled = line.qty >= MAX_QTY;
        plus.setAttribute('aria-label', cartTxt('more'));
        plus.addEventListener('click', () => changeQty(line.id, 1));

        qty.append(minus, el('span', 'qty-num', String(line.qty)), plus);
        li.append(info, qty);
        ul.append(li);
      });

      const total = el('div', 'cart-total');
      total.append(el('span', '', cartTxt('total')), el('span', '', `Bs ${cartTotal()}`));

      view.append(ul, total);

      if (!pending) {
        const confirm = el('button', 'confirm-btn', cartTxt('confirm'));
        confirm.type = 'button';
        confirm.addEventListener('click', confirmOrder);
        view.append(confirm);
      }
    } else if (!pending) {
      const box = el('div', 'empty-box');
      const go = el('button', 'add-btn add-detail', cartTxt('go_carta'));
      go.type = 'button';
      go.addEventListener('click', () => showScreen('carta'));
      box.append(el('p', '', cartTxt('empty')), go);
      view.append(box);
    }

    if (pending) {
      const box = el('div', 'pending-box');
      const countdown = el('p', 'countdown', `${secondsLeft(pending)} s`);
      countdown.id = 'countdown';
      const cancel = el('button', 'cancel-btn', cartTxt('cancel'));
      cancel.type = 'button';
      cancel.addEventListener('click', () => cancelOrder(pending.id));
      box.append(
        el('p', 'pending-title', cartTxt('pending_title')),
        el('p', 'order-hint', cartTxt('pending_hint')),
        countdown,
        cancel
      );
      view.append(box);
    }

    const history = orders.filter((o) => o.status !== 'pendiente');
    if (history.length) {
      view.append(el('h3', 'sub-title', cartTxt('history')));
      history.forEach((o) => {
        const card = el('article', 'order-card');
        const head = el('div', 'order-head');
        const date = new Date(o.date).toLocaleString(lang === 'es' ? 'es-BO' : 'en-US', {
          dateStyle: 'medium', timeStyle: 'short'
        });
        head.append(el('span', '', date), el('span', `status-chip status-${o.status}`, cartTxt('status_' + o.status)));
        card.append(
          head,
          el('p', 'order-items', o.items.map((i) => `${i.qty} × ${i.name}`).join(', ')),
          el('p', '', `${cartTxt('total')}: Bs ${o.total}`)
        );
        if (o.status === 'en_espera') card.append(el('p', 'order-hint', cartTxt('hint_offline')));
        view.append(card);
      });
    }
  }

  function bindCart() {
    $$('.bn-btn[data-go="pedidos"]').forEach((btn) => btn.addEventListener('click', renderPedidos));
    window.addEventListener('online', syncOnline);
    updateCartUI();

    // Si el visitante recargó la página con un pedido en confirmación, se retoma el conteo
    const order = pendingOrder();
    if (order) {
      if (secondsLeft(order) === 0) finishPending();
      else startCountdown();
    }
  }

  /* ---------- Inicio ---------- */
  async function init() {
    document.documentElement.classList.add('js');

    $('#theme-toggle').addEventListener('click', () => applyTheme(theme === 'dark' ? 'light' : 'dark'));
    $('#lang-toggle').addEventListener('click', () => applyLang(lang === 'es' ? 'en' : 'es'));

    applyTheme(theme);
    applyLang(lang);
    bindScreens();
    bindWelcome();
    bindMusic();
    bindCarousel();
    bindLightbox();
    bindForm();
    bindReviewForm();
    bindCart();
    showScreen(SCREENS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'inicio');
    observeReveal($$('.reveal'));

    try {
      data = await loadData();
      renderCategories();
      renderCarousel();
      renderReviews();
      renderPedidos();
    } catch (err) {
      console.error(err);
      $('#carta-view').textContent = t('loading_err');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();