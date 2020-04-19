import * as THREE from 'three'
import InputManager from "../core/InputManager";
import { Body, Box,  Vec3 } from "cannon-es";
import { makeTextSprite, toRadian } from "../../utils";
import AudioManager from "../core/AudioManager";

const ACTIONS = {
  WALK: 'Walk',
  IDLE: 'Idle',
};

const quartDegree = toRadian(90);

export class Character {
  constructor(gltf, world, camera, sceneManager) {
    this.action = ACTIONS.IDLE;
    this.speed = 0.05;
    this.speed = 0.1;
    this.wakable = true;
    this.world = world;
    this.inputManager = new InputManager();
    this.inputManager.setInputReceiver(this);

    this.raycaster = new THREE.Raycaster();

    this.character = gltf.scene.children.find(el => el.name === 'EMILIE');
    this.character.position.set(0,1,0);

    this.camera = camera;
    // console.log(this.camera);

    //this.character.scale.set(1,1,1);

    this.group = new THREE.Group();

    this.character.material = new THREE.MeshPhongMaterial({
      color: 0xaa0000,
    });

    this.group.add(this.character);
    this.group.position.set(0,0,0);
    AudioManager.groupListener(this.group);

    //console.log(gltf.scene);
    this.mixer = new THREE.AnimationMixer(this.character);
    this.mouse = {
      x: 0,
      y: 0,
    };

    window.addEventListener( 'mousemove', (e) => this.mouseMoveHandler(e), false );

    //this.setAnimations(gltf.animations);
    //this.activateAllActions();
    this.sceneManager = sceneManager;
    this.addBody(sceneManager);
    sceneManager.mainSceneAddObject(this.group);
  }

  addBody(sceneManager) {
    //const mesh = this.character.children.find(el => el.name === 'vanguard_Mesh');
    const mesh = this.character;
    mesh.geometry.computeBoundingBox();
    mesh.size = mesh.geometry.boundingBox.getSize(new THREE.Vector3());
    const center = mesh.geometry.boundingBox.getCenter(new THREE.Vector3());
    const size = {
      x: mesh.size.z / 4.9,
      y: mesh.size.y / 4.9,
      z: mesh.size.z / 4.9,
    };

    // const cylinderShape = new Cylinder(mesh.size.y/2, mesh.size.y/2,  mesh.size.x/2, 8);
    const boxShape = new Box(new Vec3(size.x/2, size.y/2, size.x/2));

    this.character.body = new Body({
      mass: 5,
      shape: boxShape,
      position: new Vec3(this.character.position.x, 5, this.character.position.z),
      // position: new Vec3().copy(this.character.position),
      collisionFilterGroup: 1,
      // collisionFilterMask:  GROUP1 // It can only collide with group 1 (the sphere)
    });
    this.character.body.addEventListener("collide",(e) => {
      // console.log(e);
      // console.log("The character just collided with ", e.name);
      // console.log("Collided with body:",e.body);
      // console.log("Contact between bodies:",e.contact);
    });

    this.world.addBody(this.character.body);
    console.log('size', mesh.size.x, mesh.size.y, mesh.size.z);

    const geometry = new THREE.CylinderGeometry( size.x, size.x, size.y, 8 );
    // const geometry = new THREE.BoxGeometry( mesh.size.y, mesh.size.z, mesh.size.y, 4);
    const material = new THREE.MeshBasicMaterial( { color: 0x00ff00, wireframe: true } );
    this.hitbox = new THREE.Mesh( geometry, material );
    this.hitbox.position.set(0, size.y / 2, 0);
    // this.group.add(this.hitbox);
    sceneManager.mainSceneAddObject(this.hitbox);

    const characterName = makeTextSprite( " Michel ", { fontsize: 20, fontface: "Arial" });
    characterName.position.set(size.x, size.y, size.z);
    this.group.add( characterName );
  }

  destroy() {
    this.inputManager.setInputReceiver(null);
  }

  groupCamera() {
    this.camera.position.set(-9, 6.5, 5.8);
    this.camera.lookAt(this.character.position);
    this.group.add(this.camera);
    this.updateLookAt();
  }

  mouseMoveHandler(event) {
    this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    const obj = this.raycaster.intersectObjects( this.sceneManager.mainScene.children );
    if (obj.length) {
      obj.forEach(el => {
        if (el.object.name !== 'Floor') return;
        const position = {
          x: el.point.x - this.group.position.x,
          z: el.point.z - this.group.position.z
        };
        if (Math.sqrt(position.x * position.x + position.z * position.z) < 0.1) return;
        this.character.rotation.y = Math.atan2(position.x, position.z);
      });
    }
  }

  handleKeyboardEvent(event, code, pressed, moving) {
    if (!this.wakable) return;
    this.isWalking = moving;
    if (!moving && this.action !== ACTIONS.IDLE) {
      this.action = ACTIONS.IDLE;
      // this.prepareCrossFade(this.walkAction, this.idleAction);
      return;
    }
    if (moving && this.action !== ACTIONS.WALK) {
      this.action = ACTIONS.WALK;
      // this.prepareCrossFade(this.idleAction, this.walkAction);
      return;
    }

    this.updateLookAt();
  }


  playerControls() {
    if (this.inputManager.controls.up) {
      this.move(0)
    }
    if (this.inputManager.controls.down) {
      this.move(quartDegree * 2)
    }
    if (this.inputManager.controls.left) {
      this.move(quartDegree)
    }
    if (this.inputManager.controls.right) {
      this.move(-quartDegree)
    }
  }

  move(decay) {
    this.character.body.position.x += Math.sin(this.character.rotation.y + decay) * this.speed;
    this.character.body.position.z += Math.cos(this.character.rotation.y + decay) * this.speed;
    this.group.position.x += Math.sin(this.character.rotation.y + decay) * this.speed;
    this.group.position.z += Math.cos(this.character.rotation.y + decay) * this.speed;
    this.setWalking();
  }

  updateLookAt() {
    // this.camera.lookAt(this.group.position.x - 135, this.group.position.y - 65,  this.group.position.z - 150);
  }

  update() {
    // console.log('vv', this.character.position);
    // console.log('uu', this.character.body.position);
    // this.character.position.copy(this.character.body.position);
    this.hitbox.position.copy(this.character.body.position);
    this.raycaster.setFromCamera( this.mouse, this.camera );
    this.playerControls();
    this.mixer.update( 0.01 );
  }

  setWalking() {
    const playerMovedEvent = new CustomEvent('playerMoved', {
      detail: this.character,
    });
    document.dispatchEvent(playerMovedEvent);
    if (this.isWalking) return;
    //this.prepareCrossFade(this.idleAction, this.walkAction);
    this.isWalking = true;
  }

  setWalkable(value) {
    this.wakable = value;
  }

  setAnimations(animations) {
    this.idleAction = this.mixer.clipAction( animations.find(act => act.name === 'Idle') );
    this.walkAction = this.mixer.clipAction( animations.find(act => act.name === 'Walk') );
    this.actions = [this.idleAction, this.walkAction];
  }

  prepareCrossFade( startAction, endAction, duration = 0.3 ) {
    // Switch default / custom crossfade duration (according to the user's choice)
    // const duration = this.setCrossFadeDuration( defaultDuration );
    this.unPauseAllActions();
    this.executeCrossFade( startAction, endAction, duration );

    // If the current action is 'idle' (duration 4 sec), execute the crossfade immediately;
    // else wait until the current action has finished its current loop// debugger;

    /*    if ( startAction === this.idleAction ) {
     this.executeCrossFade( startAction, endAction, duration );
     } else {
     console.log('synch');
     this.synchronizeCrossFade( startAction, endAction, duration );
     }*/
  }


  synchronizeCrossFade( startAction, endAction, duration ) {
    const onLoopFinished = ( event ) => {
      if ( event.action === startAction ) {
        this.mixer.removeEventListener( 'loop', onLoopFinished );
        this.executeCrossFade( startAction, endAction, duration );
      }
    };
    this.mixer.addEventListener( 'loop', onLoopFinished );
  }

  executeCrossFade( startAction, endAction, duration ) {
    // Not only the start action, but also the end action must get a weight of 1 before fading
    // (concerning the start action this is already guaranteed in this place)
    this.setWeight( endAction, 1 );
    endAction.time = 0;

    // Crossfade with warping - you can also try without warping by setting the third parameter to false
    startAction.crossFadeTo( endAction, duration, true );
  }

  setWeight( action, weight ) {
    action.enabled = true;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight( weight );
  }

  activateAllActions() {
    this.setWeight( this.idleAction, 1);
    this.setWeight( this.walkAction, 0 );
    this.actions.forEach(( action ) => action.play());
  }

  pauseContinue() {
    if ( this.idleAction.paused ) {
      this.unPauseAllActions();
      return
    }
    this.pauseAllActions();
  }

  pauseAllActions() {
    this.actions.forEach(( action ) => action.paused = true);
  }

  unPauseAllActions() {
    this.actions.forEach(( action ) => action.paused = false);
  }
}
