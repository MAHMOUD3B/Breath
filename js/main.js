function show1() {
  document.getElementById("card-info1").style.display = "none";
}
function show2() {
  document.getElementById("card-info1").style.display = "block";
}

// JavaScript function to toggle mute/unmute
function toggleMute(videoId, buttonId) {
  const video = document.getElementById(videoId);
  const button = document.getElementById(buttonId);

  if (video.muted) {
    video.muted = false;
    button.textContent = "❚❚ ";
  } else {
    video.muted = true;
    button.textContent = " ▶";
  }
}
// Get all radio buttons with the name 'redirect'
const radioButtons = document.querySelectorAll('input[name="redirect"]');

// Add an event listener to each radio button
radioButtons.forEach((radio) => {
  radio.addEventListener("change", (event) => {
    // Redirect to the URL specified in the value of the selected radio button
    if (event.target.checked && event.target.value !== "no-link") {
      window.location.href = event.target.value;
    }
  });
});

// calculate the total price
const FIXED_PRICE = 350;
const quntityInput = document.querySelector("#qty");
const totalInput = document.querySelector("#total");
const offerMessageContainer = document.querySelector(".offer-message");
let message = "";

quntityInput.addEventListener("change", () => {
  totalInput.value = Number(quntityInput.value) * FIXED_PRICE;

  // define the offer message by the quantity number
  switch (Number(quntityInput.value)) {
    case 0:
      message = "";
      break;
    case 1:
      message = "خصم 20 جنيه";
      break;
    case 2:
      message = "شحن مجاني";
      break;
    case 3:
      message = "2 سالين + شحن مجاني";
      break;
    case 4:
      message = "6 سالين + شحن مجاني";
      break;
    case 20:
      message = "خصم 20%";
      break;
    case 40:
      message = "خصم 25%";
      break;
    case 100:
      message = "خصم 30%";
      break;
    default:
      message = "";
  }
  offerMessageContainer.textContent = message;

  // control on visibility of offer message container
  if (message !== "") {
    offerMessageContainer.style.display = "block";
    console.log("work");
  } else {
    offerMessageContainer.style.cssText = "display: none";
  }
});
