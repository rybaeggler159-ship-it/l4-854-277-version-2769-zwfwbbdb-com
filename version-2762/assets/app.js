(function () {
    const menuButton = document.querySelector(".menu-toggle");
    const mobileNav = document.querySelector(".mobile-nav");

    if (menuButton && mobileNav) {
        menuButton.addEventListener("click", function () {
            const isOpen = mobileNav.classList.toggle("open");
            menuButton.setAttribute("aria-expanded", String(isOpen));
        });
    }

    const slides = Array.from(document.querySelectorAll(".hero-slide"));
    const dots = Array.from(document.querySelectorAll(".hero-dot"));
    const prev = document.querySelector(".hero-prev");
    const next = document.querySelector(".hero-next");
    let currentSlide = 0;
    let timer = null;

    function showSlide(index) {
        if (!slides.length) {
            return;
        }
        currentSlide = (index + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
            slide.classList.toggle("active", slideIndex === currentSlide);
        });
        dots.forEach(function (dot, dotIndex) {
            dot.classList.toggle("active", dotIndex === currentSlide);
        });
    }

    function startCarousel() {
        if (slides.length < 2) {
            return;
        }
        window.clearInterval(timer);
        timer = window.setInterval(function () {
            showSlide(currentSlide + 1);
        }, 5600);
    }

    if (slides.length) {
        showSlide(0);
        startCarousel();
        if (prev) {
            prev.addEventListener("click", function () {
                showSlide(currentSlide - 1);
                startCarousel();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                showSlide(currentSlide + 1);
                startCarousel();
            });
        }
        dots.forEach(function (dot, index) {
            dot.addEventListener("click", function () {
                showSlide(index);
                startCarousel();
            });
        });
    }

    const movieGrid = document.getElementById("movieGrid");
    const searchInput = document.getElementById("movieSearch");
    const regionFilter = document.getElementById("regionFilter");
    const typeFilter = document.getElementById("typeFilter");
    const yearFilter = document.getElementById("yearFilter");

    function normalize(value) {
        return String(value || "").trim().toLowerCase();
    }

    function applyFilters() {
        if (!movieGrid) {
            return;
        }
        const keyword = normalize(searchInput ? searchInput.value : "");
        const region = normalize(regionFilter ? regionFilter.value : "");
        const type = normalize(typeFilter ? typeFilter.value : "");
        const year = normalize(yearFilter ? yearFilter.value : "");
        const cards = Array.from(movieGrid.querySelectorAll(".movie-card"));

        cards.forEach(function (card) {
            const text = normalize([
                card.dataset.title,
                card.dataset.region,
                card.dataset.type,
                card.dataset.year,
                card.dataset.tags,
                card.textContent
            ].join(" "));
            const matchesKeyword = !keyword || text.indexOf(keyword) !== -1;
            const matchesRegion = !region || normalize(card.dataset.region) === region;
            const matchesType = !type || normalize(card.dataset.type) === type;
            const matchesYear = !year || normalize(card.dataset.year) === year;
            card.classList.toggle("hidden-by-filter", !(matchesKeyword && matchesRegion && matchesType && matchesYear));
        });
    }

    [searchInput, regionFilter, typeFilter, yearFilter].forEach(function (control) {
        if (control) {
            control.addEventListener("input", applyFilters);
            control.addEventListener("change", applyFilters);
        }
    });
})();
