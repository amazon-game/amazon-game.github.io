let currentScene = 0, currentTheme = 0, params = {
  mode: 'bot',
  color: 'p1',
  boardSize: 6,
  score: 10
},
themes = [
  {
    bg: '#283044',
    main: '#c6c5b9',
    detail: '#fdfdffee',
    first: '#bfa89e',
    second: '#8b786d',
    shadow: '#00000033',
    dark: '#222222',
    light: '#dddddd'
  },
  {
    bg: '#442830',
    main: '#c6c5b9',
    detail: '#fdfdffee',
    first: '#bfa89e',
    second: '#8b786d',
    shadow: '#00000033',
    dark: '#222222',
    light: '#dddddd'
  },
  {
    bg: '#304428',
    main: '#c6c5b9',
    detail: '#fdfdffee',
    first: '#bfa89e',
    second: '#8b786d',
    shadow: '#00000033',
    dark: '#222222',
    light: '#dddddd'
  },
  {
    bg: '#333333',
    main: '#c6c5b9',
    detail: '#fdfdffee',
    first: '#bfa89e',
    second: '#8b786d',
    shadow: '#00000033',
    dark: '#222222',
    light: '#dddddd'
  },
  {
    bg: '#adadad',
    main: '#38383B',
    detail: '#424242ee',
    first: '#bfa89e',
    second: '#8b786d',
    shadow: '#00000033',
    dark: '#222222',
    light: '#dddddd'
  }
],
disableOption = [false, false, false]  // disable or enable something in settings

let col = themes[currentTheme]

class Field {
  grade = null
  #amountOfPossibleMoves
  constructor(size=6, settings=params) {
    this.size = size // board size (size)
    this.settings = settings

    this.restart()
  }

  restart() {
    this.map = []
    this.moveOnFieldFor = 'p1'
    this.gameOver = false
    this.delay = new Timer()
    this.linesAll = []

    for (let i = 0; i < this.size; i++) {
      let k = []
      for (let j = 0; j < this.size; j++) {
        k.push(new Square(j, i, 'empty'))
      }
      this.map.push(k)
    }

    for (let j = 0; j < 2; j++) {
      for (let i = 0; i < this.size/2-1; i++) { // amount of players (this.size/2-1)
        let x, y
        do {
          x = Math.floor(Math.random()*this.size)
          y = Math.floor(Math.random()*this.size)
        } while (this.map[y][x].type != 'empty')
        this.map[y][x].type = 'p'+j
      }
    }
  }

  setPosition(x, y, width) {
    this.x = x
    this.y = y
    this.width = width
    this.blockSize = this.width/this.size
  }

  drawField(color1, color2) {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        // set dark light colors plit
        push()
        if (this.map[i][j].type == 'shooted') {  // drawing accupated squares
          fill(col.bg)
          noFill()
          noStroke()
        }
        else if ((i+j) % 2 == 0) fill(color1)
        else fill(color2)

        // draw plit
        rect(this.x+j*this.blockSize, this.y+i*this.blockSize, this.blockSize)
        pop()
        push()
        noStroke()
        ;(()=>{
          let shape = 'crcl'
          if (this.map[i][j].selected) {  // drawing selected
            if (this.#playerActMoved  && !disableOption[1]) fill('#ffffff33')  // if shooting
            else if (!this.#playerActMoved && !disableOption[0]) fill('#00000033')  // if moving
            else {noFill(); noStroke()}
          } else if (i == this.#lastMy && j == this.#lastMx && this.map[i][j].type == this.moveOnFieldFor) {fill(col.shadow.slice(0, -2)+'33'); shape = 'sqr'}
          else return
          shape == 'crcl' ? circle(this.x+this.blockSize*(j+.5), this.y+this.blockSize*(i+.5), this.blockSize/2) :
          rect(this.x+this.blockSize*j, this.y+this.blockSize*i, this.blockSize)
        })()
        pop()
        // draw 'squares' (players)
        if (this.map[i][j].type.charAt(0) == 'p') { // drawing players
          this.map[i][j].drawSquare(this.blockSize, this.x, this.y)
        }

      }
      this.#drawLines(this.moveOnFieldFor == 'p1' ? col.dark : col.light, this.blockSize)
    }

  }

  aboutMap() {
    let res = {empty: 0, p0: 0, p1: 0, shooted: 0}
    this.map.forEach(y => {y.forEach(el => {
      res[el.type] += 1
    })})
    return res
  }

  #lastMx = -1
  #lastMy = -1
  #playerActMoved = false
  #directions = [  // from top left to top to top right to right ...
    {x: -1, y: -1},
    {x: 0, y: -1},
    {x: 1, y: -1},
    {x: 1, y: 0},
    {x: 1, y: 1},
    {x: 0, y: 1},
    {x: -1, y: 1},
    {x: -1, y: 0}
  ]

  run() {

    if (this.gameOver == true) {
      if (this.settings.mode == 'demoPlay') {
        this.delay.run()
        if (this.delay.time[1] >= 8) this.restart()
      }
      return
    }
    else if (this.#getAmountOfPossibleMovesForPlayer(this.moveOnFieldFor) === 0) {
      console.log('winner is ' + this.#changeMoveFor(this.moveOnFieldFor))
      this.gameOver = true
      if (this.settings.mode != 'bot') return
      let score = Math.floor(Math.abs(this.getGameFieldGrade())/5)*((this.getGameFieldGrade()/Math.abs(this.getGameFieldGrade())) || 1) + (this.#changeMoveFor(this.moveOnFieldFor) == 'p1' ? 1 : -1)
      if (this.settings.color == 'p0') score *= -1
      if (this.settings.score + score >= 0) this.settings.score += score
      else this.settings.score = 0
      this.delay.restart()
    } else if (this.settings.mode == 'bot' && this.moveOnFieldFor != this.settings.color || this.settings.mode == 'demoPlay') { //  && this.moveOnFieldFor != this.settings.color
      this.delay.run()
      if (this.delay.time[1] >= Math.floor(Math.random()*2)+1) {this.#botMove(this.moveOnFieldFor);this.delay.restart()}
      this.#lastMx = -1
      this.#lastMy = -1

    } else {
      this.mx = Math.floor((mouseX-this.x)/this.blockSize)  // get x;y on field
      this.my = Math.floor((mouseY-this.y)/this.blockSize)

      //select your amazons
      if (!this.#isValid(this.mx, this.my, this.size)) return  // checking border of all field
      else if (mouseIsPressed && this.map[this.my][this.mx].type == this.settings.color && this.moveOnFieldFor == this.settings.color) {
        this.#clearAllSelected() // redraw selected square
        if(this.#playerActMoved == false) {  // update mouse coordinates
          this.#lastMx = this.mx
          this.#lastMy = this.my
        }
        this.#showSelected()
      } else if (mouseIsPressed && this.map[this.my][this.mx].selected == false && this.#playerActMoved == false) { // if clicked on not selected square -> clear field
        this.#clearAllSelected()
        this.#lastMx = this.mx
        this.#lastMy = this.my
      } else if (mouseIsPressed && this.map[this.my][this.mx].selected == true && this.#playerActMoved == false) {  // checking:can move on this square ?
        this.#moveSquareFromTo(this.#lastMx, this.#lastMy, this.mx, this.my)
        this.#addLine(this.#lastMx, this.#lastMy)
        this.#playerActMoved = true
        this.#lastMx = this.mx
        this.#lastMy = this.my
        this.#addLine(this.#lastMx, this.#lastMy)
        this.#clearAllSelected()
        this.#showSelected()
      } else if (this.#playerActMoved == true && mouseIsPressed && this.map[this.my][this.mx].selected == true) {  // after moved
        this.#shootSquare(this.mx, this.my)
        this.#addLine(this.mx, this.my)
        this.#clearAllSelected()

        this.moveOnFieldFor = this.#changeMoveFor(this.moveOnFieldFor)
        if (this.settings.mode == 'player') this.settings.color = this.moveOnFieldFor
        this.#playerActMoved = false

      }
    }
  }

  getGameFieldGrade() {
    return this.#getAmountOfControlledSquaresByPlayer('p1') - this.#getAmountOfControlledSquaresByPlayer('p0')
  }
  #getAmountOfControlledSquaresByPlayer(playerColor) {
    let ar = []
    this.#getArrayOfMoves(playerColor).forEach(object => {ar = concat(ar, object.moves)}) // concat array of moves
    return ar.filter((value, index, self) => index === self.findIndex((t) => (t.x === value.x && t.y === value.y))) // delete all same positions ,this part from (https://stackoverflow.com/questions/2218999/how-to-remove-all-duplicates-from-an-array-of-objects)
      .length
    }

    #changeMoveFor(forString) { // only use with p0 and p1
      return 'p'+Number(Number(forString.charAt(1)) != 1)
    }

    #getAmountOfPossibleMovesForPlayer(playerColor) {
      let allPositions = []
      let amountOfPossibleMoves = 0

      this.map.forEach(element => element.forEach(object => {
        if (object.type == playerColor) allPositions.push(object)
      }))
      allPositions.forEach(foundElement => {
        amountOfPossibleMoves += this.#getMovesByCoordinats(foundElement.x, foundElement.y).length
      })
      return amountOfPossibleMoves
    }

    #showSelected() {
      let selectedMoves = this.#getMovesByCoordinats(this.#lastMx, this.#lastMy)
      this.map.forEach(element => element.forEach(elementIn => {
        selectedMoves.forEach(object => {
          if (elementIn.x == object.x && elementIn.y == object.y) this.map[elementIn.y][elementIn.x].selected = true
        })
      }))
    }

    #addLine(x, y) {
      this.linesAll.push(this.#newPointOnField(x, y, this.moveOnFieldFor))
    }

    #moveSquareFromTo(xFrom, yFrom, xTo, yTo) {
      [this.map[yTo][xTo].type, this.map[yFrom][xFrom].type] = [this.map[yFrom][xFrom].type, 'empty']
    }
    #shootSquare(x, y) {
      this.map[y][x].type = 'shooted'
    }
    #unShootSquare(x, y) {
      this.map[y][x].type = 'empty'
    }

    #clearAllSelected() {
      this.map.forEach(element => element.forEach(elementIn => elementIn.selected = false))
    }

    #isValid(x, y, size) {
      if (x < 0 || x >= size || y < 0 || y >= size) return false
      else return true
    }

    #botMove(playerColor) {
      this.#searchMove(playerColor, 1) // problem with depth *(dont return correct moves) **(only works with depth = 1)

      // moving
      this.#addLine(this.path.pieceX, this.path.pieceY)
      this.#moveSquareFromTo(this.path.pieceX, this.path.pieceY, this.path.moveX, this.path.moveY)
      this.#addLine(this.path.moveX, this.path.moveY)
      // shooting
      this.#shootSquare(this.path.shootPointX, this.path.shootPointY)
      this.#addLine(this.path.shootPointX, this.path.shootPointY)


      this.moveOnFieldFor = this.#changeMoveFor(this.moveOnFieldFor)
    }

    #searchMove(playerColor, depth) {
      let playerSide = Number(playerColor.charAt(playerColor.length-1))
      if (playerSide == 0) playerSide = -1
      if (depth == 0) return this.getGameFieldGrade()

      let piecesMoves = this.#getArrayOfMoves(playerColor)

      let bestEvaluation = Infinity*playerSide
      piecesMoves.forEach(piece => {
        piece.moves.forEach(move => {
          this.#moveSquareFromTo(piece.x, piece.y, move.x, move.y)
          this.#getMovesByCoordinats(move.x, move.y).forEach(shootPoint => {

            this.#shootSquare(shootPoint.x, shootPoint.y)
            let evaluation = -this.#searchMove(playerColor, depth - 1)
            if (evaluation*playerSide < bestEvaluation*playerSide) {
              bestEvaluation = evaluation
              this.path = {pieceX: piece.x, pieceY: piece.y, moveX: move.x, moveY: move.y, shootPointX: shootPoint.x, shootPointY: shootPoint.y}
            }


            this.#unShootSquare(shootPoint.x, shootPoint.y)
            playerColor = this.#changeMoveFor(playerColor)

          })
          this.#moveSquareFromTo(move.x, move.y, piece.x, piece.y)

        })

      })
    }

    #getArrayOfMoves(playerColor) {
      let allPoints = []
      let sortedByPieces = []
      this.map.forEach(element => element.forEach(object => {
        if (object.type == playerColor) allPoints.push(object)
      }))

      allPoints.forEach(foundElement => {
        let moves = this.#getMovesByCoordinats(foundElement.x, foundElement.y)
        if (moves.length != 0) {sortedByPieces.push({x: foundElement.x, y: foundElement.y, moves: moves})}
      })

      return sortedByPieces
    }

    #getMovesByCoordinats(x, y) {
      let possiblePointsToMove = []
      for (let i = 0; i < this.#directions.length; i++) {

        let increment = 1

        while (this.#isValid(x+increment*this.#directions[i].x, y+increment*this.#directions[i].y, this.size)) {
          if (this.map[y+this.#directions[i].y*increment][x+this.#directions[i].x*increment].type == 'empty') {
            possiblePointsToMove.push(this.#newPointOnField(x+increment*this.#directions[i].x, y+increment*this.#directions[i].y, this.moveOnFieldFor))
            increment++
          }
          else break
        }
      }
      return possiblePointsToMove
    }

    #drawLines(color, size) {
      if (disableOption[2]) return
      push()
      if (this.linesAll.length % 3 == 0 && this.linesAll.length > 0 && !(this.settings.mode == 'bot' && this.moveOnFieldFor != this.settings.color)) {
        stroke(color+'22') // +col.shadow.slice(-2)
        noFill()
        strokeWeight(size/12)
        for (let i = 3; i > 1; i--) {
          let l = this.linesAll.length
          line(this.linesAll[l-i].x*size+size/2+this.x, this.linesAll[l-i].y*size+size/2+this.y, this.linesAll[l-i+1].x*size+size/2+this.x, this.linesAll[l-i+1].y*size+size/2+this.y)
          if (i == 3) {
            circle(this.linesAll[l-i].x*size+size/2+this.x, this.linesAll[l-i].y*size+size/2+this.y, size/2)
          } else if (i = 2) {
            rect(this.linesAll[l-i+1].x*size+size/4+this.x, this.linesAll[l-i+1].y*size+size/4+this.y, size/2)
          }
        }
      }
      pop()
    }

    #newPointOnField(x, y, playerColor) {
      return {x: x, y: y, for: playerColor}
    }

  }

class Ui {
    textSizeSmall
    textSizeMedium

    update() {
      this.textSizeSmall = width/32
      this.textSizeMedium = this.textSizeSmall*2
    }

    pushShadow(x=10, y=10, blur = 0, color=col.shadow) {
      drawingContext.shadowOffsetX = x
      drawingContext.shadowOffsetY = y
      drawingContext.shadowBlur = blur
      drawingContext.shadowColor = color
    }
    popShadow() {
      drawingContext.shadowColor = '#00000000'
    }
  }

class Square extends Ui {
    constructor(x, y, type = 'empty') {
      super(x, y, type)
      this.x = x
      this.y = y
      this.type = type
    }

    drawSquare(blockSize, offsetX, offsetY, color1=col.light, color2=col.dark) {
      if (this.type.charAt(1) == 0) {
        fill(color2)
      } else if (this.type.charAt(1) == 1) {
        fill(color1)
      }
      push()
      noStroke()
      super.pushShadow(undefined, undefined, 10)
      circle(this.x*blockSize+offsetX+blockSize/2, this.y*blockSize+offsetY+blockSize/2, blockSize/1.5)
      pop()
      // push()
      // noFill()
      // super.pushShadow()
      // circle(this.x*blockSize+offsetX+blockSize/2, this.y*blockSize+offsetY+blockSize/2, blockSize/1.5)
      // pop()

      super.popShadow()
    }
  }

class TextZone extends Ui {
    constructor(text='') {
      super(text)
      this.text = text

    }

    drawText(color, x, y, w=-1, s=this.size) {
      // this.xt = x
      // this.yt = y

      push()
      noStroke()
      textSize(s)
      fill(color)
      textAlign(CENTER, CENTER)
      if (w == -1) text(this.text, x, y)
      else text(this.text, x, y, w)
      pop()
    }

    setSize(size=1) {
      super.update()
      if (size == 0) this.size = this.textSizeSmall/1.2
      else if (size == 1) this.size = this.textSizeSmall
      else if (size == 2) this.size = this.textSizeMedium/1.5
      else if (size == 3) this.size = this.textSizeMedium
      else {console.error('Size only can be [0, 1, 2, 3]'); noLoop()}

    }

  }

class Button extends TextZone {
    hovered = false
    textColor = '#000'

    setTextColor(color) {
      this.textColor = color
    }
    useShadow(color, x=10, y=10) {
      this.shadow = [color, x, y]
    }
    setPosition(x, y, w, h) {
      this.x = x-w/2
      this.y = y-h/2
      this.w = w
      this.h = h
    }

    draw(color, hoverColor=color, borderRadius_tl=10, borderRadius_tr=10, borderRadius_br=10, borderRadius_bl=10) {
      this.setTextColor(col.bg)
      this.useShadow(col.shadow)
      push()
      if (mouseX >= this.x && mouseX <= this.x+this.w && mouseY >= this.y && mouseY <= this.y+this.h) {fill(hoverColor);this.hovered = true}
      else {fill(color);this.hovered = false}
      super.pushShadow(undefined, undefined, 10)
      push()
      noStroke()
      rect(this.x, this.y, this.w, this.h, borderRadius_tl, borderRadius_tr, borderRadius_br, borderRadius_bl)
      pop()
      // push()
      // noFill()
      // super.pushShadow()
      // rect(this.x, this.y, this.w, this.h, borderRadius_tl, borderRadius_tr, borderRadius_br, borderRadius_bl)
      // pop()
      super.popShadow()
      super.update()
      let currentTextSize = this.h*.65
      if (mouseIsPressed && this.hovered) {fill('#00000033');rect(this.x, this.y, this.w, this.h, borderRadius_tl, borderRadius_tr, borderRadius_br, borderRadius_bl);
      currentTextSize *=.9}
      super.drawText(this.textColor, this.x, this.y+this.h/2, this.w, currentTextSize)
      pop()
    }

    mouseIsReleased = false
    isButtonPressed() {
      // console.log(this);
      if (this.hovered && mouseIsPressed) {this.mouseIsReleased = true; return false}
      else if (this.mouseIsReleased && !mouseIsPressed && this.hovered) {this.mouseIsReleased = false;return true}
      else {this.mouseIsReleased = false;return false}
    }

  }

class Timer {
  constructor() {
    this.time = [0, 0]
    this.restartTime = true
    this.date = Infinity
  }

  setPosition(x, y, w) {
    this.x = x
    this.y = y
    this.w = w
  }

  draw() {
    let clockText = new TextZone(`${this.time[0] < 10 ? '0'+this.time[0] : this.time[0]}:${this.time[1] < 10 ? '0'+this.time[1] : this.time[1]}`)
    clockText.setSize(3)
    clockText.drawText(col.main, this.x, this.y, this.w)
  }

  run() {
    let currentDate = Date.now()
    if (this.restartTime) {
      this.restartTime = false
      this.date = Date.now()
    }

    if (currentDate - this.date >= 1000) {
      this.time[1] += 1
      if (this.time[1] >= 60) {
        this.time[1] = 0
        this.time[0]++
      }
      this.restartTime = true
    }
  }

  restart() {
    this.restartTime = true
    this.time = [0, 0]
  }
}

class AnimationAR {  // amount and rows for 'AR'
    constructor(amount, rows) {
      this.objects = []
      this.amount = amount
      this.rows = rows
      this.generate()
    }

    update() {
      this.constHeight = height/this.rows
    }

    generate() {
      let total = this.amount
      while (total > 0) {
        this.objects.push(this.getRandomParticle(0, 'randomly'))
        total--
      }
    }

    getRandomParticle(side=0, type='zeroStart') {
      let w = 1/this.amount+Math.random()/(this.amount*2)
      let randX = type == 'zeroStart' ? (side == 1 ? 1 : -w) : Math.random()
      let randY = floor(Math.random() * this.rows)/this.rows
      return new Particle(Math.random()+1, randX, randY, w)
    }

    draw(color) {
      push()
      for (let i = 0; i < this.objects.length; i++) {
        let el = this.objects[i]
        fill(color)
        noStroke()

        if (currentTheme == 0 || currentTheme == 4) rect(el.x*width, el.y*height, el.w*width, this.constHeight)
        else if (currentTheme == 1) {
          push()
          translate(el.x*width+el.w*width/2, el.y*height+this.constHeight/2)
          rotate(radians(el.angle))
          el.angle += el.angleSpeed/10
          rect(-el.w*width/2, -this.constHeight/2, el.w*width, this.constHeight)
          pop()
        } else if (currentTheme == 2) {

          el.dir == 1 ?
          triangle(el.x*width, el.y*height, el.x*width, el.y*height+this.constHeight, el.x*width+(Math.sqrt(this.constHeight**2-((this.constHeight**2)/4))), el.y*height+this.constHeight/2)
          :
          triangle(el.x*width+el.w*width, el.y*height, el.x*width+el.w*width, el.y*height+this.constHeight, el.x*width+el.w*width-(Math.sqrt(this.constHeight**2-((this.constHeight**2)/4))), el.y*height+this.constHeight/2)

        } else if (currentTheme == 3) {
          circle(el.x*width+this.constHeight/2, el.y*height+this.constHeight/2, this.constHeight)

          }

          el.x += 1/width*el.speed*(currentTheme == 2 ? el.dir : (currentTheme == 3 ? 0 : (currentTheme == 4 ? -1 : 1)))
          if (el.x > 1) this.objects[i] = this.getRandomParticle()
          else if (el.x < -el.w) this.objects[i] = this.getRandomParticle(1)
        }
        pop()
      }

    }

class Particle {
      constructor(speed, x, y, w, h, color) {
        this.dir = Math.random() > .5  ? 1 : -1
        this.angle = 0
        this.angleSpeed = (Math.random()+1)*(Math.random() > .5  ? 1 : -1)
        this.speed = speed
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        this.color = color
      }


    }
    // initialize all stuff
let btn1,btn2, playBtnText, chooseRivalText, rivalBtn1, rivalBtn2,
  chooseRivalShow,chooseColorText, colorBtn1, colorBtn2, chooseColorShow,chooseBoardText,
  boardBtn1, boardBtn2,boardBtn3, chooseBoardShow, demoField, backBtn, gameField, switchMoves, switchShoots,
  switchLines, wallAnimation, resignBtn, rulesBtn, rulesTextHead, rulesText, textWinner, clocks, editorBtn,
  brush1, brush2, brush3, brush4, playButton
    // scenes
const firstScene =(sideSmall, sideLarge)=> {

      /// demo zone
      fill(255)
      demoField.setPosition(width-height < 0 ? 0 : width-height, 0, sideSmall)
      demoField.drawField(col.first, col.second)
      demoField.run()

      btn1.setPosition(((sideLarge-sideSmall)-btn1.w)/2, sideSmall/2, sideLarge/10, sideLarge/10)
      btn1.draw(col.main, col.detail)

      btn2.setPosition(btn2.w/2+0, height-btn2.h/2, sideLarge/6, sideSmall/12)
      btn2.draw(col.main, col.detail, 0, undefined, 0, 0)

      rulesBtn.setPosition(btn2.w/2+0, btn2.h/2, sideLarge/6, sideSmall/12)
      rulesBtn.draw(col.main, col.detail, 0, 0, undefined, 0)

      playBtnText.setSize(3)
      playBtnText.drawText(col.main, btn1.x+1.75*btn1.w, btn1.y+.5*btn1.h)

      if (btn1.isButtonPressed()) currentScene = 1
      else if (btn2.isButtonPressed()) currentScene = 2
      else if (rulesBtn.isButtonPressed()) currentScene = 4

    }

const secondScene =(sideSmall, sideLarge)=> {

    chooseRivalText.setSize(1)
    chooseRivalShow.setSize(1)

    if (chooseRivalShow.text == 'bot') {
      fill(col.first+'55')
      rect(0, 0, width/2, height/2)
      fill(col.second+'55')
      rect(width/2, 0, width/2, height/2)

      chooseColorText.setSize(1)
      chooseColorText.drawText(col.main, width/2, chooseColorText.size*1.5, width/2)

      colorBtn1.setPosition(width/2+width/8, height/4, width/8, height/16)
      colorBtn1.draw(col.main, col.detail)

      colorBtn2.setPosition(width/2+.75*width/2, height/4, width/8, height/16)
      colorBtn2.draw(col.main, col.detail)

      chooseColorShow.setSize(1)
      if (colorBtn1.isButtonPressed()) {params.color = 'p0';chooseColorShow.text = 'black'}
      else if (colorBtn2.isButtonPressed()) {params.color = 'p1';chooseColorShow.text = 'white'}
      chooseColorShow.drawText(col.main+'55', width/2, height/2-chooseRivalShow.size*1.5, width/2)

    }
    // ctrl+C ctrl+V
    // second div??
    if (chooseRivalShow.text == 'player') {
      fill(col.first+'55')
      rect(0, 0, width, height/2)

      rivalBtn1.setPosition(width/2-width/8, height/4, width/8, height/16)
      rivalBtn2.setPosition(width/2+width/8, height/4, width/8, height/16)
      chooseRivalShow.drawText(col.main+'55', 0, height/2-chooseRivalShow.size*1.5, width)
      chooseRivalText.drawText(col.main, 0, chooseRivalText.size*1.5, width)
      params.color = 'p1'
    } else {
      rivalBtn1.setPosition(width/8, height/4, width/8, height/16)
      rivalBtn2.setPosition(.75*width/2, height/4, width/8, height/16)
      chooseRivalShow.drawText(col.main+'55', 0, height/2-chooseRivalShow.size*1.5, width/2)
      chooseRivalText.drawText(col.main, 0, chooseRivalText.size*1.5, width/2)
    }

    rivalBtn1.draw(col.main, col.detail)

    rivalBtn2.draw(col.main, col.detail)


    if (rivalBtn1.isButtonPressed()) chooseRivalShow.text = 'bot'
    else if (rivalBtn2.isButtonPressed()) chooseRivalShow.text = 'player'
    else params.mode = chooseRivalShow.text

    // board size
    chooseBoardText.setSize(1)
    chooseBoardText.drawText(col.main, 0, height/2+chooseBoardText.size*1.5, width)

    boardBtn1.setPosition(width/2+width/4, height-height/4, width/16, height/16)
    boardBtn1.draw(col.main, col.detail)

    boardBtn2.setPosition(width/2-width/4, height-height/4, width/16, height/16)
    boardBtn2.draw(col.main, col.detail)

    boardBtn3.setPosition(width/2, height-height/4, width/6, height/6)
    boardBtn3.draw(col.main, col.detail)

    if (boardBtn1.isButtonPressed() && params.boardSize < 10) params.boardSize += 2
    else if (boardBtn2.isButtonPressed() && params.boardSize > 6) params.boardSize -= 2
    else if (boardBtn3.isButtonPressed()) {currentScene = 3; gameField = new Field(params.boardSize)}
    else boardBtn3.text = ' '+params.boardSize

    chooseBoardShow.setSize(1)
    chooseBoardShow.drawText(col.main+'55', 0, height-chooseBoardShow.size*1.5, width)
    // editor btn
    editorBtn.setPosition(width-editorBtn.w/2+0, height-editorBtn.h/2, sideLarge/6, sideSmall/12)
    editorBtn.draw(col.main, col.detail, undefined, 0, 0, 0)

    // back btn
    backBtn.setPosition(backBtn.w/2+0, height-backBtn.h/2, sideLarge/8, sideSmall/12)
    backBtn.draw(col.main, col.detail, 0, undefined, 0, 0)

    if (backBtn.isButtonPressed()) currentScene = 0
    else if (editorBtn.isButtonPressed()) {currentScene = 5; gameField = new Field(params.boardSize)}

}

const thirdScene =(sideSmall, sideLarge)=> {
      // themes
      demoField.setPosition(width/2-demoField.width/2, 0, height/2, height/2)
      demoField.drawField(col.first, col.second)

      // theme's buttons
      boardBtn1.setPosition(width/2+width/4, height/4, width/16, height/16)
      boardBtn1.draw(col.main, col.detail)

      boardBtn2.setPosition(width/2-width/4, height/4, width/16, height/16)
      boardBtn2.draw(col.main, col.detail)

      if (boardBtn1.isButtonPressed() && currentTheme < themes.length-1) col = themes[++currentTheme]
      else if (boardBtn2.isButtonPressed() && currentTheme > 0) col = themes[--currentTheme]

      // switches
      switchMoves.setPosition(width/4-switchMoves.w/2, height-height/4, width/6, height/8)
      switchMoves.draw(col.main, col.detail)

      switchShoots.setPosition(width/2, height-height/4, width/6, height/8)
      switchShoots.draw(col.main, col.detail)

      switchLines.setPosition(width-width/4+switchLines.w/2, height-height/4, width/6, height/8)
      switchLines.draw(col.main, col.detail)

      if (switchMoves.isButtonPressed()) disableOption[0] = !disableOption[0]
      else if (switchShoots.isButtonPressed()) disableOption[1] = !disableOption[1]
      else if (switchLines.isButtonPressed()) disableOption[2] = !disableOption[2]

      // switches text
      switchMovesText.setSize(1)
      switchMovesText.text = disableOption[0] ? 'off' : 'on'
      switchMovesText.drawText(col.main+'55', 0, height-switchMovesText.size*1.5, width/3)

      switchShootsText.setSize(1)
      switchShootsText.text = disableOption[1] ? 'off' : 'on'
      switchShootsText.drawText(col.main+'55', 0, height-switchMovesText.size*1.5, width)

      switchLinesText.setSize(1)
      switchLinesText.text = disableOption[2] ? 'off' : 'on'
      switchLinesText.drawText(col.main+'55', width-width/3, height-switchMovesText.size*1.5, width/3)

      graphicsText.setSize(1)
      graphicsText.drawText(col.main, 0, graphicsText.size*1.5+height/2, width)
      themesText.setSize(2)
      themesText.drawText(col.main, width-4*textWidth(themesText.text), 1*themesText.size)

      // back btn
      backBtn.setPosition(backBtn.w/2+0, backBtn.h/2, sideLarge/8, sideSmall/12)
      backBtn.draw(col.main, col.detail, 0, 0, undefined, 0)

      if (backBtn.isButtonPressed()) currentScene = 0
      // lines
      push()
      line(0, height/2, width, height/2)
      pop()

    }

const fourthScene =(sideSmall, sideLarge)=> {

      let sideDelta = sideLarge-sideSmall
      gameField.setPosition(0, 0, sideSmall)
      gameField.drawField(col.first, col.second)
      gameField.run()

      if (params.mode == 'bot') {
        textScore.setSize(1)
        textScore.text = 'Score: ' + params.score*10
        textScore.drawText(col.main, sideSmall, 1.5*textScore.size, sideDelta)
      }

      if (gameField.gameOver) {
        clocks.restart()
        textWinner.setSize(2)
        textWinner.text = gameField.moveOnFieldFor == 'p1' ? 'Winner is black' : 'Winner is White'
        textWinner.drawText(col.main, sideSmall, 6*textWinner.size, sideDelta)

        restartBtn.setPosition(sideSmall+sideDelta/2, height-height/4, height/6, height/6)
        restartBtn.draw(col.main, col.detail)

        if (restartBtn.isButtonPressed()) currentScene = 1
      } else {
        if (params.mode != 'bot') {
          textWinner.setSize(2)
          textWinner.text = 'Move for: '
          textWinner.drawText(col.main, sideSmall, 4*textWinner.size, sideDelta)
          let icon = new Square(0,0, gameField.moveOnFieldFor)
          icon.drawSquare(height/6, sideSmall+sideDelta/2-height/12, 5*textWinner.size)
        } else {
          clocks.setPosition(sideSmall, height/2.5, sideDelta)
          clocks.draw()
          if (gameField.moveOnFieldFor == params.color) clocks.run()
        }
        // resign btn
        resignBtn.setPosition(width-resignBtn.w/2+0, height-resignBtn.h/2, sideLarge/8, sideSmall/12)
        resignBtn.draw(col.main, col.detail, undefined, 0, 0, 0)

        if (resignBtn.isButtonPressed()) {params.score <= 1 ? undefined : params.score -= 2; currentScene = 1; clocks.restart()}
      }


    }

const fifthScene =(sideSmall, sideLarge)=> {
  rulesTextHead.setSize(1)
  rulesTextHead.drawText(col.main, 0, rulesTextHead.size, width)

  rulesText.setSize(0)
  rulesText.drawText(col.main, 2*rulesText.size, rulesText.size*3, width-4*rulesText.size)
  // back btn
  backBtn.setPosition(backBtn.w/2+0, height-backBtn.h/2, sideLarge/8, sideSmall/12)
  backBtn.draw(col.main, col.detail, 0, undefined, 0, 0)

  if (backBtn.isButtonPressed()) currentScene = 0
}

let activeBrush = 3
const sixthScene =(sideSmall, sideLarge)=> {
  let widthBar = height/6
  let fieldSide = sideSmall-widthBar
  let btnsWidth = fieldSide/8
  push()
  noFill()
  rect(width/2-fieldSide/2, 0, fieldSide)
  pop()
  gameField.setPosition(width/2-fieldSide/2, 0, fieldSide)
  gameField.drawField(col.first, col.second)

  // showing active brush
  push()
  fill('#ffffff33')
  rect((width-fieldSide)/2+activeBrush/4*fieldSide, fieldSide, 1/4*fieldSide)
  pop()
  // brushes
  let icon = new Square(0, 0, 'p1')
  brush1.setPosition((width-fieldSide*(1-2*0/4-1/4))/2, fieldSide+widthBar/2, btnsWidth, widthBar/2)
  brush1.draw(col.main, col.detail)
  icon.drawSquare(widthBar/3, (width-fieldSide*(1-2*0/4-1/4))/2-widthBar/6, fieldSide+widthBar/2-widthBar/6)

  icon = new Square(0, 0, 'p0')
  brush2.setPosition((width-fieldSide*(1-2*1/4-1/4))/2, fieldSide+widthBar/2, btnsWidth, widthBar/2)
  brush2.draw(col.main, col.detail)
  icon.drawSquare(widthBar/3, (width-fieldSide*(1-2*1/4-1/4))/2-widthBar/6, fieldSide+widthBar/2-widthBar/6)

  brush3.setPosition((width-fieldSide*(1-2*2/4-1/4))/2, fieldSide+widthBar/2, btnsWidth, widthBar/2)
  brush3.draw(col.main, col.detail)
  push()
  fill(col.first)
  rect((width-fieldSide*(1-2*2/4-1/4))/2-widthBar/12, fieldSide+widthBar/2-widthBar/12, widthBar/6)
  pop()

  brush4.setPosition((width-fieldSide*(1-2*3/4-1/4))/2, fieldSide+widthBar/2, btnsWidth, widthBar/2)
  brush4.draw(col.main, col.detail)
  push()
  fill(col.bg)
  noStroke()
  rect((width-fieldSide*(1-2*3/4-1/4))/2-widthBar/12, fieldSide+widthBar/2-widthBar/12, widthBar/6)
  pop()

  // btns

  if (brush1.isButtonPressed()) activeBrush = 0
  else if (brush2.isButtonPressed()) activeBrush = 1
  else if (brush3.isButtonPressed()) activeBrush = 2
  else if (brush4.isButtonPressed()) activeBrush = 3

  // mouse

  if (mouseIsPressed && mouseX > (width-fieldSide)/2 && mouseX < width-(width-fieldSide)/2 && mouseY > 0 && mouseY < fieldSide) {
    let mx = Math.floor((mouseX-(width-fieldSide)/2)/(fieldSide/params.boardSize))
    let my = Math.floor(mouseY/(fieldSide/params.boardSize))

    switch (activeBrush) {
      case 0:
      gameField.map[my][mx].type = 'p1'
      break
      case 1:
      gameField.map[my][mx].type = 'p0'
      break
      case 2:
      gameField.map[my][mx].type = 'empty'
      break
      case 3:
      gameField.map[my][mx].type = 'shooted'
      break
    }
  }

  // back btn
  backBtn.setPosition(backBtn.w/2+0, height-backBtn.h/2, sideLarge/8, sideSmall/12)
  backBtn.draw(col.main, col.detail, 0, undefined, 0, 0)
  // play this position btn
  playButton.setPosition(width-backBtn.w/2+0, height-backBtn.h/2, sideLarge/8, sideSmall/12)
  playButton.draw(col.main, col.detail, undefined, 0, 0, 0)

  if (backBtn.isButtonPressed()) currentScene = 1
  else if (playButton.isButtonPressed() && gameField.aboutMap().p0 > 0 && gameField.aboutMap().p1 > 0) currentScene = 3
}

const warningScene =()=> {
      push()
      noStroke()
      fill(col.main)
      textSize(width/10)
      textAlign(CENTER, CENTER)
      text('use horizontal orientation', 0, height/2, width)
      pop()
    }

function setup() {
      mouseX = -1
      mouseY = -1
      strokeJoin(ROUND)
      // all stuff
      wallAnimation = new AnimationAR(20, 10)

      btn1 = new Button(' ▶') // PLAY  btn
      btn2 = new Button('Settings') // settings
      playBtnText = new TextZone('Play') // PLAY  btn text
      demoField = new Field(6, {color: 'p1', mode: 'demoPlay', boardSize: 6, score: null})
      rulesBtn = new Button('rules')

      chooseRivalText = new TextZone('Choose your rival') //
      rivalBtn1 = new Button('Bot') // rival btn
      rivalBtn2 = new Button('Friend') // rival btn
      chooseRivalShow = new TextZone(params.mode) // showing rival below

      chooseColorText = new TextZone('Choose your color') //
      colorBtn1 = new Button('black') // color btn
      colorBtn2 = new Button('white') // color btn
      chooseColorShow = new TextZone(params.color == 'p1' ? 'white' : 'black') // showing color below

      editorBtn = new Button('Edit board')
      brush1 = new Button('')
      brush2 = new Button('')
      brush3 = new Button('')
      brush4 = new Button('')
      playButton = new Button('Play')

      chooseBoardText = new TextZone('Board size') //
      boardBtn1 = new Button(' ▶') // board btn ++
      boardBtn2 = new Button('◀') // board btn --
      boardBtn3 = new Button(' '+params.boardSize) // board btn --
      chooseBoardShow = new TextZone('tap to start') // showing board below
      backBtn = new Button('back') // settings

      textWinner = new TextZone('')
      textScore = new TextZone('')
      restartBtn = new Button(' ⟳')
      resignBtn = new Button('resign')
      clocks = new Timer()

      switchMoves = new Button('moves')
      switchShoots = new Button('shoots')
      switchLines = new Button('lines')

      switchMovesText = new TextZone('on')
      switchShootsText = new TextZone('on')
      switchLinesText = new TextZone('on')

      graphicsText = new TextZone('Graphics')
      themesText = new TextZone('Themes')

      rulesTextHead = new TextZone('Rules')
      rulesText = new TextZone('White moves first, and the players alternate moves thereafter. Each move consists of two parts. First, one moves one of one\'s own amazons one or more empty squares in a straight line (orthogonally or diagonally), exactly as a queen moves in chess; it may not cross or enter a square occupied by an amazon of either color or an arrow. Second, after moving, the amazon shoots an arrow from its landing square to another square, using another queenlike move. This arrow may travel in any orthogonal or diagonal direction (even backwards along the same path the amazon just traveled, into or across the starting square if desired). An arrow, like an amazon, cannot cross or enter a square where another arrow has landed or an amazon of either color stands. The square where the arrow lands is marked to show that it can no longer be used. The last player to be able to make a move wins. Draws are impossible. ')

    }

function draw() {
      createCanvas(windowWidth, windowHeight)
      background(col.bg)
      stroke(col.shadow)
      strokeWeight(height/450)

      wallAnimation.update()
      wallAnimation.draw((currentTheme != 4 ? '#ffffff04' : '#00000010'))

      if (width/height < 5/3) {warningScene(); return}

      switch (currentScene) {
        case 0: // main screen
        firstScene(Math.min(width, height), Math.max(width, height))
        break;
        case 1: // playSettings
        secondScene(Math.min(width, height), Math.max(width, height))
        break;
        case 2: // settings
        thirdScene(Math.min(width, height), Math.max(width, height))
        break;
        case 3: // game
        fourthScene(Math.min(width, height), Math.max(width, height))
        break;
        case 4: // rules
        fifthScene(Math.min(width, height), Math.max(width, height))
        break;
        case 5: // editor
        sixthScene(Math.min(width, height), Math.max(width, height))
        break;
      }

    }
