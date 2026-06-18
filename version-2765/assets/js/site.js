const ready = (callback) => {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", callback);
    } else {
        callback();
    }
};

const normalize = (value) => String(value || "").trim().toLowerCase();

function setupImageFallbacks() {
    const images = document.querySelectorAll(".poster-frame img, .list-thumb img, .hero-cover img");

    images.forEach((image) => {
        image.addEventListener("error", () => {
            const frame = image.closest(".poster-frame, .list-thumb, .hero-cover");
            if (frame) {
                frame.classList.add("image-fallback");
            }
            image.remove();
        }, { once: true });
    });
}

function setupMobileMenu() {
    const button = document.querySelector("[data-mobile-menu-button]");
    const menu = document.querySelector("[data-mobile-menu]");

    if (!button || !menu) {
        return;
    }

    button.addEventListener("click", () => {
        menu.classList.toggle("is-open");
        button.setAttribute("aria-expanded", menu.classList.contains("is-open") ? "true" : "false");
    });
}

function setupHeroSlider() {
    const slider = document.querySelector("[data-hero-slider]");

    if (!slider) {
        return;
    }

    const slides = Array.from(slider.querySelectorAll("[data-hero-slide]"));
    const dots = Array.from(slider.querySelectorAll("[data-hero-dot]"));
    let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));

    if (activeIndex < 0) {
        activeIndex = 0;
    }

    const showSlide = (index) => {
        activeIndex = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => {
            slide.classList.toggle("is-active", slideIndex === activeIndex);
        });
        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle("is-active", dotIndex === activeIndex);
        });
    };

    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => showSlide(index));
    });

    if (slides.length > 1) {
        window.setInterval(() => showSlide(activeIndex + 1), 5600);
    }
}

function setupMovieFilters() {
    const form = document.querySelector("[data-filter-form]");
    const list = document.querySelector("[data-movie-list]");

    if (!form || !list) {
        return;
    }

    const cards = Array.from(list.querySelectorAll("[data-movie-card]"));
    const keywordInput = form.querySelector("[data-filter-keyword]");
    const regionSelect = form.querySelector("[data-filter-region]");
    const typeSelect = form.querySelector("[data-filter-type]");
    const yearSelect = form.querySelector("[data-filter-year]");
    const countNode = document.querySelector("[data-result-count]");
    const emptyState = document.querySelector("[data-empty-state]");
    const quickButtons = Array.from(form.querySelectorAll("[data-quick-genre]"));
    const params = new URLSearchParams(window.location.search);

    if (keywordInput && params.has("keyword")) {
        keywordInput.value = params.get("keyword") || "";
    }

    if (regionSelect && params.has("region")) {
        regionSelect.value = params.get("region") || "";
    }

    if (typeSelect && params.has("type")) {
        typeSelect.value = params.get("type") || "";
    }

    if (yearSelect && params.has("year")) {
        yearSelect.value = params.get("year") || "";
    }

    let activeGenre = params.get("genre") || "";

    const applyFilters = () => {
        const keyword = normalize(keywordInput ? keywordInput.value : "");
        const region = normalize(regionSelect ? regionSelect.value : "");
        const type = normalize(typeSelect ? typeSelect.value : "");
        const year = normalize(yearSelect ? yearSelect.value : "");
        const genre = normalize(activeGenre);
        let visible = 0;

        cards.forEach((card) => {
            const haystack = normalize([
                card.dataset.title,
                card.dataset.region,
                card.dataset.type,
                card.dataset.year,
                card.dataset.genre,
                card.textContent
            ].join(" "));

            const matchesKeyword = !keyword || haystack.includes(keyword);
            const matchesRegion = !region || normalize(card.dataset.region).includes(region);
            const matchesType = !type || normalize(card.dataset.type).includes(type);
            const matchesYear = !year || normalize(card.dataset.year).includes(year);
            const matchesGenre = !genre || normalize(card.dataset.genre).includes(genre) || haystack.includes(genre);
            const show = matchesKeyword && matchesRegion && matchesType && matchesYear && matchesGenre;

            card.hidden = !show;
            if (show) {
                visible += 1;
            }
        });

        if (countNode) {
            countNode.textContent = String(visible);
        }

        if (emptyState) {
            emptyState.hidden = visible !== 0;
        }

        quickButtons.forEach((button) => {
            button.classList.toggle("is-active", normalize(button.dataset.quickGenre) === genre && genre.length > 0);
        });
    };

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const url = new URL(window.location.href);
        const nextParams = new URLSearchParams();

        if (keywordInput && keywordInput.value.trim()) {
            nextParams.set("keyword", keywordInput.value.trim());
        }
        if (regionSelect && regionSelect.value) {
            nextParams.set("region", regionSelect.value);
        }
        if (typeSelect && typeSelect.value) {
            nextParams.set("type", typeSelect.value);
        }
        if (yearSelect && yearSelect.value) {
            nextParams.set("year", yearSelect.value);
        }
        if (activeGenre) {
            nextParams.set("genre", activeGenre);
        }

        url.search = nextParams.toString();
        window.history.replaceState(null, "", url.toString());
        applyFilters();
    });

    [keywordInput, regionSelect, typeSelect, yearSelect].forEach((control) => {
        if (control) {
            control.addEventListener("input", applyFilters);
            control.addEventListener("change", applyFilters);
        }
    });

    quickButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const value = button.dataset.quickGenre || "";
            activeGenre = activeGenre === value ? "" : value;
            applyFilters();
        });
    });

    applyFilters();
}

async function loadHls(video, sourceUrl) {
    if (!video || !sourceUrl || video.dataset.hlsReady === "true") {
        return;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = sourceUrl;
        video.dataset.hlsReady = "true";
        return;
    }

    try {
        const module = await import("./hls-vendor-dru42stk.js");
        const Hls = module.H;

        if (Hls && Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true
            });

            hls.loadSource(sourceUrl);
            hls.attachMedia(video);
            video._hlsInstance = hls;
            video.dataset.hlsReady = "true";
        } else {
            video.src = sourceUrl;
            video.dataset.hlsReady = "true";
        }
    } catch (error) {
        video.src = sourceUrl;
        video.dataset.hlsReady = "true";
        throw error;
    }
}

function showVideoMessage(shell, text) {
    if (!shell) {
        return;
    }

    let message = shell.querySelector(".video-message");
    if (!message) {
        message = document.createElement("div");
        message.className = "video-message";
        shell.appendChild(message);
    }
    message.textContent = text;
}

function setupPlayers() {
    const players = document.querySelectorAll("[data-player]");

    players.forEach((shell) => {
        const video = shell.querySelector("video[data-hls-url]");
        const button = shell.querySelector("[data-play-button]");

        if (!video) {
            return;
        }

        const play = async () => {
            const sourceUrl = video.dataset.hlsUrl;

            try {
                await loadHls(video, sourceUrl);
                shell.classList.add("is-playing");
                await video.play();
            } catch (error) {
                shell.classList.remove("is-playing");
                showVideoMessage(shell, "视频加载失败，请稍后重试或检查播放源网络。 ");
            }
        };

        if (button) {
            button.addEventListener("click", play);
        }

        video.addEventListener("play", () => {
            shell.classList.add("is-playing");
        });

        video.addEventListener("pause", () => {
            shell.classList.remove("is-playing");
        });

        video.addEventListener("click", () => {
            if (video.dataset.hlsReady !== "true") {
                play();
            }
        });
    });
}

ready(() => {
    setupImageFallbacks();
    setupMobileMenu();
    setupHeroSlider();
    setupMovieFilters();
    setupPlayers();
});
