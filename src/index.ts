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
import { createNoise2D } from "simplex-noise";
import { RoundedBoxGeometry } from "./RoundedBoxGeometry.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.01,
  100
);
const noise2D = createNoise2D();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio));

const light = new THREE.DirectionalLight(0xfff0dd, 1);
light.position.set(0, 5, 10);
scene.add(light);

const canvasElement = renderer.domElement;
document.body.appendChild(canvasElement);

const bgTexture = new THREE.TextureLoader().load(
  "https://images.ctfassets.net/fzn2n1nzq965/N0gVixgiNIg1HmOaDSN39/cf42f1d0720d2eb28991d17c48c63b21/blog_index_image_1250x1250.png"
);
const bgGeometry = new THREE.PlaneGeometry(20, 20);
const bgMaterial = new THREE.MeshBasicMaterial({
  map: bgTexture,
});
const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
bgMesh.position.set(0, 0, -1);
// const textureLoader = new THREE.TextureLoader();
// const particleTexture = textureLoader.load("/src/assets/tripactions.png");

// console.log(bgTexture);
scene.add(bgMesh);

const normalMapTexture = new THREE.TextureLoader().load(
  "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/painted_plaster_wall/painted_plaster_wall_nor_gl_2k.jpg",
  () => console.log("it worked"),
  () => console.log("in progress"),
  (error) => console.log("⚠️ Error loading the normal map", error)
);
normalMapTexture.wrapS = THREE.RepeatWrapping;
normalMapTexture.wrapT = THREE.RepeatWrapping;
normalMapTexture.repeat.set(0.5, 0.5);

const fragmentShader = () => {
  return `
      uniform vec3 colorA;
      uniform float uTime;
      uniform sampler2D uTexture;

      varying vec2 vUv;
      varying float zPosition;

      float circle(in vec2 _st, in float _radius){
        vec2 l = _st-vec2(0.5);
        return 1.-smoothstep(_radius-(_radius*0.1),
                             _radius+(_radius*0.1),
                             dot(l,l)*100.0);
      }

      void main() {
        vec3 color = vec3(0.0);
        vec2 new_vUv = vUv * 100.0;
        new_vUv = fract(new_vUv);

        color = vec3(circle(new_vUv, 0.5));
        if (color.r < 0.1) discard;
        gl_FragColor = vec4(color, (zPosition + .540) * 1.150);
      }
  `;
};

const vertexShader = () => {
  return `
    uniform float uTime;

    attribute float aRandom;

    varying vec2 vUv;
    varying float zPosition;
    
    void main() {
      float speed = 0.025;
      float amplitude = 0.25;
      float waveCount = 3.0;
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);

      modelPosition.x += sin((cos(modelPosition.y) * waveCount) + (uTime * speed * 4.0)) * amplitude / 10.0;
      modelPosition.y += sin((cos(modelPosition.x) * waveCount) + (uTime * speed * 4.0)) * amplitude / 10.0;
      modelPosition.z += sin(((cos(modelPosition.x) * cos(modelPosition.y)) * waveCount) + (uTime * speed)) * amplitude;
      
      gl_Position = projectionMatrix * viewMatrix * modelPosition;

      vUv = uv;
      zPosition = modelPosition.z;
    }
  `;
};

const hdrEquirect = new RGBELoader().load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/empty_warehouse_01_2k.hdr",
  () => {
    hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
  }
);

// const hdrEquirect = new RGBELoader().load(
//   "./src/empty_warehouse_01_4k.hdr",
//   (texture) => {
//     texture.mapping = THREE.EquirectangularReflectionMapping;
//   }
// );

const material = new THREE.MeshPhysicalMaterial({
  roughness: 0.75,
  transmission: 0.9875, // Transparency
  thickness: 1.25, // Refraction!
  envMap: hdrEquirect,
  envMapIntensity: 0.5,
  clearcoat: 1,
  clearCoatRoughness: 1,
  normalScale: new THREE.Vector2(1),
  normalMap: normalMapTexture,
  clearcoatNormalMap: normalMapTexture,
  clearcoatNormalScale: new THREE.Vector2(1),
  // wireframe: true,
});

// const wavyPointsShaderMaterial = new THREE.ShaderMaterial({
//   uniforms: {
//     colorA: { type: "vec3", value: new THREE.Color(0xffffff) },
//     uTime: { value: 0 },
//     uTexture: { value: particleTexture },
//   },
//   vertexShader: vertexShader(),
//   fragmentShader: fragmentShader(),
//   transparent: true,
//   side: THREE.DoubleSide,
//   // wireframe: true
// });

material.color.setHSL(0, 40, 10);

const boxGeometry = new RoundedBoxGeometry(10, 6, 6, 10, 0.45);
const parallelogramMesh = new THREE.Mesh(boxGeometry, material);

console.log({ parallelogramMesh });

const count = boxGeometry.attributes.position.count;
const randoms = new Float32Array(count);
randoms.forEach((item, i) => (randoms[(item, i)] = noise2D(1, 1)));
console.log(noise2D(2, 5));
// boxGeometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));

const matrix = new THREE.Matrix4();
matrix.makeShear(0.12, 0, 0, 0, 0, 0);

boxGeometry.applyMatrix4(matrix);
parallelogramMesh.position.set(0, 0, 5);

scene.add(parallelogramMesh);
scene.environment;

const controls = new threeControls.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.1;

camera.position.set(0, 0, 70);
controls.update();

const render = () => {
  // material;
  renderer.render(scene, camera);
  controls.update();
  requestAnimationFrame(render);
};

render();
