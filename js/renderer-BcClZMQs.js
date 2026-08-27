import { c as component, s as scene, a as camera } from './pointer-B6JsUHZO.js';
import './raf-B5Kw0sh_.js';
import { B as BasicShadowMap, p as pass, r as renderOutput, A as ACESFilmicToneMapping, P as PostProcessing, W as WebGPURenderer } from './index-DLTYy3GB.js';
import { statsGL } from './StatsGLNode-bhhO6qZf.js';

class RendererImpl extends component( WebGPURenderer, {
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
		this.shadowMap.type = BasicShadowMap;
		this.pass = pass( scene, camera );

		const scenePassColor = this.pass.getTextureNode( 'output' );

		// attach StatsGL on any node for a quick debug view
		const outputPass = renderOutput( statsGL(scenePassColor, 'Scene Pass Color'), ACESFilmicToneMapping );

		this.postProcessing = new PostProcessing( this );

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

export { RendererImpl as default };
