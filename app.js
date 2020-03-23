

const imagen_div= document.getElementById("contenedor-imagen1")
//const prueba = document.querySelector(".contenedor-imagen")
//prueba.addEventListener("click", function () {console.log("hello")})

let listOfCards = []


class Player{
    constructor(health = 10, income = 1){
        this.health = health
        this.income = income
        this.wealth = 0
        this.listOfCards = []
        this.draw(0)
        this.draw(1)
        this.draw(2)
        this.draw(3)
        this.draw(4)
    }
    draw(index){
        
        let x = Math.floor(Math.random()*deck.length)
        x = deck.splice(x, 1)[0]
        this.listOfCards.push(new Card(x[0], x[1], x[2], x[3], x[4], x[5], index))
    }
    play(index){
        this.listOfCards.splice(index, 1)[0]
    }
}


class Card{
    constructor(name, cost, damage, health, effect, image, index){
        this.name = name
        this.cost = cost
        this.damage = damage
        this.health = health
        this.effect = effect
        this.image = image
        
    }

    shout(){
        console.log(this.name, this.cost, this.damage)
    }
}


function game(){
    drawing()

}

function drawing(){

    let container = []
    for(let i=0; i<5; i++){
        document.getElementById(`imagen${i+1}`).src = "marsRover.png"
    }

    for(let i= 0;i<tu.listOfCards.length; i++){
        container[i] = document.getElementById(`contenedor-imagen${i+1}`)
        document.getElementById(`imagen${i+1}`).src = tu.listOfCards[i].image
        container[i].addEventListener("click", function(){ 
            tu.listOfCards[i].shout()
            tu.play(i)
            for(let cont of container){
                let new_element = cont.cloneNode(true);
                cont.parentNode.replaceChild(new_element, cont) //ni idea que hago aqui pero funciona
        }
            game()
        })
    }}

let deck = [["papel", 1, 1, 0, "none", "papel.png"], ["tijeras", 1, 1, 0, "none", "tijeras.png"], ["piedra", 1, 1, 0, "none", "piedra.png"], ["papel2", 2, 2, 0, "none", "papel.png"], ["tijeras2", 2, 2, 0, "none", "tijeras.png"], ["piedra2", 2, 2, 0, "none", "piedra.png"]];
let tu = new Player()
game()


