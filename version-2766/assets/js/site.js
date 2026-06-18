const SELECTORS = {
  mobileToggle: "[data-menu-toggle]",
  mobileNav: "[data-mobile-nav]",
  heroSlider: "[data-hero-slider]",
  heroSlide: "[data-hero-slide]",
  heroDot: "[data-hero-dot]",
  filterPanel: "[data-filter-panel]",
  filterInput: "[data-filter-input]",
  filterSelect: "[data-filter-select]",
  filterCards: ".js-filter-card",
  filterCount: "[data-filter-count]",
  searchForm: "[data-search-form]",
  searchResults: "[data-search-results]",
  searchStatus: "[data-search-status]",
  player: "[data-player]",
  playButton: "[data-play-button]",
  shareButton: "[data-share]",
  scrollToPlayer: "[data-scroll-to-player]"
};

function getBasePath() {
  return document.body.dataset.base || "";
}

function setupMobileMenu() {
  const toggle = document.querySelector(SELECTORS.mobileToggle);
  const nav = document.querySelector(SELECTORS.mobileNav);
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    nav.classList.toggle("is-open");
    toggle.textContent = nav.classList.contains("is-open") ? "×" : "☰";
  });
}

function setupHeroSlider() {
  const slider = document.querySelector(SELECTORS.heroSlider);
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll(SELECTORS.heroSlide));
  const dots = Array.from(document.querySelectorAll(SELECTORS.heroDot));
  if (slides.length <= 1) return;

  let currentIndex = 0;
  let timer = null;

  function showSlide(nextIndex) {
    currentIndex = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, index) => {
      slide.classList.toggle("is-active", index === currentIndex);
    });
    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === currentIndex);
    });
  }

  function start() {
    stop();
    timer = window.setInterval(() => showSlide(currentIndex + 1), 5200);
  }

  function stop() {
    if (timer) window.clearInterval(timer);
  }

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      showSlide(index);
      start();
    });
  });

  slider.addEventListener("mouseenter", stop);
  slider.addEventListener("mouseleave", start);
  start();
}

function setupImageFallbacks() {
  document.querySelectorAll(".poster-shell img").forEach((image) => {
    image.addEventListener("error", () => {
      const shell = image.closest(".poster-shell");
      if (shell) shell.classList.add("is-missing");
    }, { once: true });
  });
}

function collectFilterOptions(cards, key) {
  return Array.from(new Set(cards.map((card) => card.dataset[key]).filter(Boolean)))
    .sort((a, b) => String(b).localeCompare(String(a), "zh-CN"));
}

function populateFilterSelects(panel, cards) {
  panel.querySelectorAll(SELECTORS.filterSelect).forEach((select) => {
    const key = select.dataset.filterSelect;
    if (!key || key === "category") return;
    const existing = new Set(Array.from(select.options).map((option) => option.value));
    collectFilterOptions(cards, key).forEach((value) => {
      if (existing.has(value)) return;
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  });
}

function setupLocalFilters() {
  const panel = document.querySelector(SELECTORS.filterPanel);
  if (!panel) return;

  const cards = Array.from(document.querySelectorAll(SELECTORS.filterCards));
  const input = panel.querySelector(SELECTORS.filterInput);
  const selects = Array.from(panel.querySelectorAll(SELECTORS.filterSelect));
  const count = panel.querySelector(SELECTORS.filterCount);

  populateFilterSelects(panel, cards);

  function applyFilters() {
    const keyword = (input?.value || "").trim().toLowerCase();
    const selected = Object.fromEntries(selects.map((select) => [select.dataset.filterSelect, select.value]));
    let visible = 0;

    cards.forEach((card) => {
      const haystack = (card.dataset.search || "").toLowerCase();
      const keywordMatch = !keyword || haystack.includes(keyword);
      const yearMatch = !selected.year || selected.year === "all" || card.dataset.year === selected.year;
      const regionMatch = !selected.region || selected.region === "all" || card.dataset.region === selected.region;
      const typeMatch = !selected.type || selected.type === "all" || card.dataset.type === selected.type;
      const show = keywordMatch && yearMatch && regionMatch && typeMatch;
      card.classList.toggle("is-hidden-by-filter", !show);
      if (show) visible += 1;
    });

    if (count) {
      count.textContent = `正在显示 ${visible} / ${cards.length} 部影片`;
    }
  }

  input?.addEventListener("input", applyFilters);
  selects.forEach((select) => select.addEventListener("change", applyFilters));
  applyFilters();
}

function movieCardTemplate(movie) {
  const image = `${movie.image}.jpg`;
  const detailUrl = `movies/${movie.id}.html`;
  return `
    <article class="movie-card movie-card--grid js-filter-card" data-search="${escapeHtml(movie.search)}" data-region="${escapeHtml(movie.region)}" data-type="${escapeHtml(movie.type)}" data-year="${escapeHtml(movie.year)}">
      <a class="movie-card__poster poster-shell" href="${detailUrl}" aria-label="观看${escapeHtml(movie.title)}">
        <img src="${image}" alt="${escapeHtml(movie.title)}" loading="lazy">
        <span class="poster-fallback">${escapeHtml(movie.title)}</span>
        <span class="movie-card__region">${escapeHtml(movie.region)}</span>
        <span class="movie-card__type">${escapeHtml(movie.type)}</span>
        <span class="movie-card__play">▶</span>
      </a>
      <div class="movie-card__body">
        <h3><a href="${detailUrl}">${escapeHtml(movie.title)}</a></h3>
        <p>${escapeHtml(movie.oneLine)}</p>
        <div class="movie-card__meta">
          <span>${escapeHtml(movie.year)}</span>
          <span>${escapeHtml(movie.genre)}</span>
        </div>
      </div>
    </article>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function setupSearchPage() {
  const form = document.querySelector(SELECTORS.searchForm);
  const results = document.querySelector(SELECTORS.searchResults);
  const status = document.querySelector(SELECTORS.searchStatus);
  if (!form || !results) return;

  const input = form.querySelector('input[name="q"]');
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q") || "";
  if (initialQuery && input) input.value = initialQuery;

  let movies = [];
  try {
    const response = await fetch(`${getBasePath()}assets/data/movies.json`);
    movies = await response.json();
  } catch (error) {
    if (status) status.textContent = "搜索数据暂时无法加载，请直接浏览片库或分类页。";
    return;
  }

  function render(query) {
    const normalized = query.trim().toLowerCase();
    const matched = normalized
      ? movies.filter((movie) => movie.search.toLowerCase().includes(normalized)).slice(0, 120)
      : movies.slice(0, 48);

    results.innerHTML = matched.map(movieCardTemplate).join("");
    setupImageFallbacks();

    if (status) {
      status.textContent = normalized
        ? `关键词“${query}”找到 ${matched.length} 条结果，最多展示前 120 条。`
        : `可输入关键词检索全站 ${movies.length} 部影片，当前展示推荐影片。`;
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = input?.value || "";
    const url = new URL(window.location.href);
    if (query.trim()) {
      url.searchParams.set("q", query.trim());
    } else {
      url.searchParams.delete("q");
    }
    window.history.replaceState({}, "", url);
    render(query);
  });

  document.querySelectorAll("[data-search-term]").forEach((button) => {
    button.addEventListener("click", () => {
      if (input) input.value = button.dataset.searchTerm || "";
      form.requestSubmit();
    });
  });

  render(initialQuery);
}

async function loadHlsVideo(video, source, fallbackSource) {
  if (video.dataset.loaded === "true") {
    return video.play().catch(() => {});
  }

  function useNative(url) {
    video.src = url;
    video.dataset.loaded = "true";
    return video.play().catch(() => {});
  }

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    return useNative(source);
  }

  try {
    const module = await import("./hls-vendor-dru42stk.js");
    const Hls = module.H || module.default || window.Hls;
    if (!Hls || !Hls.isSupported()) {
      return useNative(fallbackSource || source);
    }

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true
    });

    let usedFallback = false;
    hls.loadSource(source);
    hls.attachMedia(video);
    video.dataset.loaded = "true";

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(() => {});
    });

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (!data || !data.fatal) return;
      if (!usedFallback && fallbackSource) {
        usedFallback = true;
        hls.loadSource(fallbackSource);
        return;
      }
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        hls.startLoad();
      } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        hls.recoverMediaError();
      } else {
        hls.destroy();
      }
    });
  } catch (error) {
    useNative(fallbackSource || source);
  }
}

function setupPlayers() {
  document.querySelectorAll(SELECTORS.player).forEach((player) => {
    const video = player.querySelector("video");
    const button = player.querySelector(SELECTORS.playButton);
    if (!video) return;

    async function startPlayback() {
      button?.classList.add("is-hidden");
      await loadHlsVideo(video, video.dataset.src, video.dataset.fallbackSrc);
    }

    button?.addEventListener("click", startPlayback);
  });

  document.querySelectorAll(SELECTORS.scrollToPlayer).forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      document.querySelector(SELECTORS.player)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
}

function setupShareButtons() {
  document.querySelectorAll(SELECTORS.shareButton).forEach((button) => {
    button.addEventListener("click", async () => {
      const title = document.title;
      const url = window.location.href;
      try {
        if (navigator.share) {
          await navigator.share({ title, url });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          button.textContent = "链接已复制";
          window.setTimeout(() => { button.textContent = "分享影片"; }, 1600);
        }
      } catch (error) {
        button.textContent = "分享失败";
        window.setTimeout(() => { button.textContent = "分享影片"; }, 1600);
      }
    });
  });
}

setupMobileMenu();
setupHeroSlider();
setupImageFallbacks();
setupLocalFilters();
setupSearchPage();
setupPlayers();
setupShareButtons();
