import L from 'leaflet'
import {renderPolyline} from './polyline.js'
import {renderCircleMarker} from './marker.js'
import canvasOverlay from './canvasOverlay.js'
import wmts from './wmts.js'
import esri_leaflet from './esri-leaflet.js'

const renderPolylineAndMarker = (data) => {
  const positions = []
  let polyline
  const markers = data.map((ele, index) => {
    const lnglat = [ ele.latitude, ele.longitude ]
    positions.push(lnglat)
    return renderCircleMarker(lnglat, ele, 'truth')
  })
  polyline = renderPolyline(positions, 'truth')
  return L.featureGroup([polyline, ...markers])
}

/**
 * 渲染预报路径
 * @param {*} data 预报数据
 * @param {*} sets 预报机构
 * @param {*} nameCn 中文名字
 */
const renderForecastPolylineAndMarker = (data, sets, nameCn) => {
  const positions = []
  let polyline
  const markers = data.map((ele, index) => {
    const lnglat = [ ele.latitude, ele.longitude ]
    positions.push(lnglat)
    ele.name_cn = nameCn
    if (!ele.forecast) return renderCircleMarker(lnglat, ele, 'forecast')
  })
  polyline = renderPolyline(positions, 'forecast', sets)
  return L.featureGroup([polyline, ...markers])
}
export {renderPolylineAndMarker, renderCircleMarker, renderPolyline, canvasOverlay, wmts, renderForecastPolylineAndMarker}
