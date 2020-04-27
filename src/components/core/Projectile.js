import * as THREE from "three";
import {ProjectileShader} from "../shaders/ProjectileShader";
import gsap from "gsap";

export default class Projectile {
  constructor(tower, landingAreas, scene) {
    this.tower = tower;
    this.landingAreas = landingAreas;
    this.scene = scene;
    this.landingAreaName = "LandingArea";
    this.projAreaName = "Laser";
    this.uniforms = {
      uSize: {type: 'float', value:  -6.0}
    }
  }

  launchSequence(){
    let index = 0
    const tl = gsap.timeline({repeat: -1, repeatDelay: 1});

    tl.to(document, {
      onStart: () => {
        this.uniforms.uSize.value = -6.0;
        this.scene.remove(this.scene.getObjectByName("LandingArea"));
        this.scene.remove(this.scene.getObjectByName( "Laser" ));
        this.landingAreas[index].position.y = 0;
        this.createLandingPoint(this.landingAreas[index].position);
      },
    })
    tl.to(this.uniforms.uSize, {
      onStart: () => {
        this.createProjectileFrom(this.tower.position, this.landingAreas[index].position);
        index = index === this.landingAreas.length - 1 ? 0 : index + 1;
      },
      value: 6.0,
      delay: 2,
      duration: 0.5,
    })
  }

  createTower(coord){
    const geometry = new THREE.SphereGeometry( 1, 12, 12 );
    const material = new THREE.MeshBasicMaterial( {
      color: 0xaa0000,
      transparent: true,
      opacity: 0
    });
    const sphere = new THREE.Mesh( geometry, material );
    sphere.position.x = coord.x;
    sphere.position.y = coord.y;
    sphere.position.z = coord.z;
    this.scene.add( sphere );
  }

  createProjectileFrom(originCoord, endCoord){
    const direction = new THREE.Vector3().subVectors(originCoord, endCoord);
    const orientation = new THREE.Matrix4();
    orientation.lookAt(originCoord, endCoord, new THREE.Object3D().up);
    orientation.multiply(new THREE.Matrix4().set(
      1, 0, 0, 0,
      0, 0, 1, 0,
      0, -1, 0, 0,
      0, 0, 0, 1
    ));

    const geometry = new THREE.CylinderGeometry( 0.05, 0.05, direction.length(), 10 );
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: ProjectileShader.vertexShader,
      fragmentShader: ProjectileShader.fragmentShader,
      transparent: true,
    })
    const cylinder = new THREE.Mesh( geometry, material );
    cylinder.name = this.projAreaName;


    cylinder.applyMatrix4(orientation);
    cylinder.position.x = (endCoord.x + originCoord.x) / 2;
    cylinder.position.y = (endCoord.y + originCoord.y) / 2;
    cylinder.position.z = (endCoord.z + originCoord.z) / 2;

    this.scene.add( cylinder );
  }

  createLandingPoint(coord){
    const geometry = new THREE.CylinderGeometry( 1, 1, 0.5, 10 );
    const material = new THREE.MeshPhongMaterial( {color: 0x0000aa} );
    const landingPoint = new THREE.Mesh(geometry, material);
    landingPoint.name = this.landingAreaName;

    landingPoint.position.x = coord.x;
    landingPoint.position.y = coord.y;
    landingPoint.position.z = coord.z;

    this.scene.add(landingPoint);
  }
}