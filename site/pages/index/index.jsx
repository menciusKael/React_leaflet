import React from "react";
import ReactDOM from "react-dom";
import L from "leaflet";
import { Map, AttributionControl } from "react-leaflet";
import md_ajax from "md_midware/md-service/md-ajax";
import Window from "md_components/panel";
import {
  outerHeight,
  outerWidth,
  getOffsetLeft,
  getOffsetTop
} from "../../../utils/dom/domFns";

import { Select, Button, Table, Tag, Checkbox, message, Icon } from "antd";

import {
  renderPolylineAndMarker,
  renderCircleMarker,
  renderForecastPolylineAndMarker,
  canvasOverlay,
  wmts,
  esri_leaflet
} from "md_components/leaflet";
import { dateFormat, parseDateString } from "../../../utils/date.js";
import vis from "vis";
import "../../styles/color.css";
import "./index.scss";

const position = [15.3, 134.6];
// 请修改此处IP地址和webpack.config.js文件中allowedHosts的值，两者保持一致，都为本机IP，
// 确保局域网中可以使用，host，port，ctx仅开发环境下使用，生产环境请酌情修改。

const host = "http://192.168.100.107"; 
const port = "80"; 
const ctx = host + ":" + port; 
let lastTime;

/**
 * @param   
 * @param  {String} data  风圈数据
 */
//格式化风圈数据
const formatCircleData = data => {
  const radius = [7, 10, 12];
  const temp = [];
  for (let i = 0; i < radius.length; i++) {
    var ele = "radius" + radius[i];
    if (data[ele]) {
      let strArr = data[ele].split(",");
      temp.push(strArr.map(val => parseFloat(val)));
    }
  }
  return temp;
};

export default class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rectRight: 0,
      rectBottom: 0,
      typhoonList: [],
      typhoonPointList: [],
      currentTyphoonName: null,
      selectedRowKeys: [],
      timeLineSpeedLable: 1,
      timeLineCurrentTime: "",
      timeLineStar: true,
      yearsList: [
        { value: "2017", label: "2017" },
        { value: "2016", label: "2016" },
        { value: "2015", label: "2015" },
        { value: "2014", label: "2014" }
      ]
    };
    this.handleYearChange = this.handleYearChange.bind(this);
    this.handleSelectTyphoon = this.handleSelectTyphoon.bind(this);
    this.handleTyphoonPointClick = this.handleTyphoonPointClick.bind(this);
    this.handleTyphoonClick = this.handleTyphoonClick.bind(this);
    this.handleSelectAll = this.handleSelectAll.bind(this);
    this.handleTimeLineClick = this.handleTimeLineClick.bind(this);
    this.clearTimeBlank = this.clearTimeBlank.bind(this);
    this.deleteLayersForTimeLine = this.deleteLayersForTimeLine.bind(this);
    this.hasSearchTyphoonData = {}; 
    this.currentId = null; 
    this.featureLayers = {}; 
    this.forecastLayers = {}; 
    this.timeId = {}; 
    this.lableMarker = {};
    this.stormCircle = {}; 
    this.timeLineQueue = []; 
    this.timeLineSpeed = 1000;
  }

  componentDidMount() {   
    this.map = L.map("map").setView(position, 5);
    L.esri
      .tiledMapLayer({
        url: "http://192.168.19.166:8081/dt?l={z}&r={y}&c={x}",
        maxZoom: 10,
        minZoom: 2
      })
      .addTo(this.map);

    L.esri
      .tiledMapLayer({
        url: "http://192.168.19.166:8081/river?l={z}&r={y}&c={x}",
        maxZoom: 10,
        minZoom: 2
      })
      .addTo(this.map);

    L.esri
      .tiledMapLayer({
        url: "http://192.168.19.166:8081/road?l={z}&r={y}&c={x}",
        maxZoom: 10,
        minZoom: 2
      })
      .addTo(this.map);

    L.esri
      .tiledMapLayer({
        url: "http://192.168.19.166:8081/point?l={z}&r={y}&c={x}",
        maxZoom: 10,
        minZoom: 2
      })
      .addTo(this.map);

    const ownerNode = ReactDOM.findDOMNode(this);
    const nodeHeight = outerHeight(ownerNode);
    const nodeWidth = outerWidth(ownerNode);
    const nodeOffsetLeft = getOffsetLeft(ownerNode);
    const nodeOffsetTop = getOffsetTop(ownerNode);
    this.setState({
      rectRight: nodeOffsetLeft + nodeWidth,
      rectBottom: nodeOffsetTop + nodeHeight
    });
    this.handleYearChange(this.state.yearsList[0].value);
    this.lysGrp = L.layerGroup();
    const container = document.getElementById("timeline");
    
    // create a Timeline
    window.timeline = new vis.Timeline(container);
  }
  /**
 * 全选事件处理函数
 * @param {Boolean} selected 
 * @param {Array} selectedRows 
 * @param {Array} changeRows 
 */
  handleSelectAll(selected, selectedRows, changeRows) {
    const selectedRowKeys = selectedRows.map((ele, index) => {
      return ele.id;
    });
    changeRows.map((ele, index) => {
      this.handleSelectTyphoon(ele, selected);
    });
    this.setState({ selectedRowKeys });
  }
  /**
   * 时间轴当前时间和台风数据时间对比
   * @param {Number} time 时间戳
   * 
   */
  async compareTyphoonWithTime(time) {
   
    const { typhoonList } = this.state;
    // 浅拷贝台风数据并反转
    const compData = typhoonList.slice().reverse();   
    for (let i = 0; i < compData.length; i++) {
      let ele = compData[i];
      // 时间戳对比
      const bTime = parseDateString(ele.begin_time).getTime();
      if (bTime === time) {
        const { id, end_time } = ele;
        this.forecastLayers[id] = {};
        // 闭包放入队列
        // ajax请求台风path数据,使用async/await模式
        const dt = await md_ajax.get(ctx + "/path", { params: { id } });
        const rst = dt.reverse().map((ele, index) => {
          ele._source.key = index;
          const dateStr = ele._source.datetime;
          const year = String.prototype.substr.call(dateStr, 0, 4);
          const month = String.prototype.substr.call(dateStr, 4, 2);
          const day = String.prototype.substr.call(dateStr, 6, 2);
          const hour = String.prototype.substr.call(dateStr, 8, 2);
          const minute = String.prototype.substr.call(dateStr, 10, 2);
          const secend = String.prototype.substr.call(dateStr, 12, 2);
          const date = new Date(year, month - 1, day, hour, minute, secend);
          ele._source.datetimeLong = `${year}年${month}月${day}日${hour}时${minute}分${secend}秒`;
          ele._source.datetime = `${month}月${day}日${hour}时`;
          ele._source.dateObject = date;
          ele._source.end_time = parseDateString(end_time).getTime();
          return ele._source;
        });
        this.timeLineQueue.push(this.timeLineClosure(rst, id));
        // return true
      }
    }
  }
  /**
   * 时间轴闭包，用于存储渲染
   * @param {Array} data 台风数据
   * @param {String} id  台风编号
   */
  timeLineClosure(data, id) {
    let index = 0;
    const _this = this;
    return function() {
      index = data.findIndex((ele, i, arr) => {
        const dt = ele.dateObject.getTime();
        return dt === lastTime;
        //满足该条件的项的index
      });
      
      if (index !== -1) {     
        if (_this.featureLayers[id]) {
          _this.reRenderForecastData(data[index], id);
          const feaLys = _this.featureLayers[id];
          const poly = feaLys.getLayers()[0];
          const pos = [data[index].latitude, data[index].longitude];
          poly.addLatLng(pos);
          feaLys.addLayer(renderCircleMarker(pos, data[index]));
          _this.stormCircle[id].setData(pos, formatCircleData(data[index]));
        } else {
          const firstData = data.slice(0, 1);
          const feaLys = renderPolylineAndMarker(firstData);
          const labelIcon = L.divIcon({
            className: "my-div-icon",
            html: `<div class="lable--name">${data[0].name_cn}</div>`
          });
          _this.reRenderForecastData(data[index], id);
          _this.lysGrp.addLayer(feaLys).addTo(_this.map);
          const pos = [data[0].latitude, data[0].longitude];
          _this.lableMarker[id] = L.marker(pos, { icon: labelIcon });
          _this.stormCircle[id] = canvasOverlay(pos, formatCircleData(data[0]));
          _this.lysGrp.addLayer(_this.stormCircle[id]);
          _this.lysGrp.addLayer(_this.lableMarker[id]);
          _this.featureLayers[id] = feaLys;
          _this.map.panTo(pos);
        }
        return false;
      } else {
        // 绘制完毕，清除闭包内存
        if (lastTime >= data[0].end_time) {
          _this.deleteLayersForTimeLine(id);
          const idValue = id;
          index = null;
          data = null;
          id = null;
          return idValue; // 表示该闭包生命周期结束，用于清除队列
        }
        return false;
      }
    };
  }
  /**
   * 运行队列中的所有闭包，若返回false，则删除该成员
   */
  runTimeLineClosure() {
    const queue = this.timeLineQueue;
    for (let i = 0; i < queue.length; i++) {
      const ele = queue[i];
      const rst = ele();
      
      if (rst) {
        queue.splice(i, 1);
        if (queue.length < 1) {
          this.clearTimeBlank(rst);
        }
      }
    }
  }
  /**
   * 跳过计时器时间空白区域
   * @param {*} id
   * 
   */
  clearTimeBlank(id) {
    const { typhoonList } = this.state;
    const index = typhoonList.findIndex(
      (element, index, array) => id === element.id
    );
    if (index !== -1) {
      let currentIndexValue = index;
      let nextIndexValue = currentIndexValue - 1;
      while (nextIndexValue >= 0) {
        const currentEndTime = parseDateString(
          typhoonList[currentIndexValue].end_time
        ).getTime();
        const nextStartTime = parseDateString(
          typhoonList[nextIndexValue].begin_time
        ).getTime();
        if (nextStartTime >= currentEndTime) {
          lastTime = nextStartTime;
          break;        
        } else {
          nextIndexValue--;
        }
      }
    }
  }
  /**
   * 时间轴重置功能
   * @param {boolean} tips 是否显示提示，默认显示
   */
  rePlay(tips = true) {
    if (this.timelineIntervalID) {
      clearInterval(this.timelineIntervalID);
      this.timeLineQueue = [];
      const { typhoonList } = this.state;
      const typhoonYearData = JSON.parse(JSON.stringify(typhoonList)).reverse();
      const currentTime = parseDateString(
        typhoonYearData[0].begin_time
      ).getTime();
      lastTime = currentTime;
      window.timeline.moveTo(currentTime, { animation: false });
      window.timeline.setCurrentTime(currentTime);
      this.handleClearAll();
      this.setState({ timeLineStar: true, timeLineCurrentTime: "" });
    } else if (tips) {
      message.warning("暂未开始播放，无需重置！");
    }
  }
  /**
   * 时间轴播放核心业务代码
   */
   
  playTimeLine() {
    const currentTime = lastTime;
    window.timeline.moveTo(currentTime, { animation: false });
    window.timeline.setCurrentTime(currentTime);
    this.compareTyphoonWithTime(currentTime);
    lastTime = currentTime + 1 * 3600 * 1000; // 台风数据2小时一次
    this.runTimeLineClosure();
    const timeLineCurrentTime = dateFormat(currentTime, "yyyy年MM月dd日hh时");
    this.setState({ timeLineCurrentTime });
  }
  /* 
   * 时间轴面板 开始按钮 事件处理器
   * @param {Event} e 事件对象
   */

  handleTimeLineClick(e) {
    const { timeLineStar } = this.state;
    // 进入播放状态
    if (timeLineStar) {
      this.timelineIntervalID = setInterval(() => {
        this.playTimeLine();
      }, this.timeLineSpeed);
    } else {
      clearInterval(this.timelineIntervalID);
    }
    this.setState({ timeLineStar: !timeLineStar });
  }

  /**
   * 设置时间线数据
   * @param {Array} data 年台风数据
   */
  setTimeLineData(data) {
    const items = new vis.DataSet();
    for (let i = 0; i < data.length; i++) {
      let element = data[i];
      items.add({
        id: i,
        content: `${element.name_cn}`,
        start: parseDateString(element.begin_time),
        end: parseDateString(element.end_time)
      });
    }
    var options = {
      start: items._getItem(0).start
      // maxHeight: 100
    };
    const fisrtTime = items._getItem(0).start.getTime();
    lastTime = fisrtTime;
    window.timeline.setCurrentTime(fisrtTime);
    window.timeline.setOptions(options);
    window.timeline.setItems(items);
    // window.timeline.fit()
  }
  /*
   * 快进/快退事件处理器
   * @param {string} type 速度类型，值为backward（快退）或者forward（快进），默认forward
   */
  handleSpeedAjust(type) {
    if (this.timelineIntervalID && !this.state.timeLineStar) {
      let { timeLineSpeedLable } = this.state;
      if (type === "backward") {
        this.timeLineSpeed = this.timeLineSpeed * 2;
        timeLineSpeedLable--;
        if (timeLineSpeedLable < 0) {
          timeLineSpeedLable = 0;
          this.timeLineSpeed = 1000;
        }
      } else {
        timeLineSpeedLable++;
        this.timeLineSpeed = this.timeLineSpeed / 2;
      }
      clearInterval(this.timelineIntervalID);
      this.timelineIntervalID = setInterval(() => {
        this.playTimeLine();
      }, this.timeLineSpeed);
      this.setState({ timeLineSpeedLable });
    } else {
      message.warning("请先开始播放！");
    }
  }
  /**
   * 台风年限事件处理函数
   * @param {string} value 年
   */
  handleYearChange(value) {
    md_ajax.get(ctx + "/list", { params: { year: value } }).then(data => {
      const rst = data.map((ele, index) => {
        ele._source.key = ele._source.id;
        return ele._source;
      });
      this.handleClearAll();
      this.setState({ typhoonList: rst }, () => {
        // 时间轴业务 开始
        this.rePlay(false);
        const typhoonYearData = JSON.parse(JSON.stringify(rst)).reverse();
        this.setTimeLineData(typhoonYearData);
        // 时间轴业务 结束
      });
    });
  }
  /**
   * 清空功能事件处理函数
   */
  handleClearAll() {
    this.setState({
      typhoonPointList: [],
      currentTyphoonName: null,
      dashPolylines: null,
      dashCircles: null,
      selectedRowKeys: []
    });
    this.featureLayers = {};
    this.lysGrp.clearLayers();
  }
  /**
   * 动画绘制台风路径
   * @param {Map} map Leaflet Map对象
   * @param {*} data 台风数据
   * @param {*} id 台风编号
   */
  renderPolylineAndMarkerWithAction(map, data, id) {
    // console.log("开始渲染", id);
    let index = 0;
    this.forecastLayers[id] = {};
    let timeId = setInterval(() => {
      if (timeId && index < data.length) {
        if (this.featureLayers[id]) {
          this.reRenderForecastData(data[index], id);
          const feaLys = this.featureLayers[id];
          const poly = feaLys.getLayers()[0];
          const pos = [data[index].latitude, data[index].longitude];
          poly.addLatLng(pos);
          feaLys.addLayer(renderCircleMarker(pos, data[index]));
          this.stormCircle[id].setData(pos, formatCircleData(data[index]));
        } else {
          const firstData = data.slice(0, 1);
          const feaLys = renderPolylineAndMarker(firstData);
          const labelIcon = L.divIcon({
            className: "my-div-icon",
            html: `<div class="lable--name">${data[0].name_cn}</div>`
          });
          this.reRenderForecastData(data[index], id);
          this.lysGrp.addLayer(feaLys).addTo(map);
          this.lableMarker[id] = L.marker(
            [data[0].latitude, data[0].longitude],
            { icon: labelIcon }
          );
          this.stormCircle[id] = canvasOverlay(
            [data[0].latitude, data[0].longitude],
            formatCircleData(data[0])
          );
          this.lysGrp.addLayer(this.stormCircle[id]);
          this.lysGrp.addLayer(this.lableMarker[id]);
          this.featureLayers[id] = feaLys;
        }
        index++;
      } else {
        clearInterval(timeId);
        console.log("已清除计时器，ID：" + timeId);
        index = null;
        timeId = null;
      }
    }, 100);
    this.timeId[id] = timeId;
  }
  /**
   * 删除台风路径
   * @param {string} id 台风编号
   */
  deletePolylineAndMarkerById(id) {
    const feaLys = this.featureLayers[id];
    const lableMarker = this.lableMarker[id];
    const stormCircle = this.stormCircle[id];
    const forecastLys = this.forecastLayers[id].all;
    forecastLys && this.lysGrp.removeLayer(forecastLys);
    feaLys && this.lysGrp.removeLayer(feaLys);
    stormCircle && this.lysGrp.removeLayer(stormCircle);
    lableMarker && this.lysGrp.removeLayer(lableMarker);
  }
  /**
   * 时间线删除部分图层（只保留实线和标注）
   * @param {string} id 台风编号
   */
  deleteLayersForTimeLine(id) {
    const stormCircle = this.stormCircle[id];
    const forecastLys = this.forecastLayers[id].all;
    this.deletePoint(id);
    forecastLys && this.lysGrp.removeLayer(forecastLys);
    stormCircle && this.lysGrp.removeLayer(stormCircle);
  }
  /**
   * 删除点
   * @param {string} id 台风编号
   */
  deletePoint(id) {
    const feaLys = this.featureLayers[id];
    const layers = feaLys ? feaLys.getLayers() : [];
    for (let i = 1; i < layers.length; i++) {
      this.featureLayers[id].removeLayer(layers[i]);
    }
  }

  /**
   * 选择台风事件处理函数
   * @param {Object} record 选择行的数据
   * @param {boolean} selected 是否选中
   * @param {array} selectedRows 已选择的行
   */
  handleSelectTyphoon(record, selected, selectedRows) {
    if (selected) {
      const { id, name_cn } = record;
      const { selectedRowKeys } = this.state;
      selectedRowKeys.push(record.key);
      if (this.hasSearchTyphoonData[id]) {
        const rst = this.hasSearchTyphoonData[id];
        this.renderPolylineAndMarkerWithAction(this.map, rst, id); //动画绘制台风路径
        this.setState({
          typhoonPointList: rst,
          currentTyphoonName: name_cn,
          selectedRowKeys
        });
      } else {
        //请求数据
        md_ajax.get(ctx + "/path", { params: { id } }).then(data => {
          const rst = data.reverse().map((ele, index) => {
            ele._source.key = index;
            const dateStr = ele._source.datetime;
            const year = String.prototype.substr.call(dateStr, 0, 4);
            const month = String.prototype.substr.call(dateStr, 4, 2);
            const day = String.prototype.substr.call(dateStr, 6, 2);
            const hour = String.prototype.substr.call(dateStr, 8, 2);
            const minute = String.prototype.substr.call(dateStr, 10, 2);
            const secend = String.prototype.substr.call(dateStr, 12, 2);
            const date = new Date(year, month - 1, day, hour, minute, secend);
            ele._source.datetimeLong = `${year}年${month}月${day}日${hour}时${minute}分${secend}秒`;
            ele._source.datetime = `${month}月${day}日${hour}时`;
            ele._source.dateObject = date;
            return ele._source;
          });
          this.currentId = id;
          this.hasSearchTyphoonData[id] = rst;
          this.setState({
            typhoonPointList: rst,
            currentTyphoonName: name_cn,
            selectedRowKeys
          });
          this.renderPolylineAndMarkerWithAction(this.map, rst, id);
        });
      }
    } else {
      const { selectedRowKeys } = this.state;
      delete this.hasSearchTyphoonData[record.id];
      const filteredKeys = selectedRowKeys.filter(ele => ele !== record.key);
      if (record.id === this.currentId) {
      }
      clearInterval(this.timeId[record.id]);
      this.deletePolylineAndMarkerById(record.id);
      this.featureLayers[record.id] = null;
      this.setState({
        typhoonPointList: [],
        selectedRowKeys: filteredKeys,
        currentTyphoonName: null
      });
    }
  }

  /**
   * 台风选择事件处理函数
   * @param {Object} record 选择行的数据
   * @param {Number} index 选择的索引
   * @param {Event} event 事件对象
   */
  handleTyphoonClick(record, index, event) {
    const { id, name_cn } = record;
    this.currentId = id;
    if (this.hasSearchTyphoonData[id]) {
      const rst = this.hasSearchTyphoonData[id];
      this.setState({ typhoonPointList: rst, currentTyphoonName: name_cn });
    } else {
      message.warning("请先勾选此选项！");
    }
  }
  /**
   * 台风时间节点选择事件处理函数
   * @param {Object} record 选择行的数据
   * @param {Number} index 选择的索引
   * @param {Event} event 事件对象
   */
  handleTyphoonPointClick(record, index, event) {
    const { id, key } = record;
    const data = this.hasSearchTyphoonData[id][key];
    const featureLayer = this.featureLayers[id].getLayers();
    const stormCircle = this.stormCircle[id];
    stormCircle.setData(
      [data.latitude, data.longitude],
      formatCircleData(data)
    );
    const markers = featureLayer.slice(1);
    const curentMarker = markers[key];
    curentMarker.openPopup();
    // 渲染预报路径数据
    this.reRenderForecastData(data, id);
  }
  /**
   * 重新渲染台风预报数据
   * @param {*} data 预报数据
   * @param {*} id 台风编号
   */
  reRenderForecastData(data, id) {
    if (this.lysGrp.hasLayer(this.forecastLayers[id].all)) {
      this.lysGrp.removeLayer(this.forecastLayers[id].all);
    }
    const forecastFeaLys = this.renderForecastData(data);
    this.forecastLayers[id].all = forecastFeaLys;
    forecastFeaLys && this.lysGrp.addLayer(forecastFeaLys);
  }
  /**
   * 渲染预报数据
   * @param {*} data 预报数据
   */
  renderForecastData(data) {
    if (data.forecast) {
      const { id } = data;
      const forecastData = data.forecast;
      this.forecastLayers[id] = {};
      const feaLys = forecastData.map((ele, index) => {
        const { latitude, longitude } = data;
        ele.points.unshift({ latitude, longitude });
        this.forecastLayers[id][ele.sets] = renderForecastPolylineAndMarker(
          ele.points,
          ele.sets,
          data.name_cn
        );
        return this.forecastLayers[id][ele.sets];
      });
      return L.featureGroup(feaLys);
    }
  }

  render() {
    const {
      rectRight,
      rectBottom,
      typhoonList,
      typhoonPointList,
      currentTyphoonName,
      selectedRowKeys,
      timeLineStar,
      timeLineSpeedLable,
      timeLineCurrentTime
    } = this.state;
    const columns = [
      {
        title: "台风编号",
        dataIndex: "id"
      },
      {
        title: "台风名称",
        dataIndex: "name_cn"
      }
    ];
    const typhoonInfoCol = [
      {
        title: "时间",
        dataIndex: "datetime"
      },
      {
        title: "气压(hpa)",
        dataIndex: "pressure"
      },
      {
        title: "风速(m/s)",
        dataIndex: "move_speed"
      }
    ];

    return (
      <div
        style={{
          height: "100vh",
          boxSizing: "border-box",
          overflow: "hidden",
          paddingTop: 56
        }}
        id="md-window"
      >
        <div id="map" className="md-map--container" />
        <div className="timeline-container">
          <div className="timeline-controll">
            <span className="lable">操作：</span>
            <Icon
              className="icon"
              onClick={this.handleTimeLineClick}
              type={timeLineStar ? "play-circle" : "pause-circle"}
            />
            <Icon
              className="icon"
              type="fast-backward"
              onClick={() => this.handleSpeedAjust("backward")}
            />
            <Icon
              className="icon"
              type="fast-forward"
              onClick={() => this.handleSpeedAjust("forward")}
            />
            <Icon
              className="icon"
              type="retweet"
              onClick={() => {
                this.rePlay();
              }}
            />
            <span className="lable">当前速度:</span>
            <span>{timeLineSpeedLable}x</span>
            <span className="lable" style={{ marginLeft: 15 }}>
              当前时间:
            </span>
            <span>{timeLineCurrentTime}</span>
            <span className="notice">请使用鼠标滚轮进行时间轴视图放大或缩小,鼠标左键可进行平移。</span>
          </div>
          <div className="timeline-content" id="timeline" />
        </div>

        {/* 台风管理面板头 */}
        <Window>
          <Window.Item
            bounds="#aa"
            title="台风管理"
            className="md-drag--container"
            defaultPosition={{ x: 60, y: 100 }}
            mini
            expand
            width={250}
          >
            {/* 台风管理 面板 台风选项 */}
            <div>
              {/* 年份及高级查询 */}
              <div>
                <Select
                  onChange={this.handleYearChange}
                  className="tfmanager-sel"
                  defaultValue={this.state.yearsList[0].value}
                >
                  {this.state.yearsList.map((el, key) => {
                    return (
                      <Select.Option key={key} value={el.value}>
                        {el.label}
                      </Select.Option>
                    );
                  })}
                </Select>年
                <Button type="primary" icon="search" style={{ marginLeft: 20 }}>
                  高级查询
                </Button>
              </div>
              {/* 台风详情  列表详情  */}
              <div style={{ marginTop: 5 }}>
                <Table
                  bordered
                  columns={columns}
                  dataSource={typhoonList}
                  size="small"
                  rowSelection={{
                    onSelect: this.handleSelectTyphoon,
                    selectedRowKeys,
                    onSelectAll: this.handleSelectAll
                  }}
                  pagination={{ defaultPageSize: 5 }}
                  onRowClick={this.handleTyphoonClick}
                />
              </div>

              {/* 清空 */}
              <div style={{ marginTop: 5 }}>
                <Button
                  type="primary"
                  size="small"
                  style={{ marginLeft: 20, marginRight: 20 }}
                  onClick={() => {
                    this.handleClearAll();
                  }}
                >
                  清空
                </Button>
              </div>

              {/* 时间，气压，风速 */}
              <div style={{ marginTop: 5 }}>
                {currentTyphoonName ? (
                  <Tag color="blue">{currentTyphoonName}</Tag>
                ) : null}
                <Table
                  bordered
                  columns={typhoonInfoCol}
                  dataSource={typhoonPointList}
                  size="small"
                  pagination={{ defaultPageSize: 5 }}
                  onRowClick={this.handleTyphoonPointClick}
                />
              </div>
            </div>
          </Window.Item>

          {/* 图例展示部分 */}
          <Window.Item
            bounds="#aa"
            title="图例"
            className="md-drag--container"
            defaultPosition={{ x: rectRight - 220, y: rectBottom - 400 }}
            mini
            disable
            width={220}
            height={400}
          >
            <div className="wind-explain">
              <div>
                <span>
                  <span className="wind-explain-text">热带低压</span>
                  <div
                    className="wind-explain-color"
                    style={{ backgroundColor: "rgb(39, 218, 34)" }}
                  />小于17.2米/秒
                </span>
              </div>
              <div>
                <span>
                  <span className="wind-explain-text">热带风暴</span>{" "}
                  <div
                    className="wind-explain-color"
                    style={{ backgroundColor: "rgb(19, 26, 175)" }}
                  />17.2 - 24.4米/秒
                </span>
              </div>
              <div>
                <span>
                  <span className="wind-explain-text">强热带风暴</span>{" "}
                  <div
                    className="wind-explain-color"
                    style={{ backgroundColor: "rgb(247, 239, 61)" }}
                  />24.5 - 32.6米/秒
                </span>
              </div>
              <div>
                <span>
                  <span className="wind-explain-text">台风</span>{" "}
                  <div
                    className="wind-explain-color"
                    style={{ backgroundColor: "rgb(228, 141, 56)" }}
                  />32.7 - 41.4米/秒
                </span>
              </div>
              <div>
                <span>
                  <span className="wind-explain-text">强台风</span>{" "}
                  <div
                    className="wind-explain-color"
                    style={{ backgroundColor: "rgb(239, 116, 219)" }}
                  />41.5 - 50.9米/秒
                </span>
              </div>
              <div>
                <span>
                  <span className="wind-explain-text">超强台风</span>{" "}
                  <div
                    className="wind-explain-color"
                    style={{ backgroundColor: "rgb(234, 41, 41)" }}
                  />大于51.0米/秒
                </span>
              </div>
            </div>
            <div className="country-predicte">
              <div className="ct-pre-title">主观预报</div>
              <div className="ct-pre-content">
                <Checkbox defaultChecked>
                  中国<span
                    className="ct-pre-cont-dash"
                    style={{ borderTopColor: "#ef0a0a" }}
                  />
                </Checkbox>
                <Checkbox defaultChecked>
                  美国<span
                    className="ct-pre-cont-dash"
                    style={{ borderTopColor: "rgb(219, 21, 224)" }}
                  />
                </Checkbox>
                <Checkbox defaultChecked>
                  日本<span
                    className="ct-pre-cont-dash"
                    style={{ borderTopColor: "rgb(91, 217, 228)" }}
                  />
                </Checkbox>
                <Checkbox defaultChecked>
                  香港<span
                    className="ct-pre-cont-dash"
                    style={{ borderTopColor: "rgb(239, 229, 9)" }}
                  />
                </Checkbox>
                <Checkbox defaultChecked>
                  台湾<span
                    className="ct-pre-cont-dash"
                    style={{ borderTopColor: "rgb(128, 85, 13)" }}
                  />
                </Checkbox>
              </div>
            </div>
            <hr className="partirion-line" />
            <div className="add-content">
              <Checkbox>台风标注</Checkbox>
              <Checkbox defaultChecked>选中动画</Checkbox>
              <Checkbox>风圈半径</Checkbox>
            </div>
          </Window.Item>
        </Window>
      </div>
    );
  }
}
