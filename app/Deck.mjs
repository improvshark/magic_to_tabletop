import { scryfall } from '/app/SkryFall.mjs'

const API_DELAY = 50

export default class Deck {
  constructor({data, columns, rows, back, cardSize}) {
    this.data = data
    let length = this.length()
    if( columns && !rows)
      rows = Math.ceil( length / columns)
    else if( !columns && rows)
      columns = Math.ceil( length / rows)

    this.rows = rows
    this.columns = columns
    this.cardSize = cardSize || 'small'

    this.fetchingData = Promise.resolve()
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext('2d')
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


  loadImagesNice() {
    let result = Promise.resolve()
    let modifiedCardData = []
    this.data.forEach( (card, index) => {
      result = result
      .then(()=> Deck.delay(API_DELAY * index))
      .then(()=>scryfall.loadImage(card.image_uris[this.cardSize]))
      .then(img => card.img = img)
    })
    // if(this.back)
    //   result = result.then(()=>this.loadBack())
   return result.then(()=> this)
  }

  length(){
    return this.data.reduce((prev, cur) => prev + cur.qty, 0)
  }

  autoSize(){
    let n = this.length()
    this.rows = Math.floor(Math.sqrt(n))
    while( n % this.rows != 0){
      this.rows--
    }
    this.columns = n / this.rows
  }

  render(){
    let cards = this.data.slice().reverse()
    let cardWidth = cards[0].img.naturalWidth
    let cardHeight = cards[0].img.naturalHeight


    if(!this.rows || !this.columns)
      this.autoSize()

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
          this.context.drawImage(current.img, cardWidth*j, cardHeight*i, cardWidth, cardHeight)
      }
    }
  }

  static create(unparsedText, options = {}){
    if ('back' in options && options.back === true)
      unparsedText += '\n1 back'
    let parsedText = Deck.parseText(unparsedText)
    let data
    return scryfall.fetchCardData(parsedText).then(cardData => {
      let data = cardData.map((card,index)=>Object.assign(card,parsedText[index]))
      //make sure we are not missing images
      data = data.filter((card)=>{
        if (card.image_uris && card.image_uris[options.cardSize || 'small'])
          return true
        alert(card.name + ' is missing images', 'skipping')
        return false
      })
      let deck = new Deck(Object.assign({data}, options))
      return deck.loadImagesNice(cardData)
    })
  }
}
