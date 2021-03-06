var css = require('dom-css')
var _ = require('lodash')
var animate = require('animateplus')

module.exports = function (container) {
  var width = container.clientWidth
  var height = container.clientHeight
  var ismobile = width < height

  var w = ismobile ? width * 0.8 : height * 0.5
  var h = height * 0.2

  var points = [[0, 0], [w, 0], [w * 1.15, h], [0, h]]
  var offset = ismobile ? -400 : -1200
  

  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', w * 1.15)
  svg.setAttribute('height', h)
  css(svg, {
    pointerEvents: 'none',
    position: 'absolute',
    left: ismobile ? 0 : (width - 0.65 * height) * 0.5, right: 0,
    top: ismobile ? height * 0.3 : height * 0.36,
    display: 'block',
    transform: 'translateX(' + offset + 'px)'
  })
  container.appendChild(svg)

  var background = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
  background.setAttribute('points', points.join(' '))
  css(background, {
    fill: 'rgb(45,45,45)',
    stroke: 'none',
  })
  svg.appendChild(background)

  var label = document.createElement('div')
  container.appendChild(label)
  css(label, {
    top: ismobile ? height * 0.35 : height * 0.41,
    left: ismobile ? width * 0.05 : (width - 0.65 * height) * 0.53,
    width: w,
    textAlign: 'left',
    position: 'absolute',
    pointerEvents: 'none',
    lineHeight: ismobile ? height * 0.12 * 0.33 + 'px' : height * 0.06 * 0.7 + 'px',
    transform: 'translateX(' + offset + 'px)'
  })

  var message = document.createElement('div')
  label.appendChild(message)
  css(message, {
    color: 'rgb(200,200,200)',
    fontFamily: 'Hack',
    fontWeight: '800',
    fontSize: ismobile ? width * 0.12 : height * 0.07
  })
  
  function show (text) {
    animate({
      el: svg,
      translateX: [offset, 0],
      duration: 400,
      easing: 'easeInQuad'
    })
    animate({
      el: label,
      translateX: [offset, 0],
      duration: 200,
      easing: 'easeInQuad'
    })
    css(label, {opacity: 1})
    message.innerHTML = text
  }

  function hide () {
    animate({
      el: svg,
      translateX: [0, offset],
      duration: 300,
      easing: 'easeInQuad'
    })
    animate({
      el: label,
      translateX: [0, offset],
      duration: 300,
      easing: 'easeInQuad'
    })
  }

  function hideQuick () {
    css(svg, {transform: 'translateX(' + offset + 'px)'})
    css(label, {transform: 'translateX(' + offset + 'px)'})
  }

  return {
    show: show,
    hide: hide,
    hideQuick: hideQuick
  }
}
