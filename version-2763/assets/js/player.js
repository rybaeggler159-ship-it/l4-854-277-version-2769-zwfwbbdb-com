document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("[data-player]").forEach(function (box) {
    var video = box.querySelector("video");
    var button = box.querySelector(".player-start");
    var message = box.querySelector(".player-message");
    if (!video) {
      return;
    }
    var stream = video.getAttribute("data-video");
    var hls = null;
    var ready = false;

    var setMessage = function (text) {
      if (!message) {
        return;
      }
      message.textContent = text || "";
      box.classList.toggle("has-message", Boolean(text));
    };

    var attach = function () {
      if (ready || !stream) {
        return;
      }
      ready = true;
      box.classList.add("is-ready");
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(stream);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            setMessage("视频暂时无法播放，请稍后再试。");
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = stream;
      } else {
        video.src = stream;
      }
    };

    var start = function () {
      attach();
      setMessage("");
      var result = video.play();
      if (result && typeof result.catch === "function") {
        result.catch(function () {
          setMessage("点击播放按钮即可开始观看。");
        });
      }
    };

    if (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        start();
      });
    }

    video.addEventListener("click", function () {
      if (!ready) {
        start();
      }
    });

    window.addEventListener("beforeunload", function () {
      if (hls) {
        hls.destroy();
      }
    });
  });
});
