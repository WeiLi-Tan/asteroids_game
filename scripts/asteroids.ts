/**
 * An asteroid game created using ReactiveX programming, Observables and typescript. 
 */

function asteroids() {

  /** HTMLElement representing canvas */
  const canvas = document.getElementById("canvas")!;

  /* get the width and height of the canvas to be used to align other svg elements relative to canvas*/
  const canvasWidth = parseInt(canvas.getAttribute("width")!);
  const canvasHeight = parseInt(canvas.getAttribute("height")!);

  // specify constant variable for the minimum and maximum radius of small and big asteroids
  const SMALL_ASTEROID_MIN_R = 5,
        SMALL_ASTEROID_MAX_R = 25,
        BIG_ASTEROID_MIN_R = 26,
        BIG_ASTEROID_MAX_R = 50;

  const 
        // make a group for bullets and set its style to apply to all bullets
        bulletGroup = new Elem(canvas, 'g')
        .attr("style","fill:white;stroke:white;stroke-width:1")
        .attr("id", "bulletGroup"),
        
        // make a group for asteroids and set its style to apply to all asteroids
        asteroidGroup = new Elem(canvas, 'g')
        .attr("cx","0")
        .attr("cy","0")
        .attr("style","fill:#736F6E;stroke:white;stroke-width:2"),

        // a triangle ship acts as player and placed in the middle of canvas initially by
        // inheriting the transformation of its parent node g
        ship = new Elem(canvas, 'polygon')
        .translate(canvasWidth/2, canvasHeight/2)
        .rotate(70)
        .wrapAroundCanvas()
        .attr("r", 15)
        .attr("points","-15,20 15,20 0,-20")
        .attr("style","fill:blue;stroke:white;stroke-width:2");

  // start the game by calling functions which handle player control input, create asteroids and update levels
  const startGame = () => {
    userInputHandler();
    addAsteroid();
    createBigAsteroid();
    createSmallAsteroid();
    addLevels();
  }

  // handle key input by user to control ship
  const userInputHandler = () => {
    const keydown = Observable
        .fromEvent<KeyboardEvent>(document,"keydown")
        .takeUntil(gameOver || gameWon);

    const 
        leftkeydown = keydown.filter((e) => (e.key == "ArrowLeft")),
        rightkeydown = keydown.filter((e) => (e.key == "ArrowRight")),
        upkeydown = keydown.filter((e) => (e.key == "ArrowUp")),
        spacekeydown =keydown.filter((e) => e.key == " ");

    rightkeydown
    .subscribe(() => ship.rotate(20))

    leftkeydown
    .subscribe(() => ship.rotate(-20))

    upkeydown
    .subscribe(() => ship.moveInDirection(10))

    spacekeydown
    .subscribe(() => shoot(ship))
  }

  /**
   * Enable shooting by creating bullet that moves by itself in specific directiona, which is removed
   * automtically after 2 seconds
   * @param elem the element which shoots
   */
  const shoot = (elem: Elem) => {
    // create rectangle representing bullet
    const bullet = new Elem(canvas, 'rect', bulletGroup) 
      .attr("width","5")
      .attr("height","6")
      .attr("r","0")
      .attr("style","fill:white;stroke:white;stroke-width:1")
      .translate(elem.getX(), elem.getY())
      .rotate(elem.getDeg())
      .moveInDirection(33);

    // move the bullet every 10ms in direction specified by its degree with speed of 2
    const moveBullet = (): (() => void) => 
      Observable
      .interval(10)
      .takeUntil(Observable.interval(2000))
      .subscribe(() => bullet.moveInDirection(2))

    // remove the bullet after 5s (assume the bullet is already out of the canvas after 5s)
    const removeBullet = () => {
      if (bulletGroup.elem.contains(bullet.elem)){
        setTimeout(() => bulletGroup.removeChild(bullet), 5000)
      }
    }
                       
    moveBullet();
    removeBullet();
  }

  /** 
   * @param min minimum boundary of random number
   * @param max maximum boundary of random number
   * @returns a random number in the range specified by the min and max boundary
  */
  const getRandomNum = (min:number, max:number): number => (Math.random() * (max-min) + min)
  
  // add one big asteroid and one small asteroid to canvas at specific time interval depending on the current level
  const addAsteroid = () => {
    const level = parseInt(document.getElementById("level")!.innerHTML),
          speed = (5000 - (level*5)) > 500?  (5000 - (level*5)): 500;

    Observable
    .interval(speed)
    .takeUntil(gameOver || gameWon)
    .subscribe(() => {
      createBigAsteroid(); 
      createSmallAsteroid();})
  }

  /**
   * create a small asteroid which can move and attack player ship if collide with it
   * @param target element to be used to set initial position of asteroid if specified
   */
  const createSmallAsteroid = (target?: Elem) => {
    // create small asteroid
    const asteroid = target == undefined? createAsteroid(SMALL_ASTEROID_MIN_R, SMALL_ASTEROID_MAX_R): 
    createAsteroid(SMALL_ASTEROID_MIN_R, SMALL_ASTEROID_MAX_R, target);

    // remove method of small asteroid
    const remove = (asteroid: Elem) => asteroidGroup.removeChild(asteroid);

    // trigger asteroid to move and to be able to cause damage to player if collide with player ship
    moveAsteroid(asteroid);
    asteroidAttack(asteroid, remove);
    asteroidAttacked(asteroid, remove);
  }

  /**
   * create a big asteroid which can move and attack player ship if collide with it
   * @param target element to be used to set initial position of asteroid if specified
   */
  const createBigAsteroid = (target?: Elem) => {
    // create big asteroid
    const asteroid = createAsteroid(BIG_ASTEROID_MIN_R, BIG_ASTEROID_MAX_R, target);

    // remove method of big asteroid, 2 small asteroids will be created near the location of collision
    const remove = (asteroid: Elem) => {
      asteroidGroup.removeChild(asteroid);
      createSmallAsteroid(asteroid);
      createSmallAsteroid(asteroid);
    }

    // trigger asteroid to move and to be able to cause damage to player if collide with player ship
    moveAsteroid(asteroid);
    asteroidAttack(asteroid, remove);
    asteroidAttacked(asteroid, remove);
  }

    /**
   * Create asteroid with random radius in the boundary range and at position relative to a target element if specified
   * @param rMin minimum boundary for radius of asteroid
   * @param rMax maximum boundary for radius of asteroid
   * @param target element to be used to set initial position of asteroid if specified
   */
  const createAsteroid = (rMin: number, rMax: number, target?: Elem) : Elem => {
    const deg = getRandomNum(0, 360), 
          radius = getRandomNum(rMin, rMax);

    // create a circle representing the asteroid
    const asteroid = new Elem(canvas, 'circle', asteroidGroup)
      .attr("r", radius)
      .rotate(deg)
      .wrapAroundCanvas()

    // initial position of asteroid is set relative to target if specified, else it is set to random position
    target? asteroid.translate(target.getY() + getRandomNum(-5,5), target.getY() + getRandomNum(-5,5)): 
            asteroid.translate(getRandomNum(0, canvasWidth), getRandomNum(0, canvasWidth));
    
    // return the created asteroid
    return asteroid;
  }

  /**
   * Trigger an observable to move the asteroid with speed of 2 every 150ms in direction specified by its degree
   * @param asteroid asteroid to be made to move
   */ 
  const moveAsteroid = (asteroid: Elem) => {
    Observable
    .interval(150)
    .takeUntil(gameOver || gameWon)
    .subscribe(() => asteroid.moveInDirection(2))
  }
  
  /**
   * Trigger an observable to make the asteroid to be able to attack player ship by colliding with the ship and the 
   * asteroid will be removed or break down into smaller asteroid after collision
   * @param asteroid asteroid to add ability to attack
   * @param remove remove method to be trigger to remove the asteroid once collision occurs
   */
  const asteroidAttack = (asteroid: Elem, remove: (asteroid: Elem) => void) => {
    Observable
    .interval(1)
    .takeUntil(elemRemoved(asteroid, asteroidGroup) || gameOver || gameWon)
    .filter(() => collide(asteroid,ship))
    .subscribe(() => {
      minusLives();
      remove(asteroid);
    })
  }

  /**
   * if asteroid collide with any bullet, remove both the asteroid and bullet, and add points to player
   * @param asteroid asteroid to be checked for collision
   * @param remove remove method for the type of asteroid which can be big or small asteroid
   */
  const asteroidAttacked = (asteroid: Elem, remove: (asteroid: Elem) => void) => {
    Observable
    .interval(1)
    .takeUntil(elemRemoved(asteroid, asteroidGroup) || gameOver || gameWon)
    .filter(() => bulletGroup.children
                  .some((bullet) => collide(asteroid, bullet)))
    .subscribe(() => {
      remove(asteroid);
      addPoints();
      bulletGroup.children
      .filter((bullet) => collide(asteroid, bullet))
      .map((bullet) => bulletGroup.removeChild(bullet));
    });
  }

  /**
   * Return an observable when the element is removed from its parent group
   * @param elem element to be checked if it is being removed
   * @param parent parent group of the element to be checked
   */
  const elemRemoved = (elem: Elem, parent: Elem) => {
    return Observable
      .interval(1)
      .takeUntil(gameOver || gameWon)
      .filter(() => !parent.elem.contains(elem.elem))
  }

  /**
   * Return True if the element collides with its target, false otherwise.
   * @param elem element to be checked if it collides with its target
   * @param target target to be checked if it collides with the element
   */
  const collide = (elem: Elem, target: Elem): boolean => {
    const xDistance = elem.getX() - target.getX(),
          yDistance = elem.getY() - target.getY(),
          rSumPower2 = Math.pow(parseInt(elem.attr("r")) + parseInt(target.attr("r")), 2),
          sumOfDistPow2 = Math.pow(xDistance,2) + Math.pow(yDistance,2);
    return (sumOfDistPow2 < rSumPower2);
  }

  // decrease the lives of player and update the lives number on html page
  const minusLives = () => {
    const livesElem = document.getElementById("lives")!,
          livesLeft = parseInt(livesElem.innerHTML!);

    if (livesLeft - 1 >= 0) {
      livesElem.innerHTML = String(Number(livesLeft - 1))
    } else {
      addGameOverText();

    }
    livesLeft - 1 >= 0? livesElem.innerHTML = String(Number(livesLeft - 1)):addGameOverText();
  }

  // show game over text
  const addGameOverText = () => {
    const canvas = document.getElementById('canvas')!,
          gameOverText = new Elem(canvas, 'text')
                        .attr('x','60')
                        .attr('y','250')
                        .attr('fill','white')
                        .attr('font-size','50');
    gameOverText.elem.innerHTML = "GAME OVER!";
  }

  // show game over text
  const addGameWonText = () => {
    const canvas = document.getElementById('canvas')!,
          gameOverText = new Elem(canvas, 'text')
                        .attr('x','100')
                        .attr('y','250')
                        .attr('fill','white')
                        .attr('font-size','50');
    gameOverText.elem.innerHTML = "YOU WON!";
    
  }

  // increase point of player by 1
  const addPoints = () => {
    const pointsElem = document.getElementById("points")!,
          points = parseInt(pointsElem.innerHTML);
    
    pointsElem.innerHTML = String(Number(points + 1));
  }

  // increase level of game by 1 every 10 seconds until the game is over
  const addLevels = () => {
    Observable
    .interval(10000)
    .takeUntil(gameOver || gameWon)
    .subscribe(() => {
      const levelsElem = document.getElementById("level")!,
            levels = parseInt(levelsElem.innerHTML);
      levelsElem.innerHTML = String(Number(levels + 1));
      gameWon.subscribe(() => addGameWonText());
      })
  }

  // player win the game when levels is 50 and over
  const gameWon = 
    Observable
    .interval(1)
    .filter(() => Number(document.getElementById("level")!.innerHTML) >= 50)

  // game over when lives is less than 1
  const gameOver = 
    Observable
    .interval(1)
    .filter(() => Number(document.getElementById('lives')!.innerHTML) <= 0)

  // start the game
  startGame();
}

// the following simply runs your asteroids function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = ()=>{
    asteroids();
  }

 

 
