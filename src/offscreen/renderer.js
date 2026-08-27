import { component } from '@/offscreen/dispatcher';
import { camera, scene } from '@/offscreen/main';
import * as THREE from 'three/webgpu';

import {
	pass,
	renderOutput,
} from 'three/tsl';

import { statsGL } from 'stats-gl/addons/StatsGLNode.js';

class RendererImpl extends component( THREE.WebGPURenderer, {
	raf: {
		renderPriority: Infinity,
	},
} ) {

	constructor( { canvas, isWebGPU } ) {

		super( {
			canvas,
			antialias: true,
			alpha: true,
			// pixelRatio: 1,
			powerPreference: 'high-performance',
			forceWebGL: ! isWebGPU,
		} );

		this.countRenderBeforeStart = 0;
		this._compiled = false;

		this.shadowMap.enabled = true;
		this.shadowMap.type = THREE.BasicShadowMap;
		this.pass = pass( scene, camera );

		const scenePassColor = this.pass.getTextureNode( 'output' );

		// attach StatsGL on any node for a quick debug view
		const outputPass = renderOutput( statsGL(scenePassColor, 'Scene Pass Color'), THREE.ACESFilmicToneMapping );

		this.postProcessing = new THREE.PostProcessing( this );

		this.postProcessing.outputNode = outputPass;

	}

	onResize( { width, height, dpr } ) {

		this.setDrawingBufferSize( width, height, dpr );

	}
	onLoadEnd() {

		this.assetsLoaded = true;

	}
	onCompileEnd() {

		this.sceneCompiled = true;

	}

	onDebug() {}

	onThrottle() {}
	onRaf( { camera } ) {

		if ( ! this.sceneCompiled ) {

			return;

		}

		this.render( scene, camera );

	}

}

export default RendererImpl;
