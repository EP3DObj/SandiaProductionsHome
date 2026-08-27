import * as THREE from "three/webgpu";
import { float, instancedBufferAttribute, texture } from "three/tsl";

function createStarTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.6)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  const starTexture = new THREE.CanvasTexture(canvas);
  starTexture.colorSpace = THREE.SRGBColorSpace;
  return starTexture;
}

export default function getStarfield({ numStars = 500 } = {}) {
  function randomSpherePoint() {
    const radius = Math.random() * 25 + 25;
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    let x = radius * Math.sin(phi) * Math.cos(theta);
    let y = radius * Math.sin(phi) * Math.sin(theta);
    let z = radius * Math.cos(phi);
    const rate = Math.random() * 0.005;
    const prob = Math.random();
    const light = Math.random();
    function update(t) {
      const lightness = prob > 0.9 ? light + Math.sin(t * rate) * 1 : light;
      return lightness;
    }
    return {
      pos: new THREE.Vector3(x, y, z),
      update,
      minDist: radius,
    };
  }

  const verts = [];
  const colorData = [];
  const positions = [];
  let col;
  for (let i = 0; i < numStars; i += 1) {
    const p = randomSpherePoint();
    const { pos } = p;
    positions.push(p);
    col = new THREE.Color().setHSL(0.6, 0.2, Math.random());
    verts.push(pos.x, pos.y, pos.z);
    colorData.push(col.r, col.g, col.b);
  }

  // WebGPU Points are 1px only — use instanced Sprites so size/map work
  const positionAttribute = new THREE.InstancedBufferAttribute(
    new Float32Array(verts),
    3
  );
  const colorAttribute = new THREE.InstancedBufferAttribute(
    new Float32Array(colorData),
    3
  );

  const starMap = createStarTexture();
  const mapSample = texture(starMap);
  const starColor = instancedBufferAttribute(colorAttribute);

  const material = new THREE.PointsNodeMaterial({
    positionNode: instancedBufferAttribute(positionAttribute),
    colorNode: starColor.mul(mapSample.rgb),
    opacityNode: mapSample.a,
    sizeNode: float(.25),
    sizeAttenuation: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    alphaTest: 0.01,
  });

  const points = new THREE.Sprite(material);
  points.count = numStars;

  function update(t) {
    points.rotation.y -= 0.0002;
    const colors = colorAttribute.array;
    for (let i = 0; i < numStars; i += 1) {
      const bright = positions[i].update(t);
      col = new THREE.Color().setHSL(0.6, 0.2, bright);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    colorAttribute.needsUpdate = true;
  }

  points.userData = { update };
  return points;
}
