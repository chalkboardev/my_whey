if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        this.variantIdInput.disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');
        this.submitButtonText = this.submitButton.querySelector('span');

        if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');

        this.hideErrors = this.dataset.hideErrors === 'true';
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.handleErrorMessage();

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading__spinner').classList.remove('hidden');

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);
        if (this.cart) {
          formData.append(
            'sections',
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        //alert(window.location.hostname);
        const the_server = window.location.hostname;
        if (the_server == '127.0.0.1'){
          //alert('Localhost!');
          var new_route = "http://127.0.0.1:9292/cart/add/"; 

          // ------------------------ START CHECK CART AND OPEN FLAVOUR MODAL ------------------------
          //console.log('Fetch cart items and check contents...');
          fetch('/cart.js')
          .then(response => response.json())
          .then(cart => {
            // Check if the cart is empty
            if (!cart.items || cart.items.length === 0) {
              //console.log('Cart is empty!');
              // Perform actions for an empty cart (e.g., hide elements, display empty cart message)
            } else {
              console.log('Cart has items.');
             // console.log('Cart:', cart);
            }
            
            // async function checkIfProductIsInCart(productIdToCheck) {
            async function checkIfProductIsInCart() {
              try {
                var response = await fetch('/cart.js');
                var cart = await response.json();
        
                var productInCart_flavour = cart.items.some(item => item.product_type === 'flavour');
                //var productInCart_vanilla = cart.items.some(item => item.product_id === 9028972413180);
                if (productInCart_flavour) {
                    //console.log(`Flavour Product is in the cart...`);
                    return true;
                } else {
                    // console.log(`Product with ID ${productIdToCheck} is NOT in the cart...`);
                    // console.log(`NO FLAVOURS in the cart...`);
                    // console.log('Checking cart again...');
                    
                    fetchCartItems();
                    async function fetchCartItems() {
                      try {
                        const response = await fetch('/cart.js', { cache: 'no-store' });
                        if (!response.ok) {
                          throw new Error('Something is wrong...');
                        }
                        const cart = await response.json();
                        //console.log('Cart:', cart);

                        // -------- START Check if any item in the cart has "Powder" as a variant option ------
                        const productInCart_powder = cart.items.some(item => {
                          // Check if the variant_options array exist
                          if (item.variant_options) {
                            // Use .some() on the options array to check for a specific option value
                            return item.variant_options.some(option => option === 'Powder');
                          } else {
                            // No variant or options array found for this item
                            console.log('NO we DONT have variant options..');
                          }
                        });

                        if (productInCart_powder) {
                          console.log('The cart contains at least one item with "Powder" as a variant option...');
                          // Perform actions based on this condition

                            // -------- START CHECK IF CART ALREADY HAS FLAVOUR ------
                            var productInCart_flavour = cart.items.some(item => item.product_type === 'flavour');
                            //var productInCart_vanilla = cart.items.some(item => item.product_id === 9028972413180);
                            if (productInCart_flavour) {
                              //console.log(`Flavour Product is in the cart...`);
                              return true;
                            } else {
                              setTimeout(function(){
                              // var flavour_modal_button = document.getElementById('click_flavour_modal_cart');
                              // flavour_modal_button.click();
                                var main_flavour_modal = document.getElementById('flavour_modal');
                                // Set CSS properties directly
                                if (main_flavour_modal) {
                                  //console.log('Main flavour modal...');
                                  console.log("opening main flavour modal from product-form.js...");
                                  main_flavour_modal.style.visibility = 'visible';
                                  main_flavour_modal.style.zIndex = '99999';
                                  main_flavour_modal.style.opacity = '1';
                                  main_flavour_modal.style.display = 'flex';
                                }
                                var product_flavour_modal = document.getElementById('flavour_modal_product');
                                // Set CSS properties directly
                                if (product_flavour_modal) {
                                  //console.log('Product flavour modal...');
                                  console.log("opening product flavour modal from product-form.js...");
                                  product_flavour_modal.style.visibility = 'visible';
                                  product_flavour_modal.style.zIndex = '99999';
                                  product_flavour_modal.style.opacity = '1';
                                  product_flavour_modal.style.display = 'flex';
                                }
                                }, 1500);
                            }
                            // -------- END CHECK IF CART ALREADY HAS FLAVOUR ------

                        } else {
                          console.log('No item in the cart has a "Powder" variant option...');
                        }
                        // -------- END Check if any item in the cart has "Powder" as a variant option ------




                        ////console.log('Cart:', cart);
                        if (!cart.items || cart.items.length === 0) {
                          console.log('Empty cart, refetching...');
                          return await fetchCartItems();
                        }
                        return cart;
                      } catch (error) {
                        console.error('Fetch error:', error);
                      }
                    }


                }
              } catch (error) {
                console.error('Error fetching cart data:', error);
                return false;
              }
            }
            // Example usage:
            // Replace 1234567890 with the actual product ID you want to check
            //checkIfProductIsInCart(9028977492220);
            checkIfProductIsInCart();
            // Perform actions for a cart with items (e.g., show cart contents)
          })
          .catch(error => {
            console.error('Error fetching cart data:', error);
          });
          // ------------------------ END CHECK CART AND OPEN FLAVOUR MODAL ------------------------
        } else {
          //alert('Live Server!');
          var new_route = `${routes.cart_add_url}`;
          // ------------------------ START CHECK CART AND OPEN FLAVOUR MODAL ------------------------
          //console.log('Fetch cart items and check contents...');
          fetch('/cart.js')
          .then(response => response.json())
          .then(cart => {
            // Check if the cart is empty
            if (!cart.items || cart.items.length === 0) {
              //console.log('Cart is empty!');
              // Perform actions for an empty cart (e.g., hide elements, display empty cart message)
            } else {
              console.log('Cart has items.');
             // console.log('Cart:', cart);
            }
            
            // async function checkIfProductIsInCart(productIdToCheck) {
            async function checkIfProductIsInCart() {
              try {
                var response = await fetch('/cart.js');
                var cart = await response.json();
        
                var productInCart_flavour = cart.items.some(item => item.product_type === 'flavour');
                //var productInCart_vanilla = cart.items.some(item => item.product_id === 9028972413180);
                if (productInCart_flavour) {
                    //console.log(`Flavour Product is in the cart...`);
                    return true;
                } else {
                    // console.log(`Product with ID ${productIdToCheck} is NOT in the cart...`);
                    // console.log(`NO FLAVOURS in the cart...`);
                    // console.log('Checking cart again...');
                    
                    fetchCartItems();
                    async function fetchCartItems() {
                      try {
                        const response = await fetch('/cart.js', { cache: 'no-store' });
                        if (!response.ok) {
                          throw new Error('Something is wrong...');
                        }
                        const cart = await response.json();
                        //console.log('Cart:', cart);

                        // -------- START Check if any item in the cart has "Powder" as a variant option ------
                        const productInCart_powder = cart.items.some(item => {
                          // Check if the variant_options array exist
                          if (item.variant_options) {
                            // Use .some() on the options array to check for a specific option value
                            return item.variant_options.some(option => option === 'Powder');
                          } else {
                            // No variant or options array found for this item
                            console.log('NO we DONT have variant options..');
                          }
                        });

                        if (productInCart_powder) {
                          console.log('The cart contains at least one item with "Powder" as a variant option...');
                          // Perform actions based on this condition

                            // -------- START CHECK IF CART ALREADY HAS FLAVOUR ------
                            var productInCart_flavour = cart.items.some(item => item.product_type === 'flavour');
                            //var productInCart_vanilla = cart.items.some(item => item.product_id === 9028972413180);
                            if (productInCart_flavour) {
                              //console.log(`Flavour Product is in the cart...`);
                              return true;
                            } else {
                              setTimeout(function(){
                              // var flavour_modal_button = document.getElementById('click_flavour_modal_cart');
                              // flavour_modal_button.click();
                                var main_flavour_modal = document.getElementById('flavour_modal');
                                // Set CSS properties directly
                                if (main_flavour_modal) {
                                  //console.log('Main flavour modal...');
                                  console.log("opening main flavour modal from product-form.js...");
                                  main_flavour_modal.style.visibility = 'visible';
                                  main_flavour_modal.style.zIndex = '99999';
                                  main_flavour_modal.style.opacity = '1';
                                  main_flavour_modal.style.display = 'flex';
                                }
                                var product_flavour_modal = document.getElementById('flavour_modal_product');
                                // Set CSS properties directly
                                if (product_flavour_modal) {
                                  //console.log('Product flavour modal...');
                                  console.log("opening product flavour modal from product-form.js...");
                                  product_flavour_modal.style.visibility = 'visible';
                                  product_flavour_modal.style.zIndex = '99999';
                                  product_flavour_modal.style.opacity = '1';
                                  product_flavour_modal.style.display = 'flex';
                                }
                                }, 1500);
                            }
                            // -------- END CHECK IF CART ALREADY HAS FLAVOUR ------

                        } else {
                          console.log('No item in the cart has a "Powder" variant option...');
                        }
                        // -------- END Check if any item in the cart has "Powder" as a variant option ------




                        ////console.log('Cart:', cart);
                        if (!cart.items || cart.items.length === 0) {
                          console.log('Empty cart, refetching...');
                          return await fetchCartItems();
                        }
                        return cart;
                      } catch (error) {
                        console.error('Fetch error:', error);
                      }
                    }


                }
              } catch (error) {
                console.error('Error fetching cart data:', error);
                return false;
              }
            }
            // Example usage:
            // Replace 1234567890 with the actual product ID you want to check
            //checkIfProductIsInCart(9028977492220);
            checkIfProductIsInCart();
            // Perform actions for a cart with items (e.g., show cart contents)
          })
          .catch(error => {
            console.error('Error fetching cart data:', error);
          });
          // ------------------------ END CHECK CART AND OPEN FLAVOUR MODAL ------------------------
        }
        //alert(`${routes.cart_add_url}`);
        // const local_add_to_cart = "http://127.0.0.1:9292/cart/add/";
        // fetch(local_add_to_cart, config)

        fetch(new_route, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);
              //alert(response.description);
              const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
              if (!soldOutMessage) return;
              this.submitButton.setAttribute('aria-disabled', true);
              this.submitButtonText.classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            } else if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }

            if (!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                cartData: response,
              });
            this.error = false;
            const quickAddModal = this.closest('quick-add-modal');
            if (quickAddModal) {
              document.body.addEventListener(
                'modalClosed',
                () => {
                  setTimeout(() => {
                    this.cart.renderContents(response);
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              this.cart.renderContents(response);
            }
            var flavour_modal_button = document.getElementById('flavour_popup__close');
            flavour_modal_button.click();
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove('loading');
            if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
            if (!this.error) this.submitButton.removeAttribute('aria-disabled');
            this.querySelector('.loading__spinner').classList.add('hidden');
          });
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text) {
        if (disable) {
          this.submitButton.setAttribute('disabled', 'disabled');
          if (text) this.submitButtonText.textContent = text;
        } else {
          this.submitButton.removeAttribute('disabled');
          this.submitButtonText.textContent = window.variantStrings.addToCart;
        }
      }

      get variantIdInput() {
        return this.form.querySelector('[name=id]');
      }
    }
  );
}
