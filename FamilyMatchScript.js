


const cardContainer = document.getElementById('card-container');
const numbers = [
        "images/Gordon Bodily.jpg",
        "images/Harriett Ann Roberts.jpg", 
        "images/Jackie Barlow Bodily.jpg",
        "images/Lois Carrigan Barlow.jpg", 
        "images/Olive Marie Merkley Bodily.jpg",
        "images/Robert Bodily Jr.jpg", 
        "images/Vinal Stoker Barlow.jpg", 
        "images/Walton Edwin Bodily.jpg",
        "images/Gordon Bodily.jpg",
        "images/Harriett Ann Roberts.jpg", 
        "images/Jackie Barlow Bodily.jpg",
        "images/Lois Carrigan Barlow.jpg", 
        "images/Olive Marie Merkley Bodily.jpg",
        "images/Robert Bodily Jr.jpg", 
        "images/Vinal Stoker Barlow.jpg", 
        "images/Walton Edwin Bodily.jpg",
        "images/George Davis Merkley.jpg",
        "images/George Davis Merkley.jpg",
        "images/Zelpha Allen Bodily.jpg",
        "images/Zelpha Allen Bodily.jpg"
];
//const numbers = [1, 2, 3, 4, 1, 2, 3, 4];
let flippedCards = [];
let matchedCards = [];
var numTurns = 0;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function createCard(number) {
    const card = document.createElement('div');
    card.innerHTML = "Family<br> Match";
    card.classList.add('card');
    card.dataset.number = number;

    const back = document.createElement('div');
    back.classList.add('back');
    //back.textContent = number;
    back.innerHTML = "<img src='" + number + "'>";

    card.appendChild(back);

    cardContainer.appendChild(card);

    card.addEventListener('click', () => {
        flipCard(card);
    });
}

function flipCard(card) {
    if (flippedCards.length < 2 && !card.classList.contains('flipped')) {
        card.classList.add('flipped');
        flippedCards.push(card);
        if (flippedCards.length === 2) {
            numTurns++;
            if (flippedCards[0].dataset.number === flippedCards[1].dataset.number) {
                document.getElementById("personName").innerHTML += (flippedCards[1].dataset.number).split("/").pop().split(".")[0] + "<br />";
                flippedCards[0].classList.add('matched');
                flippedCards[1].classList.add('matched');
                matchedCards.push(flippedCards[0], flippedCards[1]);
                flippedCards = [];
                if (matchedCards.length === numbers.length) {
                    //localStorage.removeItem('record');
                    var oldrecord = localStorage.getItem('record');
                    
                    if(!oldrecord) oldrecord = 100;
                    if(numTurns < oldrecord){
                        setTimeout(() => alert('Congratulations! You set a new record of ' + numTurns + " turns!"), 500);
                        localStorage.setItem('record', numTurns);
                    }
                    else setTimeout(() => alert('Congratulations! You won in ' + numTurns + " turns! The record is " + oldrecord + " turns."), 500);
                }
            } else {
                setTimeout(() => {
                    flippedCards[0].classList.remove('flipped');
                    flippedCards[1].classList.remove('flipped');
                    flippedCards = [];
                }, 1000);
            }
        }
    }
}
function resetRecord(){
    localStorage.removeItem('record');
}

shuffleArray(numbers);

numbers.forEach((number) => {
    createCard(number);
});