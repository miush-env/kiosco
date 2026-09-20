"use client";

import React from "react";
import { useUser, useClerk } from "@clerk/nextjs";

// Components
import AppHeader from "@/components/header/AppHeader";
import HeroBanner from "@/components/home/HeroBanner";
import PromoMiddleBanner from "@/components/home/PromoMiddleBanner";
import SuggestionsSection from "@/components/home/SuggestionsSection";
import CategoryChips from "@/components/home/CategoryChips";
import ProductGrid from "@/components/home/ProductGrid";
import FloatingBackButton from "@/components/home/FloatingBackButton";
import CustomerModals from "@/components/modals/CustomerModals";
import DeliveryNotificationToast from "@/components/notifications/DeliveryNotificationToast";
import TopCartNotificationToast from "@/components/notifications/TopCartNotificationToast";
import { BottomNav } from "@/components/navigation/BottomNav";

// Custom Hooks
import { useTheme } from "@/hooks/useTheme";
import { useCatalog } from "@/hooks/useCatalog";
import { useCustomerProfile } from "@/hooks/useCustomerProfile";
import { useCart } from "@/hooks/useCart";
import { useModalManager } from "@/hooks/useModalManager";
import { useOrderSubmission } from "@/hooks/useOrderSubmission";
import { useCustomerOrderTracker } from "@/hooks/useCustomerOrderTracker";
import { getUserRole, isUserAdminOrOwner } from "@/lib/auth-client";

export default function CustomerCatalogPage() {
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const role = getUserRole(user);
  const isAdminUser = Boolean(isSignedIn && isUserAdminOrOwner(user));

  // 1. Hooks
  const { theme, toggleTheme } = useTheme();

  const {
    storeInfo,
    visibleCategories,
    products,
    loading,
    selectedCategory,
    setSelectedCategory,
    selectedCategoryName,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedProducts,
    suggestions,
    refreshCatalog,
  } = useCatalog(6);

  const {
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    customerStreet,
    setCustomerStreet,
    customerStreetNumber,
    setCustomerStreetNumber,
    customerAddressDetails,
    setCustomerAddressDetails,
    savedAddresses,
    currentShortAddress,
    profileSavedFeedback,
    setProfileSavedFeedback,
    updateCustomerProfile,
    handleSelectAddress,
    handleLocationFromMap,
    handleSaveManualAddress,
    handleDeleteAddress,
  } = useCustomerProfile(storeInfo.address);

  const {
    cart,
    cartItemCount,
    cartSubtotal,
    quickAddedId,
    cartNotification,
    dismissCartNotification,
    addProductFromDetail,
    quickAddToCart,
    updateCartQty,
    clearCartAll,
    emptyCartSilently,
  } = useCart(products);

  const modalManager = useModalManager();

  const {
    deliveryType,
    setDeliveryType,
    paymentMethod,
    setPaymentMethod,
    cashChangeOption,
    setCashChangeOption,
    cashAmountGiven,
    setCashAmountGiven,
    pickupCode,
    formErrors,
    isSubmittingOrder,
    copiedMpLink,
    setCopiedMpLink,
    mpStep,
    mpPaymentUrl,
    deliveryCost,
    cartTotal,
    nameInputRef,
    phoneInputRef,
    streetInputRef,
    streetNumberInputRef,
    cashAmountInputRef,
    handleOpenMercadoPago,
    handleFinalizeOrder,
  } = useOrderSubmission(
    storeInfo,
    cart,
    cartSubtotal,
    products,
    customerName,
    customerPhone,
    customerStreet,
    customerStreetNumber,
    customerAddressDetails,
    () => {
      emptyCartSilently();
      modalManager.setIsCheckoutOpen(false);
      refreshCatalog();
    },
    modalManager.setMpReturnModal
  );

  const { activeDeliveryAlert, dismissAlert } = useCustomerOrderTracker();

  return (
    <div className="b1-app-wrapper relative">
      {/* Fondo absoluto rojo detrás de la Cabecera Principal para cubrir el área de las esquinas curvas */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 w-full h-[260px] bg-[#DF381A] pointer-events-none z-0"
      />

      {/* Toast superior cuando se agrega producto al carrito */}
      <TopCartNotificationToast
        notification={cartNotification}
        onDismiss={dismissCartNotification}
        onOpenCart={() => modalManager.setIsCartOpen(true)}
      />

      {/* 1. Cabecera con Buscador Colapsable */}
      <AppHeader
        currentShortAddress={currentShortAddress}
        cartItemCount={cartItemCount}
        searchQuery={searchQuery}
        placeholder="Buscar por plato o descripción..."
        onOpenAddressModal={() => modalManager.setIsAddressModalOpen(true)}
        onOpenNotifications={() => modalManager.setIsNotificationsOpen(true)}
        onOpenCart={() => modalManager.setIsCartOpen(true)}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        onClearSearch={() => {
          setSearchQuery("");
          setCurrentPage(1);
        }}
      />

      <main className="b1-main-container relative z-10">
        {/* 2. Hero Banner Carousel */}
        <HeroBanner storeName={storeInfo.name} />

        {/* Bloque Superior: Desde Video hasta Sugerencias con Pancho Pizza de Fondo en el Lado Izquierdo */}
        <div className="relative overflow-hidden w-full bg-[var(--b1-color-bg,#FAF8F5)]">
          {/* Fondo Decorativo Pancho Pizza Sin Fondo (Alto 100%, Ancho 35% en el Lado Izquierdo) */}
          <div
            aria-hidden="true"
            className="absolute left-0 top-0 bottom-0 h-full w-[35%] pointer-events-none select-none z-0 overflow-hidden flex items-center justify-start"
          >
            <img
              src="/assets/images/products/pancho-pizza-nobg.png"
              alt=""
              style={{ transform: "scaleX(-1)" }}
              className="h-full w-full object-cover object-left opacity-35 dark:opacity-25 filter drop-shadow-lg"
            />
          </div>

          <div className="relative z-10">
            {/* 3. Chips de Categoría */}
            <CategoryChips
              categories={visibleCategories}
              selectedCategory={selectedCategory}
              onSelectCategory={(id) => {
                setSelectedCategory(id);
                setCurrentPage(1);
              }}
            />

            {/* Sugerencias y Destacados */}
            <SuggestionsSection
              suggestions={suggestions}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              quickAddedId={quickAddedId}
              onSelectProduct={(p) => modalManager.openProductDetail(p, cart)}
              onQuickAdd={quickAddToCart}
              onViewAllSuggestions={() => {
                setSelectedCategory("all");
                setSearchQuery("");
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* 4. Banner Publicitario Intermedio con Promociones Dinámicas y Apertura Directa de Modal */}
        {!searchQuery && selectedCategory === "all" && (
          <PromoMiddleBanner
            products={products}
            onSelectProduct={(p) => modalManager.openProductDetail(p, cart)}
          />
        )}

        {/* 5. Catálogo Principal (Nuestra Carta) con Pizza Mozzarella de Fondo a la Derecha */}
        <ProductGrid
          products={paginatedProducts}
          loading={loading}
          searchQuery={searchQuery}
          selectedCategoryName={selectedCategoryName}
          currentPage={currentPage}
          totalPages={totalPages}
          quickAddedId={quickAddedId}
          onSelectProduct={(p) => modalManager.openProductDetail(p, cart)}
          onQuickAdd={quickAddToCart}
          onPageChange={setCurrentPage}
        />
      </main>

      {/* 5. Modales Agrupados */}
      <CustomerModals
        isCartOpen={modalManager.isCartOpen}
        isCheckoutOpen={modalManager.isCheckoutOpen}
        isProfileOpen={modalManager.isProfileOpen}
        isAddressModalOpen={modalManager.isAddressModalOpen}
        isMapPickerOpen={modalManager.isMapPickerOpen}
        isNotificationsOpen={modalManager.isNotificationsOpen}
        selectedProduct={modalManager.selectedProduct}
        detailQty={modalManager.detailQty}
        detailComment={modalManager.detailComment}
        mpReturnModal={modalManager.mpReturnModal}
        products={products}
        cart={cart}
        cartItemCount={cartItemCount}
        cartSubtotal={cartSubtotal}
        cartTotal={cartTotal}
        deliveryCost={deliveryCost}
        deliveryType={deliveryType}
        paymentMethod={paymentMethod}
        customerName={customerName}
        customerPhone={customerPhone}
        customerStreet={customerStreet}
        customerStreetNumber={customerStreetNumber}
        customerAddressDetails={customerAddressDetails}
        cashChangeOption={cashChangeOption}
        cashAmountGiven={cashAmountGiven}
        pickupCode={pickupCode}
        formErrors={formErrors}
        mpStep={mpStep}
        copiedMpLink={copiedMpLink}
        isSubmittingOrder={isSubmittingOrder}
        storeInfo={storeInfo}
        savedAddresses={savedAddresses}
        profileSavedFeedback={profileSavedFeedback}
        isSignedIn={Boolean(isSignedIn)}
        user={user}
        role={role}
        nameInputRef={nameInputRef}
        phoneInputRef={phoneInputRef}
        streetInputRef={streetInputRef}
        streetNumberInputRef={streetNumberInputRef}
        cashAmountInputRef={cashAmountInputRef}
        onCloseProductDetail={modalManager.closeProductDetail}
        onQuantityChange={modalManager.setDetailQty}
        onCommentChange={modalManager.setDetailComment}
        onAddToCartFromDetail={() => {
          if (modalManager.selectedProduct) {
            const added = addProductFromDetail(
              modalManager.selectedProduct,
              modalManager.detailQty,
              modalManager.detailComment
            );
            if (added) modalManager.closeProductDetail();
          }
        }}
        onCloseCart={() => modalManager.setIsCartOpen(false)}
        onClearCart={clearCartAll}
        onUpdateCartQty={updateCartQty}
        onContinueCheckout={() => {
          modalManager.setIsCartOpen(false);
          modalManager.setIsCheckoutOpen(true);
        }}
        onCloseCheckout={() => modalManager.setIsCheckoutOpen(false)}
        onDeliveryTypeChange={setDeliveryType}
        onPaymentMethodChange={setPaymentMethod}
        onCustomerNameChange={setCustomerName}
        onCustomerPhoneChange={setCustomerPhone}
        onCustomerStreetChange={setCustomerStreet}
        onCustomerStreetNumberChange={setCustomerStreetNumber}
        onCustomerAddressDetailsChange={setCustomerAddressDetails}
        onCashChangeOptionChange={setCashChangeOption}
        onCashAmountGivenChange={setCashAmountGiven}
        onCopyMpLink={() => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(mpPaymentUrl || "https://link.mercadopago.com.ar/bautistasanchez");
            setCopiedMpLink(true);
            setTimeout(() => setCopiedMpLink(false), 2000);
          }
        }}
        onOpenMercadoPago={handleOpenMercadoPago}
        onFinalizeOrder={handleFinalizeOrder}
        onCloseProfile={() => modalManager.setIsProfileOpen(false)}
        onSignOut={signOut}
        setProfileSavedFeedback={setProfileSavedFeedback}
        updateCustomerProfile={updateCustomerProfile}
        onCloseAddressModal={() => modalManager.setIsAddressModalOpen(false)}
        onSelectAddress={(addr) => {
          handleSelectAddress(addr);
          modalManager.setIsAddressModalOpen(false);
        }}
        onDeleteAddress={handleDeleteAddress}
        onSaveManualAddress={(addr) => {
          handleSaveManualAddress(addr);
          modalManager.setIsAddressModalOpen(false);
        }}
        onOpenMapPicker={() => modalManager.setIsMapPickerOpen(true)}
        onCloseMapPicker={() => modalManager.setIsMapPickerOpen(false)}
        onLocationFromMap={(loc) => {
          handleLocationFromMap(loc);
          modalManager.setIsMapPickerOpen(false);
          modalManager.setIsAddressModalOpen(false);
        }}
        onCloseNotifications={() => modalManager.setIsNotificationsOpen(false)}
        onOpenCart={() => {
          modalManager.setIsNotificationsOpen(false);
          modalManager.setIsCartOpen(true);
        }}
        onCloseMpReturn={() => modalManager.setMpReturnModal((prev) => ({ ...prev, isOpen: false }))}
        onRetryMpPayment={() => {
          modalManager.setMpReturnModal((prev) => ({ ...prev, isOpen: false }));
          modalManager.setIsCheckoutOpen(true);
        }}
      />

      {/* 6. Notificación Flotante de Delivery en Camino */}
      <DeliveryNotificationToast
        order={activeDeliveryAlert}
        onDismiss={dismissAlert}
      />

      {/* 7. Barra de Navegación Inferior */}
      <BottomNav
        isCartOpen={modalManager.isCartOpen}
        isProfileOpen={modalManager.isProfileOpen}
        cartItemCount={cartItemCount}
        hasCustomerProfileOrAuth={Boolean(customerStreet || isSignedIn)}
        isAdminUser={isAdminUser}
        theme={theme}
        onGoHome={() => {
          if (selectedCategory !== "all" || searchQuery) {
            setSelectedCategory("all");
            setSearchQuery("");
            setCurrentPage(1);
          }
          modalManager.setIsCartOpen(false);
          modalManager.setIsProfileOpen(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onOpenCart={() => {
          modalManager.setIsProfileOpen(false);
          modalManager.setIsCartOpen(true);
        }}
        onOpenProfile={() => {
          modalManager.setIsCartOpen(false);
          modalManager.setIsProfileOpen(true);
        }}
        onToggleTheme={toggleTheme}
      />

      {/* 8. Botón Flotante Atrás */}
      <FloatingBackButton
        isVisible={
          !modalManager.isCartOpen &&
          !modalManager.isCheckoutOpen &&
          !modalManager.selectedProduct &&
          !modalManager.isProfileOpen &&
          !modalManager.mpReturnModal.isOpen
        }
      />
    </div>
  );
}
