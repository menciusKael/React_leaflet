import React from 'react'
import ReactDOM from 'react-dom'
import { Map, Marker, Popup, TileLayer, Polyline, Circle, CircleMarker } from 'react-leaflet'
import md_ajax from 'md_midware/md-service/md-ajax'
import Window from 'md_components/panel'
import {NowCircleMarker, ForecastCircleMarker} from 'md_components/circle_marker'
import 'element-theme-default'
import '../../styles/color.css'
import './index.css'
import { outerHeight, outerWidth, getOffsetLeft, getOffsetTop } from '../../../utils/dom/domFns'
<<<<<<< HEAD
import { Select, Button, Table, Checkbox } from 'antd'

const position = [51.505, -0.09]
=======
import { Select, Button, Table, Checkbox, Tag, Popover} from 'antd'
>>>>>>> f75f5ec4eab462f14f41b59ed2d5ae297940d8c1

const position = [15.3, 134.6]
const DASH_POLYLINE_COLOR = {
  VHHH: '#F44336', // 香港
  RJTD: '#673AB7',
  BABJ: '#03A9F4',
  CWB: '#4CAF50',
  PGTW: '#FFEB3B'
}
export default class Home extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      rectRight: 0,
      rectBottom: 0,
      typhoonList: [],
      typhoonPointList: [],
      currentTyphoonName: null,
      dashPolylines: null,
      dashCircles: null,
      truthRoads: {},
      selectedRowKeys: [],
      yearsList: [
        {value: '2017', label: '2017'},
        {value: '2016', label: '2016'},
        {value: '2015', label: '2015'},
        {value: '2014', label: '2014'}
      ],
      checkList: ['selectA']
    }
    this.handleYearChange = this.handleYearChange.bind(this)
    this.handleSelectTyphoon = this.handleSelectTyphoon.bind(this)
    this.handleTyphoonPointClick = this.handleTyphoonPointClick.bind(this)
    this.handleTyphoonClick = this.handleTyphoonClick.bind(this)
    this.handleSelectAll = this.handleSelectAll.bind(this)

    this.hasSearchTyphoonData = {}
    this.currentId = null
  }
  componentDidMount () {
    const ownerNode = ReactDOM.findDOMNode(this)
    const nodeHeight = outerHeight(ownerNode)
    const nodeWidth = outerWidth(ownerNode)
    const nodeOffsetLeft = getOffsetLeft(ownerNode)
    const nodeOffsetTop = getOffsetTop(ownerNode)
    this.setState({rectRight: nodeOffsetLeft + nodeWidth, rectBottom: nodeOffsetTop + nodeHeight})
    this.handleYearChange(this.state.yearsList[0].value)
  }
  postHttpRequest (dt, url) {
    let fd = new URLSearchParams()
    fd.append('para', dt)
    return md_ajax.post(url, fd, {
      'headers': {
        'content-type': 'application/x-www-form-urlencoded'
      },
      withCredentials: true
    })
  }

  handleSelectAll (selected, selectedRows, changeRows) {
    const selectedRowKeys = selectedRows.map((ele, index) => index)
    this.setState({selectedRowKeys})
  }
  handleYearChange (value) {
    this.postHttpRequest(`{"year":${value}}`, 'http://127.0.0.1/SPTDAServer/services/sptda/getTyphoonListByYear')
    .then((data) => {
      const rst = data.map((ele, key) => {
        return {id: ele.bianhao, name: ele.zhongwenbianhao, key}
      })
      this.setState({typhoonList: rst})
      this.handleClearAll()
    })
  }
  handleClearAll () {
    this.setState({typhoonPointList: [],
      currentTyphoonName: null,
      dashPolylines: null,
      dashCircles: null,
      selectedRowKeys: [],
      truthRoads: {}})
  }
  handleSelectTyphoon (record, selected, selectedRows) {
    if (selected) {
      const {id, name} = record
      const {selectedRowKeys} = this.state
      selectedRowKeys.push(record.key)
      if (this.hasSearchTyphoonData[id]) {
        const {truthRoad, typhoonPointList, currentTyphoonName, originalData} = this.hasSearchTyphoonData[id]
        const {truthRoads} = this.state
        truthRoads[id] = truthRoad
        this.setState({typhoonPointList, currentTyphoonName, truthRoads, selectedRowKeys})
      } else {
        this.postHttpRequest(`{"bianhao":${id}}`, 'http://127.0.0.1/SPTDAServer/services/sptda/getTyphoonInfoByCode')
        .then((data) => {
          const truthRoad = []
          const rst = data.typhoonPointList.map((ele, key) => {
            truthRoad.push([parseFloat(ele.xianzaiweidu), parseFloat(ele.xianzaijindu)])
            return {date: ele.yubaoshijian, pressure: ele.xianzaiqiya, speed: ele.xianzaifengli, key}
          })
          const {truthRoads} = this.state
          truthRoads[id] = truthRoad
          this.currentId = id
          this.hasSearchTyphoonData[id] = {
            truthRoad,
            typhoonPointList: rst,
            currentTyphoonName: name,
            originalData: data
          }

          this.setState({typhoonPointList: rst, currentTyphoonName: name, truthRoads, selectedRowKeys})
        })
      }
    } else {
      const {truthRoads, selectedRowKeys} = this.state
      let {dashPolylines, dashCircles} = this.state
      delete truthRoads[record.id]
      delete this.hasSearchTyphoonData[record.id]
      const filteredKeys = selectedRowKeys.filter((ele) => ele !== record.key)

      if (record.id === this.currentId) {
        dashPolylines = []
        dashCircles = []
      }
      this.setState({truthRoads, typhoonPointList: [], dashPolylines, dashCircles, selectedRowKeys: filteredKeys})
    }
  }
  handleTyphoonClick (record, index, event) {
    const {id} = record
    this.currentId = id
    if (this.hasSearchTyphoonData[id]) {
      const {typhoonPointList, currentTyphoonName} = this.hasSearchTyphoonData[id]
      this.setState({typhoonPointList, currentTyphoonName})
    }
  }
  handleTyphoonPointClick (record, index, event) {
    const id = this.currentId
    const {originalData} = this.hasSearchTyphoonData[id]
    const dt = originalData.typhoonPointList[index].typhoonList
    const forecastData = {}
    const dashCircles = []
    dt.map((ele1, index1) => {
      const publisher = ele1.typhoonPointList[0].fabuzhe
      const pos = ele1.typhoonPointList.map((ele2, index2) => {
        let center
        if (ele2.xianzaiweidu === '9999') {
          center = [parseFloat(ele2.yubaoweidu), parseFloat(ele2.yubaojindu)]
          dashCircles.push(<ForecastCircleMarker info={ele2} fill fillOpacity={1} key={`${index1}-${index2}`} center={center} radius={5} />)
        } else {
          center = [parseFloat(ele2.xianzaiweidu), parseFloat(ele2.xianzaijindu)]
          dashCircles.push(<NowCircleMarker info={ele2} fill fillOpacity={1} key={`${index1}-${index2}`} center={center} radius={5} />)
        }
        return center
      })
      forecastData[publisher] = {
        positions: pos,
        key: index1
      }
    })
    this.renderForecastData(forecastData, dashCircles)
  }
  renderForecastData (forecastData, dashCircles) {
    const dashPolylines = []
    for (var key in forecastData) {
      if (forecastData.hasOwnProperty(key)) {
        var element = forecastData[key]
        dashPolylines.push(<Polyline color={DASH_POLYLINE_COLOR[key]} positions={element.positions} key={`dash-${element.key}`} dashArray={[5, 5]} />)
      }
    }
    this.setState({dashPolylines, dashCircles})
    this.forceUpdate()
  }
  renderTruthRoads () {
    const {truthRoads} = this.state
    const domRoads = []
    const truthCircles = []
    for (var key in truthRoads) {
      const {originalData} = this.hasSearchTyphoonData[key]
      if (truthRoads.hasOwnProperty(key)) {
        domRoads.push(<Polyline positions={truthRoads[key]} key={key} />)
        truthRoads[key].map((ele, index) => {
          const dt = originalData.typhoonPointList[index]
          truthCircles.push(<NowCircleMarker info={dt} fill fillOpacity={1} key={`${key}-${index}`} center={ele} radius={5} />)
        })
      }
    }
    return {domRoads, truthCircles}
  }
  render () {
    const {rectRight, rectBottom, typhoonList, typhoonPointList, currentTyphoonName, dashPolylines, dashCircles, selectedRowKeys} = this.state
    const {domRoads, truthCircles} = this.renderTruthRoads()
    const columns = [{
      title: '台风编号',
      dataIndex: 'id'
    },
    {
      title: '台风名称',
      dataIndex: 'name'
    }
    ]
    const typhoonInfoCol = [{
      title: '时间',
      dataIndex: 'date'
    },
    {
      title: '气压(hpa)',
      dataIndex: 'pressure'
    },
    {
      title: '风速(m/s)',
      dataIndex: 'speed'
    }
    ]
    return (
      <div style={{height: '100vh', boxSizing: 'border-box', overflow: 'hidden', paddingTop: 56}} id='md-window'>
        <Map center={position} zoom={5} className='md-map--container'>
          <TileLayer
            url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    />
          {
            domRoads
            }
          {truthCircles}
          {dashPolylines || null}
          {dashCircles || null}
        </Map>
        <Window>
          <Window.Item
            bounds='#aa'
            title='台风管理'
            className='md-drag--container'
            defaultPosition={{x: 60, y: 100}}
            mini
            expand
            width={250}
          >
            <div>
              <div>
                <Select
                  onChange={this.handleYearChange}
                  className='tfmanager-sel' defaultValue={this.state.yearsList[0].value}>
                  {this.state.yearsList.map((el, key) => {
                    return <Select.Option key={key} value={el.value}>{el.label}</Select.Option>
                  })}
                </Select>年
                <Button type='primary' icon='search' style={{marginLeft: 20}}>高级查询</Button>
              </div>
              <div style={{marginTop: 5}}>
                <Table bordered columns={columns} dataSource={typhoonList} size='small'
                  rowSelection={{
                    onSelect: this.handleSelectTyphoon,
                    selectedRowKeys,
                    onSelectAll: this.handleSelectAll
                  }}
                  pagination={{defaultPageSize: 5}}
                  onRowClick={this.handleTyphoonClick}
                  />
              </div>
              <div style={{marginTop: 5}}>
                <Button type='primary' size='small' style={{marginLeft: 20, marginRight: 20}} onClick={() => { this.handleClearAll() }}>清空</Button>
                <Checkbox>刷新</Checkbox>
                <Checkbox>报文</Checkbox>
              </div>
              <div>
                {currentTyphoonName ? <Tag color='blue'>{currentTyphoonName}</Tag> : null}
                <Table bordered columns={typhoonInfoCol} dataSource={typhoonPointList} size='small' pagination={{defaultPageSize: 5}}
                  onRowClick={this.handleTyphoonPointClick}
                 />
              </div>
            </div>

          </Window.Item>
          <Window.Item
            bounds='#aa'
            title='图例'
            className='md-drag--container'
            defaultPosition={{x: rectRight - 220, y: rectBottom - 400}}
            mini
            disable
            width={220}
            height={400}
          >
            <div className='wind-explain'>
              <div><span><span className='wind-explain-text'>热带低压</span><div className='wind-explain-color' style={{backgroundColor: 'rgb(39, 218, 34)'}} />小于17.2米/秒</span></div>
              <div><span><span className='wind-explain-text'>热带风暴</span> <div className='wind-explain-color' style={{backgroundColor: 'rgb(19, 26, 175)'}} />17.2 - 24.4米/秒</span></div>
              <div><span><span className='wind-explain-text'>强热带风暴</span> <div className='wind-explain-color' style={{backgroundColor: 'rgb(247, 239, 61)'}} />24.5 - 32.6米/秒</span></div>
              <div><span><span className='wind-explain-text'>台风</span> <div className='wind-explain-color' style={{backgroundColor: 'rgb(228, 141, 56)'}} />32.7 - 41.4米/秒</span></div>
              <div><span><span className='wind-explain-text'>强台风</span> <div className='wind-explain-color' style={{backgroundColor: 'rgb(239, 116, 219)'}} />41.5 - 50.9米/秒</span></div>
              <div><span><span className='wind-explain-text'>超强台风</span> <div className='wind-explain-color' style={{backgroundColor: 'rgb(234, 41, 41)'}} />大于51.0米/秒</span></div>
            </div>
            <div className='country-predicte'>
              <div className='ct-pre-title'>主观预报</div>
              <div className='ct-pre-content'>
                <Checkbox defaultChecked>中国<span className='ct-pre-cont-dash' style={{borderTopColor: '#ef0a0a'}} /></Checkbox>
                <Checkbox defaultChecked>美国<span className='ct-pre-cont-dash' style={{borderTopColor: 'rgb(219, 21, 224)'}} /></Checkbox>
                <Checkbox defaultChecked>日本<span className='ct-pre-cont-dash' style={{borderTopColor: 'rgb(91, 217, 228)'}} /></Checkbox>
                <Checkbox defaultChecked>香港<span className='ct-pre-cont-dash' style={{borderTopColor: 'rgb(239, 229, 9)'}} /></Checkbox>
                <Checkbox defaultChecked>台湾<span className='ct-pre-cont-dash' style={{borderTopColor: 'rgb(128, 85, 13)'}} /></Checkbox>
              </div>
            </div>
            <hr className='partirion-line' />
            <div className='add-content' >
              <Checkbox>台风标注</Checkbox>
              <Checkbox defaultChecked>选中动画</Checkbox>
              <Checkbox>风圈半径</Checkbox>
            </div>
          </Window.Item>
          <Window.Item
            bounds='#aa'
            title='距离检测'
            className='md-drag--container'
            defaultPosition={{x: rectRight - 430, y: rectBottom - 300}}
            mini
            disable
            width={200}
          />
          <Window.Item
            bounds='#aa'
            title='移向移速监测'
            className='md-drag--container'
            defaultPosition={{x: rectRight - 640, y: rectBottom - 300}}
            mini
            disable
            width={200}
          />
        </Window>
      </div>

    )
  }
}
