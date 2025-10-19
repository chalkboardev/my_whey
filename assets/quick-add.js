if (!customElements.get('quick-add-modal')) {
  customElements.define(
    'quick-add-modal',
    class QuickAddModal extends ModalDialog {
      constructor() {
        super();
        this.modalContent = this.querySelector('[id^="QuickAddInfo-"]');

        this.addEventListener('product-info:loaded', ({ target }) => {
          target.addPreProcessCallback(this.preprocessHTML.bind(this));
        });
      }

      hide(preventFocus = false) {
        const cartNotification = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        if (cartNotification) cartNotification.setActiveElement(this.openedBy);
        this.modalContent.innerHTML = '';

        if (preventFocus) this.openedBy = null;
        super.hide();
      }

      show(opener) {
        opener.setAttribute('aria-disabled', true);
        opener.classList.add('loading');
        opener.querySelector('.loading__spinner').classList.remove('hidden');
        console.log('rendering product quick modal from quick-add.js'); 

        
        // var this_modal_id = $(this).attr('id');
        // // alert(this_modal_id);
        // let variantId = this_modal_id.replace("QuickAdd-", "");
        // console.log("From quick-add.js - Selected Variant ID is: " + variantId);
        // const productSections = document.querySelectorAll(`section[data-variant-id="${variantId}"]`);
        // //  productSections.removeClass('shopify_subscriptions_app_block--hidden');
        // // $(productSections).removeClass('shopify_subscriptions_app_block--hidden');
        // $("section[data-variant-id='" + variantId + "']").removeClass("shopify_subscriptions_app_block--hidden");

        setTimeout(function(){
          // ------- USE THIS WITH PRODUCT-INFO.JS SCRIPT THIS TO DISPLAY LOADING DIV WHILST CHANGING VARIANTS 1 of 2 ---------
          setTimeout(function(){
            var loading_div = document.querySelector('.loading_subscription');
            loading_div.style.display = 'none';
            var elementsToHide = document.querySelectorAll('.shopify-block');
            elementsToHide.forEach(element => {
              element.classList.remove('hide_element');
              //element.innerHTML = 'none';
            });
          }, 1000);

            var containers = document.querySelectorAll('.shopify_subscriptions_app_block_label');

            containers.forEach(container => {

                container.addEventListener('click', function(event) {
                  //e.preventDefault();
                  //e.stopPropagation();
                  const clickedElement = event.target;
                  //alert(clickedElement.tagName);
                  if (clickedElement.tagName === 'INPUT') {
                      console.log("Element clicked was an INPUT: ", clickedElement);
                      // You can now access properties of clickedElement, e.g., clickedElement.id, clickedElement.value
                  }
                 
                  //const inputElements = container.querySelectorAll('input');
                  
                    var targetElement = clickedElement.querySelector('input'); // Select by class, ID, tag, etc.
                    if (targetElement) {
                      console.log("Found the target input: ", targetElement);
                      //targetElement.parentNode.parentNode.parentNode.parentNode.previousSibling.remove();
                      targetElement.checked = true;

                      //const content = targetElement.textContent; // Or targetElement.innerHTML
                      const variant_price = targetElement.getAttribute('data-variant-price');
                      const selling_plan_id = targetElement.getAttribute('data-selling-plan-id');
                      const selling_plan_adjustment = targetElement.getAttribute('data-selling-plan-adjustment');
                      const variant_compare_at_price = targetElement.getAttribute('data-variant-compare-at-price');
                      // console.log('Content of element variant_price: ' + variant_price);
                      // console.log('Content of element selling_plan_id: ' + selling_plan_id);
                      // console.log('Content of element selling_plan_adjustment: ' + selling_plan_adjustment);
                      // console.log('Content of element variant_compare_at_price: ' + variant_compare_at_price);

                        // const closestForm = container.closest('.shopify_subscriptions_app_block:not(.shopify_subscriptions_app_block--hidden)');

                        // if (closestForm) {
                        //   console.log('Found the closest active shopify_subscriptions_app_block section:', closestForm);
                        //   // You can now work with the found form element
                        //   // For example, get its data-type attribute:
                        //   var dataType = closestForm.getAttribute('data-variant-id');
                        //   //console.log('Data-variant-id of the form:' + dataType);
                        // } else {
                        //   //console.log('No closest form with data-type="add-to-cart-form" found.');
                        // }

                        var closestProductInfo = container.closest('product-info');
                        if (closestProductInfo) {
                          //console.log('Found the closest ProductInfo:', closestProductInfo);
                          // You can now work with the found form element
                          // For example, get its data-type attribute:
                          //const dataTypeProduct = closestProductInfo.getAttribute('data-product-id');
                          //console.log('data-product-id of the form:' + dataTypeProduct);

                          // ---------------------------------------- ******* START CHECK IF ITEM ON SALE ******* ---------------------------------------------
                          var closestPriceRegular = closestProductInfo.querySelector('.price__container .price__regular');

                          var closestConsent = closestProductInfo.querySelector('#shopify-buyer-consent');
                          
                          if(targetElement.getAttribute('data-radio-type') == 'one_time_purchase'){
                            if(closestConsent){
                                closestConsent.style.display = "none";
                            }
                            //alert('One time!');
                          } else {
                            closestConsent.style.display = "inline-block";
                          }
                          //console.log(closestPriceRegular.checkVisibility());
                          if (closestPriceRegular && !closestPriceRegular.checkVisibility()) {
                            // -------------------- ******* START ITEM IS ON SALE ******* -------------------------
                              console.log('THIS ITEM IS ON SALE'); 
                              var closestPrice = closestProductInfo.querySelector('.price__container .price-item--sale .heighten_me');
                              
                              if (closestPrice) {
                                //console.log('Found the closest SALE Price:', closestPrice);
                                var closestRegularPriceBadgePrice = closestProductInfo.querySelector('.my_normal_price');
                                closestRegularPriceBadgePrice.innerHTML = variant_compare_at_price;
                                
                                // ----- UPDATE THE BADGES -----
                                var closestRegularPriceSalesBadge = closestProductInfo.querySelector('.price__badge-sale');
                                if(targetElement.getAttribute('data-radio-type') == 'one_time_purchase'){

                                  function removeBeforeFirstSpace(str) {
                                    const firstSpaceIndex = str.indexOf(' ');
                                    if (firstSpaceIndex === -1) {
                                      // No space found, return the original string
                                      return str;
                                    } else {
                                      // Return the substring after the first space
                                      return str.slice(firstSpaceIndex + 1);
                                    }
                                  }
                                  const new_variant_compare_at_price = removeBeforeFirstSpace(variant_compare_at_price);
                                  const new_variant_price = removeBeforeFirstSpace(variant_price);
                                  var the_calc_discount = ((+new_variant_compare_at_price - +new_variant_price) / +new_variant_compare_at_price) *100;
                                  the_calc_discount = the_calc_discount.toFixed(2);
                                  // the_calc_discount = Math.floor(the_calc_discount);
                                  console.log("NEW variant_compare_at_price: " + (new_variant_compare_at_price) );
                                  console.log("Calc: " + the_calc_discount );

                                    closestRegularPriceSalesBadge.innerHTML = " " + the_calc_discount + "% LESS";
                                    closestRegularPriceSalesBadge.classList.remove('price__badge--subscription');
                                } else {
                                    closestRegularPriceSalesBadge.classList.add('price__badge--subscription');
                                    closestRegularPriceSalesBadge.innerHTML = " SUBSCRIPTION";
                                }
                                // ----- UPDATE THE PRICES -----
                                //var dataTypeProductPrice = closestPrice.innerHTML;
                                //console.log("PRICE: " + dataTypeProductPrice);
                                //console.log('Price of the form change from:' + dataTypeProductPrice + ' to: ' + variant_price);
                                closestPrice.innerHTML = variant_price;

                                // ----- UPDATE THE FIRST ADD TO CART FORM /cart/add FORM -----
                                var closestFormToAppend = closestProductInfo.querySelector('.installment');
                                if (closestFormToAppend) {
                                  //console.log('Found the closest closestFormToAppend:', closestFormToAppend);
                                  const inputToRemove = closestFormToAppend.querySelector('input[name="selling_plan"]');
                                  if (inputToRemove) {
                                    inputToRemove.parentNode.removeChild(inputToRemove);
                                  }
                                  var newInput = document.createElement('input');
                                  newInput.setAttribute('type', 'hidden');
                                  newInput.setAttribute('name', 'selling_plan');
                                  //newInput.setAttribute('placeholder', 'Enter value');
                                  newInput.classList.add('selected-selling-plan-id');
                                  newInput.value = selling_plan_id;
                                  closestFormToAppend.appendChild(newInput);
                                } else {
                                  console.log('Couldnt find closestFormToAppend');
                                }

                                // ----- UPDATE THE SECOND 'ADD TO CART' BUTTON FORM /cart/add FORM -----
                                var closestAddCartFormToAppend = closestProductInfo.querySelector('form[data-type="add-to-cart-form"]');
                                if (closestAddCartFormToAppend) {
                                  //console.log('Found the closest closestAddCartFormToAppend:', closestAddCartFormToAppend);
                                  const inputToRemove = closestFormToAppend.querySelector('input[name="selling_plan"]');
                                  if (inputToRemove) {
                                    inputToRemove.parentNode.removeChild(inputToRemove);
                                  }
                                  var newInput = document.createElement('input');
                                  newInput.setAttribute('type', 'hidden');
                                  newInput.setAttribute('name', 'selling_plan');
                                  //newInput.setAttribute('placeholder', 'Enter value');
                                  newInput.classList.add('selected-selling-plan-id');
                                  newInput.value = selling_plan_id;
                                  closestAddCartFormToAppend.appendChild(newInput);
                                } else {
                                  console.log('Couldnt find closestAddCartFormToAppend...');
                                }

                              } else {
                                console.log('No price element found.');
                              }
                          } else if (closestPriceRegular && closestPriceRegular.checkVisibility()) {
                             // -------------------- ******* START ITEM IS NOT ON SALE ******* -------------------------
                             console.log('THIS ITEM IS *NOT* ON SALE'); 
                              var closestPrice = closestProductInfo.querySelector('.price__container .price-item--regular .heighten_me');
                              if (closestPrice) {
                                console.log('Found the closest REGULAR Price:', closestPrice);

                                // ----- UPDATE THE BADGES -----
                                var closestRegularPriceSalesBadge = closestProductInfo.querySelector('.price__badge-sale');
                                if(targetElement.getAttribute('data-radio-type') == 'one_time_purchase'){
                                    closestRegularPriceSalesBadge.style.display = 'none';
                                    closestRegularPriceSalesBadge.innerHTML = " SALE";
                                    closestRegularPriceSalesBadge.classList.remove('price__badge--subscription');
                                } else {
                                  closestRegularPriceSalesBadge.style.display = 'inline-block';
                                    closestRegularPriceSalesBadge.classList.add('price__badge--subscription');
                                    closestRegularPriceSalesBadge.innerHTML = " SUBSCRIPTION";
                                }
                                // ----- UPDATE THE PRICES -----
                                //var dataTypeProductPrice = closestPrice.innerHTML;
                                //console.log("PRICE: " + dataTypeProductPrice);
                                //console.log('Price of the form change from:' + dataTypeProductPrice + ' to: ' + variant_price);
                                closestPrice.innerHTML = variant_price;

                                // ----- UPDATE THE FIRST ADD TO CART FORM /cart/add FORM -----
                                var closestFormToAppend = closestProductInfo.querySelector('.installment');
                                if (closestFormToAppend) {
                                  //console.log('Found the FIRST ADD TO CART FORM - closestFormToAppend:', closestFormToAppend);
                                  const inputToRemove = closestFormToAppend.querySelector('input[name="selling_plan"]');
                                  if (inputToRemove) {
                                    inputToRemove.parentNode.removeChild(inputToRemove);
                                  }
                                  var newInput = document.createElement('input');
                                  newInput.setAttribute('type', 'hidden');
                                  newInput.setAttribute('name', 'selling_plan');
                                  //newInput.setAttribute('placeholder', 'Enter value');
                                  newInput.classList.add('selected-selling-plan-id');
                                  newInput.value = selling_plan_id;
                                  closestFormToAppend.appendChild(newInput);
                                } else {
                                  console.log('Couldnt find closestFormToAppend');
                                }

                                // ----- UPDATE THE SECOND 'ADD TO CART' BUTTON FORM /cart/add FORM -----
                                var closestAddCartFormToAppend = closestProductInfo.querySelector('form[data-type="add-to-cart-form"]');
                                if (closestAddCartFormToAppend) {
                                  //console.log('Found the SECOND ADD TO CART FORM closestAddCartFormToAppend:', closestAddCartFormToAppend);
                                  const inputToRemove = closestFormToAppend.querySelector('input[name="selling_plan"]');
                                  if (inputToRemove) {
                                    inputToRemove.parentNode.removeChild(inputToRemove);
                                  }
                                  var newInput = document.createElement('input');
                                  newInput.setAttribute('type', 'hidden');
                                  newInput.setAttribute('name', 'selling_plan');
                                  //newInput.setAttribute('placeholder', 'Enter value');
                                  newInput.classList.add('selected-selling-plan-id');
                                  newInput.value = selling_plan_id;
                                  closestAddCartFormToAppend.appendChild(newInput);
                                } else {
                                  console.log('Couldnt find closestAddCartFormToAppend...');
                                }

                              } else {
                                console.log('No price element found.');
                              }
                          } else {
                              console.log('The element does not exist.');
                          }
                          // ---------------------------------------- ******* END CHECK IF ITEM ON SALE ******* ---------------------------------------------

                        } else {
                          console.log('No closest form with data-product-id found.');
                        }

                        
                    }
                    //alert('You clicked: ' + this.textContent);
                });
            });
        $(".shopify-block.shopify-app-block.shopify_subscriptions_app_block--hidden").removeClass('shopify_subscriptions_app_block--hidden');
        //$(".shopify_subscriptions_in_widget_price").removeClass('shopify_subscriptions_app_block--hidden');
        }, 2000);

        // const productSections = document.querySelectorAll(`product-info[data-url="${variantId}"]`);

        // // You can then iterate through the selected elements or access the first one if only one is expected
        // if (productSections) {
        // console.log('FOUND IT!!!!!!');
        // }

        
        fetch(opener.getAttribute('data-product-url'))
          .then((response) => response.text())
          .then((responseText) => {
            const responseHTML = new DOMParser().parseFromString(responseText, 'text/html');
            const productElement = responseHTML.querySelector('product-info');

            this.preprocessHTML(productElement);
            HTMLUpdateUtility.setInnerHTML(this.modalContent, productElement.outerHTML);

            if (window.Shopify && Shopify.PaymentButton) {
              Shopify.PaymentButton.init();
            }
            if (window.ProductModel) window.ProductModel.loadShopifyXR();

            super.show(opener);
          })
          .finally(() => {
            opener.removeAttribute('aria-disabled');
            opener.classList.remove('loading');
            opener.querySelector('.loading__spinner').classList.add('hidden');

            // ------- USE THIS WITH PRODUCT-INFO.JS SCRIPT THIS TO DISPLAY LOADING DIV WHILST CHANGING VARIANTS 2 of 2 ---------
            var elementsToHide = document.querySelectorAll('.shopify-block');
            elementsToHide.forEach(element => {
              // element.style.display = 'none';
              element.classList.add('hide_element');
              //element.innerHTML = 'none';
            });

          });
      }

      preprocessHTML(productElement) {
        productElement.classList.forEach((classApplied) => {
          if (classApplied.startsWith('color-') || classApplied === 'gradient')
            this.modalContent.classList.add(classApplied);
        });
        this.preventDuplicatedIDs(productElement);
        this.removeDOMElements(productElement);
        this.removeGalleryListSemantic(productElement);
        this.updateImageSizes(productElement);
        this.preventVariantURLSwitching(productElement);
      }

      preventVariantURLSwitching(productElement) {
        productElement.setAttribute('data-update-url', 'false');
      }

      removeDOMElements(productElement) {
        const pickupAvailability = productElement.querySelector('pickup-availability');
        if (pickupAvailability) pickupAvailability.remove();

        const productModal = productElement.querySelector('product-modal');
        if (productModal) productModal.remove();

        const modalDialog = productElement.querySelectorAll('modal-dialog');
        if (modalDialog) modalDialog.forEach((modal) => modal.remove());
      }

      preventDuplicatedIDs(productElement) {
        const sectionId = productElement.dataset.section;

        const oldId = sectionId;
        const newId = `quickadd-${sectionId}`;
        productElement.innerHTML = productElement.innerHTML.replaceAll(oldId, newId);
        Array.from(productElement.attributes).forEach((attribute) => {
          if (attribute.value.includes(oldId)) {
            productElement.setAttribute(attribute.name, attribute.value.replace(oldId, newId));
          }
        });

        productElement.dataset.originalSection = sectionId;
      }

      removeGalleryListSemantic(productElement) {
        const galleryList = productElement.querySelector('[id^="Slider-Gallery"]');
        if (!galleryList) return;

        galleryList.setAttribute('role', 'presentation');
        galleryList.querySelectorAll('[id^="Slide-"]').forEach((li) => li.setAttribute('role', 'presentation'));
      }

      updateImageSizes(productElement) {
        const product = productElement.querySelector('.product');
        const desktopColumns = product?.classList.contains('product--columns');
        if (!desktopColumns) return;

        const mediaImages = product.querySelectorAll('.product__media img');
        if (!mediaImages.length) return;

        let mediaImageSizes =
          '(min-width: 1000px) 715px, (min-width: 750px) calc((100vw - 11.5rem) / 2), calc(100vw - 4rem)';

        if (product.classList.contains('product--medium')) {
          mediaImageSizes = mediaImageSizes.replace('715px', '605px');
        } else if (product.classList.contains('product--small')) {
          mediaImageSizes = mediaImageSizes.replace('715px', '495px');
        }

        mediaImages.forEach((img) => img.setAttribute('sizes', mediaImageSizes));
      }
    }
  );
}
