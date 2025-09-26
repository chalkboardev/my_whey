class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
    this.setHeaderCartIconAccessibility();
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector('#cart-icon-bubble');
    if (!cartLink) return;

    cartLink.setAttribute('role', 'button');
    cartLink.setAttribute('aria-haspopup', 'dialog');
    cartLink.addEventListener('click', (event) => {
      event.preventDefault();
      document.getElementById('cart_backdrop').classList.add('cart_blurry');
      this.open(cartLink);
      //console.log('cart-drawer.js....');
    });
    cartLink.addEventListener('keydown', (event) => {
      if (event.code.toUpperCase() === 'SPACE') {
        event.preventDefault();
        this.open(cartLink);
      }
    });
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if (cartDrawerNote && !cartDrawerNote.hasAttribute('role')) this.setSummaryAccessibility(cartDrawerNote);
    // here the animation doesn't seem to always get triggered. A timeout seem to help
    // const fullPath = window.location.pathname;
    // const pathSegments = fullPath.split('/');
    // const pageName = pathSegments[pathSegments.length - 1];
    // console.log(pageName);
    setTimeout(() => {
      document.getElementById('cart_backdrop').classList.add('cart_blurry');
      this.classList.add('animate', 'active');
      const sales_corner = document.querySelector('#mw_corner_sale_cart_drawer');
      if(sales_corner){
        this.querySelector('.mw_corner_sale_cart_drawer').classList.add('active');
      }
      console.log('testing open cart event from cart-drawer.js cart link....');
      const flavour_link = document.querySelector('#click_flavour_modal_cart');
      const flavour_link_close = document.querySelector('#flavour_popup__close');
      const flavour_link_btn_txt = document.querySelector('#crt_btn_txt');
      flavour_link_btn_txt.classList.add('checkout_button_txt_anim');
      if(flavour_link){
        flavour_link.addEventListener('click', (event) => {
          event.preventDefault();
          console.log('testing from cart link open....');
          document.querySelector('.flavour_modal__overlay').classList.add('show_flavour_modal');
          console.log("opening main flavour modal from cart-drawer.js...");
        });
      }
      if(flavour_link_close){
        flavour_link_close.addEventListener('click', (event) => {
          event.preventDefault(); 
          console.log('testing from cart link close....');
          document.querySelector('.flavour_modal__overlay').classList.remove('show_flavour_modal');
        });
      }
      
    });

    this.addEventListener(
      'transitionend',
      () => {
        const containerToTrapFocusOn = this.classList.contains('is-empty')
          ? this.querySelector('.drawer__inner-empty')
          : document.getElementById('CartDrawer');
        const focusElement = this.querySelector('.drawer__inner') || this.querySelector('.drawer__close');
        trapFocus(containerToTrapFocusOn, focusElement);
      },
      { once: true }
    );

    document.body.classList.add('overflow-hidden');
  }

  close() {
    this.classList.remove('active');
    this.querySelector('.mw_corner_sale_cart_drawer').classList.remove('active');
    document.getElementById('cart_backdrop').classList.remove('cart_blurry');
    removeTrapFocus(this.activeElement);
    document.body.classList.remove('overflow-hidden');

  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute('role', 'button');
    cartDrawerNote.setAttribute('aria-expanded', 'false');

    if (cartDrawerNote.nextElementSibling.getAttribute('id')) {
      cartDrawerNote.setAttribute('aria-controls', cartDrawerNote.nextElementSibling.id);
    }

    cartDrawerNote.addEventListener('click', (event) => {
      event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
    });

    cartDrawerNote.parentElement.addEventListener('keyup', onKeyUpEscape);
  }

  renderContents(parsedState) {
    this.querySelector('.drawer__inner').classList.contains('is-empty') &&
      this.querySelector('.drawer__inner').classList.remove('is-empty');
    this.productId = parsedState.id;
    //alert(parsedState.id);
    this.getSectionsToRender().forEach((section) => {
      // alert("Section Selector: " + section.selector);
      // alert("Section ID: " + section.id);
      const sectionElement = section.selector
        ? document.querySelector(section.selector)
        : document.getElementById(section.id);

      if (!sectionElement) return;
      sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
    });

    setTimeout(() => {
      this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
      this.open();
    });
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-drawer',
        selector: '#CartDrawer',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  getSectionDOM(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-drawer', CartDrawer);

class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    return [
      {
        id: 'CartDrawer',
        section: 'cart-drawer',
        selector: '.drawer__inner',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
    ];
  }
}

customElements.define('cart-drawer-items', CartDrawerItems);
