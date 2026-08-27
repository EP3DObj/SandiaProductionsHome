import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import getStarfield from './getStarfield.js';
import { getFresnelMat } from './getFresnelMat.js';
import { isMobileOrTablet } from '@/shared/devices';
import { resolvePublicPath } from '@/offscreen/utils/publicPath';

export async function initSecondScene(containerId = 'app2') {

	const container = document.getElementById(containerId);
	if (!container) return;

	const isMobile = isMobileOrTablet();

	const renderer = new THREE.WebGPURenderer({ antialias: true });
	await renderer.init();
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setSize(container.clientWidth, container.clientHeight);
	renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';
	container.appendChild(renderer.domElement);

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);

	const camera = new THREE.PerspectiveCamera(
		40, container.clientWidth / container.clientHeight, 0.1, 200
	);
	if ( isMobile ) {
		// same aim as desktop; only center horizontally and pull back
		camera.position.set( 0, 0.5, 14 );
	} else {
		camera.position.set( - 3.5, 0.5, 10 );
	}

	const sunLight = new THREE.DirectionalLight(0xffffff);
	sunLight.position.set(-4, 2, 1.5);
	scene.add(sunLight);

	const ambientLight = new THREE.AmbientLight(0xffffff, 0.025);
	scene.add(ambientLight);

	// earth

	const earthGroup = new THREE.Group();
	earthGroup.rotation.z = -23.4 * (Math.PI / 180);
	const earthSpin = new THREE.Group();
	earthGroup.add(earthSpin);
	scene.add(earthGroup);

	const colorLoader = new THREE.TextureLoader();
	const lightLoader = new THREE.TextureLoader();
	const cloudLoader = new THREE.TextureLoader();
	const mesh = new THREE.Mesh(
		new THREE.IcosahedronGeometry(1, 12),
		new THREE.MeshStandardMaterial({ 
			map: colorLoader.load( resolvePublicPath( 'Assets/earthmap1k.jpg' ) ),
		})
	);
	earthSpin.add(mesh);

	const lightMesh = new THREE.Mesh(
		new THREE.IcosahedronGeometry(1, 12),
		new THREE.MeshStandardMaterial({ 
			map: lightLoader.load( resolvePublicPath( 'Assets/earthlights1k.jpg' ) ),
		    blending: THREE.AdditiveBlending,
			depthWrite: false,
		})
	);
	earthSpin.add(lightMesh);
	

	const cloudMesh = new THREE.Mesh(
		new THREE.IcosahedronGeometry(1, 12),
		new THREE.MeshStandardMaterial({ 
			map: cloudLoader.load( resolvePublicPath( 'Assets/earthcloudmaptrans.jpg' ) ),
		    blending: THREE.AdditiveBlending,
			depthWrite: false,
		})
	);
	cloudMesh.scale.setScalar(1.003);
	earthSpin.add(cloudMesh);

	const fresnelMat = getFresnelMat();
	const earthFresnel = new THREE.Mesh(
		new THREE.IcosahedronGeometry(1, 12),
		fresnelMat
	);
	earthFresnel.scale.setScalar(1.01);
	earthSpin.add(earthFresnel);

	const stars = getStarfield({ numStars: 1000 });
	scene.add(stars);

	const canvas = renderer.domElement;
	canvas.style.touchAction = 'pan-y';
	const raycaster = new THREE.Raycaster();
	const pointer = new THREE.Vector2();
	let isDragging = false;
	let prevX = 0;
	let prevY = 0;
	const dragSpeed = 0.005;

	function clientX( event ) {

		return event.touches?.[ 0 ]?.clientX
			?? event.changedTouches?.[ 0 ]?.clientX
			?? event.clientX
			?? 0;

	}

	function clientY( event ) {

		return event.touches?.[ 0 ]?.clientY
			?? event.changedTouches?.[ 0 ]?.clientY
			?? event.clientY
			?? 0;

	}

	function pointerToNDC( event ) {

		const rect = canvas.getBoundingClientRect();
		pointer.x = ( ( clientX( event ) - rect.left ) / rect.width ) * 2 - 1;
		pointer.y = - ( ( clientY( event ) - rect.top ) / rect.height ) * 2 + 1;

	}

	function hitsPlanet( event ) {

		pointerToNDC( event );
		raycaster.setFromCamera( pointer, camera );
		return raycaster.intersectObject( earthGroup, true ).length > 0;

	}

	function onDragStart( event ) {

		if ( ! hitsPlanet( event ) ) return;
		isDragging = true;
		canvas.style.touchAction = 'none';
		if ( event.cancelable ) event.preventDefault();
		prevX = clientX( event );
		prevY = clientY( event );
		if ( event.pointerId != null ) {

			canvas.setPointerCapture( event.pointerId );

		}

	}

	function onDragMove( event ) {

		if ( ! isDragging ) return;
		if ( event.cancelable ) event.preventDefault();
		const x = clientX( event );
		const dx = x - prevX;
		prevX = x;
		prevY = clientY( event );
		earthSpin.rotation.y += dx * dragSpeed;

	}

	function onDragEnd( event ) {

		isDragging = false;
		canvas.style.touchAction = 'pan-y';
		if ( event.pointerId != null ) {

			try {

				canvas.releasePointerCapture( event.pointerId );

			} catch ( err ) { /* already released */ }

		}

	}

	canvas.addEventListener( 'pointerdown', onDragStart );
	canvas.addEventListener( 'pointermove', onDragMove );
	canvas.addEventListener( 'pointerup', onDragEnd );
	canvas.addEventListener( 'pointercancel', onDragEnd );
	canvas.addEventListener( 'touchstart', onDragStart, { passive: false } );
	canvas.addEventListener( 'touchmove', onDragMove, { passive: false } );
	canvas.addEventListener( 'touchend', onDragEnd );
	canvas.addEventListener( 'touchcancel', onDragEnd );

	const loader = new GLTFLoader();
	let mixer = null;
	const clock = new THREE.Clock();
	loader.load( resolvePublicPath( 'Assets/RicketShip.glb' ), (gltf) => {
		gltf.scene.scale.set(0.5, 0.5, 0.5);
		scene.add(gltf.scene);
		if (gltf.animations.length) {
			mixer = new THREE.AnimationMixer(gltf.scene);
			gltf.animations.forEach((clip) => {
				const action = mixer.clipAction(clip);
				action.setLoop(THREE.LoopRepeat, Infinity);
				action.play();
			});
		}
	});

	const onResize = () => {
		const w = container.clientWidth;
		const h = container.clientHeight;
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		renderer.setSize(w, h);
	};
	window.addEventListener('resize', onResize);

	renderer.setAnimationLoop(() => {
		const delta = clock.getDelta();
		const t = clock.elapsedTime;
		mixer?.update(delta);
		stars.userData.update?.(t);
		mesh.rotation.y += 0.001;
		lightMesh.rotation.y += 0.001;
		cloudMesh.rotation.y += 0.001;
		earthFresnel.rotation.y += 0.001;
		renderer.render(scene, camera);
	});

}