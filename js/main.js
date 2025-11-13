document.addEventListener("DOMContentLoaded", () => {
  /* =======================
     Configuration & Constants
  ======================= */
  const API_BASE_URL = "https://api.breath.hpi-eg.com"; // ✅ PRODUCTION URL
  const FIXED_PRICE = 350;
  const LANG = (document.documentElement.lang || "ar").slice(0, 2);

  /* =======================
     DOM Element Selectors
  ======================= */
  const $ = (s, root = document) => root.querySelector(s);

  const contactForm = $(".contact-form");
  const btnCheckout = $(".btn.btn-checkout");

  const firstname = $("#firstname");
  const phone = $("#phone");
  const phoneAlt = $("#phone1");
  const governorate = $("#inputGroupSelect01");
  const area = $("#area");
  const address = $("#exampleFormControlTextarea1");

  const quntityInput = $("#qty");
  const totalInput = $("#total");
  const offerMessageContainer = $(".offer-message");

  const methodVisa = $("#method4");
  const cardBlock = $("#card-info1");
  const paymentRadios = document.querySelectorAll('input[name="redirect"]');

  const cardHolder = $("#card-name") || $('label[for="card-name"] + input');
  const cardNo = $("#card-no") || $('label[for="card-no"] + input');
  const expiration = $("#expiration") || $('label[for="expiration"] + input');
  const cvc = $("#sec-no") || $('label[for="ccv-no"] + input');

  if (!contactForm) {
    console.log("Contact form not found. Checkout script will not run.");
    return;
  }

  /* =========================
     i18n Messages
  ========================= */
  const I18N = {
    ar: {
      name_required: "ادخل الاسم",
      phone_invalid: "برجاء إدخال رقم مصري صحيح (11 رقم يبدأ بـ 01)",
      governorate_required: "اختر المحافظة",
      area_required: "ادخل المنطقة السكنية",
      address_required: "ادخل العنوان بالتفصيل",
      qty_min: "أقل كمية 1",
      card_name: "مطلوب الاسم على الكارت",
      card_no: "رقم الكارت غير صحيح",
      exp: "أدخل تاريخ انتهاء صحيح",
      cvc: "رمز الأمان غير صحيح",
      offer_2: "شحن مجاني",
      offer_3: "3 سالين + شحن مجاني",
      offer_20: "خصم 20%",
      offer_25: "خصم 25%",
      offer_30: "خصم 30%",
    },
    en: {
      name_required: "Enter customer name.",
      phone_invalid: "Enter a valid Egyptian mobile (11 digits starting with 01).",
      governorate_required: "Select a governorate.",
      area_required: "Enter residential area.",
      address_required: "Enter address in detail.",
      qty_min: "Minimum quantity is 1.",
      card_name: "Cardholder name is required.",
      card_no: "Invalid card number.",
      exp: "Enter a valid expiry date.",
      cvc: "Invalid security code (CVC).",
      offer_2: "Free shipping",
      offer_3: "3 saline + Free shipping",
      offer_20: "20% off",
      offer_25: "25% off",
      offer_30: "30% off",
    },
  };
  const T = (k) => (I18N[LANG] && I18N[LANG][k]) || I18N.ar[k] || k;

  /* =======================
     UI Helper Functions
  ======================= */
  function show1() {
    if (cardBlock) cardBlock.style.display = "none";
  }
  function show2() {
    if (cardBlock) cardBlock.style.display = "block";
  }
  function toggleMute(videoId, buttonId) {
    const video = document.getElementById(videoId);
    const button = document.getElementById(buttonId);
    if (video && button) {
      video.muted = !video.muted;
      button.textContent = video.muted ? " ▶" : "❚❚ ";
    }
  }

  /* =========================
     Offer & Total Calculation
  ========================= */
  function updateTotalsAndOffer() {
    if (!quntityInput || !totalInput || !offerMessageContainer) return;

    const qty = Number(quntityInput.value) || 0;
    const baseTotal = qty * FIXED_PRICE;
    let discountRate = 0;
    let shippingCost = 0;
    let message = "";

    if (qty === 0) {
      totalInput.value = "0";
      offerMessageContainer.textContent = "";
      offerMessageContainer.style.display = "none";
      return;
    }

    if (qty === 1) {
      shippingCost = 90;
      message = (LANG === "ar") ? "شحن 90 جنية لجميع المحافظات" : "Shipping 90 EGP to all governorates";
    } else if (qty === 2) {
      message = T("offer_2");
    } else if (qty === 3) {
      message = T("offer_3");
    } else if (qty >= 60) {
      message = T("offer_30");
      discountRate = 0.30;
    } else if (qty >= 20) {
      message = T("offer_25");
      discountRate = 0.25;
    } else if (qty >= 5) {
      message = T("offer_20");
      discountRate = 0.20;
    }

    const discountedTotal = Math.round(baseTotal * (1 - discountRate)) + shippingCost;
    totalInput.value = discountedTotal;

    offerMessageContainer.textContent = message;
    offerMessageContainer.style.display = message ? "block" : "none";
  }

  /* =========================
     Validation System
  ========================= */
  const onlyDigits = (v) => (v || "").replace(/\D+/g, "");

  function showInvalid(el, msg) {
    if (!el) return false;
    el.classList.add("is-invalid");
    const feedback = el.parentElement?.querySelector(".invalid-feedback");
    if (feedback) {
      if (msg) feedback.textContent = msg;
      feedback.style.display = "block";
    }
    contactForm?.classList.add("was-validated");
    return false;
  }

  function clearInvalid(el) {
    if (!el) return;
    el.classList.remove("is-invalid");
    const feedback = el.parentElement?.querySelector(".invalid-feedback");
    if (feedback) feedback.style.display = "none";
  }

  const validateRequiredText = (el, key) => (el?.value || "").trim() ? (clearInvalid(el) || true) : showInvalid(el, T(key));
  const validateSelect = (el, key) => (!el?.value || /select|اختر/i.test(el.value)) ? showInvalid(el, T(key)) : (clearInvalid(el) || true);
  const validateQty = (el) => (Number.isFinite(parseInt(el?.value, 10)) && parseInt(el.value, 10) >= 1) ? (clearInvalid(el) || true) : showInvalid(el, T("qty_min"));

  const reEGPhone = /^01[0-2,5][0-9]{8}$/;
  function validatePhone(el) {
    if (!el) return true;
    el.value = onlyDigits(el.value);
    return reEGPhone.test(el.value) ? (clearInvalid(el) || true) : showInvalid(el, T("phone_invalid"));
  }

  function validateCardIfNeeded() {
    if (!methodVisa?.checked) return true;
    let ok = true;
    ok = validateRequiredText(cardHolder, "card_name") && ok;
    if (cardNo) {
      cardNo.value = onlyDigits(cardNo.value);
      if (cardNo.value.length < 12) ok = showInvalid(cardNo, T("card_no")) && ok;
      else clearInvalid(cardNo);
    }
    if (expiration) {
      if (!/^[0-1][0-9]\/[0-9]{2}$/.test(expiration.value) && !/^[0-9]{4}-[0-1][0-9]$/.test(expiration.value)) {
        ok = showInvalid(expiration, T("exp")) && ok;
      } else clearInvalid(expiration);
    }
    if (cvc) {
      cvc.value = onlyDigits(cvc.value);
      if (cvc.value.length < 3) ok = showInvalid(cvc, T("cvc")) && ok;
      else clearInvalid(cvc);
    }
    return ok;
  }

  function validateEntireForm() {
    let isValid = true;
    isValid = validateRequiredText(firstname, "name_required") && isValid;
    isValid = validatePhone(phone) && isValid;
    isValid = validateSelect(governorate, "governorate_required") && isValid;
    isValid = validateRequiredText(area, "area_required") && isValid;
    isValid = validateRequiredText(address, "address_required") && isValid;
    isValid = validateQty(quntityInput) && isValid;
    isValid = validateCardIfNeeded() && isValid;
    return isValid;
  }

  /* =========================
     Payment & UI Logic
  ========================= */
  function toggleCardRequired() {
    const isVisa = methodVisa?.checked;
    if (cardBlock) cardBlock.style.display = isVisa ? "block" : "none";
    [cardHolder, cardNo, expiration, cvc].forEach((el) => {
      if (!el) return;
      if (isVisa) el.setAttribute("required", "required");
      else {
        el.removeAttribute("required");
        clearInvalid(el);
      }
    });
  }

  function resetFormFieldsManually() {
    [firstname, phone, phoneAlt, area, address, cardHolder, cardNo, expiration, cvc]
      .filter(Boolean)
      .forEach(el => {
        el.value = '';
        clearInvalid(el);
      });

    if (governorate) {
      governorate.selectedIndex = 0;
      clearInvalid(governorate);
    }

    if (quntityInput) {
      quntityInput.value = '1';
      clearInvalid(quntityInput);
    }

    const defaultPaymentMethod = $("#method1");
    if (defaultPaymentMethod) {
      defaultPaymentMethod.checked = true;
      toggleCardRequired();
    }

    contactForm?.classList.remove("was-validated");
    updateTotalsAndOffer();
  }

  /* =========================
     API Submission Handlers
  ========================= */
  async function handleCodPayment(orderData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/cod`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'فشل تسجيل الطلب.');
      }

      // Redirect to thank you page on success
      window.location.href = `./thankyou.html`;

    } catch (error) {
      alert(`حدث خطأ: ${error.message}`);
      console.error("COD Payment error:", error);
      throw error;
    }
  }

  async function handleWalletPayment(orderData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'فشل إنشاء عملية الدفع.');
      }

      // Handle different wallet payment responses
      if (result.payment_method === 'iframe') {
        // Redirect to Paymob iframe for card payment
        window.location.href = result.data.iframe_url;
      } else if (result.payment_method === 'mobile_wallet') {
        // Mobile wallet - user will receive notification on phone
        alert("تم إرسال طلب الدفع إلى هاتفك. برجاء إدخال الرقم السري لتأكيد المعاملة.");
      }
    } catch (error) {
      alert(`حدث خطأ: ${error.message}`);
      console.error("Wallet Payment error:", error);
      throw error;
    }
  }

  /* =========================
     INITIALIZATION & EVENT LISTENERS
  ========================= */

  // Mark required fields
  [firstname, phone, governorate, area, address, quntityInput].forEach(el => el?.setAttribute("required", "required"));

  // Initial calculation
  updateTotalsAndOffer();
  toggleCardRequired();

  // Quantity input listeners - multiple events for compatibility
  if (quntityInput) {
    quntityInput.addEventListener("input", updateTotalsAndOffer);
    quntityInput.addEventListener("change", updateTotalsAndOffer);
    quntityInput.addEventListener("keyup", updateTotalsAndOffer);
  }

  // Payment method change
  paymentRadios.forEach(radio => radio.addEventListener("change", toggleCardRequired));

  // Clear validation on input
  [firstname, phone, phoneAlt, governorate, area, address, quntityInput, cardHolder, cardNo, expiration, cvc]
    .filter(Boolean)
    .forEach((el) => {
      const eventType = (el.tagName === "SELECT") ? "change" : "input";
      el.addEventListener(eventType, () => clearInvalid(el));
    });

  /* =========================
     CHECKOUT BUTTON HANDLER
  ========================= */
  btnCheckout?.addEventListener("click", async (event) => {
    event.preventDefault();

    // Validate entire form
    if (!validateEntireForm()) {
      const firstInvalid = $(".is-invalid");
      if (firstInvalid) {
        firstInvalid.focus({ preventScroll: true });
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // Show loading state
    const originalButtonText = btnCheckout.textContent;
    btnCheckout.textContent = "جاري إتمام الطلب...";
    btnCheckout.disabled = true;

    // Gather customer data
    const fullName = firstname.value.trim();
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || 'N/A';
    const lastName = nameParts.slice(1).join(' ') || 'N/A';

    const customerData = {
      first_name: firstName,
      last_name: lastName,
      phone_number: phone.value.trim(),
      city: area.value.trim(),
      state: governorate.options[governorate.selectedIndex].text,
      street: address.value.trim(),
      apartment: 'NA',
      floor: 'NA',
      building: 'NA',
      postal_code: 'NA',
      country: 'EG'
    };

    const orderData = {
      amount: Number(totalInput.value),
      quantity: Number(quntityInput.value),
      customer: customerData,
    };

    // Get selected payment method
    const selectedPaymentMethod = $("input[name='redirect']:checked")?.id;

    try {
      switch (selectedPaymentMethod) {
        case 'method1': // Cash on Delivery
          await handleCodPayment(orderData);
          break;

        case 'method4': // Visa Card
          orderData.wallet_type = 'CARD';
          await handleWalletPayment(orderData);
          break;

        case 'method2': // Vodafone Cash
          orderData.wallet_type = 'VODAFONE_CASH';
          orderData.phone_number = customerData.phone_number;
          await handleWalletPayment(orderData);
          break;

        case 'method3': // Instapay
          alert("الدفع عن طريق انستا باي غير متاح حاليًا. برجاء اختيار طريقة دفع أخرى.");
          throw new Error("Instapay not implemented.");

        default:
          alert("برجاء اختيار طريقة دفع صالحة.");
          throw new Error("Invalid payment method selected.");
      }
    } catch (error) {
      console.error("Payment processing failed:", error.message);
    } finally {
      // Restore button state
      btnCheckout.textContent = originalButtonText;
      btnCheckout.disabled = false;
    }
  });

  console.log("✅ Checkout script initialized successfully");

}); // End of DOMContentLoaded