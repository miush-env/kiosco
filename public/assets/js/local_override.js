/**
 * ==============================================================================
 *  BLOQUE 1 - APP LOGIC & LOCAL ENGINE (OFFLINE & JSON DRIVEN)
 * ==============================================================================
 */

var LOCAL_CONFIG = {
  nombre: "Bloque 1",
  direccion: "Virgilio 3508",
  whatsapp: "+5491171449431",
  alias: "BLOQUE1.PIZZA.MP"
};

// Global Store State
var STORE_DATA = null;
var PRODUCTS = {};
var CART = [];
var ACTIVE_CATEGORY = "all";
var SEARCH_QUERY = "";
var CURRENT_SELECTED_PRODUCT = null;
var CURRENT_PRODUCT_QTY = 1;
var CURRENT_PAGE = 1;
var ITEMS_PER_PAGE = 5;
var SEARCH_BY_INGREDIENTS_ONLY = false;
var INVENTORY_MAP = {};

// Fallback food images by category if an item is missing an image
var CATEGORY_FALLBACK_IMAGES = {
  "burgers": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
  "pizzas-clasicas": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
  "pizzas-rellenas": "https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?w=600&auto=format&fit=crop&q=80",
  "pizzas-especiales": "https://images.unsplash.com/photo-1544982503-9f984c14501a?w=600&auto=format&fit=crop&q=80",
  "calzones": "https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=600&auto=format&fit=crop&q=80",
  "empanadas": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80",
  "promos": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80",
  "sandwiches": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80",
  "default": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80"
};

function getProductImage(item) {
  if (item && item.image && item.image.length > 5) return item.image;
  return CATEGORY_FALLBACK_IMAGES[item ? item.categoryId : "default"] || CATEGORY_FALLBACK_IMAGES["default"];
}

/* ── INVENTORY STOCK ENGINE ──────────────────────────────────────────────── */
var INGREDIENT_KEYWORDS = [
  { match: ['carne', 'medallon', 'hamburguesa'], id: 'ing_carne', label: 'Carne vacuna' },
  { match: ['cheddar'], id: 'ing_cheddar', label: 'Queso Cheddar' },
  { match: ['muzzarella', 'muzza'], id: 'ing_muzzarella', label: 'Muzzarella' },
  { match: ['roquefort', 'azul'], id: 'ing_roquefort', label: 'Queso Roquefort' },
  { match: ['papas', 'fritas'], id: 'ing_papas', label: 'Papas fritas' },
  { match: ['jamon', 'jamón'], id: 'ing_jamon', label: 'Jamón cocido' },
  { match: ['bacon', 'panceta'], id: 'ing_bacon', label: 'Panceta (Bacon)' },
  { match: ['masa', 'pizza', 'fugazzeta'], id: 'ing_masa_pizza', label: 'Masa de pizza' },
  { match: ['pan', 'brioche'], id: 'ing_pan_brioche', label: 'Pan brioche' },
  { match: ['salsa', 'tomate'], id: 'ing_salsa_tomate', label: 'Salsa de tomate' },
  { match: ['morron', 'morrón'], id: 'ing_morron', label: 'Morrón asado' },
  { match: ['cebolla'], id: 'ing_cebolla', label: 'Cebolla al oliva' },
  { match: ['aceituna', 'aceitunas'], id: 'ing_aceitunas', label: 'Aceitunas' },
  { match: ['palmito', 'palmitos'], id: 'ing_palmitos', label: 'Palmitos' },
  { match: ['empanada', 'empanadas'], id: 'ing_empanadas_stock', label: 'Empanadas' },
  { match: ['milanesa'], id: 'ing_milanesa', label: 'Milanesa' },
  { match: ['huevo'], id: 'ing_huevo', label: 'Huevo' }
];

function checkProductStockAvailability(product) {
  if (!product || Object.keys(INVENTORY_MAP).length === 0) {
    return { available: true, missingIngredients: [] };
  }

  // Producto vendido directamente (ligado 1:1 a un insumo por código de barras,
  // ej. gaseosas/snacks cargados por el escáner): su disponibilidad es su propio stock.
  if (product.linkedInventoryId) {
    var linkedItem = INVENTORY_MAP[product.linkedInventoryId];
    if (linkedItem && typeof linkedItem.stock === 'number' && linkedItem.stock <= 0) {
      return { available: false, missingIngredients: [linkedItem.name] };
    }
    return { available: true, missingIngredients: [] };
  }

  var missing = [];
  var combinedText = ((product.name || '') + ' ' + (product.description || '') + ' ' + ((product.ingredients || []).join(' '))).toLowerCase();

  INGREDIENT_KEYWORDS.forEach(function (mapping) {
    var isMatch = mapping.match.some(function (keyword) {
      return combinedText.includes(keyword);
    });
    if (isMatch) {
      var ing = INVENTORY_MAP[mapping.id];
      if (ing && typeof ing.stock === 'number' && ing.stock <= 0) {
        if (!missing.includes(mapping.label)) {
          missing.push(mapping.label);
        }
      }
    }
  });

  return {
    available: missing.length === 0,
    missingIngredients: missing
  };
}

function loadInventoryData(callback) {
  function applyList(list) {
    INVENTORY_MAP = {};
    if (Array.isArray(list)) {
      list.forEach(function (item) {
        INVENTORY_MAP[item.id] = item;
      });
    }
    var localOverrides = localStorage.getItem("BLOQUE1_INVENTORY_STOCK");
    if (localOverrides) {
      try {
        var parsed = JSON.parse(localOverrides);
        if (Array.isArray(parsed)) {
          parsed.forEach(function (p) {
            if (INVENTORY_MAP[p.id]) INVENTORY_MAP[p.id].stock = p.stock;
          });
        }
      } catch (e) {}
    }
  }

  $.getJSON("/api/inventory")
    .done(function (res) {
      if (res && res.success && Array.isArray(res.inventory)) {
        applyList(res.inventory);
      }
      if (callback) callback();
    })
    .fail(function () {
      $.getJSON("assets/data/inventory.json")
        .done(function (localList) {
          applyList(localList);
        })
        .always(function () {
          if (callback) callback();
        });
    });
}

// Stub for Google Maps
function initMap() { /* offline no-op */ }

/* ── FORMAT CURRENCY ──────────────────────────────────────────────────────── */
function formatMoney(amount) {
  var num = parseFloat(amount);
  if (isNaN(num)) return "0";
  return num.toLocaleString("es-AR");
}

/* ── INITIALIZATION ───────────────────────────────────────────────────────── */
$(document).ready(function () {
  loadStoreData();

  // Infinite video loop watchdog
  var bannerVideo = document.getElementById("bannerHeroVideo");
  if (bannerVideo) {
    bannerVideo.addEventListener("ended", function () {
      bannerVideo.currentTime = 0;
      bannerVideo.play().catch(function () {});
    });
    // Ensure play starts on user interaction if restricted by browser autoplay policy
    document.addEventListener("touchstart", function () {
      if (bannerVideo.paused) bannerVideo.play().catch(function () {});
    }, { once: true });
    document.addEventListener("click", function () {
      if (bannerVideo.paused) bannerVideo.play().catch(function () {});
    }, { once: true });
  }

  // Search input event (resets to page 1)
  $(document).on("input", "#appSearchInput", function () {
    SEARCH_QUERY = $(this).val().toLowerCase().trim();
    CURRENT_PAGE = 1;
    renderMainView();
  });

  // Category pill click event (resets to page 1)
  $(document).on("click", ".b1-category-pill", function () {
    var catId = $(this).data("category");
    ACTIVE_CATEGORY = catId;
    CURRENT_PAGE = 1;
    $(".b1-category-pill").removeClass("active");
    $(this).addClass("active");
    renderMainView();
  });

  // Delivery type selection in checkout
  $(document).on("click", ".b1-choice-card", function () {
    $(".b1-choice-card").removeClass("active");
    $(this).addClass("active");
    var val = $(this).data("value");
    if (val === "envio") {
      $("#checkoutAddressGroup").slideDown(200);
    } else {
      $("#checkoutAddressGroup").slideUp(200);
    }
    updateCheckoutSummary();
  });

  // Payment chip selection in checkout (Toggles Transfer Alias Box & CTA Text)
  $(document).on("click", ".b1-payment-chip", function () {
    $(".b1-payment-chip").removeClass("active");
    $(this).addClass("active");
    var method = $(this).data("method");
    if (method === "transferencia") {
      $("#transferDetailsBox").slideDown(200);
      $("#checkoutCtaBtnText").html('<i class="fab fa-whatsapp" style="font-size: 18px; margin-right: 6px;"></i> Enviar por WhatsApp');
    } else if (method === "mercadopago") {
      $("#transferDetailsBox").slideUp(200);
      $("#checkoutCtaBtnText").html('<i class="fas fa-lock" style="font-size: 16px; margin-right: 6px;"></i> Pagar con Mercado Pago');
    } else {
      $("#transferDetailsBox").slideUp(200);
      $("#checkoutCtaBtnText").html('<i class="fab fa-whatsapp" style="font-size: 18px; margin-right: 6px;"></i> Enviar por WhatsApp');
    }
  });

  // Check if returning from Mercado Pago
  checkMercadoPagoPaymentReturn();

  // Prevent background scrolling when modals are open
  $(document).on('show.bs.modal', '.modal', function () {
    $('body').addClass('modal-open').css('overflow', 'hidden');
  });
  $(document).on('hidden.bs.modal', '.modal', function () {
    if ($('.modal.show').length === 0) {
      $('body').removeClass('modal-open').css('overflow', '');
    }
  });

  // Footer WhatsApp contact click
  $(document).on("click", "#agencyWspBtn", function (e) {
    e.preventDefault();
    var cleanNum = LOCAL_CONFIG.whatsapp.replace(/[^\d]/g, '');
    var text = encodeURIComponent("¡Hola Bloque 1! Me interesa contratar el servicio de app web para mi negocio");
    window.open("https://wa.me/" + cleanNum + "?text=" + text, "_blank");
  });

  // Disable old social placeholders
  $(document).on("click", "#instagramLink, #googleLink", function (e) {
    e.preventDefault();
  });
});

/* ── LOAD DATA FROM JSON ──────────────────────────────────────────────────── */
function loadStoreData() {
  $.getJSON("assets/data/products.json")
    .done(function (data) {
      loadInventoryData(function () {
        initAppWithData(data);
      });
    })
    .fail(function () {
      console.warn("[Bloque 1] Fallback a datos locales integrados.");
      loadInventoryData(function () {
        initAppWithData(getEmbeddedFallbackData());
      });
    });
}

function initAppWithData(data) {
  STORE_DATA = data;
  PRODUCTS = {};

  if (data.storeInfo) {
    if (data.storeInfo.name) LOCAL_CONFIG.nombre = data.storeInfo.name;
    if (data.storeInfo.address) LOCAL_CONFIG.direccion = data.storeInfo.address;
    if (data.storeInfo.whatsapp) LOCAL_CONFIG.whatsapp = data.storeInfo.whatsapp;
  }

  // Populate PRODUCTS lookup map
  if (data.products && Array.isArray(data.products)) {
    data.products.forEach(function (p) {
      PRODUCTS[p.id] = p;
    });
  }

  renderCategories();
  renderMainView();
  updateCartUI();
}

/* ── RENDER CATEGORIES ────────────────────────────────────────────────────── */
function renderCategories() {
  if (!STORE_DATA || !STORE_DATA.categories) return;

  var $container = $("#categoriesScrollContainer");
  $container.empty();

  STORE_DATA.categories.forEach(function (cat) {
    var isActive = cat.id === ACTIVE_CATEGORY ? "active" : "";
    var html =
      '<button class="b1-category-pill ' + isActive + '" data-category="' + cat.id + '">' +
        '<span class="b1-category-icon">' + (cat.icon || "🍽️") + '</span>' +
        '<span>' + cat.name + '</span>' +
      '</button>';
    $container.append(html);
  });
}

/* ── RENDER MAIN VIEW (SUGGESTIONS + PAGINATED PRODUCTS) ──────────────────── */
function renderMainView() {
  if (!STORE_DATA || !STORE_DATA.products) return;

  // 1. Suggestions Section (Top 4 recommended items on home view)
  var $suggSection = $("#suggestionsSection");
  var $suggGrid = $("#suggestionsGrid");
  $suggGrid.empty();

  if (ACTIVE_CATEGORY === "all" && SEARCH_QUERY.length === 0) {
    $suggSection.show();
    var topSuggestions = STORE_DATA.products.filter(function (p) {
      return p.badge || parseFloat(p.rating || 0) >= 4.9;
    }).slice(0, 4);

    topSuggestions.forEach(function (item) {
      var stockInfo = checkProductStockAvailability(item);
      var badgeHtml = !stockInfo.available
        ? '<span class="b1-item-badge out-of-stock"><i class="fas fa-ban"></i> Sin stock</span>'
        : (item.badge ? '<span class="b1-item-badge">' + item.badge + '</span>' : '');

      var card =
        '<div class="b1-suggestion-card ' + (!stockInfo.available ? 'is-out-of-stock' : '') + '" onclick="ShowProductDetail(' + item.id + ')">' +
          '<div class="b1-sugg-img-wrapper">' +
            '<img src="' + getProductImage(item) + '" alt="' + item.name + '" class="b1-sugg-img" loading="lazy" onerror="this.onerror=null;this.src=\'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600\';">' +
          '</div>' +
          '<div class="b1-sugg-body">' +
            '<h4 class="b1-sugg-title">' + item.name + '</h4>' +
            '<div class="b1-sugg-footer">' +
              '<span class="b1-sugg-price">$' + formatMoney(item.price) + '</span>' +
              '<span class="b1-sugg-rating"><i class="fas fa-star"></i> ' + (item.rating || '4.8') + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';
      $suggGrid.append(card);
    });
  } else {
    $suggSection.hide();
  }

  // 2. Filtered Products List with Pagination (5 per page)
  var $container = $("#dynamicProductsContainer");
  var $pagination = $("#paginationControls");
  $container.empty();
  $pagination.empty();

  var filtered = STORE_DATA.products.filter(function (item) {
    var matchesCat = (ACTIVE_CATEGORY === "all") || (item.categoryId === ACTIVE_CATEGORY);
    var matchesSearch = true;
    if (SEARCH_QUERY.length > 0) {
      var nameMatch = (item.name || "").toLowerCase().includes(SEARCH_QUERY);
      var descMatch = (item.description || "").toLowerCase().includes(SEARCH_QUERY);
      var ingredientsList = (item.ingredients || []).map(function (i) { return String(i).toLowerCase(); });
      var ingredientsText = ingredientsList.join(" ");
      var ingMatch = ingredientsText.includes(SEARCH_QUERY) || ingredientsList.some(function (ing) { return ing.includes(SEARCH_QUERY); });

      // Automatically searches dish name, description, AND ingredients by default
      matchesSearch = nameMatch || descMatch || ingMatch;
    }
    return matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    $container.html(
      '<div style="text-align: center; padding: 40px 16px; color: var(--b1-color-text-muted);">' +
        '<div style="font-size: 40px; margin-bottom: 8px;">🔍</div>' +
        '<h4 style="font-weight: 700; color: var(--b1-color-text-main); margin: 0 0 4px;">No encontramos resultados</h4>' +
        '<p style="font-size: 13px; margin: 0;">Probá buscando con otra palabra o categoría.</p>' +
      '</div>'
    );
    $pagination.hide();
    return;
  }

  var totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  if (CURRENT_PAGE > totalPages) CURRENT_PAGE = 1;
  if (CURRENT_PAGE < 1) CURRENT_PAGE = 1;

  var startIndex = (CURRENT_PAGE - 1) * ITEMS_PER_PAGE;
  var pageItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  pageItems.forEach(function (item) {
    var stockInfo = checkProductStockAvailability(item);
    var isAvailable = stockInfo.available;

    var badgeHtml = "";
    if (!isAvailable) {
      badgeHtml = '<span class="b1-item-badge out-of-stock"><i class="fas fa-ban"></i> Sin stock</span>';
    } else if (item.badge) {
      badgeHtml = '<span class="b1-item-badge">' + item.badge + '</span>';
    }
    
    var ratingHtml = item.rating
      ? '<span style="font-size: 11px; font-weight: 700; color: var(--b1-color-text-muted);"><i class="fas fa-star" style="color: var(--b1-color-accent);"></i> ' + item.rating + '</span>'
      : '';

    var card =
      '<div class="b1-product-row-card ' + (!isAvailable ? 'is-out-of-stock' : '') + '" onclick="ShowProductDetail(' + item.id + ')">' +
        '<img src="' + getProductImage(item) + '" alt="' + item.name + '" class="b1-row-thumb" loading="lazy" onerror="this.onerror=null;this.src=\'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600\';">' +
        '<div class="b1-row-info">' +
          '<div class="b1-row-badge-row">' +
            badgeHtml +
            ratingHtml +
          '</div>' +
          '<h3 class="b1-row-title">' + item.name + '</h3>' +
          '<p class="b1-row-desc">' + (item.description || "") + '</p>' +
          (!isAvailable ? '<span style="font-size: 11px; font-weight: 700; color: #DC2626; display: flex; align-items: center; gap: 4px; margin-bottom: 4px;"><i class="fas fa-exclamation-circle"></i> Sin stock para hacer el pedido</span>' : '') +
          '<div class="b1-row-price-row">' +
            '<span class="b1-row-price">$' + formatMoney(item.price) + '</span>' +
            (isAvailable
              ? '<button type="button" class="b1-row-add-btn" onclick="event.stopPropagation(); ShowProductDetail(' + item.id + ')"><i class="fas fa-plus"></i></button>'
              : '<button type="button" class="b1-row-add-btn disabled" disabled title="Sin stock disponible" onclick="event.stopPropagation(); ShowProductDetail(' + item.id + ')"><i class="fas fa-ban"></i></button>'
            ) +
          '</div>' +
        '</div>' +
      '</div>';

    $container.append(card);
  });

  // Render Pagination Controls
  if (totalPages > 1) {
    $pagination.show();
    var paginationHtml =
      '<button type="button" class="b1-page-btn" onclick="changePage(-1)" ' + (CURRENT_PAGE <= 1 ? 'disabled' : '') + '>' +
        '<i class="fas fa-chevron-left"></i> Anterior' +
      '</button>' +
      '<span class="b1-page-indicator">Página <strong>' + CURRENT_PAGE + '</strong> de <strong>' + totalPages + '</strong></span>' +
      '<button type="button" class="b1-page-btn" onclick="changePage(1)" ' + (CURRENT_PAGE >= totalPages ? 'disabled' : '') + '>' +
        'Siguiente <i class="fas fa-chevron-right"></i>' +
      '</button>';
    $pagination.html(paginationHtml);
  } else {
    $pagination.hide();
  }
}

/* ── CHANGE PAGE HELPER ───────────────────────────────────────────────────── */
function changePage(delta) {
  CURRENT_PAGE += delta;
  renderMainView();
  var target = document.getElementById("allProductsSectionHeader");
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/* ── OPEN DEDICATED PRODUCT DETAIL PAGE (MINI-PAGINA MODAL) ──────────────── */
function ShowProductDetail(productId) {
  var p = PRODUCTS[productId];
  if (!p) return;

  CURRENT_SELECTED_PRODUCT = p;
  CURRENT_PRODUCT_QTY = 1;

  var stockInfo = checkProductStockAvailability(p);
  var isAvailable = stockInfo.available;

  // Set Hero Image with fallback
  $("#detailHeroImg").attr("src", getProductImage(p)).attr("alt", p.name).attr("onerror", "this.onerror=null;this.src='https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600';");

  // Set Title & Price
  $("#detailTitle").text(p.name);
  $("#detailPrice").text("$" + formatMoney(p.price));
  $("#detailDesc").text(p.description || "Elaborado artesanalmente con ingredientes frescos.");

  // Stock Availability Notice Banner
  if (!isAvailable) {
    var missingText = stockInfo.missingIngredients.length > 0
      ? "Nos quedamos sin insumos en cocina para preparar este plato (" + stockInfo.missingIngredients.join(", ") + ")."
      : "Nos quedamos sin insumos en cocina para preparar este plato.";
    $("#detailOutOfStockText").text(missingText);
    $("#detailOutOfStockBanner").show();

    $("#detailAddBtn")
      .addClass("disabled")
      .prop("disabled", true)
      .html('<i class="fas fa-ban" style="margin-right: 6px;"></i> Sin stock para hacer el pedido');

    $(".b1-step-btn").prop("disabled", true).css("opacity", "0.4");
  } else {
    $("#detailOutOfStockBanner").hide();
    $("#detailAddBtn")
      .removeClass("disabled")
      .prop("disabled", false)
      .html('<span><i class="fas fa-plus-circle" style="margin-right: 6px;"></i> Agregar a mi pedido</span> <span id="detailCtaTotal">$' + formatMoney(p.price) + '</span>');

    $(".b1-step-btn").prop("disabled", false).css("opacity", "1");
  }

  // Render Ingredients Breakdown Pills
  var $ingredientsList = $("#detailIngredientsList");
  $ingredientsList.empty();

  var ingredients = p.ingredients;
  if (!ingredients || ingredients.length === 0) {
    // If not explicit, derive from description
    ingredients = (p.description || "").split(",").map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
  }

  if (ingredients && ingredients.length > 0) {
    $("#detailIngredientsSection").show();
    ingredients.forEach(function (ing) {
      var isIngMissing = stockInfo.missingIngredients.some(function (m) {
        return ing.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(ing.toLowerCase());
      });
      if (isIngMissing) {
        $ingredientsList.append('<span class="b1-ingredient-tag missing"><i class="fas fa-times-circle" style="color: #DC2626; font-size: 11px;"></i> ' + ing + ' (Sin stock)</span>');
      } else {
        $ingredientsList.append('<span class="b1-ingredient-tag"><i class="fas fa-check-circle" style="color: var(--b1-color-primary); font-size: 11px;"></i> ' + ing + '</span>');
      }
    });
  } else {
    $("#detailIngredientsSection").hide();
  }

  // Reset Quantity & Note Field
  $("#detailQtyDisplay").text("1");
  $("#detailCommentInput").val("");

  _updateDetailTotal();
  $("#modalProductView").modal("show");
}

function detailAddUnit() {
  if (CURRENT_SELECTED_PRODUCT && !checkProductStockAvailability(CURRENT_SELECTED_PRODUCT).available) return;
  CURRENT_PRODUCT_QTY++;
  $("#detailQtyDisplay").text(CURRENT_PRODUCT_QTY);
  _updateDetailTotal();
}

function detailRemoveUnit() {
  if (CURRENT_PRODUCT_QTY > 1) {
    CURRENT_PRODUCT_QTY--;
    $("#detailQtyDisplay").text(CURRENT_PRODUCT_QTY);
    _updateDetailTotal();
  }
}

function _updateDetailTotal() {
  if (!CURRENT_SELECTED_PRODUCT) return;
  var stockInfo = checkProductStockAvailability(CURRENT_SELECTED_PRODUCT);
  if (!stockInfo.available) return;
  var total = CURRENT_SELECTED_PRODUCT.price * CURRENT_PRODUCT_QTY;
  $("#detailCtaTotal").text("$" + formatMoney(total));
}

/* ── ADD TO CART FROM DETAIL PAGE ─────────────────────────────────────────── */
function addProductFromDetail() {
  if (!CURRENT_SELECTED_PRODUCT) return;

  var stockInfo = checkProductStockAvailability(CURRENT_SELECTED_PRODUCT);
  if (!stockInfo.available) {
    Swal.fire({
      icon: "warning",
      title: "Plato no disponible",
      text: "Lo sentimos, no hay stock de insumos suficientes en cocina para preparar este plato.",
      confirmButtonColor: "#FF6B00"
    });
    return;
  }

  var comment = $("#detailCommentInput").val() ? $("#detailCommentInput").val().trim() : "";
  var cartItem = {
    cartId: Date.now() + "_" + Math.random().toString(36).substr(2, 5),
    id: CURRENT_SELECTED_PRODUCT.id,
    name: CURRENT_SELECTED_PRODUCT.name,
    price: CURRENT_SELECTED_PRODUCT.price,
    quantity: CURRENT_PRODUCT_QTY,
    comment: comment,
    image: getProductImage(CURRENT_SELECTED_PRODUCT),
    total: CURRENT_SELECTED_PRODUCT.price * CURRENT_PRODUCT_QTY,
    linkedInventoryId: CURRENT_SELECTED_PRODUCT.linkedInventoryId || null
  };

  CART.push(cartItem);
  $("#modalProductView").modal("hide");
  updateCartUI();

  // Floating Cart Bar Pulse Animation
  $("#floatingCartBar").css("transform", "scale(1.04)");
  setTimeout(function () {
    $("#floatingCartBar").css("transform", "scale(1)");
  }, 200);
}

/* ── CART STATE & UI SYNC ─────────────────────────────────────────────────── */
function updateCartUI() {
  var count = 0;
  var subtotal = 0;

  CART.forEach(function (item) {
    count += item.quantity;
    subtotal += item.price * item.quantity;
  });

  // Top header button badge
  if (count > 0) {
    $("#topCartBadge").text(count).show();
    $("#floatingCartBar").fadeIn(200);
  } else {
    $("#topCartBadge").hide();
    $("#floatingCartBar").fadeOut(200);
  }

  // Floating bottom bar values ("1 plato" / "2 platos")
  $("#floatingCartCount").text(count + (count === 1 ? " plato" : " platos"));
  $("#floatingCartTotal").text("$" + formatMoney(subtotal));

  renderCartModal();
}

function renderCartModal() {
  var $container = $("#modernCartItemsContainer");
  $container.empty();

  if (CART.length === 0) {
    $container.html(
      '<div style="text-align: center; padding: 40px 16px; color: var(--b1-color-text-muted);">' +
        '<div style="font-size: 48px; margin-bottom: 12px;">🛒</div>' +
        '<h4 style="font-weight: 800; color: var(--b1-color-text-main); margin: 0 0 6px;">Tu carrito está vacío</h4>' +
        '<p style="font-size: 13px; margin: 0 0 16px;">¡Agregá tus platos favoritos desde el menú!</p>' +
        '<button type="button" class="b1-add-btn" data-dismiss="modal" style="padding: 10px 24px;">Ver el Menú</button>' +
      '</div>'
    );
    $("#cartCheckoutBtn").prop("disabled", true).css("opacity", "0.5");
    $("#cartModalTotalDisplay").text("$0");
    return;
  }

  $("#cartCheckoutBtn").prop("disabled", false).css("opacity", "1");
  var subtotal = 0;

  CART.forEach(function (item, index) {
    subtotal += item.price * item.quantity;

    var commentPromptHtml = item.comment
      ? '<div class="b1-cart-item-comment-prompt" onclick="_editCartItemComment(' + index + ')"><i class="fas fa-edit" style="color: var(--b1-color-primary);"></i> <span>' + item.comment + '</span></div>'
      : '<div class="b1-cart-item-comment-prompt" onclick="_editCartItemComment(' + index + ')"><i class="far fa-comment-dots"></i> <span>+ Agregar nota / aclaración</span></div>';

    var itemHtml =
      '<div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--b1-color-border-light);">' +
        '<img src="' + (item.image || CATEGORY_FALLBACK_IMAGES['default']) + '" style="width: 54px; height: 54px; border-radius: 12px; object-fit: cover; margin-right: 12px; border: 1px solid var(--b1-color-border-light); cursor: pointer;" onclick="_editCartItemComment(' + index + ')">' +
        '<div style="flex: 1; min-width: 0; padding-right: 10px;">' +
          '<h4 style="font-size: 14px; font-weight: 700; margin: 0 0 2px; color: var(--b1-color-text-main); line-height: 1.2; cursor: pointer;" onclick="_editCartItemComment(' + index + ')">' + item.name + '</h4>' +
          '<div style="font-size: 14px; font-weight: 800; color: var(--b1-color-primary);">$' + formatMoney(item.price * item.quantity) + '</div>' +
          commentPromptHtml +
        '</div>' +
        '<div style="display: flex; align-items: center; gap: 8px;">' +
          '<button type="button" class="b1-step-btn minus" style="width: 32px; height: 32px; font-size: 11px;" onclick="_cartModifyQty(' + index + ', -1)">' +
            (item.quantity === 1 ? '<i class="fas fa-trash-alt"></i>' : '<i class="fas fa-minus"></i>') +
          '</button>' +
          '<span style="font-size: 14px; font-weight: 800; min-width: 16px; text-align: center;">' + item.quantity + '</span>' +
          '<button type="button" class="b1-step-btn plus" style="width: 32px; height: 32px; font-size: 11px;" onclick="_cartModifyQty(' + index + ', 1)"><i class="fas fa-plus"></i></button>' +
        '</div>' +
      '</div>';

    $container.append(itemHtml);
  });

  $("#cartModalTotalDisplay").text("$" + formatMoney(subtotal));
}

function _editCartItemComment(index) {
  if (!CART[index]) return;
  Swal.fire({
    title: 'Aclaración para ' + CART[index].name,
    text: '¿Tenés alguna nota para la cocina? (ej: sin cebolla, aderezo aparte, etc.)',
    input: 'text',
    inputValue: CART[index].comment || '',
    inputPlaceholder: 'Escribí tu aclaración aquí...',
    showCancelButton: true,
    confirmButtonColor: '#FF6B00',
    cancelButtonColor: '#8E8E93',
    confirmButtonText: 'Guardar aclaración',
    cancelButtonText: 'Cancelar'
  }).then(function (result) {
    if (result.isConfirmed) {
      CART[index].comment = result.value ? result.value.trim() : '';
      updateCartUI();
    }
  });
}

function copyTransferAlias() {
  var alias = (LOCAL_CONFIG && LOCAL_CONFIG.alias) ? LOCAL_CONFIG.alias : "BLOQUE1.PIZZA.MP";
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(alias).then(function () {
      Swal.fire({
        toast: true,
        position: 'top',
        icon: 'success',
        title: '¡Alias copiado al portapapeles!',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
    });
  } else {
    var temp = document.createElement("input");
    temp.value = alias;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    document.body.removeChild(temp);
    Swal.fire({
      toast: true,
      position: 'top',
      icon: 'success',
      title: '¡Alias copiado al portapapeles!',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });
  }
}

function _cartModifyQty(index, delta) {
  if (CART[index]) {
    CART[index].quantity += delta;
    if (CART[index].quantity <= 0) {
      CART.splice(index, 1);
    }
    updateCartUI();
  }
}

function openCartModal() {
  $("#basketModal").modal("show");
}

function clearCartAll() {
  Swal.fire({
    title: "¿Vaciar el carrito?",
    text: "Se eliminarán todos los productos seleccionados.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#FF6B00",
    cancelButtonColor: "#8E8E93",
    confirmButtonText: "Sí, vaciar",
    cancelButtonText: "Cancelar"
  }).then(function (result) {
    if (result.isConfirmed) {
      CART = [];
      updateCartUI();
      $("#basketModal").modal("hide");
    }
  });
}

/* ── CHECKOUT STEP ────────────────────────────────────────────────────────── */
function FinishOrder() {
  if (CART.length === 0) {
    Swal.fire("Carrito vacío", "Agregá productos antes de continuar.", "warning");
    return;
  }
  $("#basketModal").modal("hide");
  updateCheckoutSummary();
  $("#modalFinishOrder").modal("show");
}

function updateCheckoutSummary() {
  var subtotal = 0;
  CART.forEach(function (i) { subtotal += i.price * i.quantity; });
  var isDelivery = $(".b1-choice-card.active").data("value") === "envio";
  var deliveryCost = 0; // Envío Gratis

  $("#checkoutSubtotal").text("$" + formatMoney(subtotal));
  $("#checkoutDelivery").text(isDelivery ? "Gratis" : "Retiro en local");
  $("#checkoutTotal").text("$" + formatMoney(subtotal + deliveryCost));
  $("#checkoutBtnTotal").text("$" + formatMoney(subtotal + deliveryCost));
}

/* ── SEND ORDER TO WHATSAPP OR MERCADO PAGO ───────────────────────────────── */
function Order() {
  if (CART.length === 0) {
    Swal.fire("¡Ups!", "No hay productos en el carrito.", "warning");
    return;
  }

  var name = $("#orderCustomerName").val() ? $("#orderCustomerName").val().trim() : "";
  var phone = $("#orderCustomerPhone").val() ? $("#orderCustomerPhone").val().trim() : "";
  var isDelivery = $(".b1-choice-card.active").data("value") === "envio";
  var address = $("#orderCustomerAddress").val() ? $("#orderCustomerAddress").val().trim() : "";
  var selectedPaymentChip = $(".b1-payment-chip.active");
  var paymentMethod = selectedPaymentChip.data("method") || "efectivo";
  var paymentLabel = selectedPaymentChip.text().trim() || "Efectivo";

  if (!name) {
    Swal.fire("Faltan datos", "Por favor ingresá tu nombre completo.", "error");
    $("#orderCustomerName").focus();
    return;
  }

  if (isDelivery && !address) {
    Swal.fire("Faltan datos", "Por favor ingresá tu dirección de entrega.", "error");
    $("#orderCustomerAddress").focus();
    return;
  }

  var orderData = {
    customerName: name,
    customerPhone: phone,
    customerAddress: address,
    isDelivery: isDelivery,
    paymentMethod: paymentMethod,
    paymentLabel: paymentLabel,
    items: JSON.parse(JSON.stringify(CART)),
    createdAt: new Date().toISOString()
  };

  // ── MERCADO PAGO PAYMENT FLOW ──
  if (paymentMethod === "mercadopago") {
    // Save pending order in localStorage
    try {
      localStorage.setItem("PENDING_MP_ORDER", JSON.stringify(orderData));
    } catch (e) {}

    Swal.fire({
      title: "Conectando con Mercado Pago...",
      text: "Generando tu orden de pago segura con tarjeta o dinero en cuenta.",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: function () {
        Swal.showLoading();
      }
    });

    $.ajax({
      url: "/api/create-preference",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(orderData),
      timeout: 15000
    }).done(function (res) {
      if (res && res.success && (res.init_point || res.sandbox_init_point)) {
        var paymentUrl = res.init_point || res.sandbox_init_point;
        window.location.href = paymentUrl;
      } else {
        Swal.fire({
          icon: "warning",
          title: "Aviso de Pago",
          text: "No se pudo conectar automáticamente con la pasarela. ¿Querés enviar tu pedido por WhatsApp y abonar con link de pago directo?",
          showCancelButton: true,
          confirmButtonColor: "#FF6B00",
          confirmButtonText: "Enviar por WhatsApp",
          cancelButtonText: "Reintentar"
        }).then(function (result) {
          if (result.isConfirmed) {
            sendOrderToWhatsApp(orderData);
          }
        });
      }
    }).fail(function (xhr) {
      console.warn("[MP Error]", xhr);
      Swal.fire({
        icon: "info",
        title: "Mercado Pago",
        text: "Para completar tu pago podés coordinar el link de pago directo por WhatsApp con el local.",
        showCancelButton: true,
        confirmButtonColor: "#FF6B00",
        confirmButtonText: "Continuar por WhatsApp",
        cancelButtonText: "Cancelar"
      }).then(function (result) {
        if (result.isConfirmed) {
          sendOrderToWhatsApp(orderData);
        }
      });
    });

    return;
  }

  // ── DIRECT CASH OR TRANSFER FLOW ──
  sendOrderToWhatsApp(orderData);
}

function sendOrderToWhatsApp(orderData, isMpApproved) {
  // Deduct ingredients in inventory automatically + log sale for Finanzas
  try {
    var orderTotal = 0;
    (orderData.items || []).forEach(function (item) {
      orderTotal += item.price * item.quantity;
    });
    $.ajax({
      url: "/api/orders/deduct",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        items: orderData.items || [],
        total: orderTotal,
        paymentMethod: isMpApproved ? "mercadopago" : (orderData.paymentMethod || "whatsapp")
      })
    });
  } catch (e) {}

  var nl = "\n";
  var dbl = "\n\n";
  var msg = "";

  msg += "🍕 *" + LOCAL_CONFIG.nombre + " — " + (isMpApproved ? "✅ PEDIDO PAGADO CON MERCADO PAGO" : "NUEVO PEDIDO") + "*" + nl;
  msg += "━━━━━━━━━━━━━━━━━━━━━" + dbl;

  msg += "📋 *Forma de entrega:* " + (orderData.isDelivery ? "🛵 Envío a domicilio (Gratis)" : "🏪 Retiro en el local") + nl;
  msg += "👤 *Cliente:* " + orderData.customerName + nl;
  if (orderData.isDelivery && orderData.customerAddress) {
    msg += "📍 *Dirección:* " + orderData.customerAddress + nl;
  }
  if (orderData.customerPhone) {
    msg += "📞 *Teléfono:* " + orderData.customerPhone + nl;
  }
  msg += "💳 *Medio de pago:* " + (isMpApproved ? "✅ Mercado Pago (Abonado)" : orderData.paymentLabel) + dbl;

  msg += "🛒 *Detalle de la orden:*" + nl;
  msg += "─────────────────────" + nl;

  var total = 0;
  (orderData.items || []).forEach(function (item) {
    total += item.price * item.quantity;
    msg += "• *" + item.quantity + "x* " + item.name + " — *$" + formatMoney(item.price * item.quantity) + "*" + nl;
    if (item.comment) {
      msg += "   ↳ _" + item.comment + "_" + nl;
    }
  });

  msg += "─────────────────────" + nl;
  msg += "💰 *TOTAL: $" + formatMoney(total) + "*" + (isMpApproved ? " (PAGADO)" : "") + dbl;
  msg += "📍 *Local:* " + LOCAL_CONFIG.nombre + " (" + LOCAL_CONFIG.direccion + ")" + nl;
  msg += "_Enviado desde el Menú Digital_";

  var cleanPhone = LOCAL_CONFIG.whatsapp.replace(/[^\d]/g, '');
  var whatsappUrl = "https://wa.me/" + cleanPhone + "?text=" + encodeURIComponent(msg);

  $("#modalFinishOrder").modal("hide");
  window.open(whatsappUrl, "_blank");

  setTimeout(function () {
    CART = [];
    updateCartUI();
    $("#orderCustomerName").val("");
    $("#orderCustomerPhone").val("");
    $("#orderCustomerAddress").val("");
    try { localStorage.removeItem("PENDING_MP_ORDER"); } catch (e) {}
  }, 1000);
}

/* ── CHECK MERCADO PAGO PAYMENT RETURN (AFTER REDIRECT) ───────────────────── */
function checkMercadoPagoPaymentReturn() {
  var urlParams = new URLSearchParams(window.location.search);
  var paymentStatus = urlParams.get("payment");

  if (!paymentStatus) return;

  var savedOrder = null;
  try {
    var raw = localStorage.getItem("PENDING_MP_ORDER");
    if (raw) savedOrder = JSON.parse(raw);
  } catch (e) {}

  // Clean URL without reloading
  if (window.history && window.history.replaceState) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  if (paymentStatus === "success" || paymentStatus === "approved") {
    Swal.fire({
      icon: "success",
      title: "¡Pago Aprobado! 🎉",
      text: "Tu pago con Mercado Pago se acreditó con éxito. Enviamos el comprobante a la cocina por WhatsApp.",
      confirmButtonColor: "#FF6B00",
      confirmButtonText: "Enviar confirmación a WhatsApp"
    }).then(function () {
      if (savedOrder) {
        sendOrderToWhatsApp(savedOrder, true);
      }
    });
  } else if (paymentStatus === "pending") {
    Swal.fire({
      icon: "info",
      title: "Pago en Proceso",
      text: "Tu pago está pendiente de acreditación en Mercado Pago. Te notificaremos apenas impacte.",
      confirmButtonColor: "#FF6B00"
    });
  } else if (paymentStatus === "failure") {
    Swal.fire({
      icon: "error",
      title: "Pago No Completado",
      text: "No se pudo procesar el pago. Podés intentar nuevamente o elegir otro medio de pago.",
      confirmButtonColor: "#FF6B00"
    });
  }
}

/* ── EMBEDDED FALLBACK DATA ───────────────────────────────────────────────── */
function getEmbeddedFallbackData() {
  return {
    "storeInfo": { "name": "Bloque 1", "address": "Virgilio 3508", "whatsapp": "+5491171449431" },
    "categories": [
      { "id": "all", "name": "Todos", "icon": "🔥" },
      { "id": "burgers", "name": "Burgers", "icon": "🍔" },
      { "id": "pizzas-clasicas", "name": "Pizzas", "icon": "🍕" },
      { "id": "pizzas-rellenas", "name": "Rellenas", "icon": "🧀" },
      { "id": "pizzas-especiales", "name": "Especiales", "icon": "✨" },
      { "id": "calzones", "name": "Calzones", "icon": "🥟" },
      { "id": "empanadas", "name": "Empanadas", "icon": "🥟" },
      { "id": "promos", "name": "Promos", "icon": "🏷️" },
      { "id": "sandwiches", "name": "Sandwichs", "icon": "🥪" }
    ],
    "products": [
      { "id": 20589032, "categoryId": "burgers", "name": "BURGUER ESCORPIO", "description": "Doble carne vacuna seleccionada, abundante queso cheddar fundido, morrón asado, jamón cocido y porción de papas fritas crocantes.", "ingredients": ["Doble Carne 120g", "Queso Cheddar Fundido", "Morrón Asado", "Jamón Cocido", "Papas Fritas"], "price": 15000, "badge": "Más Pedido", "rating": "4.9", "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80" },
      { "id": 20589033, "categoryId": "burgers", "name": "DOBLE CHEDDAR", "description": "Doble medallón de carne artesanal bañado en doble porción de cheddar cremoso en pan brioche suave.", "ingredients": ["Doble Medallón de Carne", "Doble Cheddar Cremoso", "Pan Brioche Tostado"], "price": 12000, "rating": "4.7", "image": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80" },
      { "id": 20589034, "categoryId": "burgers", "name": "BACON BURGER", "description": "Crocante panceta ahumada, doble carne, cebolla caramelizada casera, cheddar y guarnición de papas.", "ingredients": ["Doble Carne Vacuna", "Panceta Crocante (Bacon)", "Cebolla Caramelizada", "Queso Cheddar", "Papas Fritas"], "price": 13000, "badge": "Popular", "rating": "4.8", "image": "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&auto=format&fit=crop&q=80" },
      { "id": 20589049, "categoryId": "pizzas-clasicas", "name": "PIZZA ESPECIAL ESCORPIO", "description": "Masa artesanal a la piedra, salsa de tomate casera, jamón cocido, abundante muzzarella, morrón asado, huevo duro, orégano y aceitunas negras.", "ingredients": ["Masa Artesanal a la Piedra", "Salsa de Tomate", "Jamón Cocido", "Muzzarella", "Morrón Asado", "Huevo Duro", "Aceitunas Negras"], "price": 16000, "badge": "Favorita", "rating": "4.9", "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80" },
      { "id": 20589050, "categoryId": "pizzas-clasicas", "name": "MUZZARELLA CLÁSICA", "description": "La reina de la casa: masa crujiente a la piedra, salsa de tomate perfumada, abundante queso muzzarella, orégano y aceitunas verdes.", "ingredients": ["Masa a la Piedra", "Salsa de Tomate Natural", "Muzzarella de Primera Calidad", "Orégano", "Aceitunas Verdes"], "price": 9000, "badge": "Clásica", "rating": "4.8", "image": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80" },
      { "id": 20589072, "categoryId": "pizzas-rellenas", "name": "FUGAZZETA AL ROQUEFORT RELLENA", "description": "Doble masa rellena con jamón y muzzarella desbordante, cubierta con cebolla al oliva y roquefort.", "ingredients": ["Doble Masa Rellena", "Jamón Cocido", "Muzzarella Abundante", "Queso Roquefort", "Cebolla al Oliva", "Pimienta"], "price": 19000, "badge": "Especialidad", "rating": "5.0", "image": "https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?w=600&auto=format&fit=crop&q=80" },
      { "id": 20589080, "categoryId": "calzones", "name": "CALZÓN ESCORPIO", "description": "Calzón gigante relleno de jamón, muzzarella derretida, morrón asado, palmitos tiernos, rodajas de tomate y salsa golf.", "ingredients": ["Masa de Pizza Horneada", "Jamón Cocido", "Muzzarella", "Morrón Asado", "Palmitos", "Tomate", "Salsa Golf"], "price": 18000, "badge": "Gigante", "rating": "4.9", "image": "https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=600&auto=format&fit=crop&q=80" },
      { "id": 20589092, "categoryId": "empanadas", "name": "MEDIA DOCENA DE EMPANADAS (6u)", "description": "Pack de 6 empanadas artesanales a elección cocinadas en horno de piedra.", "ingredients": ["6 Empanadas Artesanales", "Sabores Variados a Elección"], "price": 10200, "badge": "Ahorro", "rating": "5.0", "image": "https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=600&auto=format&fit=crop&q=80" },
      { "id": 20589042, "categoryId": "sandwiches", "name": "MILANESA CON FRITAS COMPLETA", "description": "Generosa milanesa de carne vacuna tiernizada a caballo o clásica con abundante porción de papas fritas.", "ingredients": ["Milanesa de Carne Vacuna", "Porción de Papas Fritas Crocantes", "Limón"], "price": 20000, "badge": "Abundante", "rating": "4.9", "image": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80" }
    ]
  };
}
