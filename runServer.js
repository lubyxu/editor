var express = require('express')
var app = express()
var cors = require('cors');
// app.use(cors());
var http = require('http').Server(app)
var io = require('socket.io')(http, {
    origins: ['http://localhost:3000']
})

// var path = require('path')

http.listen(4001, function () {
  console.log('listening on *:4001')
})

var EditorSocketIOServer = require('./build-server/server.js').default;
var server = new EditorSocketIOServer('', [], 1)

io.on('connection', function (socket) {
    console.log('connect')
  server.addClient(socket)
});
