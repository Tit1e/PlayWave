(function (global, factory) {
  // "use strict";
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = global.document
      ? factory(global, true)
      : function (w) {
          if (!w.document) {
            throw new Error("PlayWave requires a window with a document");
          }
          return factory(w);
        };
  } else {
    factory(global);
  }
})(typeof window !== "undefined" ? window : this, function (window, noGlobal) {
  "use strict";

  // 播放器监听事件 https://help.aliyun.com/document_detail/125572.html?spm=a2c4g.11186623.6.1091.131d1c4cujQOMr
  const playerEvents = [
    "ready",
    "play",
    "pause",
    "canplay",
    "playing",
    "ended",
    "liveStreamStop",
    "onM3u8Retry",
    "hideBar",
    "showBar",
    "waiting",
    "timeupdate",
    "snapshoted",
    "requestFullScreen",
    "cancelFullScreen",
    "error",
    "startSeek",
    "completeSeek",
  ];
  // 波形监听事件 https://wavesurfer-js.org/docs/events.html
  const wavesurferEvents = [
    "audioprocess",
    "dblclick",
    "destroy",
    "error",
    "finish",
    "interaction",
    "loading",
    "mute",
    "pause",
    "play",
    "ready",
    "scroll",
    "seek",
    "volume",
    "waveform-ready",
    "zoom",
  ];
  const playwave = ["ready", "error"];
  // 用于存储变量名
  const Funcs = [];

  // 当前定位所在的时间
  let currentRegionTime = 0;
  // m3u8 实际开始时间跟预期开始时间的时间差
  let seekTime = 0;
  // 自动校准波形
  let calibrateTimer = null;
  // m3u8 预期开始时间
  let startTime = 0;
  // 播放器配置
  let playerOptions = null;
  // 波形配置
  let waveSurferOptions = null;
  // 时间轴配置
  let timeLineOptions = null;
  // 其他配置
  let options = null;
  // 是否要自动校准
  let autoCalibrate = false;
  let minPxPerSec = 0;
  // ready 状态
  let playReady = false;
  let wavesurferReady = false;
  // 播放器 播放/暂停 状态改变时会触发
  let changeState = false;
  class PlayWave {
    isReady = false;
    // 播放器实例
    player = null;
    // 波形实例
    wavesurfer = null;
    constructor(
      _playerOptions,
      _waveSurferOptions,
      _timeLineOptions,
      _options
    ) {
      // 储存配置
      this.init(_playerOptions, _waveSurferOptions, _timeLineOptions, _options);
    }
    // 初始化实例
    init(_playerOptions, _waveSurferOptions, _timeLineOptions, _options) {
      playerOptions = _playerOptions;
      waveSurferOptions = _waveSurferOptions;
      timeLineOptions = _timeLineOptions;
      options = _options;
      const { minPxPerSec = 50 } = waveSurferOptions;
      const { startTime } = options;
      this.setAutoCalibrate(!!options.autoCalibrate);
      this.setMinPxPerSec(minPxPerSec);
      this.setStartTime(startTime);

      const { json, mp3 } = options;
      // 监听时间数据初始化
      this.initEventsData(playerEvents, "p");
      this.initEventsData(wavesurferEvents, "w");
      this.initEventsData(playwave, "");
      // 设置时间差
      this._getSeekTime(playerOptions.source).then((seektime) => {
        this.initPlayer(playerOptions);
        this.setSeekTime(seektime);
        // 初始化波形实例
        this.loadWaveSurfer(waveSurferOptions, timeLineOptions).then(() => {
          // 加载波形
          this.waveOperate(json, mp3);
        });
      }).catch(() => {
        this.run("error");
      })
    }
    /**
     * 创建播放器实例
     * @param {Object} param Aliplayer 配置项
     */
    initPlayer({
      id,
      source,
      width = "600px",
      height = "400px",
      autoplay = false,
      isLive = false,
      rePlay = false,
      playsinline = false,
      preload = true,
      controlBarVisibility = "always",
      useH5Prism = true,
    }) {
      return new Promise((resolve, reject) => {
        try {
          this.player = new Aliplayer({
            id: id,
            source: source,
            width: width,
            height: height,
            autoplay: autoplay,
            isLive: isLive,
            rePlay: rePlay,
            playsinline: playsinline,
            preload: preload,
            controlBarVisibility: controlBarVisibility,
            useH5Prism: useH5Prism,
            skinLayout: [
              {
                name: "bigPlayButton",
                align: "blabs",
                x: 30,
                y: 80,
              },
              {
                name: "H5Loading",
                align: "cc",
              },
              {
                name: "errorDisplay",
                align: "tlabs",
                x: 0,
                y: 0,
              },
              {
                name: "infoDisplay",
              },
              {
                name: "tooltip",
                align: "blabs",
                x: 0,
                y: 56,
              },
              {
                name: "thumbnail",
              },
              {
                name: "controlBar",
                align: "blabs",
                x: 0,
                y: 0,
                children: [
                  // {
                  //   name: "progress",
                  //   align: "blabs",
                  //   x: 0,
                  //   y: 44,
                  // },
                  // {
                  //   name: "playButton",
                  //   align: "tl",
                  //   x: 15,
                  //   y: 12,
                  // },
                  {
                    name: "timeDisplay",
                    align: "tl",
                    x: 10,
                    y: 7,
                  },
                  {
                    name: "fullScreenButton",
                    align: "tr",
                    x: 10,
                    y: 12,
                  },
                  // {
                  //   name: "setting",
                  //   align: "tr",
                  //   x: 15,
                  //   y: 12,
                  // },
                  {
                    name: "volume",
                    align: "tr",
                    x: 5,
                    y: 10,
                  },
                ],
              },
            ],
          });
          this.bindEvents(this.player, playerEvents, "p");
          this.player.on("ready", () => {
            this.player.seek(seekTime);
            this.setReady("playReady");
            this.run("pready");
          });
          this.player.on("play", () => {
            this.play();
            this.run("pplay");
          });
          this.player.on("pause", () => {
            this.pause();
            this.run("ppause");
          });
          resolve(this.player);
        } catch (error) {
          reject(error);
        }
      });
    }
    /**
     * 用于获取 m3u8 实际开始时间跟预期开始时间的时间差
     * @param {String} url m3u8 地址
     */
    _getSeekTime(url) {
      return new Promise((resolve, reject) => {
        this._http(url)
          .then((data) => {
            if (data.length > 100) {
              const matchReg = /http.*?\.ts/gi;
              const matchReg1 = /http.*?\.aac/gi;
              const r =
                data.match(matchReg) != null
                  ? data.match(matchReg)[0]
                  : data.match(matchReg1)[0];
              const arr = r.split("/");
              resolve(startTime - +arr.pop().substring(0, 10));
            } else {
              reject();
            }
          })
          .catch(() => {
            reject();
          });
      });
    }
    // 设置自动校准定时器
    setCalibrateTimer() {
      const { calibrateDelay = 5000 } = options;
      calibrateTimer = setInterval(() => {
        this.calibrate();
      }, calibrateDelay);
    }
    // 清除自动校准定时器
    clearCalibrateTimer() {
      if (!calibrateTimer) return;
      clearInterval(calibrateTimer);
      calibrateTimer = null;
    }
    // 创建波形实例
    loadWaveSurfer(waveSurferOptions, timeLineOptions) {
      // 波形配置
      const {
        container,
        waveColor = "#21b9f3",
        cursorColor = "#ff0000",
        progressColor = "#0e325c",
        autoCenter = true,
        pixelRatio = 1,
        height = "50",
        fillParent = true,
        minPxPerSec = 50,
        backgroundColor = "#000000",
        backend = "MediaElement",
        scrollParent = true,
        barHeight = 0.8,
        barRadius = 0,
        closeAudioContext = false,
        cursorWidth = 1,
        forceDecode = false,
        interact = true,
        loopSelection = true,
      } = waveSurferOptions;
      const {
        container: timeContainer,
        height: timeHeight = 15,
      } = timeLineOptions;
      return new Promise((resove, reject) => {
        this.wavesurfer = WaveSurfer.create({
          container: container,
          waveColor,
          cursorColor,
          progressColor,
          autoCenter,
          pixelRatio,
          height,
          fillParent,
          minPxPerSec,
          backgroundColor,
          backend,
          scrollParent,
          barHeight,
          barRadius,
          closeAudioContext,
          cursorWidth,
          forceDecode,
          interact,
          loopSelection,
          plugins: [
            WaveSurfer.timeline.create({
              container: timeContainer,
              start: startTime,
              height: timeHeight,
            }),
            WaveSurfer.regions.create({
              regions: [],
              dragSelection: {
                slop: 5,
              },
            }),
          ],
        });
        this.wavesurfer.on("ready", () => {
          this.setReady("wavesurferReady");
          this.run("wready");
        });
        this.wavesurfer.on("play", () => {
          this.run("wplay");
        });
        this.wavesurfer.on("pause", () => {
          this.run("wpause");
        });
        this.wavesurfer.on("seek", () => {
          this.addCurrent();
          this.player.seek(this.getCurrentTime() + seekTime);
          this.run("wseek");
        });
        this.bindEvents(this.wavesurfer, wavesurferEvents, "w");
        this.wavesurfer.setMute(true);
        resove();
      });
    }
    bindEvents(o, eventsList, prefix) {
      eventsList.forEach((i) => {
        o.on(i, () => {
          this.run(`${prefix}${i}`);
        });
      });
    }
    // 加载波形
    waveOperate(json_url, mp3_url) {
      this._http(json_url).then((res) => {
        this.wavesurfer.load(mp3_url, res.data);
      });
    }

    // PlayWave 的一些方法
    // 播放
    play() {
      this.player.play();
      this.wavesurfer.play();
      if (autoCalibrate && !calibrateTimer) {
        this.setCalibrateTimer();
      }
    }
    // 暂停
    pause() {
      this.player.pause();
      this.wavesurfer.pause();
      if (autoCalibrate && calibrateTimer) {
        this.clearCalibrateTimer();
      }
    }
    getSeekTimeByUrl(url) {
      return this._getSeekTime(url)
    }
    // 重载播放器地址
    loadByUrl(url, time) {
      if (this.player) {
        playerOptions.source = url
        this.player.loadByUrl(url, time)
      }
    }
    /**
     * 视频跳转
     * @param {Number} time 要跳转的秒数
     */
    seek(time) {
      this.playSeek(time)
      this.waveSeek(time)
    }
    // 播放器跳转
    playSeek(time) {
      const _seekTime = seekTime;
      this.player.seek(+time + _seekTime);
    }
    // 波形跳转，不包含播放器跳转
    waveSeek(time) {
      this.wavesurfer.play(time);
    }
    // 校准波形与视频时间
    calibrate() {
      this.wavesurfer.play(this.getCurrentTime());
      this.player.seek(this.getCurrentTime() + seekTime);
    }
    /**
     * 切换时间轴轴线移动方式
     * @param {Boolean || undefined} type 轴线移动方式，参考 wavesurfer.js 的 autoCenter 属性
     */
    autoCenter(type) {
      if (type !== undefined) {
        this.wavesurfer.params.autoCenter = type;
      } else {
        this.wavesurfer.params.autoCenter = !this.wavesurfer.params.autoCenter;
      }
    }
    // 获取播放器当前播放秒数
    getPlayCurrentTime() {
      return this.player.getCurrentTime()
    }
    // 获取当前播放秒数
    getCurrentTime() {
      return this.wavesurfer.getCurrentTime();
    }
    // 获取定位所在时间
    getCurrentRegionTime() {
      return currentRegionTime;
    }
    // 添加区域
    addRegion({
      id,
      start,
      end,
      color = "rgba(255,255,0, 0.5)",
      drag = false,
      resize = true,
    }) {
      this.wavesurfer.addRegion({
        id,
        start,
        end,
        color,
        drag,
        resize,
      });
    }
    
    // 设置跳转时间
    setSeekTime(seek = 0) {
      seekTime = seek;
    }
    // 获取跳转时间
    getSeekTime() {
      return seekTime;
    }
    // 设置开始时间
    setStartTime(starttime) {
      startTime = +starttime;
    }
    setAutoCalibrate(type = true) {
      autoCalibrate = type;
    }
    /**
     * 缩放时间轴
     * @param {Boolean || Number} type true 为 minPxPerSec * 2， false 为缩小 minPxPerSec * 1/2
     */
    zoom(type) {
      let _minPxPerSec = 0;
      if (typeof type === "boolean") {
        if (type) {
          _minPxPerSec = minPxPerSec * 2;
        } else {
          _minPxPerSec = minPxPerSec / 2;
        }
      }
      if (typeof type === "number") {
        _minPxPerSec = type;
      }
      this.setMinPxPerSec(_minPxPerSec);
      this.wavesurfer.zoom(_minPxPerSec);
    }
    // 设置缩放基础值
    setMinPxPerSec(num) {
      minPxPerSec = num;
    }
    // 添加当前位置坐标
    addCurrent() {
      // 先移除之前的坐标线
      this.removeCurrent();

      const currentTime = this.getCurrentTime();
      currentRegionTime = currentTime;
      this.addRegion({
        id: "currentRegion",
        start: currentTime,
        end: currentTime + 0.03,
        color: "rgb(0, 255, 0)",
      });
    }
    // 移除当前区域
    removeCurrent() {
      let child = document.querySelector('region[data-id="currentRegion"]');
      if (child) child.parentNode.removeChild(child);
    }
    // 移除所有区域
    removeRegions() {
      this.wavesurfer.regions.clear();
    }
    // 销毁
    destroy() {
      this.wavesurfer && this.wavesurfer.destroy();
      this.player && this.player.dispose();
    }
    // 重载
    reload(_playerOptions, _waveSurferOptions, _timeLineOptions, _options) {
      this._reset();
      this.destroy();
      this.init(_playerOptions, _waveSurferOptions, _timeLineOptions, _options);
    }
    // 是否正在播放
    isPlaying() {
      return this.wavesurfer.isPlaying();
    }

    setReady(type) {
      if (type === "playReady") playReady = true;
      if (type === "wavesurferReady") wavesurferReady = true;
      if (playReady && wavesurferReady) {
        this.isReady = true;
        this.run("ready");
      }
    }
    // 清空缓存数据
    _reset() {
      // 清除定时
      this.clearCalibrateTimer();
      Funcs.length = 0;
      this.isReady = false;
      this.pKEY_LIST.length = 0;
      this.wKEY_LIST.length = 0;
      // 清空一些缓存数据
      playReady = false;
      wavesurferReady = false;
      startTime = 0;
      seekTime = 0;
      currentRegionTime = 0;
      minPxPerSec = 0;
      autoCalibrate = false;
      this.wavesurfer.unAll();
    }
    /**
     * 用于获取 m3u8 文件内容
     * @param {String} url m3u8 地址
     */
    _http(url) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("get", url);
        xhr.onreadystatechange = () => {
          if (xhr.readyState == 4) {
            if (xhr.status == 200) {
              let res;
              try {
                res = JSON.parse(xhr.responseText);
              } catch (error) {
                res = xhr.responseText;
              }
              resolve(res);
            } else {
              reject();
            }
          }
        };
        xhr.send(null);
      });
    }
    initEventsData(playerEvents, prefix) {
      this[`${prefix}KEY_LIST`] = [];
      const length = playerEvents.length;
      for (let i = 0; i < length; i++) {
        const key = `${prefix}${playerEvents[i]}`;
        this[`${prefix}KEY_LIST`].push(key);
        // 如果 this[`${key}Func`] 变量没创建，就创建变量
        if (!this[`${key}Func`]) this[`${key}Func`] = [];

        // 将变量名存起来，销毁时遍历清空方法
        Funcs.push(`${key}Func`);
      }
    }
    on(key, callback) {
      if (
        !this.pKEY_LIST.includes(key) &&
        !this.wKEY_LIST.includes(key) &&
        !playwave.includes(key)
      ) {
        console.error(`不支持监听事件 ${key}`);
        return;
      }
      if (typeof callback !== "function") {
        console.error("callback 必须是一个函数");
        return;
      }
      this[`${key}Func`].push(callback);
    }
    run(key) {
      this[`${key}Func`].forEach((func) => func(this));
    }
  }
  if (!noGlobal) {
    window.PlayWave = PlayWave;
  }
  return PlayWave;
});
