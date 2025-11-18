if (!customElements.get('product-info')) {
  var is_powder = false;
  var is_capsule = false;
  customElements.define('product-info', class ProductInfo extends HTMLElement {
    quantityInput = undefined;
    quantityForm = undefined;
    onVariantChangeUnsubscriber = undefined;
    cartUpdateUnsubscriber = undefined;
    abortController = undefined;
    pendingRequestUrl = null;
    preProcessHtmlCallbacks = [];
    postProcessHtmlCallbacks = [];

    constructor() {
      super();

      this.quantityInput = this.querySelector('.quantity__input');
    }

    connectedCallback() {
      this.initializeProductSwapUtility();

      this.onVariantChangeUnsubscriber = subscribe(PUB_SUB_EVENTS.optionValueSelectionChange, this.handleOptionValueChange.bind(this));

      this.initQuantityHandlers();
      this.dispatchEvent(new CustomEvent('product-info:loaded', {bubbles: true}));
    }

    addPreProcessCallback(callback) {
      this.preProcessHtmlCallbacks.push(callback);
    }

    initQuantityHandlers() {
      if (!this.quantityInput) return;
      


      this.quantityForm = this.querySelector('.product-form__quantity');
      if (!this.quantityForm) return;
      


      this.setQuantityBoundries();
      if (!this.dataset.originalSection) {
        this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, this.fetchQuantityRules.bind(this));
      }
    }

    disconnectedCallback() {
      this.onVariantChangeUnsubscriber();
      this.cartUpdateUnsubscriber ?. ();
    }

    initializeProductSwapUtility() {
      this.preProcessHtmlCallbacks.push((html) => html.querySelectorAll('.scroll-trigger').forEach((element) => element.classList.add('scroll-trigger--cancel')));
      this.postProcessHtmlCallbacks.push((newNode) => {
        window ?. Shopify ?. PaymentButton ?. init();
        window ?. ProductModel ?. loadShopifyXR();
      });
    }

// handleOptionValueChange({ data: { event, target, selectedOptionValues } }) {
// if (!this.contains(event.target)) return;

// this.resetProductFormState();

// const productUrl = target.dataset.productUrl || this.pendingRequestUrl || this.dataset.url;
// this.pendingRequestUrl = productUrl;
// const shouldSwapProduct = this.dataset.url !== productUrl;
// const shouldFetchFullPage = this.dataset.updateUrl === 'true' && shouldSwapProduct;

// this.renderProductInfo({
// requestUrl: this.buildRequestUrlWithParams(productUrl, selectedOptionValues, shouldFetchFullPage),
// targetId: target.id,
// callback: shouldSwapProduct
// ? this.handleSwapProduct(productUrl, shouldFetchFullPage)
// : this.handleUpdateProductInfo(productUrl),
// });
// }

    handleOptionValueChange({
      data: {
        event,
        target,
        selectedOptionValues
      }
    }) {
      if (!this.contains(event.target)) return;
      


      this.resetProductFormState();

// console.log($(event.target).val());

// ---- START get specific pill option clicked -----
// alert(selectedOptionValues);
      var pill_name = $(event.target)
        .next()
        .contents()
        .filter(function() {
          return this.nodeType === 3;
        })
        .text()
        .trim();

// alert("Pill name: " + pill_name);
      if (pill_name == 'Powder') {
        is_powder = true;
        is_capsule = false;
// alert('Powder Clicked...');
// alert($(event.target)[0].nodeName);
// //$(event.target).nextAll("label").next().first().remove();
// $('input[name*="Size-2"]')[0].click();
      } else if (pill_name == 'Capsule') {
        console.log('Capsule Clicked...');

// $('input[name*="Size-2"]')[0].click();
        is_powder = false;
        is_capsule = true;
      } else {

// this.dataset.url = this.dataset.url;
// var productUrl = this.dataset.url ;
      }
      
      this.dataset.url = this.dataset.url;
      var productUrl = this.dataset.url;

// ---- END get specific pill option clicked -----

      productUrl = target.dataset.productUrl || this.pendingRequestUrl || this.dataset.url;
      this.pendingRequestUrl = productUrl;
      const shouldSwapProduct = this.dataset.url !== productUrl;
      const shouldFetchFullPage = this.dataset.updateUrl === 'true' && shouldSwapProduct;


      this.renderProductInfo({
        requestUrl: this.buildRequestUrlWithParams(productUrl, selectedOptionValues, shouldFetchFullPage),
        targetId: target.id,
        callback: shouldSwapProduct
          ? this.handleSwapProduct(productUrl, shouldFetchFullPage)
          : this.handleUpdateProductInfo(productUrl)
      });

// // $(".price").html('<div class="price__container animate_it"><div class="price__regular">...</div></div>');
// $(".product_icons").next().html('<div class="price__container"><div class="price__regular"><span class="fetching_price">Price loading </span><img class="gif_price_pad" width="16" src="https://cdn.shopify.com/s/files/1/0713/8685/7724/files/loader.gif?v=1743590298" /></div></div>');
    }
    
    resetProductFormState() {
      const productForm = this.productForm;
      productForm ?. toggleSubmitButton(true);
      productForm ?. handleErrorMessage();
    }

    handleSwapProduct(productUrl, updateFullPage) {
      return(html) => {
        this.productModal ?. remove();

        const selector = updateFullPage
          ? "product-info[id^='MainProduct']"
          : 'product-info';
        const variant = this.getSelectedVariant(html.querySelector(selector));
        this.updateURL(productUrl, variant ?. id);

        if (updateFullPage) {
          document.querySelector('head title').innerHTML = html.querySelector('head title').innerHTML;

          HTMLUpdateUtility.viewTransition(document.querySelector('main'), html.querySelector('main'), this.preProcessHtmlCallbacks, this.postProcessHtmlCallbacks);
        } else {
          HTMLUpdateUtility.viewTransition(this, html.querySelector('product-info'), this.preProcessHtmlCallbacks, this.postProcessHtmlCallbacks);
        }
      };
    }

    renderProductInfo({requestUrl, targetId, callback}) {
      

// $(".price").html('zzz...');
// alert('hello');
// ------- USE THIS WITH QUICK-ADD.JS SCRIPT TO DISPLAY LOADING DIV WHILST CHANGING VARIANTS ---------
      const myElement = document.getElementById('loading_subscription_div'); // Or document.querySelector('.some-class');
      if (myElement) {
        if (myElement.classList.contains('not_subscription')) { // The element has 'my-class-name'
          console.log('Product is not subscription, dont show loader!');
        } else { // The element does not have 'my-class-name'
          console.log('Product IS SUBSCRIPTION, yes show loader!');
          var loading_div = document.querySelector('.loading_subscription');
          loading_div.style.display = 'flex';
          var elementsToHide = document.querySelectorAll('.shopify-block');
          elementsToHide.forEach(element => {
            element.classList.add('hide_element');

// element.innerHTML = 'none';
          });
        }
      } else { 
        //
      }
      
      this.abortController ?. abort();
      this.abortController = new AbortController();

      fetch(requestUrl, {signal: this.abortController.signal})
        .then((response) => response.text())
        .then((responseText) => {
          this.pendingRequestUrl = null;
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          callback(html);
        })
        .then(() => {

  // set focus to last clicked option value
  // console.log('Focused new variant...');
          document.querySelector(`#${targetId}`) ?. focus();
        })
        .catch((error) => {
          if (error.name === 'AbortError') {
            console.log('Fetch aborted by user');
          } else {
            console.error(error);
          }
        });
    }

    getSelectedVariant(productInfoNode) {
      const selectedVariant = productInfoNode.querySelector('variant-selects [data-selected-variant]') ?. innerHTML;
      return !! selectedVariant
        ? JSON.parse(selectedVariant)
        : null;
    }

    

    buildRequestUrlWithParams(url, optionValues, shouldFetchFullPage = false) {
      const params = [];

      !shouldFetchFullPage && params.push(`section_id=${
        this.sectionId
      }`);

      if (optionValues.length) {
        params.push(`option_values=${
          optionValues.join(',')
        }`);
      }

      return `${url}?${
        params.join('&')
      }`;
    }

    updateOptionValues(html) {

// $(".price").html('<div class="price__container animate_it"><div class="price__regular">...</div></div>');
// $(".product_icons").next().html('<div class="gif_price_pad price__container"><div class="price__regular"><span class="fetching_price">Price loading </span><img width="16" src="https://cdn.shopify.com/s/files/1/0713/8685/7724/files/loader.gif?v=1743590298" /></div></div>');
      const variantSelects = html.querySelector('variant-selects');
      if (variantSelects) {
        HTMLUpdateUtility.viewTransition(this.variantSelectors, variantSelects, this.preProcessHtmlCallbacks);
      }
    }

    handleUpdateProductInfo(productUrl) {

// $(".price").css('background','#333');

      return(html) => {
        const variant = this.getSelectedVariant(html);

 //alert("Variant NAME: " + variant?.name);
// console.log("Variant NAME: " + variant);
        this.pickupAvailability ?. update(variant);
        this.updateOptionValues(html);
        this.updateURL(productUrl, variant ?. id);
        this.updateVariantInputs(variant ?. id);

        if (! variant) {
          this.setUnavailable();
          return;
        }

// -------------- START CHANGE THE META INFO / IMAGE WHEN VARIANT OPTION CHANGED --------------
       //alert("VARANT ID: " + variant ?. id);
      //const metafieldDestination = document.getElementById('selected-variant-metafield-text');
      const metafieldImgDestination = document.getElementById('product_supp_info_img_meta');
      if (metafieldImgDestination) {
        const selectedVariantId = variant ?. id;
        //const allMetafieldSources = document.querySelectorAll('.variant-metafield-text');
        const allMetafieldImgSources = document.querySelectorAll('.variant_metafield_img_src');
        // allMetafieldSources.forEach(source => {
        //   if (source.dataset.variantId == selectedVariantId) {
        //     metafieldDestination.innerHTML = source.innerHTML;
        //   }
        // });
        allMetafieldImgSources.forEach(source_imgs => {
          if (source_imgs.dataset.variantId == selectedVariantId) {
            if(source_imgs.innerHTML.trim() == ""){
              //metafieldImgDestination.classList.add('hide_image'); 
            } else {
              metafieldImgDestination.classList.remove('hide_image'); 
            }
            metafieldImgDestination.src = "/cdn/shop/" + source_imgs.innerHTML.trim();
          }
        });
      }
// -------------- END CHANGE THE META INFO / IMAGE WHEN VARIANT OPTION CHANGED --------------

        this.updateMedia(html, variant ?. featured_media ?. id);

        const updateSourceFromDestination = (id, shouldHide = (source) => false) => {
          const source = html.getElementById(`${id}-${
            this.sectionId
          }`);
          const destination = this.querySelector(`#${id}-${
            this.dataset.section
          }`);
          if (source && destination) {
            destination.innerHTML = source.innerHTML;
            destination.classList.toggle('hidden', shouldHide(source));
          }
        };

        updateSourceFromDestination('price');
        updateSourceFromDestination('Sku', ({classList}) => classList.contains('hidden'));
        updateSourceFromDestination('Inventory', ({innerText}) => innerText === '');
        updateSourceFromDestination('Volume');
        updateSourceFromDestination('Price-Per-Item', ({classList}) => classList.contains('hidden'));

        this.updateQuantityRules(this.sectionId, html);
        this.querySelector(`#Quantity-Rules-${
          this.dataset.section
        }`) ?. classList.remove('hidden');
        this.querySelector(`#Volume-Note-${
          this.dataset.section
        }`) ?. classList.remove('hidden');

        this.productForm ?. toggleSubmitButton(html.getElementById(`ProductSubmitButton-${
          this.sectionId
        }`) ?. hasAttribute('disabled') ?? true, window.variantStrings.soldOut);

// ------- USE THIS WITH QUICK-ADD.JS SCRIPT TO DISPLAY LOADING DIV WHILST CHANGING VARIANTS ---------
        var loading_div = document.querySelector('.loading_subscription');
        loading_div.style.display = 'none';
        var elementsToHide = document.querySelectorAll('.shopify-block');
        elementsToHide.forEach(element => {
          element.classList.remove('hide_element');

// element.innerHTML = 'none';
        });

        publish(PUB_SUB_EVENTS.variantChange, {
          data: {
            sectionId: this.sectionId,
            html,
            variant
          }
        });
      };
    }

    updateVariantInputs(variantId) {

// alert(variantId);
// Remove the most_popular div
      const elementsToRemove = document.querySelectorAll('.most_popular');
      elementsToRemove.forEach(element => {
        element.remove();
      });

      const elementsToRemoveSections = document.querySelectorAll(`section .shopify_subscriptions_app_block`);
      elementsToRemoveSections.forEach(element => {
        element.classList.add('shopify_subscriptions_app_block--hidden');
      });


// Select all section elements where the 'data-category' attribute equals 'products'
      const productSections = document.querySelectorAll(`section[data-variant-id="${variantId}"]`);

      var productSection = document.querySelector(`section[data-variant-id="${variantId}"]`);
      if (productSection) {
        productSection.classList.remove('shopify_subscriptions_app_block--hidden');
      }


// const previousSibling = productSection.previousElementSibling;
// previousSibling.classList.add('shopify_subscriptions_app_block--hidden');
// // Get the parent element
// const parentElement = productSection.parentNode;
// // Get the parent of the parent element
// const grandparentElement = parentElement.parentNode;
// grandparentElement.classList.remove('shopify_subscriptions_app_block--hidden');


// You can then iterate through the selected elements or access the first one if only one is expected
      if (productSections) {
        productSections.forEach(section => {

// console.log("Found a product section:" + variantId );
          console.log("Variant " + variantId + " is displaying...");

          var closestForm = productSection.closest('.shopify_subscriptions_app_container .shopify_subscriptions_app_block:not(.shopify_subscriptions_app_block--hidden)');
          if (closestForm) {
            console.log('Found the closest active shopify_subscriptions_app_block section:', closestForm);
            var inputContainer = closestForm.querySelectorAll('.shopify_subscriptions_app_block_label label input')[0];
            if (inputContainer) {
              console.log('Found the closest inputcontainer', inputContainer);
              inputContainer.checked = true;
              inputContainer.click();
              
              var single_price_is = inputContainer.getAttribute('data-variant-price');
              single_price_is = single_price_is.substring(single_price_is.indexOf("R ") + 1).trim();
              single_price_is = single_price_is.replace(/,/g, ""); // Remove all commas
              single_price_is = parseFloat(single_price_is);
              console.log('SINGLE PRICE IS:' + single_price_is); 


                            //       // ----- START RESET THE LAST BLOCKS PRICING WHEN ANY OTHER PANDA BLOCKS ARE CLICKED -----
                                  var the_blocks_in_panda = document.querySelectorAll('.pb-6b5d');
                                  // Check if any elements were found
                                  if (the_blocks_in_panda.length > 0) {
                                        // Access the last element in the NodeList
                                        var lastElement_is = the_blocks_in_panda[the_blocks_in_panda.length - 1];
                                        var reset_last_block_totals = +single_price_is;
                                        var the_discount_here = $(lastElement_is).find('.money').eq(0).html();
                                        
                                        var the_percentage_off_4thBlck = $(lastElement_is).find('.pb-1856').eq(0).html();
                                        var symbolToFind_4thBlck = "%"
                                        var symbolIndex_4thBlck = the_percentage_off_4thBlck.indexOf(symbolToFind_4thBlck);
                                        if (symbolIndex_4thBlck !== -1 && symbolIndex_4thBlck >= 2) {
                                            var startIndex_4thBlck = symbolIndex_4thBlck - 2;
                                            var get_percent = the_percentage_off_4thBlck.substring(startIndex_4thBlck, symbolIndex_4thBlck);
                                            get_percent = +get_percent;
                                            console.log("The two characters before the symbol are:", get_percent);
                                        } else if (symbolIndex_4thBlck !== -1 && symbolIndex_4thBlck < 2) {
                                            //console.log("The symbol is found, but there are not enough characters before it.");
                                        } else {
                                            //console.log("The symbol was not found in the string.");
                                        }

                                        var original_pricing = (single_price_is*4).toFixed(2);
                                        var discounted_new = (original_pricing - (original_pricing*(get_percent/100)) ).toFixed(2);

                                        $(lastElement_is).find('.money').eq(0).html("R " + discounted_new);
                                        $(lastElement_is).find('.money').eq(1).html("R " + original_pricing);
                                        //$(lastElement).find('.money').eq(1).html("R " + original_pricing.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                                        //console.log("The last element with class 'pb-6b5d' is:", lastElement);
                                  } else {
                                    console.log("No elements with 'pb-6b5d' were found.");
                                  }
                            //       // ----- END RESET THE LAST BLOCKS PRICING WHEN ANY OTHER PANDA BLOCKS ARE CLICKED -----


              var panda_elementsStartingWith = document.querySelectorAll('[id^="offers-list-container-"]');
              if (panda_elementsStartingWith.length > 0) {
                // At least one element with "your-class-name" is visible
              console.log("YES An element with id that contains 'offers-list-container-' is visible.");
              //console.log(panda_elementsStartingWith);
              $(panda_elementsStartingWith).children().children().children().each(function() {
                      $(this).click(function() {
                            // ----- FIND WHICH PANDA BLOCK IS CLICKED -----
                            var the_block_single_name_is = $(this).find('.pb-56aa').html().toLowerCase();
                            console.log('The block title IS:' + the_block_single_name_is);
                            if(the_block_single_name_is == "single" || the_block_single_name_is == "buy 1"){
                                var use_quantity = 1;
                            } else if(the_block_single_name_is == "buy 2"){
                                var use_quantity = 2;
                            } else if(the_block_single_name_is == "buy 3"){
                                var use_quantity = 3;
                            } else if(the_block_single_name_is == "buy 4+"){
                                var use_quantity = 4;
                            }

                            if(use_quantity == 4){
                                  //console.log('clicked on last block...dont clear');
                            } else {
                                  //console.log('Did NOT click on last block...proceed to clear');
                                  // ----- START RESET THE LAST BLOCKS PRICING WHEN ANY OTHER PANDA BLOCKS ARE CLICKED -----
                                  var the_blocks_in_panda = document.querySelectorAll('.pb-6b5d');
                                  // Check if any elements were found
                                  if (the_blocks_in_panda.length > 0) {
                                        // Access the last element in the NodeList
                                        var lastElement_is = the_blocks_in_panda[the_blocks_in_panda.length - 1];
                                        var reset_last_block_totals = +single_price_is;
                                        var the_discount_here = $(lastElement_is).find('.money').eq(0).html();
                                        
                                        var the_percentage_off_4thBlck = $(lastElement_is).find('.pb-1856').eq(0).html();
                                        var symbolToFind_4thBlck = "%"
                                        var symbolIndex_4thBlck = the_percentage_off_4thBlck.indexOf(symbolToFind_4thBlck);
                                        if (symbolIndex_4thBlck !== -1 && symbolIndex_4thBlck >= 2) {
                                            var startIndex_4thBlck = symbolIndex_4thBlck - 2;
                                            var get_percent = the_percentage_off_4thBlck.substring(startIndex_4thBlck, symbolIndex_4thBlck);
                                            get_percent = +get_percent;
                                            console.log("The two characters before the symbol are:", get_percent);
                                        } else if (symbolIndex_4thBlck !== -1 && symbolIndex_4thBlck < 2) {
                                            //console.log("The symbol is found, but there are not enough characters before it.");
                                        } else {
                                            //console.log("The symbol was not found in the string.");
                                        }

                                        var original_pricing = (single_price_is*4).toFixed(2);
                                        var discounted_new = (original_pricing - (original_pricing*(get_percent/100)) ).toFixed(2);

                                        $(lastElement_is).find('.money').eq(0).html("R " + discounted_new);
                                        $(lastElement_is).find('.money').eq(1).html("R " + original_pricing);
                                        //$(lastElement).find('.money').eq(1).html("R " + original_pricing.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                                        //console.log("The last element with class 'pb-6b5d' is:", lastElement);
                                  } else {
                                    console.log("No elements with 'pb-6b5d' were found.");
                                  }
                                  // ----- END RESET THE LAST BLOCKS PRICING WHEN ANY OTHER PANDA BLOCKS ARE CLICKED -----
                            }

                      });
              });
              const firstContainer = panda_elementsStartingWith[0];
              // 3. Select the first input within that container
              const firstInputInContainer = firstContainer.querySelector('input');
              firstInputInContainer.click();
              const updateCurrentValue = $('.quantity__input').val(1);

              // const click_first_input = panda_elementsStartingWith.querySelector('input');
              // var click_first_input = panda_elementsStartingWith.querySelector('input');
              // click_first_input.click();
              } else {
                console.log("NO element with id that contains 'offers-list-container-' is visible.");
              }

            } else {
              console.log('DIDNT FIND the closest...');
            }

          } else {
            console.log('COULDNT find the closest active shopify_subscriptions_app_block section:');
          }


          const elementsWithClass = section.querySelectorAll('.shopify_subscriptions_app_block_label'); // Replace 'myClassName' with the actual class
          const secondElement = elementsWithClass[1];

          const newSpan = document.createElement('span');
          newSpan.id = "most_popular";
          newSpan.classList.add("most_popular");
          newSpan.classList.add("color-scheme-5");
          newSpan.classList.add("gradient");
          newSpan.textContent = 'Most Popular';

          secondElement.prepend(newSpan);

          const childElement = document.getElementById('most_popular'); // Replace 'yourChildId' with the actual ID of your element
          const parentElement = childElement.parentNode;
          const grandparentElement = parentElement.parentNode;

          if (grandparentElement) { // const grandparentId = grandparentElement.id;
            grandparentElement.id = 'mw_subscription_block';

// console.log('Grandparent ID:', grandparentElement.id);
          } else { // console.log('No grandparent found.');
          }

          let img = document.createElement("img");
          img.src = "https://cdn.shopify.com/s/files/1/0713/8685/7724/files/thumb_1.png?v=1754842951"; // Replace with your image path
          img.alt = "Popular Icon"; // Provide descriptive alt text
          img.classList.add('popular_icon');
          img.width = 9; // Optional: set image width
          img.height = 9; // Optional: set image height
          img.style.right = '2px';
          newSpan.prepend(img);

          var elements = document.getElementsByClassName("shopify_subscriptions_app_policy");
          for (var i = 0; i < elements.length; i++) {
                //Or elements[i].textContent = "<strong>New HTML</strong>";
                elements[i].innerHTML = "Subscription auto-renews | <span class='click_shopify-subscription-policy-button'>Cancellation Policy</span>";
                elements[i].addEventListener('click', function() {
                    console.log('Cancellation Policy clicked (main-profuct.liquid)');
                    const cancel_policy_div = document.getElementById('cancellation_policy');
                    const bodyElement = document.body;
                    cancel_policy_div.style.background = 'rgb(0 0 0 / 50%)';
                    cancel_policy_div.style.opacity = '1';
                    cancel_policy_div.style.zIndex = '999';
                    cancel_policy_div.style.visibility = 'visible';
                    //cancel_policy_div.style.alignItems = 'center';
                    bodyElement.classList.add('preventBodyScroll');
                });
          }

        });
      } else {
        console.log("Not found a product variant:" + variantId);
      }

// alert("Variant ID: " + variantId);
      this.querySelectorAll(`#product-form-${
        this.dataset.section
      }, #product-form-installment-${
        this.dataset.section
      }`).forEach((productForm) => {
        const input = productForm.querySelector('input[name="id"]');
        input.value = variantId ?? '';
        input.dispatchEvent(new Event('change', {bubbles: true}));
      });
    }

    updateURL(url, variantId) {

// console.log(`${window.shopUrl}${url}${variantId ? `?variant=${variantId}` : ''}`);
      this.querySelector('share-button') ?. updateUrl(`${
        window.shopUrl
      }${url}${
        variantId
          ? `?variant=${variantId}`
          : ''
        }`);

      if (this.dataset.updateUrl === 'false') return;
      


      window.history.replaceState({}, '', `${url}${
        variantId
          ? `?variant=${variantId}`
          : ''
        }`);
    }

    setUnavailable() {
      this.productForm ?. toggleSubmitButton(true, window.variantStrings.unavailable);

      if (is_powder === true) {
        $('input[name*="Size-2"]')[0].click();
      } else if (is_capsule === true) {
        $('input[name*="Size-2"]')[0].click();
      } else {
        $('input[name*="Size-2"]')[0].click();
      }

      const selectors = [
        'price',
        'Inventory',
        'Sku',
        'Price-Per-Item',
        'Volume-Note',
        'Volume',
        'Quantity-Rules'
      ].map((id) => `#${id}-${
        this.dataset.section
      }`).join(', ');

// alert(selectors);
      const value = '#price-template--';
      const value2 = '#price-quickadd-template';
      const isInArray = selectors.includes(value) || selectors.includes(value2);

// alert(isInArray); // true
      if (isInArray == true) {

// alert("Yes");
// document.querySelectorAll(selectors).forEach(({ classList }) => classList.add('hidden'));
      } else {
        document.querySelectorAll(selectors).forEach(({classList}) => classList.add('hidden'));
      }

// document.querySelectorAll(selectors).forEach(({ classList }) => classList.add('hidden'));
    } 
    updateMedia(html, variantFeaturedMediaId) {
      if (!variantFeaturedMediaId) return;
      
      const mediaGallerySource = this.querySelector('media-gallery ul');
      const mediaGalleryDestination = html.querySelector(`media-gallery ul`);

      const refreshSourceData = () => {
        if (this.hasAttribute('data-zoom-on-hover')) 
          enableZoomOnHover(3);

        const mediaGallerySourceItems = Array.from(mediaGallerySource.querySelectorAll('li[data-media-id]'));
        const sourceSet = new Set(mediaGallerySourceItems.map((item) => item.dataset.mediaId));
        const sourceMap = new Map(mediaGallerySourceItems.map((item, index) => [
          item.dataset.mediaId, {
            item,
            index
          }
        ]));
        return [mediaGallerySourceItems, sourceSet, sourceMap];
      };

      if (mediaGallerySource && mediaGalleryDestination) {
        let [mediaGallerySourceItems, sourceSet, sourceMap] = refreshSourceData();
        const mediaGalleryDestinationItems = Array.from(mediaGalleryDestination.querySelectorAll('li[data-media-id]'));
        const destinationSet = new Set(mediaGalleryDestinationItems.map(({dataset}) => dataset.mediaId));
        let shouldRefresh = false;

// add items from new data not present in DOM
        for (let i = mediaGalleryDestinationItems.length - 1; i >= 0; i--) {
          if (!sourceSet.has(mediaGalleryDestinationItems[i].dataset.mediaId)) {
            mediaGallerySource.prepend(mediaGalleryDestinationItems[i]);
            shouldRefresh = true;
          }
        }

// remove items from DOM not present in new data
        for (let i = 0; i < mediaGallerySourceItems.length; i++) {
          if (! destinationSet.has(mediaGallerySourceItems[i].dataset.mediaId)) {
            mediaGallerySourceItems[i].remove();
            shouldRefresh = true;
          }
        }

// refresh
        if (shouldRefresh) 
          [mediaGallerySourceItems, sourceSet, sourceMap] = refreshSourceData();
        


// if media galleries don't match, sort to match new data order
        mediaGalleryDestinationItems.forEach((destinationItem, destinationIndex) => {
          const sourceData = sourceMap.get(destinationItem.dataset.mediaId);

          if (sourceData && sourceData.index !== destinationIndex) {
            mediaGallerySource.insertBefore(sourceData.item, mediaGallerySource.querySelector(`li:nth-of-type(${
              destinationIndex + 1
            })`));

// refresh source now that it has been modified
            [mediaGallerySourceItems, sourceSet, sourceMap] = refreshSourceData();
          }
        });
      }

// set featured media as active in the media gallery
      this.querySelector(`media-gallery`) ?. setActiveMedia ?. (`${
        this.dataset.section
      }-${variantFeaturedMediaId}`, true);

// update media modal
      const modalContent = this.productModal ?. querySelector(`.product-media-modal__content`);
      const newModalContent = html.querySelector(`product-modal .product-media-modal__content`);
      if (modalContent && newModalContent) 
        modalContent.innerHTML = newModalContent.innerHTML;
      


    }

    setQuantityBoundries() {
      const data = {
        cartQuantity: this.quantityInput.dataset.cartQuantity
          ? parseInt(this.quantityInput.dataset.cartQuantity)
          : 0,
        min: this.quantityInput.dataset.min
          ? parseInt(this.quantityInput.dataset.min)
          : 1,
        max: this.quantityInput.dataset.max
          ? parseInt(this.quantityInput.dataset.max)
          : null,
        step: this.quantityInput.step
          ? parseInt(this.quantityInput.step)
          : 1
      };

      let min = data.min;
      const max = data.max === null
        ? data.max
        : data.max - data.cartQuantity;
      if (max !== null) 
        min = Math.min(min, max);
      


      if (data.cartQuantity >= data.min) 
        min = Math.min(min, data.step);
      


      this.quantityInput.min = min;

      if (max) {
        this.quantityInput.max = max;
      } else {
        this.quantityInput.removeAttribute('max');
      }
      this.quantityInput.value = min;

      publish(PUB_SUB_EVENTS.quantityUpdate, undefined);
    }

    fetchQuantityRules() {
      const currentVariantId = this.productForm ?. variantIdInput ?. value;
      if (! currentVariantId) return;
      


      this.querySelector('.quantity__rules-cart .loading__spinner').classList.remove('hidden');
      fetch(`${
        this.dataset.url
      }?variant=${currentVariantId}&section_id=${
        this.dataset.section
      }`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          this.updateQuantityRules(this.dataset.section, html);
        })
        .catch((e) => console.error(e))
        . finally(() => this.querySelector('.quantity__rules-cart .loading__spinner').classList.add('hidden'));
    }

    updateQuantityRules(sectionId, html) {
      if (!this.quantityInput) return;
      


      this.setQuantityBoundries();

      const quantityFormUpdated = html.getElementById(`Quantity-Form-${sectionId}`);
      const selectors = ['.quantity__input', '.quantity__rules', '.quantity__label'];
      for (let selector of selectors) {
        const current = this.quantityForm.querySelector(selector);
        const updated = quantityFormUpdated.querySelector(selector);
        if (! current || ! updated) 
          continue;
        


        if (selector === '.quantity__input') {
          const attributes = ['data-cart-quantity', 'data-min', 'data-max', 'step'];
          for (let attribute of attributes) {
            const valueUpdated = updated.getAttribute(attribute);
            if (valueUpdated !== null) {
              current.setAttribute(attribute, valueUpdated);
            } else {
              current.removeAttribute(attribute);
            }
          }
        } else {
          current.innerHTML = updated.innerHTML;
        }
      }
    }

    get productForm() {
      return this.querySelector(`product-form`);
    }

    get productModal() {
      return document.querySelector(`#ProductModal-${
        this.dataset.section
      }`);
    }

    get pickupAvailability() {
      return this.querySelector(`pickup-availability`);
    }

    get variantSelectors() {
      return this.querySelector('variant-selects');
    }

    get relatedProducts() {
      const relatedProductsSectionId = SectionId.getIdForSection(SectionId.parseId(this.sectionId), 'related-products');
      return document.querySelector(`product-recommendations[data-section-id^="${relatedProductsSectionId}"]`);
    }

    get quickOrderList() {
      const quickOrderListSectionId = SectionId.getIdForSection(SectionId.parseId(this.sectionId), 'quick_order_list');
      return document.querySelector(`quick-order-list[data-id^="${quickOrderListSectionId}"]`);
    }

    get sectionId() {
      return this.dataset.originalSection || this.dataset.section;
    }
  });
}