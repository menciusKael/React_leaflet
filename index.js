import React from 'react'
import ReactDOM from 'react-dom'
import Icon from 'md_components/icon'
import Draggable from 'react-draggable'
import classNames from 'classnames'
import { int } from '../../../utils/shims'
import { innerWidth, innerHeight } from '../../../utils/dom/domFns'
import './style/index.scss'

let _zIndex = 1
class Window extends React.Component {
  constructor (props) {
    super(props)
    this._handleOnDrag = this._handleOnDrag.bind(this)
    this._handleExpandClick = this._handleExpandClick.bind(this)
    this._handleMiniClick = this._handleMiniClick.bind(this)
    this._handleClose = this._handleClose.bind(this)
    this.child = []
    this.orders = []
    this.state = {
      miniPanelChild: [],
      positions: [],
      delItemIndex: []
    }
  }
  setMiniPosition (_key, hasMini, opt) {
    const width = 200
    const height = 30
    const {parentNodeStyle, parentNode} = opt
    const {positions} = this.state
    let x, y
    if (hasMini) {
      // 还原
      positions[_key].x = opt.lastPosition.x
      positions[_key].y = opt.lastPosition.y
    }
      // 最小化
    x = int(parentNodeStyle.paddingLeft) + int(parentNodeStyle.marginLeft)
    y = int(parentNode.clientHeight) - int(parentNodeStyle.marginBottom) - int(parentNodeStyle.paddingBottom) - height

    this.orders.map((v, k) => {
      positions[v] = Object.assign({...positions[v]}, {x: x + width * k, y: y})
    })
    this.setState({positions: positions})
  }
  _handleOnDrag (index, b, call) {
    const {positions} = this.state
    positions[index] = Object.assign({}, b)
    this.setState({positions: positions})
  }
  _handleExpandClick (index, opt) {
    const {positions} = this.state
    positions[index] = Object.assign({}, opt.defaultPosition)
    this.setState({positions: positions})
  }
  _handleClose (key) {
    const {delItemIndex} = this.state
    delItemIndex.push(key)
    this.setState({ delItemIndex })
  }
  _handleMiniClick (_key, hasMini, opt) {
    if (hasMini) {
      // 还原
      const delKey = this.orders.findIndex((ele) => ele === _key)
      this.orders.splice(delKey, 1)
    } else {
      // 缩小
      this.orders.push(_key)
    }
    this.setMiniPosition(_key, hasMini, opt)
    // this.setState
  }
  findDelItem (index) {
    const {delItemIndex} = this.state
    for (let i = 0; i < delItemIndex.length; i++) {
      if (delItemIndex[i] === index) {
        return true
      }
    }
    return false
  }
  render () {
    const {children} = this.props
    const {positions} = this.state
    return (
      <div style={{position: 'absolute', zIndex: 1000, top: 0}}>
        {
         React.Children.map(children, (child, index) => {
           if (!this.findDelItem(index)) {
             return React.cloneElement(child, {
               ref: (self) => { this.child[index] = self },
               _key: index,
               parent: this,
               _position: positions[index],
               _handleOnDrag: this._handleOnDrag,
               _handleExpandClick: this._handleExpandClick,
               _handleMiniClick: this._handleMiniClick,
               _handleClose: this._handleClose
             })
           }
         })
        }
      </div>
    )
  }
}

class Item extends React.Component {
  constructor (props) {
    super(props)
    this.handleCloseClick = this.handleCloseClick.bind(this)
    this.handleExpandClick = this.handleExpandClick.bind(this)
    this.handleMiniClick = this.handleMiniClick.bind(this)
    this.handleOnDrag = this.handleOnDrag.bind(this)

    const {width, height} = this.props

    this.state = {
      width,
      height,
      hasExpand: false,
      hasMini: false,
      defaultPosition: this.props.defaultPosition || {x: 0, y: 0},
      position: this.props.defaultPosition || {x: 0, y: 0},
      zIndex: _zIndex
    }
    this.lastWidth = width
    this.lastHeight = height
    this.lastPosition = Object.assign({}, this.state.position)
  }
  getBothNodeInfo () {
    const ownerNode = ReactDOM.findDOMNode(this)
    const {ownerDocument} = ownerNode
    const ownerWindow = ownerDocument.defaultView
    const ownerNodeStyle = ownerWindow.getComputedStyle(ownerNode)
    const parentNode = ownerNode.parentNode.parentNode
    const parentNodeStyle = ownerWindow.getComputedStyle(parentNode)
    this.bothBodeInfo = {ownerNode, parentNode, ownerNodeStyle, parentNodeStyle}
    return this.bothBodeInfo
  }
  getInnerSize () {
    const {ownerNode, parentNode, ownerNodeStyle, parentNodeStyle} = this.bothBodeInfo || this.getBothNodeInfo()
    const x = -ownerNode.offsetLeft + int(parentNodeStyle.paddingLeft) + int(ownerNodeStyle.marginLeft)
    const y = -ownerNode.offsetTop + int(parentNodeStyle.paddingTop) + int(ownerNodeStyle.marginTop)
    this.innerScale = { width: innerWidth(parentNode), height: innerHeight(parentNode), x, y }
    return this.innerScale
  }
  handleMiniClick (e) {
    e.stopPropagation()
    const {hasMini} = this.state
    let {x, y} = this.lastPosition || this.state.position
    let width, height
    const {parentNode, parentNodeStyle} = this.bothBodeInfo || this.getBothNodeInfo()
    const {title, _handleMiniClick, _key} = this.props

    if (!hasMini) {
      // 最小化处理
      _handleMiniClick(_key, hasMini, {title, parentNode, parentNodeStyle})
    } else {
      let lastPosition
      if (this.state.hasExpand) {
        const rst = this.innerScale || this.getInnerSize()
        width = rst.width
        height = rst.height
        lastPosition = {x: rst.x, y: rst.y}
      } else {
        width = this.lastWidth
        height = this.lastHeight
        lastPosition = this.lastPosition
      }

      _handleMiniClick(_key, hasMini, {title, parentNode, parentNodeStyle, lastPosition: lastPosition})
    }
    this.setState({hasMini: !hasMini, width, height})
    // const {_handleMiniClick, _key, title} = this.props
  }
  handleExpandClick (e) {
    e.stopPropagation()
    if (this.props.expand) {
      const {hasExpand} = this.state
      let width, height, defaultPosition
      if (hasExpand) {
      // 还原
        defaultPosition = this.lastPosition
        width = this.lastWidth
        height = this.lastHeight
        this.setState({width, height, hasExpand: !hasExpand})
      } else {
        // 扩大
        this.lastPosition = this.state.position
        this.lastWidth = this.state.width
        this.lastHeight = this.state.height
        const rst = this.innerScale || this.getInnerSize()
        width = rst.width
        height = rst.height
        defaultPosition = {x: rst.x, y: rst.y}
        this.setState({width, height, hasExpand: !hasExpand, zIndex: 0})
      }
      this.props._handleExpandClick(this.props._key, {width, height, defaultPosition, hasExpand: !hasExpand})
    }
  }
  handleCloseClick (e) {
    this.props._handleClose(this.props._key)
  }
  handleOnDrag (e) {
    if (this.isMove && !this.props.disable) {
      const o = {}
      o.deltaX = e.clientX - this.lastX
      o.deltaY = e.clientY - this.lastY
      const {ownerNode, parentNode} = this.bothBodeInfo || this.getBothNodeInfo()
      const isBody = parentNode === parentNode.ownerDocument.body
      const offsetParentRect = isBody ? {left: 0, top: 0} : parentNode.getBoundingClientRect()
      const ownerNodeRect = ownerNode.getBoundingClientRect()
      const x = ownerNodeRect.left + parentNode.scrollLeft - offsetParentRect.left
      const y = ownerNodeRect.top + parentNode.scrollTop - offsetParentRect.top
      if (o.deltaX !== 0 || o.deltaY !== 0) {
        const {_handleOnDrag, _key} = this.props
        o.x = x + o.deltaX
        o.y = y + o.deltaY
        this.lastX = e.clientX
        this.lastY = e.clientY
        this.lastPosition = {x: o.x, y: o.y}
        _handleOnDrag(_key, o)
      }
      const domNode = ReactDOM.findDOMNode(this)
      const {ownerDocument} = domNode
      ownerDocument.addEventListener('mousemove', this.handleOnDrag, true)
    }
  }
  handleDivClick () {
    if (!this.state.hasExpand) {
      this.setState({zIndex: _zIndex++})
    }
  }
  handleMouseDown (e) {
    this.lastX = e.clientX
    this.lastY = e.clientY
    this.isMove = true
    if (this.state.hasMini) this.isMove = false
  }
  handleMouseUp (e) {
    this.isMove = false
    const domNode = ReactDOM.findDOMNode(this)
    const {ownerDocument} = domNode
    ownerDocument.removeEventListener('mousemove', this.handleOnDrag, true)
  }
  componentWillReceiveProps (nextProps) {
    const { _position } = nextProps
    const {defaultPosition} = this.props
    const _defaultPosition = nextProps.defaultPosition
    if (_position) this.setState({position: _position})
    if (_defaultPosition && (defaultPosition.x !== _defaultPosition.x && defaultPosition.y !== _defaultPosition.y)) {
      this.setState({position: _defaultPosition})
      this.lastPosition = _defaultPosition
    }
  }
  render () {
    const {
      className,
      title = 'title',
      // 是否开启最小化
      mini = false,
      // 是否开启放大
      expand = false,
      // 是否开启关闭，默认开启
      close = true,
      children,
      disable = false} = this.props
    const {
      // 宽度
      width,
      // 高度
      height,
      hasMini,
      hasExpand,
      position,
      zIndex} = this.state
    const miniIconType = hasMini ? `caret-up` : `caret-down`
    const hasMiniClsFlag = classNames({
      'md-panel__move': !hasMini && !disable
    })
    const style = position ? {zIndex, width, height, transform: `translate(${position.x}px,${position.y}px)`}
    : { width, height }
    return (
      <div className={`md-panel ${className}`} style={style} onClick={() => { this.handleDivClick() }}>
        <div className={`md-panel--control  ${hasMiniClsFlag}`} onDoubleClick={this.handleExpandClick}
          onMouseMove={(e) => { this.handleOnDrag(e) }}
          onMouseDown={(e) => { this.handleMouseDown(e) }}
          onMouseUp={(e) => { this.handleMouseUp(e) }}>
          <span className='title'>{title}</span>
          {close ? <Icon type='close' className='icon--right icon--right__close' onClick={this.handleCloseClick} /> : null}
          {expand && !hasMini ? <span className={`icon--right icon--right__expand_${hasExpand}`} onClick={this.handleExpandClick} /> : null}
          {mini ? <Icon type={miniIconType} className={`icon--right icon--right__${miniIconType}`} onClick={this.handleMiniClick} /> : null}
        </div>
        <div className={`md-panel--body hasMini__hidden_${hasMini}`}>{children}</div>
      </div>
    )
  }
}
//????????????????????????????????????????????????
Window.Item = Item
export default Window
