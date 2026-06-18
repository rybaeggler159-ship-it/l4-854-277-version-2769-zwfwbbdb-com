document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      document.body.classList.toggle("nav-open");
    });
  }

  document.querySelectorAll("[data-hero]").forEach(function (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    if (!slides.length) {
      return;
    }
    var current = 0;
    var show = function (index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === current);
      });
    };
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
      });
    });
    show(0);
    window.setInterval(function () {
      show(current + 1);
    }, 5200);
  });

  document.querySelectorAll("[data-filter-area]").forEach(function (area) {
    var search = area.querySelector("[data-filter-search]");
    var year = area.querySelector("[data-filter-year]");
    var category = area.querySelector("[data-filter-category]");
    var root = area.parentElement;
    var cards = Array.prototype.slice.call(root.querySelectorAll("[data-card]"));
    var empty = area.querySelector("[data-empty]");
    var apply = function () {
      var q = search ? search.value.trim().toLowerCase() : "";
      var y = year ? year.value : "";
      var c = category ? category.value : "";
      var visible = 0;
      cards.forEach(function (card) {
        var text = card.innerText.toLowerCase();
        var pass = true;
        if (q && text.indexOf(q) === -1) {
          pass = false;
        }
        if (y && card.getAttribute("data-year") !== y) {
          pass = false;
        }
        if (c && card.getAttribute("data-category") !== c) {
          pass = false;
        }
        card.hidden = !pass;
        if (pass) {
          visible += 1;
        }
      });
      if (empty) {
        empty.hidden = visible !== 0;
      }
    };
    [search, year, category].forEach(function (control) {
      if (control) {
        control.addEventListener("input", apply);
        control.addEventListener("change", apply);
      }
    });
    apply();
  });
});
