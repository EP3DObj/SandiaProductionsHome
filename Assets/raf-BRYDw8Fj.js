const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/StatsGLNode-5DfnYyeK.js","assets/index-CivRBAuV.js"])))=>i.map(i=>d[i]);
import { bu as __vitePreload, d as dispatcherSingleton, s as store, bv as engine } from './index-CivRBAuV.js';

let flushCaptures = null;
const createdPanels = new Set();

// Dynamically import flushCaptures when stats is enabled
async function initStatsCaptures() {

	const { flushCaptures: fc } = await __vitePreload(async () => { const { flushCaptures: fc } = await import( './StatsGLNode-5DfnYyeK.js' );return { flushCaptures: fc }},true              ?__vite__mapDeps([0,1]):void 0);
	flushCaptures = fc;

}

class Raf {

	constructor() {

		this.time = self.performance.now();

		/**
		 * A reference to the context from `requestAnimationFrame()` can
		 * be called (usually `window`).
		 *
		 * @type {?(Window|XRSession)}
		 */
		this._context = typeof self !== 'undefined' ? self : null;

		// Handle pause/resume from main thread visibility changes
		dispatcherSingleton.on( 'pause', () => {

			this.isPaused = true;

		} );

		dispatcherSingleton.on( 'resume', () => {

			this.isPaused = false;
			this.oldTime = self.performance.now(); // Reset time to prevent huge delta

		} );

	}

	start( gl ) {

		this.startTime = self.performance.now();
		this.oldTime = this.startTime;
		this.isPaused = false;

		gl.setAnimationLoop( async ( now, xrFrame ) => {
			// Stats begin (main-thread mode)
			store.stats?.begin();

			const { recording } = store;

			// Recording branch: drive deterministic time and capture frames without spawning a second RAF
			if ( recording ) {

				if ( this._isRecordingProcessing ) return;
				this._isRecordingProcessing = true;

				try {

					const frameRate = store.recordFrameRate || 60;
					// Deterministic timebase for anime.js and the scene
					this._recordTime = ( this._recordTime ?? 0 ) + 1 / frameRate;

					try {

						engine.tick( this._recordTime * 1000 );

					} catch ( e ) {

						// noop
						console.warn( e );

					}

					// Render the frame with deterministic delta
					await dispatcherSingleton.triggerOnRaf( {
						now: this._recordTime * 1000,
						delta: 1 / frameRate,
						xrFrame,
					} );

					if ( store.recorder && typeof store.recorder.step === 'function' ) {

						await store.recorder.step();

					}

					store.recordFrameCount = ( store.recordFrameCount || 0 ) + 1;

					if ( store.recordTotalFrames && store.recordFrameCount >= store.recordTotalFrames ) {

						let buffer;
						if ( store.recorder && typeof store.recorder.stop === 'function' ) {

							buffer = await store.recorder.stop();

						}

						store.recording = false;
						this._recordTime = 0;
						// Notify main thread/UI with the recorded buffer for download handling
						dispatcherSingleton.trigger( { name: 'recordingStopped' }, { buffer } );

					}

				} finally {

					this._isRecordingProcessing = false;

				}

				// Do not run the non-recording branch when recording
				return;

			}

			if ( ! this.isPaused ) {

				dispatcherSingleton.triggerOnRaf( {
					now,
					xrFrame,
				} );

			}
			// Stats end/update (main-thread mode)
			store.stats?.end();
			store.stats?.update();

			// StatsGLNode texture captures
			if ( flushCaptures ) {

				const captures = await flushCaptures( gl );
				for ( const { name, bitmap, width, height } of captures ) {

					// Worker mode: post to main thread
					if ( store.stats ) {

						if ( ! createdPanels.has( name ) ) {

							store.stats.addTexturePanel( name );
							createdPanels.add( name );

						}

						store.stats.setTextureBitmap( name, bitmap, width || gl.domElement.width, height || gl.domElement.height );

					}

				}

			}

		} );

	}

	pause() {

		this.isPaused = true;

	}

}

const raf = new Raf();

export { initStatsCaptures, raf };
