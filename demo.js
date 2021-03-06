var backup = require('./index.js')

var options = {
  worldName: 'kumavis',
  server: 'ws://voxel.kumavis.me:8000/',
}

var backupper = backup(options, backupComplete, chunkComplete)

console.log('Using database "'+backupper.opts.dbPath+'"')
console.log('Using server "'+backupper.opts.server+'"')

function backupComplete(err) {
  if (err) throw err
  console.log('-- backup complete --')
  process.exit()
}

function chunkComplete(err, chunk) {
  if (err) throw err
  console.log( 'saved: '+chunk.position.join('|') )
}

backupper.on('chunk',function(encoded, chunk) {
  console.log( 'getting chunk: '+chunk.position.join('|') )
})

backupper.on('id', function(id) {
  console.log('got id', id)
})