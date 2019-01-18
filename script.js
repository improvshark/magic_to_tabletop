const CARD_SIZE = 'small'
const API_DELAY = 50
const DEBUG = document.location.host.indexOf('github') == -1

function delay(time) {
  return new Promise(resolve =>{
    setTimeout(()=> resolve(),time )
  })
}




class Deck {
  constructor(data, columns = 10, rows = 7) {
    if(columns > 10 || rows > 7)
      throw 'width or height too large'
    this.data = data
    this.rows = rows;
    this.columns = columns;
    this.fetchingData = Promise.resolve()
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext('2d')
  }

  static parseText(text){
    let reg = /(\d+)\s*(.+)\n?\r?/g
    let cards = []
    let m
    while ( m = reg.exec(text)) {
      cards.push({
        qty: m[1],
        name: m[2],
      })
    }
    return cards
  }

  static fetchCardData(cards){
    let data = cards.map(card => ({name: card.name}))
    return axios.post('https://api.scryfall.com//cards/collection',{
      identifiers: data
    }).then(response => {
      if(response.data.not_found && response.data.not_found.length > 0)
        throw 'could not find ' +  response.data.not_found.map(e => e.name).join(' ')
      return response.data.data
    })
  }

  static loadImage(url) {
    console.log('loading', url)
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`load ${url} fail`));
      img.src = url;
    });
  };

  loadImagesNice() {
    let result = Promise.resolve()
    let modifiedCardData = []
    this.data.forEach( (card, index) => {
      result = result
      .then(()=> delay(API_DELAY * index))
      .then(()=>Deck.loadImage(card.image_uris[CARD_SIZE]))
      .then(img => card.img = img)
    })
   return result.then(()=> this)
  }

  render(){
    let cards = this.data.slice().reverse()
    let cardWidth = cards[0].img.naturalWidth
    let cardHeight = cards[0].img.naturalHeight
    this.canvas.width  = cardWidth*this.columns
    this.canvas.height = cardHeight*this.rows

    let current, qty
    for(var i = 0; i < this.rows; i++) {
      for(var j = 0; j < this.columns; j++) {
        if(current && qty >0){
          qty--
        }else{
          current = cards.pop()
          if(!current)
            return // we are out of cards
          qty = current.qty - 1
        }
        if(!current.img)
          throw 'we are missing an image? what?'
          this.context.drawImage(current.img, cardWidth*j, cardHeight*i)
      }
    }
    // context.drawImage('https://cdn1.mtggoldfish.com/images/gf/back.jpg', cardWidth*(columns-1), cardHeight*(rows-1))
  }

  static create(unparsedText, width, height){
    let deck = Deck.parseText(unparsedText)
    return Deck.fetchCardData(deck).then(cardData => {
      // add our new data to the deck
      deck.forEach((card, index) => Object.assign(card, cardData[index]))
      deck = new Deck(deck, width, height)

      return deck.loadImagesNice(cardData)
      .catch(error => alert(error, 'Error'));

      return deck
    })
  }
}

function main() {
  let text = document.getElementById('text').value
  let container = document.getElementById('container')
  Deck.create(text).then( deck => {
    container.appendChild(deck.canvas)
    deck.render()
  })
}


document.addEventListener("DOMContentLoaded", function(event) {
  document.getElementById('text').placeholder = `Enter your decklist here in this format:
4 Rafiq of the Many
4 Fire // Ice
1 Marit Lage Token
1 Elspeth, Knight-Errant Emblem
1 Back
1 Test`

  if(DEBUG)
    document.getElementById('text').value = '4 Rafiq of the Many'
  document.getElementById("submit").addEventListener("click", main)
});
