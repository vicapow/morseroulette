var express = require('express')
  , app = express()
  , io = require('socket.io').listen(app.listen(3006))

app.use(express.static(__dirname + '/public'))

var pairs = {}
// the unpaired socket. (there is only ever 0 or 1 unpaired socket)
var unpaired = []
var isbuzzing = {}

io.sockets.on('connection', function(socket){
  searchNewPair(socket)
  
  socket.on('beepstart', function(data){
    updateBuzz(socket, true)
  })
  socket.on('beepstop', function(data){
    updateBuzz(socket, false)
  })
  socket.on('next', function(){
    var pair = pairs[socket.id]
    if(!pair) return searchNewPair(socket)
    delete pairs[pair.p1]
    delete pairs[pair.p2]
    pair.p1.emit('lost-pair')
    pair.p2.emit('lost-pair')
    searchNewPair(pair.p1)
    searchNewPair(pair.p2)
  })
  socket.on('disconnect', function(){
    var pair = pairs[socket.id]
    if(!pair) {
      unpaired.map(function(s, i){
        if( s === socket)
        unpaired.splice(i,1)
      })
      return
    }else{
      delete pairs[pair.p1.id]
      delete pairs[pair.p2.id]
    }
    delete isbuzzing[socket.id]
    if(pair.p1 === socket) pair.p2.emit('lost-pair')
    else pair.p1.emit('lost-pair')
  })
})

function searchNewPair(socket){
  if(unpaired.length){
    if(unpaired[0].id === socket.id) return
    var partner = unpaired.shift()
    var pair = pairs[partner.id] = pairs[socket.id] = {
      p1 : socket
      , p2 : partner
      , buzz1 : isbuzzing[socket.id]
      , buzz2 : isbuzzing[partner.id]
      , buzzing : isbuzzing[socket.id] || isbuzzing[partner.id]
    }
    pair.p1.emit('paired')
    pair.p2.emit('paired')
  }else unpaired.push(socket)
}

function updateBuzz(socket, buzzing){
  isbuzzing[socket.id] = buzzing
  var pair = pairs[socket.id]
  if(!pair) return
  if(pair.p1 === socket) pair.buzz1 = buzzing
  else pair.buzz2 = buzzing
  buzzing = pair.buzz1 || pair.buzz2
  if(pair.buzzing == buzzing) return
  pair.buzzing = buzzing
  ;((socket === pair.p1) ? pair.p2 : pair.p1).emit('buzz', { isbuzzing : buzzing })
}