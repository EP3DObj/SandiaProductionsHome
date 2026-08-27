import * as THREE from "three/webgpu";
import {
	cameraPosition,
	positionWorld,
	normalWorld,
	float,
	color,
	mix,
	pow,
	clamp,
	dot,
	normalize,
} from "three/tsl";

function getFresnelMat({ rimHex = 0x0088ff, facingHex = 0x000000 } = {}) {
	const fresnelBias = float(0.1);
	const fresnelScale = float(1.0);
	const fresnelPower = float(4.0);

	// Match original GLSL: I = worldPos - cameraPos
	const I = normalize(positionWorld.sub(cameraPosition));
	const N = normalize(normalWorld);
	const reflectionFactor = fresnelBias.add(
		fresnelScale.mul(pow(float(1).add(dot(I, N)), fresnelPower))
	);
	const f = clamp(reflectionFactor, 0, 1);

	return new THREE.MeshBasicNodeMaterial({
		colorNode: mix(color(facingHex), color(rimHex), f),
		opacityNode: f,
		transparent: true,
		blending: THREE.AdditiveBlending,
		depthWrite: false,
	});
}

export { getFresnelMat };
