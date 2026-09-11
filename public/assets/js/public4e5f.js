/*!
 * jQuery scrollintoview() plugin and :scrollable selector filter
 *
 * Version 1.8 (14 Jul 2011)
 * Requires jQuery 1.4 or newer
 *
 * Copyright (c) 2011 Robert Koritnik
 * Licensed under the terms of the MIT license
 * http://www.opensource.org/licenses/mit-license.php
 */
 
(function ($) {
  var converter = {
      vertical: { x: false, y: true },
      horizontal: { x: true, y: false },
      both: { x: true, y: true },
      x: { x: true, y: false },
      y: { x: false, y: true }
  };

  var settings = {
      duration: "fast",
      direction: "both"
  };

  var rootrx = /^(?:html)$/i;

  // gets border dimensions
  var borders = function (domElement, styles) {
      styles = styles || (document.defaultView && document.defaultView.getComputedStyle ? document.defaultView.getComputedStyle(domElement, null) : domElement.currentStyle);
      var px = document.defaultView && document.defaultView.getComputedStyle ? true : false;
      var b = {
          top: (parseFloat(px ? styles.borderTopWidth : $.css(domElement, "borderTopWidth")) || 0),
          left: (parseFloat(px ? styles.borderLeftWidth : $.css(domElement, "borderLeftWidth")) || 0),
          bottom: (parseFloat(px ? styles.borderBottomWidth : $.css(domElement, "borderBottomWidth")) || 0),
          right: (parseFloat(px ? styles.borderRightWidth : $.css(domElement, "borderRightWidth")) || 0)
      };
      return {
          top: b.top,
          left: b.left,
          bottom: b.bottom,
          right: b.right,
          vertical: b.top + b.bottom,
          horizontal: b.left + b.right
      };
  };

  var dimensions = function ($element) {
      var win = $(window);
      var isRoot = rootrx.test($element[0].nodeName);
      return {
          border: isRoot ? { top: 0, left: 0, bottom: 0, right: 0} : borders($element[0]),
          scroll: {
              top: (isRoot ? win : $element).scrollTop(),
              left: (isRoot ? win : $element).scrollLeft()
          },
          scrollbar: {
              right: isRoot ? 0 : $element.innerWidth() - $element[0].clientWidth,
              bottom: isRoot ? 0 : $element.innerHeight() - $element[0].clientHeight
          },
          rect: (function () {
              var r = $element[0].getBoundingClientRect();
              return {
                  top: isRoot ? 0 : r.top,
                  left: isRoot ? 0 : r.left,
                  bottom: isRoot ? $element[0].clientHeight : r.bottom,
                  right: isRoot ? $element[0].clientWidth : r.right
              };
          })()
      };
  };

  $.fn.extend({
      scrollintoview: function (options) {
          /// <summary>Scrolls the first element in the set into view by scrolling its closest scrollable parent.</summary>
          /// <param name="options" type="Object">Additional options that can configure scrolling:
          ///        duration (default: "fast") - jQuery animation speed (can be a duration string or number of milliseconds)
          ///        direction (default: "both") - select possible scrollings ("vertical" or "y", "horizontal" or "x", "both")
          ///        complete (default: none) - a function to call when scrolling completes (called in context of the DOM element being scrolled)
          /// </param>
          /// <return type="jQuery">Returns the same jQuery set that this function was run on.</return>

          options = $.extend({}, settings, options);
          options.direction = converter[typeof (options.direction) === "string" && options.direction.toLowerCase()] || converter.both;

          var dirStr = "";
          if (options.direction.x === true) dirStr = "horizontal";
          if (options.direction.y === true) dirStr = dirStr ? "both" : "vertical";

          var el = this.eq(0);
          var scroller = el.closest(":scrollable(" + dirStr + ")");

          // check if there's anything to scroll in the first place
          if (scroller.length > 0)
          {
              scroller = scroller.eq(0);

              var dim = {
                  e: dimensions(el),
                  s: dimensions(scroller)
              };

              var rel = {
                  top: dim.e.rect.top - (dim.s.rect.top + dim.s.border.top),
                  bottom: dim.s.rect.bottom - dim.s.border.bottom - dim.s.scrollbar.bottom - dim.e.rect.bottom - 100, // Added 100px extra scroll
                  left: dim.e.rect.left - (dim.s.rect.left + dim.s.border.left),
                  right: dim.s.rect.right - dim.s.border.right - dim.s.scrollbar.right - dim.e.rect.right
              };

              var animOptions = {};

              // vertical scroll
              if (options.direction.y === true)
              {
                  if (rel.top < 0)
                  {
                      animOptions.scrollTop = dim.s.scroll.top + rel.top;
                  }
                  else if (rel.top > 0 && rel.bottom < 0)
                  {
                      animOptions.scrollTop = dim.s.scroll.top + Math.min(rel.top, -rel.bottom);
                  }
              }

              // horizontal scroll
              if (options.direction.x === true)
              {
                  if (rel.left < 0)
                  {
                      animOptions.scrollLeft = dim.s.scroll.left + rel.left;
                  }
                  else if (rel.left > 0 && rel.right < 0)
                  {
                      animOptions.scrollLeft = dim.s.scroll.left + Math.min(rel.left, -rel.right);
                  }
              }

              // scroll if needed
              if (!$.isEmptyObject(animOptions))
              {
                  if (rootrx.test(scroller[0].nodeName))
                  {
                      scroller = $("html,body");
                  }
                  scroller
                      .animate(animOptions, options.duration)
                      .eq(0) // we want function to be called just once (ref. "html,body")
                      .queue(function (next) {
                          $.isFunction(options.complete) && options.complete.call(scroller[0]);
                          next();
                      });
              }
              else
              {
                  // when there's nothing to scroll, just call the "complete" function
                  $.isFunction(options.complete) && options.complete.call(scroller[0]);
              }
          }

          // return set back
          return this;
      }
  });

  var scrollValue = {
      auto: true,
      scroll: true,
      visible: false,
      hidden: false
  };

  $.extend($.expr[":"], {
      scrollable: function (element, index, meta, stack) {
          var direction = converter[typeof (meta[3]) === "string" && meta[3].toLowerCase()] || converter.both;
          var styles = (document.defaultView && document.defaultView.getComputedStyle ? document.defaultView.getComputedStyle(element, null) : element.currentStyle);
          var overflow = {
              x: scrollValue[styles.overflowX.toLowerCase()] || false,
              y: scrollValue[styles.overflowY.toLowerCase()] || false,
              isRoot: rootrx.test(element.nodeName)
          };

          // check if completely unscrollable (exclude HTML element because it's special)
          if (!overflow.x && !overflow.y && !overflow.isRoot)
          {
              return false;
          }

          var size = {
              height: {
                  scroll: element.scrollHeight,
                  client: element.clientHeight
              },
              width: {
                  scroll: element.scrollWidth,
                  client: element.clientWidth
              },
              // check overflow.x/y because iPad (and possibly other tablets) don't dislay scrollbars
              scrollableX: function () {
                  return (overflow.x || overflow.isRoot) && this.width.scroll > this.width.client;
              },
              scrollableY: function () {
                  return (overflow.y || overflow.isRoot) && this.height.scroll > this.height.client;
              }
          };
          return direction.y && size.scrollableY() || direction.x && size.scrollableX();
      }
  });
})(jQuery);

var storeId = 0;
var currentSubsidiaryId = 0;
var order = new Array();
var subsidiary;
var subsidiaryTariffList;
var currentProduct;
var currentProductList = [];
var message = "";
var couponSet = false;
var currentCoupon;
var notyf;
var map;
var deliveryPosition;
var deliveryMapPrice = 0;
var subsidiaryZone = null;
var validPosition = false;
var toFixedValue = 0;
var addToCartLabel = 'Agregar';
var orderReady = false;
var preselectedOrderId = 0;
var currentOrderId = 0;

$(document).ready(function(){
  notyf = new Notyf({position: {x: 'center', y: 'top'}});
  $(document).on("shown.bs.collapse",'#productContent .collapse' , function(e) {
    if($(this).find("div").length > 0)
    {
      if ($(this).is(e.target)) {
        $(this).find("div").first().scrollintoview();
      }
    }
  });

  if(multipleSubsidiary == 1){
    if(preselectedData.subsidiaryId > 0){
      document.cookie = "productList_" + storeId +"=; expires=" + new Date(new Date().getHours - 1).toUTCString();
      document.cookie = "subsidiary_" + storeId +"=; expires=" + new Date(new Date().getHours - 1).toUTCString();
      initializeStore(preselectedData.subsidiaryId, false, true);
    }
    else{
      HandleCookie(false);
    }
  }

  $(document).on("hidden.bs.popover", function(){
    $('.category-card').removeClass('d-none');
    $('.category-card').addClass('collapsed');
    $('.subcategory-card').addClass('collapsed');
    $('.product-row').removeClass('d-none');
    $('div.collapse[id^=category_]').removeClass('show');
    $('div.collapse[id^=subcategory_]').removeClass('show');
  });

  if($('input[name=deliveryRadio]').length == 1){
    $('input[name=deliveryRadio]').trigger('click');
  }
});

$(document).on('click', '#share-button', function(){
  var copyText = document.getElementById("productUrl");

  copyText.select();
  copyText.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(copyText.value);

  $('#share-button').tooltip('hide');
  notyf.success('¡Enlace copiado exitosamente!');
});

function HandleCookie(subsidiaryCall, validSchedule){
  var previouslyProductList = getCookie('productList_' + storeId);
  if(previouslyProductList.length > 0){
    Swal.fire({
      title: 'Tienes productos en tu cesta',
      text: "¿Deseas continuar con tu orden?",
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Descartar',
      allowOutsideClick: false
    }).then((result) => {
      if (result.isConfirmed) {
        currentProductList = JSON.parse(previouslyProductList);
        currentSubsidiaryId = parseInt(getCookie('subsidiary_' + storeId));
        if(subsidiaryCall){
          ValidateSchedule(validSchedule);
          LoadCookieData();
        }
        else{
          initializeStore(currentSubsidiaryId, true);
        }
      }
      else{
        document.cookie = "productList_" + storeId +"=; expires=" + new Date(new Date().getHours - 1).toUTCString();
        document.cookie = "subsidiary_" + storeId +"=; expires=" + new Date(new Date().getHours - 1).toUTCString();
      }
    })
  }
  else{
    if(subsidiaryCall){
      if (hasWelcomeMessage()) {
        showWelcomeMessage();
      }
      ValidateSchedule(validSchedule);
    }
    else{
      // Usar la nueva lógica de inicialización que maneja el mensaje de bienvenida
      if(multipleSubsidiary == 1 && currentSubsidiaryId > 0){
        initializeStore(currentSubsidiaryId, false);
      }
      else {
        // Si no hay múltiples subsidiarias, verificar mensaje de bienvenida directamente
        if (hasWelcomeMessage()) {
          showWelcomeMessage();
        }
      }
    }
  }
}

function LoadCookieData(){
  for (let i = 0; i < currentProductList.length; i++) {
    AddProductToBasket(currentProductList[i]);
    $('#bg_'+ currentProductList[i].productId).addClass('selected-product-bg');
    $('#bg_'+ currentProductList[i].productId).find('.btn-add').html('Agregar otra opción');

    if (globalQuantity == 1) {
        UdateAllProductTotalPrice(currentProductList[i].productId);
    } else {
        UdateProductTotalPrice(currentProductList[i].quantity, currentProductList[i].basketItemId);
    }
  }

  CalculateBasketTotalPrice();
}

function ValidateSchedule(validSchedule){
  if(!validSchedule){
    if(subsidiary.closed == 1){
      Swal.fire("Cerrado", subsidiary.close_message , "warning");
    }
    else{
      message += "Nuestros horarios de atención son:<br>";
      if (subsidiary.enable_1 == 1 && subsidiary.schedule_1.length > 0) {
        var subsidiaryDays = subsidiary.schedule_1.replace("1", "Lun");
        subsidiaryDays = subsidiaryDays.replace("2", "Mar");
        subsidiaryDays = subsidiaryDays.replace("3", "Mie");
        subsidiaryDays = subsidiaryDays.replace("4", "Jue");
        subsidiaryDays = subsidiaryDays.replace("5", "Vie");
        subsidiaryDays = subsidiaryDays.replace("6", "Sab");
        subsidiaryDays = subsidiaryDays.replace("7", "Dom");
        subsidiaryDays = subsidiaryDays.replaceAll(",", ", ");
        let openTime = subsidiary.open_1.split(':');
        openTime = openTime[0] + ":" + openTime[1];
        let closeTime = subsidiary.close_1.split(':');
        closeTime = closeTime[0] + ":" + closeTime[1];

        message += subsidiaryDays + ' de ' +  openTime + ' a ' + closeTime + '<br>';
      }
      if (subsidiary.enable_2 == 1 && subsidiary.schedule_2.length > 0) {
        var subsidiaryDays = subsidiary.schedule_2.replace("1", "Lun");
        subsidiaryDays = subsidiaryDays.replace("2", "Mar");
        subsidiaryDays = subsidiaryDays.replace("3", "Mie");
        subsidiaryDays = subsidiaryDays.replace("4", "Jue");
        subsidiaryDays = subsidiaryDays.replace("5", "Vie");
        subsidiaryDays = subsidiaryDays.replace("6", "Sab");
        subsidiaryDays = subsidiaryDays.replace("7", "Dom");
        subsidiaryDays = subsidiaryDays.replaceAll(",", ", ");
        let openTime = subsidiary.open_2.split(':');
        openTime = openTime[0] + ":" + openTime[1];
        let closeTime = subsidiary.close_2.split(':');
        closeTime = closeTime[0] + ":" + closeTime[1];

        message += subsidiaryDays + ' de ' +  openTime + ' a ' + closeTime + '<br>';
      }
      if (subsidiary.enable_3 == 1 && subsidiary.schedule_3.length > 0) {
        var subsidiaryDays = subsidiary.schedule_3.replace("1", "Lun");
        subsidiaryDays = subsidiaryDays.replace("2", "Mar");
        subsidiaryDays = subsidiaryDays.replace("3", "Mie");
        subsidiaryDays = subsidiaryDays.replace("4", "Jue");
        subsidiaryDays = subsidiaryDays.replace("5", "Vie");
        subsidiaryDays = subsidiaryDays.replace("6", "Sab");
        subsidiaryDays = subsidiaryDays.replace("7", "Dom");
        subsidiaryDays = subsidiaryDays.replaceAll(",", ", ");
        let openTime = subsidiary.open_3.split(':');
        openTime = openTime[0] + ":" + openTime[1];
        let closeTime = subsidiary.close_3.split(':');
        closeTime = closeTime[0] + ":" + closeTime[1];

        message += subsidiaryDays + ' de ' +  openTime + ' a ' + closeTime + '<br>';
      }
      if (subsidiary.enable_4 == 1 && subsidiary.schedule_4.length > 0) {
        var subsidiaryDays = subsidiary.schedule_4.replace("1", "Lun");
        subsidiaryDays = subsidiaryDays.replace("2", "Mar");
        subsidiaryDays = subsidiaryDays.replace("3", "Mie");
        subsidiaryDays = subsidiaryDays.replace("4", "Jue");
        subsidiaryDays = subsidiaryDays.replace("5", "Vie");
        subsidiaryDays = subsidiaryDays.replace("6", "Sab");
        subsidiaryDays = subsidiaryDays.replace("7", "Dom");
        subsidiaryDays = subsidiaryDays.replaceAll(",", ", ");
        let openTime = subsidiary.open_4.split(':');
        openTime = openTime[0] + ":" + openTime[1];
        let closeTime = subsidiary.close_4.split(':');
        closeTime = closeTime[0] + ":" + closeTime[1];

        message += subsidiaryDays + ' de ' +  openTime + ' a ' + closeTime + '<br>';
      }
      if (subsidiary.enable_5 == 1 && subsidiary.schedule_5.length > 0) {
        var subsidiaryDays = subsidiary.schedule_5.replace("1", "Lun");
        subsidiaryDays = subsidiaryDays.replace("2", "Mar");
        subsidiaryDays = subsidiaryDays.replace("3", "Mie");
        subsidiaryDays = subsidiaryDays.replace("4", "Jue");
        subsidiaryDays = subsidiaryDays.replace("5", "Vie");
        subsidiaryDays = subsidiaryDays.replace("6", "Sab");
        subsidiaryDays = subsidiaryDays.replace("7", "Dom");
        subsidiaryDays = subsidiaryDays.replaceAll(",", ", ");
        let openTime = subsidiary.open_5.split(':');
        openTime = openTime[0] + ":" + openTime[1];
        let closeTime = subsidiary.close_5.split(':');
        closeTime = closeTime[0] + ":" + closeTime[1];

        message += subsidiaryDays + ' de ' +  openTime + ' a ' + closeTime + '<br>';
      }
      if (subsidiary.enable_6 == 1 && subsidiary.schedule_6.length > 0) {
        var subsidiaryDays = subsidiary.schedule_6.replace("1", "Lun");
        subsidiaryDays = subsidiaryDays.replace("2", "Mar");
        subsidiaryDays = subsidiaryDays.replace("3", "Mie");
        subsidiaryDays = subsidiaryDays.replace("4", "Jue");
        subsidiaryDays = subsidiaryDays.replace("5", "Vie");
        subsidiaryDays = subsidiaryDays.replace("6", "Sab");
        subsidiaryDays = subsidiaryDays.replace("7", "Dom");
        subsidiaryDays = subsidiaryDays.replaceAll(",", ", ");
        let openTime = subsidiary.open_6.split(':');
        openTime = openTime[0] + ":" + openTime[1];
        let closeTime = subsidiary.close_6.split(':');
        closeTime = closeTime[0] + ":" + closeTime[1];

        message += subsidiaryDays + ' de ' +  openTime + ' a ' + closeTime + '<br>';
      }

      Swal.fire("Cerrado", message , "warning");
    }
  }
}

function ShowMenu(subsidiaryId, loadCookieData, hasPreloadedData)
{
  $.blockUI();
  $.ajax({
    type: 'GET',
    url: 'checkIfCodeIsRequired',
    data: {
      subsidiaryId : subsidiaryId
    },
    success: function (result) {
      try{
        res = JSON.parse(result);
        if (res.success == true) {
          if (res.requireCode == true) {
            Swal.fire({
              text: "Ingrese el código de acceso",
              icon: 'warning',
              input: "text",
              inputAttributes: {
                autocapitalize: "off"
              },
              showCancelButton: false,
              confirmButtonText: "Confirmar",
              showLoaderOnConfirm: true,
              preConfirm: function(code) {
                $.ajax({
                  type: 'GET',
                  url: 'validateAccessCode',
                  data: {
                    subsidiaryId,
                    code
                  },
                  success: function (result) {
                    try{
                      res = JSON.parse(result);
                      if (res.success == true) {
                        if (res.valid == true) {
                          ShowCategoryView(subsidiaryId, loadCookieData, hasPreloadedData);
                        } else {
                          Swal.fire("Error", 'Código invalido', "error");
                        }
                      }
                      else {
                        Swal.fire("Error", res.message, "error");
                      }
                    }
                    catch(err) {
                      Swal.fire("Error", result + '|' + err.message, "error");
                    }
                  },
                  complete: function(){
                    $.unblockUI();
                  }
                });
              },
              allowOutsideClick: false
            });
          } else {
            ShowCategoryView(subsidiaryId, loadCookieData, hasPreloadedData);
          }
        }
        else {
          Swal.fire("Error", res.message, "error");
        }
      }
      catch(err) {
        Swal.fire("Error", result + '|' + err.message, "error");
      }
    },
    complete: function(){
      $.unblockUI();
    }
  });
}

function ShowCategoryView(subsidiaryId, loadCookieData, hasPreloadedData){
  $.ajax({
    type: 'GET',
    url: 'getCategoryView',
    data: {
      storeId : storeId,
      subsidiaryId : subsidiaryId
    },
    success: function (result) {
      try{
        res = JSON.parse(result);
        if (res.success == true) {
          document.cookie = "subsidiary_" + storeId +"=" + subsidiaryId + "; expires=" + new Date(new Date().getHours + 24).toUTCString();
          $('#contentDiv').html(res.view);
          $('#headerDiv').removeClass('d-none');
          $('#contentDiv').removeClass('d-none');
          $('.box-basket').addClass('d-none');
          $('.fa-utensils').addClass('active');
          $('.fa-utensils').addClass('transition');
          if(loadCookieData){
            LoadCookieData();
          }  else if (preselectedData.productList.length > 0){
            setTimeout(function(){
              loadOrder();
            }, 200);
          }

          if(hasPreloadedData){
            OpenPreloadedProductModal();
            OpenPreloadedCategoryModal();
          }
        }
        else {
          Swal.fire("Error", res.message, "error");
        }
      }
      catch(err) {
        Swal.fire("Error", result + '|' + err.message, "error");
      }
    },
    complete: function(){
      $.unblockUI();
    }
  });
}

function ShowProductDetail(productId, btn)
{
  if(GetStockRemaining(productId) > 0 || manualStock == 1){
    $.blockUI();
    $.ajax({
      type: 'GET',
      url: 'getProductView',
      data: {
        storeId : storeId,
        product_id : productId
      },
      success: function (result) {
        try{
          res = JSON.parse(result);
          if (res.success == true) {
            console.log(res.optionList);
            currentProduct = $(btn).parent().parent();
            $('#modalBody').html(res.view);
            $('#quantity').html($(currentProduct).parent().find('span[name="productQuantity"]').html());
            CalculateProductPrice();
            if (res.autoAddToCart == 0) {
              $('#modal').modal();
            } else {
              AddOrder(true);
            }
          }
          else {
            Swal.fire("Error", res.message, "error");
          }
        }
        catch(err) {
          Swal.fire("Error", result + '|' + err.message, "error");
        }
      },
      complete: function(){
        $.unblockUI();
      }
    });
  }
  else{
    Swal.fire("Atención", "Producto sin stock disponible.", "warning");
  }
}

function ToogleOptionValue(chk, optionId)
{
  var maxOption = $('#maxOption_' + optionId).html();
  var quantitySelected = $('#option_' + optionId).find('input:checked').length;

  if ($(chk).prop('checked')) {
    if (maxOption == 0 || maxOption >= quantitySelected) {
      $('#optionHeader_' + optionId).removeClass('required-message');
    }
    else{
      $(chk).prop('checked', false);
      Swal.fire("Error", "Solo se puede seleccionar " + maxOption + " opción(es).", "error");
    }
  }
}

function SelectSection(option)
{
  if(option == 1){
    $('#modal').modal('hide');
  }
  else if(option == 2){
    // $('.box-add').addClass('d-none');
    $('#basketModal').modal();

    if ($('#items-container .row-item').length > 0) {
      $('#items-container').removeClass('d-none');
      $('#no-items').addClass('d-none');
    }
    else{
      $('#items-container').addClass('d-none');
      $('#no-items').removeClass('d-none');
    }
  }

  $('#orderConfirmation').addClass('d-none');
  CalculateBasketTotalPrice();
}

function GetStockRemaining(productId, basketId = '')
{
  let stockLimit = parseFloat($('#stock_' + productId).html());
  let addedQuantity = 0;
  let toFixedValueByProduct = 0;
  $('#bg_' + productId).find('.inside-basket .row-item[name!="basket_' + basketId + '"]').each(function () {
    toFixedValueByProduct = $(this).find('span[name="basketToFixedValue"]').html();
    addedQuantity += parseFloat($(this).find('span[name=basketQuantity]').html());
  });

  return (stockLimit - addedQuantity).toFixed(toFixedValueByProduct);
}

function AddUnit()
{
  var quantity = parseFloat($('#quantity').html());
  quantity = parseFloat((quantity + minimunIncrease).toFixed(toFixedValue));
  let stockLimit = GetStockRemaining($(currentProduct).data('id'));
  if(quantity <= stockLimit){
    $('#quantity').html(quantity);
    $('#quantityInput').val(quantity);
    $(currentProduct).parent().find('span[name="productQuantity"]').html(quantity);
    CalculateProductPrice();
  }
  else{
    Swal.fire("Atención", "El stock disponible es : " + stockLimit, "warning");
  }
}

function RemoveUnit()
{
  var quantity = parseFloat($('#quantity').html()).toFixed(toFixedValue);
  if (parseFloat(quantity) >= parseFloat((minimunQuantity + minimunIncrease).toFixed(toFixedValue))) {
    quantity = parseFloat((quantity - minimunIncrease).toFixed(toFixedValue));
    $('#quantity').html(quantity);
    $('#quantityInput').val(quantity);
    $(currentProduct).parent().find('span[name="productQuantity"]').html(quantity);
  }

  CalculateProductPrice();
}

function SetUnit(){
  $('#quantity').html($('#quantityInput').val());
  if(ValidateQuantity()){
    CalculateProductPrice();
  }
}

function ValidateQuantity()
{
  let quantitySelected = parseFloat(parseFloat($('#quantity').html()).toFixed(toFixedValue));
  if(quantitySelected <= GetStockRemaining($(currentProduct).data('id')) || manualStock == 1){
    if(quantitySelected >= minimunQuantity){
      let quantityIncreased = (quantitySelected - minimunQuantity).toFixed(toFixedValue);
      if(quantityIncreased > 0){
        quantityIncreased = (quantityIncreased / minimunIncrease).toFixed(0) % 1;
        if(quantityIncreased != 0){
          Swal.fire("Atención", "La cantidad mínima de compra es: " + minimunQuantity + " y solo se pueden agregar productos de " + minimunIncrease + " en " + minimunIncrease, "warning");
          $('#quantity').html(minimunQuantity);
          $('#quantityInput').val(minimunQuantity);
          CalculateProductPrice();
          return false;
        }
      }

      return true;
    }
    else{
      Swal.fire("Atención", "La cantidad mínima de compra es: " + minimunQuantity, "warning");
      $('#quantity').html(minimunQuantity);
      $('#quantityInput').val(minimunQuantity);
      CalculateProductPrice();
      return false;
    }
  }
}

function ToogleAditional(chk)
{
  var maxAditional = $('#maxAditional').html();
  var quantitySelected = $('.aditionalOption:checked').length;

  if (maxAditional != 0 && maxAditional <= quantitySelected) {
    $('.aditionalOption:not(checked)').prop('disabled', true);
    $(chk).prop('disabled', false);
  }
  else{
    $('.aditionalOption').prop('disabled', false);
  }

  CalculateProductPrice();
}

function CalculateProductPrice()
{
  var basePrice = CalculateProductPriceByQuantity();

  let aditionalLimit = parseInt($('#aditional-div').data('limit'));
  if(aditionalLimit > 1){
    $('.aditional-quantity').each(function(){
      let aditionalQuantity = parseInt($(this).html());
      if(aditionalQuantity >= 0){
        let aditionalUnitPrice = parseFloat($(this).closest('.col-12').find('.aditional-unit-price').html());
        let aditionalTotalPrice = parseFloat(aditionalQuantity * aditionalUnitPrice).toFixed(2);
        $(this).closest('.col-12').find('.aditional-total-price').html(aditionalTotalPrice);
        $(this).closest('.col-12').find('.aditional-total-price-formatted').html(SetMoneyFormat(parseFloat(aditionalTotalPrice)));
        basePrice += parseFloat(aditionalTotalPrice);
      }
    });
  }
  else{
    $('.aditionalOption:checked').each(function(){
      basePrice += parseFloat($(this).parent().find('span[name="aditionalPrice"]').html());
    });
  }

  var totalPrice = basePrice * parseFloat($('#quantity').html());

  $('#productTotalPrice').html(parseFloat(totalPrice).toFixed(2));
  $('#productTotalPriceDisplay').html(SetMoneyFormat(parseFloat(totalPrice)));
}

function CalculateProductPriceByQuantity()
{
  let basePrice = parseFloat($('#productPrice').html());
  let currentQuantity = parseFloat($('#quantity').html());
  if (globalQuantity == 1) {
    if (globalQuantityByProduct == 1) {
      let productList = $('#items .row.row-item');
      productList = $(productList).filter(function() {
        return $(this).find('span[name="productId"]').html() == $('#productId').html();
      });
      $(productList).each(function() {
        currentQuantity += parseFloat($(this).find('span[name=basketQuantity]').html());
      });
    } else {
      if($('#buttonCart span').html().length) {
        currentQuantity += parseFloat($('#buttonCart span').html());
      }
    }
  }

  if(currentPriceList.length > 0){
    currentPriceList.forEach((singlePrice) => {
      if(currentQuantity >= parseFloat(singlePrice.min_quantity) && currentQuantity <= parseFloat(singlePrice.max_quantity)){
        basePrice = parseFloat(singlePrice.price);
      }
    });
  }

  return basePrice;
}

function getCurrentBasketItemId() {
  let maxBasketId = 0;
  $('.row-item').each(function() {
    let basketId = parseInt($(this).data('basketid'));
    if (basketId > maxBasketId) {
      maxBasketId = basketId;
    }
  });
  return maxBasketId + 1;
}

function AddOrder(simpleProduct = false)
{
  if(ValidateQuantity()){
    var product = new Object();
    product.name = $('#productName').html();
    product.productId = $('#productId').html();
    product.adtional = "";
    product.basketItemId = getCurrentBasketItemId();
    var totalAditional = $('.aditionalOption:checked').length;
    var count = 0;
    let aditionalLimit = parseInt($('#aditional-div').data('limit'));
    if(aditionalLimit > 1)
    {
      $('.aditional-quantity').each(function(){
        let aditionalQuantity = parseInt($(this).html());
        if(aditionalQuantity > 0){
          if (count == 0) {
            product.adtional += "(";
          }
          else if(count == totalAditional - 1){
            product.adtional += "y ";
          }
          else{
            product.adtional += ", ";
          }

          product.adtional += aditionalQuantity + ' x ' + $(this).closest('.col-12').find('.aditional-name').html();
    
          count++;
        }
      });
    }
    else{
      $('.aditionalOption:checked').each(function(){
        if (count == 0) {
          product.adtional += "(";
        }
        else if(count == totalAditional - 1){
          product.adtional += "y ";
        }
        else{
          product.adtional += ", ";
        }

        product.adtional += $(this).parent().find('label').html();

        count++;
      });
    }

    if(count > 0){
      product.adtional += ")";
    }

    var validated = true;

    product.optionalList = new Array();
    $('.optionHeader:not(.aditionalHeader)').each(function(){
      var id = $(this).prop('id').split('_')[1];
      var optionName = $('#optionName_' + id).html();

      var count = 0;
      var optionRequired = false;
      var optional = new Object();
      optional.name = $('#optionName_' + id).html();
      optional.value = "";
      if($('#option_' + id).data('type') == 1){
        var requiredQuantity = $('#option_' + id).data('limit');
        var totalQuantity = 0;
        $('#option_' + id).find('span[id^="optionValueQuantity_' + id + '"]').each(function(){
          var quantity = parseInt($(this).html());
          if(quantity > 0){
            var optionId = $(this).data('option_id');
            var index = $(this).data('index');
            var value = $('#optionValue_' + optionId + '_' + index).html();
            if (count == 0) {
              optional.value += value + '(' + quantity + ')';
            }
            else{
              optional.value += ", " + value + '(' + quantity + ')';
            }

            count++;
            totalQuantity += quantity;
          }
        });
        if(requiredQuantity != totalQuantity){
          optionRequired = true;
        }
      }
      else{
        var totalOption = $('#option_' + id).find('.badge-primary').length;
        $('#option_' + id).find('input:checked').each(function(){
          if (count == 0) {
            optional.value += $(this).val();
          }
          else if(count == totalOption - 1){
            optional.value += "y " + $(this).val();
          }
          else{
            optional.value += ", " + $(this).val();
          }
    
          count++;
        });
      }

      product.optionalList.push(optional);
      if(count == 0 || optionRequired){
        $(this).addClass('required-message');
        $(this).addClass('required-animation');
        validated = false;
      }
    });

    if (!validated) {
      setTimeout(function() {$('.optionHeader').removeClass('required-animation');}, 1000);
    }
    else{
      $('#bg_'+ product.productId).addClass('selected-product-bg');
      let labelAdd = simpleProduct ? 'Agregar' : 'Agregar otra opción';
      $('#bg_'+ product.productId).find('.btn-add').html(labelAdd);

      product.comment = $('#comment').val();
      product.singleBasePrice = parseFloat($('#productPrice').html());
      product.singlePrice = CalculateProductPriceByQuantity();
      product.aditionalPrice = 0;
      if(aditionalLimit > 1)
      {
        $('.aditional-quantity').each(function(){
          let aditionalQuantity = parseInt($(this).html());
          if(aditionalQuantity > 0){
            product.singlePrice += parseFloat($(this).closest('.col-12').find('.aditional-total-price').html());
            product.aditionalPrice += parseFloat($(this).closest('.col-12').find('.aditional-total-price').html());
          }
        });
      }
      else{
        $('.aditionalOption:checked').each(function(){
          product.singlePrice += parseFloat($(this).parent().find('span[name="aditionalPrice"]').html());
          product.aditionalPrice += parseFloat($(this).parent().find('span[name="aditionalPrice"]').html());
        });
      }
      
      product.quantity = parseFloat($('#quantity').html());
      product.totalPrice = parseFloat($('#productTotalPrice').html());
      product.minimunQuantity = minimunQuantity;
      product.minimunIncrease = minimunIncrease;
      product.weightSale = weightSale;
      product.quantity = parseFloat($('#quantity').html()).toFixed(toFixedValue);
      product.priceList = currentPriceList;
      product.toFixedValue = toFixedValue;
      if(product.totalPrice > 0){
        AddProductToBasket(product);
        if(pixelSetUp){
          fbq('track', 'AddToCart', {});
        }
        $('.toast').toast('show');
        currentProductList.push(product);
        document.cookie = "productList_" + storeId +"=" + JSON.stringify(currentProductList) + "; expires=" + new Date(new Date().getHours + 1).toUTCString();
        if (globalQuantity == 1) {
          UdateAllProductTotalPrice(product.productId);
          CalculateBasketTotalPrice();
        }
      }
      else{
        $('#maxAditional').parent().find('.optionHeader').addClass('required-message');
        $('#maxAditional').parent().find('.optionHeader').addClass('required-animation'); 
        setTimeout(function() {$('.optionHeader').removeClass('required-animation');}, 1000);
      }
    }
  }
}

function RemoveBasketUnit(btn, productId, productbasketItemId)
{
  var parent = $(btn).parent();
  var productDiv = $(parent).closest('div[name=basket_' + productbasketItemId + ']');
  var quantity = parseFloat($(parent).find('span').html());
  let basketMinimunQuantity = parseFloat($(productDiv).find('span[name="basketMinimunQuantity"]').html());
  let basketMinimunIncrease = parseFloat($(productDiv).find('span[name="basketMinimunIncrease"]').html());

  if (quantity >= (basketMinimunQuantity + basketMinimunIncrease).toFixed($(productDiv).find('span[name="basketToFixedValue"]').html())) {
    quantity = parseFloat((quantity - basketMinimunIncrease).toFixed($(productDiv).find('span[name="basketToFixedValue"]').html()));
    $('div[name=basket_' + productbasketItemId + '] span[name="basketQuantity"]').html(quantity);
    if (globalQuantity == 1) {
      UdateAllProductTotalPrice(productId);
    } else {
      UdateProductTotalPrice(quantity, productbasketItemId);
    }
    UpdateQuantityProduct(productId, quantity, productbasketItemId);
  }
  else{
    $('div[name=basket_' + productbasketItemId + ']').remove();
    var remains = false;
    $('#items .row.row-item').find('span[name="productId"]').each(function(){
      if($(this).html() == productId){
        remains = true;
        return false;
      }
    });

    if (globalQuantity == 1) {
      UdateAllProductTotalPrice(productId);
    } else {
      UdateProductTotalPrice(quantity, productbasketItemId);
    }

    RemoveProductFromArray(productId, productbasketItemId);

    if(!remains){
      $('#bg_'+ productId).removeClass('selected-product-bg');
      $('#bg_'+ productId).find('.btn-add').html(addToCartLabel);
      if (!$('#items .row.row-item').length > 0) {
        ClearBasket();
      }
    }
  }
  
  CalculateBasketTotalPrice();
}

function AddBasketUnit(btn, productId, productbasketItemId)
{
  var parent = $(btn).parent();
  var quantity = parseFloat($(parent).find('span[name="basketQuantity"]').html());
  let productDiv = $(parent).closest('div[name=basket_' + productbasketItemId + ']');
  let basketMinimunIncrease = parseFloat($(productDiv).find('span[name="basketMinimunIncrease"]').html());

  quantity = parseFloat((quantity + basketMinimunIncrease).toFixed($(productDiv).find('span[name="basketToFixedValue"]').html()));

  let stockLimit = GetStockRemaining(productId, productbasketItemId);
  
  if(quantity <= stockLimit){
    $('div[name=basket_' + productbasketItemId + '] span[name="basketQuantity"]').html(quantity);
    // var productDiv = $(parent).parent().parent();
    
    if (globalQuantity == 1) {
      UdateAllProductTotalPrice(productId);
    } else {
      UdateProductTotalPrice(quantity, productbasketItemId);
    }

    UpdateQuantityProduct(productId, quantity, productbasketItemId);
    
    CalculateBasketTotalPrice();
  }
  else{
    Swal.fire("Atención", "El stock disponible es : " + stockLimit, "warning");
  }
}

function CalculateBasketTotalPrice(delivery)
{
  if(delivery){
    $('#deliveryRadio[value="Retiro en el local"]').prop('checked', false);
    $('#deliveryRadio[value="Consumo en lugar"]').prop('checked', false);
    $('#deliveryRadio[value="A coordinar"]').prop('checked', false);
    $('#deliveryRadio[value=Envio]').prop('checked', true);
  }

  if($('#deliveryRadio[value=Envio]').prop('checked') || $('#coordinatedDeliveryRadio').prop('checked')){
    $('.address-field').removeClass('d-none').addClass('d-block');
    setTimeout(() => {
      $('#mapAddress').fadeIn(1000);
    }, 1000);
  }
  else{
    $('.address-field').addClass('d-none').removeClass('d-block');
  }
  
  if($('#lobyRadio[value="Consumo en lugar"]').prop('checked')){
    $('.living-field').removeClass('d-none');
  }
  else{
    $('.living-field').addClass('d-none');
  }

  var totalPrice = 0;
  $('#items .row.row-item').each(function(){
    totalPrice += parseFloat($(this).find('span[name="basketProductTotalPrice"]').html());
  });

  var count = 0; 
  $('#items .row.row-item span[name=basketQuantity]').each(function(){
    count += parseFloat($(this).html());
  });
  
  if (count > 0) {
    $('#buttonCart span').removeClass('d-none');
    $('#buttonCart span').html(count);
  }
  else{
    $('#buttonCart span').html('');
    $('#buttonCart span').addClass('d-none');
  }

  $('span[name="basketTotal"]').html(totalPrice.toFixed(2));
  $('span[name="basketTotalDisplay"]').html(SetMoneyFormat(totalPrice));

  var deliveryPrice = 0;
  if($('#deliveryRadio').prop('checked') == true && googleMap == 1 && deliveryPosition){
    deliveryPrice = deliveryMapPrice;
  }
  else{
    if ($('#deliveryRadio').prop('checked') == true && $('#deliveryZone').length > 0 && $('#deliveryZone option:selected').val().length > 0) {
      deliveryPrice = parseFloat($('#deliveryZone option:selected').val());
    }
  }

  if(freeDeliveryOver > 0 && totalPrice >= freeDeliveryOver){
    deliveryPrice = 0;
  }

  $('#basketDeliveryAmmount').parent().parent().css('display', 'none');
  if(deliveryPrice > 0){
    $('#basketDeliveryAmmount').parent().parent().css('display', 'flex');
  }

  $('#basketDeliveryAmmount').html(deliveryPrice.toFixed(2));
  if($('#coordinatedDeliveryRadio').prop('checked') == true){
    $('#basketDeliveryAmmountDisplay').html("A cotizar");
  }
  else{
    $('#basketDeliveryAmmountDisplay').html(SetMoneyFormat(deliveryPrice));
  }

  let discountAmount = CalculateDiscount();
  $('#discountAmount').html(parseFloat(discountAmount).toFixed(2));
  $('#discountAmountDisplay').html(SetMoneyFormat(discountAmount));
  
  $('#discountAmount').parent().parent().css('display', 'none');
  if(discountAmount != 0){
    $('#discountAmount').parent().parent().css('display', 'flex');
  }

  let subtotal = parseFloat(parseFloat(totalPrice).toFixed(2)) + parseFloat(parseFloat(deliveryPrice).toFixed(2)) - parseFloat(parseFloat(discountAmount).toFixed(2));
  let paymentTypeTax = CalculatePaymentTypeTax(subtotal);
  if(paymentTypeTax > 0){
    $('#aditionalTaxTitle').html('Tasa de recargo (' + parseFloat($('.badge-option.active').data('tax')) + '%)');
  }
  else if(paymentTypeTax < 0){
    $('#aditionalTaxTitle').html('Tasa de descuento (' + parseFloat($('.badge-option.active').data('tax')) + '%)');
  }

  $('#paymentTypeTax').html(parseFloat(paymentTypeTax).toFixed(2));
  $('#paymentTypeTaxDisplay').html(SetMoneyFormat(paymentTypeTax));

  let totalAmount = (subtotal + parseFloat(parseFloat(paymentTypeTax).toFixed(2)));
  if (storeId == 549 || storeId == 22) {
    let infinitePromoAmount = totalAmount * 0.15;
    $('#basketFinalAmmountPromoInfiniteDisplay').html(SetMoneyFormat(infinitePromoAmount));
  }

  $('strong[name=basketFinalAmmount]').html(totalAmount.toFixed(2));
  $('strong[name=basketFinalAmmountDisplay]').html(SetMoneyFormat(totalAmount));
  if (exchangeRate > 0) {
    $('strong[name=basketFinalAmmountExchangeDisplay]').html(SetMoneyFormat(totalAmount * exchangeRate));
  }
}

function UdateProductTotalPrice(quantity, productbasketItemId){
  var productDiv = $('#items div[name=basket_' + productbasketItemId + ']');
  var price = parseFloat($(productDiv).find('span[name="basketProductBasePrice"]').html());
  let productPriceList = JSON.parse($(productDiv).find('span[name="basketProductPriceList"]').html());
  let quantityForPriceCalculation = quantity;

  if (globalQuantity == 1) {
    let totalProductCount = 0; 
    $('#items .row.row-item span[name=basketQuantity]').each(function(){
      totalProductCount += parseFloat($(this).html());
    });

    quantityForPriceCalculation = totalProductCount;
  }

  if(productPriceList.length > 0){
    productPriceList.forEach((singlePrice) => {
      if(quantityForPriceCalculation >= parseFloat(singlePrice.min_quantity) && quantityForPriceCalculation <= parseFloat(singlePrice.max_quantity)){
        price = parseFloat(singlePrice.price);
      }
    });
  }

  price += parseFloat($(productDiv).find('span[name="basketProductAditionalPrice"]').html());

  var totalPrice = quantity * price;
  $('div[name=basket_' + productbasketItemId + '] span[name="basketProductPrice"]').html(price.toFixed(2));
  $('div[name=basket_' + productbasketItemId + '] span[name="basketProductTotalPrice"]').html(totalPrice.toFixed(2));
  $('div[name=basket_' + productbasketItemId + '] span[name="basketProductTotalPriceDisplay"]').html(SetMoneyFormat(totalPrice));
}

function UdateAllProductTotalPrice(productId){
  let productList = $('#items .row.row-item');
  if (globalQuantityByProduct == 1) {
    productList = $(productList).filter(function() {
      return $(this).find('span[name="productId"]').html() == productId;
    });
  }

  $(productList).each(function() {
    let productbasketItemId = $(this).data('basketid');
    var price = parseFloat($(this).find('span[name="basketProductBasePrice"]').html());
    let productPriceList = JSON.parse($(this).find('span[name="basketProductPriceList"]').html());
    let quantity = parseFloat($(this).find('span[name="basketQuantity"]').html());

    let totalProductCount = 0; 
    $(productList).find('span[name=basketQuantity]').each(function(){
      totalProductCount += parseFloat($(this).html());
    });

    if(productPriceList.length > 0){
      productPriceList.forEach((singlePrice) => {
        if(totalProductCount >= parseFloat(singlePrice.min_quantity) && totalProductCount <= parseFloat(singlePrice.max_quantity)){
          price = parseFloat(singlePrice.price);
        }
      });
    }

    price += parseFloat($(this).find('span[name="basketProductAditionalPrice"]').html());

    var totalPrice = quantity * price;
    $('div[name=basket_' + productbasketItemId + '] span[name="basketProductPrice"]').html(price.toFixed(2));
    $('div[name=basket_' + productbasketItemId + '] span[name="basketProductTotalPrice"]').html(totalPrice.toFixed(2));
    $('div[name=basket_' + productbasketItemId + '] span[name="basketProductTotalPriceDisplay"]').html(SetMoneyFormat(totalPrice));
  });
    
}

function ClearBasketConfirmation()
{
  Swal.fire({
    text: "¿Estas seguro que desea eliminar todos los productos?",   
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#DD6B55',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Eliminar',
    cancelButtonText: "Cancelar"
  }).then((result) => {
    if (result.value) {
      ClearBasket();
    }
  })
}

function ClearBasket()
{
  $('#items').html('');
  $('#items-container').addClass('d-none');
  $('#no-items').removeClass('d-none');
  $('.inside-basket').html('');
  $('.selected-product-bg').find('.btn-add').html(addToCartLabel);
  $('.selected-product-bg').removeClass('selected-product-bg');
  
  document.cookie = "productList_" + storeId +"=; expires=" + new Date(new Date().getHours + 1).toUTCString();

  CalculateBasketTotalPrice();
}

function SelectPaymentKind(btn)
{
  $('.badge-option').removeClass('active');
  $(btn).addClass('active');
  CalculateBasketTotalPrice();
}

function FinishOrder()
{
  if ($('#items .row.row-item').length > 0) {
    $('#basketModal').modal('hide');
    
    // Verificar si hay mensaje de pedido configurado
    if (hasOrderMessage()) {
      $('#orderMessageModal').modal();
      $('#orderMessageModal').css('padding-right', '0px');
    } else {
      showFinishOrderModal();
    }
  }
  else{
    Swal.fire("¡Ups!", "Aun no tienes productos en tu carrito.", "warning");
  }
}

function hasOrderMessage() {
  // Usar la variable configurada desde PHP
  return hasOrderMessageConfigured;
}

function proceedToFinishOrder() {
  $('#orderMessageModal').modal('hide');
  setTimeout(() => {
    showFinishOrderModal();
  }, 300); // Pequeño delay para que se cierre completamente el modal anterior
}

function showFinishOrderModal() {
  $('#modalFinishOrder').modal();
  $('#modalFinishOrder').css('padding-right', '0px');
}

function Order()
{
  CalculateBasketTotalPrice();
  var newOrder = new Object();
  newOrder.orderType = $("input[name='deliveryRadio']:checked").val();
  if(newOrder.orderType == "Envio" && googleMap == 1){
    newOrder.orderType = "Google Map";
    if(deliveryPosition.getPosition()){
      newOrder.position = {
        lat: deliveryPosition.getPosition().lat(),
        lng: deliveryPosition.getPosition().lng()
      }

      newOrder.position = JSON.stringify(newOrder.position);
    }
  }

  newOrder.name = $('#orderName').val();
  newOrder.address = $('#orderAddress').val();
  newOrder.reference = $('#orderReference').val();
  newOrder.apartment = $('#orderDepartamento').val();
  newOrder.locality = $('#orderLocalidad').val();
  newOrder.neighborhood = $('#orderBarrio').val();
  newOrder.city = $('#orderCity').val();
  newOrder.province = $('#orderProvince').val();
  newOrder.country = $('#orderCountry').val();
  newOrder.postalCode = $('#orderPostalCode').val();
  newOrder.phone = $('#orderPhone').val();
  newOrder.email = $('#orderEmail').val();
  newOrder.comment = $('#orderComment').val();
  newOrder.payment = $('.badge-option.active span').html();
  newOrder.paymentId = $('.badge-option.active').data('id');
  newOrder.optional_1 = $('#optional_1').val();
  newOrder.optional_2 = $('#optional_2').val();
  newOrder.optional_3 = $('#optional_3').val();
  newOrder.order_amount = $('#basketTotalAmmount').html();
  newOrder.deliveryTariff = $('#basketDeliveryAmmount').html();
  newOrder.discountAmount = $('#discountAmount').html();
  newOrder.paymentTypeTax = $('#paymentTypeTax').html();
  newOrder.store_subsidiary_id = subsidiary.store_subsidiary_id;
  newOrder.numeroMesa = $('#orderNumeroMesa').val();
  
  // Agregar customer_id y seller_id si están disponibles
  if (typeof currentCustomerId !== 'undefined' && currentCustomerId) {
    newOrder.customerId = currentCustomerId;
  }
  if (typeof currentSellerId !== 'undefined' && currentSellerId) {
    newOrder.sellerId = currentSellerId;
  }
  var realMinimun = minimunAmount;
  if(minimunOnDeliveryOnly == 1 && newOrder.orderType != "Envio"){
    realMinimun = 0;
  }

  if($('.badge-option.active').length){
    if(parseFloat(newOrder.order_amount) >= realMinimun){
      if ($('#deliveryZone').length > 0 && $('#deliveryZone option:selected').val().length > 0) {
        newOrder.deliveryZone = $('#deliveryZone option:selected').text();
      }
      else{
        newOrder.deliveryZone = 'NA';
      }

      newOrder.total_amount = $('strong[name=basketFinalAmmount]').first().html();

      if (currentCustomerId > 0 ||
        (newOrder.orderType && 
          (
            (newOrder.orderType != "Envio" && newOrder.orderType != "Google Map") ||
            (newOrder.orderType == "Google Map" && deliveryPosition) ||
            (
              newOrder.orderType == "Envio" &&
              (
                !$('#deliveryZone option:selected').length ||
                $('#deliveryZone option:selected').val().length > 0
              )
            )
          )
        )
      ) {
        if(!validPosition && newOrder.orderType == "Google Map"){
          Swal.fire('Error', 'Valide la ubicación en el mapa antes de continuar.', "warning");
          return;
        }

        var valid = true;
        let directionAdded = false;
        var enter = "\r\n\r\n";
        var smallEnter = "\r\n";
        var message = "Tipo de Pedido : *" + (newOrder.orderType == "Envio" ? "Envío" : newOrder.orderType) + "*" + enter;
        message += "*• Datos del cliente*" + enter;
        if (currentCustomerId > 0) {
          message += "Nombre completo : *" + $('#orderName').val().trim() + "*" + smallEnter;
          message += "Dirección : *" + $('#orderAddress').val().trim() + "*" + smallEnter;
          message += "Teléfono : *" + $('#orderPhone').val().trim() + "*" + enter;
        } else {
          $('#clientData .col-12:not(.d-none), #clientData .col-6:not(.d-none)').each(function(){
            if ($(this).find('input').val().length > 0 || $(this).find('label').html() == "Departamento" || $(this).find('label').html() == "Localidad") {
              message += $(this).find('label').html();
              if ($(this).find('input').val().length > 0) {
                message += " : *" + $(this).find('input').val().trim() + "*" + smallEnter;
              }
              else{
                message += " : " + smallEnter;
              }

              if(newOrder.orderType == "Google Map" && deliveryPosition && $(this).find('label').html() == 'Dirección'){
                directionAdded = true;
                message += "(https://www.google.com/maps?q=" + deliveryPosition.getPosition().lat() + "," + deliveryPosition.getPosition().lng() + ")" + smallEnter;
              }
            }
            else{
              Swal.fire("Error", "Debe llenar el campo:" + $(this).find('label').html(), "error");
              valid = false;
            }
          });
        }

        if (!currentCustomerId > 0) {
          if(!directionAdded && newOrder.orderType == "Google Map"){
            newOrder.address = $('#mapAddress1').val();
            message += "Dirección : *" + $('#mapAddress1').val().trim() + "*" + smallEnter;
            message += "(https://www.google.com/maps?q=" + deliveryPosition.getPosition().lat() + "," + deliveryPosition.getPosition().lng() + ")" + smallEnter;
          }
        }
        message += "Medio de pago : *" + $('.badge-option.active span').html().trim() + "*" + enter;

        if (!currentCustomerId > 0) {
          if ($('#aditionalData .col-12').length > 0) {
            message += "*• Informacion Adicional*" + enter;
            $('#aditionalData .col-12').each(function(){
              if ($(this).find('input').val().length > 0) {
                message += $(this).find('label').html() + " : " + $(this).find('input').val() + smallEnter;
              }
              else{
                Swal.fire("Error", "Debe llenar el campo:" + $(this).find('label').html(), "error");
                valid = false;
              }
            });

            message += smallEnter;
          }
        }
  
        if (valid) {
          newOrder.orderDetail = new Array();
          message += "*• Detalle del pedido*" + enter;
          let messageCopy = message;

          $('#items .row.row-item').each(function(){
            var detail = new Object();
            detail.store_product_id = $(this).find('span[name="productId"]').html();
            detail.unit_price = $(this).find('span[name="basketProductPrice"]').html();
            let quantityVal = $(this).find('span[name="basketQuantity"]').html();
            if (!isNaN(quantityVal) && Number(quantityVal) % 1 === 0) {
              detail.quantity = parseInt(quantityVal, 10);
            } else {
              detail.quantity = quantityVal;
            }
            detail.detail = $(this).find(".name").html();
            detail.comment = $(this).find("input[name=basketItemComment]").val();
            detail.product_name = $(this).find(".name .basketProductName").html();
            detail.total_price = $(this).find('span[name="basketProductTotalPrice"]').html();
            detail.total_price_display = $(this).find('span[name="basketProductTotalPriceDisplay"]').html();
            detail.singleBasePrice = $(this).find('span[name="basketProductBasePrice"]').html();
            var prdocutComment = "";
            if(detail.comment.length > 0){
              prdocutComment = '_' + detail.comment + '_';
              detail.detail += '<br><span>' + detail.comment + '</span>';
            }
            
            let weightLabel = '';
            if (($(this).find('span[name="basketMinimunIncrease"]').html() % 1 != 0) || $(this).find('span[name="basketWeightSale"]').html() == 1) {
              weightLabel = ' Kg';
            }
            detail.weight_label = weightLabel.trim();
            newOrder.orderDetail.push(detail);
            message += "(" + symbol + $(this).find('span[name="basketProductTotalPriceDisplay"]').html() + ") *" + symbol + detail.unit_price + '* x *' + $(this).find('span[name="basketQuantity"]').html() + weightLabel + ' ' + $(this).find(".name .basketProductName").html().trim() + '*.' + enter;
            
            $(this).find(".name .basketProductOptional").each(function(){
              message += '*' + $(this).find('.basketOptionalName').html().trim() + '*: ' + $(this).find('.basketOptionalValues').html() + enter;
            });

            if(prdocutComment.length > 0){
              message += prdocutComment + enter;
            }
          });

          messageCopy += "{{orderDetail}}";
          
          let couponText = couponSet ? ' (' + $('#coupon_code').val() + ')' : '';
          message += "*• Sucursal : " + subsidiary.subsidiary_name.trim() + "*, " + subsidiary.address + smallEnter;
          messageCopy += "*• Sucursal : " + subsidiary.subsidiary_name.trim() + "*, " + subsidiary.address + smallEnter;
          message += "*• Total orden : " + symbol + SetMoneyFormat(newOrder.order_amount) + "*" + smallEnter;
          messageCopy += "*• Total orden : " + symbol + SetMoneyFormat(newOrder.order_amount) + "*" + smallEnter;

          if(newOrder.deliveryTariff > 0){
            message += "*• Costo envío : " + symbol + SetMoneyFormat(newOrder.deliveryTariff) + "*" + smallEnter;
            messageCopy += "*• Costo envío : " + symbol + SetMoneyFormat(newOrder.deliveryTariff) + "*" + smallEnter;
          }

          if(newOrder.discountAmount > 0){
            message += "*• Descuento : " + symbol + SetMoneyFormat(newOrder.discountAmount) + "*" + couponText + smallEnter;
            messageCopy += "*• Descuento : " + symbol + SetMoneyFormat(newOrder.discountAmount) + "*" + couponText + smallEnter;
          }

          if(newOrder.paymentTypeTax != 0){
            message += "*• Tasa adicional : " + symbol + SetMoneyFormat(newOrder.paymentTypeTax) + "*" + smallEnter;
            messageCopy += "*• Tasa adicional : " + symbol + SetMoneyFormat(newOrder.paymentTypeTax) + "*" + smallEnter;
          }

          message += "*• Total pedido : " + symbol + SetMoneyFormat(newOrder.total_amount) + "*";
          messageCopy += "*• Total pedido : " + symbol + SetMoneyFormat(newOrder.total_amount) + "*";

          if (exchangeRate > 0) {
            message += smallEnter + "*• Al cambio (" + exchangeRate.toFixed(2) + "): ARS " + SetMoneyFormat(newOrder.total_amount * exchangeRate) + "*";
            messageCopy += smallEnter + "*• Al cambio (" + exchangeRate.toFixed(2) + "): ARS " + SetMoneyFormat(newOrder.total_amount * exchangeRate) + "*";
          }

          $.blockUI();
          $.ajax({
            type: 'POST',
            url: 'saveOrder',
            data: {
              storeId : storeId,
              subsidiaryId : currentSubsidiaryId,
              order : newOrder,
              couponCode : couponSet ? $('#coupon_code').val() : '',
              couponId : couponSet ? currentCoupon.store_coupon_id : 0,
              message : message,
              currentProductList : currentProductList,
              currentOrderId : currentOrderId
            },
            success: function (result) {
              try{
                res = JSON.parse(result);
                if (res.success == true) {
                  if(pixelSetUp){
                    fbq('track', 'Purchase', {value: newOrder.total_amount, currency: res.symbol});
                  }

                  document.cookie = "productList_" + storeId +"=; expires=" + new Date(new Date().getHours - 1).toUTCString();
                  document.cookie = "subsidiary_" + storeId +"=; expires=" + new Date(new Date().getHours - 1).toUTCString();
                  $('#modalFinishOrder').modal('hide');
                  if(res.wsp != true){
                    Swal.fire("Pedido generado", "Recibirás vía mail una copia de tu orden.<br>Gracias por tu compra.", "success");
                  }

                  if (res.wsp == true) {
                    if (res.productWithStockWarning.length > 0) {
                      let messageOrderDetail = '';
                      $('#items .row.row-item').each(function(){
                        let detail = new Object();
                        detail.store_product_id = $(this).find('span[name="productId"]').html();
                        detail.comment = $(this).find("input[name=basketItemComment]").val();

                        let prdocutComment = "";
                        if(detail.comment.length > 0){
                          prdocutComment = '_' + detail.comment + '_';
                        }

                        let weightLabel = '';
                        if (($(this).find('span[name="basketMinimunIncrease"]').html() % 1 != 0) || $(this).find('span[name="basketWeightSale"]').html() == 1) {
                          weightLabel = ' Kg';
                        }
                        messageOrderDetail += "(" + symbol + " " + $(this).find('span[name="basketProductTotalPriceDisplay"]').html() + ") *" + $(this).find('span[name="basketQuantity"]').html() + weightLabel + '* x *' + $(this).find(".name .basketProductName").html().trim() + '*.' + enter;
                        
                        $(this).find(".name .basketProductOptional").each(function(){
                          messageOrderDetail += '*' + $(this).find('.basketOptionalName').html().trim() + '*: ' + $(this).find('.basketOptionalValues').html() + enter;
                        });
            
                        if(prdocutComment.length > 0){
                          messageOrderDetail += prdocutComment + enter;
                        }

                        res.productWithStockWarning.forEach(function(productId){
                          if (productId == detail.store_product_id){
                            messageOrderDetail += '*#stocklimitado*' + enter;
                            return false;
                          }
                        });
                      });

                      message = messageCopy.replace('{{orderDetail}}', messageOrderDetail);
                    }
                    let title = res.businessName + ' - ' + res.storeName + smallEnter;
                    let fechaText = 'Fecha: ' + res.currentDate + smallEnter;
                    message = title + fechaText + 'Pedido: ' + res.url + smallEnter + (res.urlEdit ? 'Modificar: ' + res.urlEdit + smallEnter : '') + "Número: *" + res.orderNumber + "*" + smallEnter + message;
                    message = message + enter + res.paymentMessage;
                    if (res.paymentRedirect == true) {
                      message = message + ' ' + res.paymentUrl;
                    }

                    // message = window.encodeURIComponent(message);
                    // window.location.href = "http://wa.me/" + subsidiary.phone_number + "/?text=" + message;
                    orderReady = true;
                    var form = document.createElement("form");
                    var orderId = document.createElement("input"); 
                    var messageToSend = document.createElement("input");  

                    form.method = "POST";
                    form.action = "sendWspMessage";

                    orderId.value = res.orderNumber;
                    orderId.name = "orderId";
                    form.appendChild(orderId);  

                    messageToSend.value = JSON.stringify(message);
                    messageToSend.name = "message";
                    form.appendChild(messageToSend);

                    document.body.appendChild(form);

                    form.submit();
                  }
                }
                else {
                  if( res.message && res.message.includes('Precios actualizados')){
                    Swal.fire("Error", res.message, "error").then((result) => {
                      document.cookie = "productList_" + storeId +"=; expires=" + new Date(new Date().getHours - 1).toUTCString();
                      document.cookie = "subsidiary_" + storeId +"=; expires=" + new Date(new Date().getHours - 1).toUTCString();
                      location.reload();
                    });
                  }
                  else{
                    Swal.fire("Error", res.message, "error");
                  }
                }
              }
              catch(err) {
                Swal.fire("Error", result + '|' + err.message, "error");
              }
            },
            complete: function(){
              $.unblockUI();
            }
          });
        }
      }
      else{
        if(googleMap == 1){
          Swal.fire("Error","Seleccione su ubicación en el mapa", "error");
        }
        else{
          Swal.fire("Error","Seleccione zona de envío", "error");
        }
      }
    }
    else{
      Swal.fire("Error","El monto mínimo de compra es : " + symbol + minimunAmount, "error");
    }
  }
  else{
    Swal.fire("Error","Seleccione el medio de pago.", "error");
  }
}

function SearchProduct()
{
  $('.category-card').addClass('d-none');
  var name = normalizeStringForSearch($('#search').val());
  $('.product-row').each(function(){
    var productName = $(this).find('.name').html().toLowerCase();
    var productDescription = $(this).find('.description').html().toLowerCase();
    if(normalizeStringForSearch(productName).includes(name.toLowerCase()) || normalizeStringForSearch(productDescription).includes(name.toLowerCase())){
      $(this).removeClass('d-none');
      var collapse = $(this).closest('.collapse');
      if(collapse){
        var sub = $(collapse).prev().find('.custom-card');
        if($(sub).hasClass('collapsed')){
          $(sub).trigger('click');
        }

        var collapse = $(this).closest('.collapse');
        if(collapse){
          var sub = $(collapse).prev().find('.custom-card');
          if($(sub).hasClass('collapsed')){
            $(sub).trigger('click');
          }
        }
      }
    }
    else{
      $(this).addClass('d-none');
    }
  });
}

function RemoveOptionValueQuantity(optionId, index){
  var quantity = $('#optionValueQuantity_' + optionId + '_' + index).html();
  if(quantity > 0){
    quantity--;
    $('#optionValueQuantity_' + optionId + '_' + index).html(quantity);
    $('#optionHeader_' + optionId).removeClass('required-message');
  }
}

function AddOptionValueQuantity(optionId, index){
  var quantity = $('#optionValueQuantity_' + optionId + '_' + index).html();
  var totalQuantity = 0;
  $('#option_' + optionId).find('span[id^="optionValueQuantity_' + optionId + '"]').each(function(){
    var optionQuantity = parseInt($(this).html());
    if(optionQuantity > 0){
      totalQuantity += optionQuantity;
    }
  });
  var max = parseInt($('#maxOption_' + optionId).html());
  if(max == 0 || totalQuantity < max){
    quantity++;
    $('#optionValueQuantity_' + optionId + '_' + index).html(quantity);
    $('#optionHeader_' + optionId).removeClass('required-message');
  }
}

function RemoveAditionalQuantity(aditionalId){
  let quantity = $('#aditional_' + aditionalId).html();
  if(quantity > 0){
    quantity--;
    $('#aditional_' + aditionalId).html(quantity);
  }

  CalculateProductPrice();
}

function AddAditionalQuantity(aditionalId){
  let quantity = $('#aditional_' + aditionalId).html();
  let totalQuantity = 0;
  $('.aditional-quantity').each(function(){
    let aditionalQuantity = parseInt($(this).html());
    if(aditionalQuantity > 0){
      totalQuantity += aditionalQuantity;
    }
  });
  var max = parseInt($('#aditional-div').data('limit'));
  if(max == 0 || totalQuantity < max){
    quantity++;
    $('#aditional_' + aditionalId).html(quantity);
  }

  CalculateProductPrice();
}

function ShowSubsidiaryByZone(zone){
  $('#zoneMessage').addClass('d-none');
  $('.zone-div').addClass('d-none');
  var zoneId = 'zone_' + zone;
  $("div[id='" + zoneId + "']").removeClass('d-none');
  $("div[id='" + zoneId + "'] .subzone-div").removeClass('d-none');
  $("div[id='" + zoneId + "'] .subsidiary-div").removeClass('d-none');
  $("div[id='" + zoneId + "'] .subzone-content .subsidiary-div").addClass('d-none');
  $("div[id='" + zoneId + "'] .subzone2-div").addClass('d-none');
  $("div[id='" + zoneId + "'] .subzone2-content .subsidiary-div").addClass('d-none');

  $('#changeZoneDiv').removeClass('d-none');
}

function ShowSubsidiaryBySubZone(subZone){
    $('.subzone-div').addClass('d-none');
    $('.subsidiary-div').addClass('d-none');
    $(".subzone2-div").addClass('d-none');
    $(".subzone2-content .subsidiary-div").addClass('d-none');
    var subZoneId = 'subzone_' + subZone;
    $("div[id='" + subZoneId + "']").removeClass('d-none');
    $("div[id='" + subZoneId + "'] .subsidiary-div").removeClass('d-none');
    $("div[id='" + subZoneId + "'] .subzone2-div").removeClass('d-none');
    $('#changeZoneDiv').removeClass('d-none');
}

function ShowSubsidiaryBySubZone2(subZone2){
    $('.subzone2-div').addClass('d-none');
    $('.subsidiary-div').addClass('d-none');
    var subZone2Id = 'subzone2_' + subZone2;
    $("div[id='" + subZone2Id + "']").removeClass('d-none');
    $("div[id='" + subZone2Id + "'] .subsidiary-div").removeClass('d-none');
    $('#changeZoneDiv').removeClass('d-none');
}

function ShowZoneList(){
  $('#changeZoneDiv').addClass('d-none');
  $('#zoneMessage').removeClass('d-none');
  $('.zone-div').removeClass('d-none');
  $("div[id^=zone_]").addClass('d-none');
  $(".subzone2-div").addClass('d-none');
  $(".subzone2-content").addClass('d-none');
  if ($("div[id^=zone_]").length == 0) {
      $('.subzone-div').removeClass('d-none');
      $('.subsidiary-div').removeClass('d-none');
      $('.subzone-content .subsidiary-div').addClass('d-none');
  }
}

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function AddProductToBasket(product){
  var productName = product.name;
  var optionalList = "";
  if(product.adtional.length > 0){
    productName += " " + product.adtional;
  }
  
  for (let i = 0; i < product.optionalList.length; i++) {
    optionalList += '<br><span class="basketProductOptional"><span class="basketOptionalName">' + product.optionalList[i].name + '</span>: <span class="basketOptionalValues">' + product.optionalList[i].value + '</span></span>';
  }
  let weightLabel = '';
  let widthForQuantity = 72;
  if (product.minimunIncrease % 1 != 0 || product.weightSale == 1) {
    weightLabel = 'Kg';
    widthForQuantity = 101;
  }
  var orderDetail = '<div class="row row-item" name="basket_' + product.basketItemId + '" data-basketid="' + product.basketItemId + '">' +
                        '<div class="col-12 bottom-border">' +
                          '<div class="custom-card">' +
                            '<div class="left" style="width:calc(100% - ' + widthForQuantity + 'px); flex-direction: column; align-items: start;">' +
                              '<h5 class="name" style="font-size: 15px;">' +
                                '<span class="basketProductName">' + productName + '</span>' +
                                optionalList +
                                '<span class="d-none" name="productId">' + product.productId + '</span>' +
                              '</h5>' +
                              '<span style="display: none;" name="basketProductPrice">' + product.singlePrice + '</span>' +
                              '<span style="display: none;" name="basketProductBasePrice">' + product.singleBasePrice + '</span>' +
                              '<span style="display: none;" name="basketProductPriceList">' + JSON.stringify(product.priceList) + '</span>' +
                              '<span style="display: none;" name="basketMinimunQuantity">' + product.minimunQuantity + '</span>' +
                              '<span style="display: none;" name="basketMinimunIncrease">' + product.minimunIncrease + '</span>' +
                              '<span style="display: none;" name="basketWeightSale">' + product.weightSale + '</span>' +
                              '<span style="display: none;" name="basketProductAditionalPrice">' + product.aditionalPrice + '</span>' +
                              '<span style="display: none;" name="basketToFixedValue">' + product.toFixedValue + '</span>' +
                              '<h6 class="secondary-font" style="margin: 0px;">' + symbol + '<span class="d-none" name="basketProductTotalPrice">' + parseFloat(product.totalPrice).toFixed(2) + '</span><span name="basketProductTotalPriceDisplay">' + SetMoneyFormat(product.totalPrice) + '</span></h6>' +
                            '</div>' +
                            '<div class="right" style="width: ' + widthForQuantity + 'px !important">' +
                              '<div class="next" style="padding: 2px 10px; max-width:100%">' +
                                '<em class="fas fa-minus-circle clickeable" style="color:red" onclick="RemoveBasketUnit(this, ' + product.productId + ', ' + product.basketItemId + ')"></em>' +
                                '<div style="display: inline-flex;justify-content: center; padding:0px 2px;"><span style="color:black" name="basketQuantity">' + product.quantity + '</span>' + weightLabel + '</div>'+
                                '<em class="fas fa-plus-circle clickeable text-button-color" onclick="AddBasketUnit(this, ' + product.productId + ', ' + product.basketItemId + ')"></em>' +
                              '</div>' +
                            '</div>' +
                          '</div>' +
                          '<div class="px-2 pb-2">' +
                            '<input name="basketItemComment" type="text" class="form-control" style="border-radius:25px;" value="' +  product.comment + '" placeholder="Comentarios...">'
                          '</div>' +
                        '</div>' +
                      '</div>';

  var smallOrderDetail = '<div class="row row-item" name="basket_' + product.basketItemId + '" data-basketid="' + product.basketItemId + '">' +
                        '<div class="col-12 p-0">' +
                          '<div class="custom-card" style="justify-content: space-between;">' +
                            '<div class="left" style="justify-content: space-between; width:calc(100% - ' + widthForQuantity + 'px); padding-left:10px;flex-direction: column; align-items: start;">' +
                              '<h5 class="name" style="font-size: 15px;">' +
                                '<span class="basketProductName">' + productName + '</span>' +
                                optionalList +
                              '</h5>' +
                              '<span style="display: none;" name="basketProductPrice">' + product.singlePrice + '</span>' +
                              '<span style="display: none;" name="basketProductBasePrice">' + product.singleBasePrice + '</span>' +
                              '<span style="display: none;" name="basketProductPriceList">' + JSON.stringify(product.priceList) + '</span>' +
                              '<span style="display: none;" name="basketMinimunQuantity">' + product.minimunQuantity + '</span>' +
                              '<span style="display: none;" name="basketMinimunIncrease">' + product.minimunIncrease + '</span>' +
                              '<span style="display: none;" name="basketWeightSale">' + product.weightSale + '</span>' +
                              '<span style="display: none;" name="basketToFixedValue">' + product.toFixedValue + '</span>' +
                              '<span style="display: none;" name="basketProductAditionalPrice">' + product.aditionalPrice + '</span>' +
                              '<h6 class="secondary-font" style="margin: 0px;">' + symbol + '<span name="basketProductTotalPriceDisplay">' + SetMoneyFormat(product.totalPrice) + '</span></h6>' +
                            '</div>' +
                            '<div class="text-right">' +
                              '<em class="fas fa-minus-circle clickeable sign-color" style="background-color: white; border-radius: 20px; padding: 2px;" onclick="RemoveBasketUnit(this, ' + product.productId + ', ' + product.basketItemId + ')"></em>' +
                              '<div style="display: inline-flex;justify-content: center; padding:0px 2px;"><span style="font-weight: bold; display:inline-block;" name="basketQuantity">' + product.quantity + '</span>' + weightLabel + '</div>'+
                              '<em class="fas fa-plus-circle clickeable sign-color" style="background-color: white; border-radius: 20px; padding: 2px;" onclick="AddBasketUnit(this, ' + product.productId + ', ' + product.basketItemId + ')"></em>' +
                            '</div>' +
                          '</div>' +
                        '</div>' +
                      '</div>';

  $('#items').append(orderDetail);
  $('#bg_' + product.productId).find('.inside-basket').append(smallOrderDetail);
  SelectSection(1);
}

function RemoveProductFromArray(productId, productbasketItemId){
  for (let i = 0; i < currentProductList.length; i++) {
    if(currentProductList[i].productId == productId && currentProductList[i].basketItemId == productbasketItemId){
      currentProductList.splice(i, 1);
      document.cookie = "productList_" + storeId +"=" + JSON.stringify(currentProductList) + "; expires=" + new Date(new Date().getHours + 1).toUTCString();
      return;
    }
  }
}

function UpdateQuantityProduct(productId, quantity, productbasketItemId){
  for (let i = 0; i < currentProductList.length; i++) {
    if(currentProductList[i].productId == productId && currentProductList[i].basketItemId == productbasketItemId){
      currentProductList[i].quantity = quantity;
      document.cookie = "productList_" + storeId +"=" + JSON.stringify(currentProductList) + "; expires=" + new Date(new Date().getHours + 1).toUTCString();
      return;
    }
  }
}

function HideSearch(){
  $(".popover").popover("hide");
}

function SearchCoupon(){
  let coupon = $('#coupon_code').val();
  if(coupon.length > 0 && !couponSet){
    $.blockUI();
    $.ajax({
      type: 'GET',
      url: 'searchCoupon',
      data: {
        storeId : storeId,
        couponCode : coupon,
        orderAmount : $('#basketTotalAmmount').html(),
        deliveryAmount : $('#basketDeliveryAmmount').html() ? $('#basketDeliveryAmmount').html() : 0,
      },
      success: function (result) {
        try{
          res = JSON.parse(result);
          if (res.success == true) {
            currentCoupon = res.coupon;
            couponSet = true;
            $('#coupon_code').prop('disabled', true);
            $('#wrongCoupon').addClass('d-none');
            $('#buttonSearchCoupon').addClass('d-none');
            $('#buttonDeleteCoupon').removeClass('d-none');
            $('#couponApplied').removeClass('d-none');
            CalculateBasketTotalPrice();
          }
          else {
            $('#coupon_code').prop('disabled', false);
            $('#wrongCoupon').removeClass('d-none');
            $('#buttonSearchCoupon').removeClass('d-none');
            $('#buttonDeleteCoupon').addClass('d-none');
            $('#couponApplied').addClass('d-none');
          }
        }
        catch(err) {
          Swal.fire("Error", result + '|' + err.message, "error");
        }
      },
      complete: function(){
        $.unblockUI();
      }
    });
  }
}

function CalculateDiscount(){
  let currentOrderAmount = $('#basketTotalAmmount').html();
  let currentDeliveryAmount = $('#basketDeliveryAmmount').html() ? $('#basketDeliveryAmmount').html() : 0;
  let currentTotalAmount = parseFloat(currentOrderAmount);
  let discount = 0;
  if(currentCoupon){
    if(currentCoupon.delivery_included == 1){
      currentTotalAmount = currentTotalAmount + parseFloat(currentDeliveryAmount);
      currentTotalAmount = parseFloat(currentTotalAmount).toFixed(2);
    }
    if(parseFloat(currentTotalAmount) >= parseFloat(currentCoupon.min_amount)){
      if(currentCoupon.percent == 1){
        discount = parseFloat(currentTotalAmount) * parseFloat(currentCoupon.discount) / 100;
        discount = parseFloat(discount).toFixed(2);
      }
      else{
        discount = parseFloat(currentCoupon.discount).toFixed(2);
      }

      if(parseFloat(discount) > parseFloat(currentTotalAmount)){
        discount = parseFloat(currentTotalAmount).toFixed(2);
      }

      if(parseFloat(currentCoupon.max_discount) > 0 && parseFloat(discount) > parseFloat(currentCoupon.max_discount)){
        discount = parseFloat(currentCoupon.max_discount).toFixed(2);
      }
    }
  }

  return discount;
}

function CalculatePaymentTypeTax(subtotal){
  let tax = 0;
  if($('.badge-option.active').length){
    tax = parseFloat(($('.badge-option.active').length > 0 ? $('.badge-option.active').data('tax') : 0));
    $('#paymentTypeTaxDiv').css('display', 'none');
    if(tax != 0){
      $('#paymentTypeTaxDiv').css('display', 'flex');
    }

    tax = subtotal * tax / 100;
  }
  return tax;
}

function DeleteCoupon(){
  currentCoupon = null;
  couponSet = false;
  $('#coupon_code').prop('disabled', false);
  $('#wrongCoupon').addClass('d-none');
  $('#buttonSearchCoupon').removeClass('d-none');
  $('#buttonDeleteCoupon').addClass('d-none');
  CalculateBasketTotalPrice();
}

function SetMoneyFormat(val){
  val = parseFloat(val);
  if(val % 1 == 0){
    val = parseFloat(val.toFixed(0));
  }
  else{
    val = parseFloat(val.toFixed(2));
  }

  val = val.toString().replace(".", ",");

  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function OpenPreloadedProductModal(){
  if(preselectedData.productId > 0){
    $('#bg_' + preselectedData.productId).find('button.btn-add').trigger('click');
  }
}

function OpenPreloadedCategoryModal(){
  if(preselectedData.categoryId > 0){
    $('.category-card[data-target="#category_' + preselectedData.categoryId + '"]').trigger('click');
  }
}

function CalculateDeliveryPrice(){
  let origin = JSON.parse(subsidiary.position);
  let destination = deliveryPosition.getPosition();

  if(destination){
    if(google.maps.geometry.poly.containsLocation(
      destination,
      subsidiaryZone
    )){
      var service = new google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [origin],
          destinations: [destination],
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false,
        }, callback
      );
    }
    else{
      setValidPosition(false);
      Swal.fire("Ubicación inválida", "La ubicación seleccionada esta fuera de cobertura.", "warning");
    }
  }
  else{
    Swal.fire("Ubicación inválida", "Ingrese una dirección en el mapa y luego marque la ubicación exacta de su domicilio.", "warning");
  }
}

function callback(response, status) {
  if(status == 'OK'){
    if(response.rows[0].elements[0].status == 'OK'){
      let distance = response.rows[0].elements[0].distance.value;
      distance = parseFloat(distance) / 1000;
      let roundedDistance = parseFloat(distance.toFixed(2));
      deliveryMapPrice = 0;
      let maxDistance = 0;
      let useDefaultPrice = true;
      let defaultPrice = 0;
      if(subsidiaryTariffList.length > 0){
        subsidiaryTariffList.forEach((tariff) => {
          if(roundedDistance >= parseFloat(tariff.min_distance) && roundedDistance <= parseFloat(tariff.max_distance)){
            useDefaultPrice = false;
            deliveryMapPrice = parseFloat(tariff.price);
          }
          else if(maxDistance <= parseFloat(tariff.max_distance)){
            maxDistance = parseFloat(tariff.max_distance);
            defaultPrice = parseFloat(tariff.price);
          }
        });
      }

      if(useDefaultPrice){
        deliveryMapPrice = defaultPrice;
      }

      setValidPosition(true);
      CalculateBasketTotalPrice();
      Swal.fire('Correcto', 'Ubicación validada correctamente.', 'success');
    }
  }
  else{
    setValidPosition(false);
    Swal.fire("Error", "Ocurrio un error al calcular la distancia al punto de entrega, por favor vuelva a intentar con otra ubicación.", "error");
  }

  $.unblockUI();
}

function setValidPosition(valid) {
    validPosition = valid;
    if (validPosition) {
      $('#positionValidatorButton').removeClass('invalid').addClass('valid');
      $('#positionValidatorButton').html('Ubicación confirmada');
    } else {
      $('#positionValidatorButton').removeClass('valid').addClass('invalid');
      $('#positionValidatorButton').html('Validar ubicación');
    }
}

function normalizeStringForSearch(string) {
  return string.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

window.addEventListener('beforeunload', function(e) {
  if(!orderReady){
    e.preventDefault();
    e.returnValue = '¿Estás seguro que deseas salir de la página?';
    return '¿Estás seguro que deseas salir de la página?';
  }
});

// Fallback para iOS
window.onbeforeunload = function(e) {
  if(!orderReady){
    e.preventDefault();
    e.returnValue = '¿Estás seguro que deseas salir de la página?';
    return '';
  }
};

function loadOrder(){
  preselectedOrderId = preselectedData.order.store_order_id;
  if(preselectedOrderId > 0){
    currentOrderId = preselectedData.order.store_order_id;
    if (preselectedData.order.order_type == "Google Map"){
      $("input[name='deliveryRadio'][value='Envio']").prop('checked', true);
    }
    else{
      $("input[name='deliveryRadio'][value='" + preselectedData.order.order_type + "']").prop('checked', true);
    }
    

    $('#orderName').val(preselectedData.order.name);
    $('#orderAddress').val(preselectedData.order.address);
    $('#orderReference').val(preselectedData.order.reference);
    $('#orderDepartamento').val(preselectedData.order.apartment);
    $('#orderLocalidad').val(preselectedData.order.locality);
    $('#orderBarrio').val(preselectedData.order.neighborhood);
    $('#orderCity').val(preselectedData.order.city);
    $('#orderProvince').val(preselectedData.order.province);
    $('#orderCountry').val(preselectedData.order.country);
    $('#orderPostalCode').val(preselectedData.order.postal_code);
    $('#orderPhone').val(preselectedData.order.phone);
    $('#orderEmail').val(preselectedData.order.email);
    $('#orderComment').val(preselectedData.order.comment);

    setTimeout(() => {
      $('.badge-option[data-id="' + preselectedData.order.paymentId + '"]').trigger('click');
    }, 200);
    
    $('#optional_1').val(preselectedData.order.optional_1);
    $('#optional_2').val(preselectedData.order.optional_2);
    $('#optional_3').val(preselectedData.order.optional_3);
    $('#orderNumeroMesa').val(preselectedData.order.numero_mesa);

    $('#mapAddress1').val(preselectedData.order.address);

    preselectedData.productList.forEach((product) => {
      if($('#bg_' + product.productId).length > 0){
        AddProductToBasket(product);
        $('#bg_'+ product.productId).addClass('selected-product-bg');
        $('#bg_'+ product.productId).find('.btn-add').html('Agregar otra opción');
        if (globalQuantity == 1) {
          UdateAllProductTotalPrice(product.productId);
        } else {
          UdateProductTotalPrice(product.quantity, product.basketItemId);
        }    
      }

      currentProductList.push(product);
      document.cookie = "productList_" + storeId +"=" + JSON.stringify(currentProductList) + "; expires=" + new Date(new Date().getHours + 1).toUTCString();
    });
  
    CalculateBasketTotalPrice();
  }
}

// Funciones para el mensaje de bienvenida
function hasWelcomeMessage() {
  return hasWelcomeMessageConfigured;
}

function showWelcomeMessage() {
  $('#welcomeMessageModal').modal();
  $('#welcomeMessageModal').css('padding-right', '0px');
}

function proceedToShowMenu() {
  $('#welcomeMessageModal').modal('hide');
}

function initializeStore(subsidiaryId, loadCookieData = false, hasPreloadedData = false) {
  // Verificar si hay mensaje de bienvenida configurado
  if (hasWelcomeMessage()) {
    // Mostrar mensaje de bienvenida primero
    showWelcomeMessage();
    
    // Guardar los parámetros para cuando se continue
    window.pendingShowMenu = {
      subsidiaryId: subsidiaryId,
      loadCookieData: loadCookieData,
      hasPreloadedData: hasPreloadedData
    };
  } else {
    // Mostrar el menú directamente
    ShowMenu(subsidiaryId, loadCookieData, hasPreloadedData);
  }
}

// Modificar proceedToShowMenu para continuar con el menú guardado
function proceedToShowMenu() {
  $('#welcomeMessageModal').modal('hide');
  
  // Mostrar el menú con los parámetros guardados
  if (window.pendingShowMenu) {
    ShowMenu(window.pendingShowMenu.subsidiaryId, window.pendingShowMenu.loadCookieData, window.pendingShowMenu.hasPreloadedData);
    window.pendingShowMenu = null;
  }
}

function SearchCustomer() {
  const customerCode = $('#customerCode').val().trim();
  const resultDiv = $('#customerSearchResult');
  
  if (!customerCode) {
    resultDiv.removeClass('d-none text-success').addClass('text-danger').text('Debe ingresar un código de cliente');
    return;
  }

  $.ajax({
    url: 'searchCustomer',
    type: 'GET',
    data: {
      storeId: storeId,
      customerCode: customerCode
    },
    success: function(response) {
      try {
        const res = JSON.parse(response);
        if (res.success) {
          // Llenar los campos del formulario con los datos del cliente
          if (res.customer.name) $('#orderName').val(res.customer.name);
          if (res.customer.phone) $('#orderPhone').val(res.customer.phone);
          
          $('#deliveryRadio[value=Envio]').trigger('click');
          if (res.customer.address) $('#orderAddress').val(res.customer.address);
          validPosition = true;
          $('.deliveryTypeDiv').addClass('d-none').removeClass('d-flex');
          $('#clientData div').not('#clientNameDiv').addClass('d-none').removeClass('d-block');
          $('#clientNameDiv input').prop('disabled', true);
          $('.badge-option[data-id="' + res.customer.paymentTypeId + '"]').trigger('click');
          $('.paymentTypeDiv').addClass('d-none').removeClass('d-flex');
          $('.aditionalDataDiv').addClass('d-none').removeClass('d-flex');
          $('.sellerDiv').addClass('d-none').removeClass('d-flex');
          // Si tiene vendedor asignado, llenar el campo de vendedor
          if (res.customer.seller_name) {
            $('#sellerName').val(res.customer.seller_name);
            currentSellerId = res.customer.seller;
          }
          
          currentCustomerId = res.customer.customer_id;
          resultDiv.removeClass('d-none text-danger').addClass('text-success').text(res.message);
        } else {
          currentCustomerId = null;
          resultDiv.removeClass('d-none text-success').addClass('text-danger').text(res.message);
          $('#clientDataHeader').text('3- Tus datos');

          $('#orderName').val('');
          $('#orderPhone').val('');
          $('#orderAddress').val('');
          $('.deliveryTypeDiv').removeClass('d-none').addClass('d-flex');
          $('#clientData div').not('#clientNameDiv').removeClass('d-none').addClass('d-block');
          $('#clientNameDiv input').prop('disabled', false);
          $('.badge-option').removeClass('active');
          $('.paymentTypeDiv').removeClass('d-none').addClass('d-flex');
          $('.aditionalDataDiv').removeClass('d-none').addClass('d-flex');
          $('.sellerDiv').removeClass('d-none').addClass('d-flex');
          $('#sellerName').val('');
          currentSellerId = null;
        }
      } catch (e) {
        resultDiv.removeClass('d-none text-success').addClass('text-danger').text('Error al procesar la respuesta');
      }
    },
    error: function() {
      resultDiv.removeClass('d-none text-success').addClass('text-danger').text('Error de conexión');
    }
  });
}

function SearchSeller() {
  const sellerName = $('#sellerName').val().trim();
  const resultDiv = $('#sellerSearchResult');
  
  if (!sellerName) {
    resultDiv.removeClass('d-none text-success').addClass('text-danger').text('Debe ingresar un nombre de vendedor');
    return;
  }

  $.ajax({
    url: 'searchSeller',
    type: 'GET',
    data: {
      storeId: storeId,
      sellerName: sellerName
    },
    success: function(response) {
      try {
        const res = JSON.parse(response);
        if (res.success) {
          currentSellerId = res.seller.seller_id;
          resultDiv.removeClass('d-none text-danger').addClass('text-success').text(res.message);
        } else {
          currentSellerId = null;
          resultDiv.removeClass('d-none text-success').addClass('text-danger').text(res.message);
        }
      } catch (e) {
        resultDiv.removeClass('d-none text-success').addClass('text-danger').text('Error al procesar la respuesta');
      }
    },
    error: function() {
      resultDiv.removeClass('d-none text-success').addClass('text-danger').text('Error de conexión');
    }
  });
}

function NewCustomer() {
  currentCustomerId = null;
  $('.frequentCustomerDiv').addClass('d-none').removeClass('d-flex');
  $('.deliveryTypeDiv').removeClass('d-none').addClass('d-flex');
  $('#clientDataHeader').text('3- Tus datos');
  $('#clientData').removeClass('d-none').addClass('d-flex');
  $('#clientNameDiv input').prop('disabled', false);
  $('#clientData div').not('#clientNameDiv').removeClass('d-none').addClass('d-block');
  $('#orderName').val('');
  $('#orderPhone').val('');
  $('#mapAddress1').val('');
  $('#orderAddress').val('');
  $('#orderReference').val('');
  $('#orderDepartamento').val('');
  $('#orderLocalidad').val('');
  $('#orderBarrio').val('');
  $('#orderProvince').val('');
  $('#orderCountry').val('');
  $('#orderPostalCode').val('');
  $('#optional_1').val('');
  $('#optional_2').val('');
  $('#optional_3').val('');
  $('.badge-option').removeClass('active');
  $('.paymentTypeDiv').removeClass('d-none').addClass('d-flex');
  $('.aditionalDataDiv').removeClass('d-none').addClass('d-flex');
  $('.sellerDiv').removeClass('d-none').addClass('d-flex');
  $('#sellerName').val('');
  currentSellerId = null;
}
