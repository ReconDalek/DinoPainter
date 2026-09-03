// data/admin-link.js
// Adds an "Admin" link to the footer nav, but only in a browser where the admin
// panel has been unlocked (token saved in localStorage). Every other visitor's
// footer is unchanged.
(function () {
  let hasToken = false;
  try {
    hasToken = !!localStorage.getItem("dp_admin_token");
  } catch (e) {
    /* storage blocked — just skip */
  }
  if (!hasToken) return;

  function inject() {
    document.querySelectorAll(".site-nav-links").forEach((nav) => {
      if (nav.querySelector('a[href="admin.html"]')) return;
      const a = document.createElement("a");
      a.href = "admin.html";
      a.textContent = "Admin";
      nav.appendChild(a);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
