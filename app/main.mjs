import Deck from '/app/Deck.mjs'

const DEBUG = document.location.host.indexOf('github') == -1

function main() {
  let includeBack = false
  let text = document.getElementById('text').value
  let container = document.getElementById('container')
  Deck.create(text,{
    back: document.getElementById('back').checked,
    cardSize: document.getElementById('size').value,
    rows: Number(document.getElementById('rows').value),
    columns: Number(document.getElementById('columns').value),
  }).then( deck => {
    container.prepend(deck.canvas)
    deck.render()
  })
  .catch(error => {
    alert(error, 'Error')
    throw error
  })
}


document.addEventListener("DOMContentLoaded", function(event) {
  document.getElementById('text').placeholder = `Enter your decklist here in this format:
4 Rafiq of the Many
4 Fire // Ice
1 Marit Lage Token
1 Elspeth, Knight-Errant Emblem
1 Back`

  if(DEBUG){
    document.getElementById('text').value = '59 Rafiq of the Many'
    document.getElementById('size').value = 'small'
    document.getElementById('back').checked = true
  }
  document.getElementById("submit").addEventListener("click", main)
})
