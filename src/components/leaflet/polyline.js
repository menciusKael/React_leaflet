import L from 'leaflet'
// 中国 广东 美国 日本 中国台湾 中国香港 韩国
const COLOR = {
  '中国': '#ef0a0a',
  '广东': '#a2d838',
  '日本': '#5bd9e4',
  '中国台湾': '#80550d',
  '中国香港': '#efe509',
  '美国': '#db15e0',
  '韩国': '#3871d8',
  'default': '#dea550'
}
const renderPolyline = (positions, type, sets = 'default') => {
  const color = COLOR[sets]
  const option = {color, weight: 2 }
  type === 'truth' ? null : option.dashArray = [5, 5]
  const polyline = L.polyline(positions, option)
  return polyline
}

export {renderPolyline}
