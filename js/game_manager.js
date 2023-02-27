var GameManager = function () {
  this.init();
  this.setup();
  // this.start();
	
};

// Initial game settings
GameManager.prototype.init = function () {
  this.score = 0;
  this.loss = 0;
  this.over = false;
  this.won = false;

  this.count = 4;
  this.level = 1;
  this.speed = 800;
  // this.maxSpeed = 200;
  this.interval = this.speed * 2.5;
  this.point = 2;

  this.chickens = {};
  this.eggs = {};

  this.gameTimer;

  this.basketStartPosition = { x: 0, y: 1 };
};


GameManager.prototype.setFirstComing = function () {

return sessionStorage.setItem("start", true);

}
// Set up the game
GameManager.prototype.setup = function () {

  // start game press button
  const btnStart = document.querySelector('.btn-start');
	const btnStartWrap = document.querySelector('.btn-start-wrapper');
	btnStart.onclick = () => {
    btnStartWrap.hide();
    this.start();
    this.setFirstComing();
  }

  // start game press enter
  document.addEventListener( 'keyup', event => {
    if( event.code === 'Enter' ) {
      btnStartWrap.hide();
      this.start();
			this.setFirstComing();
    }
  });
	btnStartWrap.style.opacity = "1";

	if(sessionStorage.getItem('start')) {
		btnStartWrap.style.opacity = "0";
		this.start();
	}

  

  this.keyboard = new KeyboardInputManager();
  this.keyboard.on("move", this.move.bind(this));

  this.grid = new Grid(this.count);
  this.basket = new Basket(this.basketStartPosition);

  for (var i = 0; i < this.count; i++) {
    this.chickens[i] = new Chicken(i, this.grid.list[i], this.point);
  }

  this.HTMLredraw = new HTMLredraw();

  if (this.isMobile()) {
    this.touchscreenModification();
  }
};

GameManager.prototype.isMobile = function () {
  try {
    document.createEvent("TouchEvent");
    return true;
  } catch (e) {
    return false;
  }
};

GameManager.prototype.move = function (data) {
  var position = { x: this.basket.x, y: this.basket.y };
	
  switch (data.type) {
    case "arrow":
      // 0: up, 1: right, 2: down, 3: left, 4: R - restart
      if (data.key % 2 == 0) {
        position.y = data.key > 0 ? 0 : 1;
      } else {
        position.x = data.key > 2 ? 0 : 1;
      }
      break;
    case "button":
      position.x = data.x;
      position.y = data.y;
      break;
    case "common":
      if (data.key == "restart") {
        this.reStart();
        return false;
      }
      break;
  }

  this.basket.updatePosition(position, this.api.bind(this));
};

GameManager.prototype.start = function () {
  this.runGear();
};

GameManager.prototype.reStart = function () {
  window.location.reload();
};

GameManager.prototype.runGear = function () {
  var self = this;
  this.gameTimer = setInterval(function () {
    var chicken = self.findAvailableChicken();
    if (chicken >= 0 && !this.over) {
      self.runEgg(chicken);
    }
  }, this.interval);
};

GameManager.prototype.suspendGear = function () {
  clearInterval(this.gameTimer);
  this.runGear();
};

GameManager.prototype.haltGear = function () {
  clearInterval(this.gameTimer);
  this.over = true;
};

GameManager.prototype.upLevel = function () {
  this.level++;

  switch (true) {
    case this.level < 8:
      this.speed += -50;
      break;
    case this.level > 19:
      this.speed += 0;
      break;
    default:
      this.speed += -25;
      break;
  }
  this.interval = this.speed * 2.5;

  this.suspendGear();
};

GameManager.prototype.updateScore = function (data) {
	const basket = document.querySelector('.basket');

  if (
    this.grid.list[data.egg].x == this.basket.x &&
    this.grid.list[data.egg].y == this.basket.y
  ) {

		
		
		basket.style.display = 'block';
		setTimeout(() => basket.style.display = 'none', 800);
	
    this.score += this.point;
    this.HTMLredraw.updateScore({ value: this.score });
    
    if (this.score >= 1000) {
      this.gameWin();
      return false;
    }



    if (!(this.score % 50)) {
      this.upLevel();
    }
  } else {
    this.loss++;
    this.HTMLredraw.updateLossCount({ loss: this.loss });
		

    // add fragments when egg is lost

    const lostEgg = document.querySelector(".lost-egg");
    if(this.grid.list[data.egg].x === 0) {

      lostEgg.style.left = '20%';

      
    } else {
      lostEgg.style.left = '70%';
    }

    if (this.loss > 2 && !this.over) {
      this.gameOver();
    }
  }
	
};

GameManager.prototype.findAvailableChicken = function () {
  var avail = this.grid.avail.diff(this.grid.hold);

  if (!avail) {
    return null;
  }

  var chicken = avail.randomElement();
  this.api("onHoldChicken", { egg: chicken });

  return chicken;
};

GameManager.prototype.runEgg = function (chicken) {
  this.chickens[chicken].egg.run(this.speed, this.api.bind(this));
};

GameManager.prototype.gameOver = function () {
	document.querySelectorAll('.egg').forEach((el) => {
		el.style.display = 'none'
	});

	document.querySelector('.wolf').style.opacity = 0;
  this.haltGear();
  this.HTMLredraw.gameOver();

	document.querySelector('.basket').style.opacity = 0;
  this.haltGear();
  this.HTMLredraw.gameOver();
};

GameManager.prototype.gameWin = function () {
  this.haltGear();
  this.HTMLredraw.gameWin();
};

GameManager.prototype.api = function (method, data) {
  switch (method) {
    case "updateScore":
      this.updateScore(data);
      break;
    case "onHoldChicken":
      this.grid.onHold(data.egg);
      break;
    case "unHoldChicken":
      this.grid.unHold(data.egg);
      break;
    case "updateEggPosition":
      this.HTMLredraw.updateEggPosition(data);
      break;
    case "updateBasketPosition":
      this.HTMLredraw.updateBasketPosition(data);
      break;
  }
};

GameManager.prototype.touchscreenModification = function () {
  var buttons = document.querySelector("#controls").getElementsByTagName("a");

  var self = this;
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].onclick = function () {
      var data = {
        x: this.getAttribute("data-x"),
        y: this.getAttribute("data-y"),
        type: "button",
      };
      self.move(data);
      return false;
    };
  }

  this.HTMLredraw.mobileVersion();
};

