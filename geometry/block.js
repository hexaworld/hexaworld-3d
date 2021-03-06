var Geometry = require('./geometry.js')

module.exports = function (opts) {
  opts = opts || {}
  var width = opts.scale || 0.25

  return new Geometry({
    props: {
      thickness: 0,
      type: 'polygon',
      obstacle: true,
      surface: false || false,
      color: [10, 10, 100],
      lit: true,
      height: -1
    },

    points: [
      [-1 / 2, Math.sqrt(3) / 2 / width],
      [-1 / 2, Math.sqrt(3) / 2],
      [1 / 2, Math.sqrt(3) / 2],
      [1 / 2, Math.sqrt(3) / 2 / width]
    ],

    transform: {
      scale: width,
      rotation: opts.rotation || 0
    },

    children: opts.children
  })
}
