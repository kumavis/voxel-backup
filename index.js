// external deps
var async = require('async')
var level = require('level')
var sublevel = require('level-sublevel')
var extend = require('extend')
var duplexEmitter = require('duplex-emitter')
var websocket = require('websocket-stream')

// voxel deps
var voxelLevel = require('voxel-level')
var crunch = require('voxel-crunch')

// module globals
module.exports = backup

function backup(opts) {
  // options and defaults
  var defaults = {
    worldName: 'world',
    server: 'ws://localhost:8000/',
  }
  opts = extend(defaults, opts || {})
  if (!opts.dbPath) opts.dbPath = __dirname+'/dump/'+opts.worldName
  
  console.log('Using database "'+opts.dbPath+'"')
  console.log('Using server "'+opts.server+'"')

  // prepare fancy db
  var voxelDB = voxelLevel(sublevel(level(opts.dbPath)))
  // prepare server
  var server = opts.server
  var socket = websocket(server)
  var emitter = duplexEmitter(socket)
  // prepare db queue
  var noMoreChunks = false
  var dbQueue = async.queue(saveChunk,8)
  dbQueue.drain = checkComplete
  
  // prepare for the worst
  emitter.on('error', function() {
    console.log(arguments)
  })

  // say hello
  emitter.on('id', function(id) {
    console.log('got id', id)
  })

  // request the chunks
  emitter.on('settings', function(settings) {
    emitter.emit('created')
    emitter.on('chunk', function(encoded, chunk) {
      console.log( 'getting chunk: '+chunk.position.join('|') )
      var voxels = crunch.decode(encoded, new Uint32Array(chunk.length))
      chunk.voxels = voxels
      dbQueue.push({worldName: opts.worldName, chunk: chunk})
    })
  })
  
  // no more incomming chunks
  emitter.on('noMoreChunks',function() {
    noMoreChunks = true
    checkComplete()
  })

  // write a chunk to the db
  function saveChunk(task, complete) {
    voxelDB.store(task.worldName, task.chunk, function(err, length) {
      if (err) throw err
      console.log( 'saved: '+task.chunk.position.join('|') )
      complete()
    })
  }

  // see if we're all done getting chunks and doing i/o
  function checkComplete() {
    if (noMoreChunks && dbQueue.length()===0) {
      // just in case
      setTimeout(function(){
        console.log('-- backup complete --')
        process.exit()
      },100)
    }
  }

}
