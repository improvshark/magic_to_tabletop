
class Skryfall {

  backData = {
    image_uris: {
      art_crop:"",
      border_crop:"",
      large: 'img/back.large.jpg',
      normal: 'img/back.normal.jpg',
      png:'',
      small: 'img/back.small.jpg',
    }
  }

  delay(time) {
    return new Promise(resolve =>{
      setTimeout(()=> resolve(),time )
    })
  }


  fetchCardData(cards){
    let filtered = {}
    let requestData = []
    cards.forEach((card, index) => {
      if(card.name.trim().toLowerCase() === 'back')
        filtered[index] = Object.assign(card, this.backData)
      else
        requestData.push({name: card.name})
    });

    return axios.post('https://api.scryfall.com//cards/collection',{
      identifiers: requestData
    }).then(response => {
      if(response.data.not_found && response.data.not_found.length > 0)
        throw 'could not find ' +  response.data.not_found.map(e => e.name.trim()).join(' ')
      let result = response.data.data 
      Object.keys(filtered).forEach(index => result.splice(index,0,filtered[index]))
      return result
    })
  }

  cacheImg(url, img) {
    let imgReader = document.createElement("canvas");
    imgReader.width = img.naturalWidth
    imgReader.height = img.naturalHeight
    imgReader.getContext('2d').drawImage(img,0,0)
    lscache.set(url.split('?')[0],imgReader.toDataURL(), 60 * 24 * 7)
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
       img.crossOrigin="anonymous"
      let cacheImg = lscache.get(url.split('?')[0])

      img.onload = () => {
        if(!cacheImg)
          this.cacheImg(url, img)
        resolve(img)
      }
      img.onerror = () => reject(new Error(`load ${url} fail`));

      if(cacheImg){
        console.log('loading from cache', url)
        img.src = cacheImg
      } else {
        console.log('loading from scryfall', url)
        img.src = url;
      }
    });
  };

  loadBack(){
    return Deck.delay(API_DELAY * this.data.length)
    .then(() => this.loadImage(this.backData.image_uris[this.cardSize]))
    .then(img => this.backData.img = img)
  }
}

export let scryfall = new Skryfall();