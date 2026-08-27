
export const initLoader = ( dispatcher ) => {

	const dom = document.createElement( 'div' );
	dom.id = 'loader-overlay';
	dom.innerHTML = `
		<style>
			#loader-overlay {
				position: fixed;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background: black;
				z-index: 10000;
				display: flex;
				justify-content: center;
				align-items: center;
				transition: opacity 0.5s ease-out;
			}
			.progress-bar-container {
				width: 200px;
				height: 4px;
				background: rgba(255, 255, 255, 0.2);
				border-radius: 2px;
				overflow: hidden;
			}
			.progress-bar {
				width: 100%;
				height: 100%;
				background: white;
				transform-origin: left;
				transform: scaleX(0);
				transition: transform 0.2s linear;
			}
		</style>
		<div class="progress-bar-container">
			<div class="progress-bar"></div>
		</div>
	`;

	document.body.appendChild( dom );

	const bar = dom.querySelector( '.progress-bar' );
	let removed = false;
	let fallbackTimeout = null;

	const setProgress = ( value ) => {

		bar.style.transform = `scaleX(${value / 100})`;

	};

	const hideLoader = () => {

		if ( removed ) return;
		removed = true;

		if ( fallbackTimeout ) {

			clearTimeout( fallbackTimeout );
			fallbackTimeout = null;

		}

		setProgress( 100 );

		setTimeout( () => {

			dom.style.opacity = '0';
			setTimeout( () => {

				dom.remove();

			}, 500 );

		}, 200 );

	};

	dispatcher.on( 'loadProgress', ( { progress } ) => {

		// Map progress (0-1) to 0-95%
		const p = Math.min( progress * 100, 100 ); // ensuring input is treated as 0-1 range mostly, but clamping just in case
		const visualProgress = p * 0.95;
		setProgress( visualProgress );

	} );

	dispatcher.on( 'compileEnd', hideLoader );

	// Fallback: if compileEnd doesn't fire within 2s of loadEnd, hide anyway
	dispatcher.on( 'loadEnd', () => {

		if ( removed ) return;
		fallbackTimeout = setTimeout( hideLoader, 2000 );

	} );

};
