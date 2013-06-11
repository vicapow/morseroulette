// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
 
// MIT license
 
;(function() {
  var lastTime = 0
  var vendors = ['ms', 'moz', 'webkit', 'o']
  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame']
      window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
        || window[vendors[x]+'CancelRequestAnimationFrame']
  }

  if (!window.requestAnimationFrame)
      window.requestAnimationFrame = function(callback, element) {
          var currTime = new Date().getTime()
          var timeToCall = Math.max(0, 16 - (currTime - lastTime))
          var id = window.setTimeout(
            function() { 
              callback(currTime + timeToCall)
            }
          , timeToCall )
          lastTime = currTime + timeToCall
          return id
      }
  if(!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function(id) { clearTimeout(id) }
}())



$(function(){
  var canvas = $('canvas')[0]
    , pending = false
    , isbuzzing = false
    , x = 0
    , ctx = canvas.getContext('2d')
  
  canvas.width = 30
  canvas.height = 300
  
  function startbeep(val){
    ga('send', 'event', 'button', 'press', 'key')
    if(val !== false) val = true
    if(val === isbuzzing) return
    isbuzzing = val
    if(isbuzzing) $('.pen').addClass('active')
    else $('.pen').removeClass('active')
    audio.play() // some noise
    if(isbuzzing) socket.emit('beepstart')
    else socket.emit('beepstop')
  }
  function stopbeep(){
    ga('send', 'event', 'button', 'release', 'key')
    startbeep(false)
    audio.currentTime = 0
    audio.pause()
  }
  window.startbeep = startbeep
  window.stopbeep = stopbeep
  ;(function animate(){
    pending = false
    // shift everything to the left:
    var img = ctx.getImageData(0, 0, canvas.width, canvas.height-1)
    ctx.putImageData(img, 0, 1)
    //ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
      ctx.beginPath()
      ctx.arc(5 + (!isbuzzing) * 20, 68, 3, 0, 2 * Math.PI)
      ctx.fillStyle = 'black'
      ctx.fill()
    ctx.restore()
    setTimeout(function(){
      if(!pending) requestAnimationFrame(animate)
      pending = true
    }, 10)
  })()
  
  $('body').on('mouseup touchend', stopbeep)
  $('.handle').on('mousedown touchstart',startbeep)
  $('.next-button').on('mousedown touchstart', function(){
    ga('send', 'event', 'button', 'press', 'next')
    socket.emit('leave-pair')
    setTimeout(function(){
      // try to connect to a new pair
      socket.emit('next')
    }, 1000)
  })
  
  var audio = createBeepSound()
  var socket = io.connect(window.location.href)
  socket.on('buzz', setBuzz)
  
  function setBuzz(data){
    if(data.isbuzzing === isbuzzing) return
    isbuzzing = data.isbuzzing
    if(isbuzzing) audio.play()
    else{
      audio.currentTime = 0
      audio.pause()
    }
    if(isbuzzing) $('.pen').addClass('active')
    else $('.pen').removeClass('active')
  }
  socket.on('paired', function(){
    ga('send', 'event', 'socket', 'paired', { 'nonInteraction' : 1 })
    $('.dialog-container').addClass('active')
  })
  
  socket.on('lost-pair', function(){
    ga('send', 'event', 'socket', 'lost-pair', { 'nonInteraction' : 1 })
    $('.dialog-container').removeClass('active')
  })
  
})

function createBeepSound(){
  var data = [] // just an array
  var i = 0
  while( i < 1000000 ){
    data[i++] = 64 + Math.round(60*Math.sin(i/30)) // left speaker
    data[i++] = 64 + Math.round(60*Math.sin(i/800)) // right speaker
  }
  var wave = new RIFFWAVE()
  wave.header.sampleRate = 44100 // set sample rate to 44KHz
  wave.header.numChannels = 2 // two channels (stereo)
  wave.Make(data)
  var audio = new Audio(wave.dataURI)
  audio.loop = true
  audio.pause()
  return audio
}