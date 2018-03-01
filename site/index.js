import React from 'react'
import { render } from 'react-dom'
// import Promise from 'es6-promise'
// Promise.polyfill()
// import Button from '../src/components/button'
// import MapContaniner from '../src/components/map'
import {
  HashRouter as Router,
  Route,
  Link,
  NavLink
} from 'react-router-dom'

import Home from 'bundle-loader?lazy&name=Home!./pages/index'
import Bundle from '../src/components/lazyload'

import './styles/antd.min.css'
import './styles/color.css'
import './styles/index.css'

const loadComponent = (Component) => () => (
  <Bundle load={Component}>
    {
            (Component) => Component ? <Component /> : <div style={{height: '100vh'}} />
        }
  </Bundle>
)
class App extends React.Component {
  constructor (props) {
    super(props)
  }
  componentWillMount () {
    window.addEventListener('hashchange', () => {
      window.scrollTo(0, 0)
    }, false)
  }
  render () {
    return (
      <Router>
        <div className='container' id='page-main'>
          <div className='banner bgBlue500'>
            <h1 className='header-left'>
              <Link className='header--img' to=''>
                <span style={{fontWeight: 'normal'}}>台风预警系统DEMO（POWER BY METE DESIGN）</span>
              </Link>
            </h1>
            <button className='heder--menu' >
              <i className='fa fa-bars' aria-hidden='true' />
            </button>
            <ul className='header-right' id='menu'>
              <li className='header-li' >
                <NavLink exact to='/' activeClassName='header-active'>首页</NavLink>
              </li>

            </ul >
          </div >
          <Route exact path='/' component={loadComponent(Home)} />

        </div>
      </Router>
    )
  }
}

render(<App />, document.getElementById('root'))
