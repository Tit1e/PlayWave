# PlayWave

## Options

`PlayWave` 共有 4 个参数
### 1. playerOptions
参数同 aliplayer
### 2. waveSurferOptions
参数同 waveSurfer
### 3. timeLineOptions
参数同 timeline 插件
### 4. otherOptions
|  参数名   | 类型  | 默认值  | 说明  |
|  ----  | ----  | ----  | ----  |
| json  | String | 必传 | 请求波形坐标 json |
| mp3  | String | 必传 | 波形所需 mp3 |
| autoCalibrate  | Boolean | true | 是否需要自动矫正播放器与波形的播放进度 |
| calibrateDelay  | Number | 5000 | 矫正间隔时间 |



## Use
```html
<!-- 头部引入 aliplayer css -->
<link rel="stylesheet" href="//g.alicdn.com/de/prismplayer/2.8.8/skins/default/aliplayer-min.css" />
<!-- 定义播放器，波形，时间轴容器 -->
<div>
  <div id="timeline"></div>
  <div id="wavesurfer"></div>
</div>
<div id="aliplayer"></div>

<!-- 引入相关 js -->
<script src="./wavesurfer.js"></script>
<script src="./wavesurfer.regions.js"></script>
<script src="./wavesurfer.timeline.js"></script>
<script src="./PlayWave.js"></script>
```
```js
const playwave = new PlayWave(
  {
    id: 'aliplayer',
    source: 'http://az.hz-data.xyz:8087/channel/11000010002785/playback.m3u8?start_time=1592668810&end_time=1592684997',
  }, {
    container: '#wavesurfer',
    height: '100',
    loopSelection: false,
    minPxPerSec: 40
  }, {
    container: '#timeline'
  },{
    json: this.jsonList[this.index],
    mp3: this.mp3List[this.index],
    autoCalibrate: true
  }
)
```

## Methods
|  方法名   | 参数  | 说明  |
|  ----  | ----  | ----  |
| play  | - | 播放 |
| pause  | - | 暂停 |
| seek  | Number | 跳转的秒数 |
| calibrate  | - | 校准播放器与波形时间 |
| autoCenter  | Boolean 或 不传 | 传值则设为指定值，不传则在 `true` 与 `false` 之间切换 |
| getCurrentTime  | - | 获取当前时间轴的时间 |
| getCurrentRegionTime  | - | 获取当前定位所在位置的时间 |
| addRegion  | {id,start,end,color,drag,resize,} | 添加区域 |
| setSeekTime  | Number | 设置预期开始时间与实际开始时间的时间差 |
| setStartTime  | Number | 设置 m3u8 的开始时间 |
| setAutoCalibrate  | Boolean | 设置是否要自动校验 |
| zoom  | Boolean 或 Number | 如果传 Boolean，true 为放大一倍， false 为缩小一倍，如果传固定值则设为固定值，基数为 wavesurfer 选项中的 minPxPerSec 值 |
| setMinPxPerSec  | Number | 设置缩放基础值 |
| addCurrent  | - | 在波形上标记当前点击位置 |
| removeCurrent  | - | 移除 id 为 currentRegion 的 节点 |
| removeRegions  | - | 移除所有区域 |
| destroy  | - | 销毁实例 |
| reload  | - | 重新加载实例 |


## Events
[aliplayer](https://help.aliyun.com/document_detail/125572.html?spm=a2c4g.11186623.6.1091.131d1c4cujQOMr)

[wavesurfer.js](https://wavesurfer-js.org/docs/events.html)

监听事件可参考 aliplayer.js 与 wavesurfer.js 的监听事件，
如想监听 aliplayer 的事件，只需在原事件前加上 `p` 即可
```js
// 原本监听 aliplayer
const aliplayer = new Aliplayer({})
aliplayer.on('play', () => {
  // code ......
})
// 现在监听 aliplayer
const playwave = new PlayWave({})
playwave.on('pplay', () => {
  // code ......
})
```

如想监听 aliplayer 的事件，只需在原事件前加上 `w` 即可
```js
// 原本监听 wavesurfer
const wavesurfer = new WaveSurfer({})
wavesurfer.on('play', () => {
  // code ......
})
// 现在监听 wavesurfer
const playwave = new PlayWave({})
this.playwave.on('wplay', () => {
  // code ......
})
```