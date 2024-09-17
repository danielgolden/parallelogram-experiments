// Ingredients:

// scene
// - mesh
// - lights

// Canvas

// Mesh
// - Geometery
// - Material (color and shininess)

// Renderer
// Scene, Camera

import * as THREE from "three";
import { RGBELoader } from "./RGBELoader.js";
import * as threeControls from "three-controls";
import { RoundedBoxGeometry } from "./RoundedBoxGeometry.js";
import { Pane } from "tweakpane";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.01,
  100
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio));

const options = {
  roughness: 0.2,
  transparency: 1,
  refraction: 5.0,
  envMapIntensity: 0.93,
  clearcoat: 0.62,
  clearCoatRoughness: 0.43,
  normalMapScale: 0.46,
  clearcoatNormalMapScale: 0.46,
  parallelogramRoundness: 0.65,
};

const light = new THREE.DirectionalLight(0xfff0dd, 1);
light.position.set(0, 5, 10);
scene.add(light);

const canvasElement = renderer.domElement;
document.body.appendChild(canvasElement);

// Background image/texture
const bgTexture = new THREE.TextureLoader().load(
  "https://images.ctfassets.net/fzn2n1nzq965/N0gVixgiNIg1HmOaDSN39/cf42f1d0720d2eb28991d17c48c63b21/blog_index_image_1250x1250.png"
);
const bgGeometry = new THREE.PlaneGeometry(20, 20);
const bgMaterial = new THREE.MeshBasicMaterial({
  map: bgTexture,
});
const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
bgMesh.position.set(0, 0, -1);
scene.add(bgMesh);

// Parallelogram normal map texture
const normalMapTexture = new THREE.TextureLoader().load(
  "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/patterned_clay_plaster/patterned_clay_plaster_nor_gl_1k.jpg",
  () => console.log("it worked"),
  () => console.log("in progress"),
  (error) => console.log("⚠️ Error loading the normal map", error)
);
normalMapTexture.wrapS = THREE.RepeatWrapping;
normalMapTexture.wrapT = THREE.RepeatWrapping;
normalMapTexture.repeat.set(options.normalMapScale, options.normalMapScale);

// Environment map
const hdrEquirect = new RGBELoader().load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/brown_photostudio_02_2k.hdr",
  () => {
    hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
  }
);

const material = new THREE.MeshPhysicalMaterial({
  roughness: options.roughness,
  transmission: options.transparency,
  thickness: options.refraction,
  envMap: hdrEquirect,
  envMapIntensity: options.envMapIntensity,
  clearcoat: options.clearcoat,
  clearCoatRoughness: options.clearCoatRoughness,
  normalScale: new THREE.Vector2(
    options.normalMapScale,
    options.normalMapScale
  ),
  normalMap: normalMapTexture,
  clearcoatNormalMap: normalMapTexture,
  clearcoatNormalScale: new THREE.Vector2(
    options.clearcoatNormalMapScale,
    options.clearcoatNormalMapScale
  ),
  // wireframe: true,
});

// Parallelogram
const boxGeometry = new RoundedBoxGeometry(
  10,
  6,
  6,
  10,
  options.parallelogramRoundness
);
const parallelogramMesh = new THREE.Mesh(boxGeometry, material);

const matrix = new THREE.Matrix4();
matrix.makeShear(0.12, 0, 0, 0, 0, 0);
boxGeometry.applyMatrix4(matrix);
parallelogramMesh.position.set(0, 0, 5);

scene.add(parallelogramMesh);
scene.environment;

// Orbit controls
const controls = new threeControls.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.1;

camera.position.set(0, 0, 70);
controls.update();

// Tweakpane controls
const pane = new Pane();

pane.addBinding(material, "roughness", {
  label: "Clarity",
  min: 0,
  max: 1,
  inverted: true,
});
pane.addBinding(material, "transmission", {
  label: "Transparency",
  min: 0,
  max: 1,
  inverted: true,
});
pane.addBinding(material, "thickness", {
  label: "Refraction",
  min: 0,
  max: 15,
});
pane.addBinding(material, "clearcoat", {
  min: 0,
  max: 1,
});
pane.addBinding(material, "clearcoatRoughness", {
  min: 0,
  max: 1,
});
pane.addBinding(material, "envMapIntensity", {
  label: "Env. 💡",
  min: 0,
  max: 1,
});
pane
  .addBinding(material, "normalScale", {
    label: "Texture",
    y: { inverted: true, min: -1, max: 1 },
    x: { inverted: true, min: -1, max: 1 },
  })
  .on("change", function (e) {
    material.clearcoatNormalScale = e.value;
  });
pane.addBinding(material, "color");

// Render it all
const render = () => {
  material;
  renderer.render(scene, camera);
  controls.update();
  requestAnimationFrame(render);
};

render();
