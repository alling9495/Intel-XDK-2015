
function toDegrees(radians)
{
    var degrees = radians * (180.0 / Math.PI);
    return degrees;
}

var GameLayer = cc.Layer.extend({
    sprite:null,
    powerPlant:null,
    enemyNumber: 1,
    towers: null,
    enemies: null,
    enemySpawn: null,
    bullets: null,
    audio: null,
    ctor:function () {
        //////////////////////////////
        // 1. super init first
        this._super();
        
        // Render the game field
        // Use a tilemap

        var tilemap = new cc.TMXTiledMap(asset.map_01);
        this.addChild(tilemap, 1);
        
        // Add all the game objects to the layer
        // Get the properties from the tmx file
        this.enemies = [];
        this.bullets = [];
        
        this.enemiesKilled = 0;
        
        var enemy = new Enemy(100);

        this.enemies.push(enemy);
        
        this.powerPlant = new PowerPlant();

        var path, towerPositions;
        for (var i = 0; i < tilemap.objectGroups.length; ++i) {
            if (tilemap.objectGroups[i].groupName === "Enemy_Path") {
                path = tilemap.objectGroups[i].getObjects()[0];
            }
            if (tilemap.objectGroups[i].groupName === "Tower_Placement") {
                towerPositions = tilemap.objectGroups[i];
            }
        }
        
        // add the towers
        this.towers = [];
        for (var i = 0; i < towerPositions.getObjects().length; ++i) {
            var tower = new Tower();
            tower.x = towerPositions.getObjects()[i].x;
            tower.y = towerPositions.getObjects()[i].y;
            if(tower.y > cc.winSize.height / 2)
            {
                tower.mana.y = tower.mana.y + 25;
                tower.sprite.scaleY = -1;    
            }
            else
            {         
                tower.mana.y = tower.mana.y - 25;   
            }
            this.towers.push(tower);
            this.addChild(tower, 5);
        }
        
        this.powerPlant.x = parseInt(path.polylinePoints[path.polylinePoints.length - 1].x) + path.x;
        this.powerPlant.y = cc.winSize.height - (parseInt(path.polylinePoints[path.polylinePoints.length - 1].y) + path.y);
        
       
        this.addChild(this.powerPlant, 3);
        this.scheduleUpdate();
        
        this.enemyNumber = 0;
        this.enemySpawn = this.schedule(function(){
            var enemy;
            if(this.enemyNumber % 15 == 0)
                enemy = new Enemy(2000, 15, 1);
            else if(this.enemyNumber % 5 == 0)
                enemy = new Enemy(30, 70, 2);
            else
                enemy = new Enemy(100);

            this.enemies.push(enemy);
            this.addChild(enemy, 6);
            enemy.beginMovingAlongPathObject(tilemap.objectGroups[0].getObjects()[0]);
            this.enemyNumber++;
        }, 1.0, 50, 2);

        this.towers.push(tower);

        this.music = cc.audioEngine.playMusic(asset.all_loop, true);
    },
    update: function() {
        var i, j, enemy;
        
        if (this.enemiesKilled >= 51) { // count the extra first enemy
            console.log("Win!");
            cc.audioEngine.stopMusic(this.music);
            cc.director.runScene(new Win());
        }
        
        if (this.powerPlant.health <= 0) {
            cc.audioEngine.stopMusic(this.music);
            cc.director.runScene(new GameOver());
        }
        
        for (i = 0; i < this.enemies.length; ++i) {
            enemy = this.enemies[i];
            var dist = distance(this.powerPlant, enemy);
            if (!enemy.attacking && dist < 40) {
                enemy.actionManager.pauseTarget(enemy);
                enemy.attacking = true;
            }
            
            if (enemy.attacking) {
                if (enemy.ac <= 0) {
                    this.powerPlant.takeDamage(enemy.power);
                    enemy.ac = enemy.attackCooldown;
                }
                --enemy.ac;
            }
        }
        var towersOn = 0;
        for (j = 0; j < this.towers.length; ++j) {
            var tower = this.towers[j];
            if (tower.energy < 0) {
                tower.energy = 0;
            }
            if (tower.energy > tower.energyMax) {
                tower.energy = tower.energyMax;
            }
            tower.mana.displayEnergy(tower.energy, tower.energyMax);
            --tower.ac;
            if (tower.on) {
                towersOn++;
            }
            for (i = 0; i < this.enemies.length; ++i) {
                enemy = this.enemies[i];
                if (enemy.health <= 0) {
                    this.removeChild(enemy);
                    this.enemies.splice(i, 1);
                    this.enemiesKilled++;
                    --i;
                    cc.audioEngine.playEffect(asset.enemy_die, false);
                }
                
                if (distance(tower, enemy) < tower.range && tower.energy >= tower.energyUsage) {
                    if (tower.ac <= 0 && tower.on) {
                        // Launch a bullet
                        var angle = toDegrees( Math.atan( (enemy.x - tower.x) / (enemy.y - tower.y) ));

                        var rotate = cc.RotateTo.create(0.1,angle);
                        tower.sprite.runAction(rotate);

                        var bullet = new Bullet(enemy, tower.power);
                        bullet.x = tower.x;
                        bullet.y = tower.y;
                        this.addChild(bullet, 7);
                        bullet.scheduleUpdate();
                        this.bullets.push(bullet);
                        tower.ac = tower.attackCooldown;
                        
                        tower.energy -= tower.energyUsage;
                        
                        cc.audioEngine.playEffect(asset.turret_fired, false);

                    }
                }
            }
        }

        for (k = 0; k < this.towers.length; k++) {
            if (this.towers[k].on) {
                this.towers[k].energy += this.powerPlant.powerRate / towersOn;            
            }
        }
        
        /*if (this.powerPlant.power <= this.powerPlant.powerMax) {
            this.powerPlant.power += this.powerPlant.powerRate - totalEnergyUsed;
        } else {
            this.powerPlant.power = this.powerPlant.powerMax;
        }*/
        
        for (i = 0; i < this.bullets.length; ++i) {
            var bullet = this.bullets[i];
            var dist = distance(bullet, bullet.target);
            if (dist < 10) {
                bullet.target.takeDamage(bullet.damage);
                this.bullets.splice(i, 1);
                this.removeChild(bullet);
                --i;
            }
        }
    }
});

var Game = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new GameLayer();
        this.addChild(layer);
    }
});

