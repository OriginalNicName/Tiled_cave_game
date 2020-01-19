class BaseScene extends Phaser.Scene {
    map;
    player;
    cursors;
    camera;
    exitLayer;
    score;
    gems;
    skulls;

    constructor(key) {
        super(key);
    }
    create() {

        this.gems = this.physics.add.staticGroup();
        this.skulls = this.physics.add.group();
        //Create tilemap and attach tilesets

        this.map.landscape = this.map.addTilesetImage('mylevel1_tiles', 'landscape-image');
        //Set world bounds
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        //Create background and platform layers
        this.map.createStaticLayer('background', [this.map.landscape, this.map.props], 0, 0);
        this.map.createStaticLayer('background2', [this.map.landscape, this.map.props], 0, 0);
        this.map.createStaticLayer('platforms', [this.map.landscape, this.map.props], 0, 0);
        this.exitLayer = this.map.createStaticLayer('exit', [this.map.landscape, this.map.props], 0, 0);
       
        this.map.getObjectLayer('objects').objects.forEach(function (object) {
            object = this.retrieveCustomProperties(object);
            if (object.type === "playerSpawner") {
                this.createPlayer(object);
            } else if (object.type === "pickup") {
                this.createGem(object);
            } else if(object.type === "enemySpawner") {
                this.createSkull(object);
            }
        }, this);
        //Create player
        //this.createPlayer();

        //Create foreground layers
        this.map.createStaticLayer('foreground', [this.map.landscape, this.map.props], 0, 0);

        //Set up camera (can be in a createCamera() function)
        this.camera = this.cameras.getCamera("");
        this.camera.startFollow(this.player);
        this.camera.setBounds(0, 0, this.map.widthInPixels, this.map.height * this.map.tileHeight);
        this.camera.zoom = 2;

        //Create collision
        this.createCollision();

        //Enable cursors
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update() {
        //Check arrow keys
        if (this.cursors.right.isDown) {
            this.player.setVelocityX(100);
            this.player.flipX = false;
        } else if (this.cursors.left.isDown) {
            this.player.setVelocityX(-100);
            this.player.flipX = true;
        } else {
            this.player.setVelocityX(0);
        }

        //Check for space bar press
        if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            this.player.setVelocityY(-200);
        }


    }

    createPlayer(object) {
        //Add sprite to world
        this.player = this.physics.add.sprite(object.x, object.y, 'player', 1);
        this.player.setCollideWorldBounds(true);
    }

    createGem(object) {
        this.gems.create(object.x, object.y, 'gem');
    }

    createSkull(object) {
        let origin = {
            x: object.x,
            y: object.y + object.height / 2
        };
        let dest = {
            x: object.x + object.width,
            y: object.y + object.height / 2
        };

        let line = new Phaser.Curves.Line(origin, dest);
        let skull = this.add.follower(line, origin.x, origin.y, object.sprite);
        this.physics.add.existing(skull);
        this.skulls.add(skull);

        skull.startFollow({
            duration: 1000,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.easeInOut'
        })
    }

    createCollision() {
        //Set collision for all tiles in the "platforms" layer
        let collisionLayer = this.map.getLayer('platforms').tilemapLayer;
        collisionLayer.setCollisionBetween(0, 1000);
        //Enable collision between player and "platforms" layer
        this.physics.add.collider(this.player, collisionLayer);
        this.physics.add.collider(this.skulls, collisionLayer);

    }

    retrieveCustomProperties(object) {
        if(object.properties) { //Check if the object has custom properties
            if(Array.isArray(object.properties)) { //Check if from Tiled v1.3 and above
                object.properties.forEach(function(element){ //Loop through each property
                    this[element.name] = element.value; //Create the property in the object
                }, object); //Assign the word "this" to refer to the object
            } else {  //Check if from Tiled v1.2.5 and below
                for(var propName in object.properties) { //Loop through each property
                    object[propName] = object.properties[propName]; //Create the property in the object
                }
            }
    
            delete object.properties; //Delete the custom properties array from the object
        }
    
        return object; //Return the new object w/ custom properties
    }
}
class SceneA extends BaseScene {
    constructor() {
        super('sceneA');
    }
    preload() {
        //Load assets
        this.load.image('landscape-image', '../assets/mylevel1_tiles.png');
        this.load.image('gem', '../assets/gem.png');
        this.load.image('skull', '../assets/skull.png');
        this.load.spritesheet('player', '../assets/player.png', {
            frameWidth: 24,
            frameHeight: 24
        });
        //Load Tiled JSON
        this.load.tilemapTiledJSON('level1', '../assets/level1.json');
    }
    create() {
        this.score = 25;
        this.map = this.make.tilemap({
            key: 'level1'
        });
        super.create();
    }
    update() {
        super.update();
        let tile = this.exitLayer.getTileAtWorldXY(this.player.x, this.player.y);
        if (tile) {
            switch (tile.index) {
                case 200:
                case 201:
                case 206:
                case 207:
                    this.processExit();
                    break;
            }
        }
    }
    processExit() {
        console.log('player reached exit');
        this.scene.start('sceneB', { score: this.score });
    }
}
class SceneB extends BaseScene {
    constructor() {
        super('sceneB');
    }
    init(data) {
        this.score = data.score;
    }
    preload() {
        //Load assets
        this.load.image('landscape-image', '../assets/castle_tileset_part1_Padded.png');
        this.load.image('props-image', '../assets/castle_tileset_part2_Padded.png');
        this.load.spritesheet('player', '../assets/player.png', {
            frameWidth: 24,
            frameHeight: 24
        });
        //Load Tiled JSON
        this.load.tilemapTiledJSON('level2', '../assets/level2.json');
    }
    create() {
        console.log('this.score = ' + this.score);
        this.map = this.make.tilemap({
            key: 'level2'
        });
        super.create();
    }
}