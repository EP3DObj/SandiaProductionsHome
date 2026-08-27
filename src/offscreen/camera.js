import { PerspectiveCamera, Vector3, Spherical } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { store } from '@/offscreen/store';
import { component } from '@/offscreen/dispatcher';
import { isMobileOrTablet } from '@/shared/devices';

// Camera component allowing automatic orbit control override and such
class Camera extends component( PerspectiveCamera ) {

	constructor() {

		super( 40, 0, 0.1, 10000 );

	}

	init() {

		this.target = new Vector3( 0, 0, 0 );
		this._isMobile = isMobileOrTablet();
		// mobile: pull back so the full gallery card fits
		this.position.set( 0, 0, this._isMobile ? - 10 : - 7 );
		this._basePosition = new Vector3();
		this._hasBasePose = false;
		this._mouseInside = false;
		this._mouseLookBlend = 0;
		this._swipeDragging = false;
		this._swipeLastX = 0;

		this.lookAt( this.target );
		this.offset = new Vector3( 0, 0, 0 );
		this._orbitOffset = new Vector3();
		this._orbitSpherical = new Spherical();
		this._orbitVelocity = 0;
		this._lookOffset = new Vector3();
		this._mouseLookTarget = new Vector3();
		this._camRight = new Vector3();
		this._camUp = new Vector3();

	}

	onPointermove() {

		if ( this._isMobile ) return;
		this._mouseInside = true;

	}

	onPointerleave() {

		this._mouseInside = false;

	}

	applyMouseLook() {

		if ( this._isMobile ) {

			const pivot = this.controls?.target ?? this.target;
			this.position.copy( this._basePosition );
			this.lookAt( pivot );
			return;

		}

		const lookAmount = 0.15;
		const positionAmount = 0.04;
		const blendSpeed = 0.12;
		const pointer = store.pointerLerp;
		const pivot = this.controls?.target ?? this.target;

		const blendTarget = this._mouseInside ? 1 : 0;
		this._mouseLookBlend += ( blendTarget - this._mouseLookBlend ) * blendSpeed;

		if ( this._mouseLookBlend < 0.001 ) {

			this._mouseLookBlend = 0;
			this.position.copy( this._basePosition );
			this.lookAt( pivot );
			return;

		}

		const px = Math.max( - 1, Math.min( 1, pointer.x ) ) * this._mouseLookBlend;
		const py = Math.max( - 1, Math.min( 1, pointer.y ) ) * this._mouseLookBlend;

		this.updateMatrixWorld( true );
		this._camRight.setFromMatrixColumn( this.matrixWorld, 0 ).normalize();
		this._camUp.setFromMatrixColumn( this.matrixWorld, 1 ).normalize();

		this._lookOffset
			.copy( this._camRight ).multiplyScalar( - px * lookAmount )
			.addScaledVector( this._camUp, - py * lookAmount );

		this._mouseLookTarget.copy( pivot ).add( this._lookOffset );
		this.lookAt( this._mouseLookTarget );

		this.position.copy( this._basePosition )
			.addScaledVector( this._camRight, - px * positionAmount )
			.addScaledVector( this._camUp, - py * positionAmount );

	}

	onRaf() {

		if ( this._hasBasePose ) {

			this.position.copy( this._basePosition );

		}

		if ( this.controls && Math.abs( this._orbitVelocity ) > 0.00001 ) {

			const pivot = this.controls.target;

			this._orbitOffset.copy( this.position ).sub( pivot );
			this._orbitSpherical.setFromVector3( this._orbitOffset );
			this._orbitSpherical.theta += this._orbitVelocity;
			this._orbitOffset.setFromSpherical( this._orbitSpherical );

			this.position.copy( pivot ).add( this._orbitOffset );
			this.lookAt( pivot );

			this._orbitVelocity *= 0.85;

		}

		this.controls?.update();

		this._basePosition.copy( this.position );
		this._hasBasePose = true;

		this.applyMouseLook();

	}

	initOrbitControls( domElement ) {

		this.controls = new OrbitControls( this, domElement );
		this.controls.enabled = true;
		this.controls.enableZoom = false;
		this.controls.maxDistance = 1200;
		this.controls.minDistance = 0;
		this.controls.target.copy( this.target );

		if ( this._isMobile ) {

			// swipe spins the gallery; keep camera fixed
			this.controls.enableRotate = false;
			this.controls.enablePan = false;

			const swipeSpeed = 0.004;

			domElement.addEventListener( 'pointerdown', ( event ) => {

				this._swipeDragging = true;
				this._swipeLastX = event.clientX ?? 0;

			} );

			domElement.addEventListener( 'pointermove', ( event ) => {

				if ( ! this._swipeDragging ) return;
				const x = event.clientX ?? 0;
				const dx = x - this._swipeLastX;
				this._swipeLastX = x;
				// match wheel: swipe left → clockwise, swipe right → counter-clockwise
				this._orbitVelocity += - dx * swipeSpeed;

			} );

			const endSwipe = () => {

				this._swipeDragging = false;

			};

			domElement.addEventListener( 'pointerup', endSwipe );
			domElement.addEventListener( 'pointercancel', endSwipe );
			domElement.addEventListener( 'pointerleave', endSwipe );

		}

		this.controls.update();

		const orbitSpeed = 0.001178;

		domElement.addEventListener( 'wheel', ( event ) => {

			this._orbitVelocity += ( event.deltaY ?? 0 ) * orbitSpeed;

		} );

	}

	calculateUnitSize( distance = this.position.z ) {

		const vFov = ( this.fov * Math.PI ) / 180;
		const height = 2 * Math.tan( vFov / 2 ) * distance;
		const width = height * this.aspect;

		return {
			width,
			height,
		};

	}

	onResize( { ratio } ) {

		this.aspect = ratio;
		this.unit = this.calculateUnitSize();
		this.updateProjectionMatrix();

	}

}

export default Camera;
