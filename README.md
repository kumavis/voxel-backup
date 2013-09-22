# voxel-backup
Connect to a voxel-server and store the world chunks in level db

### get in
on npm
```javascript
npm install voxel-backup
```

### defaults
```javascript
var defaults = {
  worldName: 'world',
  server: 'ws://localhost:8000/',
}
```
if you dont specify a dbPath you'll get
```
opts.dbPath = __dirname+'/dump/'+opts.worldName
```

### example
```javascript
var backup = require('voxel-backup')

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
```