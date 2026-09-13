export const BOOKMARKLET_RAW_SCRIPT = `(() => {
  if (window.__X_BM_LOADED) {
    alert("X Bookmark yakalayıcı zaten aktif!");
    return;
  }
  window.__X_BM_LOADED = true;

  const captured = new Map();
  const knownIds = new Set();
  let scrolling = false;
  let scrollInterval = null;
  let smartStopTriggered = false;

  // Load known IDs from localStorage cache if available
  try {
    const cached = localStorage.getItem("__x_bm_known_ids");
    if (cached) {
      const arr = JSON.parse(cached);
      if (Array.isArray(arr)) arr.forEach(id => knownIds.add(String(id)));
    }
  } catch (e) {}

  /* Floating UI Widget */
  const panel = document.createElement("div");
  panel.id = "__x_bm_panel";
  panel.style.position = "fixed";
  panel.style.bottom = "24px";
  panel.style.right = "24px";
  panel.style.zIndex = "2147483647";
  panel.style.backgroundColor = "#18181b";
  panel.style.color = "#f4f4f5";
  panel.style.padding = "16px";
  panel.style.borderRadius = "14px";
  panel.style.boxShadow = "0 20px 25px -5px rgba(0,0,0,0.6), 0 8px 10px -6px rgba(0,0,0,0.6)";
  panel.style.fontFamily = "system-ui, -apple-system, sans-serif";
  panel.style.fontSize = "13px";
  panel.style.border = "1px solid #3f3f46";
  panel.style.width = "310px";

  panel.innerHTML = \`
    <div style="font-weight: 700; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
      <span style="display: flex; align-items: center; gap: 6px;">🔖 X Bookmarks</span>
      <span id="x-bm-count" style="background: #2563eb; color: white; padding: 2px 10px; border-radius: 9999px; font-size: 13px; font-weight: 700;">0</span>
    </div>

    <!-- Smart Incremental Stop Toggle -->
    <div style="margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; background: #27272a; padding: 6px 10px; border-radius: 8px; font-size: 11px;">
      <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none;">
        <input type="checkbox" id="x-bm-smart-stop" checked style="cursor: pointer; accent-color: #3b82f6;" />
        <span style="font-weight: 600; color: #e4e4e7;">🎯 Kayıtlı tweette dur</span>
      </label>
      <span id="x-bm-known-badge" style="color: #60a5fa; font-size: 10px;">Bağlanıyor...</span>
    </div>

    <div style="font-size: 11px; color: #a1a1aa; margin-bottom: 12px; line-height: 1.4;" id="x-bm-status">
      Hazır. Sayfayı kaydırın veya Başlat'a basın.
    </div>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <button id="x-bm-scroll-btn" style="padding: 8px 12px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 12px;">
        ▶ Otomatik Kaydır
      </button>
      <div style="display: flex; gap: 8px;">
        <button id="x-bm-dl-btn" style="flex: 1; padding: 8px 10px; background: #059669; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 12px;">
          📥 JSON İndir
        </button>
        <button id="x-bm-send-btn" style="flex: 1; padding: 8px 10px; background: #27272a; color: #f4f4f5; border: 1px solid #3f3f46; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 12px;">
          🚀 Aktar
        </button>
      </div>
    </div>
    <button id="x-bm-close-btn" style="width: 100%; margin-top: 8px; padding: 4px; background: transparent; color: #71717a; border: none; cursor: pointer; font-size: 11px;">
      Kapat
    </button>
  \`;
  document.body.appendChild(panel);

  const countEl = panel.querySelector("#x-bm-count");
  const statusEl = panel.querySelector("#x-bm-status");
  const knownBadge = panel.querySelector("#x-bm-known-badge");
  const smartStopCheckbox = panel.querySelector("#x-bm-smart-stop");
  const scrollBtn = panel.querySelector("#x-bm-scroll-btn");
  const dlBtn = panel.querySelector("#x-bm-dl-btn");
  const sendBtn = panel.querySelector("#x-bm-send-btn");
  const closeBtn = panel.querySelector("#x-bm-close-btn");

  // Fetch known IDs from local MindMark-X API
  const fetchKnownIds = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/import", { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.recentIds)) {
          data.recentIds.forEach(id => knownIds.add(String(id)));
          try {
            localStorage.setItem("__x_bm_known_ids", JSON.stringify(Array.from(knownIds).slice(0, 500)));
          } catch (e) {}
        }
        knownBadge.innerText = knownIds.size + " kayıtlı";
        knownBadge.style.color = "#10b981";
        statusEl.innerText = "Bağlandı (" + knownIds.size + " kayıtlı yer imi biliniyor). Yalnızca yeni tweetler toplanacak.";
        return;
      }
    } catch (err) {}

    if (knownIds.size > 0) {
      knownBadge.innerText = knownIds.size + " (önbellek)";
      knownBadge.style.color = "#f59e0b";
      statusEl.innerText = "Önbellekte " + knownIds.size + " kayıtlı yer imi var. Yeni olanlar taranacak.";
    } else {
      knownBadge.innerText = "Çevrimdışı";
      knownBadge.style.color = "#a1a1aa";
    }
  };
  fetchKnownIds();

  const cleanup = () => {
    if (scrollInterval) clearInterval(scrollInterval);
    window.removeEventListener("scroll", captureVisible);
    panel.remove();
    window.__X_BM_LOADED = false;
  };
  closeBtn.onclick = cleanup;

  function stopScrolling(reasonMsg) {
    if (scrolling) {
      scrolling = false;
      clearInterval(scrollInterval);
      scrollBtn.innerText = "▶ Otomatik Kaydır";
      scrollBtn.style.background = "#2563eb";
    }
    if (reasonMsg) {
      statusEl.innerHTML = reasonMsg;
    }
  }

  function captureVisible() {
    let articles = Array.from(document.querySelectorAll("article[data-testid='tweet'], article[role='article']"));
    if (articles.length === 0) {
      articles = Array.from(document.querySelectorAll("article"));
    }
    if (articles.length === 0) {
      const textEls = document.querySelectorAll("[data-testid='tweetText']");
      articles = Array.from(textEls).map(el => el.closest("article") || el.closest("[data-testid='cellInnerDiv']") || el.parentElement).filter(Boolean);
    }

    for (const article of articles) {
      try {
        let tweetUrl = "";
        let tweetId = "";

        const timeEl = article.querySelector("time");
        if (timeEl) {
          const timeLink = timeEl.closest("a");
          if (timeLink && timeLink.href) tweetUrl = timeLink.href;
        }

        if (!tweetUrl) {
          const links = article.querySelectorAll("a[href*='/status/']");
          for (const l of links) {
            const href = l.getAttribute("href") || l.href || "";
            if (/\\/status\\/\\d+/.test(href)) {
              tweetUrl = href.startsWith("http") ? href : ("https://x.com" + href);
              break;
            }
          }
        }

        if (tweetUrl) {
          const m = tweetUrl.match(/status\\/(\\d+)/);
          if (m) tweetId = m[1];
        }

        if (!tweetId) continue;

        // Smart Stop Check: If we encountered an already imported tweet!
        if (smartStopCheckbox.checked && knownIds.has(tweetId)) {
          if (!smartStopTriggered) {
            smartStopTriggered = true;
            stopScrolling(
              "<span style='color: #10b981; font-weight: 700;'>🎯 Mevcut yer imine ulaşıldı!</span><br/>" +
              "Daha önce aktarılmış tweete gelindi. Sadece <b>" + captured.size + " yeni tweet</b> toplandı."
            );
          }
          return;
        }

        if (captured.has(tweetId)) continue;

        const textEl = article.querySelector("[data-testid='tweetText']") || article.querySelector("div[lang]");
        const text = textEl ? textEl.innerText.trim() : "";

        const userEl = article.querySelector("[data-testid='User-Name']");
        let authorName = "Unknown";
        let authorHandle = "@unknown";
        if (userEl) {
          const spans = userEl.querySelectorAll("span");
          for (const span of spans) {
            const txt = span.innerText?.trim();
            if (txt && !txt.startsWith("@")) {
              authorName = txt;
              break;
            }
          }
          const handleMatch = userEl.innerText.match(/@\\w+/);
          if (handleMatch) authorHandle = handleMatch[0];
        }

        const avatarImg = article.querySelector("img[src*='profile_images']");
        const authorAvatar = avatarImg ? avatarImg.src : null;

        const mediaImgs = article.querySelectorAll("img[src*='media'], img[src*='tweet_video_thumb']");
        const media = Array.from(mediaImgs).map(img => ({ type: "photo", url: img.src }));

        captured.set(tweetId, {
          tweet_id: tweetId,
          text,
          author_name: authorName,
          author_handle: authorHandle,
          author_avatar: authorAvatar,
          tweet_url: tweetUrl.split("?")[0],
          media
        });

        countEl.innerText = String(captured.size);
        if (!smartStopTriggered) {
          statusEl.innerText = captured.size + " yeni yer imi toplandı. İndirebilir veya aktarabilirsiniz.";
        }
      } catch (e) {}
    }
  }

  // Real-time listener for any user scrolling
  window.addEventListener("scroll", captureVisible, { passive: true });

  scrollBtn.onclick = () => {
    if (scrolling) {
      stopScrolling("Duraklatıldı. (" + captured.size + " yeni toplandı)");
    } else {
      smartStopTriggered = false;
      scrolling = true;
      scrollBtn.innerText = "⏸ Durdur";
      scrollBtn.style.background = "#ef4444";
      statusEl.innerText = "Yeni yer imleri taranıyor...";
      let stalls = 0;
      let lastCount = 0;

      scrollInterval = setInterval(() => {
        captureVisible();
        if (smartStopTriggered) return;

        window.scrollBy(0, 1000);
        if (document.scrollingElement) document.scrollingElement.scrollTop += 1000;

        if (captured.size === lastCount) {
          stalls++;
          if (stalls > 6) {
            window.scrollBy(0, -400);
            stalls = 0;
          }
        } else {
          stalls = 0;
          lastCount = captured.size;
        }
      }, 700);
    }
  };

  // Download JSON directly to computer
  dlBtn.onclick = () => {
    captureVisible();
    if (captured.size === 0) {
      alert("Henüz yeni yer imi toplanmadı! Lütfen sayfayı aşağı kaydırıp tweetlerin yüklendiğinden emin olun veya ▶ Otomatik Kaydır butonuna basın.");
      return;
    }

    const data = Array.from(captured.values());
    data.forEach(item => knownIds.add(item.tweet_id));
    try {
      localStorage.setItem("__x_bm_known_ids", JSON.stringify(Array.from(knownIds).slice(0, 500)));
    } catch (e) {}

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "x_bookmarks_yeni_" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    statusEl.innerHTML = "✅ <b>" + data.length + " yeni yer imi</b> JSON olarak indirildi!";
  };

  // Send to local server
  sendBtn.onclick = async () => {
    captureVisible();
    if (captured.size === 0) {
      alert("Henüz yeni yer imi toplanmadı! Lütfen sayfayı aşağı kaydırıp tweetlerin yüklendiğinden emin olun veya ▶ Otomatik Kaydır butonuna basın.");
      return;
    }

    statusEl.innerText = "Yerel uygulamaya aktarılıyor...";
    sendBtn.disabled = true;

    try {
      const payload = Array.from(captured.values());
      const res = await fetch("http://localhost:3000/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        payload.forEach(item => knownIds.add(item.tweet_id));
        try {
          localStorage.setItem("__x_bm_known_ids", JSON.stringify(Array.from(knownIds).slice(0, 500)));
        } catch (e) {}
        knownBadge.innerText = knownIds.size + " kayıtlı";
        knownBadge.style.color = "#10b981";

        statusEl.innerHTML = "<span style='color: #10b981; font-weight: 700;'>Başarılı!</span> " + data.imported + " yeni eklendi (" + data.skipped + " mükerrer).";
        alert("Başarılı! " + data.imported + " yeni yer imi yerel veritabanına aktarıldı.");
      } else {
        statusEl.innerText = "Hata: " + (data.error || "Sunucuya bağlanılamadı");
      }
    } catch (err) {
      statusEl.innerText = "Hata: Yerel sunucu açık mı? (localhost:3000)";
      alert("Hata: http://localhost:3000 sunucusuna erişilemedi. İsterseniz '📥 JSON İndir' butonuyla dosyayı indirip manuel yükleyebilirsiniz.");
    } finally {
      sendBtn.disabled = false;
    }
  };

  captureVisible();
})();`;

// Build minified bookmarklet representation dynamically from RAW script
function minifyJs(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, "") // remove comments
    .replace(/\s+/g, " ") // collapse whitespace
    .replace(/\s*([=+\-*/%&|!<>?:;,{}()[\]])\s*/g, "$1") // remove spaces around operators
    .trim();
}

export const BOOKMARKLET_MINIFIED = minifyJs(BOOKMARKLET_RAW_SCRIPT);

export function getBookmarkletHref(): string {
  return `javascript:${BOOKMARKLET_MINIFIED}`;
}