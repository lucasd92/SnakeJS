/*jslint bitwise:true, es5: true */
(function (window, undefined) {

    var canvas = null,
        ctx = null;
    // Dual buffer
    var buffer = null,
        bufferCtx = null;

    var bufferScale = 1,
        bufferOffsetX = 0,
        bufferOffsetY = 0;
    // game score
    var score = 0,
        userId = 2;
    // Player object
    var body = [];
    // Food object
    var food = null;
    var fruit = null;
    var fruitTimer = 0;
    // wall array
    var wall = [];
    // Direction 0= UP, 1= right, 2= down, 3 = left
    var dir = 0;
    // Last pressed key
    var lastPress = null;
    // store pause state
    var pause = true;
    var gameover = true;

    // images
    var iBody = new Image();
    var iFood = new Image();
    var iFruit = new Image();

    //Audio
    var aEat = new Audio();
    var aDie = new Audio();

    // statics
    var lastUpdate = 0,
        FPS = 0,
        frames = 0,
        acumDelta = 0;

    // Scene management
    var currentScene = 0,
        scenes = [];

    var mainScene = null,
        gameScene = null;

    // local storage
    var highscores = [],
        posHighscore = 10;

    // definition, maybe const?
    var KEY_ENTER = 13,
        KEY_LEFT = 37,
        KEY_UP = 38,
        KEY_RIGHT = 39,
        KEY_DOWN = 40;

    function Rectangle(x, y, width, height) {
        this.x = (x === null) ? 0 : x;
        this.y = (y === null) ? 0 : y;
        this.width = (width === null) ? 0 : width;
        this.height = (height === null) ? this.width : height;
    }

    Rectangle.prototype = {
        constructor: Rectangle,

        intersects: function (rect) {
            if (rect === null) {
                window.console.warn('Missing parameters on function intersects');
            } else {
                return (this.x < rect.x + rect.width &&
                this.x + this.width > rect.x &&
                this.y < rect.y + rect.height &&
                this.y + this.height > rect.y);
            }
        },

        fill: function (ctx) {
            if (ctx === null) {
                window.console.warn('Missing parameters on function fill');
            } else {
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
        },

        drawImage:  function (ctx, img) {
            if (img === null) {
                window.console.warn('Missing parameters on function drawImage');
            } else {
                if (img.width) {
                    ctx.drawImage(img, this.x, this.y);
                } else {
                    ctx.strokeRect(this.x, this.y, this.width, this.height);
                }
            }
        }
    };

    function Scene() {
        this.id = scenes.length;
        scenes.push(this);
    }

    Scene.prototype = {
        constructor: Scene,
        load: function () {},
        paint: function (ctx) {},
        act: function () {}
    };

    function loadScene(scene) {
        currentScene = scene.id;
        scenes[currentScene].load();
    }

    // Main Scene
    mainScene = new Scene();
    mainScene.paint = function (ctx) {
        // Clean canvas
        ctx.fillStyle = '#030';
        ctx.fillRect(0, 0, buffer.width, buffer.height);
        // Draw title
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('SNAKE', 150, 60);
        ctx.fillText('Press Enter', 150, 90);
    };
    mainScene.act = function () {
        // Load next scene
        if (lastPress === KEY_ENTER) {
            loadScene(highscoresScene);
            lastPress = null;
        }
    };

    // Highscore Scene
    highscoresScene = new Scene();

    highscoresScene.paint = function (ctx) {
        var i = 0,
        l = 0;
        // Clean canvas
        ctx.fillStyle = '#030';
        ctx.fillRect(0, 0, buffer.width, buffer.height);
        // Draw title
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('HIGH SCORES', 150, 30);
        // Draw high scores
        ctx.textAlign = 'right';
        for (i = 0, l = highscores.length; i < l; i += 1) {
            if (i === posHighscore) {
                ctx.fillText('*' + highscores[i], 180, 40 + i * 10);
            } else {
                ctx.fillText(highscores[i], 180, 40 + i * 10);
            }
        }
    };

    highscoresScene.act = function () {
        // Load next scene
        if (lastPress === KEY_ENTER) {
            loadScene(gameScene);
            lastPress = null;
        }
    };
    
    // Game Scene
    gameScene = new Scene();

    // reset values to restart game
    gameScene.load = function () {
        score = 0;
        dir = 1;
        body[0].x = 40;
        body[0].y = 40;
        food.x = random(buffer.width / 10 - 1) * 10;
        food.y = random(buffer.height / 10 - 1) * 10;
        fruitTimer = Date.now() + 1000*(5 + random(15));
        fruit.x = random(buffer.width / 10 - 1) * 10;
        fruit.y = random(buffer.height / 10 - 1) * 10;
        gameover = false;
        body.length = 0;
        body.push(new Rectangle(40, 40, 10, 10));
    }

    // Draw in canvas
    gameScene.paint = function (ctx) {
        var i = 0,
            l = 0;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, buffer.width, buffer.height);

        // Draw food
        ctx.fillStyle = '#f00';
        food.drawImage(ctx,iFood);
        // Draw fruit
        ctx.fillStyle = '#ff0';
        if((Date.now() > fruitTimer)){
            fruit.drawImage(ctx,iFruit);
        }
        //Draw body[0]
        ctx.fillStyle = '#0f0';
        for (i = 0, l = body.length; i < l; i += 1) {
            //body[i].fill(ctx);
            body[i].drawImage(ctx,iBody);
        }
        // Draw walls
        ctx.fillStyle = '#999';
        for (i = 0, l = wall.length; i < l; i += 1) {
            wall[i].fill(ctx);
        }

        // White
        ctx.fillStyle = '#fff';
        // Draw score
        ctx.fillText('Score: ' + score, 0, 10);
        // Draw FPS
        ctx.fillText('FPS: ' + FPS, buffer.width - 50, 10);
        // Draw pause
        if (pause) {
            ctx.textAlign = 'center';
            if (gameover) {
                ctx.fillText('GAME OVER', 150, 75);
            } else {
                ctx.fillText('PAUSE', 150, 75);
            }
            ctx.textAlign = 'left';
        }
    } 
    //Execute actions
    gameScene.act = function (){
        var i = 0,
            l = 0;
        if(!pause){
            // GameOver Reset
            if (gameover) {
                //loadScene(mainScene);
                addHighscore(score);
                loadScene(highscoresScene);
            }
            // Change Direction
            if (lastPress === KEY_UP && dir !== 2) {
             dir = 0;
            }
            if (lastPress === KEY_RIGHT && dir !== 3) {
                dir = 1;
            }
            if (lastPress === KEY_DOWN && dir !== 0) {
                dir = 2;
            }
            if (lastPress === KEY_LEFT && dir !== 1) {
                dir = 3;
            }
            // Move Rect
            if (dir === 0) {
                body[0].y -= 10;
            }
            if (dir === 1) {
                body[0].x += 10;
            }
            if (dir === 2) {
                body[0].y += 10;
            }
            if (dir === 3) {
                body[0].x -= 10;
            }
            // Out Screen
            if (body[0].x > buffer.width  - body[0].width) {
                body[0].x = 0;
            }
            if (body[0].y > buffer.height - body[0].height) {
                body[0].y = 0;
            }
            if (body[0].x < 0) {
                body[0].x = buffer.width - body[0].width;
            }
            if (body[0].y < 0) {
                body[0].y = buffer.height - body[0].height;
            }
            // Move Body
            for (i = body.length - 1; i > 0; i -= 1) {
                body[i].x = body[i - 1].x;
                body[i].y = body[i - 1].y;
            }

            // Body Intersects
            for (i = 2, l = body.length; i < l; i += 1) {
                if (body[0].intersects(body[i])) {
                    gameover = true;
                    pause = true;
                    aDie.play();
                }
            }
            // Food Intersects
            if (body[0].intersects(food)) {
                score += 1;
                food.x = random(buffer.width / 10 - 1) * 10;
                food.y = random(buffer.height / 10 - 1) * 10;
                body.push(new Rectangle(food.x, food.y, 10, 10));
                aEat.play();
            }
            // Fruit Intersects 
            if ((body[0].intersects(fruit)) && (Date.now() > fruitTimer)) {
                score += 1;
                postScore(score);
                fruit.x = random(buffer.width / 10 - 1) * 10;
                fruit.y = random(buffer.height / 10 - 1) * 10;
                aEat.play();
                fruitTimer = Date.now() + 1000*(5 + random(15));
            }
            // Wall Intersects
            for (i = 0, l = wall.length; i < l; i += 1) {
                if (food.intersects(wall[i])) {
                    food.x = random(buffer.width / 10 - 1) * 10;
                    food.y = random(buffer.height / 10 - 1) * 10;
                }
                if (fruit.intersects(wall[i])) {
                    fruit.x = random(buffer.width / 10 - 1) * 10;
                    fruit.y = random(buffer.height / 10 - 1) * 10;
                }  
                if (body[0].intersects(wall[i])) {
                    pause = true;
                    gameover = true;
                    aDie.play();
                }
            }
        }else{
            fruitTimer = Date.now() + 1000*(5 + random(15));
        }
        // Pause/Unpause
        if (lastPress === KEY_ENTER) {
            pause = !pause;
            lastPress = null;
        }
    }

    function canPlayOgg() {
        var aud = new Audio();
        if (aud.canPlayType('audio/ogg').replace(/no/, '')) {
            return true;
        } else {
            return false;
        }
    }

    function addHighscore(score) {
        posHighscore = 0;
        while (highscores[posHighscore] > score && posHighscore < highscores.length) {
            posHighscore += 1;
        }
        highscores.splice(posHighscore, 0, score);
        if (highscores.length > 10) {
            highscores.length = 10;
        }
        localStorage.highscores = highscores.join(',');
    }

    // resize callback
    function resize(){
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        var w = window.innerWidth / buffer.width;
        var h = window.innerHeight / buffer.height;
        bufferScale = Math.min(h, w);
        bufferOffsetX = (canvas.width - (buffer.width * bufferScale)) / 2;
        bufferOffsetY = (canvas.height - (buffer.height * bufferScale)) / 2;
    }

    //Get Canvas and context then draw and take actions
    function init() {
        canvas = document.getElementById('canvas');
        ctx = canvas.getContext('2d');
        canvas.width = 600;
        canvas.height = 300;

        // Load buffer
        buffer = document.createElement('canvas');
        bufferCtx = buffer.getContext('2d');
        buffer.width = 300;
        buffer.height = 150;
        
        // Load saved highscores
        if (localStorage.highscores) {
            highscores = localStorage.highscores.split(',');
        }
        // Create player
        //player = new Rectangle(40, 40, 10, 10);
        body.push(new Rectangle(40, 40, 10, 10));
        //food for the snake
        food = new Rectangle(80, 80, 10, 10);
        //food for the snake
        fruit = new Rectangle(-10, -10, 10, 10);

        // Create walls
        // wall.push(new Rectangle(100, 50, 10, 10));
        // wall.push(new Rectangle(100, 100, 10, 10));
        // wall.push(new Rectangle(200, 50, 10, 10));
        // wall.push(new Rectangle(200, 100, 10, 10));

        // Load assets
        iBody.src = 'assets/body.png';
        iFood.src = 'assets/fruit.png';
        iFruit.src = 'assets/fruit2.png';

        if (canPlayOgg()) {
            aEat.src = 'assets/chomp.oga';
            aDie.src = 'assets/dies.oga';
            } else {
            aEat.src = 'assets/chomp.m4a';
            aDie.src = 'assets/dies.m4a';
        }
         resize();
        run();
        repaint();

    } 
    // Call run @ 20fps?
    function repaint() {
        window.requestAnimationFrame(repaint);
        // buffer swap
   
        if (scenes.length) {
            scenes[currentScene].paint(bufferCtx);
        }
        ctx.fillStyle = '#000';
        ctx.imageSmoothingEnabled = false;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(buffer, bufferOffsetX, bufferOffsetY, buffer.width * bufferScale, buffer.height * bufferScale);
    }
    function run() {
        setTimeout(run, 50);
        if (scenes.length) {
            scenes[currentScene].act();
        }
        
        // get time for statics calculation
        var now = Date.now(),
        deltaTime = (now - lastUpdate) / 1000;
        if (deltaTime > 1) {
            deltaTime = 0;
        }
        lastUpdate = now;
        frames += 1;
        acumDelta += deltaTime;
        if (acumDelta > 1) {
            FPS = frames;
            frames = 0;
            acumDelta -= 1;
        }
    }
    // Init after load
    window.addEventListener('load', init, false);
    // listen keyboard events
    document.addEventListener('keydown', function (evt) {
        lastPress = evt.which;
    }, false);
    // Add listener to resize event
    window.addEventListener('resize', resize, false);

    // For compatibility with older browsers
    window.requestAnimationFrame = (function () {
        return window.requestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        function (callback) {
        window.setTimeout(callback, 17);
        };
    }());
    // Aux funtion for random number generation
    function random(max) {
        return Math.floor(Math.random() * max);
    }
    function postScore(actualScore){
        fetch(`https://jsonplaceholder.typicode.com/users/${userId}/posts?${actualScore}`, {
        method: 'POST',
        body: JSON.stringify({
            score: actualScore,
            userId: userId,
        }),
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
        },
        })
        .then((response) => response.json())
        .then((json) => {console.log(json); console.log("Score sent successfully");})
        .catch((error) => {console.log(error);console.log("Error trying to send the score");})
    }
}(window));