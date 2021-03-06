import WordFactory from "./WordFactory";
import Scene from "../Scene";
import { Vec3 } from "cannon-es";
import * as THREE from "three";
import State from "../../core/State";
import AudioManager from "../../core/AudioManager";
import { Raycaster } from "three";
import { GAME_STATES } from "../../../constantes";
import TestimonyManager from "../../core/TestimonyManager";
import LoadManager from "../../core/LoadManager";
import {normalize} from "../../../utils";
import gsap from 'gsap';

const wordsDef = [{
  text: 'Inutile',
  mass: 50,
  position: new Vec3(127, 10, -2),
  collide: false,
  movable: true,
  path: 'inutile.glb',
}, {
  text: 'Cuisine',
  mass: 70,
  position: new Vec3(134, 25, -1),
  collide: false,
  movable: true,
  path: 'cuisine.glb',
}, {
  text: 'Moche',
  mass: 100,
  position: new Vec3(143, 70, 0),
  collide: true,
  movable: true,
  path: 'moche.glb',
}, {
  text: 'Pute',
  mass: 150,
  position: new Vec3(157, 70, 0),
  collide: true,
  movable: false,
  path: 'pute.glb',
}, {
  text: 'Salope',
  mass: 170,
  position: new Vec3(148, 70, -1),
  collide: true,
  movable: false,
  path: 'salope.glb',
}];

export default class extends Scene {
  constructor(world, camera, manager, material, sections) {
    super();
    this.world = world;
    this.manager = manager;
    this.sections = sections;
    this.scene.name = "WordScene";
    this.wordIndex = 0;
    // this.scene.fog = new THREE.Fog(0x202533, -1, 100);
    //console.log(this.scene);
    this.factory = new WordFactory(this.scene, this.world, camera, manager, material);
    this.ray = new Raycaster(
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(0,0,0),
      0,
      0.5,
    );
    this.rayWord = new Raycaster(
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(0,0,0),
      0,
      4,
    );
    this.ray.firstHitOnly = true;
    this.rayWord.firstHitOnly = true;

    //TODO enable after player enter section
    document.addEventListener('playerMoved', (e) => {
      this.detectWall(e);
      const word = this.detectWord(e);
      if (word) {
        this.wordFadeIn(word);
      }
    });
    this.init()
    return {
      instance: this,
      scene: this.scene,
    };
  }

  async init() {
    const wordsMeshes = await this.loadWordsMesh();
    this.factory.setMeshes(wordsMeshes);
    this.sections.forEach(s => s.material.visible = false)
  }

  async loadWordsMesh() {
    return await Promise.all(wordsDef.map(async (word) => {
      let gltf = await LoadManager.loadGLTF(`./assets/models/environment/${word.path}`);
      return gltf.scene.children[0];
    }));
  }

  detectWall(e) {
    const playerPosition = new THREE.Vector3().setFromMatrixPosition(e.detail.matrixWorld);
    const direction = new THREE.Vector3( 0, 0, -1 ).applyQuaternion( e.detail.quaternion );
    this.ray.set(playerPosition, direction);
    const objs = this.ray.intersectObjects(this.sections, false);
    if(objs.length === 0) return;
    // TODO refacto
    if (objs[0].object.name === "m1") {
      this.manager.world.getPlayer().spotLight.color.setHex( 0x6d51fb );
      this.dropWord();
      objs[0].object.name += 'Passed';
      this.sections = this.sections.filter(s => s.name !== 'm1');

      setTimeout(() => {
        TestimonyManager.speak('first_badword.mp3', 'first_badword');
      }, 5000)
    }
    if (objs[0].object.name === "m2") {
      this.dropWord();
      objs[0].object.name += 'Passed';
      this.sections = this.sections.filter(s => s.name !== 'm2');
    }
    if (objs[0].object.name === "m3") {
      this.dropWord();
      objs[0].object.name += 'Passed';
      this.sections = this.sections.filter(s => s.name !== 'm3');
      setTimeout(() => {
        TestimonyManager.speak('second_badword.mp3', 'second_badword');
      }, 4000)


      setTimeout(() => {
        this.manager.world.indicationComponent.setIndication('words');
      }, 7000)
    }
    if (objs[0].object.name === "m5") {
      this.dropWord();
      this.manager.world.indicationComponent.removeIndication();
      objs[0].object.name += 'Passed';
      this.sections = this.sections.filter(s => s.name !== 'm3');

      setTimeout(() => {
        this.dropWord();
      }, 4000);
      setTimeout(() => {
        new State().goToState(GAME_STATES.final_black_screen);
      }, 8000);
    }
  }

  detectWord(e){
    const playerPosition = new THREE.Vector3().setFromMatrixPosition(e.detail.matrixWorld);
    const direction = new THREE.Vector3( 0, 0, 1 ).applyQuaternion( e.detail.quaternion );
    this.rayWord.set(playerPosition, direction);
    const hitboxes = this.factory.words.reduce((acc, el) => {
      acc.push(el.children[0]);
      return acc;
    },[]);
    const objs = this.rayWord.intersectObjects(hitboxes, false);
    if(objs.length === 0) return;
    return {object: objs[0].object.parent, distance: objs[0].distance};
    //this.factory.models[0].material.opacity = normalize(objs[0].distance, 0, 6);
  }

  wordFadeIn(word){
    const opacity = normalize(word.distance, 0, 6);
    if(opacity <= 0.2) {
      this.wordFadeOut(word.object.material)
    } else {
      word.object.material.opacity = opacity;
    }
  }

  wordFadeOut(material){
    gsap.to(material, {
      opacity: 1,
      duration: 0.5,
      delay: 1,
    })
  }


  dropWord() {
    document.dispatchEvent(new CustomEvent('npcAudio', { detail: { sequence: 'word' }}));
    this.factory.addWord(wordsDef[this.wordIndex], this.wordIndex);
    this.wordIndex++;
  }

  update() {
    this.factory.update();
  }
}
