/**
 * Game Overlay - Phaser.js Integration
 * 2D Gamification layer on top of 3D metaverse
 */

import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';

interface GameOverlayProps {
  user: {
    id: string;
    username: string;
    level: number;
    xp: number;
  } | null;
  onAchievement: (achievement: { id: string; name: string; points: number }) => void;
}

// Game scene class
class AODSGameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private collectibles!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private scoreText!: Phaser.GameObjects.Text;
  private particles!: any;
  private score: number = 0;
  private onCollect: (type: string) => void;
  private onEnemyDefeat: () => void;

  constructor(onCollect: (type: string) => void, onEnemyDefeat: () => void) {
    super({ key: 'AODSGameScene' });
    this.onCollect = onCollect;
    this.onEnemyDefeat = onEnemyDefeat;
  }

  preload() {
    // Create textures programmatically (no external assets needed)
    const graphics = this.make.graphics({ x: 0, y: 0 });
    
    // Player texture
    graphics.fillStyle(0x00ffff, 1);
    graphics.fillCircle(16, 16, 16);
    graphics.generateTexture('player', 32, 32);
    graphics.clear();
    
    // Platform texture
    graphics.fillStyle(0x444444, 1);
    graphics.fillRect(0, 0, 64, 32);
    graphics.generateTexture('platform', 64, 32);
    graphics.clear();
    
    // Collectible - Data Node
    graphics.fillStyle(0x00ff00, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture('datanode', 16, 16);
    graphics.clear();
    
    // Collectible - Code Fragment
    graphics.fillStyle(0xff00ff, 1);
    graphics.fillRect(0, 0, 16, 16);
    graphics.generateTexture('codefragment', 16, 16);
    graphics.clear();
    
    // Enemy - Bug
    graphics.fillStyle(0xff0000, 1);
    graphics.fillCircle(12, 12, 12);
    graphics.generateTexture('bug', 24, 24);
    graphics.clear();
    
    // Particle
    graphics.fillStyle(0x00ffff, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture('particle', 8, 8);
  }

  create() {
    // Background gradient
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x000011, 0x000011, 0x000022, 0x000022, 1);
    gradient.fillRect(0, 0, 800, 600);

    // Create platforms
    this.platforms = this.physics.add.staticGroup();
    this.createLevel();

    // Create player
    this.player = this.physics.add.sprite(100, 450, 'player');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.player.setDrag(500);

    // Player trail effect
    this.time.addEvent({
      delay: 50,
      callback: () => {
        if (this.player.body && this.player.body.velocity.length() > 10) {
          const trail = this.add.image(this.player.x, this.player.y, 'player');
          trail.setAlpha(0.3);
          trail.setScale(0.8);
          this.tweens.add({
            targets: trail,
            alpha: 0,
            scale: 0.3,
            duration: 300,
            onComplete: () => trail.destroy()
          });
        }
      },
      loop: true
    });

    // Create collectibles
    this.collectibles = this.physics.add.group();
    this.spawnCollectibles();

    // Create enemies
    this.enemies = this.physics.add.group();
    this.spawnEnemies();

    // Colliders
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.collectibles, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);

    // Overlaps
    this.physics.add.overlap(this.player, this.collectibles, this.collectItem, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, undefined, this);

    // Controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // WASD controls
    this.input.keyboard!.on('keydown-W', () => this.jump());
    this.input.keyboard!.on('keydown-A', () => this.player.setVelocityX(-200));
    this.input.keyboard!.on('keydown-D', () => this.player.setVelocityX(200));
    this.input.keyboard!.on('keyup-A', () => this.player.setVelocityX(0));
    this.input.keyboard!.on('keyup-D', () => this.player.setVelocityX(0));

    // UI
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: 24,
      color: '#00ffff',
      fontFamily: 'monospace'
    });
    
    this.add.text(16, 48, 'Level: 1', {
      fontSize: 24,
      color: '#00ff00',
      fontFamily: 'monospace'
    });

    // Particle effects
    this.particles = this.add.particles(0, 0, 'particle', { emitting: false });
  }

  update() {
    // Movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-200);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(200);
    } else {
      this.player.setVelocityX(0);
    }

    if (this.cursors.up.isDown && this.player.body?.touching.down) {
      this.jump();
    }

    // Enemy AI
    this.enemies.children.entries.forEach((enemy: any) => {
      if (enemy.body.blocked.left) {
        enemy.setVelocityX(50);
      } else if (enemy.body.blocked.right) {
        enemy.setVelocityX(-50);
      }
    });
  }

  private createLevel() {
    // Ground
    for (let x = 0; x < 800; x += 64) {
      this.platforms.create(x + 32, 584, 'platform');
    }

    // Platforms
    const platformPositions = [
      [200, 450], [400, 400], [600, 350],
      [150, 300], [350, 250], [550, 200],
      [100, 150], [300, 100], [500, 150], [700, 100]
    ];

    platformPositions.forEach(([x, y]) => {
      this.platforms.create(x, y, 'platform');
    });
  }

  private spawnCollectibles() {
    const positions = [
      [200, 400], [400, 350], [600, 300],
      [150, 250], [350, 200], [550, 150],
      [100, 100], [300, 50], [500, 100], [700, 50]
    ];

    positions.forEach(([x, y], index) => {
      const type = index % 2 === 0 ? 'datanode' : 'codefragment';
      const collectible = this.collectibles.create(x, y, type);
      collectible.setData('type', type);
      
      // Floating animation
      this.tweens.add({
        targets: collectible,
        y: y - 10,
        duration: 1000 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }

  private spawnEnemies() {
    const positions = [[300, 200], [500, 350], [200, 100]];
    
    positions.forEach(([x, y]) => {
      const enemy = this.enemies.create(x, y, 'bug');
      enemy.setBounce(1);
      enemy.setCollideWorldBounds(true);
      enemy.setVelocity(Phaser.Math.Between(-50, 50), 0);
    });
  }

  private jump() {
    if (this.player.body?.touching.down) {
      this.player.setVelocityY(-400);
      
      // Jump particles
      this.particles.createEmitter({
        x: this.player.x,
        y: this.player.y + 16,
        speed: { min: 50, max: 150 },
        angle: { min: 80, max: 100 },
        scale: { start: 0.5, end: 0 },
        lifespan: 300,
        quantity: 5
      });
    }
  }

  private collectItem(_player: any, item: any) {
    const type = item.getData('type');
    const points = type === 'datanode' ? 10 : 25;
    
    this.score += points;
    this.scoreText.setText('Score: ' + this.score);
    
    // Collection effect
    this.particles.createEmitter({
      x: item.x,
      y: item.y,
      speed: { min: 50, max: 200 },
      scale: { start: 0.5, end: 0 },
      lifespan: 500,
      quantity: 10,
      tint: type === 'datanode' ? 0x00ff00 : 0xff00ff
    });
    
    item.destroy();
    this.onCollect(type);
    
    // Respawn collectible
    this.time.delayedCall(5000, () => {
      const x = Phaser.Math.Between(50, 750);
      const y = Phaser.Math.Between(50, 400);
      const newItem = this.collectibles.create(x, y, type);
      newItem.setData('type', type);
    });
  }

  private hitEnemy(player: any, enemy: any) {
    if (player.body.velocity.y > 0 && player.y < enemy.y) {
      // Defeat enemy
      enemy.destroy();
      player.setVelocityY(-300);
      this.score += 50;
      this.scoreText.setText('Score: ' + this.score);
      this.onEnemyDefeat();
      
      // Defeat effect
      this.particles.createEmitter({
        x: enemy.x,
        y: enemy.y,
        speed: { min: 100, max: 300 },
        scale: { start: 0.8, end: 0 },
        lifespan: 400,
        quantity: 15,
        tint: 0xff0000
      });
    } else {
      // Player hit
      this.cameras.main.shake(200, 0.01);
      player.setTint(0xff0000);
      this.time.delayedCall(500, () => player.clearTint());
      
      if (this.score > 0) {
        this.score = Math.max(0, this.score - 10);
        this.scoreText.setText('Score: ' + this.score);
      }
    }
  }
}

export default function GameOverlay({ user, onAchievement }: GameOverlayProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: containerRef.current,
      backgroundColor: '#000011',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 600, x: 0 },
          debug: false
        }
      },
      scene: new AODSGameScene(
        (type) => {
          setScore(prev => prev + (type === 'datanode' ? 10 : 25));
          
          // Check achievements
          if (score > 100 && !achievements.includes('collector')) {
            setAchievements(prev => [...prev, 'collector']);
            onAchievement({ id: 'collector', name: 'Data Collector', points: 100 });
          }
        },
        () => {
          // Enemy defeated
          if (!achievements.includes('debugger')) {
            setAchievements(prev => [...prev, 'debugger']);
            onAchievement({ id: 'debugger', name: 'Bug Hunter', points: 200 });
          }
        }
      ),
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
    };
  }, []);

  return (
    <div className="game-overlay">
      <div className="game-header">
        <h2>AODS Gamification Layer</h2>
        <div className="game-stats">
          <span className="stat">Score: {score}</span>
          {user && <span className="stat">Player: {user.username}</span>}
        </div>
      </div>
      
      <div ref={containerRef} className="game-container" />
      
      <div className="game-controls">
        <div className="control-hint">
          <kbd>←</kbd><kbd>→</kbd> or <kbd>A</kbd><kbd>D</kbd> to move
        </div>
        <div className="control-hint">
          <kbd>↑</kbd> or <kbd>W</kbd> to jump
        </div>
        <div className="control-hint">
          Jump on bugs to defeat them!
        </div>
      </div>

      {achievements.length > 0 && (
        <div className="achievements">
          <h3>Achievements Unlocked</h3>
          {achievements.map(ach => (
            <div key={ach} className="achievement-badge">
              {ach === 'collector' && '📊 Data Collector'}
              {ach === 'debugger' && '🐛 Bug Hunter'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
