var level = require('level')
var voxelLevel = require('voxel-level')
var extend = require('extend')
var duplexEmitter = require('duplex-emitter')
var websocket = require('websocket-stream')

// module globals
module.exports = initialize

function initialize(opts) {
  var defaults = {
    worldName: 'world',
    server: 'ws://localhost:8000/',
  }
  opts = extend(defaults, opts || {})
  if (!opts.dbPath) opts.dbPath = __dirname+'/dump/'+opts.worldName
  
  console.log('Using database "'+opts.dbPath+'"')
  console.log('Using server "'+opts.server+'"')

  var voxelDB = voxelLevel(level(opts.dbPath))
  var server = opts.server
  var socket = websocket(server)
  var emitter = duplexEmitter(socket)
  console.log('emitter initialized')  

  emitter.on('id', function(id) {
    console.log('got id', id)
    emitter.emit('clientSettings', null)
  })

  emitter.on('settings', function(settings) {
    emitter.emit('created')
    emitter.on('chunk', function(encoded, chunk) {
      console.log( 'getting chunk: '+chunk.position.join('|') )
      var voxels = crunch.decode(encoded, chunk.length)
      chunk.voxels = voxels
      voxelDB.store(opts.worldName, chunk, function(err, length) {
        if (err) throw err
        console.log( 'saved: '+chunk.position.join('|') )
      })
    })
  })

}
