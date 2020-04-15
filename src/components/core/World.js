import * as THREE from "three";
import Stats from 'stats.js'
import CameraOperator from "./CameraOperator";
import { GameManager } from "./GameManager";
import { Character } from "../characters/Character";
import LoadManager from './LoadManager';
import { World } from "cannon-es";

export default class {
  constructor(canvas) {
    this.canvas = canvas;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // RenderLoop
    this.clock = new THREE.Clock();
    this.renderDelta = 0;
    this.logicDelta = 0;
    this.sinceLastFrame = 0;

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 8000);
    this.cameraOperator = new CameraOperator(this, this.camera);
    // this.cameraOperator = new CameraOperator(this, this.camera);

    this.world = new World();
    this.world.gravity.set(0, -10, 0);

    this.gameManager = new GameManager(this, this.world, this.camera);
    // Stats showing fps
    this.stats = new Stats();
    this.stats.showPanel(0);
    document.body.appendChild( this.stats.dom );

    this.resize();
    this.render();
    this.loadProps();
  }

  /**
   * Load all environement props
   */
  loadProps() {
    LoadManager.loadGLTF('./assets/models/characters/soldier.glb', (gltf) => {
      this.character = new Character(gltf, this.camera, this.gameManager.sceneManager);
    });
  }


  /**
   * Handle logic to update each frame
   * @param timeStep
   */
  update(timeStep) {
    if(this.character) {
      this.character.update()
    }
    this.gameManager.sceneManager.update();
    this.cameraOperator.renderFollowCamera();
    this.updatePhysics(timeStep);
    // this.cameraOperator.update();
  }

  /**
   * Handle physics logic
   * @param timeStep
   */
  updatePhysics(timeStep) {
    this.world.step(1 / 60);
    this.world.step(timeStep);
  }

  /**
   * Rendering loop
   */
  render() {
    this.stats.begin();
    this.renderDelta = this.clock.getDelta();
    let timeStep = this.renderDelta + this.logicDelta;
    // let timeStep = (this.renderDelta + this.logicDelta) * this.params.Time_Scale;
    this.update(timeStep);
    this.logicDelta = this.clock.getDelta();
    this.renderer.render(this.gameManager.sceneManager.mainScene, this.camera);
    requestAnimationFrame(() => this.render());
    this.stats.end();
  }

  /**
   * Add Object to the world
   * @param object
   */
  add(object) {}

  /**
   * Remove Object to the world
   * @param object
   */
  remove(object) {}

  /**
   * Auto window resize
   */
  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
  }
}
