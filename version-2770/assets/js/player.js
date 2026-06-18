(function () {
    var video = document.querySelector('[data-player-video]');
    var cover = document.querySelector('[data-player-cover]');
    var state = document.querySelector('[data-player-state]');
    var prepared = false;
    var hls = null;

    function setState(message) {
        if (!state) {
            return;
        }
        if (message) {
            state.textContent = message;
            state.classList.remove('hidden');
        } else {
            state.textContent = '';
            state.classList.add('hidden');
        }
    }

    function prepare() {
        if (!video || prepared || typeof movieStream === 'undefined') {
            return;
        }
        prepared = true;
        setState('正在加载');
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = movieStream;
        } else if (window.Hls && window.Hls.isSupported()) {
            hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
            hls.loadSource(movieStream);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                setState('');
            });
            hls.on(window.Hls.Events.ERROR, function (event, data) {
                if (!data || !data.fatal) {
                    return;
                }
                if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                    setState('正在重连');
                    hls.startLoad();
                } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                    setState('正在恢复');
                    hls.recoverMediaError();
                } else {
                    setState('视频暂时无法播放');
                    hls.destroy();
                }
            });
        } else {
            setState('视频暂时无法播放');
        }
    }

    function start() {
        if (!video) {
            return;
        }
        prepare();
        if (cover) {
            cover.classList.add('hidden');
        }
        var promise = video.play();
        if (promise && typeof promise.then === 'function') {
            promise.then(function () {
                setState('');
            }).catch(function () {
                setState('点击播放');
                if (cover) {
                    cover.classList.remove('hidden');
                }
            });
        }
    }

    if (cover) {
        cover.addEventListener('click', start);
    }
    if (video) {
        video.addEventListener('click', function () {
            if (video.paused) {
                start();
            }
        });
        video.addEventListener('canplay', function () {
            setState('');
        });
        window.addEventListener('beforeunload', function () {
            if (hls) {
                hls.destroy();
            }
        });
    }
})();
