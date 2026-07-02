/* M:E blog — авто-список статей из articles.json + встраивание YouTube */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* --- 1. ХАБ: собрать карточки из /blog/articles.json --- */
  var grid = document.querySelector("[data-articles-grid]");
  if (grid) {
    fetch("/blog/articles.json", { cache: "no-cache" })
      .then(function (r) { return r.json(); })
      .then(function (list) {
        if (!Array.isArray(list) || !list.length) return;
        // сначала опубликованные (по дате, новые сверху), потом "скоро"
        list.sort(function (a, b) {
          if (!!a.soon !== !!b.soon) return a.soon ? 1 : -1;
          return String(b.date || "").localeCompare(String(a.date || ""));
        });
        grid.innerHTML = list.map(function (a) {
          var cat = esc(a.category || "Google Ads");
          var title = esc(a.title || "");
          var excerpt = esc(a.excerpt || "");
          if (a.soon) {
            return '<div class="pcardt soon"><div class="cat">Скоро</div>' +
              '<h2>' + title + '</h2><p>' + excerpt + '</p>' +
              '<span class="more">В работе</span></div>';
          }
          var href = "/blog/" + esc(a.slug) + "/";
          return '<a class="pcardt" href="' + href + '"><div class="cat">' + cat + '</div>' +
            '<h2>' + title + '</h2><p>' + excerpt + '</p>' +
            '<span class="more">Читать →</span></a>';
        }).join("");
      })
      .catch(function () { /* оставляем разметку-заглушку из HTML */ });
  }

  /* --- 2. СТАТЬЯ: YouTube без нагрузки, грузится по клику --- */
  var CHANNEL = "https://www.youtube.com/@MEMarketExpert";
  document.querySelectorAll(".yt").forEach(function (el) {
    var id = (el.getAttribute("data-id") || "").trim();

    if (!id) {
      // видео ещё нет — показываем аккуратный плейсхолдер со ссылкой на канал
      var ph = document.createElement("div");
      ph.className = "yt-empty";
      ph.innerHTML =
        '<div class="yt-empty-ico"></div>' +
        '<b>Видео к этой статье скоро появится</b>' +
        '<span>Подпишитесь на <a href="' + CHANNEL + '" target="_blank" rel="noopener noreferrer">YouTube-канал M:E</a>, чтобы не пропустить</span>';
      el.replaceWith(ph);
      return;
    }

    // есть ID — рисуем превью + кнопку play, iframe грузим только по клику
    el.classList.add("yt--ready");
    el.style.backgroundImage = "url('https://i.ytimg.com/vi/" + id + "/hqdefault.jpg')";
    var btn = document.createElement("button");
    btn.className = "yt-play";
    btn.type = "button";
    btn.setAttribute("aria-label", "Смотреть видео");
    el.appendChild(btn);
    el.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.className = "yt-frame";
      f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
      f.title = "Видео M:E Agency";
      f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      f.allowFullscreen = true;
      el.innerHTML = "";
      el.appendChild(f);
    }, { once: true });
  });

  /* --- 3. COOKIE + GA4: общий me-analytics.js (localStorage cookie_consent) --- */
  function initCookieConsent() {
    if (!document.querySelector('link[href="/cookie.css"]')) {
      var css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "/cookie.css";
      document.head.appendChild(css);
    }
    if (!document.getElementById("cookie-banner")) {
      document.body.insertAdjacentHTML(
        "beforeend",
        '<div id="cookie-banner" class="cookie-banner cookie-banner--closed" role="dialog" aria-label="Файлы cookie" aria-hidden="true">' +
          '<div class="cookie-banner__inner">' +
            '<p class="cookie-banner__text">' +
              "Мы используем файлы cookie для аналитики (Google Analytics). Нажимая «Принять», вы соглашаетесь на их использование. " +
              '<a href="https://marketexpert.cz/cookie-policy" target="_blank" rel="noopener noreferrer" class="cookie-banner__link">Политика cookie</a>' +
            "</p>" +
            '<div class="cookie-banner__actions">' +
              '<button type="button" class="cookie-banner__btn cookie-banner__btn--ghost" data-cookie-reject>Отклонить</button>' +
              '<button type="button" class="cookie-banner__btn cookie-banner__btn--primary" data-cookie-accept>Принять</button>' +
            "</div>" +
          "</div>" +
        "</div>"
      );
    }
    if (!window.__GA4_MEASUREMENT_ID__) {
      window.__GA4_MEASUREMENT_ID__ = "G-SPKHXMCQGM";
    }
    if (!document.querySelector('script[src="/me-analytics.js"]')) {
      var js = document.createElement("script");
      js.src = "/me-analytics.js";
      document.body.appendChild(js);
    }
  }

  initCookieConsent();
})();
