var _ = require('lodash')
var inside = require('point-in-polygon')
var transform = require('transformist')
var sat = require('sat')
var triangulate = require('delaunay-triangulate')
var glgeometry = require('gl-geometry')
var glslify = require('glslify')
var mat4 = require('gl-mat4')
var eye = require('eye-vector')
var normals = require('normals')
var Shader = require('gl-shader')
var unindex = require('unindex-mesh')
var reindex = require('mesh-reindex')
var extrude = require('extrude')
var polyline = require('extrude-polyline')


function Geometry (data) {
  var self = this
  if (!data.props) throw new Error('Must provide properties')
  if (!data.points) throw new Error('Must provide points')
  this.props = data.props
  this.points = data.points
  if (_.isArray(data.children)) {
    this.children = data.children
  } else {
    this.children = data.children ? [data.children] : []
  }
  this.transform = data.transform ? transform(data.transform) : transform()
  this.stage()
}

Geometry.prototype.stage = function (transform, opts) {
  var self = this
  opts = opts || {}
  transform = transform || self.transform
  var op = opts.invert ? transform.invert : transform.apply
  self.points = op.bind(transform)(self.points)
  if (self.children.length) {
    _.forEach(self.children, function (child) {
      child.stage(transform, opts)
    })
  }
}

Geometry.prototype.unstage = function () {
  var self = this
  self.stage(self.transform, { invert: true })
}

Geometry.prototype.update = function (transform) {
  var self = this
  self.unstage()
  self.transform.compose(transform)
  self.stage(self.transform)
}

Geometry.prototype.contains = function (point) {
  var self = this
  return inside(point, self.points)
}

Geometry.prototype.target = function (point) {
  return _.find(this.children, function (child) { return child.props.target })
}

Geometry.prototype.cue = function (point) {
  return _.find(this.children, function (child) { return child.props.cue })
}

Geometry.prototype.intersects = function (other) {
  var self = this
  var response = new sat.Response()
  var selfPoly = new sat.Polygon(
    new sat.Vector(),
    self.points.map(function (xy) { return new sat.Vector(xy[0], xy[1]) })
  )
  var otherPoly = new sat.Polygon(
    new sat.Vector(),
    other.points.map(function (xy) { return new sat.Vector(xy[0], xy[1]) })
  )
  var collision = sat.testPolygonPolygon(selfPoly, otherPoly, response)
  if (collision) return {collision: collision, response: response}
}

Geometry.prototype.drawLines = function (context, points, scale) {
  if (this.props.stroke) {
    var n = points.length / 2
    context.lineWidth = this.props.thickness / scale || 1
    context.strokeStyle = this.props.stroke
    if (this.props.shadow) {
      context.shadowBlur = this.props.shadow.size / scale
      context.shadowColor = this.props.shadow.color
    }
    _.range(n).forEach(function (i) {
      var p1 = points[i * 2]
      var p2 = points[i * 2 + 1]
      context.beginPath()
      context.lineCap = 'round'
      context.lineTo(p1[0], p1[1])
      context.lineTo(p2[0], p2[1])
      context.stroke()
    })
    if (this.props.shadow) {
      context.shadowBlur = 0
    }
  }
}

Geometry.prototype.drawPolygon = function (context, points, scale) {
  if (this.props.fill || this.props.stroke) {
    if (this.props.shadow) {
      context.shadowBlur = this.props.shadow.size / scale
      context.shadowColor = this.props.shadow.color
    }
    context.beginPath()
    context.lineCap = 'round'
    _.forEach(points, function (xy) {
      context.lineTo(xy[0], xy[1])
    })
    context.closePath()
    context.lineWidth = this.props.thickness / scale || 1
    context.fillStyle = this.props.fill
    context.strokeStyle = this.props.stroke
    if (this.props.stroke) context.stroke()
    if (this.props.fill) context.fill()
    if (this.props.shadow) {
      context.shadowBlur = 0
    }
  }
}

Geometry.prototype.drawBezier = function (context, points, scale) {
  if (this.props.fill || this.props.stroke) {
    var n = points.length / 3
    context.beginPath()
    context.lineCap = 'round'
    if (this.props.shadow) {
      context.shadowBlur = this.props.shadow.size / scale
      context.shadowColor = this.props.shadow.color
    }
    context.lineWidth = this.props.thickness / scale || 1
    context.fillStyle = this.props.fill
    context.strokeStyle = this.props.stroke
    context.moveTo(points[0][0], points[0][1])
    _.range(n).forEach(function (i) {
      var b1 = points[i * 3 + 1]
      var b2 = points[i * 3 + 2]
      var b3 = i === (n - 1) ? points[0] : points[i * 3 + 3]
      context.bezierCurveTo(b1[0], b1[1], b2[0], b2[1], b3[0], b3[1])
    })
    context.closePath()
    if (this.props.stroke) context.stroke()
    if (this.props.fill) context.fill()
    if (this.props.shadow) {
      context.shadowBlur = 0
    }
  }
}

Geometry.prototype.drawSurface = function (gl, camera, lights) {
  var self = this

  if (!this.proj) {
    this.proj = mat4.create()
    var aspect = gl.drawingBufferWidth / gl.drawingBufferHeight
    mat4.perspective(self.proj, Math.PI / 4, aspect, 0.01, 1000)
  }
  if (!this.view) this.view = mat4.create()
  if (!this.eye) this.eye = new Float32Array(3)

  if (!this.shader) {
    this.shader = {}

    this.shader.fill = Shader(gl,
      glslify('../shaders/flat.vert'),
      glslify('../shaders/flat.frag')
    )

    this.shader.stroke = Shader(gl,
      glslify('../shaders/edge.vert'),
      glslify('../shaders/edge.frag')
    )
  }

  if (!this.geometry || this.props.dynamic) {
    this.geometry = {}

    var height = self.props.height || 0
    var bottom = self.props.bottom || 0

    if (this.props.fill) {
      this.geometry.fill = glgeometry(gl)
      var complex = extrude(self.points, {top: height, bottom: bottom})
      var flattened = unindex(complex.positions, complex.cells)
      complex = reindex(flattened)
      this.geometry.fill.attr('position', complex.positions)
      this.geometry.fill.attr('normal', normals.vertexNormals(complex.cells, complex.positions))
      this.geometry.fill.faces(complex.cells)
    }
    
    if (this.props.stroke) {
      this.geometry.stroke = glgeometry(gl)
      var top = {
        positions: self.points.map(function (p) {return [p[0], p[1], height]})
      }
      var bottom = {
        positions: self.points.map(function (p) {return [p[0], p[1], bottom]})
      }
      complex = {
        positions: top.positions
      }
      this.geometry.stroke.attr('position', complex.positions)
    }
  }

  var color = [0.5, 0.5, 0.5]

  camera.view(self.view)

  gl.enable(gl.DEPTH_TEST)
  gl.lineWidth(3 * (window.devicePixelRatio || 1))

  eye(self.view, self.eye)

  if (this.geometry.fill) {
    self.geometry.fill.bind(self.shader.fill)
    self.shader.fill.uniforms.proj = self.proj
    self.shader.fill.uniforms.view = self.view
    self.shader.fill.uniforms.eye = self.eye

    lights.forEach(function (light, i) {
      self.shader.fill.uniforms['lcol' + (i + 1)] = light.color
      self.shader.fill.uniforms['lpos' + (i + 1)] = [light.position[0], light.position[1], 15]
    })
    self.shader.fill.uniforms.ncol = lights.length

    self.shader.fill.uniforms.lit = self.props.lit ? 1.0 : 0.0
    self.shader.fill.uniforms.color = color
    self.geometry.fill.draw(gl.TRIANGLES)
    self.geometry.fill.unbind()
  }
  
  if (this.geometry.stroke & false) {
    self.geometry.stroke.bind(self.shader.stroke)
    self.shader.stroke.uniforms.proj = self.proj
    self.shader.stroke.uniforms.view = self.view
    self.shader.stroke.uniforms.eye = self.eye
    self.shader.stroke.uniforms.lit = self.props.lit ? 1.0 : 0.0
    self.shader.stroke.uniforms.color = [255, 255, 255]
    self.geometry.stroke.draw(gl.LINES)
    self.geometry.stroke.unbind()
  }

}

Geometry.prototype.drawChildren = function (context, camera, lights) {
  if (this.children) {
    this.children.forEach(function (child) {
      child.draw(context, camera, lights)
    })
  }
}

Geometry.prototype.drawSelf = function (context, camera, lights) {
  var points = this.points
  var scale = 1
  if (this.props.surface) {
    this.drawSurface(context, camera, lights)
  } else if (this.props.fill || this.props.stroke) {
    if (camera) {
      points = camera.transform.invert(points)
      points = points.map(function (xy) {
        return [xy[0] + camera.game.width / 2, xy[1] + camera.game.height / 2]
      })
      scale = camera.transform.scale
    }
    if (this.props.type === 'polygon') this.drawPolygon(context, points, scale)
    if (this.props.type === 'bezier') this.drawBezier(context, points, scale)
    if (this.props.type === 'line') this.drawLines(context, points, scale)
  }
}

Geometry.prototype.draw = function (context, camera, lights) {
  this.drawSelf(context, camera, lights)
  this.drawChildren(context, camera, lights)
}

module.exports = Geometry
