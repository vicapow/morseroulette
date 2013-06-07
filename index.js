var express = require('express')
  , app = express()
  , io = require('socket.io').listen(app.listen(3006))

app.use(express.static(__dirname + '/public'))

var buzzers = {}
var isbuzzing = false

function updateBuzzer(socket){
  var prev_buz = isbuzzing
  isbuzzing = false
  for(var buzzer in buzzers){
    isbuzzing = isbuzzing || buzzers[buzzer]
  }
  if(prev_buz === isbuzzing) return // no change
  socket.broadcast.emit('buzz', { isbuzzing : isbuzzing })
}

io.sockets.on('connection', function(socket){
  buzzers[socket.id] = false
  socket.on('beepstart', function(data){
    buzzers[socket.id] = true
    updateBuzzer(socket)
  })
  socket.on('beepstop', function(data){
    buzzers[socket.id] = false
    updateBuzzer(socket)
  })
  socket.on('disconnect', function(){
    delete buzzers[socket.id]
    updateBuzzer(socket)
  })
})