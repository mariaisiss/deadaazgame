const express = require('express')
const path = require('path')

const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)

app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'public'))
app.engine('html', require('ejs').renderFile)
app.set('view engine', 'html')

let images = []
let numberOfPlayers = 1

io.on('connection', (socket) => {
    let id = socket.id
    console.log("Novo cliente conectado. ID => " + id)
    
    socket.on('setPlayerNumber', playerNumber => {
        numberOfPlayers += playerNumber;
    })

    socket.emit('getNumberOfPlayers', numberOfPlayers)

    socket.on('sendImages', currentImages => {
      images = currentImages  
    })

    socket.on('toggleCards', id => {
        socket.broadcast.emit('fodase', id)
    })
})

app.use('/', (req, res) => {
    res.render('index.html')
})

server.listen(3000)