import * as THREE from 'three';
import * as CANNON from 'cannon';
import { Body, ConvexPolyhedron, Vec3 } from "cannon-es";

export const generateThreeVertices = (rawVerts) => {
  let verts = [];

  for(let v = 0; v < rawVerts.length; v+=3){
    verts.push(new THREE.Vector3(rawVerts[v],
      rawVerts[v+1],
      rawVerts[v+2]));
  }

  return verts;
};

export const generateThreeFaces = (rawFaces) => {
  let faces = [];

  for(let f = 0; f < rawFaces.length; f+=3){
    faces.push(new THREE.Face3(rawFaces[f],
      rawFaces[f+1],
      rawFaces[f+2]));
  }

  return faces;
};


export const generateCannonVertices = (rawVerts) => {
  let verts = [];

  for(let v = 0; v < rawVerts.length; v++){
    verts.push(new Vec3(rawVerts[v].x,
      rawVerts[v].y,
      rawVerts[v].z));
  }

  return verts;
};

export const generateCannonFaces = (rawFaces) => {
  let faces = [];

  for(let f = 0; f < rawFaces.length; f++){
    faces.push([rawFaces[f].a,
      rawFaces[f].b,
      rawFaces[f].c]);
  }

  return faces;
};

export const generateBody = (groups, properties) => {
  const body = new Body({
    mass: properties.mass
  });

  for (let g = 0; g < groups.length; g++) {
    const group = groups[g];
    /*const verts = generateThreeVertices(group.vertices);
    const faces = generateThreeFaces(group.faces);
    const geometry = new THREE.Geometry();
    const material = new THREE.MeshBasicMaterial();

    geometry.vertices = verts;
    geometry.faces = faces;

    const mesh = new THREE.Mesh(geometry, material);

    mesh.scale.copy(properties.scale);

    mesh.updateMatrix();
    mesh.geometry.applyMatrix4(mesh.matrix);
    mesh.geometry.computeFaceNormals();
    mesh.geometry.computeVertexNormals();
    mesh.matrix.identity();*/

    const updatedVerts = generateCannonVertices(group.vertices);
    const updatedFaces = generateCannonFaces(group.faces);

    const polyhedron = new ConvexPolyhedron({ vertices: updatedVerts, faces: updatedFaces });

    body.addShape(polyhedron);
  }

  return body;
};