import Phaser from "phaser";
import { SECTIONS, type SectionDef, type SectionId } from "@/lib/sections";
import { gameStore, onCommand, touchInput } from "@/lib/store/gameStore";
import { hexToNumber } from "@/theme/tokens";
import { carX, NEAR_DISTANCE, PLAYER_START_X, WORLD_WIDTH } from "./layout";
import { CAR_H, CAR_W, CARS_KEY, carFrame, createCarTextures } from "./sprites/cars";
import { createPlayerTextures, PLAYER_KEY } from "./sprites/character";
import { createFxTextures } from "./sprites/fx";

export interface SceneOptions {
  fonts: { title: string; mono: string };
  reducedMotion: boolean;
  /** Appelé quand la voiture a quitté l'écran : React lance la transition + router.push(). */
  onEnter: (section: SectionDef) => void;
  /** Appelé quand le retour d'une section a été pris en compte. */
  onReturnConsumed: () => void;
}

export interface SceneData {
  playerX?: number;
  returnFrom?: SectionId | null;
}

interface Car {
  def: SectionDef;
  homeX: number;
  sprite: Phaser.GameObjects.Image;
  sign: Phaser.GameObjects.Container;
}

const SPEED = 280;
const JUMP_SPEED = 640;
const GRAVITY = 1700;

type Keys = Record<"left" | "right" | "up" | "space" | "a" | "q" | "d" | "w" | "z", Phaser.Input.Keyboard.Key>;

export class StreetScene extends Phaser.Scene {
  private opts: SceneOptions;
  private startData: SceneData = {};
  private player!: Phaser.GameObjects.Sprite;
  private shadow!: Phaser.GameObjects.Ellipse;
  private keys!: Keys;
  private cars: Car[] = [];
  private near: Car | null = null;
  private busy = false;
  private grounded = true;
  private vy = 0;
  private autoTargetX: number | null = null;
  private baseY = 0;
  private playerY = 0;
  private lastSync = 0;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(opts: SceneOptions) {
    super("street");
    this.opts = opts;
  }

  init(data: SceneData) {
    this.startData = data ?? {};
    this.cars = [];
    this.near = null;
    this.busy = false;
    this.grounded = true;
    this.vy = 0;
    this.autoTargetX = null;
  }

  preload() {
    this.load.on("progress", (v: number) => gameStore.set({ progress: 0.4 + v * 0.5 }));
    if (!this.textures.exists("skyline")) this.load.svg("skyline", "/assets/decor/skyline.svg", { width: 800, height: 200 });
    if (!this.textures.exists("palm")) this.load.svg("palm", "/assets/decor/palm.svg", { width: 200, height: 320 });
  }

  create() {
    createFxTextures(this);
    createPlayerTextures(this);
    createCarTextures(this);

    const W = this.scale.width;
    const H = this.scale.height;
    this.baseY = Math.round(H - Phaser.Math.Clamp(H * 0.13, 56, 110));
    this.playerY = this.baseY + 16;

    this.buildDecor(W, H);
    this.buildCars();
    this.buildPlayer();

    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_WIDTH, H);
    cam.setRoundPixels(true);
    cam.startFollow(this.player, true, 0.1, 0.1);

    this.setupInput();

    const off = onCommand((c) => {
      if (c === "enter") this.tryEnter();
    });
    const onResize = () => {
      if (this.resizeTimer) clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        if (!this.busy) this.scene.restart({ playerX: this.player.x } satisfies SceneData);
      }, 250);
    };
    this.scale.on("resize", onResize);
    this.events.once("shutdown", () => {
      off();
      this.scale.off("resize", onResize);
      if (this.resizeTimer) clearTimeout(this.resizeTimer);
    });

    if (this.startData.returnFrom) {
      this.playReturn(this.startData.returnFrom);
      this.opts.onReturnConsumed();
    }
    gameStore.set({ progress: 1, ready: true, busy: this.busy, nearCar: null });
  }

  // --- Décor en parallaxe ------------------------------------------------------

  private buildDecor(W: number, H: number) {
    const reduced = this.opts.reducedMotion;
    const promenadeTop = this.baseY - 64;
    const oceanH = Phaser.Math.Clamp(H * 0.16, 46, 150);
    const horizonY = promenadeTop - oceanH;

    // Plan lointain : ciel, étoiles, soleil, skyline (défile très peu)
    this.add.image(0, 0, "fx-sky").setOrigin(0).setScrollFactor(0).setDisplaySize(W, horizonY + 2);
    for (let i = 0; i < 34; i++) {
      const star = this.add
        .rectangle(Phaser.Math.Between(0, W), Phaser.Math.Between(4, horizonY * 0.5), 2, 2, 0xfff4e8)
        .setScrollFactor(0.02)
        .setAlpha(Phaser.Math.FloatBetween(0.3, 0.9));
      if (!reduced) {
        this.tweens.add({
          targets: star,
          alpha: 0.15,
          duration: Phaser.Math.Between(900, 2400),
          yoyo: true,
          repeat: -1,
          delay: Phaser.Math.Between(0, 2000),
        });
      }
    }
    const sunSize = Phaser.Math.Clamp(H * 0.36, 110, 290);
    const sunX = W * 0.62;
    this.add
      .image(sunX, horizonY + sunSize * 0.08, "fx-sun")
      .setOrigin(0.5, 1)
      .setDisplaySize(sunSize, sunSize)
      .setScrollFactor(0.03);
    const skyH = Phaser.Math.Clamp(H * 0.17, 48, 150);
    this.add
      .tileSprite(0, horizonY + 2, W + (WORLD_WIDTH - W) * 0.2 + 40, skyH, "skyline")
      .setOrigin(0, 1)
      .setTileScale(skyH / 200)
      .setScrollFactor(0.2);

    // Océan + reflets du soleil
    this.add
      .image(0, horizonY, "fx-ocean")
      .setOrigin(0)
      .setScrollFactor(0)
      .setDisplaySize(W, promenadeTop - horizonY + 4);
    const reflets = this.add.graphics().setScrollFactor(0.03);
    for (let i = 0; i < 6; i++) {
      const w = sunSize * (0.95 - i * 0.14);
      reflets.fillStyle(i % 2 ? 0xff9f45 : 0xff3d8b, 0.55 - i * 0.06);
      reflets.fillRect(sunX - w / 2, horizonY + 5 + i * (oceanH / 7), w, 3);
    }
    if (!reduced) this.tweens.add({ targets: reflets, alpha: 0.55, duration: 1400, yoyo: true, repeat: -1 });
    for (let i = 0; i < 18; i++) {
      const wave = this.add
        .rectangle(
          Phaser.Math.Between(0, W + 400),
          Phaser.Math.Between(horizonY + 8, promenadeTop - 6),
          Phaser.Math.Between(14, 40),
          2,
          0xc9b8e8,
          0.35,
        )
        .setScrollFactor(0.1);
      if (!reduced) {
        this.tweens.add({ targets: wave, alpha: 0, duration: Phaser.Math.Between(1200, 2600), yoyo: true, repeat: -1 });
      }
    }

    // Plan intermédiaire : palmiers de la promenade
    const palmH = Phaser.Math.Clamp(H * 0.44, 150, 340);
    for (let x = 140; x < W + (WORLD_WIDTH - W) * 0.6 + 200; x += Phaser.Math.Between(300, 460)) {
      this.add
        .image(x, promenadeTop + 10, "palm")
        .setOrigin(0.5, 1)
        .setDisplaySize(palmH * 0.625, palmH)
        .setFlipX(Math.random() > 0.5)
        .setScrollFactor(0.6);
    }

    // Plan principal : promenade, rambarde néon, route
    const g = this.add.graphics();
    g.fillStyle(0x241540).fillRect(0, promenadeTop, WORLD_WIDTH, this.baseY - 24 - promenadeTop);
    g.fillStyle(0x3a2366);
    for (let x = 0; x < WORLD_WIDTH; x += 40) g.fillRect(x, promenadeTop + 2, 3, 16);
    g.lineStyle(7, 0xff3d8b, 0.22).lineBetween(0, promenadeTop + 2, WORLD_WIDTH, promenadeTop + 2);
    g.lineStyle(2, 0xff3d8b, 1).lineBetween(0, promenadeTop + 2, WORLD_WIDTH, promenadeTop + 2);
    g.fillStyle(0x1b1233).fillRect(0, this.baseY - 24, WORLD_WIDTH, H - this.baseY + 24);
    g.fillStyle(0x3a2366).fillRect(0, this.baseY - 24, WORLD_WIDTH, 4);
    g.fillStyle(0xffd166, 0.75);
    const laneY = Math.min(H - 8, this.playerY + 12);
    for (let x = 0; x < WORLD_WIDTH; x += 90) g.fillRect(x, laneY, 44, 3);
    g.fillStyle(0xfff4e8, 0.45);
    SECTIONS.forEach((_, i) => {
      g.fillRect(carX(i) - CAR_W / 2 - 24, this.baseY - 20, 4, 22);
      g.fillRect(carX(i) + CAR_W / 2 + 20, this.baseY - 20, 4, 22);
    });

    // Premier plan : palmiers qui défilent plus vite que la rue
    for (let i = 0; i < 4; i++) {
      this.add
        .image(420 + i * 1100, H + 30, "palm")
        .setOrigin(0.5, 1)
        .setDisplaySize(palmH * 0.85, palmH * 1.36)
        .setScrollFactor(1.25)
        .setDepth(40)
        .setAlpha(0.92);
    }
  }

  // --- Voitures + panneaux néon -----------------------------------------------

  private buildCars() {
    SECTIONS.forEach((def, index) => {
      const homeX = carX(index);
      const color = hexToNumber(def.color);
      this.add.ellipse(homeX, this.baseY - 2, CAR_W * 0.95, 14, color, 0.28).setDepth(9);
      const sprite = this.add
        .image(homeX, this.baseY, CARS_KEY, carFrame(def.car, false))
        .setOrigin(0.5, 1)
        .setDepth(10)
        .setInteractive({ useHandCursor: true });
      const sign = this.makeSign(def, homeX, this.baseY - CAR_H - 52);
      const car: Car = { def, homeX, sprite, sign };
      // Tap / clic sur la voiture : le personnage y va tout seul.
      sprite.on("pointerdown", () => this.walkTo(car));
      this.cars.push(car);
    });
  }

  private makeSign(def: SectionDef, x: number, y: number) {
    const color = hexToNumber(def.color);
    const text = this.add
      .text(0, 0, def.label.toUpperCase(), { fontFamily: this.opts.fonts.title, fontSize: "26px", color: def.color })
      .setOrigin(0.5)
      .setShadow(0, 0, def.color, 14, true, true);
    const w = text.width + 34;
    const h = text.height + 14;
    const frame = this.add.graphics();
    frame.fillStyle(0x3a2366).fillRect(-2, h / 2, 4, 38);
    frame.fillStyle(0x0e0820, 0.78).fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    frame.lineStyle(9, color, 0.18).strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    frame.lineStyle(3, color, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    const sign = this.add.container(x, y, [frame, text]).setDepth(8);

    if (!this.opts.reducedMotion) {
      this.tweens.add({ targets: sign, y: y - 5, duration: 1700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      this.time.addEvent({
        delay: Phaser.Math.Between(2500, 6000),
        loop: true,
        callback: () =>
          this.tweens.add({ targets: text, alpha: 0.35, duration: 60, yoyo: true, repeat: Phaser.Math.Between(1, 3) }),
      });
    }
    return sign;
  }

  // --- Personnage --------------------------------------------------------------

  private buildPlayer() {
    const x = Phaser.Math.Clamp(this.startData.playerX ?? PLAYER_START_X, 40, WORLD_WIDTH - 40);
    this.shadow = this.add.ellipse(x, this.playerY, 40, 8, 0x000000, 0.4).setDepth(19);
    this.player = this.add.sprite(x, this.playerY, PLAYER_KEY, "idle-0").setOrigin(0.5, 1).setDepth(20);
    this.player.play("player-idle");
  }

  private setupInput() {
    const kb = this.input.keyboard;
    if (!kb) return;
    // enableCapture = false : on n'empêche pas Espace / flèches sur les boutons de la page (accessibilité).
    this.keys = kb.addKeys(
      { left: "LEFT", right: "RIGHT", up: "UP", space: "SPACE", a: "A", q: "Q", d: "D", w: "W", z: "Z" },
      false,
    ) as Keys;
    kb.on("keydown-E", () => this.tryEnter());
  }

  update(time: number, delta: number) {
    const dt = Math.min(delta, 50) / 1000;
    if (!this.busy && this.keys) {
      const k = this.keys;
      const left = k.left.isDown || k.a.isDown || k.q.isDown || touchInput.left;
      const right = k.right.isDown || k.d.isDown || touchInput.right;
      const jump = k.up.isDown || k.space.isDown || k.w.isDown || k.z.isDown || touchInput.jump;

      let vx = 0;
      if (left || right) this.autoTargetX = null;
      if (left) vx -= SPEED;
      if (right) vx += SPEED;
      if (this.autoTargetX !== null) {
        const d = this.autoTargetX - this.player.x;
        if (Math.abs(d) < 6) this.autoTargetX = null;
        else vx = Math.sign(d) * SPEED;
      }
      if (jump && this.grounded) {
        this.vy = -JUMP_SPEED;
        this.grounded = false;
      }

      this.player.x = Phaser.Math.Clamp(this.player.x + vx * dt, 30, WORLD_WIDTH - 30);
      if (!this.grounded) {
        this.vy += GRAVITY * dt;
        this.player.y += this.vy * dt;
        if (this.player.y >= this.playerY) {
          this.player.y = this.playerY;
          this.vy = 0;
          this.grounded = true;
        }
      }
      if (vx !== 0) this.player.setFlipX(vx < 0);
      const anim = !this.grounded ? "player-jump" : vx !== 0 ? "player-walk" : "player-idle";
      if (this.player.anims.currentAnim?.key !== anim) this.player.play(anim);
      this.updateNear();
    }

    const height = this.playerY - this.player.y;
    this.shadow.setPosition(this.player.x, this.playerY).setScale(Math.max(0.4, 1 - height / 200));
    this.shadow.setVisible(this.player.alpha > 0.5);

    if (time - this.lastSync > 100) {
      this.lastSync = time;
      gameStore.set({ playerX: this.player.x });
    }
  }

  private updateNear() {
    let best: Car | null = null;
    let bestD = NEAR_DISTANCE;
    for (const car of this.cars) {
      const d = Math.abs(car.homeX - this.player.x);
      if (d < bestD) {
        best = car;
        bestD = d;
      }
    }
    if (best !== this.near) {
      this.near = best;
      gameStore.set({ nearCar: best?.def.id ?? null });
      for (const car of this.cars) car.sign.setScale(car === best ? 1.12 : 1);
    }
  }

  private walkTo(car: Car) {
    if (this.busy) return;
    this.autoTargetX = car.homeX - 10;
  }

  private tryEnter() {
    if (this.busy || !this.near) return;
    this.enterCar(this.near);
  }

  // --- Entrée dans une voiture -------------------------------------------------

  private enterCar(car: Car) {
    this.busy = true;
    this.autoTargetX = null;
    gameStore.set({ busy: true, nearCar: null });
    const doorX = car.homeX - 10;

    this.player.play("player-walk").setFlipX(doorX < this.player.x);
    this.tweens.add({
      targets: this.player,
      x: doorX,
      y: this.playerY,
      duration: Math.min(500, Math.abs(doorX - this.player.x) * 4 + 80),
      onComplete: () => {
        car.sprite.setFrame(carFrame(car.def.car, true)); // portière ouverte
        this.player.play("player-idle");
        this.tweens.add({
          targets: this.player,
          alpha: 0,
          y: this.playerY - 12,
          duration: 260,
          delay: 160,
          onComplete: () => {
            car.sprite.setFrame(carFrame(car.def.car, false));
            this.driveAway(car);
          },
        });
      },
    });
  }

  private headlights(car: Car) {
    const beam = this.add
      .image(car.sprite.x + CAR_W / 2 - 6, car.sprite.y - CAR_H * 0.6, "fx-beam")
      .setOrigin(0, 0.5)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0)
      .setDepth(11);
    this.tweens.add({ targets: beam, alpha: 0.9, duration: 200 });
    const smoke = this.add
      .particles(0, 0, "fx-smoke", {
        follow: car.sprite,
        followOffset: { x: -CAR_W / 2 + 4, y: -14 },
        speedX: { min: -90, max: -30 },
        speedY: { min: -30, max: -5 },
        scale: { start: 0.5, end: 1.8 },
        alpha: { start: 0.55, end: 0 },
        lifespan: 900,
        frequency: this.opts.reducedMotion ? 140 : 35,
      })
      .setDepth(9);
    const follow = () => beam.setPosition(car.sprite.x + CAR_W / 2 - 6, car.sprite.y - CAR_H * 0.6);
    return { beam, smoke, follow };
  }

  private driveAway(car: Car) {
    const reduced = this.opts.reducedMotion;
    const cam = this.cameras.main;
    cam.stopFollow();
    const { smoke, follow } = this.headlights(car);
    if (!reduced) {
      cam.shake(380, 0.006);
      this.tweens.add({ targets: car.sprite, y: this.baseY - 2, duration: 45, yoyo: true, repeat: 5 });
    }
    this.time.delayedCall(reduced ? 150 : 450, () => {
      this.tweens.add({
        targets: car.sprite,
        x: cam.scrollX + this.scale.width + CAR_W,
        duration: reduced ? 500 : 1150,
        ease: "Cubic.easeIn",
        onUpdate: follow,
        onComplete: () => {
          smoke.stop();
          this.opts.onEnter(car.def);
        },
      });
    });
  }

  // --- Retour depuis une section : la voiture revient se garer -----------------

  private playReturn(id: SectionId) {
    const car = this.cars.find((c) => c.def.id === id);
    if (!car) return;
    const reduced = this.opts.reducedMotion;
    const cam = this.cameras.main;
    this.busy = true;
    cam.stopFollow();
    cam.centerOn(car.homeX, this.scale.height / 2);
    this.player.setPosition(car.homeX - 10, this.playerY - 12).setAlpha(0);
    car.sprite.x = car.homeX - this.scale.width * 0.7 - CAR_W;

    const { beam, smoke, follow } = this.headlights(car);
    this.tweens.add({
      targets: car.sprite,
      x: car.homeX,
      duration: reduced ? 400 : 1100,
      ease: "Cubic.easeOut",
      onUpdate: follow,
      onComplete: () => {
        smoke.stop();
        this.tweens.add({ targets: beam, alpha: 0, duration: 250, onComplete: () => beam.destroy() });
        car.sprite.setFrame(carFrame(car.def.car, true));
        this.tweens.add({
          targets: this.player,
          alpha: 1,
          y: this.playerY,
          duration: 260,
          delay: 120,
          onComplete: () => {
            car.sprite.setFrame(carFrame(car.def.car, false));
            this.player.play("player-walk").setFlipX(false);
            this.tweens.add({
              targets: this.player,
              x: car.homeX + 80,
              duration: 350,
              onComplete: () => {
                this.player.play("player-idle");
                this.busy = false;
                gameStore.set({ busy: false });
                cam.startFollow(this.player, true, 0.1, 0.1);
              },
            });
          },
        });
      },
    });
  }
}
