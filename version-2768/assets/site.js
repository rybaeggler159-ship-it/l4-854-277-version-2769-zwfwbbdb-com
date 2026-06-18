document.addEventListener("DOMContentLoaded", function() {
    var menuButton = document.querySelector(".menu-toggle");
    var mobileMenu = document.getElementById("mobileMenu");

    if (menuButton && mobileMenu) {
        menuButton.addEventListener("click", function() {
            var open = mobileMenu.classList.toggle("is-open");
            menuButton.setAttribute("aria-expanded", open ? "true" : "false");
        });
    }

    var hero = document.querySelector("[data-hero]");
    if (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var prev = hero.querySelector("[data-hero-prev]");
        var next = hero.querySelector("[data-hero-next]");
        var current = 0;
        var timer = null;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function(slide, i) {
                slide.classList.toggle("hero-slide-active", i === current);
            });
            dots.forEach(function(dot, i) {
                dot.classList.toggle("active", i === current);
            });
        }

        function startTimer() {
            if (timer) {
                window.clearInterval(timer);
            }
            timer = window.setInterval(function() {
                show(current + 1);
            }, 5200);
        }

        dots.forEach(function(dot) {
            dot.addEventListener("click", function() {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                startTimer();
            });
        });

        if (prev) {
            prev.addEventListener("click", function() {
                show(current - 1);
                startTimer();
            });
        }

        if (next) {
            next.addEventListener("click", function() {
                show(current + 1);
                startTimer();
            });
        }

        show(0);
        startTimer();
    }

    var listPage = document.querySelector("[data-list-page]");
    if (listPage) {
        var input = listPage.querySelector("[data-filter-input]");
        var cards = Array.prototype.slice.call(listPage.querySelectorAll(".movie-card"));
        var empty = listPage.querySelector("[data-empty-message]");
        var params = new URLSearchParams(window.location.search);
        var query = params.get("q") || "";

        function normalize(value) {
            return String(value || "").toLowerCase().trim();
        }

        function filter(value) {
            var key = normalize(value);
            var visible = 0;
            cards.forEach(function(card) {
                var haystack = normalize([
                    card.getAttribute("data-title"),
                    card.getAttribute("data-tags"),
                    card.getAttribute("data-year"),
                    card.getAttribute("data-region"),
                    card.getAttribute("data-type")
                ].join(" "));
                var match = !key || haystack.indexOf(key) !== -1;
                card.hidden = !match;
                if (match) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.hidden = visible !== 0;
            }
        }

        if (input) {
            input.value = query;
            input.addEventListener("input", function() {
                filter(input.value);
            });
        }

        listPage.querySelectorAll("[data-tag-filter]").forEach(function(button) {
            button.addEventListener("click", function() {
                var value = button.getAttribute("data-tag-filter") || "";
                if (input) {
                    input.value = value;
                }
                filter(value);
            });
        });

        filter(query);
    }
});
