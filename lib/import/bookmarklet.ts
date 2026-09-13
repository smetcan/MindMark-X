// Helper to build bookmarklet script with optional embedded recent tweet IDs
export function buildBookmarkletScript(initialIds: string[] = []): string {
  const idsJson = JSON.stringify(initialIds.slice(0, 50));
  return `(() => {
  if (window.__X_BM_LOADED) {
    alert("X Bookmark yakalayıcı zaten aktif!");
    return;
  }
  window.__X_BM_LOADED = true;

  const captured = new Map();
  const knownIds = new Set(${idsJson});
  let scrolling = false;
  let scrollInterval = null;
  let smartStopTriggered = false;

  // Load known IDs from localStorage cache on x.com
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
  panel.style.width = "320px";

  panel.innerHTML = \`
    <div style="font-weight: 700; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
      <span style="display: flex; align-items: center; gap: 6px;">🔖 MindMark X</span>
      <span id="x-bm-count" style="background: #3f3f46; color: white; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700;">0 Yeni</span>
    </div>

    <!-- Smart Incremental Stop Toggle -->
    <div style="margin-bottom: 10px; background: #27272a; padding: 8px 10px; border-radius: 8px; font-size: 11px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none;">
          <input type="checkbox" id="x-bm-smart-stop" checked style="cursor: pointer; accent-color: #3b82f6;" />
          <span style="font-weight: 600; color: #e4e4e7;">🎯 Eski tweette dur</span>
        </label>
      </div>
      <div id="x-bm-ref-info" style="color: #71717a; font-size: 10px; margin-top: 4px; margin-left: 18px;">
        \${knownIds.size > 0 ? ("Durdurma hafızası: " + knownIds.size + " eski tweet kayıtlı") : "Durdurma hafızası boş (tümü taranır)"}
      </div>
    </div>

    <div style="font-size: 11px; color: #d4d4d8; margin-bottom: 12px; line-height: 1.4; background: #202024; padding: 10px; border-radius: 8px; border: 1px solid #333;" id="x-bm-status">
      Hazır. Tweetler kontrol ediliyor...
    </div>

    <div style="display: flex; flex-direction: column; gap: 8px;">
      <button id="x-bm-scroll-btn" style="padding: 9px 12px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 12px;">
        ▶ Otomatik Kaydır
      </button>
      <div style="display: flex; gap: 8px;">
        <button id="x-bm-dl-btn" style="flex: 1; padding: 8px 10px; background: #059669; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 12px;">
          📥 JSON İndir
        </button>
        <button id="x-bm-copy-btn" style="flex: 1; padding: 8px 10px; background: #3f3f46; color: #f4f4f5; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 12px;">
          📋 Panoya Kopyala
        </button>
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 6px; border-top: 1px solid #27272a;">
      <button id="x-bm-clear-cache-btn" style="background: transparent; color: #71717a; border: none; cursor: pointer; font-size: 10px; text-decoration: underline;">
        Hafızayı Sıfırla
      </button>
      <button id="x-bm-close-btn" style="background: transparent; color: #71717a; border: none; cursor: pointer; font-size: 11px;">
        Kapat ✕
      </button>
    </div>
  \`;
  document.body.appendChild(panel);

  const countEl = panel.querySelector("#x-bm-count");
  const statusEl = panel.querySelector("#x-bm-status");
  const refInfo = panel.querySelector("#x-bm-ref-info");
  const smartStopCheckbox = panel.querySelector("#x-bm-smart-stop");
  const scrollBtn = panel.querySelector("#x-bm-scroll-btn");
  const dlBtn = panel.querySelector("#x-bm-dl-btn");
  const copyBtn = panel.querySelector("#x-bm-copy-btn");
  const clearCacheBtn = panel.querySelector("#x-bm-clear-cache-btn");
  const closeBtn = panel.querySelector("#x-bm-close-btn");

  const updateCountBadge = () => {
    countEl.innerText = captured.size + " Yeni";
    countEl.style.background = captured.size > 0 ? "#10b981" : "#3f3f46";
  };

  const syncCache = () => {
    const data = Array.from(captured.values());
    data.forEach(item => knownIds.add(item.tweet_id));
    try {
      localStorage.setItem("__x_bm_known_ids", JSON.stringify(Array.from(knownIds).slice(0, 1000)));
      if (refInfo) refInfo.innerText = "Durdurma hafızası: " + knownIds.size + " eski tweet kayıtlı";
    } catch (e) {}
  };

  const cleanup = () => {
    if (scrollInterval) clearInterval(scrollInterval);
    window.removeEventListener("scroll", captureVisible);
    panel.remove();
    window.__X_BM_LOADED = false;
  };
  closeBtn.onclick = cleanup;

  clearCacheBtn.onclick = () => {
    if (confirm("Durdurma hafızası temizlensin mi? (Bir sonraki taramada tüm tweetler taranır)")) {
      knownIds.clear();
      try { localStorage.removeItem("__x_bm_known_ids"); } catch (e) {}
      if (refInfo) refInfo.innerText = "Durdurma hafızası boş (tümü taranır)";
      statusEl.innerHTML = "🔄 Hafıza temizlendi. Artık tüm tweetler taranabilir.";
    }
  };

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
            stopScrolling();
            if (captured.size > 0) {
              statusEl.innerHTML = "<span style='color: #10b981; font-weight: 700;'>🎯 " + captured.size + " YENİ tweet yakalandı!</span><br/>Daha önce aktarılmış eski tweete ulaşıldı ve duruldu. İndirebilir veya panoya kopyalayabilirsiniz.";
            } else {
              statusEl.innerHTML = "<span style='color: #60a5fa; font-weight: 700;'>ℹ️ Yeni tweet yok.</span><br/>Görünen ilk tweet zaten daha önce aktarılmış. Tümü için 'Eski tweette dur' işaretini kaldırın.";
            }
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

        updateCountBadge();
        if (!smartStopTriggered && !scrolling) {
          statusEl.innerHTML = "👀 <b>" + captured.size + " yeni tweet</b> görüldü. Sayfayı kaydırın veya '▶ Otomatik Kaydır' butonuna basın.";
        }
      } catch (e) {}
    }
  }

  // Real-time listener for any user scrolling
  window.addEventListener("scroll", captureVisible, { passive: true });

  scrollBtn.onclick = () => {
    if (scrolling) {
      stopScrolling("Duraklatıldı. (" + captured.size + " yeni tweet)");
    } else {
      smartStopTriggered = false;
      scrolling = true;
      scrollBtn.innerText = "⏸ Durdur";
      scrollBtn.style.background = "#ef4444";
      statusEl.innerText = "Yeni tweetler taranıyor... (" + captured.size + " bulundu)";
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
          if (scrolling) {
            statusEl.innerText = "Taranıyor: " + captured.size + " yeni tweet bulundu...";
          }
        }
      }, 700);
    }
  };

  // Download JSON directly to computer
  dlBtn.onclick = () => {
    captureVisible();
    if (captured.size === 0) {
      alert("Henüz yeni yer imi toplanmadı! Lütfen sayfayı aşağı kaydırın veya ▶ Otomatik Kaydır butonuna basın.");
      return;
    }

    const data = Array.from(captured.values());
    syncCache();

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "x_bookmarks_yeni_" + data.length + "adet_" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    statusEl.innerHTML = "✅ <b>" + data.length + " yeni yer imi</b> indirildi!<br/>MindMark X /import sayfasına yükleyebilirsiniz.";
  };

  // Copy JSON directly to clipboard
  copyBtn.onclick = async () => {
    captureVisible();
    if (captured.size === 0) {
      alert("Henüz yeni yer imi toplanmadı!");
      return;
    }

    const data = Array.from(captured.values());
    syncCache();

    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      statusEl.innerHTML = "📋 <b>" + data.length + " yeni yer imi</b> panoya kopyalandı!<br/>MindMark X sayfasında 'Panodan Yapıştır' butonuna basabilirsiniz.";
    } catch (err) {
      alert("Panoya kopyalanamadı, '📥 JSON İndir' butonunu kullanabilirsiniz.");
    }
  };

  // Run initial scan on visible viewport
  captureVisible();
  if (!smartStopTriggered && captured.size === 0) {
    statusEl.innerText = "Hazır. Sayfayı kaydırın veya '▶ Otomatik Kaydır' butonuna basın.";
  }
})();`;
}

export const BOOKMARKLET_RAW_SCRIPT = buildBookmarkletScript();

// Build minified bookmarklet representation dynamically from RAW script
function minifyJs(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, "") // remove comments
    .replace(/\s+/g, " ") // collapse whitespace
    .replace(/\s*([=+\-*/%&|!<>?:;,{}()[\]])\s*/g, "$1") // remove spaces around operators
    .trim();
}

export const BOOKMARKLET_MINIFIED = minifyJs(BOOKMARKLET_RAW_SCRIPT);

export function getBookmarkletHref(initialIds: string[] = []): string {
  if (initialIds.length > 0) {
    return `javascript:${minifyJs(buildBookmarkletScript(initialIds))}`;
  }
  return `javascript:${BOOKMARKLET_MINIFIED}`;
}