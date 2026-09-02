// promos/promos-manager.js

let currentPromo = null;

function loadPromoBanner() {
  if (typeof PROMOS === "undefined" || !PROMOS.length) {
    return;
  }

  const promo = PROMOS[Math.floor(Math.random() * PROMOS.length)];
  currentPromo = promo;

  const banner = document.getElementById("promoBanner");
  const img = document.getElementById("promoImage");
  const link = document.getElementById("promoLink");

  // Exit quietly if this page has no promo block.
  if (!banner || !img || !link) return;

  img.onerror = () => {
    console.error("Failed to load promo image:", promo.image);
  };

  img.src = promo.image;
  img.alt = promo.name;
  link.href = promo.link;
  link.title = promo.name;

  trackImpression(promo.id);

  link.onclick = () => {
    trackClick(promo.id);
  };

  banner.classList.remove("hidden");
}

function trackImpression(promoId) {
  const stats = JSON.parse(localStorage.getItem("promoStats") || "{}");
  if (!stats[promoId]) {
    stats[promoId] = { impressions: 0, clicks: 0 };
  }
  stats[promoId].impressions++;
  localStorage.setItem("promoStats", JSON.stringify(stats));
}

function trackClick(promoId) {
  const stats = JSON.parse(localStorage.getItem("promoStats") || "{}");
  if (!stats[promoId]) {
    stats[promoId] = { impressions: 0, clicks: 0 };
  }
  stats[promoId].clicks++;
  localStorage.setItem("promoStats", JSON.stringify(stats));
}

function openPromoForm() {
  window.open("https://discord.gg/dbeYwQ34Dc", "_blank");
}

// Bootstrap when the document is ready.
document.addEventListener("DOMContentLoaded", () => {
  loadPromoBanner();
});
