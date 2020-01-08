import React, { Component } from 'react';
import * as mapvgl from 'mapvgl';
import Color from 'color';
import h337 from 'heatmap.js';
import TitleHeader from './components/TitleHeader';
import Map3D from './components/Map3D';
import Map2D from './components/Map2D';
import ShenhaiData from './data/chengdu_avgspeed_sort_work.json';

import './App.less';

function FizzyText(radius, max, min, gradient, color1Value, color1, color2Value, color2, color3Value, color3, color4Value, color4) {
    this.radius = radius;
    this.max = max;
    this.min = min;
    this.gradient = gradient 

    this.color1Value = color1Value;
    this.color1 = color1;
    this.color2Value = color2Value;
    this.color2 = color2;
    this.color3Value = color3Value;
    this.color3 = color3;
    this.color4Value = color4Value;
    this.color4 = color4;

}

const gradientOptions = [
    { 
        0.25: "rgba(0, 0, 255, 1)",
        0.55: "rgba(0, 255, 0, 1)",
        0.85: "rgba(255, 255, 0, 1)",
        1.0: "rgba(255, 0, 0, 1)"
    },
    { 
        0.25: "rgba(255, 0, 0, 1)",
        0.55: "rgba(255, 255, 0, 1)",
        0.85: "rgba(0, 255, 0, 1)",
        1.0: "rgba(0, 0, 255, 1)"
    },
    { 
        0.25: "rgba(0, 0, 255, 1)",
        0.55: "rgba(0, 102, 255, 1)",
        0.85: "rgba(0, 187, 255, 1)",
        1.0: 'rgba(255, 255, 255, 1)'
    },
    { 
        0.25: 'rgba(255, 255, 255, 1)',
        0.55: "rgba(0, 187, 255, 1)",
        0.85: "rgba(0, 102, 255, 1)",
        1: "rgba(0, 0, 255, 1)"
    }
  ];

class App extends Component {

    canvasWidth = 298;
    canvasHeight = 96;
    state = {
        dataWeRender: ShenhaiData,
        innerHeight: window.innerHeight,
        visible: true,
        text: null,
        selectValue: null
    };
    tRef = React.createRef();

    componentDidMount() {
        window.addEventListener('resize', this.onResize);
        this.tRef.current.addEventListener("dragover", function (e) {
			e.preventDefault()
			e.stopPropagation()
		})
		this.tRef.current.addEventListener("dragenter", function (e) {
			e.preventDefault()
			e.stopPropagation()
		})
        this.tRef.current.addEventListener("drop", this.onDropUploadClick)

        this.canvasContainer.addEventListener('click', (e) => {
            const { dataWeRender } = this.state
            const x = Math.ceil((e.pageX -  this.ctx.canvas.getBoundingClientRect().left) / 2)
            const y = Math.ceil((e.pageY - this.ctx.canvas.getBoundingClientRect().top) / 2)
            const { hotData } = this.parseData(dataWeRender);   
            
            const showPoint = hotData.filter(item => item[0] === x && item[1]  === y - 1 ) || []
            const selectValue = {
                x,
                y,
                showPoint,
                nowTime: this.parseTime(y / 96 * 24)
            }
            this.setState({ selectValue })
    
        })
    }

    parseTime = (num) => {
        return ('0' + Math.floor(num) % 24).slice(-2) + ':' + ((num % 1)*60 + '0').slice(0, 2);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.onResize);
    }

    onResize = () => {
        this.setState({
            innerHeight: window.innerHeight
        });
    }

    onMapLoaded = map => {
        this.map = map;
        this.initMapvgl(map);
    }

    initMapvgl = map => {
        const { dataWeRender } = this.state
        let { heatMax } = this.parseData(dataWeRender);
       
        this.view = new mapvgl.View({
            map: map
        });
        // 初始化 GUI面板
        this.initGUIPanel(4, heatMax, 0, { 
            0.25: "rgba(0, 0, 255, 1)",
            0.55: "rgba(0, 255, 0, 1)",
            0.85: "rgba(255, 255, 0, 1)",
            1.0: "rgba(255, 0, 0, 1)"
        },  heatMax * .25, "rgba(0, 0, 255, 1)",
            heatMax * .55, "rgba(0, 255, 0, 1)",
            heatMax * .85, "rgba(255, 255, 0, 1)",
            heatMax * 1, "rgba(255, 0, 0, 1)")
        this.initCanvas();
        this.drawMapvgl();
        // this.drawTimeText()
    }

    initCanvas = () => {
        const { gradient } = this.text

        const nuConfig = {
            container: this.canvasContainer,
            blur: 1,
            gradient,
            backgroundColor: '#000'
        };

        this.heatmap = h337.create(nuConfig);
        this.canvas = this.heatmap._renderer.canvas;
        this.ctx = this.canvas.getContext('2d');
    }

    drawMapvgl = () => {
        const { dataWeRender } = this.state
        const { heatMax, heatData, lineData } = this.parseData(dataWeRender);

        this.maxText.setValue(heatMax)
        this.color1Value.setValue(heatMax * .25)
        this.color2Value.setValue(heatMax * .55)
        this.color3Value.setValue(heatMax * .85)
        this.color4Value.setValue(heatMax * 1)        

        this.radiusText.setValue(2)

        heatData.map(item =>  Object.assign(item, {radius: 4}))

        this.heatmap.setData({
            max: heatMax,
            min: 0,
            data: heatData
        });
        this.mockCanvas = document.createElement('canvas');
        this.mockCanvas.width = 256
        this.mockCanvas.height = 128
        this.mockCtx = this.mockCanvas.getContext('2d');

        this.imageData = this.canvas.toDataURL();
        let img = this.img = document.createElement('img');
        this.img.src = this.imageData
        this.img.width = 299 
        this.img.height = 96 
        const _this = this
        this.img.onload = function () {
            _this.mockCtx.drawImage(img, 0, 0, 299, 96, 0, 0, 256, 128);
            _this.layer = new mapvgl.WallLayer({
                texture: _this.mockCanvas,
                height: 12000,
                enablePreciseMap: true
            });
            _this.view.addLayer(_this.layer);  
            _this.layer.setData(lineData);
        }

    }

    drawTimeText = () => {
        this.ctx.font = '20px normal 微软雅黑';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.save();
        this.ctx.scale(1/4, 1);
        for (let i = 0; i <= 4; i++) {
            this.ctx.fillText(`${24/4*i}:00`, 0, this.canvasHeight / 4 * i);
        }
        this.ctx.restore();
    }

    parseData = roadData => {
        let dataMaxWidth = roadData.length;
        let dataMaxHeight = 0;
        let dataMaxValue = 0;
        let dataMinValue = Infinity;
        let lineData = [];
        let hotData = [];
        let path = [];
        for (let i = 0; i < roadData.length; i++) {
            const link = roadData[i];
            for (let j = 0; j < link.data.length; j++) {
                const hot = link.data[j];
                hotData.push([i, ...hot]);
                dataMaxHeight = Math.max(dataMaxHeight, hot[0]);
                dataMaxValue = Math.max(dataMaxValue, hot[1]);
                dataMinValue = Math.min(dataMinValue, hot[1]);
            }

            let loc = link.loc.split(',');
            for (let k = 0; k < loc.length; k+=2) {
                const x = Number(loc[k]);
                const y = Number(loc[k +1 ]);
                path.push([x, y]);
            }
        }
 
        lineData.push({
            geometry: {
                type: 'LineString',
                coordinates: path
            }
        });

        var heatData = [];
        var preWidth = this.canvasWidth / dataMaxWidth;
        var preHeight = this.canvasHeight / dataMaxHeight;
  
        hotData.forEach(data => {
            heatData.push({
                x: data[0] * preWidth,
                y: data[1] * preHeight,
                value: data[2]
            })
        });

        return {
            heatMax: dataMaxValue,
            heatData,
            lineData,
            hotData 
        };
    }

    bindCanvasRef = input => {
        this.canvasContainer = input;
    }

    layerSetData = () => {
        const { dataWeRender } = this.state
        const { lineData } = this.parseData(dataWeRender);

        if (this.layer) {
            this.view.addLayer(this.layer);  
            this.layer.setData(lineData);
        }
    }

    changeHeatMap = () => {
        const { dataWeRender } = this.state
        const { heatData } = this.parseData(dataWeRender);
        const { radius, max, min } = this.text
        heatData.map(item =>  Object.assign(item, {radius}))
        this.heatmap.setDataMax(max)
        this.heatmap.setDataMin(min)

        this.heatmap.setData({
            max: max,
            min: min,
            data: heatData
        });

        this.mockCtx = this.mockCanvas.getContext('2d');
        this.mockCtx.clearRect(0, 0, this.mockCanvas.width, this.mockCanvas.height)
        let imageData = this.heatmap._renderer.canvas.toDataURL();

        this.img.src = imageData
        const _this = this

        this.img.onload = function () {
            _this.mockCtx.drawImage(_this.img, 0, 0, 299, 96, 0, 0, 256, 128);
            _this.layer.setOptions({
                texture: _this.mockCanvas,
            })
        }
        this.layerSetData()
        this.forceUpdate()
    }

    getColorFromColorStops = (colorStops, percent) => { 
        if (percent < 0) {
          percent = 0;
        }
        if (percent > 1) {
          percent = 1;
        }
        let i = 0;
        for (let length = colorStops.length; i < length; ++i) {
          const colorStop = colorStops[i];
          if (colorStop[0] >= percent) {
            break;
          }
        }
        const startColorStop = colorStops[i - 1];
        const endColorStop = colorStops[i];
        let startPercent = 0;
        let endPercent = 1;
        let startColor = null;
        let endColor = null;
        if (startColorStop) {
          startPercent = startColorStop[0];
          startColor = startColorStop[1];
        }
        if (endColorStop) {
          endPercent = endColorStop[0];
          endColor = endColorStop[1];
        }
        if (!startColor) {
          startColor = endColor || '#000';
        }
        if (!endColor) {
          endColor = startColor || '#000';
        }
    
        let relativePercent = (percent - startPercent) / (endPercent - startPercent);
        const startColorObj = Color(startColor)
        const endColorObj = Color(endColor);
        const sr = startColorObj.red();
        const sg = startColorObj.green();
        const sb = startColorObj.blue();
        const sa = startColorObj.alpha();
        const er = endColorObj.red();
        const eg = endColorObj.green();
        const eb = endColorObj.blue();
        const ea = endColorObj.alpha();
        return `rgba(${(sr + (er - sr) * relativePercent).toFixed()},` +
          `${(sg + (eg - sg) * relativePercent).toFixed()},` +
          `${(sb + (eb - sb) * relativePercent).toFixed()},` +
          `${(sa + (ea - sa) * relativePercent).toFixed()})`;
      }

    changeHeatMapAllColor = () => {
        const { max, color1Value, color2Value, color3Value, color4Value, gradient} = this.text

        const nuConfig = {
            gradient,
            backgroundColor: '#000'
        };

        this.color1Value.setValue(max * 0.25)
        this.color2Value.setValue(max * 0.55)
        this.color3Value.setValue(max * 0.85)
        this.color4Value.setValue(max * 1)


        
        this.color1.setValue(gradient['0.25'])
        this.color2.setValue(gradient['0.55'])
        this.color3.setValue(gradient['0.85'])
        this.color4.setValue(gradient['1'])        

        this.heatmap.configure(nuConfig)

        this.mockCtx = this.mockCanvas.getContext('2d');
        this.mockCtx.clearRect(0, 0, this.mockCanvas.width, this.mockCanvas.height)
        let imageData = this.heatmap._renderer.canvas.toDataURL();

        this.img.src = imageData
    
        const _this = this
        this.img.onload = function () {
            _this.mockCtx.drawImage(_this.img, 0, 0, 299, 96, 0, 0, 256, 128);
            _this.layer.setOptions({
                texture: _this.mockCanvas,
            })
        }
        this.layerSetData()
        this.forceUpdate()
    }
    changeHeatMapColor = () => {
        const { max, color1Value, color2Value, color3Value, color4Value, color1, color2, color3, color4} = this.text
        
        const colorArr = [
            [0.25, color1],
            [0.55, color2],
            [0.85, color3],
            [1, color4]
        ];
  
        const nuConfig = {
            gradient: {
                [color1Value / max] : color1,
                [color2Value / max] : color2,
                [color3Value / max] : color3,
                [color4Value / max] : color4,
                // [color1Value / max] : this.getColorFromColorStops(colorArr, color1Value / max),
                // [color2Value / max] : this.getColorFromColorStops(colorArr, color2Value / max),
                // [color3Value / max] : this.getColorFromColorStops(colorArr, color3Value / max),
                // [color4Value / max] : this.getColorFromColorStops(colorArr, color4Value / max),
            },
            backgroundColor: '#000'
        };      

        // this.color1.setValue(nuConfig.gradient[color1Value / max])
        // this.color2.setValue(nuConfig.gradient[color2Value / max])
        // this.color3.setValue(nuConfig.gradient[color3Value / max])
        // this.color4.setValue(nuConfig.gradient[color4Value / max])
        
        this.color1Value.max(max)
        this.color2Value.max(max)
        this.color3Value.max(max)
        this.color4Value.max(max)


        this.heatmap.configure(nuConfig)

        this.mockCtx = this.mockCanvas.getContext('2d');
        this.mockCtx.clearRect(0, 0, this.mockCanvas.width, this.mockCanvas.height)
        let imageData = this.heatmap._renderer.canvas.toDataURL();

        this.img.src = imageData
    
        const _this = this
        this.img.onload = function () {
            _this.mockCtx.drawImage(_this.img, 0, 0, 299, 96, 0, 0, 256, 128);
            _this.layer.setOptions({
                texture: _this.mockCanvas,
            })
        }
        this.layerSetData()
        this.forceUpdate()
    }

    onChangeClick = () => {
        const { visible } = this.state
        
        this.setState({ visible: !visible })
    }
      
    initGUIPanel = (radius, max, min, gradient, color1Value, color1, color2Value, color2, color3Value, color3, color4Value, color4) => {
       
        this.gui = new window.dat.GUI({
            nameMap: {
                radius: '辐射半径',
                min: '最小阈值',
                max: '最大阈值',
                gradient: '渐变色',
                color1Value: '一档位值',
                color1: '一档颜色',
                color2Value: '二档位值',
                color2: '二档颜色',
                color3Value: '三档位值',
                color3: '三档颜色',
                color4Value: '四档位值',
                color4: '四档颜色',
            }
        });

        this.text = new FizzyText(radius, max, min, gradient, color1Value, color1, color2Value, color2, color3Value, color3, color4Value, color4);
   
        this.setState({ text: this.text })
        
        this.radiusText = this.gui.add(this.text, 'radius').min(0.5);
        this.minText = this.gui.add(this.text, 'min').max(max);
        this.maxText = this.gui.add(this.text, 'max');

        this.radiusText.onFinishChange(this.changeHeatMap);
        this.minText.onFinishChange(this.changeHeatMap);
        this.maxText.onFinishChange(this.changeHeatMap);
        
        this.gradientOptions = this.gui.addGradient(this.text, 'gradient', gradientOptions);
        this.gradientOptions.onFinishChange(this.changeHeatMapAllColor);

        // 第一档
        this.color1Value = this.gui.add(this.text, 'color1Value').max(max);
        this.color1Value.onFinishChange(this.changeHeatMapColor);
        this.color1 = this.gui.addColor(this.text, 'color1');
        this.color1.onFinishChange(this.changeHeatMapColor);
        // 第二档
        this.color2Value = this.gui.add(this.text, 'color2Value').max(max);
        this.color2Value.onFinishChange(this.changeHeatMapColor);
        this.color2 = this.gui.addColor(this.text, 'color2');
        this.color2.onFinishChange(this.changeHeatMapColor);
        // 第三档
        this.color3Value = this.gui.add(this.text, 'color3Value').max(max);
        this.color3Value.onFinishChange(this.changeHeatMapColor);
        this.color3 = this.gui.addColor(this.text, 'color3');
        this.color3.onFinishChange(this.changeHeatMapColor);
        // 第四档
        this.color4Value = this.gui.add(this.text, 'color4Value').max(max);
        this.color4Value.onFinishChange(this.changeHeatMapColor);
        this.color4 = this.gui.addColor(this.text, 'color4');
        this.color4.onFinishChange(this.changeHeatMapColor);

        this.gui.__controllers.forEach(e => {
            e.updateDisplay()
        })
    }

    // 切换控制
    onChangeClick = () => {
        const { visible } = this.state

        this.setState({ visible: !visible })
    }

    onDropUploadClick = (e) => {
        const _this = this
        e.preventDefault()
		e.stopPropagation()
        var files = this.files || e.dataTransfer.files
        var reader = new FileReader()
        reader.readAsText(files[0], 'utf-8')
        reader.onload = function (evt) {
            _this.setState({ dataWeRender: JSON.parse(evt.target.result) }, () => {
                _this.view.removeLayer(_this.layer)
                _this.drawMapvgl()
            })
        }
    }

    onDropUploadClick = () => {
        this.getFileContent(this.tRef.current, dataWeRender => {
            this.setState({ dataWeRender: JSON.parse(dataWeRender) }, () => {
                this.view.removeLayer(this.layer)
                this.drawMapvgl()
            })
        });
    }
    
    getFileContent = (fileInput, callback) => {
        const _this = this
        if (fileInput.files && fileInput.files.length > 0 && fileInput.files[0].size > 0) {
            var file = fileInput.files[0];
            if (window.FileReader) {
                var reader = new FileReader();
                reader.onloadend = function (evt) {
                    _this.setState({ dataWeRender: JSON.parse(evt.target.result) }, () => {
                        _this.view.removeLayer(_this.layer)
                        _this.drawMapvgl()
                    })
                };
                // 包含中文内容用gbk编码
                reader.readAsText(file, 'gbk');
            }
        }
    };

    render() {
        const { innerHeight, visible, text, dataWeRender, selectValue } = this.state;
        
        return (
            <React.Fragment>
                <TitleHeader />
                <div ref={this.bindCanvasRef} className="canvas"></div>
                {selectValue && selectValue.showPoint[0] &&
                <div className="show">
                    <p>当前时间：{selectValue.nowTime}</p>
                    <p>当前值：{(selectValue.showPoint[0][2]).toFixed(2)}</p>
                </div>}
                {selectValue && !selectValue.showPoint[0] &&
                <div className="show">
                    <p>当前点暂无数据</p>
                </div>}
                {/* <div ref={this.tRef} className="dashboard">请将数据拖入</div> */}
                <input type='file' ref={this.tRef} className="fileUpload" onChange={this.onDropUploadClick}></input>
                <div className="change" onClick={this.onChangeClick}><b>切换2D/3D</b></div>
                <Map3D
                    style={{ height: innerHeight }}
                    visible={visible}
                    center={[11586045.04, 3566065.08]}
                    zoom={11}
                    onMapLoaded={this.onMapLoaded}
                >
                </Map3D>
                {text &&
                    <Map2D
                        center={[11586045.04,3566065.08]}
                        zoom={11}
                        dataWeRender={dataWeRender}
                        text={text}
                        visible={visible}
                        selectValue={selectValue}
                    >
                    </Map2D> 
                }
            </React.Fragment>
        );
    }
}

export default App;
