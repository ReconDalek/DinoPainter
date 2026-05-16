// ads/ads-manager.js

let currentAd = null;

function loadAdBanner() {
  console.log("Loading banner...");

  if (typeof ADS === "undefined") {
    console.error("ADS variable missing");
    return;
  }

  if (!ADS.length) {
    console.error("ADS array empty");
    return;
  }

  // Pick a random ad
  const ad = ADS[Math.floor(Math.random() * ADS.length)];
  currentAd = ad;

  console.log("Selected ad:", ad);

  const banner = document.getElementById("adBanner");
  const img = document.getElementById("adImage");
  const link = document.getElementById("adLink");

  // SAFE GUARD: Exit quietly if this specific HTML page doesn't have an ad block
  if (!banner || !img || !link) {
    console.log("Banner elements missing on this page. Skipping ad loading.");
    return;
  }

  img.onload = () => {
    console.log("Image loaded successfully");
  };

  img.onerror = () => {
    console.error("Failed to load image:", ad.image);
  };

  img.src = ad.image;
  img.alt = ad.name;
  link.href = ad.link;
  link.title = ad.name;

  trackImpression(ad.id);

  link.onclick = () => {
    trackClick(ad.id);
  };

  banner.classList.remove("hidden");
  console.log("Banner should now be visible");
}

function trackImpression(adId) {
  const stats = JSON.parse(localStorage.getItem("adStats") || "{}");
  if (!stats[adId]) {
    stats[adId] = { impressions: 0, clicks: 0 };
  }
  stats[adId].impressions++;
  localStorage.setItem("adStats", JSON.stringify(stats));
}

function trackClick(adId) {
  const stats = JSON.parse(localStorage.getItem("adStats") || "{}");
  if (!stats[adId]) {
    stats[adId] = { impressions: 0, clicks: 0 };
  }
  stats[adId].clicks++;
  localStorage.setItem("adStats", JSON.stringify(stats));
}

function openAdForm() {
  window.open("https://discord.gg/dbeYwQ34Dc", "_blank");
}

// Automatically bootstrap ad operations when document is ready
document.addEventListener("DOMContentLoaded", () => {
  loadAdBanner();
});