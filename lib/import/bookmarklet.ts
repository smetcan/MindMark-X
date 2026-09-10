export const BOOKMARKLET_RAW_SCRIPT = `(() => {
  if (window.__X_BM_LOADED) {
    alert("X Bookmark yakalayıcı zaten aktif!");
    return;
  }
  window.__X_BM_LOADED = true;

  const captured = new Map();
  let scrolling = false;
  let scrollInterval = null;

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
  panel.style.width = "300px";

  panel.innerHTML = \`
    <div style="font-weight: 700; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
      <span style="display: flex; align-items: center; gap: 6px;">🔖 X Bookmarks</span>
      <span id="x-bm-count" style="background: #2563eb; color: white; padding: 2px 10px; border-radius: 9999px; font-size: 13px; font-weight: 700;">0</span>
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
  const scrollBtn = panel.querySelector("#x-bm-scroll-btn");
  const dlBtn = panel.querySelector("#x-bm-dl-btn");
  const sendBtn = panel.querySelector("#x-bm-send-btn");
  const closeBtn = panel.querySelector("#x-bm-close-btn");

  const cleanup = () => {
    if (scrollInterval) clearInterval(scrollInterval);
    window.removeEventListener("scroll", captureVisible);
    panel.remove();
    window.__X_BM_LOADED = false;
  };
  closeBtn.onclick = cleanup;

  function captureVisible() {
    let articles = Array.from(document.querySelectorAll("article[data-testid='tweet'], article[role='article']"));
    if (articles.length === 0) {
      articles = Array.from(document.querySelectorAll("article"));
    }
    if (articles.length === 0) {
      const textEls = document.querySelectorAll("[data-testid='tweetText']");
      articles = Array.from(textEls).map(el => el.closest("article") || el.closest("[data-testid='cellInnerDiv']") || el.parentElement).filter(Boolean);
    }

    articles.forEach(article => {
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

        if (!tweetId || captured.has(tweetId)) return;

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
        statusEl.innerText = captured.size + " yer imi toplandı. İndirebilir veya aktarabilirsiniz.";
      } catch (e) {}
    });
  }

  // Real-time listener for any user scrolling
  window.addEventListener("scroll", captureVisible, { passive: true });

  scrollBtn.onclick = () => {
    if (scrolling) {
      scrolling = false;
      clearInterval(scrollInterval);
      scrollBtn.innerText = "▶ Otomatik Kaydır";
      scrollBtn.style.background = "#2563eb";
      statusEl.innerText = "Duraklatıldı. (" + captured.size + " toplandı)";
    } else {
      scrolling = true;
      scrollBtn.innerText = "⏸ Durdur";
      scrollBtn.style.background = "#ef4444";
      statusEl.innerText = "Kaydırılıyor ve toplanıyor...";
      let stalls = 0;
      let lastCount = 0;

      scrollInterval = setInterval(() => {
        captureVisible();
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
      alert("Henüz hiç yer imi toplanmadı! Lütfen sayfayı aşağı kaydırıp tweetlerin yüklendiğinden emin olun veya ▶ Otomatik Kaydır butonuna basın.");
      return;
    }

    const data = Array.from(captured.values());
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "x_bookmarks_" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    statusEl.innerText = "✅ " + data.length + " yer imi JSON olarak indirildi!";
  };

  // Send to local server
  sendBtn.onclick = async () => {
    captureVisible();
    if (captured.size === 0) {
      alert("Henüz hiç yer imi toplanmadı! Lütfen sayfayı aşağı kaydırıp tweetlerin yüklendiğinden emin olun veya ▶ Otomatik Kaydır butonuna basın.");
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
        statusEl.innerText = "Başarılı! " + data.imported + " yeni eklendi (" + data.skipped + " mükerrer).";
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

export const BOOKMARKLET_MINIFIED = `(()=>{if(window.__X_BM_LOADED){alert("X Bookmark yakalay\\u0131c\\u0131 zaten aktif!");return}window.__X_BM_LOADED=!0;const o=new Map;let y=!1,p=null;const e=document.createElement("div");e.id="__x_bm_panel",e.style.position="fixed",e.style.bottom="24px",e.style.right="24px",e.style.zIndex="2147483647",e.style.backgroundColor="#18181b",e.style.color="#f4f4f5",e.style.padding="16px",e.style.borderRadius="14px",e.style.boxShadow="0 20px 25px -5px rgba(0,0,0,0.6), 0 8px 10px -6px rgba(0,0,0,0.6)",e.style.fontFamily="system-ui, -apple-system, sans-serif",e.style.fontSize="13px",e.style.border="1px solid #3f3f46",e.style.width="300px",e.innerHTML='<div style="font-weight:700;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;"><span style="display:flex;align-items:center;gap:6px;">\\u{1F516} X Bookmarks</span><span id="x-bm-count" style="background:#2563eb;color:white;padding:2px 10px;border-radius:9999px;font-size:13px;font-weight:700;">0</span></div><div style="font-size:11px;color:#a1a1aa;margin-bottom:12px;line-height:1.4;" id="x-bm-status">Haz\\u0131r. Sayfay\\u0131 kayd\\u0131r\\u0131n veya Ba\\u015Flat\\'a bas\\u0131n.</div><div style="display:flex;flex-direction:column;gap:8px;"><button id="x-bm-scroll-btn" style="padding:8px 12px;background:#2563eb;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:12px;">\\u25B6 Otomatik Kayd\\u0131r</button><div style="display:flex;gap:8px;"><button id="x-bm-dl-btn" style="flex:1;padding:8px 10px;background:#059669;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:12px;">\\u{1F4E5} JSON \\u0130ndir</button><button id="x-bm-send-btn" style="flex:1;padding:8px 10px;background:#27272a;color:#f4f4f5;border:1px solid #3f3f46;border-radius:8px;cursor:pointer;font-weight:600;font-size:12px;">\\u{1F680} Aktar</button></div></div><button id="x-bm-close-btn" style="width:100%;margin-top:8px;padding:4px;background:transparent;color:#71717a;border:none;cursor:pointer;font-size:11px;">Kapat</button>',document.body.appendChild(e);const v=e.querySelector("#x-bm-count"),i=e.querySelector("#x-bm-status"),c=e.querySelector("#x-bm-scroll-btn"),S=e.querySelector("#x-bm-dl-btn"),m=e.querySelector("#x-bm-send-btn"),_=e.querySelector("#x-bm-close-btn"),z=()=>{p&&clearInterval(p),window.removeEventListener("scroll",s),e.remove(),window.__X_BM_LOADED=!1};_.onclick=z;function s(){let r=Array.from(document.querySelectorAll("article[data-testid='tweet'], article[role='article']"));if(r.length===0&&(r=Array.from(document.querySelectorAll("article"))),r.length===0){const n=document.querySelectorAll("[data-testid='tweetText']");r=Array.from(n).map(t=>t.closest("article")||t.closest("[data-testid='cellInnerDiv']")||t.parentElement).filter(Boolean)}r.forEach(n=>{try{let t="",l="";const x=n.querySelector("time");if(x){const a=x.closest("a");a&&a.href&&(t=a.href)}if(!t){const a=n.querySelectorAll("a[href*='/status/']");for(const u of a){const d=u.getAttribute("href")||u.href||"";if(/\\/status\\/\\d+/.test(d)){t=d.startsWith("http")?d:"https://x.com"+d;break}}}if(t){const a=t.match(/status\\/(\\d+)/);a&&(l=a[1])}if(!l||o.has(l))return;const h=n.querySelector("[data-testid='tweetText']")||n.querySelector("div[lang]"),T=h?h.innerText.trim():"",f=n.querySelector("[data-testid='User-Name']");let g="Unknown",k="@unknown";if(f){const a=f.querySelectorAll("span");for(const d of a){const b=d.innerText?.trim();if(b&&!b.startsWith("@")){g=b;break}}const u=f.innerText.match(/@\\w+/);u&&(k=u[0])}const w=n.querySelector("img[src*='profile_images']"),A=w?w.src:null,q=n.querySelectorAll("img[src*='media'], img[src*='tweet_video_thumb']"),E=Array.from(q).map(a=>({type:"photo",url:a.src}));o.set(l,{tweet_id:l,text:T,author_name:g,author_handle:k,author_avatar:A,tweet_url:t.split("?")[0],media:E}),v.innerText=String(o.size),i.innerText=o.size+" yer imi topland\\u0131. \\u0130ndirebilir veya aktarabilirsiniz."}catch{}})}window.addEventListener("scroll",s,{passive:!0}),c.onclick=()=>{if(y)y=!1,clearInterval(p),c.innerText="\\u25B6 Otomatik Kayd\\u0131r",c.style.background="#2563eb",i.innerText="Duraklat\\u0131ld\\u0131. ("+o.size+" topland\\u0131)";else{y=!0,c.innerText="\\u23F8 Durdur",c.style.background="#ef4444",i.innerText="Kayd\\u0131r\\u0131l\\u0131yor ve toplan\\u0131yor...";let r=0,n=0;p=setInterval(()=>{s(),window.scrollBy(0,1e3),document.scrollingElement&&(document.scrollingElement.scrollTop+=1e3),o.size===n?(r++,r>6&&(window.scrollBy(0,-400),r=0)):(r=0,n=o.size)},700)}},S.onclick=()=>{if(s(),o.size===0){alert("Hen\\xFCz hi\\xE7 yer imi toplanmad\\u0131! L\\xFCtfen sayfay\\u0131 a\\u015Fa\\u011F\\u0131 kayd\\u0131r\\u0131p tweetlerin y\\xFCklendi\\u011Finden emin olun veya \\u25B6 Otomatik Kayd\\u0131r butonuna bas\\u0131n.");return}const r=Array.from(o.values()),n=new Blob([JSON.stringify(r,null,2)],{type:"application/json"}),t=URL.createObjectURL(n),l=document.createElement("a");l.href=t,l.download="x_bookmarks_"+new Date().toISOString().slice(0,10)+".json",document.body.appendChild(l),l.click(),l.remove(),setTimeout(()=>URL.revokeObjectURL(t),1e3),i.innerText="\\u2705 "+r.length+" yer imi JSON olarak indirildi!"},m.onclick=async()=>{if(s(),o.size===0){alert("Hen\\xFCz hi\\xE7 yer imi toplanmad\\u0131! L\\xFCtfen sayfay\\u0131 a\\u015Fa\\u011F\\u0131 kayd\\u0131r\\u0131p tweetlerin y\\xFCklendi\\u011Finden emin olun veya \\u25B6 Otomatik Kayd\\u0131r butonuna bas\\u0131n.");return}i.innerText="Yerel uygulamaya aktar\\u0131l\\u0131yor...",m.disabled=!0;try{const r=Array.from(o.values()),n=await fetch("http://localhost:3000/api/import",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(r)}),t=await n.json();n.ok?(i.innerText="Ba\\u015Far\\u0131l\\u0131! "+t.imported+" yeni eklendi ("+t.skipped+" m\\xFCkerrer).",alert("Ba\\u015Far\\u0131l\\u0131! "+t.imported+" yeni yer imi yerel veritaban\\u0131na aktar\\u0131ld\\u0131.")):i.innerText="Hata: "+(t.error||"Sunucuya ba\\u011Flan\\u0131lamad\\u0131")}catch{i.innerText="Hata: Yerel sunucu a\\xE7\\u0131k m\\u0131? (localhost:3000)",alert("Hata: http://localhost:3000 sunucusuna eri\\u015Filemedi. \\u0130sterseniz \'\\u{1F4E5} JSON \\u0130ndir\' butonuyla dosyay\\u0131 indirip manuel y\\xFCkleyebilirsiniz.")}finally{m.disabled=!1}},s()})();`;

export function getBookmarkletHref(): string {
  return `javascript:${BOOKMARKLET_MINIFIED}`;
}