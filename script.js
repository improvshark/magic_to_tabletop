const CARD_SIZE = 'small'
const API_DELAY = 50

function loadImage(url) {
  console.log('loading', url)
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`load ${url} fail`));
    img.src = url;
  });
};

function delay(time) {
  return new Promise(resolve =>{
    setTimeout(()=> resolve(),time )
  })
}

function loadImagesNice(cardData) {
  let result = Promise.resolve()
  let modifiedCardData = []
  cardData.forEach( (card, index) => {
    result = result.then(()=> delay(API_DELAY * index))
    .then(()=>loadImage(card.image_uris[CARD_SIZE])
    .then(img => {
      modifiedCardData.push(Object.assign({img:img}, card))
    }))
  })
 return result.then(()=>modifiedCardData)
}

function parseText(){
  let reg = /(\d+)\s*(.+)\n?\r?/g
  let text = document.getElementById('text').value
  let cards = []
  while (m = reg.exec(text)) {
    cards.push({
      qty: m[1],
      name: m[2],
    })
  }
  return cards
}
function fetchCardData(cards){
  let data = cards.map(card => ({name: card.name}))
  return axios.post('https://api.scryfall.com//cards/collection',{
    identifiers: data
  }).then(response => {
    if(response.data.not_found && response.data.not_found.length > 0)
      throw 'could not find ' +  response.data.not_found.join(' ')
    return response.data.data
  })
}

function build(cardList){
  cards = cardList.slice()
  canvas = document.createElement("canvas");
  context = canvas.getContext('2d');
  canvas.style = "width: 100%;position: absolute;"
  cardWidth = cardList[0].img.naturalWidth
  cardHeight = cardList[0].img.naturalHeight
  columns = 10;
  rows = 7
  canvas.width  = cardWidth*columns;
  canvas.height = cardHeight*rows;
  document.body.appendChild(canvas)

  let current
  for(var i = 0; i < rows; i++) {
    for(var j = 0; j < columns; j++) {
      if(i == rows-1 && j == columns-1)
        break
      if(current && current.qty >1){
        current.qty--
      }else{
        current = cards.pop()
      }
      if(current && current.img && i!= columns-1){
        context.drawImage(current.img, cardWidth*j, cardHeight*i)
      }
    }
  }
  console.log(columns-1, rows-1)
  // context.drawImage('https://cdn1.mtggoldfish.com/images/gf/back.jpg', cardWidth*(columns-1), cardHeight*(rows-1))
}


function main() {
  let cards = parseText()
  fetchCardData(cards).then(cardData => {
    // add our quantity to the cardData
    cardData.forEach((card, index) => card.qty = cards[index].qty)

    loadImagesNice(cardData).then(data => {
      console.log(data)
      build(data)
    })

  })
  .catch(error => alert(error));
}


document.addEventListener("DOMContentLoaded", function(event) {
  document.getElementById('text').placeholde = `Enter your decklist here in this format:
4 Rafiq of the Many
4 Fire // Ice
1 Marit Lage Token
1 Elspeth, Knight-Errant Emblem
1 Back
1 Test`
  document.getElementById('text').value = `2 Island
4 Manamorphose
1 Mountain
1 Noxious Revival
3 Opt
2 Past in Flames
4 Pyretic Ritual
2 Remand`

  document.getElementById("submit").addEventListener("click", main)
});
