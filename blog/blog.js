/* M:E blog — articles.json, YouTube, cookie consent */
(function () {
  "use strict";

  var MONTHS_RU = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря"
  ];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function formatDateRu(iso) {
    if (!iso) return "";
    var p = String(iso).split("-");
    if (p.length !== 3) return iso;
    var d = parseInt(p[2], 10);
    var m = parseInt(p[1], 10) - 1;
    return d + " " + (MONTHS_RU[m] || p[1]) + " " + p[0];
  }

  function renderTagsHtml(tags, linkable) {
    if (!tags || !tags.length) return "";
    return tags.map(function (t) {
      if (linkable) {
        return '<a href="/blog/?tag=' + encodeURIComponent(t) + '" class="mini-tag">' + esc(t) + "</a>";
      }
      return '<span class="mini-tag">' + esc(t) + "</span>";
    }).join("");
  }

  function sortArticles(list) {
    return list.slice().sort(function (a, b) {
      if (!!a.soon !== !!b.soon) return a.soon ? 1 : -1;
      return String(b.date || "").localeCompare(String(a.date || ""));
    });
  }

  function renderCard(a) {
    var cat = esc(a.category || "Google Ads");
    var title = esc(a.title || "");
    var excerpt = esc(a.excerpt || "");
    var dateStr = a.date ? formatDateRu(a.date) : "";
    var tagsHtml = renderTagsHtml(a.tags, false);

    if (a.soon) {
      return '<div class="pcardt soon" data-tags="' + esc((a.tags || []).join("|")) + '">' +
        '<div class="pcardt-top"><span class="cat">Скоро</span></div>' +
        "<h2>" + title + "</h2><p>" + excerpt + "</p>" +
        (tagsHtml ? '<div class="pcardt-tags">' + tagsHtml + "</div>" : "") +
        '<span class="more">В работе</span></div>';
    }

    var href = "/blog/" + esc(a.slug) + "/";
    return '<a class="pcardt" href="' + href + '" data-tags="' + esc((a.tags || []).join("|")) + '">' +
      '<div class="pcardt-top"><span class="cat">' + cat + "</span>" +
      (dateStr ? '<time class="pcardt-date" datetime="' + esc(a.date) + '">' + esc(dateStr) + "</time>" : "") +
      "</div>" +
      "<h2>" + title + "</h2><p>" + excerpt + "</p>" +
      (tagsHtml ? '<div class="pcardt-tags">' + tagsHtml + "</div>" : "") +
      '<span class="more">Читать →</span></a>';
  }

  function renderGrid(list) {
    var grid = document.querySelector("[data-articles-grid]");
    if (!grid) return;

    grid.innerHTML = sortArticles(list).map(renderCard).join("");
  }

  function ensureHubChrome() {
    var grid = document.querySelector("[data-articles-grid]");
    if (!grid) return null;

    if (!document.querySelector("[data-grid-empty]")) {
      grid.insertAdjacentHTML(
        "afterend",
        '<p class="grid-empty" data-grid-empty hidden>По этой теме пока нет опубликованных статей — скоро добавим.</p>'
      );
    }
    return grid;
  }

  /* --- ХАБ --- */
  var grid = ensureHubChrome();
  if (grid) {
    fetch("/blog/articles.json", { cache: "no-cache" })
      .then(function (r) { return r.json(); })
      .then(function (list) {
        if (!Array.isArray(list) || !list.length) return;
        renderGrid(list);
      })
      .catch(function () { /* fallback HTML */ });
  }

  /* --- YouTube --- */
  var CHANNEL = "https://www.youtube.com/@MEMarketExpert";
  document.querySelectorAll(".yt").forEach(function (el) {
    var id = (el.getAttribute("data-id") || "").trim();

    if (!id) {
      var ph = document.createElement("div");
      ph.className = "yt-empty";
      ph.innerHTML =
        '<div class="yt-empty-ico"></div>' +
        '<b>Видео к этой статье скоро появится</b>' +
        '<span>Подпишитесь на <a href="' + CHANNEL + '" target="_blank" rel="noopener noreferrer">YouTube-канал M:E</a>, чтобы не пропустить</span>';
      el.replaceWith(ph);
      return;
    }

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

  /* --- COOKIE + GA4 --- */
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
