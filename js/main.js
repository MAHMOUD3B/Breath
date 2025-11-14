document.addEventListener("DOMContentLoaded", () => {
  /* =======================
     Configuration & Constants
  ======================= */
  const FIXED_PRICE = 350;
  const LANG = (document.documentElement.lang || "ar").slice(0, 2);

  /* =======================
     DOM Element Selectors
  ======================= */
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => root.querySelectorAll(s);

  // Get all offer buttons and add-to-cart buttons
  const offerButtons = $$(".offer-btn, .add-to-cart, .buy-now, .order-now");

  // Handle offer button clicks - redirect to checkout and focus quantity (and set qty if provided)
  offerButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      // Get the current page language
      const isEnglish = document.documentElement.lang === "en";
      // Redirect to the appropriate checkout page (Arabic file is "cheakout.html")
      const checkoutUrl = isEnglish ? "checkout-en.html" : "cheakout.html";
      
      localStorage.setItem("focusQtyInput", "true");
      // Redirect to checkout and anchor to qty
      window.location.href = checkoutUrl + "#qty";
    });
  });

  // If we're on the checkout page, check if we need to focus qty
  const qtyInput = $("#qty");
  if (qtyInput && localStorage.getItem("focusQtyInput")) {
    setTimeout(() => {
      qtyInput.focus();
      qtyInput.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }

  const contactForm = $(".contact-form");
  const offerBtn = $(".q-cta");

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
      phone_invalid:
        "Enter a valid Egyptian mobile (11 digits starting with 01).",
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
      message =
        LANG === "ar"
          ? "شحن 90 جنية لجميع المحافظات"
          : "Shipping 90 EGP to all governorates";
    } else if (qty === 2) {
      message = T("offer_2");
    } else if (qty === 3) {
      message = T("offer_3");
    } else if (qty >= 60) {
      message = T("offer_30");
      discountRate = 0.3;
    } else if (qty >= 20) {
      message = T("offer_25");
      discountRate = 0.25;
    } else if (qty >= 5) {
      message = T("offer_20");
      discountRate = 0.2;
    }

    const discountedTotal =
      Math.round(baseTotal * (1 - discountRate)) + shippingCost;
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

  const validateRequiredText = (el, key) =>
    (el?.value || "").trim()
      ? clearInvalid(el) || true
      : showInvalid(el, T(key));
  const validateSelect = (el, key) =>
    !el?.value || /select|اختر/i.test(el.value)
      ? showInvalid(el, T(key))
      : clearInvalid(el) || true;
  const validateQty = (el) =>
    Number.isFinite(parseInt(el?.value, 10)) && parseInt(el.value, 10) >= 1
      ? clearInvalid(el) || true
      : showInvalid(el, T("qty_min"));

  const reEGPhone = /^01[0-2,5][0-9]{8}$/;
  function validatePhone(el) {
    if (!el) return true;
    el.value = onlyDigits(el.value);
    return reEGPhone.test(el.value)
      ? clearInvalid(el) || true
      : showInvalid(el, T("phone_invalid"));
  }

  function validateCardIfNeeded() {
    if (!methodVisa?.checked) return true;
    let ok = true;
    ok = validateRequiredText(cardHolder, "card_name") && ok;
    if (cardNo) {
      cardNo.value = onlyDigits(cardNo.value);
      if (cardNo.value.length < 12)
        ok = showInvalid(cardNo, T("card_no")) && ok;
      else clearInvalid(cardNo);
    }
    if (expiration) {
      if (
        !/^[0-1][0-9]\/[0-9]{2}$/.test(expiration.value) &&
        !/^[0-9]{4}-[0-1][0-9]$/.test(expiration.value)
      ) {
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

  /* =========================
     INITIALIZATION & EVENT LISTENERS
  ========================= */
  if (offerBtn) {
    // Safe handler for the first .q-cta (kept for backward compatibility).
    offerBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const isEnglish = document.documentElement.lang === "en";
      const checkoutUrl = isEnglish ? "checkout-en.html" : "cheakout.html";
      localStorage.setItem("focusQtyInput", "true");
      window.location.href = checkoutUrl + "#qty";
    });
  }

  // Mark required fields
  [firstname, phone, governorate, area, address, quntityInput].forEach((el) =>
    el?.setAttribute("required", "required")
  );

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
  const PAYMENT_ALERT_MESSAGE =
    LANG === "en"
      ? "This payment method is not available right now. Please choose Cash on Delivery."
      : "طرق الدفع غير متاحة حاليا، برجاء اختيار الدفع عند الاستلام.";

  function handlePaymentChange(event) {
    const selectedRadio = event.target;
    toggleCardRequired();
    if (!selectedRadio?.checked || selectedRadio.id === "method1") return;

    alert(PAYMENT_ALERT_MESSAGE);
    const cashRadio = document.getElementById("method1");
    if (cashRadio) {
      cashRadio.checked = true;
      toggleCardRequired();
    }
  }

  paymentRadios.forEach((radio) =>
    radio.addEventListener("change", handlePaymentChange)
  );

  // Clear validation on input
  [
    firstname,
    phone,
    phoneAlt,
    governorate,
    area,
    address,
    quntityInput,
    cardHolder,
    cardNo,
    expiration,
    cvc,
  ]
    .filter(Boolean)
    .forEach((el) => {
      const eventType = el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(eventType, () => clearInvalid(el));
    });
}); // End of DOMContentLoaded
