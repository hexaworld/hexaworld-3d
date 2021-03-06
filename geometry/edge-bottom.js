var Geometry = require('./geometry.js')

module.exports = function (opts) {
  opts = opts || {}
  var width = opts.scale || 0.25

  return new Geometry({
    props: {
      stroke: 'rgb(255,255,255)',
      thickness: opts.thickness || 0.25,
      type: 'polygon',
      surface: true,
      color: [55, 55, 55],
      height: 4.1,
      bottom: -0.1,
      lit: true
    },

    points: [
      [-1 / 2, Math.sqrt(3) / 2], 
      [1 / 2, Math.sqrt(3) / 2]
    ],

    transform: {
      scale: width,
      rotation: opts.rotation || 0
    },

    children: opts.children
  })
}
