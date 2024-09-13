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
import * as threeControls from "three-controls";
import { createNoise2D } from "simplex-noise";

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

const canvasElement = renderer.domElement;
document.body.appendChild(canvasElement);

const textureLoader = new THREE.TextureLoader();
const particleTexture = textureLoader.load("/src/assets/tripactions.png");

console.log(particleTexture);

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

const wavyPointsShader = new THREE.ShaderMaterial({
  uniforms: {
    colorA: { type: "vec3", value: new THREE.Color(0xffffff) },
    uTime: { value: 0 },
    uTexture: { value: particleTexture },
  },
  vertexShader: vertexShader(),
  fragmentShader: fragmentShader(),
  transparent: true,
  side: THREE.DoubleSide,
  // wireframe: true
});

const boxGeometry = new THREE.BoxGeometry(24, 16, 16, 80, 40, 40);
const plane1Mesh = new THREE.Mesh(boxGeometry, wavyPointsShader);

const count = boxGeometry.attributes.position.count;
const randoms = new Float32Array(count);
randoms.forEach((item, i) => (randoms[(item, i)] = noise2D(1, 1)));
console.log(noise2D(2, 5));
boxGeometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));

const matrix = new THREE.Matrix4();
matrix.makeShear(0.12, 0, 0, 0, 0, 0);

boxGeometry.applyMatrix4(matrix);

scene.add(plane1Mesh);

const controls = new threeControls.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.1;

camera.position.set(0, 0, 50);
controls.update();

const render = () => {
  wavyPointsShader.uniforms.uTime.value++;
  renderer.render(scene, camera);
  controls.update();
  requestAnimationFrame(render);
};

render();
