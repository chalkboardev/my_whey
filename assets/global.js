function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

class SectionId {
  static #separator = '__';

  // for a qualified section id (e.g. 'template--22224696705326__main'), return just the section id (e.g. 'template--22224696705326')
  static parseId(qualifiedSectionId) {
    return qualifiedSectionId.split(SectionId.#separator)[0];
  }

  // for a qualified section id (e.g. 'template--22224696705326__main'), return just the section name (e.g. 'main')
  static parseSectionName(qualifiedSectionId) {
    return qualifiedSectionId.split(SectionId.#separator)[1];
  }

  // for a section id (e.g. 'template--22224696705326') and a section name (e.g. 'recommended-products'), return a qualified section id (e.g. 'template--22224696705326__recommended-products')
  static getIdForSection(sectionId, sectionName) {
    return `${sectionId}${SectionId.#separator}${sectionName}`;
  }
}

class HTMLUpdateUtility {
  /**
   * Used to swap an HTML node with a new node.
   * The new node is inserted as a previous sibling to the old node, the old node is hidden, and then the old node is removed.
   *
   * The function currently uses a double buffer approach, but this should be replaced by a view transition once it is more widely supported https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
   */
  static viewTransition(oldNode, newContent, preProcessCallbacks = [], postProcessCallbacks = []) {
    preProcessCallbacks?.forEach((callback) => callback(newContent));

    const newNodeWrapper = document.createElement('div');
    HTMLUpdateUtility.setInnerHTML(newNodeWrapper, newContent.outerHTML);
    const newNode = newNodeWrapper.firstChild;

    // dedupe IDs
    const uniqueKey = Date.now();
    oldNode.querySelectorAll('[id], [form]').forEach((element) => {
      element.id && (element.id = `${element.id}-${uniqueKey}`);
      element.form && element.setAttribute('form', `${element.form.getAttribute('id')}-${uniqueKey}`);
    });

    oldNode.parentNode.insertBefore(newNode, oldNode);
    oldNode.style.display = 'none';

    postProcessCallbacks?.forEach((callback) => callback(newNode));

    setTimeout(() => oldNode.remove(), 500);
  }

  // Sets inner HTML and reinjects the script tags to allow execution. By default, scripts are disabled when using element.innerHTML.
  static setInnerHTML(element, html) {
    element.innerHTML = html;
    element.querySelectorAll('script').forEach((oldScriptTag) => {
      const newScriptTag = document.createElement('script');
      Array.from(oldScriptTag.attributes).forEach((attribute) => {
        newScriptTag.setAttribute(attribute.name, attribute.value);
      });
      newScriptTag.appendChild(document.createTextNode(oldScriptTag.innerHTML));
      oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
    });
  }
}

document.querySelectorAll('[id^="Details-"] summary').forEach((summary) => {
  summary.setAttribute('role', 'button');
  summary.setAttribute('aria-expanded', summary.parentNode.hasAttribute('open'));

  if (summary.nextElementSibling.getAttribute('id')) {
    summary.setAttribute('aria-controls', summary.nextElementSibling.id);
  }

  summary.addEventListener('click', (event) => {
    event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
  });

  if (summary.closest('header-drawer, menu-drawer')) return;
  summary.parentElement.addEventListener('keyup', onKeyUpEscape);
});

const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (event.target !== container && event.target !== last && event.target !== first) return;

    document.addEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function () {
    document.removeEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function (event) {
    if (event.code.toUpperCase() !== 'TAB') return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if ((event.target === container || event.target === first) && event.shiftKey) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener('focusout', trapFocusHandlers.focusout);
  document.addEventListener('focusin', trapFocusHandlers.focusin);

  elementToFocus.focus();

  if (
    elementToFocus.tagName === 'INPUT' &&
    ['search', 'text', 'email', 'url'].includes(elementToFocus.type) &&
    elementToFocus.value
  ) {
    elementToFocus.setSelectionRange(0, elementToFocus.value.length);
  }
}

// Here run the querySelector to figure out if the browser supports :focus-visible or not and run code based on it.
try {
  document.querySelector(':focus-visible');
} catch (e) {
  focusVisiblePolyfill();
}

function focusVisiblePolyfill() {
  const navKeys = [
    'ARROWUP',
    'ARROWDOWN',
    'ARROWLEFT',
    'ARROWRIGHT',
    'TAB',
    'ENTER',
    'SPACE',
    'ESCAPE',
    'HOME',
    'END',
    'PAGEUP',
    'PAGEDOWN',
  ];
  let currentFocusedElement = null;
  let mouseClick = null;

  window.addEventListener('keydown', (event) => {
    if (navKeys.includes(event.code.toUpperCase())) {
      mouseClick = false;
    }
  });

  window.addEventListener('mousedown', (event) => {
    mouseClick = true;
  });

  window.addEventListener(
    'focus',
    () => {
      if (currentFocusedElement) currentFocusedElement.classList.remove('focused');

      if (mouseClick) return;

      currentFocusedElement = document.activeElement;
      currentFocusedElement.classList.add('focused');
    },
    true
  );
}

function pauseAllMedia() {
  document.querySelectorAll('.js-youtube').forEach((video) => {
    video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
  });
  document.querySelectorAll('.js-vimeo').forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', '*');
  });
  document.querySelectorAll('video').forEach((video) => video.pause());
  document.querySelectorAll('product-model').forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener('focusin', trapFocusHandlers.focusin);
  document.removeEventListener('focusout', trapFocusHandlers.focusout);
  document.removeEventListener('keydown', trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== 'ESCAPE') return;

  const openDetailsElement = event.target.closest('details[open]');
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector('summary');
  openDetailsElement.removeAttribute('open');
  summaryElement.setAttribute('aria-expanded', false);
  summaryElement.focus();
}

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true });
    this.input.addEventListener('change', this.onInputChange.bind(this));
    this.querySelectorAll('button').forEach((button) =>
      button.addEventListener('click', this.onButtonClick.bind(this))
    );
  }

  quantityUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.validateQtyRules();
    this.quantityUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.quantityUpdate, this.validateQtyRules.bind(this));
  }

  disconnectedCallback() {
    if (this.quantityUpdateUnsubscriber) {
      this.quantityUpdateUnsubscriber();
    }
  }

  onInputChange(event) {
    this.validateQtyRules();
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    if (event.target.name === 'plus') {
      if (parseInt(this.input.dataset.min) > parseInt(this.input.step) && this.input.value == 0) {
        this.input.value = this.input.dataset.min;
      } else {
        this.input.stepUp();
      }
    } else {
      this.input.stepDown();
    }

    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);

    if (this.input.dataset.min === previousValue && event.target.name === 'minus') {
      this.input.value = parseInt(this.input.min);
    }
  }

  validateQtyRules() {
    const value = parseInt(this.input.value);
    if (this.input.min) {
      const buttonMinus = this.querySelector(".quantity__button[name='minus']");
      buttonMinus.classList.toggle('disabled', parseInt(value) <= parseInt(this.input.min));
    }
    if (this.input.max) {
      const max = parseInt(this.input.max);
      const buttonPlus = this.querySelector(".quantity__button[name='plus']");
      buttonPlus.classList.toggle('disabled', value >= max);
    }
  }
}

customElements.define('quantity-input', QuantityInput);

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function throttle(fn, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return fn(...args);
  };
}

function fetchConfig(type = 'json') {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: `application/${type}` },
  };
}

/*
 * Shopify Common JS
 *
 */
if (typeof window.Shopify == 'undefined') {
  window.Shopify = {};
}

Shopify.bind = function (fn, scope) {
  return function () {
    return fn.apply(scope, arguments);
  };
};

Shopify.setSelectorByValue = function (selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function (target, eventName, callback) {
  target.addEventListener
    ? target.addEventListener(eventName, callback, false)
    : target.attachEvent('on' + eventName, callback);
};

Shopify.postLink = function (path, options) {
  options = options || {};
  var method = options['method'] || 'post';
  var params = options['parameters'] || {};

  var form = document.createElement('form');
  form.setAttribute('method', method);
  form.setAttribute('action', path);

  for (var key in params) {
    var hiddenField = document.createElement('input');
    hiddenField.setAttribute('type', 'hidden');
    hiddenField.setAttribute('name', key);
    hiddenField.setAttribute('value', params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function (country_domid, province_domid, options) {
  this.countryEl = document.getElementById(country_domid);
  this.provinceEl = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(options['hideElement'] || province_domid);

  Shopify.addListener(this.countryEl, 'change', Shopify.bind(this.countryHandler, this));

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function () {
    var value = this.countryEl.getAttribute('data-default');
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function () {
    var value = this.provinceEl.getAttribute('data-default');
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function (e) {
    var opt = this.countryEl.options[this.countryEl.selectedIndex];
    var raw = opt.getAttribute('data-provinces');
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = 'none';
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement('option');
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = '';
    }
  },

  clearOptions: function (selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function (selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement('option');
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  },
};

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector('details');

    this.addEventListener('keyup', this.onKeyUp.bind(this));
    this.addEventListener('focusout', this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll('summary').forEach((summary) =>
      summary.addEventListener('click', this.onSummaryClick.bind(this))
    );
    this.querySelectorAll(
      'button:not(.localization-selector):not(.country-selector__close-button):not(.country-filter__reset-button)'
    ).forEach((button) => button.addEventListener('click', this.onCloseButtonClick.bind(this)));
  }

  onKeyUp(event) {
    if (event.code.toUpperCase() !== 'ESCAPE') return;

    const openDetailsElement = event.target.closest('details[open]');
    if (!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle
      ? this.closeMenuDrawer(event, this.mainDetailsToggle.querySelector('summary'))
      : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const parentMenuElement = detailsElement.closest('.has-submenu');
    const isOpen = detailsElement.hasAttribute('open');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function addTrapFocus() {
      trapFocus(summaryElement.nextElementSibling, detailsElement.querySelector('button'));
      summaryElement.nextElementSibling.removeEventListener('transitionend', addTrapFocus);
    }

    if (detailsElement === this.mainDetailsToggle) {
      if (isOpen) event.preventDefault();
      isOpen ? this.closeMenuDrawer(event, summaryElement) : this.openMenuDrawer(summaryElement);

      if (window.matchMedia('(max-width: 990px)')) {
        document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
      }
    } else {
      setTimeout(() => {
        detailsElement.classList.add('menu-opening');
        summaryElement.setAttribute('aria-expanded', true);
        parentMenuElement && parentMenuElement.classList.add('submenu-open');
        !reducedMotion || reducedMotion.matches
          ? addTrapFocus()
          : summaryElement.nextElementSibling.addEventListener('transitionend', addTrapFocus);
      }, 100);
    }
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });
    summaryElement.setAttribute('aria-expanded', true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event === undefined) return;

    this.mainDetailsToggle.classList.remove('menu-opening');
    this.mainDetailsToggle.querySelectorAll('details').forEach((details) => {
      details.removeAttribute('open');
      details.classList.remove('menu-opening');
    });
    this.mainDetailsToggle.querySelectorAll('.submenu-open').forEach((submenu) => {
      submenu.classList.remove('submenu-open');
    });
    document.body.classList.remove(`overflow-hidden-${this.dataset.breakpoint}`);
    removeTrapFocus(elementToFocus);
    this.closeAnimation(this.mainDetailsToggle);

    if (event instanceof KeyboardEvent) elementToFocus?.setAttribute('aria-expanded', false);
  }

  onFocusOut() {
    setTimeout(() => {
      if (this.mainDetailsToggle.hasAttribute('open') && !this.mainDetailsToggle.contains(document.activeElement))
        this.closeMenuDrawer();
    });
  }

  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest('details');
    this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    const parentMenuElement = detailsElement.closest('.submenu-open');
    parentMenuElement && parentMenuElement.classList.remove('submenu-open');
    detailsElement.classList.remove('menu-opening');
    detailsElement.querySelector('summary').setAttribute('aria-expanded', false);
    removeTrapFocus(detailsElement.querySelector('summary'));
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute('open');
        if (detailsElement.closest('details[open]')) {
          trapFocus(detailsElement.closest('details[open]'), detailsElement.querySelector('summary'));
        }
      }
    };

    window.requestAnimationFrame(handleAnimation);
  }
}

customElements.define('menu-drawer', MenuDrawer);

class HeaderDrawer extends MenuDrawer {
  constructor() {
    super();
  }

  openMenuDrawer(summaryElement) {
    this.header = this.header || document.querySelector('.section-header');
    this.borderOffset =
      this.borderOffset || this.closest('.header-wrapper').classList.contains('header-wrapper--border-bottom') ? 1 : 0;
    document.documentElement.style.setProperty(
      '--header-bottom-position',
      `${parseInt(this.header.getBoundingClientRect().bottom - this.borderOffset)}px`
    );
    this.header.classList.add('menu-open');
    document.getElementById('menu_backdrop').classList.add('blurry_menu');

    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });

    summaryElement.setAttribute('aria-expanded', true);
    window.addEventListener('resize', this.onResize);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus) {
    if (!elementToFocus) return;
    super.closeMenuDrawer(event, elementToFocus);
    this.header.classList.remove('menu-open');
    window.removeEventListener('resize', this.onResize);
    document.getElementById('menu_backdrop').classList.remove('blurry_menu');
  }

  onResize = () => {
    this.header &&
      document.documentElement.style.setProperty(
        '--header-bottom-position',
        `${parseInt(this.header.getBoundingClientRect().bottom - this.borderOffset)}px`
      );
    document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
  };
}

customElements.define('header-drawer', HeaderDrawer);

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="ModalClose-"]').addEventListener('click', this.hide.bind(this, false));
    this.addEventListener('keyup', (event) => {
      if (event.code.toUpperCase() === 'ESCAPE') this.hide();
    });
    if (this.classList.contains('media-modal')) {
      this.addEventListener('pointerup', (event) => {
        if (event.pointerType === 'mouse' && !event.target.closest('deferred-media, product-model')) this.hide();
      });
    } else {
      this.addEventListener('click', (event) => {
        if (event.target === this) this.hide();
      });
    }
  }

  connectedCallback() {
    if (this.moved) return;
    this.moved = true;
    this.dataset.section = this.closest('.shopify-section').id.replace('shopify-section-', '');
    document.body.appendChild(this);
  }

  show(opener) {
    this.openedBy = opener;
    const popup = this.querySelector('.template-popup');
    document.body.classList.add('overflow-hidden');
    this.setAttribute('open', '');
    if (popup) popup.loadContent();
    trapFocus(this, this.querySelector('[role="dialog"]'));
    window.pauseAllMedia();
  }

  hide() {
    document.body.classList.remove('overflow-hidden');
    document.body.dispatchEvent(new CustomEvent('modalClosed'));
    this.removeAttribute('open');
    removeTrapFocus(this.openedBy);
    //window.pauseAllMedia();
    document.querySelectorAll('video').forEach((video) => video.play());
    document.querySelectorAll('product-model').forEach((model) => {
      if (model.modelViewerUI) model.modelViewerUI.play();
    });
  }
}
customElements.define('modal-dialog', ModalDialog);

class BulkModal extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);
      if (this.innerHTML.trim() === '') {
        const productUrl = this.dataset.url.split('?')[0];
        fetch(`${productUrl}?section_id=bulk-quick-order-list`)
          .then((response) => response.text())
          .then((responseText) => {
            const html = new DOMParser().parseFromString(responseText, 'text/html');
            const sourceQty = html.querySelector('.quick-order-list-container').parentNode;
            this.innerHTML = sourceQty.innerHTML;
          })
          .catch((e) => {
            console.error(e);
          });
      }
    };

    new IntersectionObserver(handleIntersection.bind(this)).observe(
      document.querySelector(`#QuickBulk-${this.dataset.productId}-${this.dataset.sectionId}`)
    );
  }
}

customElements.define('bulk-modal', BulkModal);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector('button');

    if (!button) return;
    button.addEventListener('click', () => {
      const modal = document.querySelector(this.getAttribute('data-modal'));
      if (modal) modal.show(button);
    });
  }
}
customElements.define('modal-opener', ModalOpener);

class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener('click', this.loadContent.bind(this));
  }

  loadContent(focus = true) {
    window.pauseAllMedia();
    if (!this.getAttribute('loaded')) {
      const content = document.createElement('div');
      content.appendChild(this.querySelector('template').content.firstElementChild.cloneNode(true));

      this.setAttribute('loaded', true);
      const deferredElement = this.appendChild(content.querySelector('video, model-viewer, iframe'));
      if (focus) deferredElement.focus();
      if (deferredElement.nodeName == 'VIDEO' && deferredElement.getAttribute('autoplay')) {
        // force autoplay for safari
        deferredElement.play();
      }
    }
  }
}

customElements.define('deferred-media', DeferredMedia);

class SliderComponent extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector('[id^="Slider-"]');
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.enableSliderLooping = false;
    this.currentPageElement = this.querySelector('.slider-counter--current');
    this.pageTotalElement = this.querySelector('.slider-counter--total');
    this.prevButton = this.querySelector('button[name="previous"]');
    this.nextButton = this.querySelector('button[name="next"]');

    if (!this.slider || !this.nextButton) return;

    this.initPages();
    const resizeObserver = new ResizeObserver((entries) => this.initPages());
    resizeObserver.observe(this.slider);

    this.slider.addEventListener('scroll', this.update.bind(this));
    this.prevButton.addEventListener('click', this.onButtonClick.bind(this));
    this.nextButton.addEventListener('click', this.onButtonClick.bind(this));
  }

  initPages() {
    this.sliderItemsToShow = Array.from(this.sliderItems).filter((element) => element.clientWidth > 0);
    if (this.sliderItemsToShow.length < 2) return;
    this.sliderItemOffset = this.sliderItemsToShow[1].offsetLeft - this.sliderItemsToShow[0].offsetLeft;
    this.slidesPerPage = Math.floor(
      (this.slider.clientWidth - this.sliderItemsToShow[0].offsetLeft) / this.sliderItemOffset
    );
    this.totalPages = this.sliderItemsToShow.length - this.slidesPerPage + 1;
    this.update();
  }

  resetPages() {
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.initPages();
  }

  update() {
    // Temporarily prevents unneeded updates resulting from variant changes
    // This should be refactored as part of https://github.com/Shopify/dawn/issues/2057
    if (!this.slider || !this.nextButton) return;

    const previousPage = this.currentPage;
    this.currentPage = Math.round(this.slider.scrollLeft / this.sliderItemOffset) + 1;

    if (this.currentPageElement && this.pageTotalElement) {
      this.currentPageElement.textContent = this.currentPage;
      this.pageTotalElement.textContent = this.totalPages;
    }

    if (this.currentPage != previousPage) {
      this.dispatchEvent(
        new CustomEvent('slideChanged', {
          detail: {
            currentPage: this.currentPage,
            currentElement: this.sliderItemsToShow[this.currentPage - 1],
          },
        })
      );

// ------- START TARGET BLURB SLIDER AND CURRENT SLIDE -------
      this.collectionBlurbSlider = this.querySelector('.collection_blurb_slider_component');
      if (this.collectionBlurbSlider) {
        const elementsWithClass = document.querySelectorAll('.pagination-dot');
      elementsWithClass.forEach(element => {
        element.classList.remove('active');
      });
      //console.log("Current Slide: " + this.currentPage);
      const target_slide_index = this.currentPage -1;
      this.paginateDot = this.querySelector('#slider_dot_' + target_slide_index);
      this.paginateDot.classList.add('active');
      }
// ------- END TARGET BLURB SLIDER AND CURRENT SLIDE -------

// ------- START TARGET BLURB SLIDER AND CURRENT SLIDE -------
this.blogBlurbSlider = this.querySelector('.blog_blurb_slider_component');
      if (this.blogBlurbSlider) {
        const elementsWithBlogClass = document.querySelectorAll('.pagination-dot');
        elementsWithBlogClass.forEach(element_dot => {
          element_dot.classList.remove('active');
      });
      //console.log("Current Slide: " + this.currentPage);
      const target_slide_index_blog = this.currentPage -1;
      this.paginateDotBlog = this.querySelector('#slider_dot_' + target_slide_index_blog);
      this.paginateDotBlog.classList.add('active');
      }
// ------- END TARGET BLURB SLIDER AND CURRENT SLIDE -------

    }

    if (this.enableSliderLooping) return;

    if (this.isSlideVisible(this.sliderItemsToShow[0]) && this.slider.scrollLeft === 0) {
      this.prevButton.setAttribute('disabled', 'disabled');
    } else {
      this.prevButton.removeAttribute('disabled');
    }

    if (this.isSlideVisible(this.sliderItemsToShow[this.sliderItemsToShow.length - 1])) {
      this.nextButton.setAttribute('disabled', 'disabled');
    } else {
      this.nextButton.removeAttribute('disabled');
    }
  }

  isSlideVisible(element, offset = 0) {
    const lastVisibleSlide = this.slider.clientWidth + this.slider.scrollLeft - offset;
    return element.offsetLeft + element.clientWidth <= lastVisibleSlide && element.offsetLeft >= this.slider.scrollLeft;
  }

  onButtonClick(event) {
    event.preventDefault();
    const step = event.currentTarget.dataset.step || 1;
    this.slideScrollPosition =
      event.currentTarget.name === 'next'
        ? this.slider.scrollLeft + step * this.sliderItemOffset
        : this.slider.scrollLeft - step * this.sliderItemOffset;
    this.setSlidePosition(this.slideScrollPosition);
  }

  setSlidePosition(position) {
    this.slider.scrollTo({
      left: position,
    });
  }

// ------- START NEW FUNCTION FOR PAGINATION DOTS -------
  goToSlide(index) {
  const slides = this.slider.querySelectorAll('.slider__slide');
  const targetSlide = slides[index];

  if (targetSlide) {
    const scrollPosition = targetSlide.offsetLeft;
    this.slider.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });
  }
}
// ------- END NEW FUNCTION FOR PAGINATION DOTS -------

}

customElements.define('slider-component', SliderComponent);

class SlideshowComponent extends SliderComponent {
  constructor() {
    super();
    this.sliderControlWrapper = this.querySelector('.slider-buttons');
    this.enableSliderLooping = true;

    if (!this.sliderControlWrapper) return;

    this.sliderFirstItemNode = this.slider.querySelector('.slideshow__slide');
    if (this.sliderItemsToShow.length > 0) this.currentPage = 1;

    this.announcementBarSlider = this.querySelector('.announcement-bar-slider');
    // Value below should match --duration-announcement-bar CSS value
    this.announcerBarAnimationDelay = this.announcementBarSlider ? 250 : 0;

    this.sliderControlLinksArray = Array.from(this.sliderControlWrapper.querySelectorAll('.slider-counter__link'));
    this.sliderControlLinksArray.forEach((link) => link.addEventListener('click', this.linkToSlide.bind(this)));
    this.slider.addEventListener('scroll', this.setSlideVisibility.bind(this));
    this.setSlideVisibility();

    if (this.announcementBarSlider) {
      this.announcementBarArrowButtonWasClicked = false;

      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion.addEventListener('change', () => {
        if (this.slider.getAttribute('data-autoplay') === 'true') this.setAutoPlay();
      });

      [this.prevButton, this.nextButton].forEach((button) => {
        button.addEventListener(
          'click',
          () => {
            this.announcementBarArrowButtonWasClicked = true;
          },
          { once: true }
        );
      });
    }

    if (this.slider.getAttribute('data-autoplay') === 'true') this.setAutoPlay();
  }

  setAutoPlay() {
    this.autoplaySpeed = this.slider.dataset.speed * 1000;
    this.addEventListener('mouseover', this.focusInHandling.bind(this));
    this.addEventListener('mouseleave', this.focusOutHandling.bind(this));
    this.addEventListener('focusin', this.focusInHandling.bind(this));
    this.addEventListener('focusout', this.focusOutHandling.bind(this));

    if (this.querySelector('.slideshow__autoplay')) {
      this.sliderAutoplayButton = this.querySelector('.slideshow__autoplay');
      this.sliderAutoplayButton.addEventListener('click', this.autoPlayToggle.bind(this));
      this.autoplayButtonIsSetToPlay = true;
      this.play();
    } else {
      this.reducedMotion.matches || this.announcementBarArrowButtonWasClicked ? this.pause() : this.play();
    }
  }

  onButtonClick(event) {
    super.onButtonClick(event);
    this.wasClicked = true;

    const isFirstSlide = this.currentPage === 1;
    const isLastSlide = this.currentPage === this.sliderItemsToShow.length;

    if (!isFirstSlide && !isLastSlide) {
      this.applyAnimationToAnnouncementBar(event.currentTarget.name);
      return;
    }

    if (isFirstSlide && event.currentTarget.name === 'previous') {
      this.slideScrollPosition =
        this.slider.scrollLeft + this.sliderFirstItemNode.clientWidth * this.sliderItemsToShow.length;
    } else if (isLastSlide && event.currentTarget.name === 'next') {
      this.slideScrollPosition = 0;
    }

    this.setSlidePosition(this.slideScrollPosition);

    this.applyAnimationToAnnouncementBar(event.currentTarget.name);
  }

  setSlidePosition(position) {
    if (this.setPositionTimeout) clearTimeout(this.setPositionTimeout);
    this.setPositionTimeout = setTimeout(() => {
      this.slider.scrollTo({
        left: position,
      });
    }, this.announcerBarAnimationDelay);
  }

  update() {
    super.update();
    this.sliderControlButtons = this.querySelectorAll('.slider-counter__link');
    this.prevButton.removeAttribute('disabled');

    if (!this.sliderControlButtons.length) return;

    this.sliderControlButtons.forEach((link) => {
      link.classList.remove('slider-counter__link--active');
      link.removeAttribute('aria-current');
    });
    this.sliderControlButtons[this.currentPage - 1].classList.add('slider-counter__link--active');
    this.sliderControlButtons[this.currentPage - 1].setAttribute('aria-current', true);
  }

  autoPlayToggle() {
    this.togglePlayButtonState(this.autoplayButtonIsSetToPlay);
    this.autoplayButtonIsSetToPlay ? this.pause() : this.play();
    this.autoplayButtonIsSetToPlay = !this.autoplayButtonIsSetToPlay;
  }

  focusOutHandling(event) {
    if (this.sliderAutoplayButton) {
      const focusedOnAutoplayButton =
        event.target === this.sliderAutoplayButton || this.sliderAutoplayButton.contains(event.target);
      if (!this.autoplayButtonIsSetToPlay || focusedOnAutoplayButton) return;
      this.play();
    } else if (!this.reducedMotion.matches && !this.announcementBarArrowButtonWasClicked) {
      this.play();
    }
  }

  focusInHandling(event) {
    if (this.sliderAutoplayButton) {
      const focusedOnAutoplayButton =
        event.target === this.sliderAutoplayButton || this.sliderAutoplayButton.contains(event.target);
      if (focusedOnAutoplayButton && this.autoplayButtonIsSetToPlay) {
        this.play();
      } else if (this.autoplayButtonIsSetToPlay) {
        this.pause();
      }
    } else if (this.announcementBarSlider.contains(event.target)) {
      this.pause();
    }
  }

  play() {
    this.slider.setAttribute('aria-live', 'off');
    clearInterval(this.autoplay);
    this.autoplay = setInterval(this.autoRotateSlides.bind(this), this.autoplaySpeed);
  }

  pause() {
    this.slider.setAttribute('aria-live', 'polite');
    clearInterval(this.autoplay);
  }

  togglePlayButtonState(pauseAutoplay) {
    if (pauseAutoplay) {
      this.sliderAutoplayButton.classList.add('slideshow__autoplay--paused');
      this.sliderAutoplayButton.setAttribute('aria-label', window.accessibilityStrings.playSlideshow);
    } else {
      this.sliderAutoplayButton.classList.remove('slideshow__autoplay--paused');
      this.sliderAutoplayButton.setAttribute('aria-label', window.accessibilityStrings.pauseSlideshow);
    }
  }

  autoRotateSlides() {
    const slideScrollPosition =
      this.currentPage === this.sliderItems.length ? 0 : this.slider.scrollLeft + this.sliderItemOffset;

    this.setSlidePosition(slideScrollPosition);
    this.applyAnimationToAnnouncementBar();
  }

  setSlideVisibility(event) {
    this.sliderItemsToShow.forEach((item, index) => {
      const linkElements = item.querySelectorAll('a');
      if (index === this.currentPage - 1) {
        if (linkElements.length)
          linkElements.forEach((button) => {
            button.removeAttribute('tabindex');
          });
        item.setAttribute('aria-hidden', 'false');
        item.removeAttribute('tabindex');
      } else {
        if (linkElements.length)
          linkElements.forEach((button) => {
            button.setAttribute('tabindex', '-1');
          });
        item.setAttribute('aria-hidden', 'true');
        item.setAttribute('tabindex', '-1');
      }
    });
    this.wasClicked = false;
  }

  applyAnimationToAnnouncementBar(button = 'next') {
    if (!this.announcementBarSlider) return;

    const itemsCount = this.sliderItems.length;
    const increment = button === 'next' ? 1 : -1;

    const currentIndex = this.currentPage - 1;
    let nextIndex = (currentIndex + increment) % itemsCount;
    nextIndex = nextIndex === -1 ? itemsCount - 1 : nextIndex;

    const nextSlide = this.sliderItems[nextIndex];
    const currentSlide = this.sliderItems[currentIndex];

    const animationClassIn = 'announcement-bar-slider--fade-in';
    const animationClassOut = 'announcement-bar-slider--fade-out';

    const isFirstSlide = currentIndex === 0;
    const isLastSlide = currentIndex === itemsCount - 1;

    const shouldMoveNext = (button === 'next' && !isLastSlide) || (button === 'previous' && isFirstSlide);
    const direction = shouldMoveNext ? 'next' : 'previous';

    currentSlide.classList.add(`${animationClassOut}-${direction}`);
    nextSlide.classList.add(`${animationClassIn}-${direction}`);

    setTimeout(() => {
      currentSlide.classList.remove(`${animationClassOut}-${direction}`);
      nextSlide.classList.remove(`${animationClassIn}-${direction}`);
    }, this.announcerBarAnimationDelay * 2);
  }

  linkToSlide(event) {
    event.preventDefault();
    const slideScrollPosition =
      this.slider.scrollLeft +
      this.sliderFirstItemNode.clientWidth *
        (this.sliderControlLinksArray.indexOf(event.currentTarget) + 1 - this.currentPage);
    this.slider.scrollTo({
      left: slideScrollPosition,
    });
  }
}

customElements.define('slideshow-component', SlideshowComponent);

class VariantSelects extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.addEventListener('change', (event) => {
      const target = this.getInputForEventTarget(event.target);
      this.updateSelectionMetadata(event);

      publish(PUB_SUB_EVENTS.optionValueSelectionChange, {
        data: {
          event,
          target,
          selectedOptionValues: this.selectedOptionValues,
        },
      });
    });
  }

  updateSelectionMetadata({ target }) {
    const { value, tagName } = target;

    if (tagName === 'SELECT' && target.selectedOptions.length) {
      Array.from(target.options)
        .find((option) => option.getAttribute('selected'))
        .removeAttribute('selected');
      target.selectedOptions[0].setAttribute('selected', 'selected');

      const swatchValue = target.selectedOptions[0].dataset.optionSwatchValue;
      
      const selectedDropdownSwatchValue = target
        .closest('.product-form__input')
        .querySelector('[data-selected-value] > .swatch');
      if (!selectedDropdownSwatchValue) return;
      if (swatchValue) {
        selectedDropdownSwatchValue.style.setProperty('--swatch--background', swatchValue);
        selectedDropdownSwatchValue.classList.remove('swatch--unavailable');
      } else {
        selectedDropdownSwatchValue.style.setProperty('--swatch--background', 'unset');
        selectedDropdownSwatchValue.classList.add('swatch--unavailable');
      }

      selectedDropdownSwatchValue.style.setProperty(
        '--swatch-focal-point',
        target.selectedOptions[0].dataset.optionSwatchFocalPoint || 'unset'
      );
    } else if (tagName === 'INPUT' && target.type === 'radio') {
      const selectedSwatchValue = target.closest(`.product-form__input`).querySelector('[data-selected-value]');
      if (selectedSwatchValue) selectedSwatchValue.innerHTML = value;
    }
  }

  getInputForEventTarget(target) {
    return target.tagName === 'SELECT' ? target.selectedOptions[0] : target;
  }

  get selectedOptionValues() {
    return Array.from(this.querySelectorAll('select option[selected], fieldset input:checked')).map(
      ({ dataset }) => dataset.optionValueId
    );
  }
}

customElements.define('variant-selects', VariantSelects);

class ProductRecommendations extends HTMLElement {
  observer = undefined;

  constructor() {
    super();
  }

  connectedCallback() {
    this.initializeRecommendations(this.dataset.productId);
  }

  initializeRecommendations(productId) {
    this.observer?.unobserve(this);
    this.observer = new IntersectionObserver(
      (entries, observer) => {
        if (!entries[0].isIntersecting) return;
        observer.unobserve(this);
        this.loadRecommendations(productId);
      },
      { rootMargin: '0px 0px 400px 0px' }
    );
    this.observer.observe(this);
  }

  loadRecommendations(productId) {
    fetch(`${this.dataset.url}&product_id=${productId}&section_id=${this.dataset.sectionId}`)
      .then((response) => response.text())
      .then((text) => {
        const html = document.createElement('div');
        html.innerHTML = text;
        const recommendations = html.querySelector('product-recommendations');

        if (recommendations?.innerHTML.trim().length) {
          this.innerHTML = recommendations.innerHTML;
        }

        if (!this.querySelector('slideshow-component') && this.classList.contains('complementary-products')) {
          this.remove();
        }

        if (html.querySelector('.grid__item')) {
          this.classList.add('product-recommendations--loaded');
        }
      })
      .catch((e) => {
        console.error(e);
      });
  }
}

customElements.define('product-recommendations', ProductRecommendations);

class AccountIcon extends HTMLElement {
  constructor() {
    super();

    this.icon = this.querySelector('.icon');
  }

  connectedCallback() {
    document.addEventListener('storefront:signincompleted', this.handleStorefrontSignInCompleted.bind(this));
  }

  handleStorefrontSignInCompleted(event) {
    if (event?.detail?.avatar) {
      this.icon?.replaceWith(event.detail.avatar.cloneNode());
    }
  }
}

customElements.define('account-icon', AccountIcon);

class BulkAdd extends HTMLElement {
  constructor() {
    super();
    this.queue = [];
    this.requestStarted = false;
    this.ids = [];
  }

  startQueue(id, quantity) {
    this.queue.push({ id, quantity });
    const interval = setInterval(() => {
      if (this.queue.length > 0) {
        if (!this.requestStarted) {
          this.sendRequest(this.queue);
        }
      } else {
        clearInterval(interval);
      }
    }, 250);
  }

  sendRequest(queue) {
    this.requestStarted = true;
    const items = {};
    queue.forEach((queueItem) => {
      items[parseInt(queueItem.id)] = queueItem.quantity;
    });
    this.queue = this.queue.filter((queueElement) => !queue.includes(queueElement));
    const quickBulkElement = this.closest('quick-order-list') || this.closest('quick-add-bulk');
    quickBulkElement.updateMultipleQty(items);
  }

  resetQuantityInput(id) {
    const input = this.querySelector(`#Quantity-${id}`);
    input.value = input.getAttribute('value');
    this.isEnterPressed = false;
  }

  setValidity(event, index, message) {
    event.target.setCustomValidity(message);
    event.target.reportValidity();
    this.resetQuantityInput(index);
    event.target.select();
  }

  validateQuantity(event) {
    const inputValue = parseInt(event.target.value);
    const index = event.target.dataset.index;

    if (inputValue < event.target.dataset.min) {
      this.setValidity(event, index, window.quickOrderListStrings.min_error.replace('[min]', event.target.dataset.min));
    } else if (inputValue > parseInt(event.target.max)) {
      this.setValidity(event, index, window.quickOrderListStrings.max_error.replace('[max]', event.target.max));
    } else if (inputValue % parseInt(event.target.step) != 0) {
      this.setValidity(event, index, window.quickOrderListStrings.step_error.replace('[step]', event.target.step));
    } else {
      event.target.setCustomValidity('');
      event.target.reportValidity();
      this.startQueue(index, inputValue);
    }
  }

  getSectionsUrl() {
    if (window.pageNumber) {
      return `${window.location.pathname}?page=${window.pageNumber}`;
    } else {
      return `${window.location.pathname}`;
    }
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }
}

if (!customElements.get('bulk-add')) {
  customElements.define('bulk-add', BulkAdd);
}


// ------------------ ***************** START MY FORMULA MODAL SCRIPT ***************** ------------------
document.addEventListener('DOMContentLoaded', () => {

$('#ModalForm-ingredient_1, #ModalForm-ingredient_2, #ModalForm-ingredient_3, #ModalForm-ingredient_4, #ModalForm-ingredient_5, #ModalForm-ingredient_6, #ModalForm-ingredient_7').on('blur', function() {
  // $(this).next().next().hide();
  $(this).next().next().trigger('change');
});
$('#ModalForm-ingredient_1, #ModalForm-ingredient_2, #ModalForm-ingredient_3, #ModalForm-ingredient_4, #ModalForm-ingredient_5, #ModalForm-ingredient_6, #ModalForm-ingredient_7').on('click', function() {
    $(this).next().next().show();
  });

function containsPercentage(str) {
  const regex = /\d+(\.\d+)?%/; 
  return str.match(regex) !== null;
}


// ------- START GET PRODUCT FROM DROPDOWN SELECT INGREDIENT 1 ---------
    var productDropdown = document.getElementById('all_products_dropdown_1');
    productDropdown.addEventListener('change', () => {
      function_product_1();
    });
    function function_product_1(){
        //alert('changed/ing...');
        var productDropdown_1 = document.getElementById('all_products_dropdown_1');
        var selectedProduct_1 = productDropdown_1.value;
        if(selectedProduct_1 != ""){
            $("#clear_ingredient_1").removeClass('hide_element');
            var formula_size = $('input[name="contact[Formula Size]"]:checked').val();
            var product_name = $('#all_products_dropdown_1 option:checked').attr('data-variant-name').trim();
            var product_price = $('#all_products_dropdown_1 option:checked').attr('data-price');
            var product_weight = $('#all_products_dropdown_1 option:checked').attr('data-weight');
            var product_price_per_gram = $('#all_products_dropdown_1 option:checked').attr('data-price_pg');
            var percentDropdown_1A = document.getElementById('mw_formula_percentDropdown_1');
            var selectedPercentageA = parseFloat(percentDropdown_1A.value); // Get selected percentage as a decimal
            if (selectedPercentageA > 0){
              product_name = product_name + " | " + selectedPercentageA + "%";
            }
            $('#ModalForm-ingredient_1').val(product_name);

            if (formula_size) {
              var edit_size = formula_size.match(/\d+(\.\d+)?/g); 
              if(edit_size == 1){
                edit_size = 1000;
              }
              // console.log("Selected Tub Size: ", edit_size);
            } else {
              console.log("No product size selected.");
              $("#form_help").fadeIn();
              $("#form_help").removeClass('form_help_hide');
              $("#form_help").html('Please select a product size');
              $(".mw_formula_radio_btns").addClass('flash_me');
              setTimeout(function(){
                  $("#form_help").addClass('form_help_hide');
                  $("#form_help").fadeOut();
                  setTimeout(function(){
                    $("#form_help").removeClass('form_help_hide');
                  }, 1500);
              }, 5000);
              setTimeout(function(){
                $(".mw_formula_radio_btns").removeClass('flash_me');
              }, 6500);
            }
            console.log("Variant Price 1: " + product_price);
            console.log("Variant Weight 1: " + product_weight);
            console.log("Selected Percent 1: " + selectedPercentageA);
            console.log("Tub Size Chosen (g) 1: " + edit_size);
            console.log("Variant Price 1 p/g: " + product_price_per_gram);
            var new_price = (selectedPercentageA/100 * (edit_size)) * product_price_per_gram ;
            console.log("Price 1 so far: R" + new_price.toFixed(2) );
            function_1();
      } 
    }
// ------- START GET PRODUCT FROM DROPDOWN SELECT INGREDIENT 1  ---------

// ------- START GET INGREDIENT 1 VALUES FROM PERCENT DROPDOWN SELECT ---------
function function_1(){
    console.log("Starting function_1...");
    var valueInput_1 = document.getElementById('valueInput_1');
    var mainInput_1 = document.getElementById('ModalForm-ingredient_1');
    var percentDropdown_1 = document.getElementById('mw_formula_percentDropdown_1');
    var productDropdown_1a = document.getElementById('all_products_dropdown_1');
    var selectedProduct_1a = productDropdown_1a.value;
    //alert(selectedProduct_1a);
    var mainInput_1_value = mainInput_1.value;
    var selectedPercentage = parseFloat(percentDropdown_1.value); // Get selected percentage as a decimal
    valueInput_1.value = selectedPercentage;
    var product_weight = $('#all_products_dropdown_1 option:checked').attr('data-weight');
    var product_price_per_gram = $('#all_products_dropdown_1 option:checked').attr('data-price_pg');
    var formula_size = $('input[name="contact[Formula Size]"]:checked').val();
    if (formula_size) {
        var edit_size = formula_size.match(/\d+(\.\d+)?/g); 
        if(edit_size == 1){
          edit_size = 1000;
        }
        // console.log("Selected Tub Size: ", edit_size);
    } else {
        var edit_size = ""; 
    }

    if(mainInput_1_value == "") {
          //alert('Please enter the ingredient first.');
          mainInput_1.value = "Enter ingredient first...";
          $('#mw_formula_percentDropdown_1 option:first-child').prop('selected', true);
          $('#all_products_dropdown_1 option:first-child').prop('selected', true);
          $(valueInput_1).val("");
          mainInput_1.value = "";
          valueInput_1.value = "";
          selectedProduct_1a.value = "";
          $(".form_help").html("");
          $("#valueInput_1_price").val("");
          $("#valueInput_1_weight").val("");
          calculate_totals();
    } else {
        if (containsPercentage(mainInput_1_value)) {
          console.log("The string contains a percentage number.");
          var originalString_1 = mainInput_1.value;
          var stripString_1 = originalString_1.replace(/\|/g, '');
          var newString1 = stripString_1.replace(/\s*\d+(?:\.\d+)?%/g, ' | ' + selectedPercentage + '%');
          mainInput_1.value = newString1;
          
          //$("#mw_formula_percentDropdown_1").hide();
          // You can add further logic here, e.g., display a message
        } else {
          console.log("The string does not contain a percentage number.");
          var stripString_1 = mainInput_1_value.replace(/\|/g, '');
          if(selectedPercentage == 0){
            //alert('Its zero...');
            mainInput_1.value = stripString_1;
            //$("#mw_formula_percentDropdown_7").hide();
          } else {
            mainInput_1.value = stripString_1 + " | " + selectedPercentage + '%';
           // $("#mw_formula_percentDropdown_1").hide();
          }

        }
        console.log("Product selected: " + mainInput_1_value);
        console.log("Selected percent: " + selectedPercentage);
        console.log("Product Weight: " + product_weight);
        console.log("Tub Size Chosen (g): " + edit_size);
        console.log("Variant Price p/g: " + product_price_per_gram);
        var current_weight = selectedPercentage/100 * (edit_size);
        var new_price = current_weight * product_price_per_gram ;
        $("#valueInput_1_price").val(new_price.toFixed(2));
        $("#valueInput_1_weight").val(current_weight);
        console.log("Price so far: R" + new_price.toFixed(2) );
        calculate_totals();
    }
}
var percentDropdownUse_1 = document.getElementById('mw_formula_percentDropdown_1');
percentDropdownUse_1.addEventListener('change', () => {
  function_1();
});
var mainInputUse_1 = document.getElementById('ModalForm-ingredient_1');
mainInputUse_1.addEventListener('change', () => {
  function_1();
}); 
// ------- END GET INGREDIENT 1 VALUES FROM PERCENT DROPDOWN SELECT ---------



// ------- START GET PRODUCT FROM DROPDOWN SELECT INGREDIENT 2 ---------
  var productDropdown = document.getElementById('all_products_dropdown_2');
    productDropdown.addEventListener('change', () => {
      function_product_2();
    });
    function function_product_2(){
      //alert('changed/ing...');
      var productDropdown_1 = document.getElementById('all_products_dropdown_2');
      var selectedProduct_1 = productDropdown_1.value;
      if(selectedProduct_1 != ""){
            $("#clear_ingredient_2").removeClass('hide_element');
            var formula_size = $('input[name="contact[Formula Size]"]:checked').val();
            var product_name = $('#all_products_dropdown_2 option:checked').attr('data-variant-name').trim();
            var product_price = $('#all_products_dropdown_2 option:checked').attr('data-price');
            var product_weight = $('#all_products_dropdown_2 option:checked').attr('data-weight');
            var product_price_per_gram = $('#all_products_dropdown_2 option:checked').attr('data-price_pg');
            var percentDropdown_1A = document.getElementById('mw_formula_percentDropdown_2');
            var selectedPercentageA = parseFloat(percentDropdown_1A.value); // Get selected percentage as a decimal
            if (selectedPercentageA > 0){
              product_name = product_name + " | " + selectedPercentageA + "%";
            }
            $('#ModalForm-ingredient_2').val(product_name);

            if (formula_size) {
              var edit_size = formula_size.match(/\d+(\.\d+)?/g); 
              if(edit_size == 1){
                edit_size = 1000;
              }
              // console.log("Selected Tub Size: ", edit_size);
            } else {
              console.log("No product size selected.");
              $("#form_help").fadeIn();
              $("#form_help").removeClass('form_help_hide');
              $("#form_help").html('Please select a product size');
              $(".mw_formula_radio_btns").addClass('flash_me');
              setTimeout(function(){
                  $("#form_help").addClass('form_help_hide');
                  $("#form_help").fadeOut();
                  setTimeout(function(){
                    $("#form_help").removeClass('form_help_hide');
                  }, 1500);
              }, 5000);
              setTimeout(function(){
                $(".mw_formula_radio_btns").removeClass('flash_me');
              }, 6500);
            }
            console.log("Variant Price 2: " + product_price);
            console.log("Variant Weight 2: " + product_weight);
            console.log("Selected Percent 2: " + selectedPercentageA);
            console.log("Tub Size Chosen (g) 2: " + edit_size);
            console.log("Variant Price 2 p/g: " + product_price_per_gram);
            var new_price = (selectedPercentageA/100 * (edit_size)) * product_price_per_gram ;
            console.log("Price 2 so far: R" + new_price.toFixed(2) );
            function_2();
      }
    }
// ------- START GET PRODUCT FROM DROPDOWN SELECT INGREDIENT 2  ---------

// ------- START GET INGREDIENT 2 VALUES FROM PERCENT DROPDOWN SELECT ---------
function function_2(){
    console.log("Starting function_2...");
    var valueInput_1 = document.getElementById('valueInput_2');
    var mainInput_1 = document.getElementById('ModalForm-ingredient_2');
    var percentDropdown_1 = document.getElementById('mw_formula_percentDropdown_2');
    var productDropdown_1a = document.getElementById('all_products_dropdown_2');
    var selectedProduct_1a = productDropdown_1a.value;
    //alert(selectedProduct_1a);
    var mainInput_1_value = mainInput_1.value;
    var selectedPercentage = parseFloat(percentDropdown_1.value); // Get selected percentage as a decimal
    valueInput_1.value = selectedPercentage;
    var product_weight = $('#all_products_dropdown_2 option:checked').attr('data-weight');
    var product_price_per_gram = $('#all_products_dropdown_2 option:checked').attr('data-price_pg');
    var formula_size = $('input[name="contact[Formula Size]"]:checked').val();
    if (formula_size) {
        var edit_size = formula_size.match(/\d+(\.\d+)?/g); 
        if(edit_size == 1){
          edit_size = 1000;
        }
        // console.log("Selected Tub Size: ", edit_size);
    } else {
        var edit_size = ""; 
    }

    if(mainInput_1_value == "") {
          console.log('Please enter the Ingredient 2 first.');
          mainInput_1.value = "Enter ingredient first...";
          $('#mw_formula_percentDropdown_2 option:first-child').prop('selected', true);
          $('#all_products_dropdown_2 option:first-child').prop('selected', true);
          $(valueInput_1).val("");
          mainInput_1.value = "";
          valueInput_1.value = "";
          selectedProduct_1a.value = "";
          $(".form_help").html("");
          $("#valueInput_2_price").val("");
          $("#valueInput_2_weight").val("");
          calculate_totals();
    } else {
        if (containsPercentage(mainInput_1_value)) {
          console.log("The string contains a percentage number.");
          var originalString_1 = mainInput_1.value;
          var stripString_1 = originalString_1.replace(/\|/g, '');
          var newString1 = stripString_1.replace(/\s*\d+(?:\.\d+)?%/g, ' | ' + selectedPercentage + '%');
          mainInput_1.value = newString1;
          
          //$("#mw_formula_percentDropdown_1").hide();
          // You can add further logic here, e.g., display a message
        } else {
          console.log("The string does not contain a percentage number.");
          var stripString_1 = mainInput_1_value.replace(/\|/g, '');
          if(selectedPercentage == 0){
            //alert('Its zero...');
            mainInput_1.value = stripString_1;
            //$("#mw_formula_percentDropdown_7").hide();
          } else {
            mainInput_1.value = stripString_1 + " | " + selectedPercentage + '%';
           // $("#mw_formula_percentDropdown_1").hide();
          }

        }
        console.log("Product selected 2: " + mainInput_1_value);
        console.log("Selected percent 2: " + selectedPercentage);
        console.log("Product Weight 2: " + product_weight);
        console.log("Tub Size Chosen (g) 2: " + edit_size);
        console.log("Variant Price p/g 2: " + product_price_per_gram);
        var current_weight = selectedPercentage/100 * (edit_size);
        var new_price = current_weight * product_price_per_gram ;
        $("#valueInput_2_price").val(new_price.toFixed(2));
        $("#valueInput_2_weight").val(current_weight);
        console.log("Price so far 2: R" + new_price.toFixed(2) );
        calculate_totals();
    }
}
var percentDropdownUse_1 = document.getElementById('mw_formula_percentDropdown_2');
percentDropdownUse_1.addEventListener('change', () => {
  function_2();
});
var mainInputUse_1 = document.getElementById('ModalForm-ingredient_2');
mainInputUse_1.addEventListener('change', () => {
  function_2();
}); 
// ------- END GET INGREDIENT 2 VALUES FROM PERCENT DROPDOWN SELECT ---------


// ------- START GET PRODUCT FROM DROPDOWN SELECT INGREDIENT 3 ---------
  var productDropdown = document.getElementById('all_products_dropdown_3');
    productDropdown.addEventListener('change', () => {
      function_product_3();
    });
    function function_product_3(){
      //alert('changed/ing...');
      var productDropdown_1 = document.getElementById('all_products_dropdown_3');
      var selectedProduct_1 = productDropdown_1.value;
      if(selectedProduct_1 != ""){
            $("#clear_ingredient_3").removeClass('hide_element');
            var formula_size = $('input[name="contact[Formula Size]"]:checked').val();
            var product_name = $('#all_products_dropdown_3 option:checked').attr('data-variant-name').trim();
            var product_price = $('#all_products_dropdown_3 option:checked').attr('data-price');
            var product_weight = $('#all_products_dropdown_3 option:checked').attr('data-weight');
            var product_price_per_gram = $('#all_products_dropdown_3 option:checked').attr('data-price_pg');
            var percentDropdown_1A = document.getElementById('mw_formula_percentDropdown_3');
            var selectedPercentageA = parseFloat(percentDropdown_1A.value); // Get selected percentage as a decimal
            if (selectedPercentageA > 0){
              product_name = product_name + " | " + selectedPercentageA + "%";
            }
            $('#ModalForm-ingredient_3').val(product_name);

            if (formula_size) {
              var edit_size = formula_size.match(/\d+(\.\d+)?/g); 
              if(edit_size == 1){
                edit_size = 1000;
              }
              // console.log("Selected Tub Size: ", edit_size);
            } else {
              console.log("No product size selected.");
              $("#form_help").fadeIn();
              $("#form_help").removeClass('form_help_hide');
              $("#form_help").html('Please select a product size');
              $(".mw_formula_radio_btns").addClass('flash_me');
              setTimeout(function(){
                  $("#form_help").addClass('form_help_hide');
                  $("#form_help").fadeOut();
                  setTimeout(function(){
                    $("#form_help").removeClass('form_help_hide');
                  }, 1500);
              }, 5000);
              setTimeout(function(){
                $(".mw_formula_radio_btns").removeClass('flash_me');
              }, 6500);
            }
            console.log("Variant Price 3: " + product_price);
            console.log("Variant Weight 3: " + product_weight);
            console.log("Selected Percent 3: " + selectedPercentageA);
            console.log("Tub Size Chosen (g) 3: " + edit_size);
            console.log("Variant Price 3 p/g: " + product_price_per_gram);
            var new_price = (selectedPercentageA/100 * (edit_size)) * product_price_per_gram ;
            console.log("Price 3 so far: R" + new_price.toFixed(2) );
            function_3();
      }
    }
// ------- START GET PRODUCT FROM DROPDOWN SELECT INGREDIENT 3  ---------

// ------- START GET INGREDIENT 3 VALUES FROM PERCENT DROPDOWN SELECT ---------
function function_3(){
    console.log("Starting function_3...");
    var valueInput_1 = document.getElementById('valueInput_3');
    var mainInput_1 = document.getElementById('ModalForm-ingredient_3');
    var percentDropdown_1 = document.getElementById('mw_formula_percentDropdown_3');
    var productDropdown_1a = document.getElementById('all_products_dropdown_3');
    var selectedProduct_1a = productDropdown_1a.value;
    //alert(selectedProduct_1a);
    var mainInput_1_value = mainInput_1.value;
    var selectedPercentage = parseFloat(percentDropdown_1.value); // Get selected percentage as a decimal
    valueInput_1.value = selectedPercentage;
    var product_weight = $('#all_products_dropdown_3 option:checked').attr('data-weight');
    var product_price_per_gram = $('#all_products_dropdown_3 option:checked').attr('data-price_pg');
    var formula_size = $('input[name="contact[Formula Size]"]:checked').val();
    if (formula_size) {
        var edit_size = formula_size.match(/\d+(\.\d+)?/g); 
        if(edit_size == 1){
          edit_size = 1000;
        }
        // console.log("Selected Tub Size: ", edit_size);
    } else {
        var edit_size = ""; 
    }

    if(mainInput_1_value == "") {
          console.log('Please enter the Ingredient 3 first.');
          mainInput_1.value = "Enter ingredient 3 first...";
          $('#mw_formula_percentDropdown_3 option:first-child').prop('selected', true);
          $('#all_products_dropdown_3 option:first-child').prop('selected', true);
          $(valueInput_1).val("");
          mainInput_1.value = "";
          valueInput_1.value = "";
          selectedProduct_1a.value = "";
          $(".form_help").html("");
          $("#valueInput_3_price").val("");
          $("#valueInput_3_weight").val("");
          calculate_totals();
    } else {
        if (containsPercentage(mainInput_1_value)) {
          console.log("The string contains a percentage number.");
          var originalString_1 = mainInput_1.value;
          var stripString_1 = originalString_1.replace(/\|/g, '');
          var newString1 = stripString_1.replace(/\s*\d+(?:\.\d+)?%/g, ' | ' + selectedPercentage + '%');
          mainInput_1.value = newString1;
          
          //$("#mw_formula_percentDropdown_1").hide();
          // You can add further logic here, e.g., display a message
        } else {
          console.log("The string 3 does not contain a percentage number.");
          var stripString_1 = mainInput_1_value.replace(/\|/g, '');
          if(selectedPercentage == 0){
            //alert('Its zero...');
            mainInput_1.value = stripString_1;
            //$("#mw_formula_percentDropdown_7").hide();
          } else {
            mainInput_1.value = stripString_1 + " | " + selectedPercentage + '%';
           // $("#mw_formula_percentDropdown_1").hide();
          }

        }
        console.log("Product selected 3: " + mainInput_1_value);
        console.log("Selected percent 3: " + selectedPercentage);
        console.log("Product Weight 3: " + product_weight);
        console.log("Tub Size Chosen (g) 3: " + edit_size);
        console.log("Variant Price p/g 3: " + product_price_per_gram);
        var current_weight = selectedPercentage/100 * (edit_size);
        var new_price = current_weight * product_price_per_gram ;
        $("#valueInput_3_price").val(new_price.toFixed(2));
        $("#valueInput_3_weight").val(current_weight);
        console.log("Price so far 3: R" + new_price.toFixed(2) );
        calculate_totals();
    }
}
var percentDropdownUse_1 = document.getElementById('mw_formula_percentDropdown_3');
percentDropdownUse_1.addEventListener('change', () => {
  function_3();
});
var mainInputUse_1 = document.getElementById('ModalForm-ingredient_3');
mainInputUse_1.addEventListener('change', () => {
  function_3();
}); 
// ------- END GET INGREDIENT 3 VALUES FROM PERCENT DROPDOWN SELECT ---------


// ------- START GET PRODUCT FROM DROPDOWN SELECT INGREDIENT 4 ---------
  var productDropdown = document.getElementById('all_products_dropdown_4');
    productDropdown.addEventListener('change', () => {
      function_product_4();
    });
    function function_product_4(){
      //alert('changed/ing...');
      var productDropdown_1 = document.getElementById('all_products_dropdown_4');
      var selectedProduct_1 = productDropdown_1.value;
      if(selectedProduct_1 != ""){
            $("#clear_ingredient_4").removeClass('hide_element');
            var formula_size = $('input[name="contact[Formula Size]"]:checked').val();
            var product_name = $('#all_products_dropdown_4 option:checked').attr('data-variant-name').trim();
            var product_price = $('#all_products_dropdown_4 option:checked').attr('data-price');
            var product_weight = $('#all_products_dropdown_4 option:checked').attr('data-weight');
            var product_price_per_gram = $('#all_products_dropdown_4 option:checked').attr('data-price_pg');
            var percentDropdown_1A = document.getElementById('mw_formula_percentDropdown_4');
            var selectedPercentageA = parseFloat(percentDropdown_1A.value); // Get selected percentage as a decimal
            if (selectedPercentageA > 0){
              product_name = product_name + " | " + selectedPercentageA + "%";
            }
            $('#ModalForm-ingredient_4').val(product_name);

            if (formula_size) {
              var edit_size = formula_size.match(/\d+(\.\d+)?/g); 
              if(edit_size == 1){
                edit_size = 1000;
              }
              // console.log("Selected Tub Size: ", edit_size);
            } else {
              console.log("No product size selected.");
              $("#form_help").fadeIn();
              $("#form_help").removeClass('form_help_hide');
              $("#form_help").html('Please select a product size');
              $(".mw_formula_radio_btns").addClass('flash_me');
              setTimeout(function(){
                  $("#form_help").addClass('form_help_hide');
                  $("#form_help").fadeOut();
                  setTimeout(function(){
                    $("#form_help").removeClass('form_help_hide');
                  }, 1500);
              }, 5000);
              setTimeout(function(){
                $(".mw_formula_radio_btns").removeClass('flash_me');
              }, 6500);
            }
            console.log("Variant Price 4: " + product_price);
            console.log("Variant Weight 4: " + product_weight);
            console.log("Selected Percent 4: " + selectedPercentageA);
            console.log("Tub Size Chosen (g) 4: " + edit_size);
            console.log("Variant Price 4 p/g: " + product_price_per_gram);
            var new_price = (selectedPercentageA/100 * (edit_size)) * product_price_per_gram ;
            console.log("Price 4 so far: R" + new_price.toFixed(2) );
            function_4();
      }
    }
// ------- START GET PRODUCT FROM DROPDOWN SELECT INGREDIENT 4  ---------

// ------- START GET INGREDIENT 4 VALUES FROM PERCENT DROPDOWN SELECT ---------
function function_4(){
    console.log("Starting function_4...");
    var valueInput_1 = document.getElementById('valueInput_4');
    var mainInput_1 = document.getElementById('ModalForm-ingredient_4');
    var percentDropdown_1 = document.getElementById('mw_formula_percentDropdown_4');
    var productDropdown_1a = document.getElementById('all_products_dropdown_4');
    var selectedProduct_1a = productDropdown_1a.value;
    //alert(selectedProduct_1a);
    var mainInput_1_value = mainInput_1.value;
    var selectedPercentage = parseFloat(percentDropdown_1.value); // Get selected percentage as a decimal
    valueInput_1.value = selectedPercentage;
    var product_weight = $('#all_products_dropdown_4 option:checked').attr('data-weight');
    var product_price_per_gram = $('#all_products_dropdown_4 option:checked').attr('data-price_pg');
    var formula_size = $('input[name="contact[Formula Size]"]:checked').val();
    if (formula_size) {
        var edit_size = formula_size.match(/\d+(\.\d+)?/g); 
        if(edit_size == 1){
          edit_size = 1000;
        }
        // console.log("Selected Tub Size: ", edit_size);
    } else {
        var edit_size = ""; 
    }

    if(mainInput_1_value == "") {
          console.log('Please enter the Ingredient 4 first.');
          mainInput_1.value = "Enter ingredient 4 first...";
          $('#mw_formula_percentDropdown_4 option:first-child').prop('selected', true);
          $('#all_products_dropdown_4 option:first-child').prop('selected', true);
          $(valueInput_1).val("");
          mainInput_1.value = "";
          valueInput_1.value = "";
          selectedProduct_1a.value = "";
          $(".form_help").html("");
          $("#valueInput_4_price").val("");
          $("#valueInput_4_weight").val("");
          calculate_totals();
    } else {
        if (containsPercentage(mainInput_1_value)) {
          console.log("The string contains a percentage number.");
          var originalString_1 = mainInput_1.value;
          var stripString_1 = originalString_1.replace(/\|/g, '');
          var newString1 = stripString_1.replace(/\s*\d+(?:\.\d+)?%/g, ' | ' + selectedPercentage + '%');
          mainInput_1.value = newString1;
          
          //$("#mw_formula_percentDropdown_1").hide();
          // You can add further logic here, e.g., display a message
        } else {
          console.log("The string 4 does not contain a percentage number.");
          var stripString_1 = mainInput_1_value.replace(/\|/g, '');
          if(selectedPercentage == 0){
            //alert('Its zero...');
            mainInput_1.value = stripString_1;
            //$("#mw_formula_percentDropdown_7").hide();
          } else {
            mainInput_1.value = stripString_1 + " | " + selectedPercentage + '%';
           // $("#mw_formula_percentDropdown_1").hide();
          }

        }
        console.log("Product selected 4: " + mainInput_1_value);
        console.log("Selected percent 4: " + selectedPercentage);
        console.log("Product Weight 4: " + product_weight);
        console.log("Tub Size Chosen (g) 4: " + edit_size);
        console.log("Variant Price p/g 4: " + product_price_per_gram);
        var current_weight = selectedPercentage/100 * (edit_size);
        var new_price = current_weight * product_price_per_gram ;
        $("#valueInput_4_price").val(new_price.toFixed(2));
        $("#valueInput_4_weight").val(current_weight);
        console.log("Price so far 4: R" + new_price.toFixed(2) );
        calculate_totals();
    }
}
var percentDropdownUse_1 = document.getElementById('mw_formula_percentDropdown_4');
percentDropdownUse_1.addEventListener('change', () => {
  function_4();
});
var mainInputUse_1 = document.getElementById('ModalForm-ingredient_4');
mainInputUse_1.addEventListener('change', () => {
  function_4();
}); 
// ------- END GET INGREDIENT 4 VALUES FROM PERCENT DROPDOWN SELECT ---------


// ------- START GET PRODUCT FROM DROPDOWN SELECT INGREDIENT 5 ---------
  var productDropdown = document.getElementById('all_products_dropdown_5');
    productDropdown.addEventListener('change', () => {
      function_product_5();
    });
    function function_product_5(){
      //alert('changed/ing...');
      var productDropdown_1 = document.getElementById('all_products_dropdown_5');
      var selectedProduct_1 = productDropdown_1.value;
      if(selectedProduct_1 != ""){
            $("#clear_ingredient_5").removeClass('hide_element');
            var formula_size = $('input[name="contact[Formula Size]"]:checked').val();
            var product_name = $('#all_products_dropdown_5 option:checked').attr('data-variant-name').trim();
            var product_price = $('#all_products_dropdown_5 option:checked').attr('data-price');
            var product_weight = $('#all_products_dropdown_5 option:checked').attr('data-weight');
            var product_price_per_gram = $('#all_products_dropdown_5 option:checked').attr('data-price_pg');
            var percentDropdown_1A = document.getElementById('mw_formula_percentDropdown_5');
            var selectedPercentageA = parseFloat(percentDropdown_1A.value); // Get selected percentage as a decimal
            if (selectedPercentageA > 0){
              product_name = product_name + " | " + selectedPercentageA + "%";
            }
            $('#ModalForm-ingredient_5').val(product_name);

            if (formula_size) {
              var edit_size = formula_size.match(/\d+(\.\d+)?/g); 
              if(edit_size == 1){
                edit_size = 1000;
              }
              // console.log("Selected Tub Size: ", edit_size);
            } else {
              console.log("No product size selected.");
              $("#form_help").fadeIn();
              $("#form_help").removeClass('form_help_hide');
              $("#form_help").html('Please select a product size');
              $(".mw_formula_radio_btns").addClass('flash_me');
              setTimeout(function(){
                  $("#form_help").addClass('form_help_hide');
                  $("#form_help").fadeOut();
                  setTimeout(function(){
                    $("#form_help").removeClass('form_help_hide');
                  }, 1500);
              }, 5000);
              setTimeout(function(){
                $(".mw_formula_radio_btns").removeClass('flash_me');
              }, 6500);
            }
            console.log("Variant Price 5: " + product_price);
            console.log("Variant Weight 5: " + product_weight);
            console.log("Selected Percent 5: " + selectedPercentageA);
            console.log("Tub Size Chosen (g) 5: " + edit_size);
            console.log("Variant Price 5 p/g: " + product_price_per_gram);
            var new_price = (selectedPercentageA/100 * (edit_size)) * product_price_per_gram ;
            console.log("Price 5 so far: R" + new_price.toFixed(2) );
            function_5();
      }
    }
// ------- START GET PRODUCT FROM DROPDOWN SELECT INGREDIENT 5  ---------

// ------- START GET INGREDIENT 5 VALUES FROM PERCENT DROPDOWN SELECT ---------
function function_5(){
    console.log("Starting function_5...");
    var valueInput_1 = document.getElementById('valueInput_5');
    var mainInput_1 = document.getElementById('ModalForm-ingredient_5');
    var percentDropdown_1 = document.getElementById('mw_formula_percentDropdown_5');
    var productDropdown_1a = document.getElementById('all_products_dropdown_5');
    var selectedProduct_1a = productDropdown_1a.value;
    //alert(selectedProduct_1a);
    var mainInput_1_value = mainInput_1.value;
    var selectedPercentage = parseFloat(percentDropdown_1.value); // Get selected percentage as a decimal
    valueInput_1.value = selectedPercentage;
    var product_weight = $('#all_products_dropdown_5 option:checked').attr('data-weight');
    var product_price_per_gram = $('#all_products_dropdown_5 option:checked').attr('data-price_pg');
    var formula_size = $('input[name="contact[Formula Size]"]:checked').val();
    if (formula_size) {
        var edit_size = formula_size.match(/\d+(\.\d+)?/g); 
        if(edit_size == 1){
          edit_size = 1000;
        }
        // console.log("Selected Tub Size: ", edit_size);
    } else {
        var edit_size = ""; 
    }

    if(mainInput_1_value == "") {
          console.log('Please enter the Ingredient 5 first.');
          mainInput_1.value = "Enter ingredient 5 first...";
          $('#mw_formula_percentDropdown_5 option:first-child').prop('selected', true);
          $('#all_products_dropdown_5 option:first-child').prop('selected', true);
          $(valueInput_1).val("");
          mainInput_1.value = "";
          valueInput_1.value = "";
          selectedProduct_1a.value = "";
          $(".form_help").html("");
          $("#valueInput_5_price").val("");
          $("#valueInput_5_weight").val("");
          calculate_totals();
    } else {
        if (containsPercentage(mainInput_1_value)) {
          console.log("The string 5 contains a percentage number.");
          var originalString_1 = mainInput_1.value;
          var stripString_1 = originalString_1.replace(/\|/g, '');
          var newString1 = stripString_1.replace(/\s*\d+(?:\.\d+)?%/g, ' | ' + selectedPercentage + '%');
          mainInput_1.value = newString1;
          
          //$("#mw_formula_percentDropdown_1").hide();
          // You can add further logic here, e.g., display a message
        } else {
          console.log("The string 5 does not contain a percentage number.");
          var stripString_1 = mainInput_1_value.replace(/\|/g, '');
          if(selectedPercentage == 0){
            //alert('Its zero...');
            mainInput_1.value = stripString_1;
            //$("#mw_formula_percentDropdown_7").hide();
          } else {
            mainInput_1.value = stripString_1 + " | " + selectedPercentage + '%';
           // $("#mw_formula_percentDropdown_1").hide();
          }

        }
        console.log("Product selected 5: " + mainInput_1_value);
        console.log("Selected percent 5: " + selectedPercentage);
        console.log("Product Weight 5: " + product_weight);
        console.log("Tub Size Chosen (g) 5: " + edit_size);
        console.log("Variant Price p/g 5: " + product_price_per_gram);
        var current_weight = selectedPercentage/100 * (edit_size);
        var new_price = current_weight * product_price_per_gram ;
        $("#valueInput_5_price").val(new_price.toFixed(2));
        $("#valueInput_5_weight").val(current_weight);
        console.log("Price so far 5: R" + new_price.toFixed(2) );
        calculate_totals();
    }
}
var percentDropdownUse_1 = document.getElementById('mw_formula_percentDropdown_5');
percentDropdownUse_1.addEventListener('change', () => {
  function_5();
});
var mainInputUse_1 = document.getElementById('ModalForm-ingredient_5');
mainInputUse_1.addEventListener('change', () => {
  function_5();
}); 
// ------- END GET INGREDIENT 5 VALUES FROM PERCENT DROPDOWN SELECT ---------


// ------- START GET PRODUCT FROM DROPDOWN SELECT INGREDIENT 6 ---------
  var productDropdown = document.getElementById('all_products_dropdown_6');
    productDropdown.addEventListener('change', () => {
      function_product_6();
    });
    function function_product_6(){
      //alert('changed/ing...');
      var productDropdown_1 = document.getElementById('all_products_dropdown_6');
      var selectedProduct_1 = productDropdown_1.value;
      if(selectedProduct_1 != ""){
            $("#clear_ingredient_6").removeClass('hide_element');
            var formula_size = $('input[name="contact[Formula Size]"]:checked').val();
            var product_name = $('#all_products_dropdown_6 option:checked').attr('data-variant-name').trim();
            var product_price = $('#all_products_dropdown_6 option:checked').attr('data-price');
            var product_weight = $('#all_products_dropdown_6 option:checked').attr('data-weight');
            var product_price_per_gram = $('#all_products_dropdown_6 option:checked').attr('data-price_pg');
            var percentDropdown_1A = document.getElementById('mw_formula_percentDropdown_6');
            var selectedPercentageA = parseFloat(percentDropdown_1A.value); // Get selected percentage as a decimal
            if (selectedPercentageA > 0){
              product_name = product_name + " | " + selectedPercentageA + "%";
            }
            $('#ModalForm-ingredient_6').val(product_name);

            if (formula_size) {
              var edit_size = formula_size.match(/\d+(\.\d+)?/g); 
              if(edit_size == 1){
                edit_size = 1000;
              }
              // console.log("Selected Tub Size: ", edit_size);
            } else {
              console.log("No product size selected.");
              $("#form_help").fadeIn();
              $("#form_help").removeClass('form_help_hide');
              $("#form_help").html('Please select a product size');
              $(".mw_formula_radio_btns").addClass('flash_me');
              setTimeout(function(){
                  $("#form_help").addClass('form_help_hide');
                  $("#form_help").fadeOut();
                  setTimeout(function(){
                    $("#form_help").removeClass('form_help_hide');
                  }, 1500);
              }, 5000);
              setTimeout(function(){
                $(".mw_formula_radio_btns").removeClass('flash_me');
              }, 6500);
            }
            console.log("Variant Price 6: " + product_price);
            console.log("Variant Weight 6: " + product_weight);
            console.log("Selected Percent 6: " + selectedPercentageA);
            console.log("Tub Size Chosen (g) 6: " + edit_size);
            console.log("Variant Price 6 p/g: " + product_price_per_gram);
            var new_price = (selectedPercentageA/100 * (edit_size)) * product_price_per_gram ;
            console.log("Price 6 so far: R" + new_price.toFixed(2) );
            function_6();
      }
    }
// ------- START GET PRODUCT FROM DROPDOWN SELECT INGREDIENT 6  ---------

// ------- START GET INGREDIENT 6 VALUES FROM PERCENT DROPDOWN SELECT ---------
function function_6(){
    console.log("Starting function_6...");
    var valueInput_1 = document.getElementById('valueInput_6');
    var mainInput_1 = document.getElementById('ModalForm-ingredient_6');
    var percentDropdown_1 = document.getElementById('mw_formula_percentDropdown_6');
    var productDropdown_1a = document.getElementById('all_products_dropdown_6');
    var selectedProduct_1a = productDropdown_1a.value;
    //alert(selectedProduct_1a);
    var mainInput_1_value = mainInput_1.value;
    var selectedPercentage = parseFloat(percentDropdown_1.value); // Get selected percentage as a decimal
    valueInput_1.value = selectedPercentage;
    var product_weight = $('#all_products_dropdown_6 option:checked').attr('data-weight');
    var product_price_per_gram = $('#all_products_dropdown_6 option:checked').attr('data-price_pg');
    var formula_size = $('input[name="contact[Formula Size]"]:checked').val();
    if (formula_size) {
        var edit_size = formula_size.match(/\d+(\.\d+)?/g); 
        if(edit_size == 1){
          edit_size = 1000;
        }
        // console.log("Selected Tub Size: ", edit_size);
    } else {
        var edit_size = ""; 
    }

    if(mainInput_1_value == "") {
          console.log('Please enter the Ingredient 6 first.');
          mainInput_1.value = "Enter ingredient 6 first...";
          $('#mw_formula_percentDropdown_6 option:first-child').prop('selected', true);
          $('#all_products_dropdown_6 option:first-child').prop('selected', true);
          $(valueInput_1).val("");
          mainInput_1.value = "";
          valueInput_1.value = "";
          selectedProduct_1a.value = "";
          $(".form_help").html("");
          $("#valueInput_6_price").val("");
          $("#valueInput_6_weight").val("");
          calculate_totals();
    } else {
        if (containsPercentage(mainInput_1_value)) {
          console.log("The string 6 contains a percentage number.");
          var originalString_1 = mainInput_1.value;
          var stripString_1 = originalString_1.replace(/\|/g, '');
          var newString1 = stripString_1.replace(/\s*\d+(?:\.\d+)?%/g, ' | ' + selectedPercentage + '%');
          mainInput_1.value = newString1;
          
          //$("#mw_formula_percentDropdown_1").hide();
          // You can add further logic here, e.g., display a message
        } else {
          console.log("The string 6 does not contain a percentage number.");
          var stripString_1 = mainInput_1_value.replace(/\|/g, '');
          if(selectedPercentage == 0){
            //alert('Its zero...');
            mainInput_1.value = stripString_1;
            //$("#mw_formula_percentDropdown_7").hide();
          } else {
            mainInput_1.value = stripString_1 + " | " + selectedPercentage + '%';
           // $("#mw_formula_percentDropdown_1").hide();
          }

        }
        console.log("Product selected 6: " + mainInput_1_value);
        console.log("Selected percent 6: " + selectedPercentage);
        console.log("Product Weight 6: " + product_weight);
        console.log("Tub Size Chosen (g) 6: " + edit_size);
        console.log("Variant Price p/g 6: " + product_price_per_gram);
        var current_weight = selectedPercentage/100 * (edit_size);
        var new_price = current_weight * product_price_per_gram ;
        $("#valueInput_6_price").val(new_price.toFixed(2));
        $("#valueInput_6_weight").val(current_weight);
        console.log("Price so far 6: R" + new_price.toFixed(2) );
        calculate_totals();
    }
}
var percentDropdownUse_1 = document.getElementById('mw_formula_percentDropdown_6');
percentDropdownUse_1.addEventListener('change', () => {
  function_6();
});
var mainInputUse_1 = document.getElementById('ModalForm-ingredient_6');
mainInputUse_1.addEventListener('change', () => {
  function_6();
}); 
// ------- END GET INGREDIENT 6 VALUES FROM PERCENT DROPDOWN SELECT ---------

// ------- START GET PRODUCT FROM DROPDOWN SELECT INGREDIENT 7 ---------
  var productDropdown = document.getElementById('all_products_dropdown_7');
    productDropdown.addEventListener('change', () => {
      function_product_7();
    });
    function function_product_7(){
      //alert('changed/ing...');
      var productDropdown_1 = document.getElementById('all_products_dropdown_7');
      var selectedProduct_1 = productDropdown_1.value;
      if(selectedProduct_1 != ""){
            $("#clear_ingredient_7").removeClass('hide_element');
            var formula_size = $('input[name="contact[Formula Size]"]:checked').val();
            var product_name = $('#all_products_dropdown_7 option:checked').attr('data-variant-name').trim();
            var product_price = $('#all_products_dropdown_7 option:checked').attr('data-price');
            var product_weight = $('#all_products_dropdown_7 option:checked').attr('data-weight');
            var product_price_per_gram = $('#all_products_dropdown_7 option:checked').attr('data-price_pg');
            var percentDropdown_1A = document.getElementById('mw_formula_percentDropdown_7');
            var selectedPercentageA = parseFloat(percentDropdown_1A.value); // Get selected percentage as a decimal
            if (selectedPercentageA > 0){
              product_name = product_name + " | " + selectedPercentageA + "%";
            }
            $('#ModalForm-ingredient_7').val(product_name);

            if (formula_size) {
              var edit_size = formula_size.match(/\d+(\.\d+)?/g); 
              if(edit_size == 1){
                edit_size = 1000;
              }
              // console.log("Selected Tub Size: ", edit_size);
            } else {
              console.log("No product size selected.");
              $("#form_help").fadeIn();
              $("#form_help").removeClass('form_help_hide');
              $("#form_help").html('Please select a product size');
              $(".mw_formula_radio_btns").addClass('flash_me');
              setTimeout(function(){
                  $("#form_help").addClass('form_help_hide');
                  $("#form_help").fadeOut();
                  setTimeout(function(){
                    $("#form_help").removeClass('form_help_hide');
                  }, 1500);
              }, 5000);
              setTimeout(function(){
                $(".mw_formula_radio_btns").removeClass('flash_me');
              }, 6500);
            }
            console.log("Variant Price 7: " + product_price);
            console.log("Variant Weight 7: " + product_weight);
            console.log("Selected Percent 7: " + selectedPercentageA);
            console.log("Tub Size Chosen (g) 7: " + edit_size);
            console.log("Variant Price 7 p/g: " + product_price_per_gram);
            var new_price = (selectedPercentageA/100 * (edit_size)) * product_price_per_gram ;
            console.log("Price 7 so far: R" + new_price.toFixed(2) );
            function_7();
      }
    }
// ------- START GET PRODUCT FROM DROPDOWN SELECT INGREDIENT 7  ---------

// ------- START GET INGREDIENT 7 VALUES FROM PERCENT DROPDOWN SELECT ---------
function function_7(){
    console.log("Starting function_7...");
    var valueInput_1 = document.getElementById('valueInput_7');
    var mainInput_1 = document.getElementById('ModalForm-ingredient_7');
    var percentDropdown_1 = document.getElementById('mw_formula_percentDropdown_7');
    var productDropdown_1a = document.getElementById('all_products_dropdown_7');
    var selectedProduct_1a = productDropdown_1a.value;
    //alert(selectedProduct_1a);
    var mainInput_1_value = mainInput_1.value;
    var selectedPercentage = parseFloat(percentDropdown_1.value); // Get selected percentage as a decimal
    valueInput_1.value = selectedPercentage;
    var product_weight = $('#all_products_dropdown_7 option:checked').attr('data-weight');
    var product_price_per_gram = $('#all_products_dropdown_7 option:checked').attr('data-price_pg');
    var formula_size = $('input[name="contact[Formula Size]"]:checked').val();
    if (formula_size) {
        var edit_size = formula_size.match(/\d+(\.\d+)?/g); 
        if(edit_size == 1){
          edit_size = 1000;
        }
        // console.log("Selected Tub Size: ", edit_size);
    } else {
        var edit_size = ""; 
    }

    if(mainInput_1_value == "") {
          console.log('Please enter the Ingredient 7 first.');
          mainInput_1.value = "Enter ingredient 7 first...";
          $('#mw_formula_percentDropdown_7 option:first-child').prop('selected', true);
          $('#all_products_dropdown_7 option:first-child').prop('selected', true);
          $(valueInput_1).val("");
          mainInput_1.value = "";
          valueInput_1.value = "";
          selectedProduct_1a.value = "";
          $(".form_help").html("");
          $("#valueInput_7_price").val("");
          $("#valueInput_7_weight").val("");
          calculate_totals();
    } else {
        if (containsPercentage(mainInput_1_value)) {
          console.log("The string 7 contains a percentage number.");
          var originalString_1 = mainInput_1.value;
          var stripString_1 = originalString_1.replace(/\|/g, '');
          var newString1 = stripString_1.replace(/\s*\d+(?:\.\d+)?%/g, ' | ' + selectedPercentage + '%');
          mainInput_1.value = newString1;
          
          //$("#mw_formula_percentDropdown_1").hide();
          // You can add further logic here, e.g., display a message
        } else {
          console.log("The string 7 does not contain a percentage number.");
          var stripString_1 = mainInput_1_value.replace(/\|/g, '');
          if(selectedPercentage == 0){
            //alert('Its zero...');
            mainInput_1.value = stripString_1;
            //$("#mw_formula_percentDropdown_7").hide();
          } else {
            mainInput_1.value = stripString_1 + " | " + selectedPercentage + '%';
           // $("#mw_formula_percentDropdown_1").hide();
          }

        }
        console.log("Product selected 7: " + mainInput_1_value);
        console.log("Selected percent 7: " + selectedPercentage);
        console.log("Product Weight 7: " + product_weight);
        console.log("Tub Size Chosen (g) 7: " + edit_size);
        console.log("Variant Price p/g 7: " + product_price_per_gram);
        var current_weight = selectedPercentage/100 * (edit_size);
        var new_price = current_weight * product_price_per_gram ;
        $("#valueInput_7_price").val(new_price.toFixed(2));
        $("#valueInput_7_weight").val(current_weight);
        console.log("Price so far 7: R" + new_price.toFixed(2) );
        calculate_totals();
    }
}
var percentDropdownUse_1 = document.getElementById('mw_formula_percentDropdown_7');
percentDropdownUse_1.addEventListener('change', () => {
  function_7();
});
var mainInputUse_1 = document.getElementById('ModalForm-ingredient_7');
mainInputUse_1.addEventListener('change', () => {
  function_7();
}); 
// ------- END GET INGREDIENT 7 VALUES FROM PERCENT DROPDOWN SELECT ---------

// ------- START GET PRODUCT FROM DROPDOWN SELECT INGREDIENT 8 ---------
var productDropdown = document.getElementById('all_products_dropdown_8');
    productDropdown.addEventListener('change', () => {
      function_product_8();
    });
    function function_product_8(){
      //alert('changed/ing...');
      var productDropdown_1 = document.getElementById('all_products_dropdown_8');
      var selectedProduct_1 = productDropdown_1.value;
      if(selectedProduct_1 != ""){
            $("#clear_ingredient_8").removeClass('hide_element');
            var formula_size = $('input[name="contact[Formula Size]"]:checked').val();
            var product_name = $('#all_products_dropdown_8 option:checked').attr('data-variant-name').trim();
            var product_price = $('#all_products_dropdown_8 option:checked').attr('data-price');
            var product_weight = $('#all_products_dropdown_8 option:checked').attr('data-weight');
            var product_price_per_gram = $('#all_products_dropdown_8 option:checked').attr('data-price_pg');
            var percentDropdown_1A = document.getElementById('mw_formula_percentDropdown_8');
            var selectedPercentageA = parseFloat(percentDropdown_1A.value); // Get selected percentage as a decimal
            if (selectedPercentageA > 0){
              product_name = product_name + " | " + selectedPercentageA + "%";
            }
            $('#ModalForm-ingredient_8').val(product_name);

            if (formula_size) {
              var edit_size = formula_size.match(/\d+(\.\d+)?/g); 
              if(edit_size == 1){
                edit_size = 1000;
              }
              // console.log("Selected Tub Size: ", edit_size);
            } else {
              console.log("No product size selected.");
              $("#form_help").fadeIn();
              $("#form_help").removeClass('form_help_hide');
              $("#form_help").html('Please select a product size');
              $(".mw_formula_radio_btns").addClass('flash_me');
              setTimeout(function(){
                  $("#form_help").addClass('form_help_hide');
                  $("#form_help").fadeOut();
                  setTimeout(function(){
                    $("#form_help").removeClass('form_help_hide');
                  }, 1500);
              }, 5000);
              setTimeout(function(){
                $(".mw_formula_radio_btns").removeClass('flash_me');
              }, 6500);
            }
            console.log("Variant Price 8: " + product_price);
            console.log("Variant Weight 8: " + product_weight);
            console.log("Selected Percent 8: " + selectedPercentageA);
            console.log("Tub Size Chosen (g) 8: " + edit_size);
            console.log("Variant Price 8 p/g: " + product_price_per_gram);
            var new_price = (selectedPercentageA/100 * (edit_size)) * product_price_per_gram ;
            console.log("Price 8 so far: R" + new_price.toFixed(2) );
            function_7();
      }
    }
// ------- START GET PRODUCT FROM DROPDOWN SELECT INGREDIENT 8  ---------

// ------- START GET INGREDIENT 8 VALUES FROM PERCENT DROPDOWN SELECT ---------
function function_8(){
    console.log("Starting function_8...");
    var valueInput_1 = document.getElementById('valueInput_8');
    var mainInput_1 = document.getElementById('ModalForm-ingredient_8');
    var percentDropdown_1 = document.getElementById('mw_formula_percentDropdown_8');
    var productDropdown_1a = document.getElementById('all_products_dropdown_8');
    var selectedProduct_1a = productDropdown_1a.value;
    //alert(selectedProduct_1a);
    var mainInput_1_value = mainInput_1.value;
    var selectedPercentage = parseFloat(percentDropdown_1.value); // Get selected percentage as a decimal
    valueInput_1.value = selectedPercentage;
    var product_weight = $('#all_products_dropdown_8 option:checked').attr('data-weight');
    var product_price_per_gram = $('#all_products_dropdown_8 option:checked').attr('data-price_pg');
    var formula_size = $('input[name="contact[Formula Size]"]:checked').val();
    if (formula_size) {
        var edit_size = formula_size.match(/\d+(\.\d+)?/g); 
        if(edit_size == 1){
          edit_size = 1000;
        }
        // console.log("Selected Tub Size: ", edit_size);
    } else {
        var edit_size = ""; 
    }

    if(mainInput_1_value == "") {
          console.log('Please enter the Ingredient 8 first.');
          mainInput_1.value = "Enter ingredient 8 first...";
          $('#mw_formula_percentDropdown_8 option:first-child').prop('selected', true);
          $('#all_products_dropdown_8 option:first-child').prop('selected', true);
          $(valueInput_1).val("");
          mainInput_1.value = "";
          valueInput_1.value = "";
          selectedProduct_1a.value = "";
          $(".form_help").html("");
          $("#valueInput_8_price").val("");
          $("#valueInput_8_weight").val("");
          calculate_totals();
    } else {
        if (containsPercentage(mainInput_1_value)) {
          console.log("The string 8 contains a percentage number.");
          var originalString_1 = mainInput_1.value;
          var stripString_1 = originalString_1.replace(/\|/g, '');
          var newString1 = stripString_1.replace(/\s*\d+(?:\.\d+)?%/g, ' | ' + selectedPercentage + '%');
          mainInput_1.value = newString1;
          
          //$("#mw_formula_percentDropdown_1").hide();
          // You can add further logic here, e.g., display a message
        } else {
          console.log("The string 8 does not contain a percentage number.");
          var stripString_1 = mainInput_1_value.replace(/\|/g, '');
          if(selectedPercentage == 0){
            //alert('Its zero...');
            mainInput_1.value = stripString_1;
            //$("#mw_formula_percentDropdown_7").hide();
          } else {
            mainInput_1.value = stripString_1 + " | " + selectedPercentage + '%';
           // $("#mw_formula_percentDropdown_1").hide();
          }

        }
        console.log("Product selected 8: " + mainInput_1_value);
        console.log("Selected percent 8: " + selectedPercentage);
        console.log("Product Weight 8: " + product_weight);
        console.log("Tub Size Chosen (g) 8: " + edit_size);
        console.log("Variant Price p/g 8: " + product_price_per_gram);
        var current_weight = selectedPercentage/100 * (edit_size);
        var new_price = current_weight * product_price_per_gram ;
        $("#valueInput_8_price").val(new_price.toFixed(2));
        $("#valueInput_8_weight").val(current_weight);
        console.log("Price so far 8: R" + new_price.toFixed(2) );
        calculate_totals();
    }
}
var percentDropdownUse_1 = document.getElementById('mw_formula_percentDropdown_8');
percentDropdownUse_1.addEventListener('change', () => {
  function_8();
});
var mainInputUse_1 = document.getElementById('ModalForm-ingredient_8');
mainInputUse_1.addEventListener('change', () => {
  function_8();
}); 
// ------- END GET INGREDIENT 8 VALUES FROM PERCENT DROPDOWN SELECT ---------

// ------- START GET PRODUCT FROM DROPDOWN SELECT INGREDIENT 9 ---------
var productDropdown = document.getElementById('all_products_dropdown_9');
    productDropdown.addEventListener('change', () => {
      function_product_9();
    });
    function function_product_9(){
      //alert('changed/ing...');
      var productDropdown_1 = document.getElementById('all_products_dropdown_9');
      var selectedProduct_1 = productDropdown_1.value;
      if(selectedProduct_1 != ""){
            $("#clear_ingredient_9").removeClass('hide_element');
            var formula_size = $('input[name="contact[Formula Size]"]:checked').val();
            var product_name = $('#all_products_dropdown_9 option:checked').attr('data-variant-name').trim();
            var product_price = $('#all_products_dropdown_9 option:checked').attr('data-price');
            var product_weight = $('#all_products_dropdown_9 option:checked').attr('data-weight');
            var product_price_per_gram = $('#all_products_dropdown_9 option:checked').attr('data-price_pg');
            var percentDropdown_1A = document.getElementById('mw_formula_percentDropdown_9');
            var selectedPercentageA = parseFloat(percentDropdown_1A.value); // Get selected percentage as a decimal
            if (selectedPercentageA > 0){
              product_name = product_name + " | " + selectedPercentageA + "%";
            }
            $('#ModalForm-ingredient_9').val(product_name);

            if (formula_size) {
              var edit_size = formula_size.match(/\d+(\.\d+)?/g); 
              if(edit_size == 1){
                edit_size = 1000;
              }
              // console.log("Selected Tub Size: ", edit_size);
            } else {
              console.log("No product size selected.");
              $("#form_help").fadeIn();
              $("#form_help").removeClass('form_help_hide');
              $("#form_help").html('Please select a product size');
              $(".mw_formula_radio_btns").addClass('flash_me');
              setTimeout(function(){
                  $("#form_help").addClass('form_help_hide');
                  $("#form_help").fadeOut();
                  setTimeout(function(){
                    $("#form_help").removeClass('form_help_hide');
                  }, 1500);
              }, 5000);
              setTimeout(function(){
                $(".mw_formula_radio_btns").removeClass('flash_me');
              }, 6500);
            }
            console.log("Variant Price 9: " + product_price);
            console.log("Variant Weight 9: " + product_weight);
            console.log("Selected Percent 9: " + selectedPercentageA);
            console.log("Tub Size Chosen (g) 9: " + edit_size);
            console.log("Variant Price 9 p/g: " + product_price_per_gram);
            var new_price = (selectedPercentageA/100 * (edit_size)) * product_price_per_gram ;
            console.log("Price 9 so far: R" + new_price.toFixed(2) );
            function_7();
      }
    }
// ------- START GET PRODUCT FROM DROPDOWN SELECT INGREDIENT 9  ---------

// ------- START GET INGREDIENT 9 VALUES FROM PERCENT DROPDOWN SELECT ---------
function function_9(){
    console.log("Starting function_9...");
    var valueInput_1 = document.getElementById('valueInput_9');
    var mainInput_1 = document.getElementById('ModalForm-ingredient_9');
    var percentDropdown_1 = document.getElementById('mw_formula_percentDropdown_9');
    var productDropdown_1a = document.getElementById('all_products_dropdown_9');
    var selectedProduct_1a = productDropdown_1a.value;
    //alert(selectedProduct_1a);
    var mainInput_1_value = mainInput_1.value;
    var selectedPercentage = parseFloat(percentDropdown_1.value); // Get selected percentage as a decimal
    valueInput_1.value = selectedPercentage;
    var product_weight = $('#all_products_dropdown_9 option:checked').attr('data-weight');
    var product_price_per_gram = $('#all_products_dropdown_9 option:checked').attr('data-price_pg');
    var formula_size = $('input[name="contact[Formula Size]"]:checked').val();
    if (formula_size) {
        var edit_size = formula_size.match(/\d+(\.\d+)?/g); 
        if(edit_size == 1){
          edit_size = 1000;
        }
        // console.log("Selected Tub Size: ", edit_size);
    } else {
        var edit_size = ""; 
    }

    if(mainInput_1_value == "") {
          console.log('Please enter the Ingredient 9 first.');
          mainInput_1.value = "Enter ingredient 9 first...";
          $('#mw_formula_percentDropdown_9 option:first-child').prop('selected', true);
          $('#all_products_dropdown_9 option:first-child').prop('selected', true);
          $(valueInput_1).val("");
          mainInput_1.value = "";
          valueInput_1.value = "";
          selectedProduct_1a.value = "";
          $(".form_help").html("");
          $("#valueInput_9_price").val("");
          $("#valueInput_9_weight").val("");
          calculate_totals();
    } else {
        if (containsPercentage(mainInput_1_value)) {
          console.log("The string 9 contains a percentage number.");
          var originalString_1 = mainInput_1.value;
          var stripString_1 = originalString_1.replace(/\|/g, '');
          var newString1 = stripString_1.replace(/\s*\d+(?:\.\d+)?%/g, ' | ' + selectedPercentage + '%');
          mainInput_1.value = newString1;
          
          //$("#mw_formula_percentDropdown_1").hide();
          // You can add further logic here, e.g., display a message
        } else {
          console.log("The string 9 does not contain a percentage number.");
          var stripString_1 = mainInput_1_value.replace(/\|/g, '');
          if(selectedPercentage == 0){
            //alert('Its zero...');
            mainInput_1.value = stripString_1;
            //$("#mw_formula_percentDropdown_7").hide();
          } else {
            mainInput_1.value = stripString_1 + " | " + selectedPercentage + '%';
           // $("#mw_formula_percentDropdown_1").hide();
          }

        }
        console.log("Product selected 9: " + mainInput_1_value);
        console.log("Selected percent 9: " + selectedPercentage);
        console.log("Product Weight 9: " + product_weight);
        console.log("Tub Size Chosen (g) 9: " + edit_size);
        console.log("Variant Price p/g 9: " + product_price_per_gram);
        var current_weight = selectedPercentage/100 * (edit_size);
        var new_price = current_weight * product_price_per_gram ;
        $("#valueInput_9_price").val(new_price.toFixed(2));
        $("#valueInput_9_weight").val(current_weight);
        console.log("Price so far 9: R" + new_price.toFixed(2) );
        calculate_totals();
    }
}
var percentDropdownUse_1 = document.getElementById('mw_formula_percentDropdown_9');
percentDropdownUse_1.addEventListener('change', () => {
  function_9();
});
var mainInputUse_1 = document.getElementById('ModalForm-ingredient_9');
mainInputUse_1.addEventListener('change', () => {
  function_9();
}); 
// ------- END GET INGREDIENT 9 VALUES FROM PERCENT DROPDOWN SELECT ---------

// ------- START GET PRODUCT FROM DROPDOWN SELECT INGREDIENT 10 ---------
var productDropdown = document.getElementById('all_products_dropdown_10');
    productDropdown.addEventListener('change', () => {
      function_product_10();
    });
    function function_product_10(){
      //alert('changed/ing...');
      var productDropdown_1 = document.getElementById('all_products_dropdown_10');
      var selectedProduct_1 = productDropdown_1.value;
      if(selectedProduct_1 != ""){
            $("#clear_ingredient_10").removeClass('hide_element');
            var formula_size = $('input[name="contact[Formula Size]"]:checked').val();
            var product_name = $('#all_products_dropdown_10 option:checked').attr('data-variant-name').trim();
            var product_price = $('#all_products_dropdown_10 option:checked').attr('data-price');
            var product_weight = $('#all_products_dropdown_10 option:checked').attr('data-weight');
            var product_price_per_gram = $('#all_products_dropdown_10 option:checked').attr('data-price_pg');
            var percentDropdown_1A = document.getElementById('mw_formula_percentDropdown_10');
            var selectedPercentageA = parseFloat(percentDropdown_1A.value); // Get selected percentage as a decimal
            if (selectedPercentageA > 0){
              product_name = product_name + " | " + selectedPercentageA + "%";
            }
            $('#ModalForm-ingredient_10').val(product_name);

            if (formula_size) {
              var edit_size = formula_size.match(/\d+(\.\d+)?/g); 
              if(edit_size == 1){
                edit_size = 1000;
              }
              // console.log("Selected Tub Size: ", edit_size);
            } else {
              console.log("No product size selected.");
              $("#form_help").fadeIn();
              $("#form_help").removeClass('form_help_hide');
              $("#form_help").html('Please select a product size');
              $(".mw_formula_radio_btns").addClass('flash_me');
              setTimeout(function(){
                  $("#form_help").addClass('form_help_hide');
                  $("#form_help").fadeOut();
                  setTimeout(function(){
                    $("#form_help").removeClass('form_help_hide');
                  }, 1500);
              }, 5000);
              setTimeout(function(){
                $(".mw_formula_radio_btns").removeClass('flash_me');
              }, 6500);
            }
            console.log("Variant Price 10: " + product_price);
            console.log("Variant Weight 10: " + product_weight);
            console.log("Selected Percent 10: " + selectedPercentageA);
            console.log("Tub Size Chosen (g) 10: " + edit_size);
            console.log("Variant Price 10 p/g: " + product_price_per_gram);
            var new_price = (selectedPercentageA/100 * (edit_size)) * product_price_per_gram ;
            console.log("Price 10 so far: R" + new_price.toFixed(2) );
            function_10();
      }
    }
// ------- START GET PRODUCT FROM DROPDOWN SELECT INGREDIENT 10  ---------

// ------- START GET INGREDIENT 10 VALUES FROM PERCENT DROPDOWN SELECT ---------
function function_10(){
    console.log("Starting function_10...");
    var valueInput_1 = document.getElementById('valueInput_10');
    var mainInput_1 = document.getElementById('ModalForm-ingredient_10');
    var percentDropdown_1 = document.getElementById('mw_formula_percentDropdown_10');
    var productDropdown_1a = document.getElementById('all_products_dropdown_10');
    var selectedProduct_1a = productDropdown_1a.value;
    //alert(selectedProduct_1a);
    var mainInput_1_value = mainInput_1.value;
    var selectedPercentage = parseFloat(percentDropdown_1.value); // Get selected percentage as a decimal
    valueInput_1.value = selectedPercentage;
    var product_weight = $('#all_products_dropdown_10 option:checked').attr('data-weight');
    var product_price_per_gram = $('#all_products_dropdown_10 option:checked').attr('data-price_pg');
    var formula_size = $('input[name="contact[Formula Size]"]:checked').val();
    if (formula_size) {
        var edit_size = formula_size.match(/\d+(\.\d+)?/g); 
        if(edit_size == 1){
          edit_size = 1000;
        }
        // console.log("Selected Tub Size: ", edit_size);
    } else {
        var edit_size = ""; 
    }

    if(mainInput_1_value == "") {
          console.log('Please enter the Ingredient 10 first.');
          mainInput_1.value = "Enter ingredient 10 first...";
          $('#mw_formula_percentDropdown_10 option:first-child').prop('selected', true);
          $('#all_products_dropdown_10 option:first-child').prop('selected', true);
          $(valueInput_1).val("");
          mainInput_1.value = "";
          valueInput_1.value = "";
          selectedProduct_1a.value = "";
          $(".form_help").html("");
          $("#valueInput_10_price").val("");
          $("#valueInput_10_weight").val("");
          calculate_totals();
    } else {
        if (containsPercentage(mainInput_1_value)) {
          console.log("The string 10 contains a percentage number.");
          var originalString_1 = mainInput_1.value;
          var stripString_1 = originalString_1.replace(/\|/g, '');
          var newString1 = stripString_1.replace(/\s*\d+(?:\.\d+)?%/g, ' | ' + selectedPercentage + '%');
          mainInput_1.value = newString1;
          
          //$("#mw_formula_percentDropdown_1").hide();
          // You can add further logic here, e.g., display a message
        } else {
          console.log("The string 10 does not contain a percentage number.");
          var stripString_1 = mainInput_1_value.replace(/\|/g, '');
          if(selectedPercentage == 0){
            //alert('Its zero...');
            mainInput_1.value = stripString_1;
            //$("#mw_formula_percentDropdown_7").hide();
          } else {
            mainInput_1.value = stripString_1 + " | " + selectedPercentage + '%';
           // $("#mw_formula_percentDropdown_1").hide();
          }

        }
        console.log("Product selected 10: " + mainInput_1_value);
        console.log("Selected percent 10: " + selectedPercentage);
        console.log("Product Weight 10: " + product_weight);
        console.log("Tub Size Chosen (g) 10: " + edit_size);
        console.log("Variant Price p/g 10: " + product_price_per_gram);
        var current_weight = selectedPercentage/100 * (edit_size);
        var new_price = current_weight * product_price_per_gram ;
        $("#valueInput_10_price").val(new_price.toFixed(2));
        $("#valueInput_10_weight").val(current_weight);
        console.log("Price so far 10: R" + new_price.toFixed(2) );
        calculate_totals();
    }
}
var percentDropdownUse_1 = document.getElementById('mw_formula_percentDropdown_10');
percentDropdownUse_1.addEventListener('change', () => {
  function_10();
});
var mainInputUse_1 = document.getElementById('ModalForm-ingredient_9');
mainInputUse_1.addEventListener('change', () => {
  function_10();
}); 
// ------- END GET INGREDIENT 10 VALUES FROM PERCENT DROPDOWN SELECT ---------

// -------------- -------------- *************** START CACULATE ALL TOTALS *************** -------------- --------------
  function calculate_totals() {
    console.log("Calculating...");
  // ------- INGREDIENT 1 ----------
    var price_1 = $("#valueInput_1_price").val();
    if(price_1 == ""){
      price_1 = 0;
    }
    var current_weight_1 = $("#valueInput_1_weight").val();
    var percentage_1 = $("#valueInput_1").val();
    var formula_size_1 = $('input[name="contact[Formula Size]"]:checked').val();
    if (formula_size_1) {
        var chosen_tub_size = formula_size_1.match(/\d+(\.\d+)?/g); 
        if(chosen_tub_size == 1){
          chosen_tub_size = 1000;
        }
    } else {
        var chosen_tub_size = ""; 
    }

  // ------- INGREDIENT 2 ----------
    var price_2 = $("#valueInput_2_price").val();
    if(price_2 == ""){
      price_2 = 0;
    }
    var current_weight_2 = $("#valueInput_2_weight").val();
    var percentage_2 = $("#valueInput_2").val();
    var formula_size_2 = $('input[name="contact[Formula Size]"]:checked').val();
    if (formula_size_2) {
        var chosen_tub_size = formula_size_2.match(/\d+(\.\d+)?/g); 
        if(chosen_tub_size == 1){
          chosen_tub_size = 1000;
        }
    } else {
        var chosen_tub_size = ""; 
    }

  // ------- INGREDIENT 3 ----------
    var price_3 = $("#valueInput_3_price").val();
    if(price_3 == ""){
      price_3 = 0;
    }
    var current_weight_3 = $("#valueInput_3_weight").val();
    var percentage_3 = $("#valueInput_3").val();
    var formula_size_3 = $('input[name="contact[Formula Size]"]:checked').val();
    if (formula_size_3) {
        var chosen_tub_size = formula_size_3.match(/\d+(\.\d+)?/g); 
        if(chosen_tub_size == 1){
          chosen_tub_size = 1000;
        }
    } else {
        var chosen_tub_size = ""; 
    }

    // ------- INGREDIENT 4 ----------
    var price_4 = $("#valueInput_4_price").val();
    if(price_4 == ""){
      price_4 = 0;
    }
    var current_weight_4 = $("#valueInput_4_weight").val();
    var percentage_4 = $("#valueInput_4").val();
    var formula_size_4 = $('input[name="contact[Formula Size]"]:checked').val();
    if (formula_size_4) {
        var chosen_tub_size = formula_size_4.match(/\d+(\.\d+)?/g); 
        if(chosen_tub_size == 1){
          chosen_tub_size = 1000;
        }
    } else {
        var chosen_tub_size = ""; 
    }

    // ------- INGREDIENT 5 ----------
    var price_5 = $("#valueInput_5_price").val();
    if(price_5 == ""){
      price_5 = 0;
    }
    var current_weight_5 = $("#valueInput_5_weight").val();
    var percentage_5 = $("#valueInput_5").val();
    var formula_size_5 = $('input[name="contact[Formula Size]"]:checked').val();
    if (formula_size_5) {
        var chosen_tub_size = formula_size_5.match(/\d+(\.\d+)?/g); 
        if(chosen_tub_size == 1){
          chosen_tub_size = 1000;
        }
    } else {
        var chosen_tub_size = ""; 
    }

    // ------- INGREDIENT 6 ----------
    var price_6 = $("#valueInput_6_price").val();
    if(price_6 == ""){
      price_6 = 0;
    }
    var current_weight_6 = $("#valueInput_6_weight").val();
    var percentage_6 = $("#valueInput_6").val();
    var formula_size_6 = $('input[name="contact[Formula Size]"]:checked').val();
    if (formula_size_6) {
        var chosen_tub_size = formula_size_6.match(/\d+(\.\d+)?/g); 
        if(chosen_tub_size == 1){
          chosen_tub_size = 1000;
        }
    } else {
        var chosen_tub_size = ""; 
    }

    // ------- INGREDIENT 7 ----------
    var price_7 = $("#valueInput_7_price").val();
    if(price_7 == ""){
      price_7 = 0;
    }
    var current_weight_7 = $("#valueInput_7_weight").val();
    var percentage_7 = $("#valueInput_7").val();
    var formula_size_7 = $('input[name="contact[Formula Size]"]:checked').val();
    if (formula_size_7) {
        var chosen_tub_size = formula_size_7.match(/\d+(\.\d+)?/g); 
        if(chosen_tub_size == 1){
          chosen_tub_size = 1000;
        }
    } else {
        var chosen_tub_size = ""; 
    }

    // ------- INGREDIENT 8 ----------
    var price_8 = $("#valueInput_8_price").val();
    if(price_8 == ""){
      price_8 = 0;
    }
    var current_weight_8 = $("#valueInput_8_weight").val();
    var percentage_8 = $("#valueInput_8").val();
    var formula_size_8 = $('input[name="contact[Formula Size]"]:checked').val();
    if (formula_size_8) {
        var chosen_tub_size = formula_size_8.match(/\d+(\.\d+)?/g); 
        if(chosen_tub_size == 1){
          chosen_tub_size = 1000;
        }
    } else {
        var chosen_tub_size = ""; 
    }

    // ------- INGREDIENT 9 ----------
    var price_9 = $("#valueInput_9_price").val();
    if(price_9 == ""){
      price_9 = 0;
    }
    var current_weight_9 = $("#valueInput_9_weight").val();
    var percentage_9 = $("#valueInput_9").val();
    var formula_size_9 = $('input[name="contact[Formula Size]"]:checked').val();
    if (formula_size_9) {
        var chosen_tub_size = formula_size_9.match(/\d+(\.\d+)?/g); 
        if(chosen_tub_size == 1){
          chosen_tub_size = 1000;
        }
    } else {
        var chosen_tub_size = ""; 
    }

    // ------- INGREDIENT 10 ----------
    var price_10 = $("#valueInput_10_price").val();
    if(price_10 == ""){
      price_10 = 0;
    }
    var current_weight_10 = $("#valueInput_10_weight").val();
    var percentage_10 = $("#valueInput_10").val();
    var formula_size_10 = $('input[name="contact[Formula Size]"]:checked').val();
    if (formula_size_10) {
        var chosen_tub_size = formula_size_10.match(/\d+(\.\d+)?/g); 
        if(chosen_tub_size == 1){
          chosen_tub_size = 1000;
        }
    } else {
        var chosen_tub_size = ""; 
    }

    console.log("price_1: " + price_1 + "price_2: " + price_2 + "price_3: " + price_3 + "price_4: " + price_4 + "price_5: " + price_5 + "price_6: " + price_6 + "price_7: " + price_7 + "price_8: " + price_8 + "price_9: " + price_9 + "price_10: " + price_10);
    console.log("current_weight_8: " + current_weight_8);
    console.log("percentage_8: " + percentage_8);


    if(chosen_tub_size == "" || chosen_tub_size == undefined ){
        $("#form_help").fadeIn();
        $("#form_help").removeClass('form_help_hide');
        $("#form_help").html('Please select a product size');
        $(".mw_formula_radio_btns").addClass('flash_me');
        setTimeout(function(){
            $("#form_help").addClass('form_help_hide');
            $("#form_help").fadeOut();
            setTimeout(function(){
              $("#form_help").removeClass('form_help_hide');
            }, 1500);
        }, 5000);
        setTimeout(function(){
          $(".mw_formula_radio_btns").removeClass('flash_me');
        }, 6500);
        return false;
    }
    
    var percent_total  = +percentage_1 + +percentage_2 + +percentage_3 + +percentage_4 + +percentage_5 + +percentage_6 + +percentage_7 + +percentage_8 + +percentage_9 + +percentage_10;
    var price_total  = +price_1 + +price_2 + +price_3 + +price_4 + +price_5 + +price_6 + +price_7 + +price_8 + +price_9 + +price_10 + 50;
    console.log("price_total: " + price_total);
    console.log("percent_total: " + percent_total);
    var weight_total  = +current_weight_1 + +current_weight_2 + +current_weight_3 + +current_weight_4 + +current_weight_5 + +current_weight_6 + +current_weight_7 + +current_weight_8 + +current_weight_9 + +current_weight_10;


    if(price_total == 0 || price_total == 0.00 || price_total == 50.00 || price_total == 50){
      console.log("Price totals equlas 0...");
       $("#totals_container").addClass('form_help_hide');
      // $("#totals_container").fadeOut();
      return false;
    }

    if(weight_total > chosen_tub_size){
      $("#totals_container").fadeIn();
      $("#totals_container").html('<p style="font-weight:600;">Can not exceed selected product weight: <br> Current Weight: '  + weight_total + "g / " + chosen_tub_size + "g</p>");
      console.log("Weight total more than tub size...");
      return false;
    }

    console.log("Calculate Price Total: " + price_total.toFixed(2));
    console.log("Calculate Weight Total: " + weight_total);
    console.log("Calculate Chosen Tub Size: " + chosen_tub_size);

  
    $("#totals_container").removeClass('form_help_hide');
    $("#totals_container").fadeIn();
    $("#totals_container").html('<p class="formula_totals_div">Current Price: R<span id="total_price">' + price_total.toFixed(2) + "</span><span class='packaging_fee'>*Includes R50.00 blending & packing fee</span> Current Weight: <span id='total_weight'>"  + weight_total + "</span>g / " + chosen_tub_size + "g</p>");
    if(weight_total == chosen_tub_size){
        if ($('.formula_ready').length > 0) {
          $(".formula_ready").fadeIn();
        } else {
          $("#totals_container").append("<p class='formula_ready'>Formula Ready!</p>");
        }
    } else {
      $(".formula_ready").fadeOut();
    }

    if(percent_total != 0 ){
        if ($('.formula_ready').length > 0) {
          $(".formula_ready").fadeIn();
        } else {
          $("#totals_container").append("<p class='formula_ready'>" + percent_total + "% Complete</p>");
        }
    }

    if(chosen_tub_size == 200){
      $("#totals_container").prepend('<img style="background: #fff;padding: 4px;border-radius: 4px;margin-right: 12px;" width="42" height="auto" src="https://cdn.shopify.com/s/files/1/0713/8685/7724/files/tub_size_200g.jpg" />');
    } else if(chosen_tub_size == 500){
      $("#totals_container").prepend('<img style="background: #fff;padding: 4px;border-radius: 4px;margin-right: 12px;" width="42" height="auto" src="https://cdn.shopify.com/s/files/1/0713/8685/7724/files/tub_size_500g.jpg" />');
    } else if(chosen_tub_size == 1000){
      $("#totals_container").prepend('<img style="background: #fff;padding: 4px;border-radius: 4px;margin-right: 12px;" width="42" height="auto" src="https://cdn.shopify.com/s/files/1/0713/8685/7724/files/tub_size_1kg.jpg" />');
    } else {

    }
    
    // setTimeout(function(){
    //     $("#totals_container").addClass('form_help_hide');
    //     $("#totals_container").fadeOut();
    //     setTimeout(function(){
    //       $("#totals_container").removeClass('form_help_hide');
    //     }, 1500);
    // }, 10000);
}
// -------------- -------------- *************** END CACULATE ALL TOTALS *************** -------------- --------------



// ------- START SUBMIT THE FORMULA FORM ---------
$(".submit_formula_btn").click(function (e){
  e.preventDefault();
  var my_html_elmnt = $(this);
  $(my_html_elmnt).html('Submitting <img style="margin-top:-2px;margin-left:2px;filter:brightness(1.3);" width="16" src="https://cdn.shopify.com/s/files/1/0713/8685/7724/files/loader.gif?v=1743590298" />');

  // ----------- Check Name, Tel, Mail, Size, Formula Name -----------
  var user_name = $('#ModalForm-name').val();
  var user_email = $('#ModalForm-email').val();
  var user_tel = $('#ModalForm-phone').val();
  var selectedSizeValue = $('input[name="contact[Formula Size]"]:checked').val();
  var formula_description = $("#ModalForm-body").val();
  //alert("Name: " + user_name);

  if (user_name == ""){
    $(my_html_elmnt).html('Please enter your name');
    setTimeout(function(){
      $(my_html_elmnt).html('Submit Formula');
    }, 3000);
    return false;
  }
  if (user_email == ""){
    $(my_html_elmnt).html('Please enter your email');
    setTimeout(function(){
      $(my_html_elmnt).html('Submit Formula');
    }, 3000);
    return false;
  }
  if (selectedSizeValue === undefined ){
    $(my_html_elmnt).html('Please select a tub size');
    setTimeout(function(){
      $(my_html_elmnt).html('Submit Formula');
    }, 3000);
    return false;
  }
  if (formula_description == ""){
    $(my_html_elmnt).html('Please enter your formula name');
    setTimeout(function(){
      $(my_html_elmnt).html('Submit Formula');
    }, 3000);
    return false;
  }

  var perc1 = $('#valueInput_1').val();
  var perc2 = $('#valueInput_2').val();
  var perc3 = $('#valueInput_3').val();
  var perc4 = $('#valueInput_4').val();
  var perc5 = $('#valueInput_5').val();
  var perc6 = $('#valueInput_6').val();
  var perc7 = $('#valueInput_7').val();
  var perc8 = $('#valueInput_8').val();
  var perc9 = $('#valueInput_9').val();
  var perc10 = $('#valueInput_10').val();

  var populatedFields = [];
  $('#valueInput_1, #valueInput_2, #valueInput_3, #valueInput_4, #valueInput_5, #valueInput_6, #valueInput_7, #valueInput_8, #valueInput_9, #valueInput_10').each(function() {
      var inputValue = $.trim($(this).val()); // Get and trim the value
      if (inputValue != '') {
        populatedFields.push($(this).attr('id')); // Add the ID of the empty field
      }
  });
  //alert(populatedFields.length);
  if (populatedFields.length < 2) {
      // alert('The following fields are empty: ' + emptyFields.join(', '));
      //alert('Formula requires at least two ingredients');
      $(my_html_elmnt).html('Formula requires at least two ingredients <br> Current Ingredients: ' + populatedFields.length);
      setTimeout(function(){
        $(my_html_elmnt).html('Submit Formula');
      }, 7000);
  } else {
     // alert('All specified fields are filled.');
  }

  var total_perc = +perc1 + +perc2 + +perc3 + +perc4 + +perc5 + +perc6 + +perc7 + +perc8 + +perc9 + +perc10;
  //alert('Percent Value Total: ' + total_perc );
  if(total_perc > 100){
    $(my_html_elmnt).html('Ingedients can not exceed 100% <br>Currently: ' + total_perc + '%');
    setTimeout(function(){
      $(my_html_elmnt).html('Submit Formula');
    }, 5000);
    return false;
  } else if(total_perc < 100){
    $(my_html_elmnt).html('Ingedients must total 100% <br> Currently: ' + total_perc + '%');
    setTimeout(function(){
      $(my_html_elmnt).html('Submit Formula');
    }, 5000);
    return false;
  } else {
  
  }
  console.log('submitting...');

  var ingredient_1 = $('#ModalForm-ingredient_1').val();
  var ingredient_2 = $('#ModalForm-ingredient_2').val();
  var ingredient_3 = $('#ModalForm-ingredient_3').val();
  var ingredient_4 = $('#ModalForm-ingredient_4').val();
  var ingredient_5 = $('#ModalForm-ingredient_5').val();
  var ingredient_6 = $('#ModalForm-ingredient_6').val();
  var ingredient_7 = $('#ModalForm-ingredient_7').val();
  var ingredient_8 = $('#ModalForm-ingredient_8').val();
  var ingredient_9 = $('#ModalForm-ingredient_9').val();
  var ingredient_10 = $('#ModalForm-ingredient_10').val();

  var perc1 = $('#valueInput_1').val();
  var perc2 = $('#valueInput_2').val();
  var perc3 = $('#valueInput_3').val();
  var perc4 = $('#valueInput_4').val();
  var perc5 = $('#valueInput_5').val();
  var perc6 = $('#valueInput_6').val();
  var perc7 = $('#valueInput_7').val();
  var perc8 = $('#valueInput_8').val();
  var perc9 = $('#valueInput_9').val();
  var perc10 = $('#valueInput_10').val();

  var weight_1 = $('#valueInput_1_weight').val();
  var weight_2 = $('#valueInput_2_weight').val();
  var weight_3 = $('#valueInput_3_weight').val();
  var weight_4 = $('#valueInput_4_weight').val();
  var weight_5 = $('#valueInput_5_weight').val();
  var weight_6 = $('#valueInput_6_weight').val();
  var weight_7 = $('#valueInput_7_weight').val();
  var weight_8 = $('#valueInput_8_weight').val();
  var weight_9 = $('#valueInput_9_weight').val();
  var weight_10 = $('#valueInput_10_weight').val();

  var submit_price = $('#total_price').html();
  var submit_weight = $('#total_weight').html();

  var myCheckbox = document.getElementById('myFormulaCheckbox');
  if (myCheckbox.checked) {
    console.log('The checkbox is checked.');
  } else {
    console.log('The checkbox is not checked.');
    $(my_html_elmnt).html('Please accept the terms & conditions');
    setTimeout(function(){
      $(my_html_elmnt).html('Submit Formula');
    }, 3000);
    return false;
  }
  
  // // Example: Check on change event
  // myCheckbox.addEventListener('change', isCheckboxChecked);
  //return false;

  var data_formula_form = 'user_name=' + user_name + '&user_email=' + user_email + '&user_tel=' + user_tel + '&selectedSizeValue=' + selectedSizeValue + '&formula_description=' + formula_description + '&ingredient_1=' + ingredient_1 + '&ingredient_2=' + ingredient_2 + '&ingredient_3=' + ingredient_3 + '&ingredient_4=' + ingredient_4 + '&ingredient_5=' + ingredient_5 + '&ingredient_6=' + ingredient_6 + '&ingredient_7=' + ingredient_7 + '&ingredient_8=' + ingredient_8 + '&ingredient_9=' + ingredient_9 + '&ingredient_10=' + ingredient_10 + '&weight_1=' + weight_1 + '&weight_2=' + weight_2 + '&weight_3=' + weight_3 + '&weight_4=' + weight_4 + '&weight_5=' + weight_5 + '&weight_6=' + weight_6 + '&weight_7=' + weight_7 + '&weight_8=' + weight_8 + '&weight_9=' + weight_9 + '&weight_10=' + weight_10 + '&submit_price=' + submit_price + '&submit_weight=' + submit_weight;
  //alert('submit_price: ' + submit_price);
  //alert('submit_weight: ' + submit_weight);
  console.log(data_formula_form);
  //return false;
          $.ajax({
            type:'POST',
            // enctype: 'multipart/form-data',
            //url: $(this).attr('action'),
            url: "https://mw-portal.co.za/db/my_whey_formula_ajax/send_my_formula2.php", 
            data:data_formula_form,
            cache:false,
            // contentType: false,
            // processData: false,
            success:function(res){
//-------------- START ADD TO CART ----------------------
                // var match = res.match(/\d+/);
                // if (match) {
                //     // Extract the matched number string (e.g., "123")
                //     var numberString = match[0];
                //     // Convert the string to an integer value
                //     var first_number_value = parseInt(numberString, 10);
                //     // Use the number value
                //     console.log("The first number is:", first_number_value);


                    // setTimeout(function(){
                    //     // alert('adding...' + first_number_value);
                    //       fetch('/cart/add.js', {
                    //             method: 'POST',
                    //             headers: {
                    //               'Content-Type': 'application/json',
                    //               'X-Requested-With': 'XMLHttpRequest', // Important for some older implementations
                    //             },
                    //             body: JSON.stringify({
                    //               items: [
                    //                 {
                    //                   id: first_number_value, // Replace with your actual variant ID
                    //                   quantity: 1 // Replace with the desired quantity
                    //                 }
                    //               ]
                    //             })
                    //       })
                    //       .then(response => response.json())
                    //       .then(data => {
                    //         console.log('Item added to cart:', data);
                    //         // Handle success (e.g., update the cart count on the page)

                    //       async function checkIfProductIsInCart() {
                    //             console.log("STARTING FUNCTION...");
                    //             try {
                    //               var response = await fetch('/cart.js');
                    //               var cart = await response.json();
                          
                    //               fetchCartItems();
                    //                   async function fetchCartItems() {
                    //                     try {
                    //                       const response = await fetch('/cart.js', { cache: 'no-store' });
                    //                       if (!response.ok) {
                    //                         throw new Error('Something is wrong...');
                    //                       }
                    //                       const cart = await response.json();
                    //                       console.log('Cart:', cart);

                    //                       if (!cart.items || cart.items.length === 0) {
                    //                         console.log('Empty cart, refetching...');
                    //                         return await fetchCartItems();
                    //                       }
                    //                       return cart;





                    //                     } catch (error) {
                    //                       console.error('Fetch error:', error);
                    //                     }
                    //                   }

                    //             } catch (error) {
                    //               console.error('Error fetching cart data:', error);
                    //               return false;
                    //             }
                    //         }
                    //         checkIfProductIsInCart();

                    //       })
                    //       .then(updatedCart => {
                    //         // Manually fetch and replace the cart drawer content
                    //         // The exact implementation might vary slightly based on theme version
                    //         fetch(window.Shopify.routes.root + '?section_id=cart-drawer')
                    //           .then(response => response.text())
                    //           .then(responseText => {
                    //             const newDocument = new DOMParser().parseFromString(responseText, 'text/html');
                    //             const newCartDrawerHtml = newDocument.getElementById('CartDrawer').innerHTML;
                    //             //console.log("Here is HTML from fetch CART!!!!!!!!!!");
                    //             //console.log(newCartDrawerHtml);
                               
                    //             // Find the existing cart drawer element and replace its inner HTML
                    //             const currentCartDrawer = document.getElementById('CartDrawer');
                    //             if (currentCartDrawer) {
                    //               currentCartDrawer.innerHTML = newCartDrawerHtml;
                                  
                    //               // Re-initialize any necessary JavaScript components if they don't auto-initialize
                    //               // This often involves calling an open method or similar function
                    //               // The exact method is specific to Dawn's JS implementation (e.g., this.window.SLIDECART_UPDATE(response) in some cases)
                    //               // In v15.2, the <cart-drawer> custom element should handle some of this internally.
                                  
                    //               // Open the cart drawer
                    //               $("cart-drawer").removeClass('is-empty');

                    //               // If you want the cart drawer to open automatically:
                    //               // Note: The exact event name might vary slightly by Dawn version.
                    //               const cartDrawer = document.querySelector('cart-drawer') || document.querySelector('.cart-notification');
                    //               if (cartDrawer) {
                    //                   cartDrawer.open(); 
                    //               }
                    //               //document.querySelector('cart-drawer').open();
                    //             }
                    //           });
                    //       })
                    //       .catch(error => {
                    //         console.error('Error adding item to cart:', error);
                    //         // Handle errors
                    //       });

                    // }, 3000);



                //     // You can now return this value for further use within this scope, 
                //     // or pass it to another function: useNumber(first_number_value);
                // } else {
                //     console.log("No number found in the response.");
                // }
//-------------- END ADD TO CART ----------------------

                
                //alert('finished collecting...');
                console.log(res);
                if(res.indexOf("Email successfully sent") >= 0){
                  console.log('Email sent...');
                  $(my_html_elmnt).html('Submission successful<br>Please check your inbox');
                  $('#submit_formula #ModalForm')[0].reset(); 
                  $("#totals_container").fadeOut();
                  $(".clear_ingredient").addClass('fade_element');
                  setTimeout(function(){
                    $(".clear_ingredient").addClass('hide_element');
                  }, 2000);
                  $("#totals_container").html('');
                  setTimeout(function(){
                    $(my_html_elmnt).html('Submit Formula');
                  }, 8000);
                } else {
                  console.log('Could not send email...');
                  $(my_html_elmnt).html('Could not subimt form<br>Please check your connection or try again later');
                  $('#submit_formula #ModalForm')[0].reset(); 
                  $("#totals_container").fadeOut();
                  $("#totals_container").html('');
                  $(".clear_ingredient").addClass('hide_element');
                  setTimeout(function(){
                    $(my_html_elmnt).html('Submit Formula');
                  }, 8000);
                }
            },
            error:function(res){
                //alert('finished collecting...');
                console.log(res);
                // if(res.indexOf("No results") >= 0){
                // }
            }
        });

  //$('#submit_formula #ModalForm').submit();
  // setTimeout(function(){
  //   $(my_html_elmnt).html('Submit Formula');
  // }, 12000);

}); // ------- END SUBMIT THE FORMULA FORM ---------

// ---- HIDE FORM HELP -----
$(".form_help").hide();

 // ------- TUB SIZE RADIO BUTTON OPTION CLICK ---------
  $('.mw_formula_radio_btns input[type="radio"]').on('click', function() {
    $("#form_help").addClass('form_help_hide');
    $("#form_help").fadeOut();
    $(".mw_formula_radio_btns").removeClass('flash_me');
    var selectedValue = $(this).val();
    console.log("Radio button clicked! Value: " + selectedValue);
    function_product_1(); 
    function_1();
    function_product_2();
    function_2(); 
    function_product_3();
    function_3();
    function_product_4();
    function_4();
    function_product_5();
    function_5();
    function_product_6();
    function_6();
    function_product_7();
    function_7();
    function_product_8();
    function_8();
    function_product_9();
    function_9();
    function_product_10();
    function_10();
  });

  $("#clear_ingredient_1").click(function (){
    $('#mw_formula_percentDropdown_1 option:first-child').prop('selected', true);
    $('#all_products_dropdown_1 option:first-child').prop('selected', true);
    $("#valueInput_1").val("");
    $("#valueInput_1_price").val("");
    $("#valueInput_1_weight").val("");
    $("#all_products_dropdown_1").val("");
    $("#ModalForm-ingredient_1").val("");
    function_product_1();
    function_1();
    function_product_2();
    function_2();
    function_product_3();
    function_3();
    function_product_4();
    function_4();
    function_product_5();
    function_5();
    function_product_6();
    function_6();
    function_product_7();
    function_7();
    function_product_8();
    function_8();
    function_product_9();
    function_9();
    function_product_10();
    function_10();
    $("#clear_ingredient_1").addClass('hide_element');
  });

  $("#clear_ingredient_2").click(function (){
    $('#mw_formula_percentDropdown_2 option:first-child').prop('selected', true);
    $('#all_products_dropdown_2 option:first-child').prop('selected', true);
    $("#valueInput_2").val("");
    $("#valueInput_2_price").val("");
    $("#valueInput_2_weight").val("");
    $("#all_products_dropdown_2").val("");
    $("#ModalForm-ingredient_2").val("");
    function_product_1();
    function_1();
    function_product_2();
    function_2();
    function_product_3();
    function_3();
    function_product_4();
    function_4();
    function_product_5();
    function_5();
    function_product_6();
    function_6();
    function_product_7();
    function_7();
    function_product_8();
    function_8();
    function_product_9();
    function_9();
    function_product_10();
    function_10();
    $("#clear_ingredient_2").addClass('hide_element');
  });

  $("#clear_ingredient_3").click(function (){
    $('#mw_formula_percentDropdown_3 option:first-child').prop('selected', true);
    $('#all_products_dropdown_3 option:first-child').prop('selected', true);
    $("#valueInput_3").val("");
    $("#valueInput_3_price").val("");
    $("#valueInput_3_weight").val("");
    $("#all_products_dropdown_3").val("");
    $("#ModalForm-ingredient_3").val("");
    function_product_1();
    function_1();
    function_product_2();
    function_2();
    function_product_3();
    function_3();
    function_product_4();
    function_4();
    function_product_5();
    function_5();
    function_product_6();
    function_6();
    function_product_7();
    function_7();
    function_product_8();
    function_8();
    function_product_9();
    function_9();
    function_product_10();
    function_10();
    $("#clear_ingredient_3").addClass('hide_element');
  });

  $("#clear_ingredient_4").click(function (){
    $('#mw_formula_percentDropdown_4 option:first-child').prop('selected', true);
    $('#all_products_dropdown_4 option:first-child').prop('selected', true);
    $("#valueInput_4").val("");
    $("#valueInput_4_price").val("");
    $("#valueInput_4_weight").val("");
    $("#all_products_dropdown_4").val("");
    $("#ModalForm-ingredient_4").val("");
    function_product_1();
    function_1();
    function_product_2();
    function_2();
    function_product_3();
    function_3();
    function_product_4();
    function_4();
    function_product_5();
    function_5();
    function_product_6();
    function_6();
    function_product_7();
    function_7();
    function_product_8();
    function_8();
    function_product_9();
    function_9();
    function_product_10();
    function_10();
    $("#clear_ingredient_4").addClass('hide_element');
  });

  $("#clear_ingredient_5").click(function (){
    $('#mw_formula_percentDropdown_5 option:first-child').prop('selected', true);
    $('#all_products_dropdown_5 option:first-child').prop('selected', true);
    $("#valueInput_5").val("");
    $("#valueInput_5_price").val("");
    $("#valueInput_5_weight").val("");
    $("#all_products_dropdown_5").val("");
    $("#ModalForm-ingredient_5").val("");
    function_product_1();
    function_1();
    function_product_2();
    function_2();
    function_product_3();
    function_3();
    function_product_4();
    function_4();
    function_product_5();
    function_5();
    function_product_6();
    function_6();
    function_product_7();
    function_7();
    function_product_8();
    function_8();
    function_product_9();
    function_9();
    function_product_10();
    function_10();
    $("#clear_ingredient_5").addClass('hide_element');
  });

  $("#clear_ingredient_6").click(function (){
    $('#mw_formula_percentDropdown_6 option:first-child').prop('selected', true);
    $('#all_products_dropdown_6 option:first-child').prop('selected', true);
    $("#valueInput_6").val("");
    $("#valueInput_6_price").val("");
    $("#valueInput_6_weight").val("");
    $("#all_products_dropdown_6").val("");
    $("#ModalForm-ingredient_6").val("");
    function_product_1();
    function_1();
    function_product_2();
    function_2();
    function_product_3();
    function_3();
    function_product_4();
    function_4();
    function_product_5();
    function_5();
    function_product_6();
    function_6();
    function_product_7();
    function_7();
    function_product_8();
    function_8();
    function_product_9();
    function_9();
    function_product_10();
    function_10();
    $("#clear_ingredient_6").addClass('hide_element');
  });

  $("#clear_ingredient_7").click(function (){
    $('#mw_formula_percentDropdown_7 option:first-child').prop('selected', true);
    $('#all_products_dropdown_7 option:first-child').prop('selected', true);
    $("#valueInput_7").val("");
    $("#valueInput_7_price").val("");
    $("#valueInput_7_weight").val("");
    $("#all_products_dropdown_7").val("");
    $("#ModalForm-ingredient_7").val("");
    function_product_1();
    function_1();
    function_product_2();
    function_2();
    function_product_3();
    function_3();
    function_product_4();
    function_4();
    function_product_5();
    function_5();
    function_product_6();
    function_6();
    function_product_7();
    function_7();
    function_product_8();
    function_8();
    function_product_9();
    function_9();
    function_product_10();
    function_10();
    $("#clear_ingredient_7").addClass('hide_element');
  });

  $("#clear_ingredient_8").click(function (){
    $('#mw_formula_percentDropdown_8 option:first-child').prop('selected', true);
    $('#all_products_dropdown_8 option:first-child').prop('selected', true);
    $("#valueInput_8").val("");
    $("#valueInput_8_price").val("");
    $("#valueInput_8_weight").val("");
    $("#all_products_dropdown_8").val("");
    $("#ModalForm-ingredient_8").val("");
    function_product_1();
    function_1();
    function_product_2();
    function_2();
    function_product_3();
    function_3();
    function_product_4();
    function_4();
    function_product_5();
    function_5();
    function_product_6();
    function_6();
    function_product_7();
    function_7();
    function_product_8();
    function_8();
    function_product_9();
    function_9();
    function_product_10();
    function_10();
    $("#clear_ingredient_8").addClass('hide_element');
  });

  $("#clear_ingredient_9").click(function (){
    $('#mw_formula_percentDropdown_9 option:first-child').prop('selected', true);
    $('#all_products_dropdown_9 option:first-child').prop('selected', true);
    $("#valueInput_9").val("");
    $("#valueInput_9_price").val("");
    $("#valueInput_9_weight").val("");
    $("#all_products_dropdown_9").val("");
    $("#ModalForm-ingredient_9").val("");
    function_product_1();
    function_1();
    function_product_2();
    function_2();
    function_product_3();
    function_3();
    function_product_4();
    function_4();
    function_product_5();
    function_5();
    function_product_6();
    function_6();
    function_product_7();
    function_7();
    function_product_8();
    function_8();
    function_product_9();
    function_9();
    function_product_10();
    function_10();
    $("#clear_ingredient_9").addClass('hide_element');
  });

  $("#clear_ingredient_10").click(function (){
    $('#mw_formula_percentDropdown_10 option:first-child').prop('selected', true);
    $('#all_products_dropdown_10 option:first-child').prop('selected', true);
    $("#valueInput_10").val("");
    $("#valueInput_10_price").val("");
    $("#valueInput_10_weight").val("");
    $("#all_products_dropdown_10").val("");
    $("#ModalForm-ingredient_10").val("");
    function_product_1();
    function_1();
    function_product_2();
    function_2();
    function_product_3();
    function_3();
    function_product_4();
    function_4();
    function_product_5();
    function_5();
    function_product_6();
    function_6();
    function_product_7();
    function_7();
    function_product_8();
    function_8();
    function_product_9();
    function_9();
    function_product_10();
    function_10();
    $("#clear_ingredient_10").addClass('hide_element');
  });
 

}); // -------- END document ready ------------

// ------------------ ***************** END MY FORMULA MODAL SCRIPT ***************** ------------------