const express = require('express');
const path = require('path');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

var numberOfPlayers = 0;
var currentImages   = [];

var players = [];
var currentPlayer;

app.use('/', (req, res) => {
    res.render('index.html');
});

io.on('connection', (socket) => {
    console.log("Novo cliente conectado. ID => " + socket.id);
    
    socket.on('connected', (clientStatus) => {
        if(clientStatus) {
            numberOfPlayers++;
        }
    });

    socket.emit('getNumberOfPlayers', numberOfPlayers);
    socket.emit('loadImages', currentImages);

    socket.on('sendImages', (images) => {
        currentImages = images;
    });

    socket.on('sendCardId', (cardId) => {
        socket.broadcast.emit('loadCardId', cardId);
    });

    socket.on('errorClick', (flippedCards) => {
        socket.broadcast.emit('sendErrorClick', flippedCards);
    });

});

server.listen(3000);