(() => {
  "use strict";

  const langBtn = document.getElementById("lang");
  const year = document.getElementById("year");
  let lang = localStorage.getItem("portfolio-lang") || "ru";

  function apply(){
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-ru][data-en]").forEach(el => {
      el.textContent = el.dataset[lang];
    });
    langBtn.textContent = lang.toUpperCase();
    langBtn.setAttribute("aria-label", lang === "ru" ? "Переключить на английский" : "Switch to Russian");
  }

  langBtn.addEventListener("click", () => {
    lang = lang === "ru" ? "en" : "ru";
    localStorage.setItem("portfolio-lang", lang);
    apply();
  });

  year.textContent = new Date().getFullYear();
  apply();
})();
