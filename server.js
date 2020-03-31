
const path = require('path');
const http = require('http');
const express = require("express");
const socketio = require("socket.io");

const STARTINGHAND = 0;
const app = express();
const server = http.createServer(app); 
const io = socketio(server);

const deck = [["papel", 1, 1, 0, "none", "papel.png"], ["tijeras", 1, 1, 0, "none", "tijeras.png"], ["piedra", 1, 1, 0, "none", "piedra.png"], ["papel-2", 2, 2, 0, "none", "papel.png"], ["tijeras-2", 2, 2, 0, "none", "tijeras.png"], ["piedra-2", 2, 2, 0, "none", "piedra.png"], ["papel-3", 3, 3, 0, "none", "papel.png"], ["tijeras-3", 3, 3, 0, "none", "tijeras.png"], ["piedra-3", 3, 3, 0, "none", "piedra.png"]];
const Players = [];
const Games = [];

//Set static folder
app.use(express.static(path.join(__dirname, 'public')));

//Run when a client connects
io.on('connection', socket => {
    
    socket.emit('instruction', 'Welcome to IaioQuest');
    
    socket.on('joinRoom', ({playername, room}) => {
        const player = playerJoin(socket.id, playername, room);
        
        socket.join(player.room)
        
        io.to(player.room).emit('updatePlayers', {
            room: player.room,
            players: playersOfRoom(player.room)
        })

    })
        
        //console.log(playersOfRoom(room))
        

    //Creates the game if not running
    socket.on('startGame', room =>{
        
        let thisGame = lookForGame(room);
        if(thisGame == -1 || thisGame.players.length<1){
            
            let participants = playersOfRoom(room);
            Games.push(new Game(deck, participants, room));
            io.to(room).emit('showPlayers', lookForGame(room).players)
            let thisGame = lookForGame(room)
            io.to(room).emit('instruction', `It's ${thisGame.players[thisGame.currentAction].name} turn`);

        }else{
            socket.emit('instruction', "partida en curso");
        }
    })  
    //Removes players from list
    socket.on('disconnect', () => {
        console.log("A player disconnected");
        removePlayer(socket.id);
        io.emit('updatePlayers', Players);
    })

    //Does the end of a turn
    socket.on("turnEnd", room=>{
        let thisGame = lookForGame(room);
        
        if(socket.id == thisGame.players[thisGame.currentAction].id){
        
        thisGame.currentAction += 1;
        thisGame.currentAction = thisGame.currentAction % (thisGame.players.length);
        io.to(room).emit('instruction', `It's ${thisGame.players[thisGame.currentAction].name} turn`);

        //get the money per turn
        thisGame.players[thisGame.currentAction].wealth += thisGame.players[thisGame.currentAction].income

        thisGame.turn();
        }
    })

    socket.on('playCard', ({room, usedCard, target}) =>{
        let thisGame = lookForGame(room);
        let player = thisGame.players[thisGame.currentAction]

        //check if its the player with the turn and remove the card from his hand
        if(socket.id == player.id){
            //checking if the player has the wealth
            if(player.wealth>=usedCard.cost){
                //check if player has a target
                if(target !== -1){
                    let targeted = lookForPlayer(thisGame, target)
                    for (let i = 0; i <player.listOfCards.length; i++){
                    if(player.listOfCards[i].name==usedCard.name){
                        player.listOfCards.splice(i, 1)
                        player.wealth-=usedCard.cost
                        activateCard(targeted, usedCard)
                        thisGame.emitInfo()
                        break
            }}
            
        }else{
            socket.emit('instruction', "choose your target")
        }
    }else{
            socket.emit('instruction', "you need more money")
        }

        }
    })

})

function activateCard(targeted, card){
    targeted.health -= card.damage
    targeted.health += card.health
}


function lookForPlayer(thisGame, socketid){
    for (let x of thisGame.players){
        if(x.id == socketid){
            return x}
    }

}

function removePlayer(socketid){
    const index = Players.findIndex(player =>player.id == socketid);

    if (index != -1){
        return Players.splice(index, 1)[0];
    }
}

function playerJoin(id, playername, room){
    const player = {id, playername, room};
    Players.push(player);
    return player
}

function playersOfRoom(room){
    return Players.filter(player => player.room == room);
}

function lookForGame(room){
    
    return Games.filter(game => game.room == room)[0] || -1
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));


// --------------------------CLASSES--------------------------------------

class Game{
    constructor(deck, players, room){
        this.deck = deck;
        this.players = this.playerCreator(players);
        this.room = room;
        this.currentAction = 0
        this.startingHandGenerator()
        this.turn()
    }

    // giving CONST cards to each player
    startingHandGenerator(){
        for (let j = 0 ; j<this.players.length; j++){
            for (let k = 0 ; k<STARTINGHAND; k++){
                let x = Math.floor(Math.random()*(this.deck).length)
                x = (this.deck).splice(x, 1)[0]
                this.players[j].listOfCards.push(new Card(x[0], x[1], x[2], x[3], x[4], x[5]))
            }
            this.emitInfo()
        }
        //giving the income to the first player, changing his EV
        this.players[0].wealth += this.players[0].income
        
    }

    playerCreator(players){
        let listOfPlayers = []
        for (let x of players){
            listOfPlayers.push(new SinglePlayer(x.id, x.playername))
        }
        return listOfPlayers
    }

    turn(){
        //console.log(this.players[this.currentAction].name)
        this.decay()
        this.draw()
        
        for(let x of this.players){
            io.to(x.id).emit('redrawingScreen', x.listOfCards)
        }
        
        io.to(this.players[this.currentAction].id).emit('instruction', "You go! DESTROY THEM")

    }
    decay(){
        this.players[this.currentAction].health -= this.players[this.currentAction].decay
    }
    draw(){
        
        let x = Math.floor(Math.random()*(this.deck).length)
        x = (this.deck).splice(x, 1)[0]
        this.players[this.currentAction].listOfCards.push(new Card(x[0], x[1], x[2], x[3], x[4], x[5]))
        this.emitInfo()
        //console.log(this.players[this.currentAction].listOfCards)
    }

    emitInfo(){
        for(let x of this.players){
            io.to(x.id).emit('redrawingScreen', x.listOfCards)
            io.to(x.id).emit('showPlayers', this.players)
        }

    }
}

// -----------

class SinglePlayer{
    constructor(id, name, health = 10, income = 1){
        this.id = id
        this.name = name
        this.health = health
        this.income = income
        this.wealth = 0
        this.decay = 1
        this.listOfCards = []

    }
    

}

// -----------

class Card{
    constructor(name, cost, damage, health, effect, image, index){
        this.name = name
        this.cost = cost
        this.damage = damage
        this.health = health
        this.effect = effect
        this.image = image
    }

    
}