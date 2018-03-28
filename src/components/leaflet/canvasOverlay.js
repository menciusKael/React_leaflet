L.CanvasOverlay = L.Layer.extend({
  initialize: function (pos, data, options) {
    L.setOptions(this, options)
    L.stamp(this)
    this.pos = pos
    this.data = data
    this._layers = this._layers || {}
  },

  onAdd: function () {
    var container = this._container = document.createElement('canvas')
    this._ctx = container.getContext('2d')
    if (this._zoomAnimated) {
      L.DomUtil.addClass(this._container, 'leaflet-stormCircle-layer leaflet-zoom-animated')
    }

    this.getPane().appendChild(this._container)
    this._update()
  },
  setLatLng: function (pos) {
    this.pos = pos
    this._update()
  },
  setData: function (pos, data) {
    this.pos = pos
    this.data = data
    this._update()
  },
  onRemove: function () {
    L.DomUtil.remove(this._container)
    this.off('update', this._updatePaths, this)
  },

  getEvents: function () {
    var events = {
      viewreset: this._reset,
      moveend: this._update
    }
    if (this._zoomAnimated) {
      events.zoomanim = this._onAnimZoom
    }
    return events
  },

  _onAnimZoom: function (ev) {
    this._updateTransform(ev.center, ev.zoom)
  },

  _updateTransform: function (center, zoom) {
    var scale = this._map.getZoomScale(zoom, this._zoom),
      position = L.DomUtil.getPosition(this._container),
      viewHalf = this._map.getSize().multiplyBy(0.5),
      currentCenterPoint = this._map.project(this._center, zoom),
      destCenterPoint = this._map.project(center, zoom),
      centerOffset = destCenterPoint.subtract(currentCenterPoint),

      topLeftOffset = viewHalf.multiplyBy(-scale).add(position).add(viewHalf).subtract(centerOffset)

    if (L.Browser.any3d) {
      L.DomUtil.setTransform(this._container, topLeftOffset, scale)
    } else {
      L.DomUtil.setPosition(this._container, topLeftOffset)
    }
  },

  _reset: function () {
    this._update()
    this._updateTransform(this._center, this._zoom)
  },

  _update: function () {
    var size = this._map.getSize()
    this._center = this._map.getCenter()
    this._zoom = this._map.getZoom()

    var container = this._container,
      m = L.Browser.retina ? 2 : 1

    var topLeft = this._map.containerPointToLayerPoint([0, 0])
    L.DomUtil.setPosition(container, topLeft)

    container.width = m * size.x
    container.height = m * size.y
    container.style.width = size.x + 'px'
    container.style.height = size.y + 'px'

    if (L.Browser.retina) {
      this._ctx.scale(2, 2)
    }
    this.redraw()
  },
  redraw: function () {
    this.clear()
    this._draw()
  },
  clear: function () {
    this._ctx.clearRect(0, 0, this._container.width, this._container.height)
  },
  getCircleRadiusByCenter: function (center, m) {
    const bounds = L.latLng(center).toBounds(2 * m * 1000) // km to m
    const eastLng = bounds.getEast()
    const eastLatLng = L.latLng(center[0], eastLng)
    const radius = this._map.latLngToContainerPoint(eastLatLng).x - this._map.latLngToContainerPoint(center).x
    return radius
  },

  drawTyphoonCirle: function (data, color) {
    var typhoonLocation = this._map.latLngToContainerPoint(this.pos)
    // var typhoonRadius = this._map.latLngToContainerPoint([31, 104])
    this._ctx.beginPath()
    if (data.length > 1) {
      for (var i = 1; i < data.length; i++) {
        var element = data[i]
        const radius = this.getCircleRadiusByCenter(this.pos, element)
        var index = i - 1
        this._ctx.arc(typhoonLocation.x, typhoonLocation.y, radius, 0.5 * index * Math.PI, (0.5 * index + 0.5) * Math.PI, false)
      }
    }
    const radius = this.getCircleRadiusByCenter(this.pos, data[0])
    this._ctx.arc(typhoonLocation.x, typhoonLocation.y, radius, 1.5 * Math.PI, 2 * Math.PI, false)
    this._ctx.fillStyle = color
    this._ctx.lineWidth = 2
    this._ctx.strokeStyle = '#00C853'
    this._ctx.closePath()
    this._ctx.fill()
    this._ctx.stroke()
  },
  _draw: function () {
    for (let j = 0; j < this.data.length; j++) {
      let element = this.data[j]
      this.drawTyphoonCirle(element, `rgba(0, 230, 118,0.5)`)
    }
  }
})

const canvasOverlay = L.canvasOverlay = function (pos, data, options) {
  return new L.CanvasOverlay(pos, data, options)
}
export default canvasOverlay
