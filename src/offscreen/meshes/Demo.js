import * as THREE from 'three/webgpu';
import { GridPristine } from '@three-blocks/core';
import { component, updateComponentRegistry } from '@/offscreen/dispatcher';
import { scene } from '@/offscreen/main';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { store } from '@/offscreen/store';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Demo extends component( THREE.Object3D, {
	raf: {
		renderPriority: 1,
		fps: Number.Infinity,
	},
} ) {

	init() {

		this._galleryLinks = new Map();
		this._raycaster = new THREE.Raycaster();

		const gal1Loader = new GLTFLoader();
		gal1Loader.load( '/Assets/Gallery1.glb', ( gal1 ) => {

			this.add( gal1.scene );
			this.registerGalleryLink( gal1.scene, 'https://www.refractstudio.net/mwvegas' );
			this.applyVideoTextureToObject( gal1.scene, '/Assets/Orange.mp4' );

		} );
		const gal1text = new GLTFLoader();
		gal1text.load( '/Assets/Text.glb', ( gal1text ) => {
			this.add( gal1text.scene );
		} );
		const gal2Loader = new GLTFLoader();
		gal2Loader.load( '/Assets/Gallery2.glb', ( gal2 ) => {

			this.add( gal2.scene );
			this.registerGalleryLink( gal2.scene, 'https://www.refractstudio.net/mwportals' );
			this.applyVideoTextureToObject( gal2.scene, '/Assets/Portals.mp4' );
		} );
		const gal3Loader = new GLTFLoader();
		gal3Loader.load( '/Assets/Gallery3.glb', ( gal3 ) => {

			this.add( gal3.scene );
			this.registerGalleryLink( gal3.scene, 'https://www.route66remixed.com/tour?location=lets-not-forget-albuquerque-is-a-character-too' );
			this.applyVideoTextureToObject( gal3.scene, '/Assets/cinimatest.mp4' );
		} );
		const gal4Loader = new GLTFLoader();
		gal4Loader.load( '/Assets/Gallery4.glb', ( gal4 ) => {

			this.add( gal4.scene );
			this.registerGalleryLink( gal4.scene, 'https://www.route66remixed.com/tour?location=the-old-road---el-viejo-camino' );
			this.applyVideoTextureToObject( gal4.scene, '/Assets/Dancer.mp4' );
		} );
		const gal5Loader = new GLTFLoader();
		gal5Loader.load( '/Assets/Gallery5.glb', ( gal5 ) => {

			this.add( gal5.scene );
			this.registerGalleryLink( gal5.scene, 'https://avap-cmd.github.io/RefractProteinWebApp/' );
			this.applyVideoTextureToObject( gal5.scene, '/Assets/Protien Vis.mp4' );
		} );
		const gal6Loader = new GLTFLoader();
		gal6Loader.load( '/Assets/Gallery6.glb', ( gal6 ) => {

			this.add( gal6.scene );
			this.registerGalleryLink( gal6.scene, 'https://www.youtube.com/watch?v=wSC3FplLdz0' );
			this.applyVideoTextureToObject( gal6.scene, '/Assets/ueenv.mp4' );
		} );
		const gal7Loader = new GLTFLoader();
		gal7Loader.load( '/Assets/Gallery7.glb', ( gal7 ) => {
			
			this.add( gal7.scene );
			this.applyVideoTextureToObject( gal7.scene, '/Assets/arch.mp4' );
		} );
		const gal8Loader = new GLTFLoader();
		gal8Loader.load( '/Assets/Gallery8.glb', ( gal8 ) => {

			this.add( gal8.scene );
			this.registerGalleryLink( gal8.scene, 'https://www.youtube.com/watch?v=NPFdrMhuLjk' );
			this.applyVideoTextureToObject( gal8.scene, '/Assets/jetpack.mp4' );
		} );

		// Lighting
		const dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
		dirLight.position.set( 5, 10, 5 );
		dirLight.castShadow = true;
		this.add( dirLight );

		const ambientLight = new THREE.AmbientLight( 0xffffff, 0.4 );
		this.add( ambientLight );

		scene.add( this );

		// Environment
		this.setupEnvironment();

	}

	applyVideoTextureToObject( object, url ) {

		if ( typeof document === 'undefined' ) {

			console.warn( 'VideoTexture needs a DOM video element (main thread / offscreen: false).' );
			return;

		}

		const video = document.createElement( 'video' );
		video.src = url;
		video.crossOrigin = 'anonymous';
		video.loop = true;
		video.muted = true;
		video.playsInline = true;
		video.preload = 'auto';

		const texture = new THREE.VideoTexture( video );
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.flipY = false;
		texture.needsUpdate = true;
		this._orangeVideo = video;
		this._orangeVideoTexture = texture;

		const applyToMeshes = () => {

			object.traverse( ( child ) => {

				if ( ! child.isMesh || ! child.material ) return;

				const materials = Array.isArray( child.material )
					? child.material
					: [ child.material ];

				child.material = materials.map( ( material ) => {

					const next = material.clone();
					next.map = texture;
					next.color = new THREE.Color( 0xffffff );
					if ( 'emissiveMap' in next ) {

						next.emissiveMap = texture;
						next.emissive = new THREE.Color( 0xffffff );

					}
					next.needsUpdate = true;
					return next;

				} );

				if ( child.material.length === 1 ) {

					child.material = child.material[ 0 ];

				}

			} );

		};

		video.addEventListener( 'loadeddata', () => {

			applyToMeshes();
			texture.needsUpdate = true;
			video.play().catch( () => {} );

		}, { once: true } );

		video.load();

		if ( video.readyState >= 2 ) {

			applyToMeshes();
			texture.needsUpdate = true;
			video.play().catch( () => {} );

		}

	}

	setupEnvironment() {

		const environment = new RoomEnvironment();
		const pmremGenerator = new THREE.PMREMGenerator( store.gl );
		scene.environment = pmremGenerator.fromScene( environment ).texture;
		scene.environmentIntensity = 0.5;
		pmremGenerator.dispose();
		scene.background = null;

	}

	createGradientBackground() {

		const canvas = typeof document !== 'undefined'
			? document.createElement( 'canvas' )
			: new OffscreenCanvas( 2, 512 );

		canvas.width = 2;
		canvas.height = 512;

		const ctx = canvas.getContext( '2d' );
		const gradient = ctx.createLinearGradient( 0, 0, 0, canvas.height );
		gradient.addColorStop( 0, 'rgb(108, 0, 162)' );
		gradient.addColorStop( 1, 'rgb(0, 17, 82)' );
		ctx.fillStyle = gradient;
		ctx.fillRect( 0, 0, canvas.width, canvas.height );

		const texture = new THREE.CanvasTexture( canvas );
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.needsUpdate = true;
		return texture;

	}

	registerGalleryLink( root, url ) {

		this._galleryLinks.set( root, url );

	}

	onClick() {

		if ( typeof window === 'undefined' || this._galleryLinks.size === 0 ) return;

		const { camera, pointer } = store;
		this._raycaster.setFromCamera( pointer, camera );
		const hits = this._raycaster.intersectObject( this, true );
		if ( ! hits.length ) return;

		let obj = hits[ 0 ].object;
		while ( obj ) {

			const url = this._galleryLinks.get( obj );
			if ( url ) {

				window.open( url, '_blank', 'noopener,noreferrer' );
				return;

			}

			obj = obj.parent;

		}

	}

	onRaf( { delta } ) {



	}

	onResize() {}

	dispose() {

		super.dispose();

	}

}

// HMR support
if ( import.meta.hot ) {

	import.meta.hot.accept( ( newModule ) => {

		updateComponentRegistry( 'Demo', newModule );

	} );

}
