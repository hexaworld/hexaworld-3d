var Tile = require('./tile.js')
var Path = require('./path.js')
var Center = require('./center.js')

module.exports = World

function World() {
  this.tiles = [
    new Tile({coordinate: {r: -1, q: 0}}, [new Center(), new Path(), new Path({rotation: 120}), new Path({rotation: 150})]), 
    new Tile({coordinate: {r: 0, q: 0}}, [new Center(), new Path(), new Path({rotation: 60}), new Path({rotation: 120})]), 
    new Tile({coordinate: {r: 0, q: 1}}, [new Center(), new Path({rotation: 60}), new Path({rotation: 90}), new Path({rotation: 120})]),
    new Tile({coordinate: {r: -1, q: 1}}, [new Center(), new Path({rotation: 120}), new Path({rotation: 150})]),
    new Tile({coordinate: {r: 1, q: -1}}, [new Center(),  new Path(), new Path({rotation: 60})]),
    new Tile({coordinate: {r: 1, q: 0}}, [new Center(), new Path({rotation: 30}), new Path({rotation: 90})]),
    new Tile({coordinate: {r: 0, q: -1}}, [new Center(), new Path({rotation: 30}), new Path({rotation: 150})])
  ]
  console.log(this.tiles[0])
}

World.prototype.render = function(context, camera) {
  // figure out which tiles to show given the camera position
  this.tiles.forEach(function (tile) {
    tile.render(context, camera)
  })
}

World.prototype.boundaries = function(camera) {
  // figure out which tiles to check given the camera position
  // for those tiles, check whether we're intersecting the bounding boxes of any objects
}