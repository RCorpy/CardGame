const socket = io();
const startButton = document.getElementById("StartButton")
const turnButton = document.getElementById("TurnButton")
const instructions = document.getElementById("instructions")
const stats = document.getElementById("players")

const roomName = document.getElementById('room-name')
const userList = document.getElementById('users')
const describe = document.getElementById("cardDescription")

let users = []
let container = []
let target = -1
let targetSpace = []

const variables = location.search.split("&");
const playername = variables[0].split("=")[1]
const room = variables[1].split("=")[1]


//console.log(playername, room);


/*const {playername, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})*/

socket.emit('joinRoom', {playername, room})

socket.on('updatePlayers', ({room, players}) =>{
    users = players;
    outputPlayers(players);
    outputRoomName(room)
})


socket.on('showPlayers', participants => {
    console.log(participants)
    stats.innerHTML =`${participants.map(participant =>`<div class= "player" id=${participant.id}> ${participant.name} || Health: ${participant.health} || Income: ${participant.income} || Wealth: ${participant.wealth} || Cards: ${participant.listOfCards.length} || Decay: ${participant.decay}</div>`).join("")}`
    for (let x= 0; x<participants.length;x++){
        targetSpace[x] = document.getElementById(`${participants[x].id}`)
        let targeting = participants[x].id
        let targetingName = participants[x].name
        targetSpace[x].addEventListener('click', () => { 
            target = targeting
            document.getElementById("target").innerHTML = `Target is now ${targetingName}`
        })
    }

})
    //print the players to the sidebar


socket.on('instruction', (message)=>{
    instructions.innerHTML= message;
})

socket.on('redrawingScreen', cards =>{ drawing(cards)})
    /////////////////// lets print the cards to screen


startButton.addEventListener("click", () =>{

    socket.emit('startGame', room);

})

turnButton.addEventListener("click", () =>{
    //console.log(room)
    socket.emit('turnEnd', room);

})

//add room name to DOM
function outputRoomName(room){
    roomName.innerHTML = room
}

//add users to DOM

function outputPlayers(users){
    userList.innerHTML = `${users.map(user=>`<li>${user.playername}</li>`).join("")}`
}

function drawing(cards){
    for(let cont of container){
        let new_element = cont.cloneNode(true);
        cont.parentNode.replaceChild(new_element, cont) //ni idea que hago aqui pero funciona, quita los EventListeners
    }
    container = []

    for(let i=0; i<5; i++){
        document.getElementById(`imagen${i+1}`).src = "" 
    }

    for(let i= 0;i<cards.length; i++){
        container[i] = document.getElementById(`contenedor-imagen${i+1}`)
        document.getElementById(`imagen${i+1}`).src = cards[i].image
        container[i].addEventListener("dblclick", function(){ 
            
            usedCard = cards[i]
            
            socket.emit('playCard', {room, usedCard, target})
            socket.emit('redrawingScreen')
        })
        container[i].addEventListener("click", function(){
            describe.innerHTML = `${cards[i].name}, cost: ${cards[i].cost}, damage: ${cards[i].damage}, health: ${cards[i].health}, effect: ${cards[i].effect}`
        })
    }}

