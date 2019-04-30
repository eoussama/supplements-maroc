$('document').ready(() => {
  // Getting frequently used elements.
  var
    $stockCreationList = $('#stock-creation-list'),
    $stockCreationModal = $('#stock-creation-modal');

  // Initializing the product object.
  var Product = {
    Name: '',
    NutritionInfo: '',
    BrandId: 0,
    CateogryId: 0,
    Description: '',
    Usage: '',
    Warning: '',
    Stock: []
  };

  // The selection index.
  var currentIndex = -1;

  // Getting all flavors.
  var flavors = JSON.parse($('#flavors-json').text());

  // Initializing QuillJS.
  var
    descEditor = new Quill('#desc-editor', {
      theme: 'snow'
    }),
    usageEditor = new Quill('#usage-editor', {
      theme: 'snow'
    }),
    warningEditor = new Quill('#warning-editor', {
      theme: 'snow'
    }),
    descEditorEdit = new Quill('#desc-editor-edit', {
      theme: 'snow'
    }),
    usageEditorEdit = new Quill('#usage-editor-edit', {
      theme: 'snow'
    }),
    warningEditorEdit = new Quill('#warning-editor-edit', {
      theme: 'snow'
    });

  // Updating the UI.
  updateUI();

  // Initializing tabs.
  $('.dashboard-products .tabs').tabs();

  // Setting up the dropdowns.
  $('#product-creation-brand, #product-creation-category').formSelect();

  // Initializing the character counter.
  $('.dashboard-products #product-creation-name, .dashboard-products #product-creation-nutrition-info').characterCounter();

  // Initializing the collapsibles.
  $('.dashboard-products .collapsible').collapsible();

  // Initializing the materialbox.
  $('.dashboard-products .materialboxed').materialbox();

  // Submiting a new product to the server-side.
  $('#product-creation-form').on('submit', function (e) {

    // Stopping the page from reloading.
    e.preventDefault();
  });

  // Reseting the product creation.
  $('#product-creation-form').on('reset', function () {

    // Reseting the product tracking object.
    Product = {
      Name: '',
      NutritionInfo: '',
      BrandId: 0,
      CateogryId: 0,
      Description: '',
      Usage: '',
      Warning: '',
      Stock: []
    };

    updateUI();
  });

  // Nutrition facts preview.
  $('#product-creation-nutrition-info').on('change', function () {
    $('.nutrition-facts-creation-preview img').attr('src', $(this).val());

    if ($('.nutrition-facts-creation-preview img').on('error', function () {
      $('.nutrition-facts-creation-preview img').attr('src', '/assets/img/backgrounds/placeholder.jpg');
    }));
  });

  // Handeling the submit event on the stock-creation-modal.
  $('#stock-creation-form').on('submit', function (e) {

    // Preventing the page from loading.
    e.preventDefault();

    // Closing the modal.
    $stockCreationModal.modal('close');

    // Getting the inputs.
    var
      $stockWeightInput = $(this).find('#stock-creation-modal-weight'),
      $stockPriceInput = $(this).find('#stock-creation-modal-price');

    // Adding a new stock.
    addNewStock({
      Weight: $stockWeightInput.val(),
      Price: $stockPriceInput.val(),
      CurrentIndex: -1,
      Flavors: []
    });

    // Clearing the inputs.
    $stockWeightInput.val('');
    $stockPriceInput.val('');
  });

  // Handeling the click event on the stock-creation-clear-btn.
  $('#stock-creation-clear-btn').on('click', function () {

    // Clearing the created stock.
    Product.Stock = [];

    // Updating the current index.
    currentIndex = -1;

    // Updating the UI.
    updateUI();
  });

  // Handeling the change event on the product-creation-name.
  $('#product-creation-name').on('change', function () {
    Product.Name = $(this).val();

    updateUI();
  });

  function addNewStock(stock) {

    // Adding the stock.
    Product.Stock.push(stock);

    // Updating the currenr index.
    currentIndex = Product.Stock.length - 1;

    // Updating the UI.
    updateUI();
  }

  function removeStock(index) {

    // Remove a stock.
    Product.Stock.splice(index, 1);

    // Updating the current index.
    currentIndex = currentIndex === index ? -1 : (currentIndex >= 0 ? (currentIndex < index ? currentIndex : currentIndex - 1) : -1);

    // Updating the UI.
    updateUI();
  }

  function addFlavor(index, flavor) {

    // Adding a flavor.
    Product.Stock[index].Flavors.push(flavor);

    // Updating the current index.
    Product.Stock[index].CurrentIndex = Product.Stock[index].Flavors.length - 1;

    // Updating the UI.
    updateUI();
  }

  function removeFlavor(index, flavorIndex) {

    // Removing a flavor.
    Product.Stock[index].Flavors.splice(flavorIndex, 1);

    // Updating the UI.
    updateUI();
  }

  function updateStockCreationPreviews(ele) {
    ele.closest('.stock-creation-flavor-entry').find('.stock-creation-entry-variant-image-preview img').attr('src', ele.val());
    ele.closest('.stock-creation-flavor-entry').find('.stock-creation-entry-variant-image-preview').css('background-image', 'url(' + ele.val() + ')');

    if (ele.closest('.stock-creation-flavor-entry').find('.stock-creation-entry-variant-image-preview img').on('error', function () {
      ele.closest('.stock-creation-flavor-entry').find('.stock-creation-entry-variant-image-preview img').attr('src', '/assets/img/backgrounds/placeholder.jpg');
      ele.closest('.stock-creation-flavor-entry').find('.stock-creation-entry-variant-image-preview').css('background-image', 'url(/assets/img/backgrounds/placeholder.jpg)');
    }));
  }

  function updateUI() {

    // Updating the stock count.
    $('#stock-creation-count').text(Product.Stock.reduce(function (total, stock) {
      return total + formater.calculateStockQuantity(stock);
    }, 0));

    // Clearing the old output.
    $stockCreationList.empty();

    // Updating the stock list.
    Product.Stock.forEach(function (stock, index) {
      var stockFlavors = '';

      $.each(stock.Flavors, function (index, flavor) {
        var flavorsDropDown = '';

        $.each(flavors, function (index, flv) {
          flavorsDropDown += '<option value="' + flv.FlavorID + '" ' + (flv.FlavorID === flavor.FlavorID ? 'selected' : '') + '>' + flv.FlavorName + '</option>';
        });

        stockFlavors += '\
          <li data-flavor-index="'+ index + '" class="stock-creation-flavor-entry ' + (index === stock.CurrentIndex ? 'active' : '') + '">\
            <div class="collapsible-header">\
              <span class="valign-wrapper">\
                <i class="fas fa-trash stock-creation-flavor-remove-btn"></i>\
              </span>\
              <span class="valign-wrapper">\
              '+ flavor.Quantity + ' &nbsp; <b>الكمية</b> <i class="material-icons">inbox</i>\
              </span >\
              <span class="valign-wrapper">\
              '+ formater.getFlavorNameFromID(flavor.FlavorID) + ' &nbsp; <b>النكهة</b> <i class="material-icons">local_drink</i>\
              </span >\
            </div >\
            <div class="collapsible-body">\
              <div class="row">\
                <div class="col s6 stock-creation-entry-variant-image-preview">\
                  <img src="/assets/img/backgrounds/placeholder.jpg">\
                </div>\
                <div class="col s6">\
                  <div class="row">\
                    <div class="input-field col s12">\
                      <select name="stock-creation-entry-flavor">\
                        '+ flavorsDropDown + '\
                      </select >\
                      <label>النكهة</label>\
                    </div >\
                  </div >\
                  <div class="row">\
                    <div class="input-field col s12 right-align">\
                      <label>الكمية <small class="grey-text">&rlm;(درهم)&rlm;</small>\
                        <input min="0" name="stock-creation-entry-quantity" type="number" value="'+ flavor.Quantity + '" class="validate right-align" required>\
                      </label>\
                    </div>\
                  </div>\
                </div>\
              </div>\
              <div class="row ">\
                <div class="input-field col s12 stock-creation-entry-variant-image-wrapper">\
                  <label>صورة المنتوج</label>\
                  <input type="url" name="stock-creation-entry-variant-image" class="validate" value="'+ flavor.VariantImage + '" required>\
                </div>\
              </div>\
            </div>\
          </li>\
        ';
      });

      $stockCreationList.append('\
        <li data-id="'+ index + '" class="stock-creation-entry ' + (index === currentIndex ? 'active' : '') + '">\
          <div class="collapsible-header stock-creation-header">\
            <span class="valign-wrapper">\
              <i class="fas fa-trash stock-creation-remove-btn"></i>\
            </span>\
            <span class="valign-wrapper">\
            ' + formater.calculateStockQuantity(stock) + '&nbsp; <b>الكمية</b> <i class="material-icons">inbox</i> \
            </span>\
            <span class="valign-wrapper">\
            ' + formater.formatPrice(stock.Price) + '&nbsp; <b>السعر</b> <i class="material-icons">attach_money</i> \
            </span>\
            <span class="valign-wrapper">\
            ' + formater.formatWeight(stock.Weight) + '&nbsp; <b>الوزن</b> <i class="fas fa-balance-scale"></i> \
            </span>\
          </div>\
          <div class="collapsible-body">\
            <div class="row">\
              <div class="col s4">\
                <div class="row">\
                  <div class="col s12 right-align">\
                    <label>الوزن <small class="grey-text">&rlm;(كلغ)&rlm;</small>\
                      <input min="0" name="stock-creation-entry-weight" step="0.001" type="number" value="'+ stock.Weight + '" class="validate right-align" required>\
                    </label>\
                  </div>\
                </div>\
                <div class="row">\
                  <div class="col s12 right-align">\
                    <label>السعر <small class="grey-text">&rlm;(درهم)&rlm;</small>\
                      <input min="0" name="stock-creation-entry-price" type="number" step="0.01" value="'+ stock.Price + '" class="validate right-align" required>\
                    </label>\
                  </div>\
                </div>\
                <div class="row">\
                  <div class="col s8 offset-s2">\
                    <button class="btn btn-block btn-large waves-effect waves-light stock-creation-flavor-add-btn">إضافة نكهة للمنتوج</button>\
                    </label>\
                  </div>\
                </div>\
              </div>\
              <div class="col s7 offset-s1 stock-creation-entry-flavor-list">\
                <h5 class="right-align">[ '+ stock.Flavors.length + ' ] النكهات</h5>\
                <ul class="collapsible">\
                  '+ stockFlavors + '\
                </ul>\
              </div>\
            </div>\
          </div>\
        </li>');
    });

    // Adding the stock remove click event.
    $('#stock-creation-list .stock-creation-remove-btn').on('click', function (e) {

      // Stopping event propagation.
      e.stopPropagation();

      // Getting the stock's index.
      var index = $(this).closest('li').data('id');

      // Removing the stock.
      removeStock(index);
    });

    // Adding the stock update event for price and weight inputs.
    $('#stock-creation-list input[name=stock-creation-entry-price], #stock-creation-list input[name=stock-creation-entry-weight]').on('change', function (e) {

      // Getting the stock's index.
      var index = $(this).closest('li').data('id');

      // Updaing the stock.
      if ($(this).attr('name') === 'stock-creation-entry-weight') {
        Product.Stock[index].Weight = $(this).val();
      } else if ($(this).attr('name') === 'stock-creation-entry-price') {
        Product.Stock[index].Price = $(this).val();
      }

      // Updating the UI.
      updateUI();
    });

    // Adding the index update event.
    $('#stock-creation-list .stock-creation-header').on('click', function () {

      if (!$(this).parent().hasClass('active')) {
        currentIndex = $(this).parent().data('id');
      } else {
        currentIndex = -1;
      }
    });

    // Adding the flavor addition event.
    $('.stock-creation-flavor-add-btn').on('click', function () {

      // Getting the stock's index.
      var index = $(this).closest('li').data('id');

      // Adding a flavor.
      addFlavor(index, {
        Quantity: 1,
        FlavorID: flavors[0].FlavorID,
        VariantImage: ''
      });
    });

    // Adding the flavor removal event.
    $('.stock-creation-flavor-remove-btn').on('click', function (e) {

      // Stopping event propagation.
      e.stopPropagation();

      // Getting the stock's index.
      var
        index = $(this).closest('.stock-creation-entry').data('id'),
        flavorIndex = $(this).closest('li').data('flavor-index');

      // Adding a flavor.
      removeFlavor(index, flavorIndex);
    });

    $('.stock-creation-entry .stock-creation-flavor-entry .collapsible-header').on('click', function () {

      // Getting the stock's index.
      var index = $(this).closest('.stock-creation-entry').data('id');

      if (!$(this).parent().hasClass('active')) {
        Product.Stock[index].CurrentIndex = $(this).parent().data('flavor-index');
      } else {
        Product.Stock[index].CurrentIndex = -1;
      }
    });

    // Adding the flavor update event.
    $('.stock-creation-entry select').on('change', function (e) {

      // Getting the stock's index.
      var
        index = $(this).closest('.stock-creation-entry').data('id'),
        flavorIndex = $(this).closest('li').data('flavor-index'),
        newFlavorId = parseInt($(e.target).val());

      // Updating the flavor.
      Product.Stock[index].Flavors[flavorIndex].FlavorID = newFlavorId;

      // Updating the UI.
      updateUI();
    });

    // Adding the quantity update event.
    $('#stock-creation-list [name=stock-creation-entry-quantity]').on('change', function (e) {

      // Getting the stock's index.
      var
        index = $(this).closest('.stock-creation-entry').data('id'),
        flavorIndex = $(this).closest('li').data('flavor-index'),
        quantity = parseInt($(e.target).val());

      // Updating the quantity.
      Product.Stock[index].Flavors[flavorIndex].Quantity = quantity;

      // Updating the UI.
      updateUI();
    });

    // Variants' image preview.
    $('[name=stock-creation-entry-variant-image]').on('change', function (e) {

      // Getting the stock's index.
      var
        index = $(this).closest('.stock-creation-entry').data('id'),
        flavorIndex = $(this).closest('li').data('flavor-index'),
        image = $(e.target).val();

      // Updating the image.
      Product.Stock[index].Flavors[flavorIndex].VariantImage = image;

      // Updating the UI.
      updateUI();
    });

    // Updaing the previews.
    $.each($('[name=stock-creation-entry-variant-image]'), function (index, ele) {
      updateStockCreationPreviews($(ele));
    })

    // Re-initializing the collapsibles.
    $('#stock-creation-list, #stock-creation-list .collapsible').collapsible();

    // Re-initializing the dropdowns.
    $('#stock-creation-list select').formSelect();
  }

  var formater = {
    formatWeight: function (weight) {
      return (weight >= 1) ? weight + "kg" : (weight * 1000) + "g";
    },
    formatPrice: function (price) {
      return new Intl.NumberFormat('ar-MA', {
        style: 'currency',
        currency: 'MAD'
      }).format(price);
    },
    calculateStockQuantity: function (stock) {
      return stock.Flavors.reduce(function (total, flv) {
        return total + flv.Quantity;
      }, 0);
    },
    getFlavorNameFromID: function (flavorId) {
      for (var i = 0; i < flavors.length; i++) {
        if (flavors[i].FlavorID == flavorId) {
          return flavors[i].FlavorName;
        }
      }

      return 'Unflavored';
    }
  }

  addNewStock({
    Price: 399.99,
    Weight: .8,
    CurrentIndex: -1,
    Flavors: [
      {
        Quantity: 3,
        FlavorID: 4,
        VariantImage: 'https://store.bbcomcdn.com/images/store/skuimage/sku_MT4060010/image_skuMT4060010_largeImage_X_450_white.jpg'
      },
      {
        Quantity: 2,
        FlavorID: 3,
        VariantImage: 'https://s7.vitaminshoppe.com/is/image/VitaminShoppe/2159978_01?$OP_PDPSKU$'
      }
    ]
  });

  addNewStock({
    Price: 700,
    Weight: 6,
    CurrentIndex: -1,
    Flavors: [
      {
        Quantity: 5,
        FlavorID: 2,
        VariantImage: 'https://store.bbcomcdn.com/images/store/skuimage/sku_MT4060010/image_skuMT4060010_largeImage_X_450_white.jpg'
      }
    ]
  });
});
