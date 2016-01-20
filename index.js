var fastclick = require('fastclick').FastClick
fastclick.attach(document.body)

var config = {
  name: 'welcome',
  lives: 3,
  moves: 6,
  difficulty: 1
}

var base = function (start) {
  return {
    tiles: [
      {translation: [0, 0], paths: [0, 2, 4], cue: {fill: '#DE863A', scale: 1}},
      {translation: [0, 1], paths: [2, 3, 4], target: {fill: '#FFFFFF'}}
    ],
    start: [{translation: start.translation, rotation: start.rotation}],
    target: [0, 1],
    flash: ['#FF5050', '#FF8900', '#00C3EE', '#64FF00']
  }
}

var maps = [
  base({translation: [0, 0], rotation: 180}),
  base({translation: [1, -1], rotation: 0}),
  base({translation: [0, -1], rotation: 0})
]

var level = {
  config: config,
  maps: maps
}

var play = require('./play.js')('container', level)
play.start()
