const API_DELAY = 50
const DEBUG = document.location.host.indexOf('github') == -1


class Deck {
  constructor({data, columns, rows, back, cardSize}) {
    if(columns > 10 || rows > 7)
      throw 'width or height too large'

    this.data = data
    this.rows = rows
    this.columns = columns
    this.back = back
    this.cardSize = cardSize || 'small'

    this.fetchingData = Promise.resolve()
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext('2d')
    this.backData = {
      qty: 1,
      image_uris: {
        art_crop:"",
        border_crop:"",
        large:'https://cdn1.mtggoldfish.com/images/gf/back.jpg',
        normal:'https://cdn1.mtggoldfish.com/images/gf/back.jpg',
        png:'',
        small:'https://cdn1.mtggoldfish.com/images/gf/back.jpg',
      }
    }
  }

  static delay(time) {
    return new Promise(resolve =>{
      setTimeout(()=> resolve(),time )
    })
  }

  static parseText(text){
    let reg = /(\d+)\s*(.+)\n?\r?/g
    let cards = []
    let m
    while ( m = reg.exec(text)) {
      cards.push({
        qty: Number(m[1]),
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

  loadBack(){
    return Deck.delay(API_DELAY * this.data.length)
    .then(() => Deck.loadImage(this.backData.image_uris[this.cardSize]))
    .then(img => this.backData.img = img)
  }

  loadImagesNice() {
    let result = Promise.resolve()
    let modifiedCardData = []
    this.data.forEach( (card, index) => {
      result = result
      .then(()=> Deck.delay(API_DELAY * index))
      .then(()=>Deck.loadImage(card.image_uris[this.cardSize]))
      .then(img => card.img = img)
    })
    if(this.back)
      result = result.then(()=>this.loadBack())
   return result.then(()=> this)
  }

  length(){
    return this.data.reduce((prev, cur) => prev + cur.qty, 0)
  }

  autoSize(){
    let n = this.length()
    if(this.back)
      n++
    this.rows = Math.floor(Math.sqrt(n))
    this.rows = Math.min(this.rows, 10) // set a max of 10 rows
    while( n % this.rows != 0){
      this.rows--
      console.log(n,  n % this.rows != 0)
    }
    this.columns = n / this.rows
  }

  render(){
    let cards = this.data.slice().reverse()
    let cardWidth = cards[0].img.naturalWidth
    let cardHeight = cards[0].img.naturalHeight


    if(!this.rows || !this.columns)
      this.autoSize()

    if(this.back)
      cards.unshift(this.backData)

    console.log(this.columns, this.rows)
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
  }

  static create(unparsedText, options = {}){
    let parsedText = Deck.parseText(unparsedText)
    let data
    return Deck.fetchCardData(parsedText).then(cardData => {
      let data = cardData.map((card,index)=>Object.assign(card,parsedText[index]))
      let deck = new Deck(Object.assign({data}, options))
      return deck.loadImagesNice(cardData)
    })
  }
}

function main() {
  let includeBack = false
  let text = document.getElementById('text').value
  let container = document.getElementById('container')
  Deck.create(text,{
    back: document.getElementById('back').checked,
    cardSize: document.getElementById('size').value
  }).then( deck => {
    container.appendChild(deck.canvas)
    deck.render()
  })
  .catch(error => alert(error, 'Error'))
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
    document.getElementById('text').value = '25 Rafiq of the Many'
  document.getElementById("submit").addEventListener("click", main)
});
