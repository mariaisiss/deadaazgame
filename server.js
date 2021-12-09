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

var players = [
    {
        id: "",
        turn: false,
        points: 0
    },
    {
        id: "",
        turn: false,
        points: 0
    }
];

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

    socket.on('sendPlayerId', (id, turn) => {
        if(turn == 1) {
            players[0].id = id;
            players[0].turn = turn;
        } else {
            players[1].id = id;
            players[1].turn = turn;
        }
    });

    socket.on('changeTurn', (id) => {
        for(player in players) {
            player.turn = !player.turn;
        }
        socket.broadcast.emit('updateTurn', id);
    });

    socket.on('updatePoints', (id) => {
        for(let i = 0; i < players.length; i++) {
            if(players[i].id === id) {
                players[i].points += 1;
            }
        }
    });

    socket.on('endGame', () => {
        if(players[0].points > players[1].points) {
            socket.broadcast.emit('playerWinner', players[0].id);
        } else if(players[0].points < players[1].points) {
            socket.broadcast.emit('playerWinner', players[1].id);
        } else {
            socket.broadcast.emit('playerWinner', 'empate');
        }
    });

    socket.on('canPlay', () => {
        socket.broadcast.emit('updateCanPlay', true);
    });

});

server.listen(3000);