"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { SavedAddress } from "@/components/modals/AddressModal";

export function useCustomerProfile(defaultStoreAddress: string = "Paderewski 3666") {
  const { isSignedIn, user } = useUser();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerStreet, setCustomerStreet] = useState("");
  const [customerStreetNumber, setCustomerStreetNumber] = useState("");
  const [customerAddressDetails, setCustomerAddressDetails] = useState("");
  const [profileSavedFeedback, setProfileSavedFeedback] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([
    {
      id: "addr_default",
      label: "Ubicación habitual",
      street: "Paderewski",
      streetNumber: "3666",
      details: "",
    },
  ]);

  // Persistent storage helper
  const updateCustomerProfile = (
    name: string,
    phone: string,
    street: string,
    streetNumber: string,
    details?: string
  ) => {
    try {
      const full = streetNumber
        ? `${street.trim()} ${streetNumber.trim()}${details?.trim() ? " (" + details.trim() + ")" : ""}`
        : street.trim();
      localStorage.setItem(
        "kiosco_customer_profile_v1",
        JSON.stringify({
          name,
          phone,
          address: full,
          street,
          streetNumber,
          details: details || "",
        })
      );
    } catch (e) {}
  };

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("kiosco_customer_profile_v1");
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        if (profile.name) setCustomerName(profile.name);
        if (profile.phone) setCustomerPhone(profile.phone);
        if (profile.street) setCustomerStreet(profile.street);
        if (profile.streetNumber) setCustomerStreetNumber(profile.streetNumber);
        if (profile.details) setCustomerAddressDetails(profile.details);
        if (profile.address && !profile.street) setCustomerStreet(profile.address);
      }

      const storedAddresses = localStorage.getItem("kiosco_saved_addresses_v1");
      if (storedAddresses) {
        const parsed = JSON.parse(storedAddresses);
        if (Array.isArray(parsed) && parsed.length > 0) setSavedAddresses(parsed);
      }
    } catch (e) {}
  }, []);

  // Sync Clerk profile
  useEffect(() => {
    if (isSignedIn && user) {
      const clerkName = (
        user.fullName ||
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.username ||
        ""
      ).trim();

      const clerkPhone = (
        user.primaryPhoneNumber?.phoneNumber ||
        (user.phoneNumbers && user.phoneNumbers.length > 0 ? user.phoneNumbers[0].phoneNumber : "") ||
        ""
      ).trim();

      setCustomerName(clerkName);
      setCustomerPhone(clerkPhone);

      updateCustomerProfile(
        clerkName,
        clerkPhone,
        customerStreet,
        customerStreetNumber,
        customerAddressDetails
      );
    }
  }, [isSignedIn, user]);

  const handleSelectAddress = (addr: SavedAddress) => {
    setCustomerStreet(addr.street);
    setCustomerStreetNumber(addr.streetNumber);
    setCustomerAddressDetails(addr.details || "");
    updateCustomerProfile(
      customerName,
      customerPhone,
      addr.street,
      addr.streetNumber,
      addr.details || ""
    );
  };

  const handleLocationFromMap = (loc: {
    street: string;
    streetNumber: string;
    lat: number;
    lng: number;
    fullAddress: string;
    googleMapsUrl: string;
  }) => {
    const streetName = loc.street || "Mi Ubicación";
    const streetNum = loc.streetNumber || "";
    const newAddr: SavedAddress = {
      id: "addr_" + Date.now(),
      label: "Ubicación",
      street: streetName,
      streetNumber: streetNum,
      details: "",
    };

    const updated = [newAddr, ...savedAddresses.filter((a) => a.id !== newAddr.id)];
    setSavedAddresses(updated);
    try {
      localStorage.setItem("kiosco_saved_addresses_v1", JSON.stringify(updated));
    } catch (e) {}

    setCustomerStreet(streetName);
    setCustomerStreetNumber(streetNum);
    setCustomerAddressDetails("");
    updateCustomerProfile(customerName, customerPhone, streetName, streetNum, "");
  };

  const handleSaveManualAddress = (addr: SavedAddress) => {
    const updated = [addr, ...savedAddresses.filter((a) => a.id !== addr.id)];
    setSavedAddresses(updated);
    try {
      localStorage.setItem("kiosco_saved_addresses_v1", JSON.stringify(updated));
    } catch (e) {}

    setCustomerStreet(addr.street);
    setCustomerStreetNumber(addr.streetNumber);
    setCustomerAddressDetails(addr.details || "");
    updateCustomerProfile(
      customerName,
      customerPhone,
      addr.street,
      addr.streetNumber,
      addr.details || ""
    );
  };

  const handleDeleteAddress = (id: string) => {
    const remaining = savedAddresses.filter((a) => a.id !== id);
    setSavedAddresses(remaining);
    try {
      localStorage.setItem("kiosco_saved_addresses_v1", JSON.stringify(remaining));
    } catch (e) {}

    const deletedAddr = savedAddresses.find((a) => a.id === id);
    if (
      deletedAddr &&
      (customerStreet || "").trim().toLowerCase() === deletedAddr.street.trim().toLowerCase() &&
      (customerStreetNumber || "").trim() === (deletedAddr.streetNumber || "").trim()
    ) {
      if (remaining.length > 0) {
        const next = remaining[0];
        setCustomerStreet(next.street);
        setCustomerStreetNumber(next.streetNumber);
        setCustomerAddressDetails(next.details || "");
        updateCustomerProfile(customerName, customerPhone, next.street, next.streetNumber, next.details || "");
      } else {
        setCustomerStreet("");
        setCustomerStreetNumber("");
        setCustomerAddressDetails("");
        updateCustomerProfile(customerName, customerPhone, "", "", "");
      }
    }
  };

  const currentShortAddress = useMemo(() => {
    if (customerStreet && customerStreet.trim()) {
      return customerStreetNumber && customerStreetNumber.trim()
        ? `${customerStreet.trim()} ${customerStreetNumber.trim()}`
        : customerStreet.trim();
    }
    return defaultStoreAddress;
  }, [customerStreet, customerStreetNumber, defaultStoreAddress]);

  return {
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
  };
}
