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

function backup(opts, backupComplete, chunkComplete) {
  // options and defaults
  backupComplete = backupComplete || function(){}
  chunkComplete = chunkComplete || function(){}
  var defaults = {
    worldName: 'world',
    server: 'ws://localhost:8000/',
  }
  opts = extend(defaults, opts || {})
  if (!opts.dbPath) opts.dbPath = __dirname+'/dump/'+opts.worldName

  // prepare fancy db
  var voxelDB = voxelLevel(sublevel(level(opts.dbPath)))
  // prepare server
  var server = opts.server
  var socket = websocket(server)
  var emitter = duplexEmitter(socket)
  // prepare db queue
  var didError = false
  var noMoreChunks = false
  var dbQueue = async.queue(saveChunk,8)
  dbQueue.drain = checkComplete
  
  // prepare for the worst
  emitter.on('error', function(err) {
    didError = true
    backupComplete(err)
  })

  // request the chunks
  emitter.on('settings', function(settings) {
    emitter.emit('created')
    emitter.on('chunk', function(encoded, chunk) {
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

  // provide the emitter with the resolved opts
  return extend(emitter, {opts: opts})

  // write a chunk to the db
  function saveChunk(task, complete) {
    voxelDB.store(task.worldName, task.chunk, function(err, length) {
      if (err) throw err
      chunkComplete(null,task.chunk)
      complete()
    })
  }

  // see if we're all done getting chunks and doing i/o
  function checkComplete() {
    if (noMoreChunks && dbQueue.length()===0 && !didError) {
      // just in case
      setTimeout(function() {
        backupComplete(null)
      },100)
    }
  }

}
