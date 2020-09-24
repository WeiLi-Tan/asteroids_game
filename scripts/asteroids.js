"use strict";
function asteroids() {
    const canvas = document.getElementById("canvas");
    const canvasWidth = parseInt(canvas.getAttribute("width"));
    const canvasHeight = parseInt(canvas.getAttribute("height"));
    const SMALL_ASTEROID_MIN_R = 5, SMALL_ASTEROID_MAX_R = 25, BIG_ASTEROID_MIN_R = 26, BIG_ASTEROID_MAX_R = 50;
    const bulletGroup = new Elem(canvas, 'g')
        .attr("style", "fill:white;stroke:white;stroke-width:1")
        .attr("id", "bulletGroup"), asteroidGroup = new Elem(canvas, 'g')
        .attr("cx", "0")
        .attr("cy", "0")
        .attr("style", "fill:#736F6E;stroke:white;stroke-width:2"), ship = new Elem(canvas, 'polygon')
        .translate(canvasWidth / 2, canvasHeight / 2)
        .rotate(70)
        .wrapAroundCanvas()
        .attr("r", 15)
        .attr("points", "-15,20 15,20 0,-20")
        .attr("style", "fill:blue;stroke:white;stroke-width:2");
    const startGame = () => {
        userInputHandler();
        addAsteroid();
        createBigAsteroid();
        createSmallAsteroid();
        addLevels();
    };
    const userInputHandler = () => {
        const keydown = Observable
            .fromEvent(document, "keydown")
            .takeUntil(gameOver || gameWon);
        const leftkeydown = keydown.filter((e) => (e.key == "ArrowLeft")), rightkeydown = keydown.filter((e) => (e.key == "ArrowRight")), upkeydown = keydown.filter((e) => (e.key == "ArrowUp")), spacekeydown = keydown.filter((e) => e.key == " ");
        rightkeydown
            .subscribe(() => ship.rotate(20));
        leftkeydown
            .subscribe(() => ship.rotate(-20));
        upkeydown
            .subscribe(() => ship.moveInDirection(10));
        spacekeydown
            .subscribe(() => shoot(ship));
    };
    const shoot = (elem) => {
        const bullet = new Elem(canvas, 'rect', bulletGroup)
            .attr("width", "5")
            .attr("height", "6")
            .attr("r", "0")
            .attr("style", "fill:white;stroke:white;stroke-width:1")
            .translate(elem.getX(), elem.getY())
            .rotate(elem.getDeg())
            .moveInDirection(33);
        const moveBullet = () => Observable
            .interval(10)
            .takeUntil(Observable.interval(2000))
            .subscribe(() => bullet.moveInDirection(2));
        const removeBullet = () => {
            if (bulletGroup.elem.contains(bullet.elem)) {
                setTimeout(() => bulletGroup.removeChild(bullet), 5000);
            }
        };
        moveBullet();
        removeBullet();
    };
    const getRandomNum = (min, max) => (Math.random() * (max - min) + min);
    const addAsteroid = () => {
        const level = parseInt(document.getElementById("level").innerHTML), speed = (5000 - (level * 5)) > 500 ? (5000 - (level * 5)) : 500;
        Observable
            .interval(speed)
            .takeUntil(gameOver || gameWon)
            .subscribe(() => {
            createBigAsteroid();
            createSmallAsteroid();
        });
    };
    const createSmallAsteroid = (target) => {
        const asteroid = target == undefined ? createAsteroid(SMALL_ASTEROID_MIN_R, SMALL_ASTEROID_MAX_R) :
            createAsteroid(SMALL_ASTEROID_MIN_R, SMALL_ASTEROID_MAX_R, target);
        const remove = (asteroid) => asteroidGroup.removeChild(asteroid);
        moveAsteroid(asteroid);
        asteroidAttack(asteroid, remove);
        asteroidAttacked(asteroid, remove);
    };
    const createBigAsteroid = (target) => {
        const asteroid = createAsteroid(BIG_ASTEROID_MIN_R, BIG_ASTEROID_MAX_R, target);
        const remove = (asteroid) => {
            asteroidGroup.removeChild(asteroid);
            createSmallAsteroid(asteroid);
            createSmallAsteroid(asteroid);
        };
        moveAsteroid(asteroid);
        asteroidAttack(asteroid, remove);
        asteroidAttacked(asteroid, remove);
    };
    const createAsteroid = (rMin, rMax, target) => {
        const deg = getRandomNum(0, 360), radius = getRandomNum(rMin, rMax);
        const asteroid = new Elem(canvas, 'circle', asteroidGroup)
            .attr("r", radius)
            .rotate(deg)
            .wrapAroundCanvas();
        target ? asteroid.translate(target.getY() + getRandomNum(-5, 5), target.getY() + getRandomNum(-5, 5)) :
            asteroid.translate(getRandomNum(0, canvasWidth), getRandomNum(0, canvasWidth));
        return asteroid;
    };
    const moveAsteroid = (asteroid) => {
        Observable
            .interval(150)
            .takeUntil(gameOver || gameWon)
            .subscribe(() => asteroid.moveInDirection(2));
    };
    const asteroidAttack = (asteroid, remove) => {
        Observable
            .interval(1)
            .takeUntil(elemRemoved(asteroid, asteroidGroup) || gameOver || gameWon)
            .filter(() => collide(asteroid, ship))
            .subscribe(() => {
            minusLives();
            remove(asteroid);
        });
    };
    const asteroidAttacked = (asteroid, remove) => {
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
    };
    const elemRemoved = (elem, parent) => {
        return Observable
            .interval(1)
            .takeUntil(gameOver || gameWon)
            .filter(() => !parent.elem.contains(elem.elem));
    };
    const collide = (elem, target) => {
        const xDistance = elem.getX() - target.getX(), yDistance = elem.getY() - target.getY(), rSumPower2 = Math.pow(parseInt(elem.attr("r")) + parseInt(target.attr("r")), 2), sumOfDistPow2 = Math.pow(xDistance, 2) + Math.pow(yDistance, 2);
        return (sumOfDistPow2 < rSumPower2);
    };
    const minusLives = () => {
        const livesElem = document.getElementById("lives"), livesLeft = parseInt(livesElem.innerHTML);
        if (livesLeft - 1 >= 0) {
            livesElem.innerHTML = String(Number(livesLeft - 1));
        }
        else {
            addGameOverText();
        }
        livesLeft - 1 >= 0 ? livesElem.innerHTML = String(Number(livesLeft - 1)) : addGameOverText();
    };
    const addGameOverText = () => {
        const canvas = document.getElementById('canvas'), gameOverText = new Elem(canvas, 'text')
            .attr('x', '60')
            .attr('y', '250')
            .attr('fill', 'white')
            .attr('font-size', '50');
        gameOverText.elem.innerHTML = "GAME OVER!";
    };
    const addGameWonText = () => {
        const canvas = document.getElementById('canvas'), gameOverText = new Elem(canvas, 'text')
            .attr('x', '100')
            .attr('y', '250')
            .attr('fill', 'white')
            .attr('font-size', '50');
        gameOverText.elem.innerHTML = "YOU WON!";
    };
    const addPoints = () => {
        const pointsElem = document.getElementById("points"), points = parseInt(pointsElem.innerHTML);
        pointsElem.innerHTML = String(Number(points + 1));
    };
    const addLevels = () => {
        Observable
            .interval(10000)
            .takeUntil(gameOver || gameWon)
            .subscribe(() => {
            const levelsElem = document.getElementById("level"), levels = parseInt(levelsElem.innerHTML);
            levelsElem.innerHTML = String(Number(levels + 1));
            gameWon.subscribe(() => addGameWonText());
        });
    };
    const gameWon = Observable
        .interval(1)
        .filter(() => Number(document.getElementById("level").innerHTML) >= 50);
    const gameOver = Observable
        .interval(1)
        .filter(() => Number(document.getElementById('lives').innerHTML) <= 0);
    startGame();
}
if (typeof window != 'undefined')
    window.onload = () => {
        asteroids();
    };
//# sourceMappingURL=asteroids.js.map