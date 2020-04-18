import * as THREE from "three";
import { Curves } from "three/examples/jsm/curves/CurveExtras";
import { SceneUtils } from "three/examples/jsm/utils/SceneUtils";

export default class {
  constructor(world, camera) {
    this.world = world;
    // this.splineCamera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 8000 );
    this.camera = camera;
    this.travelling = false;
    this.targetRotation = 0;

    this.binormal = new THREE.Vector3();
    this.normal = new THREE.Vector3();
    this.parent = new THREE.Object3D();
    // console.log(this.scene);
    this.tube = null;
    this.tubeMesh = null;
    this.lookAhead = true;
    this.scale = 1;
    this.offset = 100;
  }

  /**
   * Set render camera travelling
   * @param isTravelling
   */
  setTravelling(isTravelling) {
    this.travelling = isTravelling;
  }

  /**
   *
   * @param spline
   * @param segNum
   * @param closeBool
   * @param radSeg
   * @param mesh
   * @param scaleVar
   * @param geoSide
   * @param color
   */
  addTube(spline, segNum, closeBool, radSeg, mesh, scaleVar, geoSide, color) {
    const segments = segNum || 100;
    const radiusSegments = radSeg || 3;
    this.mesh = this.mesh || null;

    if (this.tubeMesh) parent.remove(this.tubeMesh);

    this.tube = new THREE.TubeGeometry(spline, segments, 2, radiusSegments, this.closed);
    color = color || 0x2194ce;
    geoSide = geoSide || THREE.DoubleSide;

    this.addGeometry(this.tube, mesh, color, geoSide);

    this.scale = scaleVar || 1;
    this.tubeMesh.scale.set( this.scale, this.scale, this.scale );
  }


  addGeometry(geometry, mesh, color, geoSide) {
    // 3d shape
    if(this.mesh === null) {
      this.tubeMesh = SceneUtils.createMultiMaterialObject( geometry, [
        new THREE.MeshLambertMaterial({
          color: color,
          side: geoSide
        }),
        new THREE.MeshBasicMaterial({
          color: 0x000000,
          opacity: 0.3,
          wireframe: true,
          transparent: true
        })]);
    } else {
      this.tubeMesh = mesh;
    }

    this.parent.add( this.tubeMesh );
  }


  /**
   * Animate the camera along the spline
   */
  renderFollowCamera() {
    if (!this.travelling) return;
    const time = Date.now();
    const looptime = 20 * 1000;
    const t = ( time % looptime ) / looptime;

    const pos = this.tube.parameters.path.getPointAt( t );
    pos.multiplyScalar( this.scale );

    // interpolation
    const segments = this.tube.tangents.length;
    const pickt = t * segments;
    const pick = Math.floor( pickt );
    const pickNext = ( pick + 1 ) % segments;

    this.binormal.subVectors( this.tube.binormals[ pickNext ], this.tube.binormals[ pick ] );
    this.binormal.multiplyScalar( pickt - pick ).add( this.tube.binormals[ pick ] );


    const dir = this.tube.parameters.path.getTangentAt( t );

    this.normal.copy( this.binormal ).cross( dir );

    // We move on a offset on its binormal
    pos.add( this.normal.clone().multiplyScalar( this.offset ) );

    this.camera.position.copy( pos );

    // Using arclength for stablization in look ahead.
    const lookAt = this.tube.parameters.path.getPointAt( ( t + 30 / this.tube.parameters.path.getLength() ) % 1 ).multiplyScalar( this.scale );

    // Camera Orientation 2 - up orientation via normal
    if (!this.lookAhead) {
      lookAt.copy( pos ).add( dir );
    }
    this.camera.matrix.lookAt(this.camera.position, lookAt, this.normal);
    this.camera.rotation.setFromRotationMatrix( this.camera.matrix, this.camera.rotation.order );

    this.parent.rotation.y += ( this.targetRotation - this.parent.rotation.y ) * 0.05;
  }
}