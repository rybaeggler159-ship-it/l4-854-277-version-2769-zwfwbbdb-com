function initMoviePlayer(sourceUrl, title) {
    const video = document.getElementById("moviePlayer");
    const playButton = document.getElementById("playButton");
    let hlsInstance = null;
    let attached = false;

    function attachSource() {
        if (!video || attached) {
            return;
        }
        attached = true;
        if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hlsInstance.loadSource(sourceUrl);
            hlsInstance.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = sourceUrl;
        } else {
            video.src = sourceUrl;
        }
        video.setAttribute("title", title || "电影大全");
    }

    function playMovie() {
        if (!video) {
            return;
        }
        attachSource();
        if (playButton) {
            playButton.classList.add("is-hidden");
        }
        const promise = video.play();
        if (promise && typeof promise.catch === "function") {
            promise.catch(function () {
                if (playButton) {
                    playButton.classList.remove("is-hidden");
                }
            });
        }
    }

    if (playButton) {
        playButton.addEventListener("click", playMovie);
    }
    if (video) {
        video.addEventListener("click", function () {
            if (video.paused) {
                playMovie();
            }
        });
        video.addEventListener("play", function () {
            if (playButton) {
                playButton.classList.add("is-hidden");
            }
        });
        video.addEventListener("pause", function () {
            if (playButton && video.currentTime === 0) {
                playButton.classList.remove("is-hidden");
            }
        });
    }
    window.addEventListener("pagehide", function () {
        if (hlsInstance) {
            hlsInstance.destroy();
        }
    });
}
