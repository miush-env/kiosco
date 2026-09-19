"use client";

import React from "react";
import dynamic from "next/dynamic";
import ProductDetailModal from "./ProductDetailModal";
import CartModal, { CartItem } from "./CartModal";
import CheckoutModal from "./CheckoutModal";
import AddressModal, { SavedAddress } from "./AddressModal";
import NotificationsModal from "./NotificationsModal";
import { ProfileModal } from "./ProfileModal";
import { MercadoPagoReturnModal } from "./MercadoPagoReturnModal";
import { Product } from "@/components/home/ProductCard";
import { StoreInfo } from "@/hooks/useCatalog";
import { formatMoney } from "@/lib/formatters";
import { buildMPWhatsAppMessage, getMPWhatsAppUrl } from "@/lib/whatsapp";

const LocationMapPicker = dynamic(() => import("@/components/LocationMapPicker"), {
  ssr: false,
});

interface CustomerModalsProps {
  // Modal states
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  isProfileOpen: boolean;
  isAddressModalOpen: boolean;
  isMapPickerOpen: boolean;
  isNotificationsOpen: boolean;
  selectedProduct: Product | null;
  detailQty: number;
  detailComment: string;
  mpReturnModal: any;

  // Data
  products: Product[];
  cart: CartItem[];
  cartItemCount: number;
  cartSubtotal: number;
  cartTotal: number;
  deliveryCost: number;
  deliveryType: "envio" | "retiro";
  paymentMethod: "efectivo" | "mercadopago";
  customerName: string;
  customerPhone: string;
  customerStreet: string;
  customerStreetNumber: string;
  customerAddressDetails: string;
  cashChangeOption: "exact" | "change";
  cashAmountGiven: string;
  pickupCode: string;
  formErrors: any;
  mpStep: "initial" | "opened";
  copiedMpLink: boolean;
  isSubmittingOrder: boolean;
  storeInfo: StoreInfo;
  savedAddresses: SavedAddress[];
  profileSavedFeedback: boolean;
  isSignedIn: boolean;
  user: any;
  role?: string;

  // Refs
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  phoneInputRef: React.RefObject<HTMLInputElement | null>;
  streetInputRef: React.RefObject<HTMLInputElement | null>;
  streetNumberInputRef: React.RefObject<HTMLInputElement | null>;
  cashAmountInputRef: React.RefObject<HTMLInputElement | null>;

  // Handlers
  onCloseProductDetail: () => void;
  onQuantityChange: (qty: number) => void;
  onCommentChange: (comment: string) => void;
  onAddToCartFromDetail: () => void;

  onCloseCart: () => void;
  onClearCart: () => void;
  onUpdateCartQty: (cartId: string, delta: number) => void;
  onContinueCheckout: () => void;

  onCloseCheckout: () => void;
  onDeliveryTypeChange: (type: "envio" | "retiro") => void;
  onPaymentMethodChange: (method: "efectivo" | "mercadopago") => void;
  onCustomerNameChange: (name: string) => void;
  onCustomerPhoneChange: (phone: string) => void;
  onCustomerStreetChange: (street: string) => void;
  onCustomerStreetNumberChange: (num: string) => void;
  onCustomerAddressDetailsChange: (details: string) => void;
  onCashChangeOptionChange: (opt: "exact" | "change") => void;
  onCashAmountGivenChange: (amt: string) => void;
  onCopyMpLink: () => void;
  onOpenMercadoPago: () => void;
  onFinalizeOrder: () => void;

  onCloseProfile: () => void;
  onSignOut: (options?: { redirectUrl?: string }) => Promise<void>;
  setProfileSavedFeedback: (val: boolean) => void;
  updateCustomerProfile: (name: string, phone: string, street: string, num: string, details?: string) => void;

  onCloseAddressModal: () => void;
  onSelectAddress: (addr: SavedAddress) => void;
  onDeleteAddress: (id: string) => void;
  onSaveManualAddress: (addr: SavedAddress) => void;
  onOpenMapPicker: () => void;
  onCloseMapPicker: () => void;
  onLocationFromMap: (loc: any) => void;

  onCloseNotifications: () => void;
  onOpenCart?: () => void;
  onCloseMpReturn: () => void;
  onRetryMpPayment: () => void;
}

export default function CustomerModals(props: CustomerModalsProps) {
  return (
    <>
      {/* Product Detail Modal */}
      <ProductDetailModal
        product={props.selectedProduct}
        products={props.products}
        cart={props.cart}
        quantity={props.detailQty}
        comment={props.detailComment}
        onClose={props.onCloseProductDetail}
        onQuantityChange={props.onQuantityChange}
        onCommentChange={props.onCommentChange}
        onAddToCart={props.onAddToCartFromDetail}
      />

      {/* Cart Modal */}
      <CartModal
        isOpen={props.isCartOpen}
        cart={props.cart}
        cartTotal={props.cartTotal}
        deliveryType={props.deliveryType}
        onClose={props.onCloseCart}
        onClearCart={props.onClearCart}
        onUpdateQty={props.onUpdateCartQty}
        onContinueCheckout={props.onContinueCheckout}
        onExploreMenu={props.onCloseCart}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={props.isCheckoutOpen}
        cart={props.cart}
        cartItemCount={props.cartItemCount}
        cartSubtotal={props.cartSubtotal}
        cartTotal={props.cartTotal}
        deliveryCost={props.deliveryCost}
        deliveryType={props.deliveryType}
        paymentMethod={props.paymentMethod}
        customerName={props.customerName}
        customerPhone={props.customerPhone}
        customerStreet={props.customerStreet}
        customerStreetNumber={props.customerStreetNumber}
        customerAddressDetails={props.customerAddressDetails}
        cashChangeOption={props.cashChangeOption}
        cashAmountGiven={props.cashAmountGiven}
        pickupCode={props.pickupCode}
        formErrors={props.formErrors}
        mpStep={props.mpStep}
        copiedMpLink={props.copiedMpLink}
        isSubmittingOrder={props.isSubmittingOrder}
        storeInfo={props.storeInfo}
        estimatedDeliveryTime="30-45 min"
        estimatedPickupTime="15-25 min"
        nameInputRef={props.nameInputRef}
        phoneInputRef={props.phoneInputRef}
        streetInputRef={props.streetInputRef}
        streetNumberInputRef={props.streetNumberInputRef}
        cashAmountInputRef={props.cashAmountInputRef}
        onClose={props.onCloseCheckout}
        onDeliveryTypeChange={props.onDeliveryTypeChange}
        onPaymentMethodChange={props.onPaymentMethodChange}
        onCustomerNameChange={props.onCustomerNameChange}
        onCustomerPhoneChange={props.onCustomerPhoneChange}
        onCustomerStreetChange={props.onCustomerStreetChange}
        onCustomerStreetNumberChange={props.onCustomerStreetNumberChange}
        onCustomerAddressDetailsChange={props.onCustomerAddressDetailsChange}
        onCashChangeOptionChange={props.onCashChangeOptionChange}
        onCashAmountGivenChange={props.onCashAmountGivenChange}
        onCopyMpLink={props.onCopyMpLink}
        onOpenMercadoPago={props.onOpenMercadoPago}
        onFinalizeOrder={props.onFinalizeOrder}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={props.isProfileOpen}
        onClose={props.onCloseProfile}
        isSignedIn={props.isSignedIn}
        user={props.user}
        role={props.role}
        signOut={props.onSignOut}
        customerName={props.customerName}
        setCustomerName={props.onCustomerNameChange}
        customerPhone={props.customerPhone}
        setCustomerPhone={props.onCustomerPhoneChange}
        customerStreet={props.customerStreet}
        setCustomerStreet={props.onCustomerStreetChange}
        customerStreetNumber={props.customerStreetNumber}
        setCustomerStreetNumber={props.onCustomerStreetNumberChange}
        customerAddressDetails={props.customerAddressDetails}
        setCustomerAddressDetails={props.onCustomerAddressDetailsChange}
        updateCustomerProfile={props.updateCustomerProfile}
        profileSavedFeedback={props.profileSavedFeedback}
        setProfileSavedFeedback={props.setProfileSavedFeedback}
        storeInfo={props.storeInfo}
      />

      {/* Interactive Map Picker */}
      <LocationMapPicker
        isOpen={props.isMapPickerOpen}
        onClose={props.onCloseMapPicker}
        onSelect={props.onLocationFromMap}
        initialAddress={
          props.customerStreet
            ? `${props.customerStreet} ${props.customerStreetNumber}`
            : props.storeInfo.address || "Paderewski 3666"
        }
      />

      {/* Multi-Address Modal */}
      <AddressModal
        isOpen={props.isAddressModalOpen}
        savedAddresses={props.savedAddresses}
        currentStreet={props.customerStreet}
        currentStreetNumber={props.customerStreetNumber}
        onClose={props.onCloseAddressModal}
        onSelectAddress={props.onSelectAddress}
        onDeleteAddress={props.onDeleteAddress}
        onOpenMapPicker={props.onOpenMapPicker}
        onSaveManualAddress={props.onSaveManualAddress}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={props.isNotificationsOpen}
        onClose={props.onCloseNotifications}
        onOpenCart={props.onOpenCart}
        products={props.products}
      />

      {/* Mercado Pago Return Modal */}
      <MercadoPagoReturnModal
        isOpen={props.mpReturnModal.isOpen}
        status={props.mpReturnModal.status}
        order={props.mpReturnModal.order}
        copied={props.mpReturnModal.copied}
        onClose={props.onCloseMpReturn}
        onRetry={props.onRetryMpPayment}
        onCopy={() => {
          const text = buildMPWhatsAppMessage(props.mpReturnModal.order, props.storeInfo.name);
          if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
          }
        }}
        formatMoney={formatMoney}
        getMPWhatsAppUrl={(order) => getMPWhatsAppUrl(order, props.storeInfo.whatsapp, props.storeInfo.name)}
      />
    </>
  );
}
