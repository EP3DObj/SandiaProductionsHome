import { c as component, s as scene, v as virtualElement } from './pointer-0i-MCJ4q.js';
import { d as dispatcherSingleton, s as store, O as OrthographicCamera, L as Loader$1, F as FileLoader, S as SRGBColorSpace, a as LinearSRGBColorSpace, b as BufferGeometry, c as BufferAttribute, I as InterleavedBuffer, C as Color, e as ColorManagement, f as InterleavedBufferAttribute, g as CompressedCubeTexture, h as CompressedArrayTexture, i as CompressedTexture, j as LinearFilter, k as LinearMipmapLinearFilter, N as NoColorSpace, R as RGBA_PVRTC_2BPPV1_Format, l as RGBA_PVRTC_4BPPV1_Format, m as RGBA_BPTC_Format, n as RED_GREEN_RGTC2_Format, o as SIGNED_RED_GREEN_RGTC2_Format, q as RED_RGTC1_Format, t as SIGNED_RED_RGTC1_Format, u as RGBA_S3TC_DXT3_Format, v as RGB_S3TC_DXT1_Format, w as RGBA_S3TC_DXT1_Format, x as RGBA_ASTC_6x6_Format, y as RGBA_ASTC_4x4_Format, z as SIGNED_RG11_EAC_Format, D as RG11_EAC_Format, E as SIGNED_R11_EAC_Format, G as R11_EAC_Format, H as RGB_ETC2_Format, J as RGBA_ETC2_EAC_Format, K as RGBFormat, M as RedFormat, Q as RGFormat, T as RGBAFormat, U as UnsignedByteType, V as HalfFloatType, X as UnsignedInt101111Type, Y as UnsignedInt5999Type, Z as FloatType, _ as DataTexture, $ as Data3DTexture, a0 as NearestMipmapNearestFilter, a1 as NearestFilter, a2 as RGB_PVRTC_4BPPV1_Format, a3 as RGB_ETC1_Format, a4 as RGBA_S3TC_DXT5_Format, a5 as RGB_BPTC_UNSIGNED_Format, a6 as DataTextureLoader, a7 as DataUtils, a8 as InstancedBufferGeometry, a9 as Sphere, aa as Box3, ab as InstancedBufferAttribute, ac as PlaneGeometry, ad as Fn, ae as vec4, af as float, ag as clamp, ah as normalLocal, ai as vec2, aj as mix, ak as positionLocal, al as vec3, am as mod, an as floor, ao as varyingProperty, ap as CanvasTexture, aq as nodeProxy, ar as Node, as as attribute, at as subBuild, au as max$1, av as sub, aw as pow, ax as select, ay as length, az as fwidth, aA as div, aB as smoothstep, aC as diffuseColor, aD as If, aE as Mesh, aF as MeshBasicNodeMaterial, aG as DoubleSide, aH as uniform, aI as Vector2, aJ as Matrix3, aK as Vector4, aL as texture, aM as modelWorldMatrix, aN as cameraPosition, aO as cameraProjectionMatrix, aP as cameraViewMatrix, aQ as modelViewMatrix, aR as screenSize, aS as cameraViewport, aT as Vector3, aU as Matrix4, aV as Curve, aW as CubicBezierCurve3, aX as CurvePath, aY as CatmullRomCurve3, aZ as LineBasicMaterial, a_ as Line, a$ as Quaternion, b0 as Euler, b1 as CubeTexture, b2 as GLTFLoader, b3 as Texture, b4 as resolvePublicPath, b5 as ImageBitmapLoader, b6 as TextureLoader, b7 as Scene, b8 as BoxGeometry, b9 as MeshStandardMaterial, ba as BackSide, bb as PointLight, bc as InstancedMesh, bd as Object3D, be as MeshLambertMaterial, bf as Raycaster, bg as DirectionalLight, bh as AmbientLight, bi as VideoTexture, bj as PMREMGenerator } from './index-y6JwgF0d.js';
import { raf } from './raf-C22adq8F.js';

// Get GPU/WebGL info

const getWebglInfo = () => {

	const gl = store.gl.backend.gl;
	const debugInfo = gl.getExtension( 'WEBGL_debug_renderer_info' );
	const vendor = gl.getParameter( debugInfo.UNMASKED_VENDOR_WEBGL );
	const renderer = gl.getParameter( debugInfo.UNMASKED_RENDERER_WEBGL );
	return { vendor, renderer };

};

async function getRendererInfo() {

	if ( store.isWebGPU ) {

		try {

			const adapter = await navigator.gpu.requestAdapter();
			if ( adapter === null ) {

				return 'Unable to create WebGPU adapter';

			}

			const { vendor, architecture, device, description } = adapter.info;
			return `
        Vendor: ${vendor}
        Architecture: ${architecture}
  ${device ? `Device: ${device}` : ''}
  ${description ? `Description: ${description}` : ''}`;

		} catch ( error ) {

			return `Error getting WebGPU info: ${error.message}`;

		}

	} else {

		try {

			const { vendor, renderer } = getWebglInfo();
			return `
        Vendor: ${vendor}
        Renderer: ${renderer}`;

		} catch ( error ) {

			return `Error getting WebGL info: ${error.message}`;

		}

	}

}

const debugInfo = async () => {

	const threadType =
    typeof window === 'undefined'
    	? 'WORKER THREAD (OffScreenCanvas)'
    	: 'MAIN THREAD';
	const renderBackend = store.isWebGPU ? 'WebGPU' : 'WebGL';
	const hardwareInfo = await getRendererInfo();

	dispatcherSingleton.trigger(
		{ name: 'debugInfos' },
		{
			threadType,
			renderBackend,
			hardwareInfo,
		}
	);

};

// Orthographic camera sees everything in its box - no perspective culling
const compileCamera = new OrthographicCamera(
	-1e10, 1e10, // left, right
	1e10, -1e10, // top, bottom
	-1e10, 1e10 // near (negative = behind), far
);

// Negative near plane means it sees objects "behind" it too
compileCamera.updateMatrixWorld();
compileCamera.updateProjectionMatrix();

async function compileScene( gl, scene, camera = compileCamera ) {

	const original = new WeakMap();
	const originalPerObject = new WeakMap();
	const invisibleOriginal = new WeakMap();

	scene.traverse( ( obj ) => {

		if ( obj.frustumCulled ) {

			original.set( obj, true );
			obj.frustumCulled = false;

		}

		if ( obj.perObjectFrustumCulled ) {

			originalPerObject.set( obj, true );
			obj.perObjectFrustumCulled = false;

		}

		if ( obj.visible === false ) {

			invisibleOriginal.set( obj, true );
			obj.visible = true;

		}

	} );

	await gl.compileAsync( scene, camera );

	scene.traverse( ( obj ) => {

		if ( original.has( obj ) ) obj.frustumCulled = true;
		if ( invisibleOriginal.has( obj ) ) obj.visible = false;
		if ( originalPerObject.has( obj ) ) obj.perObjectFrustumCulled = true;

	} );

}

// This file is part of meshoptimizer library and is distributed under the terms of MIT License.
// Copyright (C) 2016-2024, by Arseny Kapoulkine (arseny.kapoulkine@gmail.com)
var MeshoptDecoder = (function () {
	// Built with clang version 18.1.2
	// Built from meshoptimizer 0.22
	var wasm_base =
		'b9H79Tebbbe8Fv9Gbb9Gvuuuuueu9Giuuub9Geueu9Giuuueuikqbeeedddillviebeoweuec:q:Odkr;leDo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbeY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVbdE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbiL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtblK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949Wbol79IV9Rbrq;w8Wqdbk;esezu8Jjjjjbcj;eb9Rgv8Kjjjjbc9:hodnadcefal0mbcuhoaiRbbc:Ge9hmbavaialfgrad9Radz1jjjbhwcj;abad9Uc;WFbGgocjdaocjd6EhDaicefhocbhqdnindndndnaeaq9nmbaDaeaq9RaqaDfae6Egkcsfglcl4cifcd4hxalc9WGgmTmecbhPawcjdfhsaohzinaraz9Rax6mvarazaxfgo9RcK6mvczhlcbhHinalgic9WfgOawcj;cbffhldndndndndnazaOco4fRbbaHcoG4ciGPlbedibkal9cb83ibalcwf9cb83ibxikalaoRblaoRbbgOco4gAaAciSgAE86bbawcj;cbfaifglcGfaoclfaAfgARbbaOcl4ciGgCaCciSgCE86bbalcVfaAaCfgARbbaOcd4ciGgCaCciSgCE86bbalc7faAaCfgARbbaOciGgOaOciSgOE86bbalctfaAaOfgARbbaoRbegOco4gCaCciSgCE86bbalc91faAaCfgARbbaOcl4ciGgCaCciSgCE86bbalc4faAaCfgARbbaOcd4ciGgCaCciSgCE86bbalc93faAaCfgARbbaOciGgOaOciSgOE86bbalc94faAaOfgARbbaoRbdgOco4gCaCciSgCE86bbalc95faAaCfgARbbaOcl4ciGgCaCciSgCE86bbalc96faAaCfgARbbaOcd4ciGgCaCciSgCE86bbalc97faAaCfgARbbaOciGgOaOciSgOE86bbalc98faAaOfgORbbaoRbigoco4gAaAciSgAE86bbalc99faOaAfgORbbaocl4ciGgAaAciSgAE86bbalc9:faOaAfgORbbaocd4ciGgAaAciSgAE86bbalcufaOaAfglRbbaociGgoaociSgoE86bbalaofhoxdkalaoRbwaoRbbgOcl4gAaAcsSgAE86bbawcj;cbfaifglcGfaocwfaAfgARbbaOcsGgOaOcsSgOE86bbalcVfaAaOfgORbbaoRbegAcl4gCaCcsSgCE86bbalc7faOaCfgORbbaAcsGgAaAcsSgAE86bbalctfaOaAfgORbbaoRbdgAcl4gCaCcsSgCE86bbalc91faOaCfgORbbaAcsGgAaAcsSgAE86bbalc4faOaAfgORbbaoRbigAcl4gCaCcsSgCE86bbalc93faOaCfgORbbaAcsGgAaAcsSgAE86bbalc94faOaAfgORbbaoRblgAcl4gCaCcsSgCE86bbalc95faOaCfgORbbaAcsGgAaAcsSgAE86bbalc96faOaAfgORbbaoRbvgAcl4gCaCcsSgCE86bbalc97faOaCfgORbbaAcsGgAaAcsSgAE86bbalc98faOaAfgORbbaoRbogAcl4gCaCcsSgCE86bbalc99faOaCfgORbbaAcsGgAaAcsSgAE86bbalc9:faOaAfgORbbaoRbrgocl4gAaAcsSgAE86bbalcufaOaAfglRbbaocsGgoaocsSgoE86bbalaofhoxekalao8Pbb83bbalcwfaocwf8Pbb83bbaoczfhokdnaiam9pmbaHcdfhHaiczfhlarao9RcL0mekkaiam6mvaoTmvdnakTmbawaPfRbbhHawcj;cbfhlashiakhOinaialRbbgzce4cbazceG9R7aHfgH86bbaiadfhialcefhlaOcufgOmbkkascefhsaohzaPcefgPad9hmbxikkcbc99arao9Radcaadca0ESEhoxlkaoaxad2fhCdnakmbadhlinaoTmlarao9Rax6mlaoaxfhoalcufglmbkaChoxekcbhmawcjdfhAinarao9Rax6miawamfRbbhHawcj;cbfhlaAhiakhOinaialRbbgzce4cbazceG9R7aHfgH86bbaiadfhialcefhlaOcufgOmbkaAcefhAaoaxfhoamcefgmad9hmbkaChokabaqad2fawcjdfakad2z1jjjb8Aawawcjdfakcufad2fadz1jjjb8Aakaqfhqaombkc9:hoxekc9:hokavcj;ebf8Kjjjjbaok;cseHu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnaeci9UgrcHfal0mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgwce0mbavc;abfcFecjez:jjjjb8AavcUf9cu83ibavc8Wf9cu83ibavcyf9cu83ibavcaf9cu83ibavcKf9cu83ibavczf9cu83ibav9cu83iwav9cu83ibaialfc9WfhDaicefgqarfhidnaeTmbcmcsawceSEhkcbhxcbhmcbhPcbhwcbhlindnaiaD9nmbc9:hoxikdndnaqRbbgoc;Ve0mbavc;abfalaocu7gscl4fcsGcitfgzydlhrazydbhzdnaocsGgHak9pmbavawasfcsGcdtfydbaxaHEhoaHThsdndnadcd9hmbabaPcetfgHaz87ebaHclfao87ebaHcdfar87ebxekabaPcdtfgHazBdbaHcwfaoBdbaHclfarBdbkaxasfhxcdhHavawcdtfaoBdbawasfhwcehsalhOxdkdndnaHcsSmbaHc987aHamffcefhoxekaicefhoai8SbbgHcFeGhsdndnaHcu9mmbaohixekaicvfhiascFbGhscrhHdninao8SbbgOcFbGaHtasVhsaOcu9kmeaocefhoaHcrfgHc8J9hmbxdkkaocefhikasce4cbasceG9R7amfhokdndnadcd9hmbabaPcetfgHaz87ebaHclfao87ebaHcdfar87ebxekabaPcdtfgHazBdbaHcwfaoBdbaHclfarBdbkcdhHavawcdtfaoBdbcehsawcefhwalhOaohmxekdnaocpe0mbaxcefgHavawaDaocsGfRbbgocl49RcsGcdtfydbaocz6gzEhravawao9RcsGcdtfydbaHazfgAaocsGgHEhoaHThCdndnadcd9hmbabaPcetfgHax87ebaHclfao87ebaHcdfar87ebxekabaPcdtfgHaxBdbaHcwfaoBdbaHclfarBdbkcdhsavawcdtfaxBdbavawcefgwcsGcdtfarBdbcihHavc;abfalcitfgOaxBdlaOarBdbavawazfgwcsGcdtfaoBdbalcefcsGhOawaCfhwaxhzaAaCfhxxekaxcbaiRbbgOEgzaoc;:eSgHfhraOcsGhCaOcl4hAdndnaOcs0mbarcefhoxekarhoavawaA9RcsGcdtfydbhrkdndnaCmbaocefhxxekaohxavawaO9RcsGcdtfydbhokdndnaHTmbaicefhHxekaicdfhHai8SbegscFeGhzdnascu9kmbaicofhXazcFbGhzcrhidninaH8SbbgscFbGaitazVhzascu9kmeaHcefhHaicrfgic8J9hmbkaXhHxekaHcefhHkazce4cbazceG9R7amfgmhzkdndnaAcsSmbaHhsxekaHcefhsaH8SbbgicFeGhrdnaicu9kmbaHcvfhXarcFbGhrcrhidninas8SbbgHcFbGaitarVhraHcu9kmeascefhsaicrfgic8J9hmbkaXhsxekascefhskarce4cbarceG9R7amfgmhrkdndnaCcsSmbashixekascefhias8SbbgocFeGhHdnaocu9kmbascvfhXaHcFbGhHcrhodninai8SbbgscFbGaotaHVhHascu9kmeaicefhiaocrfgoc8J9hmbkaXhixekaicefhikaHce4cbaHceG9R7amfgmhokdndnadcd9hmbabaPcetfgHaz87ebaHclfao87ebaHcdfar87ebxekabaPcdtfgHazBdbaHcwfaoBdbaHclfarBdbkcdhsavawcdtfazBdbavawcefgwcsGcdtfarBdbcihHavc;abfalcitfgXazBdlaXarBdbavawaOcz6aAcsSVfgwcsGcdtfaoBdbawaCTaCcsSVfhwalcefcsGhOkaqcefhqavc;abfaOcitfgOarBdlaOaoBdbavc;abfalasfcsGcitfgraoBdlarazBdbawcsGhwalaHfcsGhlaPcifgPae6mbkkcbc99aiaDSEhokavc;aef8Kjjjjbaok:flevu8Jjjjjbcz9Rhvc9:hodnaecvfal0mbcuhoaiRbbc;:eGc;qe9hmbav9cb83iwaicefhraialfc98fhwdnaeTmbdnadcdSmbcbhDindnaraw6mbc9:skarcefhoar8SbbglcFeGhidndnalcu9mmbaohrxekarcvfhraicFbGhicrhldninao8SbbgdcFbGaltaiVhiadcu9kmeaocefhoalcrfglc8J9hmbxdkkaocefhrkabaDcdtfaic8Etc8F91aicd47avcwfaiceGcdtVgoydbfglBdbaoalBdbaDcefgDae9hmbxdkkcbhDindnaraw6mbc9:skarcefhoar8SbbglcFeGhidndnalcu9mmbaohrxekarcvfhraicFbGhicrhldninao8SbbgdcFbGaltaiVhiadcu9kmeaocefhoalcrfglc8J9hmbxdkkaocefhrkabaDcetfaic8Etc8F91aicd47avcwfaiceGcdtVgoydbfgl87ebaoalBdbaDcefgDae9hmbkkcbc99arawSEhokaok:Lvoeue99dud99eud99dndnadcl9hmbaeTmeindndnabcdfgd8Sbb:Yab8Sbbgi:Ygl:l:tabcefgv8Sbbgo:Ygr:l:tgwJbb;:9cawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai86bbdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad86bbdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad86bbabclfhbaecufgembxdkkaeTmbindndnabclfgd8Ueb:Yab8Uebgi:Ygl:l:tabcdfgv8Uebgo:Ygr:l:tgwJb;:FSawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai87ebdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad87ebdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad87ebabcwfhbaecufgembkkk;oiliui99iue99dnaeTmbcbhiabhlindndnJ;Zl81Zalcof8UebgvciV:Y:vgoal8Ueb:YNgrJb;:FSNJbbbZJbbb:;arJbbbb9GEMgw:lJbbb9p9DTmbaw:OhDxekcjjjj94hDkalclf8Uebhqalcdf8UebhkabaiavcefciGfcetfaD87ebdndnaoak:YNgwJb;:FSNJbbbZJbbb:;awJbbbb9GEMgx:lJbbb9p9DTmbax:OhDxekcjjjj94hDkabaiavciGfgkcd7cetfaD87ebdndnaoaq:YNgoJb;:FSNJbbbZJbbb:;aoJbbbb9GEMgx:lJbbb9p9DTmbax:OhDxekcjjjj94hDkabaiavcufciGfcetfaD87ebdndnJbbjZararN:tawawN:taoaoN:tgrJbbbbarJbbbb9GE:rJb;:FSNJbbbZMgr:lJbbb9p9DTmbar:Ohvxekcjjjj94hvkabakcetfav87ebalcwfhlaiclfhiaecufgembkkk9mbdnadcd4ae2gdTmbinababydbgecwtcw91:Yaece91cjjj98Gcjjj;8if::NUdbabclfhbadcufgdmbkkk9teiucbcbydj1jjbgeabcifc98GfgbBdj1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;LeeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiclfaeclfydbBdbaicwfaecwfydbBdbaicxfaecxfydbBdbaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk;aeedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdbaicxfalBdbaicwfalBdbaiclfalBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabkkkebcjwklzNbb'; // embed! base
	var wasm_simd =
		'b9H79TebbbeKl9Gbb9Gvuuuuueu9Giuuub9Geueuikqbbebeedddilve9Weeeviebeoweuec:q:6dkr;leDo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbdY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVblE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtboK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbrL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949Wbwl79IV9RbDq:p9sqlbzik9:evu8Jjjjjbcz9Rhbcbheincbhdcbhiinabcwfadfaicjuaead4ceGglE86bbaialfhiadcefgdcw9hmbkaec:q:yjjbfai86bbaecitc:q1jjbfab8Piw83ibaecefgecjd9hmbkk:N8JlHud97euo978Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnadcefal0mbcuhoaiRbbc:Ge9hmbavaialfgrad9Rad;8qbbcj;abad9UhlaicefhodnaeTmbadTmbalc;WFbGglcjdalcjd6EhwcbhDinawaeaD9RaDawfae6Egqcsfglc9WGgkci2hxakcethmalcl4cifcd4hPabaDad2fhsakc;ab6hzcbhHincbhOaohAdndninaraA9RaP6meavcj;cbfaOak2fhCaAaPfhocbhidnazmbarao9Rc;Gb6mbcbhlinaCalfhidndndndndnaAalco4fRbbgXciGPlbedibkaipxbbbbbbbbbbbbbbbbpklbxikaiaopbblaopbbbgQclp:meaQpmbzeHdOiAlCvXoQrLgQcdp:meaQpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogLpxiiiiiiiiiiiiiiiip8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklbaoclfaYpQbfaKc:q:yjjbfRbbfhoxdkaiaopbbwaopbbbgQclp:meaQpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogLpxssssssssssssssssp8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklbaocwfaYpQbfaKc:q:yjjbfRbbfhoxekaiaopbbbpklbaoczfhokdndndndndnaXcd4ciGPlbedibkaipxbbbbbbbbbbbbbbbbpklzxikaiaopbblaopbbbgQclp:meaQpmbzeHdOiAlCvXoQrLgQcdp:meaQpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogLpxiiiiiiiiiiiiiiiip8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklzaoclfaYpQbfaKc:q:yjjbfRbbfhoxdkaiaopbbwaopbbbgQclp:meaQpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogLpxssssssssssssssssp8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklzaocwfaYpQbfaKc:q:yjjbfRbbfhoxekaiaopbbbpklzaoczfhokdndndndndnaXcl4ciGPlbedibkaipxbbbbbbbbbbbbbbbbpklaxikaiaopbblaopbbbgQclp:meaQpmbzeHdOiAlCvXoQrLgQcdp:meaQpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogLpxiiiiiiiiiiiiiiiip8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklaaoclfaYpQbfaKc:q:yjjbfRbbfhoxdkaiaopbbwaopbbbgQclp:meaQpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogLpxssssssssssssssssp8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklaaocwfaYpQbfaKc:q:yjjbfRbbfhoxekaiaopbbbpklaaoczfhokdndndndndnaXco4Plbedibkaipxbbbbbbbbbbbbbbbbpkl8WxikaiaopbblaopbbbgQclp:meaQpmbzeHdOiAlCvXoQrLgQcdp:meaQpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogLpxiiiiiiiiiiiiiiiip8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgXcitc:q1jjbfpbibaXc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgXcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spkl8WaoclfaYpQbfaXc:q:yjjbfRbbfhoxdkaiaopbbwaopbbbgQclp:meaQpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogLpxssssssssssssssssp8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgXcitc:q1jjbfpbibaXc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgXcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spkl8WaocwfaYpQbfaXc:q:yjjbfRbbfhoxekaiaopbbbpkl8Waoczfhokalc;abfhialcjefak0meaihlarao9Rc;Fb0mbkkdnaiak9pmbaici4hlinarao9RcK6miaCaifhXdndndndndnaAaico4fRbbalcoG4ciGPlbedibkaXpxbbbbbbbbbbbbbbbbpkbbxikaXaopbblaopbbbgQclp:meaQpmbzeHdOiAlCvXoQrLgQcdp:meaQpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogLpxiiiiiiiiiiiiiiiip8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spkbbaoclfaYpQbfaKc:q:yjjbfRbbfhoxdkaXaopbbwaopbbbgQclp:meaQpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogLpxssssssssssssssssp8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spkbbaocwfaYpQbfaKc:q:yjjbfRbbfhoxekaXaopbbbpkbbaoczfhokalcdfhlaiczfgiak6mbkkaoTmeaohAaOcefgOclSmdxbkkc9:hoxlkdnakTmbavcjdfaHfhiavaHfpbdbhYcbhXinaiavcj;cbfaXfglpblbgLcep9TaLpxeeeeeeeeeeeeeeeegQp9op9Hp9rgLalakfpblbg8Acep9Ta8AaQp9op9Hp9rg8ApmbzeHdOiAlCvXoQrLgEalamfpblbg3cep9Ta3aQp9op9Hp9rg3alaxfpblbg5cep9Ta5aQp9op9Hp9rg5pmbzeHdOiAlCvXoQrLg8EpmbezHdiOAlvCXorQLgQaQpmbedibedibedibediaYp9UgYp9AdbbaiadfglaYaQaQpmlvorlvorlvorlvorp9UgYp9AdbbaladfglaYaQaQpmwDqkwDqkwDqkwDqkp9UgYp9AdbbaladfglaYaQaQpmxmPsxmPsxmPsxmPsp9UgYp9AdbbaladfglaYaEa8EpmwDKYqk8AExm35Ps8E8FgQaQpmbedibedibedibedip9UgYp9AdbbaladfglaYaQaQpmlvorlvorlvorlvorp9UgYp9AdbbaladfglaYaQaQpmwDqkwDqkwDqkwDqkp9UgYp9AdbbaladfglaYaQaQpmxmPsxmPsxmPsxmPsp9UgYp9AdbbaladfglaYaLa8ApmwKDYq8AkEx3m5P8Es8FgLa3a5pmwKDYq8AkEx3m5P8Es8Fg8ApmbezHdiOAlvCXorQLgQaQpmbedibedibedibedip9UgYp9AdbbaladfglaYaQaQpmlvorlvorlvorlvorp9UgYp9AdbbaladfglaYaQaQpmwDqkwDqkwDqkwDqkp9UgYp9AdbbaladfglaYaQaQpmxmPsxmPsxmPsxmPsp9UgYp9AdbbaladfglaYaLa8ApmwDKYqk8AExm35Ps8E8FgQaQpmbedibedibedibedip9UgYp9AdbbaladfglaYaQaQpmlvorlvorlvorlvorp9UgYp9AdbbaladfglaYaQaQpmwDqkwDqkwDqkwDqkp9UgYp9AdbbaladfglaYaQaQpmxmPsxmPsxmPsxmPsp9UgYp9AdbbaladfhiaXczfgXak6mbkkaHclfgHad6mbkasavcjdfaqad2;8qbbavavcjdfaqcufad2fad;8qbbaqaDfgDae6mbkkcbc99arao9Radcaadca0ESEhokavcj;kbf8Kjjjjbaokwbz:bjjjbk::seHu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnaeci9UgrcHfal0mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgwce0mbavc;abfcFecje;8kbavcUf9cu83ibavc8Wf9cu83ibavcyf9cu83ibavcaf9cu83ibavcKf9cu83ibavczf9cu83ibav9cu83iwav9cu83ibaialfc9WfhDaicefgqarfhidnaeTmbcmcsawceSEhkcbhxcbhmcbhPcbhwcbhlindnaiaD9nmbc9:hoxikdndnaqRbbgoc;Ve0mbavc;abfalaocu7gscl4fcsGcitfgzydlhrazydbhzdnaocsGgHak9pmbavawasfcsGcdtfydbaxaHEhoaHThsdndnadcd9hmbabaPcetfgHaz87ebaHclfao87ebaHcdfar87ebxekabaPcdtfgHazBdbaHcwfaoBdbaHclfarBdbkaxasfhxcdhHavawcdtfaoBdbawasfhwcehsalhOxdkdndnaHcsSmbaHc987aHamffcefhoxekaicefhoai8SbbgHcFeGhsdndnaHcu9mmbaohixekaicvfhiascFbGhscrhHdninao8SbbgOcFbGaHtasVhsaOcu9kmeaocefhoaHcrfgHc8J9hmbxdkkaocefhikasce4cbasceG9R7amfhokdndnadcd9hmbabaPcetfgHaz87ebaHclfao87ebaHcdfar87ebxekabaPcdtfgHazBdbaHcwfaoBdbaHclfarBdbkcdhHavawcdtfaoBdbcehsawcefhwalhOaohmxekdnaocpe0mbaxcefgHavawaDaocsGfRbbgocl49RcsGcdtfydbaocz6gzEhravawao9RcsGcdtfydbaHazfgAaocsGgHEhoaHThCdndnadcd9hmbabaPcetfgHax87ebaHclfao87ebaHcdfar87ebxekabaPcdtfgHaxBdbaHcwfaoBdbaHclfarBdbkcdhsavawcdtfaxBdbavawcefgwcsGcdtfarBdbcihHavc;abfalcitfgOaxBdlaOarBdbavawazfgwcsGcdtfaoBdbalcefcsGhOawaCfhwaxhzaAaCfhxxekaxcbaiRbbgOEgzaoc;:eSgHfhraOcsGhCaOcl4hAdndnaOcs0mbarcefhoxekarhoavawaA9RcsGcdtfydbhrkdndnaCmbaocefhxxekaohxavawaO9RcsGcdtfydbhokdndnaHTmbaicefhHxekaicdfhHai8SbegscFeGhzdnascu9kmbaicofhXazcFbGhzcrhidninaH8SbbgscFbGaitazVhzascu9kmeaHcefhHaicrfgic8J9hmbkaXhHxekaHcefhHkazce4cbazceG9R7amfgmhzkdndnaAcsSmbaHhsxekaHcefhsaH8SbbgicFeGhrdnaicu9kmbaHcvfhXarcFbGhrcrhidninas8SbbgHcFbGaitarVhraHcu9kmeascefhsaicrfgic8J9hmbkaXhsxekascefhskarce4cbarceG9R7amfgmhrkdndnaCcsSmbashixekascefhias8SbbgocFeGhHdnaocu9kmbascvfhXaHcFbGhHcrhodninai8SbbgscFbGaotaHVhHascu9kmeaicefhiaocrfgoc8J9hmbkaXhixekaicefhikaHce4cbaHceG9R7amfgmhokdndnadcd9hmbabaPcetfgHaz87ebaHclfao87ebaHcdfar87ebxekabaPcdtfgHazBdbaHcwfaoBdbaHclfarBdbkcdhsavawcdtfazBdbavawcefgwcsGcdtfarBdbcihHavc;abfalcitfgXazBdlaXarBdbavawaOcz6aAcsSVfgwcsGcdtfaoBdbawaCTaCcsSVfhwalcefcsGhOkaqcefhqavc;abfaOcitfgOarBdlaOaoBdbavc;abfalasfcsGcitfgraoBdlarazBdbawcsGhwalaHfcsGhlaPcifgPae6mbkkcbc99aiaDSEhokavc;aef8Kjjjjbaok:flevu8Jjjjjbcz9Rhvc9:hodnaecvfal0mbcuhoaiRbbc;:eGc;qe9hmbav9cb83iwaicefhraialfc98fhwdnaeTmbdnadcdSmbcbhDindnaraw6mbc9:skarcefhoar8SbbglcFeGhidndnalcu9mmbaohrxekarcvfhraicFbGhicrhldninao8SbbgdcFbGaltaiVhiadcu9kmeaocefhoalcrfglc8J9hmbxdkkaocefhrkabaDcdtfaic8Etc8F91aicd47avcwfaiceGcdtVgoydbfglBdbaoalBdbaDcefgDae9hmbxdkkcbhDindnaraw6mbc9:skarcefhoar8SbbglcFeGhidndnalcu9mmbaohrxekarcvfhraicFbGhicrhldninao8SbbgdcFbGaltaiVhiadcu9kmeaocefhoalcrfglc8J9hmbxdkkaocefhrkabaDcetfaic8Etc8F91aicd47avcwfaiceGcdtVgoydbfgl87ebaoalBdbaDcefgDae9hmbkkcbc99arawSEhokaok:wPliuo97eue978Jjjjjbca9Rhiaec98Ghldndnadcl9hmbdnalTmbcbhvabhdinadadpbbbgocKp:RecKp:Sep;6egraocwp:RecKp:Sep;6earp;Geaoczp:RecKp:Sep;6egwp;Gep;Kep;LegDpxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgkp9op9rp;Kegrpxbb;:9cbb;:9cbb;:9cbb;:9cararp;MeaDaDp;Meawaqawakp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFbbbFbbbFbbbFbbbp9oaopxbbbFbbbFbbbFbbbFp9op9qarawp;Meaqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaDawp;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpkbbadczfhdavclfgval6mbkkalaeSmeaipxbbbbbbbbbbbbbbbbgqpklbaiabalcdtfgdaeciGglcdtgv;8qbbdnalTmbaiaipblbgocKp:RecKp:Sep;6egraocwp:RecKp:Sep;6earp;Geaoczp:RecKp:Sep;6egwp;Gep;Kep;LegDaqp:2egqarpxbbbjbbbjbbbjbbbjgkp9op9rp;Kegrpxbb;:9cbb;:9cbb;:9cbb;:9cararp;MeaDaDp;Meawaqawakp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFbbbFbbbFbbbFbbbp9oaopxbbbFbbbFbbbFbbbFp9op9qarawp;Meaqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaDawp;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpklbkadaiav;8qbbskdnalTmbcbhvabhdinadczfgxaxpbbbgopxbbbbbbFFbbbbbbFFgkp9oadpbbbgDaopmbediwDqkzHOAKY8AEgwczp:Reczp:Sep;6egraDaopmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;6eawczp:Sep;6egwp;Gearp;Gep;Kep;Legopxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgmp9op9rp;Kegrpxb;:FSb;:FSb;:FSb;:FSararp;Meaoaop;Meawaqawamp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFFbbFFbbFFbbFFbbp9oaoawp;Meaqp;Keczp:Rep9qgoarawp;Meaqp;KepxFFbbFFbbFFbbFFbbp9ogrpmwDKYqk8AExm35Ps8E8Fp9qpkbbadaDakp9oaoarpmbezHdiOAlvCXorQLp9qpkbbadcafhdavclfgval6mbkkalaeSmbaiaeciGgvcitgdfcbcaad9R;8kbaiabalcitfglad;8qbbdnavTmbaiaipblzgopxbbbbbbFFbbbbbbFFgkp9oaipblbgDaopmbediwDqkzHOAKY8AEgwczp:Reczp:Sep;6egraDaopmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;6eawczp:Sep;6egwp;Gearp;Gep;Kep;Legopxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgmp9op9rp;Kegrpxb;:FSb;:FSb;:FSb;:FSararp;Meaoaop;Meawaqawamp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFFbbFFbbFFbbFFbbp9oaoawp;Meaqp;Keczp:Rep9qgoarawp;Meaqp;KepxFFbbFFbbFFbbFFbbp9ogrpmwDKYqk8AExm35Ps8E8Fp9qpklzaiaDakp9oaoarpmbezHdiOAlvCXorQLp9qpklbkalaiad;8qbbkk;4wllue97euv978Jjjjjbc8W9Rhidnaec98GglTmbcbhvabhoinaiaopbbbgraoczfgwpbbbgDpmlvorxmPsCXQL358E8Fgqczp:Segkclp:RepklbaopxbbjZbbjZbbjZbbjZpx;Zl81Z;Zl81Z;Zl81Z;Zl81Zakpxibbbibbbibbbibbbp9qp;6ep;NegkaraDpmbediwDqkzHOAKY8AEgrczp:Reczp:Sep;6ep;MegDaDp;Meakarczp:Sep;6ep;Megxaxp;Meakaqczp:Reczp:Sep;6ep;Megqaqp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jepxb;:FSb;:FSb;:FSb;:FSgkp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbgmp9oaxakp;Mearp;Keczp:Rep9qgxaDakp;Mearp;Keamp9oaqakp;Mearp;Keczp:Rep9qgkpmbezHdiOAlvCXorQLgrp5baipblbpEb:T:j83ibaocwfarp5eaipblbpEe:T:j83ibawaxakpmwDKYqk8AExm35Ps8E8Fgkp5baipblbpEd:T:j83ibaocKfakp5eaipblbpEi:T:j83ibaocafhoavclfgval6mbkkdnalaeSmbaiaeciGgvcitgofcbcaao9R;8kbaiabalcitfgwao;8qbbdnavTmbaiaipblbgraipblzgDpmlvorxmPsCXQL358E8Fgqczp:Segkclp:RepklaaipxbbjZbbjZbbjZbbjZpx;Zl81Z;Zl81Z;Zl81Z;Zl81Zakpxibbbibbbibbbibbbp9qp;6ep;NegkaraDpmbediwDqkzHOAKY8AEgrczp:Reczp:Sep;6ep;MegDaDp;Meakarczp:Sep;6ep;Megxaxp;Meakaqczp:Reczp:Sep;6ep;Megqaqp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jepxb;:FSb;:FSb;:FSb;:FSgkp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbgmp9oaxakp;Mearp;Keczp:Rep9qgxaDakp;Mearp;Keamp9oaqakp;Mearp;Keczp:Rep9qgkpmbezHdiOAlvCXorQLgrp5baipblapEb:T:j83ibaiarp5eaipblapEe:T:j83iwaiaxakpmwDKYqk8AExm35Ps8E8Fgkp5baipblapEd:T:j83izaiakp5eaipblapEi:T:j83iKkawaiao;8qbbkk:Pddiue978Jjjjjbc;ab9Rhidnadcd4ae2glc98GgvTmbcbheabhdinadadpbbbgocwp:Recwp:Sep;6eaocep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepkbbadczfhdaeclfgeav6mbkkdnavalSmbaialciGgecdtgdVcbc;abad9R;8kbaiabavcdtfgvad;8qbbdnaeTmbaiaipblbgocwp:Recwp:Sep;6eaocep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepklbkavaiad;8qbbkk9teiucbcbydj1jjbgeabcifc98GfgbBdj1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaikkkebcjwklz:Dbb'; // embed! simd

	var detector = new Uint8Array([
		0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 3, 2, 0, 0, 5, 3, 1, 0, 1, 12, 1, 0, 10, 22, 2, 12, 0, 65, 0, 65, 0, 65, 0, 252, 10, 0, 0,
		11, 7, 0, 65, 0, 253, 15, 26, 11,
	]);
	var wasmpack = new Uint8Array([
		32, 0, 65, 2, 1, 106, 34, 33, 3, 128, 11, 4, 13, 64, 6, 253, 10, 7, 15, 116, 127, 5, 8, 12, 40, 16, 19, 54, 20, 9, 27, 255, 113, 17, 42, 67,
		24, 23, 146, 148, 18, 14, 22, 45, 70, 69, 56, 114, 101, 21, 25, 63, 75, 136, 108, 28, 118, 29, 73, 115,
	]);

	if (typeof WebAssembly !== 'object') {
		return {
			supported: false,
		};
	}

	var wasm = WebAssembly.validate(detector) ? unpack(wasm_simd) : unpack(wasm_base);

	var instance;

	var ready = WebAssembly.instantiate(wasm, {}).then(function (result) {
		instance = result.instance;
		instance.exports.__wasm_call_ctors();
	});

	function unpack(data) {
		var result = new Uint8Array(data.length);
		for (var i = 0; i < data.length; ++i) {
			var ch = data.charCodeAt(i);
			result[i] = ch > 96 ? ch - 97 : ch > 64 ? ch - 39 : ch + 4;
		}
		var write = 0;
		for (var i = 0; i < data.length; ++i) {
			result[write++] = result[i] < 60 ? wasmpack[result[i]] : (result[i] - 60) * 64 + result[++i];
		}
		return result.buffer.slice(0, write);
	}

	function decode(instance, fun, target, count, size, source, filter) {
		var sbrk = instance.exports.sbrk;
		var count4 = (count + 3) & -4;
		var tp = sbrk(count4 * size);
		var sp = sbrk(source.length);
		var heap = new Uint8Array(instance.exports.memory.buffer);
		heap.set(source, sp);
		var res = fun(tp, count, size, sp, source.length);
		if (res == 0 && filter) {
			filter(tp, count4, size);
		}
		target.set(heap.subarray(tp, tp + count * size));
		sbrk(tp - sbrk(0));
		if (res != 0) {
			throw new Error('Malformed buffer data: ' + res);
		}
	}

	var filters = {
		NONE: '',
		OCTAHEDRAL: 'meshopt_decodeFilterOct',
		QUATERNION: 'meshopt_decodeFilterQuat',
		EXPONENTIAL: 'meshopt_decodeFilterExp',
	};

	var decoders = {
		ATTRIBUTES: 'meshopt_decodeVertexBuffer',
		TRIANGLES: 'meshopt_decodeIndexBuffer',
		INDICES: 'meshopt_decodeIndexSequence',
	};

	var workers = [];
	var requestId = 0;

	function createWorker(url) {
		var worker = {
			object: new Worker(url),
			pending: 0,
			requests: {},
		};

		worker.object.onmessage = function (event) {
			var data = event.data;

			worker.pending -= data.count;
			worker.requests[data.id][data.action](data.value);
			delete worker.requests[data.id];
		};

		return worker;
	}

	function initWorkers(count) {
		var source =
			'self.ready = WebAssembly.instantiate(new Uint8Array([' +
			new Uint8Array(wasm) +
			']), {})' +
			'.then(function(result) { result.instance.exports.__wasm_call_ctors(); return result.instance; });' +
			'self.onmessage = ' +
			workerProcess.name +
			';' +
			decode.toString() +
			workerProcess.toString();

		var blob = new Blob([source], { type: 'text/javascript' });
		var url = URL.createObjectURL(blob);

		for (var i = workers.length; i < count; ++i) {
			workers[i] = createWorker(url);
		}

		for (var i = count; i < workers.length; ++i) {
			workers[i].object.postMessage({});
		}

		workers.length = count;

		URL.revokeObjectURL(url);
	}

	function decodeWorker(count, size, source, mode, filter) {
		var worker = workers[0];

		for (var i = 1; i < workers.length; ++i) {
			if (workers[i].pending < worker.pending) {
				worker = workers[i];
			}
		}

		return new Promise(function (resolve, reject) {
			var data = new Uint8Array(source);
			var id = ++requestId;

			worker.pending += count;
			worker.requests[id] = { resolve: resolve, reject: reject };
			worker.object.postMessage({ id: id, count: count, size: size, source: data, mode: mode, filter: filter }, [data.buffer]);
		});
	}

	function workerProcess(event) {
		var data = event.data;
		if (!data.id) {
			return self.close();
		}
		self.ready.then(function (instance) {
			try {
				var target = new Uint8Array(data.count * data.size);
				decode(instance, instance.exports[data.mode], target, data.count, data.size, data.source, instance.exports[data.filter]);
				self.postMessage({ id: data.id, count: data.count, action: 'resolve', value: target }, [target.buffer]);
			} catch (error) {
				self.postMessage({ id: data.id, count: data.count, action: 'reject', value: error });
			}
		});
	}

	return {
		ready: ready,
		supported: true,
		useWorkers: function (count) {
			initWorkers(count);
		},
		decodeVertexBuffer: function (target, count, size, source, filter) {
			decode(instance, instance.exports.meshopt_decodeVertexBuffer, target, count, size, source, instance.exports[filters[filter]]);
		},
		decodeIndexBuffer: function (target, count, size, source) {
			decode(instance, instance.exports.meshopt_decodeIndexBuffer, target, count, size, source);
		},
		decodeIndexSequence: function (target, count, size, source) {
			decode(instance, instance.exports.meshopt_decodeIndexSequence, target, count, size, source);
		},
		decodeGltfBuffer: function (target, count, size, source, mode, filter) {
			decode(instance, instance.exports[decoders[mode]], target, count, size, source, instance.exports[filters[filter]]);
		},
		decodeGltfBufferAsync: function (count, size, source, mode, filter) {
			if (workers.length > 0) {
				return decodeWorker(count, size, source, decoders[mode], filters[filter]);
			}

			return ready.then(function () {
				var target = new Uint8Array(count * size);
				decode(instance, instance.exports[decoders[mode]], target, count, size, source, instance.exports[filters[filter]]);
				return target;
			});
		},
	};
})();

const _taskCache$1 = new WeakMap();

/**
 * A loader for the Draco format.
 *
 * [Draco](https://google.github.io/draco/) is an open source library for compressing
 * and decompressing 3D meshes and point clouds. Compressed geometry can be significantly smaller,
 * at the cost of additional decoding time on the client device.
 *
 * Standalone Draco files have a `.drc` extension, and contain vertex positions, normals, colors,
 * and other attributes. Draco files do not contain materials, textures, animation, or node hierarchies –
 * to use these features, embed Draco geometry inside of a glTF file. A normal glTF file can be converted
 * to a Draco-compressed glTF file using [glTF-Pipeline](https://github.com/CesiumGS/gltf-pipeline).
 * When using Draco with glTF, an instance of `DRACOLoader` will be used internally by {@link GLTFLoader}.
 *
 * It is recommended to create one DRACOLoader instance and reuse it to avoid loading and creating
 * multiple decoder instances.
 *
 * `DRACOLoader` will automatically use either the JS or the WASM decoding library, based on
 * browser capabilities.
 *
 * ```js
 * const loader = new DRACOLoader();
 * loader.setDecoderPath( '/examples/jsm/libs/draco/' );
 *
 * const geometry = await dracoLoader.loadAsync( 'models/draco/bunny.drc' );
 * geometry.computeVertexNormals(); // optional
 *
 * dracoLoader.dispose();
 * ```
 *
 * @augments Loader
 * @three_import import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
 */
class DRACOLoader extends Loader$1 {

	/**
	 * Constructs a new Draco loader.
	 *
	 * @param {LoadingManager} [manager] - The loading manager.
	 */
	constructor( manager ) {

		super( manager );

		this.decoderPath = '';
		this.decoderConfig = {};
		this.decoderBinary = null;
		this.decoderPending = null;

		this.workerLimit = 4;
		this.workerPool = [];
		this.workerNextTaskID = 1;
		this.workerSourceURL = '';

		this.defaultAttributeIDs = {
			position: 'POSITION',
			normal: 'NORMAL',
			color: 'COLOR',
			uv: 'TEX_COORD'
		};
		this.defaultAttributeTypes = {
			position: 'Float32Array',
			normal: 'Float32Array',
			color: 'Float32Array',
			uv: 'Float32Array'
		};

	}

	/**
	 * Provides configuration for the decoder libraries. Configuration cannot be changed after decoding begins.
	 *
	 * @param {string} path - The decoder path.
	 * @return {DRACOLoader} A reference to this loader.
	 */
	setDecoderPath( path ) {

		this.decoderPath = path;

		return this;

	}

	/**
	 * Provides configuration for the decoder libraries. Configuration cannot be changed after decoding begins.
	 *
	 * @param {{type:('js'|'wasm')}} config - The decoder config.
	 * @return {DRACOLoader} A reference to this loader.
	 */
	setDecoderConfig( config ) {

		this.decoderConfig = config;

		return this;

	}

	/**
	 * Sets the maximum number of Web Workers to be used during decoding.
	 * A lower limit may be preferable if workers are also for other tasks in the application.
	 *
	 * @param {number} workerLimit - The worker limit.
	 * @return {DRACOLoader} A reference to this loader.
	 */
	setWorkerLimit( workerLimit ) {

		this.workerLimit = workerLimit;

		return this;

	}

	/**
	 * Starts loading from the given URL and passes the loaded Draco asset
	 * to the `onLoad()` callback.
	 *
	 * @param {string} url - The path/URL of the file to be loaded. This can also be a data URI.
	 * @param {function(BufferGeometry)} onLoad - Executed when the loading process has been finished.
	 * @param {onProgressCallback} onProgress - Executed while the loading is in progress.
	 * @param {onErrorCallback} onError - Executed when errors occur.
	 */
	load( url, onLoad, onProgress, onError ) {

		const loader = new FileLoader( this.manager );

		loader.setPath( this.path );
		loader.setResponseType( 'arraybuffer' );
		loader.setRequestHeader( this.requestHeader );
		loader.setWithCredentials( this.withCredentials );

		loader.load( url, ( buffer ) => {

			this.parse( buffer, onLoad, onError );

		}, onProgress, onError );

	}

	/**
	 * Parses the given Draco data.
	 *
	 * @param {ArrayBuffer} buffer - The raw Draco data as an array buffer.
	 * @param {function(BufferGeometry)} onLoad - Executed when the loading/parsing process has been finished.
	 * @param {onErrorCallback} onError - Executed when errors occur.
	 */
	parse( buffer, onLoad, onError = ()=>{} ) {

		this.decodeDracoFile( buffer, onLoad, null, null, SRGBColorSpace, onError ).catch( onError );

	}

	//

	decodeDracoFile( buffer, callback, attributeIDs, attributeTypes, vertexColorSpace = LinearSRGBColorSpace, onError = () => {} ) {

		const taskConfig = {
			attributeIDs: attributeIDs || this.defaultAttributeIDs,
			attributeTypes: attributeTypes || this.defaultAttributeTypes,
			useUniqueIDs: !! attributeIDs,
			vertexColorSpace: vertexColorSpace,
		};

		return this.decodeGeometry( buffer, taskConfig ).then( callback ).catch( onError );

	}

	decodeGeometry( buffer, taskConfig ) {

		const taskKey = JSON.stringify( taskConfig );

		// Check for an existing task using this buffer. A transferred buffer cannot be transferred
		// again from this thread.
		if ( _taskCache$1.has( buffer ) ) {

			const cachedTask = _taskCache$1.get( buffer );

			if ( cachedTask.key === taskKey ) {

				return cachedTask.promise;

			} else if ( buffer.byteLength === 0 ) {

				// Technically, it would be possible to wait for the previous task to complete,
				// transfer the buffer back, and decode again with the second configuration. That
				// is complex, and I don't know of any reason to decode a Draco buffer twice in
				// different ways, so this is left unimplemented.
				throw new Error(

					'THREE.DRACOLoader: Unable to re-decode a buffer with different ' +
					'settings. Buffer has already been transferred.'

				);

			}

		}

		//

		let worker;
		const taskID = this.workerNextTaskID ++;
		const taskCost = buffer.byteLength;

		// Obtain a worker and assign a task, and construct a geometry instance
		// when the task completes.
		const geometryPending = this._getWorker( taskID, taskCost )
			.then( ( _worker ) => {

				worker = _worker;

				return new Promise( ( resolve, reject ) => {

					worker._callbacks[ taskID ] = { resolve, reject };

					worker.postMessage( { type: 'decode', id: taskID, taskConfig, buffer }, [ buffer ] );

					// this.debug();

				} );

			} )
			.then( ( message ) => this._createGeometry( message.geometry ) );

		// Remove task from the task list.
		// Note: replaced '.finally()' with '.catch().then()' block - iOS 11 support (#19416)
		geometryPending
			.catch( () => true )
			.then( () => {

				if ( worker && taskID ) {

					this._releaseTask( worker, taskID );

					// this.debug();

				}

			} );

		// Cache the task result.
		_taskCache$1.set( buffer, {

			key: taskKey,
			promise: geometryPending

		} );

		return geometryPending;

	}

	_createGeometry( geometryData ) {

		const geometry = new BufferGeometry();

		if ( geometryData.index ) {

			geometry.setIndex( new BufferAttribute( geometryData.index.array, 1 ) );

		}

		for ( let i = 0; i < geometryData.attributes.length; i ++ ) {

			const { name, array, itemSize, stride, vertexColorSpace } = geometryData.attributes[ i ];

			let attribute;

			if ( itemSize === stride ) {

				attribute = new BufferAttribute( array, itemSize );

			} else {

				const buffer = new InterleavedBuffer( array, stride );

				attribute = new InterleavedBufferAttribute( buffer, itemSize, 0 );

			}

			if ( name === 'color' ) {

				this._assignVertexColorSpace( attribute, vertexColorSpace );

				attribute.normalized = ( array instanceof Float32Array ) === false;

			}

			geometry.setAttribute( name, attribute );

		}

		return geometry;

	}

	_assignVertexColorSpace( attribute, inputColorSpace ) {

		// While .drc files do not specify colorspace, the only 'official' tooling
		// is PLY and OBJ converters, which use sRGB. We'll assume sRGB when a .drc
		// file is passed into .load() or .parse(). GLTFLoader uses internal APIs
		// to decode geometry, and vertex colors are already Linear-sRGB in there.

		if ( inputColorSpace !== SRGBColorSpace ) return;

		const _color = new Color();

		for ( let i = 0, il = attribute.count; i < il; i ++ ) {

			_color.fromBufferAttribute( attribute, i );
			ColorManagement.colorSpaceToWorking( _color, SRGBColorSpace );
			attribute.setXYZ( i, _color.r, _color.g, _color.b );

		}

	}

	_loadLibrary( url, responseType ) {

		const loader = new FileLoader( this.manager );
		loader.setPath( this.decoderPath );
		loader.setResponseType( responseType );
		loader.setWithCredentials( this.withCredentials );

		return new Promise( ( resolve, reject ) => {

			loader.load( url, resolve, undefined, reject );

		} );

	}

	preload() {

		this._initDecoder();

		return this;

	}

	_initDecoder() {

		if ( this.decoderPending ) return this.decoderPending;

		const useJS = typeof WebAssembly !== 'object' || this.decoderConfig.type === 'js';
		const librariesPending = [];

		if ( useJS ) {

			librariesPending.push( this._loadLibrary( 'draco_decoder.js', 'text' ) );

		} else {

			librariesPending.push( this._loadLibrary( 'draco_wasm_wrapper.js', 'text' ) );
			librariesPending.push( this._loadLibrary( 'draco_decoder.wasm', 'arraybuffer' ) );

		}

		this.decoderPending = Promise.all( librariesPending )
			.then( ( libraries ) => {

				const jsContent = libraries[ 0 ];

				if ( ! useJS ) {

					this.decoderConfig.wasmBinary = libraries[ 1 ];

				}

				const fn = DRACOWorker.toString();

				const body = [
					'/* draco decoder */',
					jsContent,
					'',
					'/* worker */',
					fn.substring( fn.indexOf( '{' ) + 1, fn.lastIndexOf( '}' ) )
				].join( '\n' );

				this.workerSourceURL = URL.createObjectURL( new Blob( [ body ] ) );

			} );

		return this.decoderPending;

	}

	_getWorker( taskID, taskCost ) {

		return this._initDecoder().then( () => {

			if ( this.workerPool.length < this.workerLimit ) {

				const worker = new Worker( this.workerSourceURL );

				worker._callbacks = {};
				worker._taskCosts = {};
				worker._taskLoad = 0;

				worker.postMessage( { type: 'init', decoderConfig: this.decoderConfig } );

				worker.onmessage = function ( e ) {

					const message = e.data;

					switch ( message.type ) {

						case 'decode':
							worker._callbacks[ message.id ].resolve( message );
							break;

						case 'error':
							worker._callbacks[ message.id ].reject( message );
							break;

						default:
							console.error( 'THREE.DRACOLoader: Unexpected message, "' + message.type + '"' );

					}

				};

				this.workerPool.push( worker );

			} else {

				this.workerPool.sort( function ( a, b ) {

					return a._taskLoad > b._taskLoad ? -1 : 1;

				} );

			}

			const worker = this.workerPool[ this.workerPool.length - 1 ];
			worker._taskCosts[ taskID ] = taskCost;
			worker._taskLoad += taskCost;
			return worker;

		} );

	}

	_releaseTask( worker, taskID ) {

		worker._taskLoad -= worker._taskCosts[ taskID ];
		delete worker._callbacks[ taskID ];
		delete worker._taskCosts[ taskID ];

	}

	debug() {

		console.log( 'Task load: ', this.workerPool.map( ( worker ) => worker._taskLoad ) );

	}

	dispose() {

		for ( let i = 0; i < this.workerPool.length; ++ i ) {

			this.workerPool[ i ].terminate();

		}

		this.workerPool.length = 0;

		if ( this.workerSourceURL !== '' ) {

			URL.revokeObjectURL( this.workerSourceURL );

		}

		return this;

	}

}

/* WEB WORKER */

function DRACOWorker() {

	let decoderConfig;
	let decoderPending;

	onmessage = function ( e ) {

		const message = e.data;

		switch ( message.type ) {

			case 'init':
				decoderConfig = message.decoderConfig;
				decoderPending = new Promise( function ( resolve/*, reject*/ ) {

					decoderConfig.onModuleLoaded = function ( draco ) {

						// Module is Promise-like. Wrap before resolving to avoid loop.
						resolve( { draco: draco } );

					};

					DracoDecoderModule( decoderConfig ); // eslint-disable-line no-undef

				} );
				break;

			case 'decode':
				const buffer = message.buffer;
				const taskConfig = message.taskConfig;
				decoderPending.then( ( module ) => {

					const draco = module.draco;
					const decoder = new draco.Decoder();

					try {

						const geometry = decodeGeometry( draco, decoder, new Int8Array( buffer ), taskConfig );

						const buffers = geometry.attributes.map( ( attr ) => attr.array.buffer );

						if ( geometry.index ) buffers.push( geometry.index.array.buffer );

						self.postMessage( { type: 'decode', id: message.id, geometry }, buffers );

					} catch ( error ) {

						console.error( error );

						self.postMessage( { type: 'error', id: message.id, error: error.message } );

					} finally {

						draco.destroy( decoder );

					}

				} );
				break;

		}

	};

	function decodeGeometry( draco, decoder, array, taskConfig ) {

		const attributeIDs = taskConfig.attributeIDs;
		const attributeTypes = taskConfig.attributeTypes;

		let dracoGeometry;
		let decodingStatus;

		const geometryType = decoder.GetEncodedGeometryType( array );

		if ( geometryType === draco.TRIANGULAR_MESH ) {

			dracoGeometry = new draco.Mesh();
			decodingStatus = decoder.DecodeArrayToMesh( array, array.byteLength, dracoGeometry );

		} else if ( geometryType === draco.POINT_CLOUD ) {

			dracoGeometry = new draco.PointCloud();
			decodingStatus = decoder.DecodeArrayToPointCloud( array, array.byteLength, dracoGeometry );

		} else {

			throw new Error( 'THREE.DRACOLoader: Unexpected geometry type.' );

		}

		if ( ! decodingStatus.ok() || dracoGeometry.ptr === 0 ) {

			throw new Error( 'THREE.DRACOLoader: Decoding failed: ' + decodingStatus.error_msg() );

		}

		const geometry = { index: null, attributes: [] };

		// Gather all vertex attributes.
		for ( const attributeName in attributeIDs ) {

			const attributeType = self[ attributeTypes[ attributeName ] ];

			let attribute;
			let attributeID;

			// A Draco file may be created with default vertex attributes, whose attribute IDs
			// are mapped 1:1 from their semantic name (POSITION, NORMAL, ...). Alternatively,
			// a Draco file may contain a custom set of attributes, identified by known unique
			// IDs. glTF files always do the latter, and `.drc` files typically do the former.
			if ( taskConfig.useUniqueIDs ) {

				attributeID = attributeIDs[ attributeName ];
				attribute = decoder.GetAttributeByUniqueId( dracoGeometry, attributeID );

			} else {

				attributeID = decoder.GetAttributeId( dracoGeometry, draco[ attributeIDs[ attributeName ] ] );

				if ( attributeID === -1 ) continue;

				attribute = decoder.GetAttribute( dracoGeometry, attributeID );

			}

			const attributeResult = decodeAttribute( draco, decoder, dracoGeometry, attributeName, attributeType, attribute );

			if ( attributeName === 'color' ) {

				attributeResult.vertexColorSpace = taskConfig.vertexColorSpace;

			}

			geometry.attributes.push( attributeResult );

		}

		// Add index.
		if ( geometryType === draco.TRIANGULAR_MESH ) {

			geometry.index = decodeIndex( draco, decoder, dracoGeometry );

		}

		draco.destroy( dracoGeometry );

		return geometry;

	}

	function decodeIndex( draco, decoder, dracoGeometry ) {

		const numFaces = dracoGeometry.num_faces();
		const numIndices = numFaces * 3;
		const byteLength = numIndices * 4;

		const ptr = draco._malloc( byteLength );
		decoder.GetTrianglesUInt32Array( dracoGeometry, byteLength, ptr );
		const index = new Uint32Array( draco.HEAPF32.buffer, ptr, numIndices ).slice();
		draco._free( ptr );

		return { array: index, itemSize: 1 };

	}

	function decodeAttribute( draco, decoder, dracoGeometry, attributeName, TypedArray, attribute ) {

		const count = dracoGeometry.num_points();
		const itemSize = attribute.num_components();
		const dracoDataType = getDracoDataType( draco, TypedArray );

		// Reference: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#data-alignment
		const srcByteStride = itemSize * TypedArray.BYTES_PER_ELEMENT;
		const dstByteStride = Math.ceil( srcByteStride / 4 ) * 4;

		const dstStride = dstByteStride / TypedArray.BYTES_PER_ELEMENT;

		const srcByteLength = count * srcByteStride;
		const dstByteLength = count * dstByteStride;

		const ptr = draco._malloc( srcByteLength );
		decoder.GetAttributeDataArrayForAllPoints( dracoGeometry, attribute, dracoDataType, srcByteLength, ptr );

		const srcArray = new TypedArray( draco.HEAPF32.buffer, ptr, srcByteLength / TypedArray.BYTES_PER_ELEMENT );
		let dstArray;

		if ( srcByteStride === dstByteStride ) {

			// THREE.BufferAttribute

			dstArray = srcArray.slice();

		} else {

			// THREE.InterleavedBufferAttribute

			dstArray = new TypedArray( dstByteLength / TypedArray.BYTES_PER_ELEMENT );

			let dstOffset = 0;

			for ( let i = 0, il = srcArray.length; i < il; i ++ ) {

				for ( let j = 0; j < itemSize; j ++ ) {

					dstArray[ dstOffset + j ] = srcArray[ i * itemSize + j ];

				}

				dstOffset += dstStride;

			}

		}

		draco._free( ptr );

		return {
			name: attributeName,
			count: count,
			itemSize: itemSize,
			array: dstArray,
			stride: dstStride
		};

	}

	function getDracoDataType( draco, TypedArray ) {

		switch ( TypedArray ) {

			case Float32Array: return draco.DT_FLOAT32;
			case Int8Array: return draco.DT_INT8;
			case Int16Array: return draco.DT_INT16;
			case Int32Array: return draco.DT_INT32;
			case Uint8Array: return draco.DT_UINT8;
			case Uint16Array: return draco.DT_UINT16;
			case Uint32Array: return draco.DT_UINT32;

		}

	}

}

/**
 * A simple pool for managing Web Workers.
 *
 * @three_import import { WorkerPool } from 'three/addons/utils/WorkerPool.js';
 */
class WorkerPool {

	/**
	 * Constructs a new Worker pool.
	 *
	 * @param {number} [pool=4] - The size of the pool.
	 */
	constructor( pool = 4 ) {

		/**
		 * The size of the pool.
		 *
		 * @type {number}
		 * @default 4
		 */
		this.pool = pool;

		/**
		 * A message queue.
		 *
		 * @type {Array<Object>}
		 */
		this.queue = [];

		/**
		 * An array of Workers.
		 *
		 * @type {Array<Worker>}
		 */
		this.workers = [];

		/**
		 * An array with resolve functions for messages.
		 *
		 * @type {Array<Function>}
		 */
		this.workersResolve = [];

		/**
		 * The current worker status.
		 *
		 * @type {number}
		 */
		this.workerStatus = 0;

		/**
		 * A factory function for creating workers.
		 *
		 * @type {?Function}
		 */
		this.workerCreator = null;

	}

	_initWorker( workerId ) {

		if ( ! this.workers[ workerId ] ) {

			const worker = this.workerCreator();
			worker.addEventListener( 'message', this._onMessage.bind( this, workerId ) );
			this.workers[ workerId ] = worker;

		}

	}

	_getIdleWorker() {

		for ( let i = 0; i < this.pool; i ++ )
			if ( ! ( this.workerStatus & ( 1 << i ) ) ) return i;

		return -1;

	}

	_onMessage( workerId, msg ) {

		const resolve = this.workersResolve[ workerId ];
		resolve && resolve( msg );

		if ( this.queue.length ) {

			const { resolve, msg, transfer } = this.queue.shift();
			this.workersResolve[ workerId ] = resolve;
			this.workers[ workerId ].postMessage( msg, transfer );

		} else {

			this.workerStatus ^= 1 << workerId;

		}

	}

	/**
	 * Sets a function that is responsible for creating Workers.
	 *
	 * @param {Function} workerCreator - The worker creator function.
	 */
	setWorkerCreator( workerCreator ) {

		this.workerCreator = workerCreator;

	}

	/**
	 * Sets the Worker limit
	 *
	 * @param {number} pool - The size of the pool.
	 */
	setWorkerLimit( pool ) {

		this.pool = pool;

	}

	/**
	 * Post a message to an idle Worker. If no Worker is available,
	 * the message is pushed into a message queue for later processing.
	 *
	 * @param {Object} msg - The message.
	 * @param {Array<ArrayBuffer>} transfer - An array with array buffers for data transfer.
	 * @return {Promise} A Promise that resolves when the message has been processed.
	 */
	postMessage( msg, transfer ) {

		return new Promise( ( resolve ) => {

			const workerId = this._getIdleWorker();

			if ( workerId !== -1 ) {

				this._initWorker( workerId );
				this.workerStatus |= 1 << workerId;
				this.workersResolve[ workerId ] = resolve;
				this.workers[ workerId ].postMessage( msg, transfer );

			} else {

				this.queue.push( { resolve, msg, transfer } );

			}

		} );

	}

	/**
	 * Terminates all Workers of this pool. Call this  method whenever this
	 * Worker pool is no longer used in your app.
	 */
	dispose() {

		this.workers.forEach( ( worker ) => worker.terminate() );
		this.workersResolve.length = 0;
		this.workers.length = 0;
		this.queue.length = 0;
		this.workerStatus = 0;

	}

}

const t$1=0,n=2,u$2=1,y$1=2,S$2=0,E=1,X=10,it$1=0,ht=9,gt$1=15,xt$1=16,dt=22,Ft=37,Et=43,te$1=76,ae=83,ue=97,ye$1=100,de=103,Ae=109,We=122,He=123,qe=131,Je=132,Qe=133,Ze=134,en=137,nn=138,sn=139,an=140,rn=141,on=142,cn=145,Un$1=146,pn=148,xn=152,yn=153,bn=154,mn=155,dn=156,Dn=157,wn=158,Vn=165,Cn=166,ri=1000054e3,oi=1000054001,ci=1000054004,Ui=1000054005,_i=1000066e3,yi=1000066004;class Ci{constructor(t,e,n,i){this._dataView=void 0,this._littleEndian=void 0,this._offset=void 0,this._dataView=new DataView(t.buffer,t.byteOffset+e,n),this._littleEndian=i,this._offset=0;}_nextUint8(){const t=this._dataView.getUint8(this._offset);return this._offset+=1,t}_nextUint16(){const t=this._dataView.getUint16(this._offset,this._littleEndian);return this._offset+=2,t}_nextUint32(){const t=this._dataView.getUint32(this._offset,this._littleEndian);return this._offset+=4,t}_nextUint64(){const t=this._dataView.getUint32(this._offset,this._littleEndian)+2**32*this._dataView.getUint32(this._offset+4,this._littleEndian);return this._offset+=8,t}_nextInt32(){const t=this._dataView.getInt32(this._offset,this._littleEndian);return this._offset+=4,t}_nextUint8Array(t){const e=new Uint8Array(this._dataView.buffer,this._dataView.byteOffset+this._offset,t);return this._offset+=t,e}_skip(t){return this._offset+=t,this}_scan(t,e=0){const n=this._offset;let i=0;for(;this._dataView.getUint8(this._offset)!==e&&i<t;)i++,this._offset++;return i<t&&this._offset++,new Uint8Array(this._dataView.buffer,this._dataView.byteOffset+n,i)}}const Oi=[171,75,84,88,32,50,48,187,13,10,26,10];function Si(t){return (new TextDecoder).decode(t)}function Mi(t){const e=new Uint8Array(t.buffer,t.byteOffset,Oi.length);if(e[0]!==Oi[0]||e[1]!==Oi[1]||e[2]!==Oi[2]||e[3]!==Oi[3]||e[4]!==Oi[4]||e[5]!==Oi[5]||e[6]!==Oi[6]||e[7]!==Oi[7]||e[8]!==Oi[8]||e[9]!==Oi[9]||e[10]!==Oi[10]||e[11]!==Oi[11])throw new Error("Missing KTX 2.0 identifier.");const n={vkFormat:0,typeSize:1,pixelWidth:0,pixelHeight:0,pixelDepth:0,layerCount:0,faceCount:1,levelCount:0,supercompressionScheme:0,levels:[],dataFormatDescriptor:[{vendorId:0,descriptorType:0,versionNumber:2,colorModel:0,colorPrimaries:1,transferFunction:2,flags:0,texelBlockDimension:[0,0,0,0],bytesPlane:[0,0,0,0,0,0,0,0],samples:[]}],keyValue:{},globalData:null},i=17*Uint32Array.BYTES_PER_ELEMENT,s=new Ci(t,Oi.length,i,true);n.vkFormat=s._nextUint32(),n.typeSize=s._nextUint32(),n.pixelWidth=s._nextUint32(),n.pixelHeight=s._nextUint32(),n.pixelDepth=s._nextUint32(),n.layerCount=s._nextUint32(),n.faceCount=s._nextUint32(),n.levelCount=s._nextUint32(),n.supercompressionScheme=s._nextUint32();const a=s._nextUint32(),r=s._nextUint32(),o=s._nextUint32(),l=s._nextUint32(),f=s._nextUint64(),c=s._nextUint64(),U=3*Math.max(n.levelCount,1)*8,h=new Ci(t,Oi.length+i,U,true);for(let e=0,i=Math.max(n.levelCount,1);e<i;e++)n.levels.push({levelData:new Uint8Array(t.buffer,t.byteOffset+h._nextUint64(),h._nextUint64()),uncompressedByteLength:h._nextUint64()});const p=new Ci(t,a,r,true);p._skip(4);const _=p._nextUint16(),u=p._nextUint16(),g=p._nextUint16(),x=p._nextUint16(),y={vendorId:_,descriptorType:u,versionNumber:g,colorModel:p._nextUint8(),colorPrimaries:p._nextUint8(),transferFunction:p._nextUint8(),flags:p._nextUint8(),texelBlockDimension:[p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8()],bytesPlane:[p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8()],samples:[]},b=(x/4-6)/4;for(let t=0;t<b;t++){const e={bitOffset:p._nextUint16(),bitLength:p._nextUint8(),channelType:p._nextUint8(),samplePosition:[p._nextUint8(),p._nextUint8(),p._nextUint8(),p._nextUint8()],sampleLower:Number.NEGATIVE_INFINITY,sampleUpper:Number.POSITIVE_INFINITY};64&e.channelType?(e.sampleLower=p._nextInt32(),e.sampleUpper=p._nextInt32()):(e.sampleLower=p._nextUint32(),e.sampleUpper=p._nextUint32()),y.samples[t]=e;}n.dataFormatDescriptor.length=0,n.dataFormatDescriptor.push(y);const m=new Ci(t,o,l,true);for(;m._offset<l;){const t=m._nextUint32(),e=m._scan(t),i=Si(e);if(n.keyValue[i]=m._nextUint8Array(t-e.byteLength-1),i.match(/^ktx/i)){const t=Si(n.keyValue[i]);n.keyValue[i]=t.substring(0,t.lastIndexOf("\0"));}m._skip(t%4?4-t%4:0);}if(c<=0)return n;const d=new Ci(t,f,c,true),D=d._nextUint16(),w=d._nextUint16(),v=d._nextUint32(),B=d._nextUint32(),L=d._nextUint32(),A=d._nextUint32(),k=[];for(let t=0,e=Math.max(n.levelCount,1);t<e;t++)k.push({imageFlags:d._nextUint32(),rgbSliceByteOffset:d._nextUint32(),rgbSliceByteLength:d._nextUint32(),alphaSliceByteOffset:d._nextUint32(),alphaSliceByteLength:d._nextUint32()});const I=f+d._offset,V=I+v,C=V+B,F=C+L,O=new Uint8Array(t.buffer,t.byteOffset+I,v),T=new Uint8Array(t.buffer,t.byteOffset+V,B),S=new Uint8Array(t.buffer,t.byteOffset+C,L),E=new Uint8Array(t.buffer,t.byteOffset+F,A);return n.globalData={endpointCount:D,selectorCount:w,imageDescs:k,endpointsData:O,selectorsData:T,tablesData:S,extendedData:E},n}

let A$1,I$2,B$1;const g={env:{emscripten_notify_memory_growth:function(A){B$1=new Uint8Array(I$2.exports.memory.buffer);}}};class Q{init(){return A$1||(A$1="undefined"!=typeof fetch?fetch("data:application/wasm;base64,"+C$1).then(A=>A.arrayBuffer()).then(A=>WebAssembly.instantiate(A,g)).then(this._init):WebAssembly.instantiate(Buffer.from(C$1,"base64"),g).then(this._init),A$1)}_init(A){I$2=A.instance,g.env.emscripten_notify_memory_growth(0);}decode(A,g=0){if(!I$2)throw new Error("ZSTDDecoder: Await .init() before decoding.");const Q=A.byteLength,C=I$2.exports.malloc(Q);B$1.set(A,C),g=g||Number(I$2.exports.ZSTD_findDecompressedSize(C,Q));const E=I$2.exports.malloc(g),i=I$2.exports.ZSTD_decompress(E,g,C,Q),D=B$1.slice(E,E+i);return I$2.exports.free(C),I$2.exports.free(E),D}}const C$1="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IAMNACAEQQNxBEADQCACRQ0FIAAgAkF/aiICaiIDIAEgAmotAAA6AAAgA0EDcQ0ACwsgAkEDTQ0AA0AgACACQXxqIgJqIAEgAmooAgA2AgAgAkEDSw0ACwsgAkUNAgNAIAAgAkF/aiICaiABIAJqLQAAOgAAIAINAAsMAgsgAkEDTQ0AIAIhBANAIAMgASgCADYCACABQQRqIQEgA0EEaiEDIARBfGoiBEEDSw0ACyACQQNxIQILIAJFDQADQCADIAEtAAA6AAAgA0EBaiEDIAFBAWohASACQX9qIgINAAsLIAAL8wICAn8BfgJAIAJFDQAgACACaiIDQX9qIAE6AAAgACABOgAAIAJBA0kNACADQX5qIAE6AAAgACABOgABIANBfWogAToAACAAIAE6AAIgAkEHSQ0AIANBfGogAToAACAAIAE6AAMgAkEJSQ0AIABBACAAa0EDcSIEaiIDIAFB/wFxQYGChAhsIgE2AgAgAyACIARrQXxxIgRqIgJBfGogATYCACAEQQlJDQAgAyABNgIIIAMgATYCBCACQXhqIAE2AgAgAkF0aiABNgIAIARBGUkNACADIAE2AhggAyABNgIUIAMgATYCECADIAE2AgwgAkFwaiABNgIAIAJBbGogATYCACACQWhqIAE2AgAgAkFkaiABNgIAIAQgA0EEcUEYciIEayICQSBJDQAgAa0iBUIghiAFhCEFIAMgBGohAQNAIAEgBTcDGCABIAU3AxAgASAFNwMIIAEgBTcDACABQSBqIQEgAkFgaiICQR9LDQALCyAACy8BAn8gACgCBCAAKAIAQQJ0aiICLQACIQMgACACLwEAIAEgAi0AAxAIajYCACADCy8BAn8gACgCBCAAKAIAQQJ0aiICLQACIQMgACACLwEAIAEgAi0AAxAFajYCACADCx8AIAAgASACKAIEEAg2AgAgARAEGiAAIAJBCGo2AgQLCAAgAGdBH3MLugUBDX8jAEEQayIKJAACfyAEQQNNBEAgCkEANgIMIApBDGogAyAEEAsaIAAgASACIApBDGpBBBAVIgBBbCAAEAMbIAAgACAESxsMAQsgAEEAIAEoAgBBAXRBAmoQECENQVQgAygAACIGQQ9xIgBBCksNABogAiAAQQVqNgIAIAMgBGoiAkF8aiEMIAJBeWohDiACQXtqIRAgAEEGaiELQQQh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ASIDNgLE4AEgACgCvOABIQQgACABNgK84AEgACABIAJqNgK44AEgACABIAQgA2tqNgLA4AELpgEBAX8gACAAKALs4QEQFjYCyOABIABCADcD+OABIABCADcDuOABIABBwOABakIANwMAIABBqNAAaiIBQYyAgOAANgIAIABBADYCmOIBIABCADcDiOEBIABCAzcDgOEBIABBrNABakHgEikCADcCACAAQbTQAWpB6BIoAgA2AgAgACABNgIMIAAgAEGYIGo2AgggACAAQaAwajYCBCAAIABBEGo2AgALYQEBf0G4fyEDAkAgAUEDSQ0AIAIgABAhIgFBA3YiADYCCCACIAFBAXE2AgQgAiABQQF2QQNxIgM2AgACQCADQX9qIgFBAksNAAJAIAFBAWsOAgEAAgtBbA8LIAAhAwsgAwsMACAAIAEgAkEAEC4LiAQCA38CfiADEBYhBCAAQQBBKBAQIQAgBCACSwRAIAQPCyABRQRAQX8PCwJAAkAgA0EBRg0AIAEoAAAiBkGo6r5pRg0AQXYhAyAGQXBxQdDUtMIBRw0BQQghAyACQQhJDQEgAEEAQSgQECEAIAEoAAQhASAAQQE2AhQgACABrTcDAEEADwsgASACIAMQLyIDIAJLDQAgACADNgIYQXIhAyABIARqIgVBf2otAAAiAkEIcQ0AIAJBIHEiBkUEQEFwIQMgBS0AACIFQacBSw0BIAVBB3GtQgEgBUEDdkEKaq2GIgdCA4h+IAd8IQggBEEBaiEECyACQQZ2IQMgAkECdiEFAkAgAkEDcUF/aiICQQJLBEBBACECDAELAkACQAJAIAJBAWsOAgECAAsgASAEai0AACECIARBAWohBAwCCyABIARqLwAAIQIgBEECaiEEDAELIAEgBGooAAAhAiAEQQRqIQQLIAVBAXEhBQJ+AkACQAJAIANBf2oiA0ECTQRAIANBAWsOAgIDAQtCfyAGRQ0DGiABIARqMQAADAMLIAEgBGovAACtQoACfAwCCyABIARqKAAArQwBCyABIARqKQAACyEHIAAgBTYCICAAIAI2AhwgACAHNwMAQQAhAyAAQQA2AhQgACAHIAggBhsiBzcDCCAAIAdCgIAIIAdCgIAIVBs+AhALIAMLWwEBf0G4fyEDIAIQFiICIAFNBH8gACACakF/ai0AACIAQQNxQQJ0QaAeaigC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C0Egak8NAQsgByAHKQNoNwMQIAcgBykDYDcDCCAEIA0gB0EIaiAHQdwAaiAPIA4gESAQEB4hCwwBCyACIARqIQggBCAKEAcgAkERTwRAIARBEGohAgNAIAIgCkEQaiIKEAcgAkEQaiICIAhJDQALCyAIIAlrIQIgByATNgJcIAkgCCAOa0sEQCAJIAggEWtLBEBBbCELDAILIBAgAiAOayICaiIKIANqIBBNBEAgCCAKIAMQDxoMAgsgCCAKQQAgAmsQDyEIIAcgAiADaiIDNgJkIAggAmshCCAOIQILIAlBEE8EQCADIAhqIQMDQCAIIAIQByACQRBqIQIgCEEQaiIIIANJDQALDAELAkAgCUEHTQRAIAggAi0AADoAACAIIAItAAE6AAEgCCACLQACOgACIAggAi0AAzoAAyAIQQRqIAIgCUECdCIDQcAeaigCAGoiAhAXIAIgA0HgHmooAgBrIQIgBygCZCEDDAELIAggAhAMCyADQQlJDQAgAyAIaiEDIAhBCGoiCCACQQhqIgJrQQ9MBEADQCAIIAIQDCACQQhqIQIgCEEIaiIIIANJDQAMAgALAAsDQCAIIAIQByACQRBqIQIgCEEQaiIIIANJDQALCyAHQRhqEAQaIAsgDCALEAMiAhshDCAEIAQgC2ogAhshBCAFQX9qIgUNAAsgDBADDQFBbCEMIAdBGGoQBEECSQ0BQQAhCANAIAhBA0cEQCAAIAhBAnQiAmpBrNABaiACIAdqKAJENgIAIAhBAWohCAwBCwsgBygCXCEIC0G6fyEMIA8gCGsiACANIARrSw0AIAQEfyAEIAggABALIABqBUEACyABayEMCyAHQfAAaiQAIAwLkRcCFn8FfiMAQdABayIHJAAgByAAKALw4QEiCDYCvAEgASACaiESIAggACgCgOIBaiETAkACQCAFRQRAIAEhAwwBCyAAKALE4AEhESAAKALA4AEhFSAAKAK84AEhDyAAQQE2AozhAUEAIQgDQCAIQQNHBEAgByAIQQJ0IgJqIAAgAmpBrNABaigCADYCVCAIQQFqIQgMAQsLIAcgETYCZCAHIA82AmAgByABIA9rNgJoQWwhECAHQShqIAMgBBAGEAMNASAFQQQgBUEESBshFyAHQTxqIAdBKGogACgCABATIAdBxABqIAdBKGogACgCCBATIAdBzABqIAdB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IAdB0AFqJAAgEAslACAAQgA3AgAgAEEAOwEIIABBADoACyAAIAE2AgwgACACOgAKC7QFAQN/IwBBMGsiBCQAIABB/wFqIgVBfWohBgJAIAMvAQIEQCAEQRhqIAEgAhAGIgIQAw0BIARBEGogBEEYaiADEBwgBEEIaiAEQRhqIAMQHCAAIQMDQAJAIARBGGoQBCADIAZPckUEQCADIARBEGogBEEYahASOgAAIAMgBEEIaiAEQRhqEBI6AAEgBEEYahAERQ0BIANBAmohAwsgBUF+aiEFAn8DQEG6fyECIAMiASAFSw0FIAEgBEEQaiAEQRhqEBI6AAAgAUEBaiEDIARBGGoQBEEDRgRAQQIhAiAEQQhqDAILIAMgBUsNBSABIARBCGogBEEYahASOgABIAFBAmohA0EDIQIgBEEYahAEQQNHDQALIARBEGoLIQUgAyAFIARBGGoQEjoAACABIAJqIABrIQIMAwsgAyAEQRBqIARBGGoQEjoAAiADIARBCGogBEEYahASOgADIANBBGohAwwAAAsACyAEQRhqIAEgAhAGIgIQAw0AIARBEGogBEEYaiADEBwgBEEIaiAEQRhqIAMQHCAAIQMDQAJAIARBGGoQBCADIAZPckUEQCADIARBEGogBEEYahAROgAAIAMgBEEIaiAEQRhqEBE6AAEgBEEYahAERQ0BIANBAmohAwsgBUF+aiEFAn8DQEG6fyECIAMiASAFSw0EIAEgBEEQaiAEQRhqEBE6AAAgAUEBaiEDIARBGGoQBEEDRgRAQQIhAiAEQQhqDAILIAMgBUsNBCABIARBCGogBEEYahAROgABIAFBAmohA0EDIQIgBEEYahAEQQNHDQALIARBEGoLIQUgAyAFIARBGGoQEToAACABIAJqIABrIQIMAgsgAyAEQRBqIARBGGoQEToAAiADIARBCGogBEEYahAROgADIANBBGohAwwAAAsACyAEQTBqJAAgAgtpAQF/An8CQAJAIAJBB00NACABKAAAQbfIwuF+Rw0AIAAgASgABDYCmOIBQWIgAEEQaiABIAIQPiIDEAMNAhogAEKBgICAEDcDiOEBIAAgASADaiACIANrECoMAQsgACABIAIQKgtBAAsLrQMBBn8jAEGAAWsiAyQAQWIhCAJAIAJBCUkNACAAQZjQAGogAUEIaiIEIAJBeGogAEGY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wOABCwutAgIEfwF+IwBBQGoiBCQAAkACQCACQQhJDQAgASgAAEFwcUHQ1LTCAUcNACABIAIQIiEBIABCADcDCCAAQQA2AgQgACABNgIADAELIARBGGogASACEC0iAxADBEAgACADEBoMAQsgAwRAIABBuH8QGgwBCyACIAQoAjAiA2shAiABIANqIQMDQAJAIAAgAyACIARBCGoQLCIFEAMEfyAFBSACIAVBA2oiBU8NAUG4fwsQGgwCCyAGQQFqIQYgAiAFayECIAMgBWohAyAEKAIMRQ0ACyAEKAI4BEAgAkEDTQRAIABBuH8QGgwCCyADQQRqIQMLIAQoAighAiAEKQMYIQcgAEEANgIEIAAgAyABazYCACAAIAIgBmytIAcgB0J/URs3AwgLIARBQGskAAslAQF/IwBBEGsiAiQAIAIgACABEFEgAigCACEAIAJBEGokACAAC30BBH8jAEGQBGsiBCQAIARB/wE2AggCQCAEQRBqIARBCGogBEEMaiABIAIQFSIGEAMEQCAGIQUMAQtBVCEFIAQoAgwiB0EGSw0AIAMgBEEQaiAEKAIIIAcQQSIFEAMNACAAIAEgBmogAiAGayADEDwhBQsgBEGQBGokACAFC4cBAgJ/An5BABAWIQMCQANAIAEgA08EQAJAIAAoAABBcHFB0NS0wgFGBEAgACABECIiAhADRQ0BQn4PCyAAIAEQVSIEQn1WDQMgBCAFfCIFIARUIQJCfiEEIAINAyAAIAEQUiICEAMNAwsgASACayEBIAAgAmohAAwBCwtCfiAFIAEbIQQLIAQLPwIBfwF+IwBBMGsiAiQAAn5CfiACQQhqIAAgARAtDQAaQgAgAigCHEEBRg0AGiACKQMICyEDIAJBMGokACADC40BAQJ/IwBBMGsiASQAAkAgAEUNACAAKAKI4gENACABIABB/OEBaigCADYCKCABIAApAvThATcDICAAEDAgACgCqOIBIQIgASABKAIoNgIYIAEgASkDIDcDECACIAFBEGoQGyAAQQA2AqjiASABIAEoAig2AgggASABKQMgNwMAIAAgARAbCyABQTBqJAALKgECfyMAQRBrIgAkACAAQQA2AgggAEIANwMAIAAQWCEBIABBEGokACABC4cBAQN/IwBBEGsiAiQAAkAgACgCAEUgACgCBEVzDQAgAiAAKAIINgIIIAIgACkCADcDAAJ/IAIoAgAiAQRAIAIoAghBqOMJIAERBQAMAQtBqOMJECgLIgFFDQAgASAAKQIANwL04QEgAUH84QFqIAAoAgg2AgAgARBZIAEhAwsgAkEQaiQAIAMLywEBAn8jAEEgayIBJAAgAEGBgIDAADYCtOIBIABBADYCiOIBIABBADYC7OEBIABCADcDkOIBIABBADYCpOMJIABBADYC3OIBIABCADcCzOIBIABBADYCvOIBIABBADYCxOABIABCADcCnOIBIABBpOIBakIANwIAIABBrOIBakEANgIAIAFCADcCECABQgA3AhggASABKQMYNwMIIAEgASkDEDcDACABKAIIQQh2QQFxIQIgAEEANgLg4gEgACACNgKM4gEgAUEgaiQAC3YBA38jAEEwayIBJAAgAARAIAEgAEHE0AFqIgIoAgA2AiggASAAKQK80AE3AyAgACgCACEDIAEgAigCADYCGCABIAApArzQATcDECADIAFBEGoQGyABIAEoAig2AgggASABKQMgNwMAIAAgARAbCyABQTBqJAALzAEBAX8gACABKAK00AE2ApjiASAAIAEoAgQiAjYCwOABIAAgAjYCvOABIAAgAiABKAIIaiICNgK44AEgACACNgLE4AEgASgCuNABBEAgAEKBgICAEDcDiOEBIAAgAUGk0ABqNgIMIAAgAUGUIGo2AgggACABQZwwajYCBCAAIAFBDGo2AgAgAEGs0AFqIAFBqNABaigCADYCACAAQbDQAWogAUGs0AFqKAIANgIAIABBtNABaiABQbDQAWooAgA2AgAPCyAAQgA3A4jhAQs7ACACRQRAQbp/DwsgBEUEQEFsDwsgAiAEEGAEQCAAIAEgAiADIAQgBRBhDwsgACABIAIgAyAEIAUQZQtGAQF/IwBBEGsiBSQAIAVBCGogBBAOAn8gBS0ACQRAIAAgASACIAMgBBAyDAELIAAgASACIAMgBBA0CyEAIAVBEGokACAACzQAIAAgAyAEIAUQNiIFEAMEQCAFDwsgBSAESQR/IAEgAiADIAVqIAQgBWsgABA1BUG4fwsLRgEBfyMAQRBrIgUkACAFQQhqIAQQDgJ/IAUtAAkEQCAAIAEgAiADIAQQYgwBCyAAIAEgAiADIAQQNQshACAFQRBqJAAgAAtZAQF/QQ8hAiABIABJBEAgAUEE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";

/**
 * Display-P3 color space.
 *
 * @type {string}
 * @constant
 */
const DisplayP3ColorSpace = 'display-p3';

/**
 * Display-P3-Linear color space.
 *
 * @type {string}
 * @constant
 */
const LinearDisplayP3ColorSpace = 'display-p3-linear';

/**
 * Implementation object for the Extended-sRGB color space.
 *
 * @type {module:ColorSpaces~ColorSpaceImpl}
 * @constant
 */
({
	...ColorManagement.spaces[ SRGBColorSpace ]});

/**
 * An object holding the color space implementation.
 *
 * @typedef {Object} module:ColorSpaces~ColorSpaceImpl
 * @property {Array<number>} primaries - The primaries.
 * @property {Array<number>} whitePoint - The white point.
 * @property {Matrix3} toXYZ - A color space conversion matrix, converting to CIE XYZ.
 * @property {Matrix3} fromXYZ - A color space conversion matrix, converting from CIE XYZ.
 * @property {Array<number>} luminanceCoefficients - The luminance coefficients.
 * @property {{unpackColorSpace:string}} [workingColorSpaceConfig] - The working color space config.
 * @property {{drawingBufferColorSpace:string}} [outputColorSpaceConfig] - The drawing buffer color space config.
 **/

const _taskCache = new WeakMap();

let _activeLoaders = 0;

let _zstd;

/**
 * A loader for KTX 2.0 GPU Texture containers.
 *
 * KTX 2.0 is a container format for various GPU texture formats. The loader supports Basis Universal GPU textures,
 * which can be quickly transcoded to a wide variety of GPU texture compression formats. While KTX 2.0 also allows
 * other hardware-specific formats, this loader does not yet parse them.
 *
 * This loader parses the KTX 2.0 container and transcodes to a supported GPU compressed texture format.
 * The required WASM transcoder and JS wrapper are available from the `examples/jsm/libs/basis` directory.
 *
 * This loader relies on Web Assembly which is not supported in older browsers.
 *
 * References:
 * - [KTX specification](http://github.khronos.org/KTX-Specification/)
 * - [DFD](https://www.khronos.org/registry/DataFormat/specs/1.3/dataformat.1.3.html#basicdescriptor)
 * - [BasisU HDR](https://github.com/BinomialLLC/basis_universal/wiki/UASTC-HDR-Texture-Specification-v1.0)
 *
 * ```js
 * const loader = new KTX2Loader();
 * loader.setTranscoderPath( 'examples/jsm/libs/basis/' );
 * loader.detectSupport( renderer );
 * const texture = loader.loadAsync( 'diffuse.ktx2' );
 * ```
 *
 * @augments Loader
 * @three_import import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
 */
class KTX2Loader extends Loader$1 {

	/**
	 * Constructs a new KTX2 loader.
	 *
	 * @param {LoadingManager} [manager] - The loading manager.
	 */
	constructor( manager ) {

		super( manager );

		this.transcoderPath = '';
		this.transcoderBinary = null;
		this.transcoderPending = null;

		this.workerPool = new WorkerPool();
		this.workerSourceURL = '';
		this.workerConfig = null;

		if ( typeof MSC_TRANSCODER !== 'undefined' ) {

			console.warn(

				'THREE.KTX2Loader: Please update to latest "basis_transcoder".'
				+ ' "msc_basis_transcoder" is no longer supported in three.js r125+.'

			);

		}

	}

	/**
	 * Sets the transcoder path.
	 *
	 * The WASM transcoder and JS wrapper are available from the `examples/jsm/libs/basis` directory.
	 *
	 * @param {string} path - The transcoder path to set.
	 * @return {KTX2Loader} A reference to this loader.
	 */
	setTranscoderPath( path ) {

		this.transcoderPath = path;

		return this;

	}

	/**
	 * Sets the maximum number of Web Workers to be allocated by this instance.
	 *
	 * @param {number} workerLimit - The worker limit.
	 * @return {KTX2Loader} A reference to this loader.
	 */
	setWorkerLimit( workerLimit ) {

		this.workerPool.setWorkerLimit( workerLimit );

		return this;

	}


	/**
	 * Async version of {@link KTX2Loader#detectSupport}.
	 *
	 * @async
	 * @deprecated
	 * @param {WebGPURenderer} renderer - The renderer.
	 * @return {Promise} A Promise that resolves when the support has been detected.
	 */
	async detectSupportAsync( renderer ) {

		console.warn( 'KTX2Loader: "detectSupportAsync()" has been deprecated. Use "detectSupport()" and "await renderer.init();" when creating the renderer.' ); // @deprecated r181

		await renderer.init();

		return this.detectSupport( renderer );

	}

	/**
	 * Detects hardware support for available compressed texture formats, to determine
	 * the output format for the transcoder. Must be called before loading a texture.
	 *
	 * @param {WebGPURenderer|WebGLRenderer} renderer - The renderer.
	 * @return {KTX2Loader} A reference to this loader.
	 */
	detectSupport( renderer ) {

		if ( renderer.isWebGPURenderer === true ) {

			this.workerConfig = {
				astcSupported: renderer.hasFeature( 'texture-compression-astc' ),
				astcHDRSupported: false, // https://github.com/gpuweb/gpuweb/issues/3856
				etc1Supported: renderer.hasFeature( 'texture-compression-etc1' ),
				etc2Supported: renderer.hasFeature( 'texture-compression-etc2' ),
				dxtSupported: renderer.hasFeature( 'texture-compression-s3tc' ),
				bptcSupported: renderer.hasFeature( 'texture-compression-bc' ),
				pvrtcSupported: renderer.hasFeature( 'texture-compression-pvrtc' )
			};

		} else {

			this.workerConfig = {
				astcSupported: renderer.extensions.has( 'WEBGL_compressed_texture_astc' ),
				astcHDRSupported: renderer.extensions.has( 'WEBGL_compressed_texture_astc' )
					&& renderer.extensions.get( 'WEBGL_compressed_texture_astc' ).getSupportedProfiles().includes( 'hdr' ),
				etc1Supported: renderer.extensions.has( 'WEBGL_compressed_texture_etc1' ),
				etc2Supported: renderer.extensions.has( 'WEBGL_compressed_texture_etc' ),
				dxtSupported: renderer.extensions.has( 'WEBGL_compressed_texture_s3tc' ),
				bptcSupported: renderer.extensions.has( 'EXT_texture_compression_bptc' ),
				pvrtcSupported: renderer.extensions.has( 'WEBGL_compressed_texture_pvrtc' )
					|| renderer.extensions.has( 'WEBKIT_WEBGL_compressed_texture_pvrtc' )
			};

			if ( typeof navigator !== 'undefined' &&
				navigator.platform.indexOf( 'Linux' ) >= 0 && navigator.userAgent.indexOf( 'Firefox' ) >= 0 &&
				this.workerConfig.astcSupported && this.workerConfig.etc2Supported &&
				this.workerConfig.bptcSupported && this.workerConfig.dxtSupported ) {

				// On Linux, Mesa drivers for AMD and Intel GPUs expose ETC2 and ASTC even though the hardware doesn't support these.
				// Using these extensions will result in expensive software decompression on the main thread inside the driver, causing performance issues.
				// When using ANGLE (e.g. via Chrome), these extensions are not exposed except for some specific Intel GPU models - however, Firefox doesn't perform this filtering.
				// Since a granular filter is a little too fragile and we can transcode into other GPU formats, disable formats that are likely to be emulated.

				this.workerConfig.astcSupported = false;
				this.workerConfig.etc2Supported = false;

			}

		}

		return this;

	}

	// TODO: Make this method private

	init() {

		if ( ! this.transcoderPending ) {

			// Load transcoder wrapper.
			const jsLoader = new FileLoader( this.manager );
			jsLoader.setPath( this.transcoderPath );
			jsLoader.setWithCredentials( this.withCredentials );
			const jsContent = jsLoader.loadAsync( 'basis_transcoder.js' );

			// Load transcoder WASM binary.
			const binaryLoader = new FileLoader( this.manager );
			binaryLoader.setPath( this.transcoderPath );
			binaryLoader.setResponseType( 'arraybuffer' );
			binaryLoader.setWithCredentials( this.withCredentials );
			const binaryContent = binaryLoader.loadAsync( 'basis_transcoder.wasm' );

			this.transcoderPending = Promise.all( [ jsContent, binaryContent ] )
				.then( ( [ jsContent, binaryContent ] ) => {

					const fn = KTX2Loader.BasisWorker.toString();

					const body = [
						'/* constants */',
						'let _EngineFormat = ' + JSON.stringify( KTX2Loader.EngineFormat ),
						'let _EngineType = ' + JSON.stringify( KTX2Loader.EngineType ),
						'let _TranscoderFormat = ' + JSON.stringify( KTX2Loader.TranscoderFormat ),
						'let _BasisFormat = ' + JSON.stringify( KTX2Loader.BasisFormat ),
						'/* basis_transcoder.js */',
						jsContent,
						'/* worker */',
						fn.substring( fn.indexOf( '{' ) + 1, fn.lastIndexOf( '}' ) )
					].join( '\n' );

					this.workerSourceURL = URL.createObjectURL( new Blob( [ body ] ) );
					this.transcoderBinary = binaryContent;

					this.workerPool.setWorkerCreator( () => {

						const worker = new Worker( this.workerSourceURL );
						const transcoderBinary = this.transcoderBinary.slice( 0 );

						worker.postMessage( { type: 'init', config: this.workerConfig, transcoderBinary }, [ transcoderBinary ] );

						return worker;

					} );

				} );

			if ( _activeLoaders > 0 ) {

				// Each instance loads a transcoder and allocates workers, increasing network and memory cost.

				console.warn(

					'THREE.KTX2Loader: Multiple active KTX2 loaders may cause performance issues.'
					+ ' Use a single KTX2Loader instance, or call .dispose() on old instances.'

				);

			}

			_activeLoaders ++;

		}

		return this.transcoderPending;

	}

	/**
	 * Starts loading from the given URL and passes the loaded KTX2 texture
	 * to the `onLoad()` callback.
	 *
	 * @param {string} url - The path/URL of the file to be loaded. This can also be a data URI.
	 * @param {function(CompressedTexture)} onLoad - Executed when the loading process has been finished.
	 * @param {onProgressCallback} onProgress - Executed while the loading is in progress.
	 * @param {onErrorCallback} onError - Executed when errors occur.
	 */
	load( url, onLoad, onProgress, onError ) {

		if ( this.workerConfig === null ) {

			throw new Error( 'THREE.KTX2Loader: Missing initialization with `.detectSupport( renderer )`.' );

		}

		const loader = new FileLoader( this.manager );

		loader.setPath( this.path );
		loader.setCrossOrigin( this.crossOrigin );
		loader.setWithCredentials( this.withCredentials );
		loader.setRequestHeader( this.requestHeader );
		loader.setResponseType( 'arraybuffer' );

		loader.load( url, ( buffer ) => {

			this.parse( buffer, onLoad, onError );

		}, onProgress, onError );

	}

	/**
	 * Parses the given KTX2 data.
	 *
	 * @param {ArrayBuffer} buffer - The raw KTX2 data as an array buffer.
	 * @param {function(CompressedTexture)} onLoad - Executed when the loading/parsing process has been finished.
	 * @param {onErrorCallback} onError - Executed when errors occur.
	 * @returns {Promise} A Promise that resolves when the parsing has been finished.
	 */
	parse( buffer, onLoad, onError ) {

		if ( this.workerConfig === null ) {

			throw new Error( 'THREE.KTX2Loader: Missing initialization with `.detectSupport( renderer )`.' );

		}

		// Check for an existing task using this buffer. A transferred buffer cannot be transferred
		// again from this thread.
		if ( _taskCache.has( buffer ) ) {

			const cachedTask = _taskCache.get( buffer );

			return cachedTask.promise.then( onLoad ).catch( onError );

		}

		this._createTexture( buffer )
			.then( ( texture ) => onLoad ? onLoad( texture ) : null )
			.catch( onError );

	}

	_createTextureFrom( transcodeResult, container ) {

		const { type: messageType, error, data: { faces, width, height, format, type, dfdFlags } } = transcodeResult;

		if ( messageType === 'error' ) return Promise.reject( error );

		let texture;

		if ( container.faceCount === 6 ) {

			texture = new CompressedCubeTexture( faces, format, type );

		} else {

			const mipmaps = faces[ 0 ].mipmaps;

			texture = container.layerCount > 1
				? new CompressedArrayTexture( mipmaps, width, height, container.layerCount, format, type )
				: new CompressedTexture( mipmaps, width, height, format, type );

		}

		texture.minFilter = faces[ 0 ].mipmaps.length === 1 ? LinearFilter : LinearMipmapLinearFilter;
		texture.magFilter = LinearFilter;
		texture.generateMipmaps = false;

		texture.needsUpdate = true;
		texture.colorSpace = parseColorSpace( container );
		texture.premultiplyAlpha = !! ( dfdFlags & u$2 );

		return texture;

	}

	/**
	 * @private
	 * @param {ArrayBuffer} buffer
	 * @param {?Object} config
	 * @return {Promise<CompressedTexture|CompressedArrayTexture|DataTexture|Data3DTexture>}
	 */
	async _createTexture( buffer, config = {} ) {

		const container = Mi( new Uint8Array( buffer ) );

		// Basis UASTC HDR is a subset of ASTC, which can be transcoded efficiently
		// to BC6H. To detect whether a KTX2 file uses Basis UASTC HDR, or default
		// ASTC, inspect the DFD color model.
		//
		// Source: https://github.com/BinomialLLC/basis_universal/issues/381
		const isBasisHDR = container.vkFormat === _i
			&& container.dataFormatDescriptor[ 0 ].colorModel === 0xA7;

		// If the device supports ASTC, Basis UASTC HDR requires no transcoder.
		const needsTranscoder = container.vkFormat === it$1
			|| isBasisHDR && ! this.workerConfig.astcHDRSupported;

		if ( ! needsTranscoder ) {

			return createRawTexture( container );

		}

		//
		const taskConfig = config;
		const texturePending = this.init().then( () => {

			return this.workerPool.postMessage( { type: 'transcode', buffer, taskConfig: taskConfig }, [ buffer ] );

		} ).then( ( e ) => this._createTextureFrom( e.data, container ) );

		// Cache the task result.
		_taskCache.set( buffer, { promise: texturePending } );

		return texturePending;

	}

	/**
	 * Frees internal resources. This method should be called
	 * when the loader is no longer required.
	 */
	dispose() {

		this.workerPool.dispose();
		if ( this.workerSourceURL ) URL.revokeObjectURL( this.workerSourceURL );

		_activeLoaders --;

	}

}


/* CONSTANTS */

KTX2Loader.BasisFormat = {
	ETC1S: 0,
	UASTC: 1,
	UASTC_HDR: 2,
};

// Source: https://github.com/BinomialLLC/basis_universal/blob/master/webgl/texture_test/index.html
KTX2Loader.TranscoderFormat = {
	ETC1: 0,
	ETC2: 1,
	BC1: 2,
	BC3: 3,
	BC4: 4,
	BC5: 5,
	BC7_M6_OPAQUE_ONLY: 6,
	BC7_M5: 7,
	PVRTC1_4_RGB: 8,
	PVRTC1_4_RGBA: 9,
	ASTC_4x4: 10,
	ATC_RGB: 11,
	ATC_RGBA_INTERPOLATED_ALPHA: 12,
	RGBA32: 13,
	RGB565: 14,
	BGR565: 15,
	RGBA4444: 16,
	BC6H: 22,
	RGB_HALF: 24,
	RGBA_HALF: 25,
};

KTX2Loader.EngineFormat = {
	RGBAFormat: RGBAFormat,
	RGBA_ASTC_4x4_Format: RGBA_ASTC_4x4_Format,
	RGB_BPTC_UNSIGNED_Format: RGB_BPTC_UNSIGNED_Format,
	RGBA_BPTC_Format: RGBA_BPTC_Format,
	RGBA_ETC2_EAC_Format: RGBA_ETC2_EAC_Format,
	RGBA_PVRTC_4BPPV1_Format: RGBA_PVRTC_4BPPV1_Format,
	RGBA_S3TC_DXT5_Format: RGBA_S3TC_DXT5_Format,
	RGB_ETC1_Format: RGB_ETC1_Format,
	RGB_ETC2_Format: RGB_ETC2_Format,
	RGB_PVRTC_4BPPV1_Format: RGB_PVRTC_4BPPV1_Format,
	RGBA_S3TC_DXT1_Format: RGBA_S3TC_DXT1_Format,
};

KTX2Loader.EngineType = {
	UnsignedByteType: UnsignedByteType,
	HalfFloatType: HalfFloatType,
	FloatType: FloatType,
};

/* WEB WORKER */

KTX2Loader.BasisWorker = function () {

	let config;
	let transcoderPending;
	let BasisModule;

	const EngineFormat = _EngineFormat; // eslint-disable-line no-undef
	const EngineType = _EngineType; // eslint-disable-line no-undef
	const TranscoderFormat = _TranscoderFormat; // eslint-disable-line no-undef
	const BasisFormat = _BasisFormat; // eslint-disable-line no-undef

	self.addEventListener( 'message', function ( e ) {

		const message = e.data;

		switch ( message.type ) {

			case 'init':
				config = message.config;
				init( message.transcoderBinary );
				break;

			case 'transcode':
				transcoderPending.then( () => {

					try {

						const { faces, buffers, width, height, hasAlpha, format, type, dfdFlags } = transcode( message.buffer );

						self.postMessage( { type: 'transcode', id: message.id, data: { faces, width, height, hasAlpha, format, type, dfdFlags } }, buffers );

					} catch ( error ) {

						console.error( error );

						self.postMessage( { type: 'error', id: message.id, error: error.message } );

					}

				} );
				break;

		}

	} );

	function init( wasmBinary ) {

		transcoderPending = new Promise( ( resolve ) => {

			BasisModule = { wasmBinary, onRuntimeInitialized: resolve };
			BASIS( BasisModule ); // eslint-disable-line no-undef

		} ).then( () => {

			BasisModule.initializeBasis();

			if ( BasisModule.KTX2File === undefined ) {

				console.warn( 'THREE.KTX2Loader: Please update Basis Universal transcoder.' );

			}

		} );

	}

	function transcode( buffer ) {

		const ktx2File = new BasisModule.KTX2File( new Uint8Array( buffer ) );

		function cleanup() {

			ktx2File.close();
			ktx2File.delete();

		}

		if ( ! ktx2File.isValid() ) {

			cleanup();
			throw new Error( 'THREE.KTX2Loader:	Invalid or unsupported .ktx2 file' );

		}

		let basisFormat;

		if ( ktx2File.isUASTC() ) {

			basisFormat = BasisFormat.UASTC;

		} else if ( ktx2File.isETC1S() ) {

			basisFormat = BasisFormat.ETC1S;

		} else if ( ktx2File.isHDR() ) {

			basisFormat = BasisFormat.UASTC_HDR;

		} else {

			throw new Error( 'THREE.KTX2Loader: Unknown Basis encoding' );

		}

		const width = ktx2File.getWidth();
		const height = ktx2File.getHeight();
		const layerCount = ktx2File.getLayers() || 1;
		const levelCount = ktx2File.getLevels();
		const faceCount = ktx2File.getFaces();
		const hasAlpha = ktx2File.getHasAlpha();
		const dfdFlags = ktx2File.getDFDFlags();

		const { transcoderFormat, engineFormat, engineType } = getTranscoderFormat( basisFormat, width, height, hasAlpha );

		if ( ! width || ! height || ! levelCount ) {

			cleanup();
			throw new Error( 'THREE.KTX2Loader:	Invalid texture' );

		}

		if ( ! ktx2File.startTranscoding() ) {

			cleanup();
			throw new Error( 'THREE.KTX2Loader: .startTranscoding failed' );

		}

		const faces = [];
		const buffers = [];

		for ( let face = 0; face < faceCount; face ++ ) {

			const mipmaps = [];

			for ( let mip = 0; mip < levelCount; mip ++ ) {

				const layerMips = [];

				let mipWidth, mipHeight;

				for ( let layer = 0; layer < layerCount; layer ++ ) {

					const levelInfo = ktx2File.getImageLevelInfo( mip, layer, face );

					if ( face === 0 && mip === 0 && layer === 0 && ( levelInfo.origWidth % 4 !== 0 || levelInfo.origHeight % 4 !== 0 ) ) {

						console.warn( 'THREE.KTX2Loader: ETC1S and UASTC textures should use multiple-of-four dimensions.' );

					}

					if ( levelCount > 1 ) {

						mipWidth = levelInfo.origWidth;
						mipHeight = levelInfo.origHeight;

					} else {

						// Handles non-multiple-of-four dimensions in textures without mipmaps. Textures with
						// mipmaps must use multiple-of-four dimensions, for some texture formats and APIs.
						// See mrdoob/three.js#25908.
						mipWidth = levelInfo.width;
						mipHeight = levelInfo.height;

					}

					let dst = new Uint8Array( ktx2File.getImageTranscodedSizeInBytes( mip, layer, 0, transcoderFormat ) );
					const status = ktx2File.transcodeImage( dst, mip, layer, face, transcoderFormat, 0, -1, -1 );

					if ( engineType === EngineType.HalfFloatType ) {

						dst = new Uint16Array( dst.buffer, dst.byteOffset, dst.byteLength / Uint16Array.BYTES_PER_ELEMENT );

					}

					if ( ! status ) {

						cleanup();
						throw new Error( 'THREE.KTX2Loader: .transcodeImage failed.' );

					}

					layerMips.push( dst );

				}

				const mipData = concat( layerMips );

				mipmaps.push( { data: mipData, width: mipWidth, height: mipHeight } );
				buffers.push( mipData.buffer );

			}

			faces.push( { mipmaps, width, height, format: engineFormat, type: engineType } );

		}

		cleanup();

		return { faces, buffers, width, height, hasAlpha, dfdFlags, format: engineFormat, type: engineType };

	}

	//

	// Optimal choice of a transcoder target format depends on the Basis format (ETC1S, UASTC, or
	// UASTC HDR), device capabilities, and texture dimensions. The list below ranks the formats
	// separately for each format. Currently, priority is assigned based on:
	//
	//   high quality > low quality > uncompressed
	//
	// Prioritization may be revisited, or exposed for configuration, in the future.
	//
	// Reference: https://github.com/KhronosGroup/3D-Formats-Guidelines/blob/main/KTXDeveloperGuide.md
	const FORMAT_OPTIONS = [
		{
			if: 'astcSupported',
			basisFormat: [ BasisFormat.UASTC ],
			transcoderFormat: [ TranscoderFormat.ASTC_4x4, TranscoderFormat.ASTC_4x4 ],
			engineFormat: [ EngineFormat.RGBA_ASTC_4x4_Format, EngineFormat.RGBA_ASTC_4x4_Format ],
			engineType: [ EngineType.UnsignedByteType ],
			priorityETC1S: Infinity,
			priorityUASTC: 1,
			needsPowerOfTwo: false,
		},
		{
			if: 'bptcSupported',
			basisFormat: [ BasisFormat.ETC1S, BasisFormat.UASTC ],
			transcoderFormat: [ TranscoderFormat.BC7_M5, TranscoderFormat.BC7_M5 ],
			engineFormat: [ EngineFormat.RGBA_BPTC_Format, EngineFormat.RGBA_BPTC_Format ],
			engineType: [ EngineType.UnsignedByteType ],
			priorityETC1S: 3,
			priorityUASTC: 2,
			needsPowerOfTwo: false,
		},
		{
			if: 'dxtSupported',
			basisFormat: [ BasisFormat.ETC1S, BasisFormat.UASTC ],
			transcoderFormat: [ TranscoderFormat.BC1, TranscoderFormat.BC3 ],
			engineFormat: [ EngineFormat.RGBA_S3TC_DXT1_Format, EngineFormat.RGBA_S3TC_DXT5_Format ],
			engineType: [ EngineType.UnsignedByteType ],
			priorityETC1S: 4,
			priorityUASTC: 5,
			needsPowerOfTwo: false,
		},
		{
			if: 'etc2Supported',
			basisFormat: [ BasisFormat.ETC1S, BasisFormat.UASTC ],
			transcoderFormat: [ TranscoderFormat.ETC1, TranscoderFormat.ETC2 ],
			engineFormat: [ EngineFormat.RGB_ETC2_Format, EngineFormat.RGBA_ETC2_EAC_Format ],
			engineType: [ EngineType.UnsignedByteType ],
			priorityETC1S: 1,
			priorityUASTC: 3,
			needsPowerOfTwo: false,
		},
		{
			if: 'etc1Supported',
			basisFormat: [ BasisFormat.ETC1S, BasisFormat.UASTC ],
			transcoderFormat: [ TranscoderFormat.ETC1 ],
			engineFormat: [ EngineFormat.RGB_ETC1_Format ],
			engineType: [ EngineType.UnsignedByteType ],
			priorityETC1S: 2,
			priorityUASTC: 4,
			needsPowerOfTwo: false,
		},
		{
			if: 'pvrtcSupported',
			basisFormat: [ BasisFormat.ETC1S, BasisFormat.UASTC ],
			transcoderFormat: [ TranscoderFormat.PVRTC1_4_RGB, TranscoderFormat.PVRTC1_4_RGBA ],
			engineFormat: [ EngineFormat.RGB_PVRTC_4BPPV1_Format, EngineFormat.RGBA_PVRTC_4BPPV1_Format ],
			engineType: [ EngineType.UnsignedByteType ],
			priorityETC1S: 5,
			priorityUASTC: 6,
			needsPowerOfTwo: true,
		},
		{
			if: 'bptcSupported',
			basisFormat: [ BasisFormat.UASTC_HDR ],
			transcoderFormat: [ TranscoderFormat.BC6H ],
			engineFormat: [ EngineFormat.RGB_BPTC_UNSIGNED_Format ],
			engineType: [ EngineType.HalfFloatType ],
			priorityHDR: 1,
			needsPowerOfTwo: false,
		},

		// Uncompressed fallbacks.

		{
			basisFormat: [ BasisFormat.ETC1S, BasisFormat.UASTC ],
			transcoderFormat: [ TranscoderFormat.RGBA32, TranscoderFormat.RGBA32 ],
			engineFormat: [ EngineFormat.RGBAFormat, EngineFormat.RGBAFormat ],
			engineType: [ EngineType.UnsignedByteType, EngineType.UnsignedByteType ],
			priorityETC1S: 100,
			priorityUASTC: 100,
			needsPowerOfTwo: false,
		},
		{
			basisFormat: [ BasisFormat.UASTC_HDR ],
			transcoderFormat: [ TranscoderFormat.RGBA_HALF ],
			engineFormat: [ EngineFormat.RGBAFormat ],
			engineType: [ EngineType.HalfFloatType ],
			priorityHDR: 100,
			needsPowerOfTwo: false,
		}
	];

	const OPTIONS = {
		[ BasisFormat.ETC1S ]: FORMAT_OPTIONS
			.filter( ( opt ) => opt.basisFormat.includes( BasisFormat.ETC1S ) )
			.sort( ( a, b ) => a.priorityETC1S - b.priorityETC1S ),

		[ BasisFormat.UASTC ]: FORMAT_OPTIONS
			.filter( ( opt ) => opt.basisFormat.includes( BasisFormat.UASTC ) )
			.sort( ( a, b ) => a.priorityUASTC - b.priorityUASTC ),

		[ BasisFormat.UASTC_HDR ]: FORMAT_OPTIONS
			.filter( ( opt ) => opt.basisFormat.includes( BasisFormat.UASTC_HDR ) )
			.sort( ( a, b ) => a.priorityHDR - b.priorityHDR ),
	};

	function getTranscoderFormat( basisFormat, width, height, hasAlpha ) {

		const options = OPTIONS[ basisFormat ];

		for ( let i = 0; i < options.length; i ++ ) {

			const opt = options[ i ];

			if ( opt.if && ! config[ opt.if ] ) continue;
			if ( ! opt.basisFormat.includes( basisFormat ) ) continue;
			if ( hasAlpha && opt.transcoderFormat.length < 2 ) continue;
			if ( opt.needsPowerOfTwo && ! ( isPowerOfTwo( width ) && isPowerOfTwo( height ) ) ) continue;

			const transcoderFormat = opt.transcoderFormat[ hasAlpha ? 1 : 0 ];
			const engineFormat = opt.engineFormat[ hasAlpha ? 1 : 0 ];
			const engineType = opt.engineType[ 0 ];

			return { transcoderFormat, engineFormat, engineType };

		}

		throw new Error( 'THREE.KTX2Loader: Failed to identify transcoding target.' );

	}

	function isPowerOfTwo( value ) {

		if ( value <= 2 ) return true;

		return ( value & ( value - 1 ) ) === 0 && value !== 0;

	}

	/**
	 * Concatenates N byte arrays.
	 *
	 * @param {Uint8Array[]} arrays
	 * @return {Uint8Array}
	 */
	function concat( arrays ) {

		if ( arrays.length === 1 ) return arrays[ 0 ];

		let totalByteLength = 0;

		for ( let i = 0; i < arrays.length; i ++ ) {

			const array = arrays[ i ];
			totalByteLength += array.byteLength;

		}

		const result = new Uint8Array( totalByteLength );

		let byteOffset = 0;

		for ( let i = 0; i < arrays.length; i ++ ) {

			const array = arrays[ i ];
			result.set( array, byteOffset );

			byteOffset += array.byteLength;

		}

		return result;

	}

};

// Parsing for non-Basis textures. These textures may have supercompression
// like Zstd, but they do not require transcoding.

const UNCOMPRESSED_FORMATS = new Set( [ RGBAFormat, RGBFormat, RGFormat, RedFormat ] );

const FORMAT_MAP = {

	[ Ae ]: RGBAFormat,
	[ de ]: RGFormat,
	[ ye$1 ]: RedFormat,

	[ ue ]: RGBAFormat,
	[ ae ]: RGFormat,
	[ te$1 ]: RedFormat,

	[ Et ]: RGBAFormat,
	[ Ft ]: RGBAFormat,
	[ dt ]: RGFormat,
	[ xt$1 ]: RGFormat,
	[ gt$1 ]: RedFormat,
	[ ht ]: RedFormat,

	[ He ]: RGBFormat,
	[ We ]: RGBFormat,

	[ xn ]: RGBA_ETC2_EAC_Format,
	[ pn ]: RGB_ETC2_Format,
	[ yn ]: R11_EAC_Format,
	[ bn ]: SIGNED_R11_EAC_Format,
	[ mn ]: RG11_EAC_Format,
	[ dn ]: SIGNED_RG11_EAC_Format,

	[ _i ]: RGBA_ASTC_4x4_Format,
	[ wn ]: RGBA_ASTC_4x4_Format,
	[ Dn ]: RGBA_ASTC_4x4_Format,
	[ yi ]: RGBA_ASTC_6x6_Format,
	[ Cn ]: RGBA_ASTC_6x6_Format,
	[ Vn ]: RGBA_ASTC_6x6_Format,

	[ Ze ]: RGBA_S3TC_DXT1_Format,
	[ Qe ]: RGBA_S3TC_DXT1_Format,
	[ Je ]: RGB_S3TC_DXT1_Format,
	[ qe ]: RGB_S3TC_DXT1_Format,

	[ nn ]: RGBA_S3TC_DXT3_Format,
	[ en ]: RGBA_S3TC_DXT3_Format,

	[ an ]: SIGNED_RED_RGTC1_Format,
	[ sn ]: RED_RGTC1_Format,

	[ on ]: SIGNED_RED_GREEN_RGTC2_Format,
	[ rn ]: RED_GREEN_RGTC2_Format,

	[ Un$1 ]: RGBA_BPTC_Format,
	[ cn ]: RGBA_BPTC_Format,

	[ Ui ]: RGBA_PVRTC_4BPPV1_Format,
	[ oi ]: RGBA_PVRTC_4BPPV1_Format,
	[ ci ]: RGBA_PVRTC_2BPPV1_Format,
	[ ri ]: RGBA_PVRTC_2BPPV1_Format,

};

const TYPE_MAP = {

	[ Ae ]: FloatType,
	[ de ]: FloatType,
	[ ye$1 ]: FloatType,

	[ ue ]: HalfFloatType,
	[ ae ]: HalfFloatType,
	[ te$1 ]: HalfFloatType,

	[ Et ]: UnsignedByteType,
	[ Ft ]: UnsignedByteType,
	[ dt ]: UnsignedByteType,
	[ xt$1 ]: UnsignedByteType,
	[ gt$1 ]: UnsignedByteType,
	[ ht ]: UnsignedByteType,

	[ He ]: UnsignedInt5999Type,
	[ We ]: UnsignedInt101111Type,

	[ xn ]: UnsignedByteType,
	[ pn ]: UnsignedByteType,
	[ yn ]: UnsignedByteType,
	[ yn ]: UnsignedByteType,
	[ mn ]: UnsignedByteType,
	[ mn ]: UnsignedByteType,

	[ _i ]: HalfFloatType,
	[ wn ]: UnsignedByteType,
	[ Dn ]: UnsignedByteType,
	[ yi ]: HalfFloatType,
	[ Cn ]: UnsignedByteType,
	[ Vn ]: UnsignedByteType,

	[ Ze ]: UnsignedByteType,
	[ Qe ]: UnsignedByteType,
	[ Je ]: UnsignedByteType,
	[ qe ]: UnsignedByteType,

	[ nn ]: UnsignedByteType,
	[ en ]: UnsignedByteType,

	[ an ]: UnsignedByteType,
	[ sn ]: UnsignedByteType,

	[ on ]: UnsignedByteType,
	[ rn ]: UnsignedByteType,

	[ Un$1 ]: UnsignedByteType,
	[ cn ]: UnsignedByteType,

	[ Ui ]: UnsignedByteType,
	[ oi ]: UnsignedByteType,
	[ ci ]: UnsignedByteType,
	[ ri ]: UnsignedByteType,

};

async function createRawTexture( container ) {

	const { vkFormat } = container;

	if ( FORMAT_MAP[ vkFormat ] === undefined ) {

		throw new Error( 'THREE.KTX2Loader: Unsupported vkFormat: ' + vkFormat );

	}

	// TODO: Merge the TYPE_MAP warning into the thrown error above, after r190.
	if ( TYPE_MAP[ vkFormat ] === undefined ) {

		console.warn( 'THREE.KTX2Loader: Missing ".type" for vkFormat: ' + vkFormat );

	}

	//

	let zstd;

	if ( container.supercompressionScheme === n ) {

		if ( ! _zstd ) {

			_zstd = new Promise( async ( resolve ) => {

				const zstd = new Q();
				await zstd.init();
				resolve( zstd );

			} );

		}

		zstd = await _zstd;

	}

	//

	const mipmaps = [];

	for ( let levelIndex = 0; levelIndex < container.levels.length; levelIndex ++ ) {

		const levelWidth = Math.max( 1, container.pixelWidth >> levelIndex );
		const levelHeight = Math.max( 1, container.pixelHeight >> levelIndex );
		const levelDepth = container.pixelDepth ? Math.max( 1, container.pixelDepth >> levelIndex ) : 0;

		const level = container.levels[ levelIndex ];

		let levelData;

		if ( container.supercompressionScheme === t$1 ) {

			levelData = level.levelData;

		} else if ( container.supercompressionScheme === n ) {

			levelData = zstd.decode( level.levelData, level.uncompressedByteLength );

		} else {

			throw new Error( 'THREE.KTX2Loader: Unsupported supercompressionScheme.' );

		}

		let data;

		if ( TYPE_MAP[ vkFormat ] === FloatType ) {

			data = new Float32Array(

				levelData.buffer,
				levelData.byteOffset,
				levelData.byteLength / Float32Array.BYTES_PER_ELEMENT

			);

		} else if ( TYPE_MAP[ vkFormat ] === HalfFloatType ) {

			data = new Uint16Array(

				levelData.buffer,
				levelData.byteOffset,
				levelData.byteLength / Uint16Array.BYTES_PER_ELEMENT

			);

		} else if ( TYPE_MAP[ vkFormat ] === UnsignedInt5999Type || TYPE_MAP[ vkFormat ] === UnsignedInt101111Type ) {

			data = new Uint32Array(

				levelData.buffer,
				levelData.byteOffset,
				levelData.byteLength / Uint32Array.BYTES_PER_ELEMENT

			);

		} else {

			data = levelData;

		}

		mipmaps.push( {

			data: data,
			width: levelWidth,
			height: levelHeight,
			depth: levelDepth,

		} );

	}

	// levelCount = 0 implies runtime-generated mipmaps.
	const useMipmaps = container.levelCount === 0 || mipmaps.length > 1;

	let texture;

	if ( UNCOMPRESSED_FORMATS.has( FORMAT_MAP[ vkFormat ] ) ) {

		texture = container.pixelDepth === 0
			? new DataTexture( mipmaps[ 0 ].data, container.pixelWidth, container.pixelHeight )
			: new Data3DTexture( mipmaps[ 0 ].data, container.pixelWidth, container.pixelHeight, container.pixelDepth );
		texture.minFilter = useMipmaps ? NearestMipmapNearestFilter : NearestFilter;
		texture.magFilter = NearestFilter;
		texture.generateMipmaps = container.levelCount === 0;

	} else {

		if ( container.pixelDepth > 0 ) throw new Error( 'THREE.KTX2Loader: Unsupported pixelDepth.' );

		texture = new CompressedTexture( mipmaps, container.pixelWidth, container.pixelHeight );
		texture.minFilter = useMipmaps ? LinearMipmapLinearFilter : LinearFilter;
		texture.magFilter = LinearFilter;

	}

	texture.mipmaps = mipmaps;

	texture.type = TYPE_MAP[ vkFormat ];
	texture.format = FORMAT_MAP[ vkFormat ];
	texture.colorSpace = parseColorSpace( container );
	texture.needsUpdate = true;

	//

	return Promise.resolve( texture );

}

function parseColorSpace( container ) {

	const dfd = container.dataFormatDescriptor[ 0 ];

	if ( dfd.colorPrimaries === E ) {

		return dfd.transferFunction === y$1 ? SRGBColorSpace : LinearSRGBColorSpace;

	} else if ( dfd.colorPrimaries === X ) {

		return dfd.transferFunction === y$1 ? DisplayP3ColorSpace : LinearDisplayP3ColorSpace;

	} else if ( dfd.colorPrimaries === S$2 ) {

		return NoColorSpace;

	} else {

		console.warn( `THREE.KTX2Loader: Unsupported color primaries, "${ dfd.colorPrimaries }"` );
		return NoColorSpace;

	}

}

/**
 * A loader for the RGBE HDR texture format.
 *
 * ```js
 * const loader = new HDRLoader();
 * const envMap = await loader.loadAsync( 'textures/equirectangular/blouberg_sunrise_2_1k.hdr' );
 * envMap.mapping = THREE.EquirectangularReflectionMapping;
 *
 * scene.environment = envMap;
 * ```
 *
 * @augments DataTextureLoader
 * @three_import import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
 */
class HDRLoader extends DataTextureLoader {

	/**
     * Constructs a new RGBE/HDR loader.
     *
     * @param {LoadingManager} [manager] - The loading manager.
     */
	constructor( manager ) {

		super( manager );

		/**
         * The texture type.
         *
         * @type {(HalfFloatType|FloatType)}
         * @default HalfFloatType
         */
		this.type = HalfFloatType;

	}

	/**
     * Parses the given RGBE texture data.
     *
     * @param {ArrayBuffer} buffer - The raw texture data.
     * @return {DataTextureLoader~TexData} An object representing the parsed texture data.
     */
	parse( buffer ) {

		// adapted from http://www.graphics.cornell.edu/~bjw/rgbe.html

		const
			/* default error routine.  change this to change error handling */
			rgbe_read_error = 1,
			rgbe_write_error = 2,
			rgbe_format_error = 3,
			rgbe_memory_error = 4,
			rgbe_error = function ( rgbe_error_code, msg ) {

				switch ( rgbe_error_code ) {

					case rgbe_read_error: throw new Error( 'THREE.HDRLoader: Read Error: ' + ( msg || '' ) );
					case rgbe_write_error: throw new Error( 'THREE.HDRLoader: Write Error: ' + ( msg || '' ) );
					case rgbe_format_error: throw new Error( 'THREE.HDRLoader: Bad File Format: ' + ( msg || '' ) );
					default:
					case rgbe_memory_error: throw new Error( 'THREE.HDRLoader: Memory Error: ' + ( msg || '' ) );

				}

			},

			/* offsets to red, green, and blue components in a data (float) pixel */
			//RGBE_DATA_RED = 0,
			//RGBE_DATA_GREEN = 1,
			//RGBE_DATA_BLUE = 2,

			/* number of floats per pixel, use 4 since stored in rgba image format */
			//RGBE_DATA_SIZE = 4,

			/* flags indicating which fields in an rgbe_header_info are valid */
			RGBE_VALID_PROGRAMTYPE = 1,
			RGBE_VALID_FORMAT = 2,
			RGBE_VALID_DIMENSIONS = 4,

			NEWLINE = '\n',

			fgets = function ( buffer, lineLimit, consume ) {

				const chunkSize = 128;

				lineLimit = ! lineLimit ? 1024 : lineLimit;
				let p = buffer.pos,
					i = -1, len = 0, s = '',
					chunk = String.fromCharCode.apply( null, new Uint16Array( buffer.subarray( p, p + chunkSize ) ) );

				while ( ( 0 > ( i = chunk.indexOf( NEWLINE ) ) ) && ( len < lineLimit ) && ( p < buffer.byteLength ) ) {

					s += chunk; len += chunk.length;
					p += chunkSize;
					chunk += String.fromCharCode.apply( null, new Uint16Array( buffer.subarray( p, p + chunkSize ) ) );

				}

				if ( -1 < i ) {

					/*for (i=l-1; i>=0; i--) {
                        byteCode = m.charCodeAt(i);
                        if (byteCode > 0x7f && byteCode <= 0x7ff) byteLen++;
                        else if (byteCode > 0x7ff && byteCode <= 0xffff) byteLen += 2;
                        if (byteCode >= 0xDC00 && byteCode <= 0xDFFF) i--; //trail surrogate
                    }*/
					buffer.pos += len + i + 1;
					return s + chunk.slice( 0, i );

				}

				return false;

			},

			/* minimal header reading.  modify if you want to parse more information */
			RGBE_ReadHeader = function ( buffer ) {


				// regexes to parse header info fields
				const magic_token_re = /^#\?(\S+)/,
					gamma_re = /^\s*GAMMA\s*=\s*(\d+(\.\d+)?)\s*$/,
					exposure_re = /^\s*EXPOSURE\s*=\s*(\d+(\.\d+)?)\s*$/,
					format_re = /^\s*FORMAT=(\S+)\s*$/,
					dimensions_re = /^\s*\-Y\s+(\d+)\s+\+X\s+(\d+)\s*$/,

					// RGBE format header struct
					header = {

						valid: 0, /* indicate which fields are valid */

						string: '', /* the actual header string */

						comments: '', /* comments found in header */

						programtype: 'RGBE', /* listed at beginning of file to identify it after "#?". defaults to "RGBE" */

						format: '', /* RGBE format, default 32-bit_rle_rgbe */

						gamma: 1.0, /* image has already been gamma corrected with given gamma. defaults to 1.0 (no correction) */

						exposure: 1.0, /* a value of 1.0 in an image corresponds to <exposure> watts/steradian/m^2. defaults to 1.0 */

						width: 0, height: 0 /* image dimensions, width/height */

					};

				let line, match;

				if ( buffer.pos >= buffer.byteLength || ! ( line = fgets( buffer ) ) ) {

					rgbe_error( rgbe_read_error, 'no header found' );

				}

				/* if you want to require the magic token then uncomment the next line */
				if ( ! ( match = line.match( magic_token_re ) ) ) {

					rgbe_error( rgbe_format_error, 'bad initial token' );

				}

				header.valid |= RGBE_VALID_PROGRAMTYPE;
				header.programtype = match[ 1 ];
				header.string += line + '\n';

				while ( true ) {

					line = fgets( buffer );
					if ( false === line ) break;
					header.string += line + '\n';

					if ( '#' === line.charAt( 0 ) ) {

						header.comments += line + '\n';
						continue; // comment line

					}

					if ( match = line.match( gamma_re ) ) {

						header.gamma = parseFloat( match[ 1 ] );

					}

					if ( match = line.match( exposure_re ) ) {

						header.exposure = parseFloat( match[ 1 ] );

					}

					if ( match = line.match( format_re ) ) {

						header.valid |= RGBE_VALID_FORMAT;
						header.format = match[ 1 ];//'32-bit_rle_rgbe';

					}

					if ( match = line.match( dimensions_re ) ) {

						header.valid |= RGBE_VALID_DIMENSIONS;
						header.height = parseInt( match[ 1 ], 10 );
						header.width = parseInt( match[ 2 ], 10 );

					}

					if ( ( header.valid & RGBE_VALID_FORMAT ) && ( header.valid & RGBE_VALID_DIMENSIONS ) ) break;

				}

				if ( ! ( header.valid & RGBE_VALID_FORMAT ) ) {

					rgbe_error( rgbe_format_error, 'missing format specifier' );

				}

				if ( ! ( header.valid & RGBE_VALID_DIMENSIONS ) ) {

					rgbe_error( rgbe_format_error, 'missing image size specifier' );

				}

				return header;

			},

			RGBE_ReadPixels_RLE = function ( buffer, w, h ) {

				const scanline_width = w;

				if (
				// run length encoding is not allowed so read flat
					( ( scanline_width < 8 ) || ( scanline_width > 0x7fff ) ) ||
                    // this file is not run length encoded
                    ( ( 2 !== buffer[ 0 ] ) || ( 2 !== buffer[ 1 ] ) || ( buffer[ 2 ] & 0x80 ) )
				) {

					// return the flat buffer
					return new Uint8Array( buffer );

				}

				if ( scanline_width !== ( ( buffer[ 2 ] << 8 ) | buffer[ 3 ] ) ) {

					rgbe_error( rgbe_format_error, 'wrong scanline width' );

				}

				const data_rgba = new Uint8Array( 4 * w * h );

				if ( ! data_rgba.length ) {

					rgbe_error( rgbe_memory_error, 'unable to allocate buffer space' );

				}

				let offset = 0, pos = 0;

				const ptr_end = 4 * scanline_width;
				const rgbeStart = new Uint8Array( 4 );
				const scanline_buffer = new Uint8Array( ptr_end );
				let num_scanlines = h;

				// read in each successive scanline
				while ( ( num_scanlines > 0 ) && ( pos < buffer.byteLength ) ) {

					if ( pos + 4 > buffer.byteLength ) {

						rgbe_error( rgbe_read_error );

					}

					rgbeStart[ 0 ] = buffer[ pos ++ ];
					rgbeStart[ 1 ] = buffer[ pos ++ ];
					rgbeStart[ 2 ] = buffer[ pos ++ ];
					rgbeStart[ 3 ] = buffer[ pos ++ ];

					if ( ( 2 != rgbeStart[ 0 ] ) || ( 2 != rgbeStart[ 1 ] ) || ( ( ( rgbeStart[ 2 ] << 8 ) | rgbeStart[ 3 ] ) != scanline_width ) ) {

						rgbe_error( rgbe_format_error, 'bad rgbe scanline format' );

					}

					// read each of the four channels for the scanline into the buffer
					// first red, then green, then blue, then exponent
					let ptr = 0, count;

					while ( ( ptr < ptr_end ) && ( pos < buffer.byteLength ) ) {

						count = buffer[ pos ++ ];
						const isEncodedRun = count > 128;
						if ( isEncodedRun ) count -= 128;

						if ( ( 0 === count ) || ( ptr + count > ptr_end ) ) {

							rgbe_error( rgbe_format_error, 'bad scanline data' );

						}

						if ( isEncodedRun ) {

							// a (encoded) run of the same value
							const byteValue = buffer[ pos ++ ];
							for ( let i = 0; i < count; i ++ ) {

								scanline_buffer[ ptr ++ ] = byteValue;

							}
							//ptr += count;

						} else {

							// a literal-run
							scanline_buffer.set( buffer.subarray( pos, pos + count ), ptr );
							ptr += count; pos += count;

						}

					}


					// now convert data from buffer into rgba
					// first red, then green, then blue, then exponent (alpha)
					const l = scanline_width; //scanline_buffer.byteLength;
					for ( let i = 0; i < l; i ++ ) {

						let off = 0;
						data_rgba[ offset ] = scanline_buffer[ i + off ];
						off += scanline_width; //1;
						data_rgba[ offset + 1 ] = scanline_buffer[ i + off ];
						off += scanline_width; //1;
						data_rgba[ offset + 2 ] = scanline_buffer[ i + off ];
						off += scanline_width; //1;
						data_rgba[ offset + 3 ] = scanline_buffer[ i + off ];
						offset += 4;

					}

					num_scanlines --;

				}

				return data_rgba;

			};

		const RGBEByteToRGBFloat = function ( sourceArray, sourceOffset, destArray, destOffset ) {

			const e = sourceArray[ sourceOffset + 3 ];
			const scale = Math.pow( 2.0, e - 128.0 ) / 255.0;

			destArray[ destOffset + 0 ] = sourceArray[ sourceOffset + 0 ] * scale;
			destArray[ destOffset + 1 ] = sourceArray[ sourceOffset + 1 ] * scale;
			destArray[ destOffset + 2 ] = sourceArray[ sourceOffset + 2 ] * scale;
			destArray[ destOffset + 3 ] = 1;

		};

		const RGBEByteToRGBHalf = function ( sourceArray, sourceOffset, destArray, destOffset ) {

			const e = sourceArray[ sourceOffset + 3 ];
			const scale = Math.pow( 2.0, e - 128.0 ) / 255.0;

			// clamping to 65504, the maximum representable value in float16
			destArray[ destOffset + 0 ] = DataUtils.toHalfFloat( Math.min( sourceArray[ sourceOffset + 0 ] * scale, 65504 ) );
			destArray[ destOffset + 1 ] = DataUtils.toHalfFloat( Math.min( sourceArray[ sourceOffset + 1 ] * scale, 65504 ) );
			destArray[ destOffset + 2 ] = DataUtils.toHalfFloat( Math.min( sourceArray[ sourceOffset + 2 ] * scale, 65504 ) );
			destArray[ destOffset + 3 ] = DataUtils.toHalfFloat( 1 );

		};

		const byteArray = new Uint8Array( buffer );
		byteArray.pos = 0;
		const rgbe_header_info = RGBE_ReadHeader( byteArray );

		const w = rgbe_header_info.width,
			h = rgbe_header_info.height,
			image_rgba_data = RGBE_ReadPixels_RLE( byteArray.subarray( byteArray.pos ), w, h );


		let data, type;
		let numElements;

		switch ( this.type ) {

			case FloatType:

				numElements = image_rgba_data.length / 4;
				const floatArray = new Float32Array( numElements * 4 );

				for ( let j = 0; j < numElements; j ++ ) {

					RGBEByteToRGBFloat( image_rgba_data, j * 4, floatArray, j * 4 );

				}

				data = floatArray;
				type = FloatType;
				break;

			case HalfFloatType:

				numElements = image_rgba_data.length / 4;
				const halfArray = new Uint16Array( numElements * 4 );

				for ( let j = 0; j < numElements; j ++ ) {

					RGBEByteToRGBHalf( image_rgba_data, j * 4, halfArray, j * 4 );

				}

				data = halfArray;
				type = HalfFloatType;
				break;

			default:

				throw new Error( 'THREE.HDRLoader: Unsupported type: ' + this.type );

		}

		return {
			width: w, height: h,
			data: data,
			header: rgbe_header_info.string,
			gamma: rgbe_header_info.gamma,
			exposure: rgbe_header_info.exposure,
			type: type
		};

	}

	/**
     * Sets the texture type.
     *
     * @param {(HalfFloatType|FloatType)} value - The texture type to set.
     * @return {HDRLoader} A reference to this loader.
     */
	setDataType( value ) {

		this.type = value;
		return this;

	}

	load( url, onLoad, onProgress, onError ) {

		function onLoadCallback( texture, texData ) {

			switch ( texture.type ) {

				case FloatType:
				case HalfFloatType:

					texture.colorSpace = LinearSRGBColorSpace;
					texture.minFilter = LinearFilter;
					texture.magFilter = LinearFilter;
					texture.generateMipmaps = false;
					texture.flipY = true;

					break;

			}

			if ( onLoad ) onLoad( texture, texData );

		}

		return super.load( url, onLoadCallback, onProgress, onError );

	}

}

/*!
fflate - fast JavaScript compression/decompression
<https://101arrowz.github.io/fflate>
Licensed under MIT. https://github.com/101arrowz/fflate/blob/master/LICENSE
version 0.8.2
*/


// aliases for shorter compressed code (most minifers don't do this)
var u8 = Uint8Array, u16 = Uint16Array, i32 = Int32Array;
// fixed length extra bits
var fleb = new u8([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, /* unused */ 0, 0, /* impossible */ 0]);
// fixed distance extra bits
var fdeb = new u8([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, /* unused */ 0, 0]);
// code length index map
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
// get base, reverse index map from extra bits
var freb = function (eb, start) {
    var b = new u16(31);
    for (var i = 0; i < 31; ++i) {
        b[i] = start += 1 << eb[i - 1];
    }
    // numbers here are at max 18 bits
    var r = new i32(b[30]);
    for (var i = 1; i < 30; ++i) {
        for (var j = b[i]; j < b[i + 1]; ++j) {
            r[j] = ((j - b[i]) << 5) | i;
        }
    }
    return { b: b, r: r };
};
var _a = freb(fleb, 2), fl = _a.b, revfl = _a.r;
// we can ignore the fact that the other numbers are wrong; they never happen anyway
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0), fd = _b.b;
// map of value to reverse (assuming 16 bits)
var rev = new u16(32768);
for (var i = 0; i < 32768; ++i) {
    // reverse table algorithm from SO
    var x = ((i & 0xAAAA) >> 1) | ((i & 0x5555) << 1);
    x = ((x & 0xCCCC) >> 2) | ((x & 0x3333) << 2);
    x = ((x & 0xF0F0) >> 4) | ((x & 0x0F0F) << 4);
    rev[i] = (((x & 0xFF00) >> 8) | ((x & 0x00FF) << 8)) >> 1;
}
// create huffman tree from u8 "map": index -> code length for code index
// mb (max bits) must be at most 15
// TODO: optimize/split up?
var hMap = (function (cd, mb, r) {
    var s = cd.length;
    // index
    var i = 0;
    // u16 "map": index -> # of codes with bit length = index
    var l = new u16(mb);
    // length of cd must be 288 (total # of codes)
    for (; i < s; ++i) {
        if (cd[i])
            ++l[cd[i] - 1];
    }
    // u16 "map": index -> minimum code for bit length = index
    var le = new u16(mb);
    for (i = 1; i < mb; ++i) {
        le[i] = (le[i - 1] + l[i - 1]) << 1;
    }
    var co;
    if (r) {
        // u16 "map": index -> number of actual bits, symbol for code
        co = new u16(1 << mb);
        // bits to remove for reverser
        var rvb = 15 - mb;
        for (i = 0; i < s; ++i) {
            // ignore 0 lengths
            if (cd[i]) {
                // num encoding both symbol and bits read
                var sv = (i << 4) | cd[i];
                // free bits
                var r_1 = mb - cd[i];
                // start value
                var v = le[cd[i] - 1]++ << r_1;
                // m is end value
                for (var m = v | ((1 << r_1) - 1); v <= m; ++v) {
                    // every 16 bit value starting with the code yields the same result
                    co[rev[v] >> rvb] = sv;
                }
            }
        }
    }
    else {
        co = new u16(s);
        for (i = 0; i < s; ++i) {
            if (cd[i]) {
                co[i] = rev[le[cd[i] - 1]++] >> (15 - cd[i]);
            }
        }
    }
    return co;
});
// fixed length tree
var flt = new u8(288);
for (var i = 0; i < 144; ++i)
    flt[i] = 8;
for (var i = 144; i < 256; ++i)
    flt[i] = 9;
for (var i = 256; i < 280; ++i)
    flt[i] = 7;
for (var i = 280; i < 288; ++i)
    flt[i] = 8;
// fixed distance tree
var fdt = new u8(32);
for (var i = 0; i < 32; ++i)
    fdt[i] = 5;
// fixed length map
var flrm = /*#__PURE__*/ hMap(flt, 9, 1);
// fixed distance map
var fdrm = /*#__PURE__*/ hMap(fdt, 5, 1);
// find max of array
var max = function (a) {
    var m = a[0];
    for (var i = 1; i < a.length; ++i) {
        if (a[i] > m)
            m = a[i];
    }
    return m;
};
// read d, starting at bit p and mask with m
var bits = function (d, p, m) {
    var o = (p / 8) | 0;
    return ((d[o] | (d[o + 1] << 8)) >> (p & 7)) & m;
};
// read d, starting at bit p continuing for at least 16 bits
var bits16 = function (d, p) {
    var o = (p / 8) | 0;
    return ((d[o] | (d[o + 1] << 8) | (d[o + 2] << 16)) >> (p & 7));
};
// get end of byte
var shft = function (p) { return ((p + 7) / 8) | 0; };
// typed array slice - allows garbage collector to free original reference,
// while being more compatible than .slice
var slc = function (v, s, e) {
    if (e == null || e > v.length)
        e = v.length;
    // can't use .constructor in case user-supplied
    return new u8(v.subarray(s, e));
};
// error codes
var ec = [
    'unexpected EOF',
    'invalid block type',
    'invalid length/literal',
    'invalid distance',
    'stream finished',
    'no stream handler',
    ,
    'no callback',
    'invalid UTF-8 data',
    'extra field too long',
    'date not in range 1980-2099',
    'filename too long',
    'stream finishing',
    'invalid zip data'
    // determined by unknown compression method
];
var err = function (ind, msg, nt) {
    var e = new Error(msg || ec[ind]);
    e.code = ind;
    if (Error.captureStackTrace)
        Error.captureStackTrace(e, err);
    if (!nt)
        throw e;
    return e;
};
// expands raw DEFLATE data
var inflt = function (dat, st, buf, dict) {
    // source length       dict length
    var sl = dat.length, dl = 0;
    if (!sl || st.f && !st.l)
        return buf || new u8(0);
    var noBuf = !buf;
    // have to estimate size
    var resize = noBuf || st.i != 2;
    // no state
    var noSt = st.i;
    // Assumes roughly 33% compression ratio average
    if (noBuf)
        buf = new u8(sl * 3);
    // ensure buffer can fit at least l elements
    var cbuf = function (l) {
        var bl = buf.length;
        // need to increase size to fit
        if (l > bl) {
            // Double or set to necessary, whichever is greater
            var nbuf = new u8(Math.max(bl * 2, l));
            nbuf.set(buf);
            buf = nbuf;
        }
    };
    //  last chunk         bitpos           bytes
    var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
    // total bits
    var tbts = sl * 8;
    do {
        if (!lm) {
            // BFINAL - this is only 1 when last chunk is next
            final = bits(dat, pos, 1);
            // type: 0 = no compression, 1 = fixed huffman, 2 = dynamic huffman
            var type = bits(dat, pos + 1, 3);
            pos += 3;
            if (!type) {
                // go to end of byte boundary
                var s = shft(pos) + 4, l = dat[s - 4] | (dat[s - 3] << 8), t = s + l;
                if (t > sl) {
                    if (noSt)
                        err(0);
                    break;
                }
                // ensure size
                if (resize)
                    cbuf(bt + l);
                // Copy over uncompressed data
                buf.set(dat.subarray(s, t), bt);
                // Get new bitpos, update byte count
                st.b = bt += l, st.p = pos = t * 8, st.f = final;
                continue;
            }
            else if (type == 1)
                lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
            else if (type == 2) {
                //  literal                            lengths
                var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
                var tl = hLit + bits(dat, pos + 5, 31) + 1;
                pos += 14;
                // length+distance tree
                var ldt = new u8(tl);
                // code length tree
                var clt = new u8(19);
                for (var i = 0; i < hcLen; ++i) {
                    // use index map to get real code
                    clt[clim[i]] = bits(dat, pos + i * 3, 7);
                }
                pos += hcLen * 3;
                // code lengths bits
                var clb = max(clt), clbmsk = (1 << clb) - 1;
                // code lengths map
                var clm = hMap(clt, clb, 1);
                for (var i = 0; i < tl;) {
                    var r = clm[bits(dat, pos, clbmsk)];
                    // bits read
                    pos += r & 15;
                    // symbol
                    var s = r >> 4;
                    // code length to copy
                    if (s < 16) {
                        ldt[i++] = s;
                    }
                    else {
                        //  copy   count
                        var c = 0, n = 0;
                        if (s == 16)
                            n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
                        else if (s == 17)
                            n = 3 + bits(dat, pos, 7), pos += 3;
                        else if (s == 18)
                            n = 11 + bits(dat, pos, 127), pos += 7;
                        while (n--)
                            ldt[i++] = c;
                    }
                }
                //    length tree                 distance tree
                var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
                // max length bits
                lbt = max(lt);
                // max dist bits
                dbt = max(dt);
                lm = hMap(lt, lbt, 1);
                dm = hMap(dt, dbt, 1);
            }
            else
                err(1);
            if (pos > tbts) {
                if (noSt)
                    err(0);
                break;
            }
        }
        // Make sure the buffer can hold this + the largest possible addition
        // Maximum chunk size (practically, theoretically infinite) is 2^17
        if (resize)
            cbuf(bt + 131072);
        var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
        var lpos = pos;
        for (;; lpos = pos) {
            // bits read, code
            var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
            pos += c & 15;
            if (pos > tbts) {
                if (noSt)
                    err(0);
                break;
            }
            if (!c)
                err(2);
            if (sym < 256)
                buf[bt++] = sym;
            else if (sym == 256) {
                lpos = pos, lm = null;
                break;
            }
            else {
                var add = sym - 254;
                // no extra bits needed if less
                if (sym > 264) {
                    // index
                    var i = sym - 257, b = fleb[i];
                    add = bits(dat, pos, (1 << b) - 1) + fl[i];
                    pos += b;
                }
                // dist
                var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
                if (!d)
                    err(3);
                pos += d & 15;
                var dt = fd[dsym];
                if (dsym > 3) {
                    var b = fdeb[dsym];
                    dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
                }
                if (pos > tbts) {
                    if (noSt)
                        err(0);
                    break;
                }
                if (resize)
                    cbuf(bt + 131072);
                var end = bt + add;
                if (bt < dt) {
                    var shift = dl - dt, dend = Math.min(dt, end);
                    if (shift + bt < 0)
                        err(3);
                    for (; bt < dend; ++bt)
                        buf[bt] = dict[shift + bt];
                }
                for (; bt < end; ++bt)
                    buf[bt] = buf[bt - dt];
            }
        }
        st.l = lm, st.p = lpos, st.b = bt, st.f = final;
        if (lm)
            final = 1, st.m = lbt, st.d = dm, st.n = dbt;
    } while (!final);
    // don't reallocate for streams or user buffers
    return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
// empty
var et = /*#__PURE__*/ new u8(0);
// zlib start
var zls = function (d, dict) {
    if ((d[0] & 15) != 8 || (d[0] >> 4) > 7 || ((d[0] << 8 | d[1]) % 31))
        err(6, 'invalid zlib data');
    if ((d[1] >> 5 & 1) == 1)
        err(6, 'invalid zlib data: ' + (d[1] & 32 ? 'need' : 'unexpected') + ' dictionary');
    return (d[1] >> 3 & 4) + 2;
};
/**
 * Expands Zlib data
 * @param data The data to decompress
 * @param opts The decompression options
 * @returns The decompressed version of the data
 */
function unzlibSync(data, opts) {
    return inflt(data.subarray(zls(data), -4), { i: 2 }, opts, opts);
}
// text decoder
var td = typeof TextDecoder != 'undefined' && /*#__PURE__*/ new TextDecoder();
// text decoder stream
var tds = 0;
try {
    td.decode(et, { stream: true });
    tds = 1;
}
catch (e) { }

// Referred to the original Industrial Light & Magic OpenEXR implementation and the TinyEXR / Syoyo Fujita
// implementation, so I have preserved their copyright notices.

// /*
// Copyright (c) 2014 - 2017, Syoyo Fujita
// All rights reserved.

// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Syoyo Fujita nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.

// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
// DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
// */

// // TinyEXR contains some OpenEXR code, which is licensed under ------------

// ///////////////////////////////////////////////////////////////////////////
// //
// // Copyright (c) 2002, Industrial Light & Magic, a division of Lucas
// // Digital Ltd. LLC
// //
// // All rights reserved.
// //
// // Redistribution and use in source and binary forms, with or without
// // modification, are permitted provided that the following conditions are
// // met:
// // *       Redistributions of source code must retain the above copyright
// // notice, this list of conditions and the following disclaimer.
// // *       Redistributions in binary form must reproduce the above
// // copyright notice, this list of conditions and the following disclaimer
// // in the documentation and/or other materials provided with the
// // distribution.
// // *       Neither the name of Industrial Light & Magic nor the names of
// // its contributors may be used to endorse or promote products derived
// // from this software without specific prior written permission.
// //
// // THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// // "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// // LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// // A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// // OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// // SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// // LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// // DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// // THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// // (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// // OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
// //
// ///////////////////////////////////////////////////////////////////////////

// // End of OpenEXR license -------------------------------------------------


/**
 * A loader for the OpenEXR texture format.
 *
 * `EXRLoader` currently supports uncompressed, ZIP(S), RLE, PIZ and DWA/B compression.
 * Supports reading as UnsignedByte, HalfFloat and Float type data texture.
 *
 * ```js
 * const loader = new EXRLoader();
 * const texture = await loader.loadAsync( 'textures/memorial.exr' );
 * ```
 *
 * @augments DataTextureLoader
 * @three_import import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
 */
class EXRLoader extends DataTextureLoader {

	/**
	 * Constructs a new EXR loader.
	 *
	 * @param {LoadingManager} [manager] - The loading manager.
	 */
	constructor( manager ) {

		super( manager );

		/**
		 * The texture type.
		 *
		 * @type {(HalfFloatType|FloatType)}
		 * @default HalfFloatType
		 */
		this.type = HalfFloatType;

		/**
		 * Texture output format.
		 *
		 * @type {(RGBAFormat|RGFormat|RedFormat)}
		 * @default RGBAFormat
		 */
		this.outputFormat = RGBAFormat;

	}

	/**
	 * Parses the given EXR texture data.
	 *
	 * @param {ArrayBuffer} buffer - The raw texture data.
	 * @return {DataTextureLoader~TexData} An object representing the parsed texture data.
	 */
	parse( buffer ) {

		const USHORT_RANGE = ( 1 << 16 );
		const BITMAP_SIZE = ( USHORT_RANGE >> 3 );

		const HUF_ENCBITS = 16; // literal (value) bit length
		const HUF_DECBITS = 14; // decoding bit size (>= 8)

		const HUF_ENCSIZE = ( 1 << HUF_ENCBITS ) + 1; // encoding table size
		const HUF_DECSIZE = 1 << HUF_DECBITS; // decoding table size
		const HUF_DECMASK = HUF_DECSIZE - 1;

		const NBITS = 16;
		const A_OFFSET = 1 << ( NBITS - 1 );
		const MOD_MASK = ( 1 << NBITS ) - 1;

		const SHORT_ZEROCODE_RUN = 59;
		const LONG_ZEROCODE_RUN = 63;
		const SHORTEST_LONG_RUN = 2 + LONG_ZEROCODE_RUN - SHORT_ZEROCODE_RUN;

		const ULONG_SIZE = 8;
		const FLOAT32_SIZE = 4;
		const INT32_SIZE = 4;
		const INT16_SIZE = 2;
		const INT8_SIZE = 1;

		const STATIC_HUFFMAN = 0;
		const DEFLATE = 1;

		const UNKNOWN = 0;
		const LOSSY_DCT = 1;
		const RLE = 2;

		const logBase = Math.pow( 2.7182818, 2.2 );

		function reverseLutFromBitmap( bitmap, lut ) {

			let k = 0;

			for ( let i = 0; i < USHORT_RANGE; ++ i ) {

				if ( ( i == 0 ) || ( bitmap[ i >> 3 ] & ( 1 << ( i & 7 ) ) ) ) {

					lut[ k ++ ] = i;

				}

			}

			const n = k - 1;

			while ( k < USHORT_RANGE ) lut[ k ++ ] = 0;

			return n;

		}

		function hufClearDecTable( hdec ) {

			for ( let i = 0; i < HUF_DECSIZE; i ++ ) {

				hdec[ i ] = {};
				hdec[ i ].len = 0;
				hdec[ i ].lit = 0;
				hdec[ i ].p = null;

			}

		}

		const getBitsReturn = { l: 0, c: 0, lc: 0 };

		function getBits( nBits, c, lc, uInt8Array, inOffset ) {

			while ( lc < nBits ) {

				c = ( c << 8 ) | parseUint8Array( uInt8Array, inOffset );
				lc += 8;

			}

			lc -= nBits;

			getBitsReturn.l = ( c >> lc ) & ( ( 1 << nBits ) - 1 );
			getBitsReturn.c = c;
			getBitsReturn.lc = lc;

		}

		const hufTableBuffer = new Array( 59 );

		function hufCanonicalCodeTable( hcode ) {

			for ( let i = 0; i <= 58; ++ i ) hufTableBuffer[ i ] = 0;
			for ( let i = 0; i < HUF_ENCSIZE; ++ i ) hufTableBuffer[ hcode[ i ] ] += 1;

			let c = 0;

			for ( let i = 58; i > 0; -- i ) {

				const nc = ( ( c + hufTableBuffer[ i ] ) >> 1 );
				hufTableBuffer[ i ] = c;
				c = nc;

			}

			for ( let i = 0; i < HUF_ENCSIZE; ++ i ) {

				const l = hcode[ i ];
				if ( l > 0 ) hcode[ i ] = l | ( hufTableBuffer[ l ] ++ << 6 );

			}

		}

		function hufUnpackEncTable( uInt8Array, inOffset, ni, im, iM, hcode ) {

			const p = inOffset;
			let c = 0;
			let lc = 0;

			for ( ; im <= iM; im ++ ) {

				if ( p.value - inOffset.value > ni ) return false;

				getBits( 6, c, lc, uInt8Array, p );

				const l = getBitsReturn.l;
				c = getBitsReturn.c;
				lc = getBitsReturn.lc;

				hcode[ im ] = l;

				if ( l == LONG_ZEROCODE_RUN ) {

					if ( p.value - inOffset.value > ni ) {

						throw new Error( 'Something wrong with hufUnpackEncTable' );

					}

					getBits( 8, c, lc, uInt8Array, p );

					let zerun = getBitsReturn.l + SHORTEST_LONG_RUN;
					c = getBitsReturn.c;
					lc = getBitsReturn.lc;

					if ( im + zerun > iM + 1 ) {

						throw new Error( 'Something wrong with hufUnpackEncTable' );

					}

					while ( zerun -- ) hcode[ im ++ ] = 0;

					im --;

				} else if ( l >= SHORT_ZEROCODE_RUN ) {

					let zerun = l - SHORT_ZEROCODE_RUN + 2;

					if ( im + zerun > iM + 1 ) {

						throw new Error( 'Something wrong with hufUnpackEncTable' );

					}

					while ( zerun -- ) hcode[ im ++ ] = 0;

					im --;

				}

			}

			hufCanonicalCodeTable( hcode );

		}

		function hufLength( code ) {

			return code & 63;

		}

		function hufCode( code ) {

			return code >> 6;

		}

		function hufBuildDecTable( hcode, im, iM, hdecod ) {

			for ( ; im <= iM; im ++ ) {

				const c = hufCode( hcode[ im ] );
				const l = hufLength( hcode[ im ] );

				if ( c >> l ) {

					throw new Error( 'Invalid table entry' );

				}

				if ( l > HUF_DECBITS ) {

					const pl = hdecod[ ( c >> ( l - HUF_DECBITS ) ) ];

					if ( pl.len ) {

						throw new Error( 'Invalid table entry' );

					}

					pl.lit ++;

					if ( pl.p ) {

						const p = pl.p;
						pl.p = new Array( pl.lit );

						for ( let i = 0; i < pl.lit - 1; ++ i ) {

							pl.p[ i ] = p[ i ];

						}

					} else {

						pl.p = new Array( 1 );

					}

					pl.p[ pl.lit - 1 ] = im;

				} else if ( l ) {

					let plOffset = 0;

					for ( let i = 1 << ( HUF_DECBITS - l ); i > 0; i -- ) {

						const pl = hdecod[ ( c << ( HUF_DECBITS - l ) ) + plOffset ];

						if ( pl.len || pl.p ) {

							throw new Error( 'Invalid table entry' );

						}

						pl.len = l;
						pl.lit = im;

						plOffset ++;

					}

				}

			}

			return true;

		}

		const getCharReturn = { c: 0, lc: 0 };

		function getChar( c, lc, uInt8Array, inOffset ) {

			c = ( c << 8 ) | parseUint8Array( uInt8Array, inOffset );
			lc += 8;

			getCharReturn.c = c;
			getCharReturn.lc = lc;

		}

		const getCodeReturn = { c: 0, lc: 0 };

		function getCode( po, rlc, c, lc, uInt8Array, inOffset, outBuffer, outBufferOffset, outBufferEndOffset ) {

			if ( po == rlc ) {

				if ( lc < 8 ) {

					getChar( c, lc, uInt8Array, inOffset );
					c = getCharReturn.c;
					lc = getCharReturn.lc;

				}

				lc -= 8;

				let cs = ( c >> lc );
				cs = new Uint8Array( [ cs ] )[ 0 ];

				if ( outBufferOffset.value + cs > outBufferEndOffset ) {

					return false;

				}

				const s = outBuffer[ outBufferOffset.value - 1 ];

				while ( cs -- > 0 ) {

					outBuffer[ outBufferOffset.value ++ ] = s;

				}

			} else if ( outBufferOffset.value < outBufferEndOffset ) {

				outBuffer[ outBufferOffset.value ++ ] = po;

			} else {

				return false;

			}

			getCodeReturn.c = c;
			getCodeReturn.lc = lc;

		}

		function UInt16( value ) {

			return ( value & 0xFFFF );

		}

		function Int16( value ) {

			const ref = UInt16( value );
			return ( ref > 0x7FFF ) ? ref - 0x10000 : ref;

		}

		const wdec14Return = { a: 0, b: 0 };

		function wdec14( l, h ) {

			const ls = Int16( l );
			const hs = Int16( h );

			const hi = hs;
			const ai = ls + ( hi & 1 ) + ( hi >> 1 );

			const as = ai;
			const bs = ai - hi;

			wdec14Return.a = as;
			wdec14Return.b = bs;

		}

		function wdec16( l, h ) {

			const m = UInt16( l );
			const d = UInt16( h );

			const bb = ( m - ( d >> 1 ) ) & MOD_MASK;
			const aa = ( d + bb - A_OFFSET ) & MOD_MASK;

			wdec14Return.a = aa;
			wdec14Return.b = bb;

		}

		function wav2Decode( buffer, j, nx, ox, ny, oy, mx ) {

			const w14 = mx < ( 1 << 14 );
			const n = ( nx > ny ) ? ny : nx;
			let p = 1;
			let p2;
			let py;

			while ( p <= n ) p <<= 1;

			p >>= 1;
			p2 = p;
			p >>= 1;

			while ( p >= 1 ) {

				py = 0;
				const ey = py + oy * ( ny - p2 );
				const oy1 = oy * p;
				const oy2 = oy * p2;
				const ox1 = ox * p;
				const ox2 = ox * p2;
				let i00, i01, i10, i11;

				for ( ; py <= ey; py += oy2 ) {

					let px = py;
					const ex = py + ox * ( nx - p2 );

					for ( ; px <= ex; px += ox2 ) {

						const p01 = px + ox1;
						const p10 = px + oy1;
						const p11 = p10 + ox1;

						if ( w14 ) {

							wdec14( buffer[ px + j ], buffer[ p10 + j ] );

							i00 = wdec14Return.a;
							i10 = wdec14Return.b;

							wdec14( buffer[ p01 + j ], buffer[ p11 + j ] );

							i01 = wdec14Return.a;
							i11 = wdec14Return.b;

							wdec14( i00, i01 );

							buffer[ px + j ] = wdec14Return.a;
							buffer[ p01 + j ] = wdec14Return.b;

							wdec14( i10, i11 );

							buffer[ p10 + j ] = wdec14Return.a;
							buffer[ p11 + j ] = wdec14Return.b;

						} else {

							wdec16( buffer[ px + j ], buffer[ p10 + j ] );

							i00 = wdec14Return.a;
							i10 = wdec14Return.b;

							wdec16( buffer[ p01 + j ], buffer[ p11 + j ] );

							i01 = wdec14Return.a;
							i11 = wdec14Return.b;

							wdec16( i00, i01 );

							buffer[ px + j ] = wdec14Return.a;
							buffer[ p01 + j ] = wdec14Return.b;

							wdec16( i10, i11 );

							buffer[ p10 + j ] = wdec14Return.a;
							buffer[ p11 + j ] = wdec14Return.b;


						}

					}

					if ( nx & p ) {

						const p10 = px + oy1;

						if ( w14 )
							wdec14( buffer[ px + j ], buffer[ p10 + j ] );
						else
							wdec16( buffer[ px + j ], buffer[ p10 + j ] );

						i00 = wdec14Return.a;
						buffer[ p10 + j ] = wdec14Return.b;

						buffer[ px + j ] = i00;

					}

				}

				if ( ny & p ) {

					let px = py;
					const ex = py + ox * ( nx - p2 );

					for ( ; px <= ex; px += ox2 ) {

						const p01 = px + ox1;

						if ( w14 )
							wdec14( buffer[ px + j ], buffer[ p01 + j ] );
						else
							wdec16( buffer[ px + j ], buffer[ p01 + j ] );

						i00 = wdec14Return.a;
						buffer[ p01 + j ] = wdec14Return.b;

						buffer[ px + j ] = i00;

					}

				}

				p2 = p;
				p >>= 1;

			}

			return py;

		}

		function hufDecode( encodingTable, decodingTable, uInt8Array, inOffset, ni, rlc, no, outBuffer, outOffset ) {

			let c = 0;
			let lc = 0;
			const outBufferEndOffset = no;
			const inOffsetEnd = Math.trunc( inOffset.value + ( ni + 7 ) / 8 );

			while ( inOffset.value < inOffsetEnd ) {

				getChar( c, lc, uInt8Array, inOffset );

				c = getCharReturn.c;
				lc = getCharReturn.lc;

				while ( lc >= HUF_DECBITS ) {

					const index = ( c >> ( lc - HUF_DECBITS ) ) & HUF_DECMASK;
					const pl = decodingTable[ index ];

					if ( pl.len ) {

						lc -= pl.len;

						getCode( pl.lit, rlc, c, lc, uInt8Array, inOffset, outBuffer, outOffset, outBufferEndOffset );

						c = getCodeReturn.c;
						lc = getCodeReturn.lc;

					} else {

						if ( ! pl.p ) {

							throw new Error( 'hufDecode issues' );

						}

						let j;

						for ( j = 0; j < pl.lit; j ++ ) {

							const l = hufLength( encodingTable[ pl.p[ j ] ] );

							while ( lc < l && inOffset.value < inOffsetEnd ) {

								getChar( c, lc, uInt8Array, inOffset );

								c = getCharReturn.c;
								lc = getCharReturn.lc;

							}

							if ( lc >= l ) {

								if ( hufCode( encodingTable[ pl.p[ j ] ] ) == ( ( c >> ( lc - l ) ) & ( ( 1 << l ) - 1 ) ) ) {

									lc -= l;

									getCode( pl.p[ j ], rlc, c, lc, uInt8Array, inOffset, outBuffer, outOffset, outBufferEndOffset );

									c = getCodeReturn.c;
									lc = getCodeReturn.lc;

									break;

								}

							}

						}

						if ( j == pl.lit ) {

							throw new Error( 'hufDecode issues' );

						}

					}

				}

			}

			const i = ( 8 - ni ) & 7;

			c >>= i;
			lc -= i;

			while ( lc > 0 ) {

				const pl = decodingTable[ ( c << ( HUF_DECBITS - lc ) ) & HUF_DECMASK ];

				if ( pl.len ) {

					lc -= pl.len;

					getCode( pl.lit, rlc, c, lc, uInt8Array, inOffset, outBuffer, outOffset, outBufferEndOffset );

					c = getCodeReturn.c;
					lc = getCodeReturn.lc;

				} else {

					throw new Error( 'hufDecode issues' );

				}

			}

			return true;

		}

		function hufUncompress( uInt8Array, inDataView, inOffset, nCompressed, outBuffer, nRaw ) {

			const outOffset = { value: 0 };
			const initialInOffset = inOffset.value;

			const im = parseUint32( inDataView, inOffset );
			const iM = parseUint32( inDataView, inOffset );

			inOffset.value += 4;

			const nBits = parseUint32( inDataView, inOffset );

			inOffset.value += 4;

			if ( im < 0 || im >= HUF_ENCSIZE || iM < 0 || iM >= HUF_ENCSIZE ) {

				throw new Error( 'Something wrong with HUF_ENCSIZE' );

			}

			const freq = new Array( HUF_ENCSIZE );
			const hdec = new Array( HUF_DECSIZE );

			hufClearDecTable( hdec );

			const ni = nCompressed - ( inOffset.value - initialInOffset );

			hufUnpackEncTable( uInt8Array, inOffset, ni, im, iM, freq );

			if ( nBits > 8 * ( nCompressed - ( inOffset.value - initialInOffset ) ) ) {

				throw new Error( 'Something wrong with hufUncompress' );

			}

			hufBuildDecTable( freq, im, iM, hdec );

			hufDecode( freq, hdec, uInt8Array, inOffset, nBits, iM, nRaw, outBuffer, outOffset );

		}

		function applyLut( lut, data, nData ) {

			for ( let i = 0; i < nData; ++ i ) {

				data[ i ] = lut[ data[ i ] ];

			}

		}

		function predictor( source ) {

			for ( let t = 1; t < source.length; t ++ ) {

				const d = source[ t - 1 ] + source[ t ] - 128;
				source[ t ] = d;

			}

		}

		function interleaveScalar( source, out ) {

			let t1 = 0;
			let t2 = Math.floor( ( source.length + 1 ) / 2 );
			let s = 0;
			const stop = source.length - 1;

			while ( true ) {

				if ( s > stop ) break;
				out[ s ++ ] = source[ t1 ++ ];

				if ( s > stop ) break;
				out[ s ++ ] = source[ t2 ++ ];

			}

		}

		function decodeRunLength( source ) {

			let size = source.byteLength;
			const out = new Array();
			let p = 0;

			const reader = new DataView( source );

			while ( size > 0 ) {

				const l = reader.getInt8( p ++ );

				if ( l < 0 ) {

					const count = - l;
					size -= count + 1;

					for ( let i = 0; i < count; i ++ ) {

						out.push( reader.getUint8( p ++ ) );

					}


				} else {

					const count = l;
					size -= 2;

					const value = reader.getUint8( p ++ );

					for ( let i = 0; i < count + 1; i ++ ) {

						out.push( value );

					}

				}

			}

			return out;

		}

		function lossyDctDecode( cscSet, rowPtrs, channelData, acBuffer, dcBuffer, outBuffer ) {

			let dataView = new DataView( outBuffer.buffer );

			const width = channelData[ cscSet.idx[ 0 ] ].width;
			const height = channelData[ cscSet.idx[ 0 ] ].height;

			const numComp = 3;

			const numFullBlocksX = Math.floor( width / 8.0 );
			const numBlocksX = Math.ceil( width / 8.0 );
			const numBlocksY = Math.ceil( height / 8.0 );
			const leftoverX = width - ( numBlocksX - 1 ) * 8;
			const leftoverY = height - ( numBlocksY - 1 ) * 8;

			const currAcComp = { value: 0 };
			const currDcComp = new Array( numComp );
			const dctData = new Array( numComp );
			const halfZigBlock = new Array( numComp );
			const rowBlock = new Array( numComp );
			const rowOffsets = new Array( numComp );

			for ( let comp = 0; comp < numComp; ++ comp ) {

				rowOffsets[ comp ] = rowPtrs[ cscSet.idx[ comp ] ];
				currDcComp[ comp ] = ( comp < 1 ) ? 0 : currDcComp[ comp - 1 ] + numBlocksX * numBlocksY;
				dctData[ comp ] = new Float32Array( 64 );
				halfZigBlock[ comp ] = new Uint16Array( 64 );
				rowBlock[ comp ] = new Uint16Array( numBlocksX * 64 );

			}

			for ( let blocky = 0; blocky < numBlocksY; ++ blocky ) {

				let maxY = 8;

				if ( blocky == numBlocksY - 1 )
					maxY = leftoverY;

				let maxX = 8;

				for ( let blockx = 0; blockx < numBlocksX; ++ blockx ) {

					if ( blockx == numBlocksX - 1 )
						maxX = leftoverX;

					for ( let comp = 0; comp < numComp; ++ comp ) {

						halfZigBlock[ comp ].fill( 0 );

						// set block DC component
						halfZigBlock[ comp ][ 0 ] = dcBuffer[ currDcComp[ comp ] ++ ];
						// set block AC components
						unRleAC( currAcComp, acBuffer, halfZigBlock[ comp ] );

						// UnZigZag block to float
						unZigZag( halfZigBlock[ comp ], dctData[ comp ] );
						// decode float dct
						dctInverse( dctData[ comp ] );

					}

					{

						csc709Inverse( dctData );

					}

					for ( let comp = 0; comp < numComp; ++ comp ) {

						convertToHalf( dctData[ comp ], rowBlock[ comp ], blockx * 64 );

					}

				} // blockx

				let offset = 0;

				for ( let comp = 0; comp < numComp; ++ comp ) {

					const type = channelData[ cscSet.idx[ comp ] ].type;

					for ( let y = 8 * blocky; y < 8 * blocky + maxY; ++ y ) {

						offset = rowOffsets[ comp ][ y ];

						for ( let blockx = 0; blockx < numFullBlocksX; ++ blockx ) {

							const src = blockx * 64 + ( ( y & 0x7 ) * 8 );

							dataView.setUint16( offset + 0 * INT16_SIZE * type, rowBlock[ comp ][ src + 0 ], true );
							dataView.setUint16( offset + 1 * INT16_SIZE * type, rowBlock[ comp ][ src + 1 ], true );
							dataView.setUint16( offset + 2 * INT16_SIZE * type, rowBlock[ comp ][ src + 2 ], true );
							dataView.setUint16( offset + 3 * INT16_SIZE * type, rowBlock[ comp ][ src + 3 ], true );

							dataView.setUint16( offset + 4 * INT16_SIZE * type, rowBlock[ comp ][ src + 4 ], true );
							dataView.setUint16( offset + 5 * INT16_SIZE * type, rowBlock[ comp ][ src + 5 ], true );
							dataView.setUint16( offset + 6 * INT16_SIZE * type, rowBlock[ comp ][ src + 6 ], true );
							dataView.setUint16( offset + 7 * INT16_SIZE * type, rowBlock[ comp ][ src + 7 ], true );

							offset += 8 * INT16_SIZE * type;

						}

					}

					// handle partial X blocks
					if ( numFullBlocksX != numBlocksX ) {

						for ( let y = 8 * blocky; y < 8 * blocky + maxY; ++ y ) {

							const offset = rowOffsets[ comp ][ y ] + 8 * numFullBlocksX * INT16_SIZE * type;
							const src = numFullBlocksX * 64 + ( ( y & 0x7 ) * 8 );

							for ( let x = 0; x < maxX; ++ x ) {

								dataView.setUint16( offset + x * INT16_SIZE * type, rowBlock[ comp ][ src + x ], true );

							}

						}

					}

				} // comp

			} // blocky

			const halfRow = new Uint16Array( width );
			dataView = new DataView( outBuffer.buffer );

			// convert channels back to float, if needed
			for ( let comp = 0; comp < numComp; ++ comp ) {

				channelData[ cscSet.idx[ comp ] ].decoded = true;
				const type = channelData[ cscSet.idx[ comp ] ].type;

				if ( channelData[ comp ].type != 2 ) continue;

				for ( let y = 0; y < height; ++ y ) {

					const offset = rowOffsets[ comp ][ y ];

					for ( let x = 0; x < width; ++ x ) {

						halfRow[ x ] = dataView.getUint16( offset + x * INT16_SIZE * type, true );

					}

					for ( let x = 0; x < width; ++ x ) {

						dataView.setFloat32( offset + x * INT16_SIZE * type, decodeFloat16( halfRow[ x ] ), true );

					}

				}

			}

		}

		function lossyDctChannelDecode( channelIndex, rowPtrs, channelData, acBuffer, dcBuffer, outBuffer ) {

			const dataView = new DataView( outBuffer.buffer );
			const cd = channelData[ channelIndex ];
			const width = cd.width;
			const height = cd.height;

			const numBlocksX = Math.ceil( width / 8.0 );
			const numBlocksY = Math.ceil( height / 8.0 );
			const numFullBlocksX = Math.floor( width / 8.0 );
			const leftoverX = width - ( numBlocksX - 1 ) * 8;
			const leftoverY = height - ( numBlocksY - 1 ) * 8;

			const currAcComp = { value: 0 };
			let currDcComp = 0;
			const dctData = new Float32Array( 64 );
			const halfZigBlock = new Uint16Array( 64 );
			const rowBlock = new Uint16Array( numBlocksX * 64 );

			for ( let blocky = 0; blocky < numBlocksY; ++ blocky ) {

				let maxY = 8;

				if ( blocky == numBlocksY - 1 ) maxY = leftoverY;

				for ( let blockx = 0; blockx < numBlocksX; ++ blockx ) {

					halfZigBlock.fill( 0 );
					halfZigBlock[ 0 ] = dcBuffer[ currDcComp ++ ];
					unRleAC( currAcComp, acBuffer, halfZigBlock );
					unZigZag( halfZigBlock, dctData );
					dctInverse( dctData );
					convertToHalf( dctData, rowBlock, blockx * 64 );

				}

				// Write decoded data to output buffer
				for ( let y = 8 * blocky; y < 8 * blocky + maxY; ++ y ) {

					let offset = rowPtrs[ channelIndex ][ y ];

					for ( let blockx = 0; blockx < numFullBlocksX; ++ blockx ) {

						const src = blockx * 64 + ( ( y & 0x7 ) * 8 );

						for ( let x = 0; x < 8; ++ x ) {

							dataView.setUint16( offset + x * INT16_SIZE * cd.type, rowBlock[ src + x ], true );

						}

						offset += 8 * INT16_SIZE * cd.type;

					}

					if ( numBlocksX != numFullBlocksX ) {

						const src = numFullBlocksX * 64 + ( ( y & 0x7 ) * 8 );

						for ( let x = 0; x < leftoverX; ++ x ) {

							dataView.setUint16( offset + x * INT16_SIZE * cd.type, rowBlock[ src + x ], true );

						}

					}

				}

			}

			cd.decoded = true;

		}

		function unRleAC( currAcComp, acBuffer, halfZigBlock ) {

			let acValue;
			let dctComp = 1;

			while ( dctComp < 64 ) {

				acValue = acBuffer[ currAcComp.value ];

				if ( acValue == 0xff00 ) {

					dctComp = 64;

				} else if ( acValue >> 8 == 0xff ) {

					dctComp += acValue & 0xff;

				} else {

					halfZigBlock[ dctComp ] = acValue;
					dctComp ++;

				}

				currAcComp.value ++;

			}

		}

		function unZigZag( src, dst ) {

			dst[ 0 ] = decodeFloat16( src[ 0 ] );
			dst[ 1 ] = decodeFloat16( src[ 1 ] );
			dst[ 2 ] = decodeFloat16( src[ 5 ] );
			dst[ 3 ] = decodeFloat16( src[ 6 ] );
			dst[ 4 ] = decodeFloat16( src[ 14 ] );
			dst[ 5 ] = decodeFloat16( src[ 15 ] );
			dst[ 6 ] = decodeFloat16( src[ 27 ] );
			dst[ 7 ] = decodeFloat16( src[ 28 ] );
			dst[ 8 ] = decodeFloat16( src[ 2 ] );
			dst[ 9 ] = decodeFloat16( src[ 4 ] );

			dst[ 10 ] = decodeFloat16( src[ 7 ] );
			dst[ 11 ] = decodeFloat16( src[ 13 ] );
			dst[ 12 ] = decodeFloat16( src[ 16 ] );
			dst[ 13 ] = decodeFloat16( src[ 26 ] );
			dst[ 14 ] = decodeFloat16( src[ 29 ] );
			dst[ 15 ] = decodeFloat16( src[ 42 ] );
			dst[ 16 ] = decodeFloat16( src[ 3 ] );
			dst[ 17 ] = decodeFloat16( src[ 8 ] );
			dst[ 18 ] = decodeFloat16( src[ 12 ] );
			dst[ 19 ] = decodeFloat16( src[ 17 ] );

			dst[ 20 ] = decodeFloat16( src[ 25 ] );
			dst[ 21 ] = decodeFloat16( src[ 30 ] );
			dst[ 22 ] = decodeFloat16( src[ 41 ] );
			dst[ 23 ] = decodeFloat16( src[ 43 ] );
			dst[ 24 ] = decodeFloat16( src[ 9 ] );
			dst[ 25 ] = decodeFloat16( src[ 11 ] );
			dst[ 26 ] = decodeFloat16( src[ 18 ] );
			dst[ 27 ] = decodeFloat16( src[ 24 ] );
			dst[ 28 ] = decodeFloat16( src[ 31 ] );
			dst[ 29 ] = decodeFloat16( src[ 40 ] );

			dst[ 30 ] = decodeFloat16( src[ 44 ] );
			dst[ 31 ] = decodeFloat16( src[ 53 ] );
			dst[ 32 ] = decodeFloat16( src[ 10 ] );
			dst[ 33 ] = decodeFloat16( src[ 19 ] );
			dst[ 34 ] = decodeFloat16( src[ 23 ] );
			dst[ 35 ] = decodeFloat16( src[ 32 ] );
			dst[ 36 ] = decodeFloat16( src[ 39 ] );
			dst[ 37 ] = decodeFloat16( src[ 45 ] );
			dst[ 38 ] = decodeFloat16( src[ 52 ] );
			dst[ 39 ] = decodeFloat16( src[ 54 ] );

			dst[ 40 ] = decodeFloat16( src[ 20 ] );
			dst[ 41 ] = decodeFloat16( src[ 22 ] );
			dst[ 42 ] = decodeFloat16( src[ 33 ] );
			dst[ 43 ] = decodeFloat16( src[ 38 ] );
			dst[ 44 ] = decodeFloat16( src[ 46 ] );
			dst[ 45 ] = decodeFloat16( src[ 51 ] );
			dst[ 46 ] = decodeFloat16( src[ 55 ] );
			dst[ 47 ] = decodeFloat16( src[ 60 ] );
			dst[ 48 ] = decodeFloat16( src[ 21 ] );
			dst[ 49 ] = decodeFloat16( src[ 34 ] );

			dst[ 50 ] = decodeFloat16( src[ 37 ] );
			dst[ 51 ] = decodeFloat16( src[ 47 ] );
			dst[ 52 ] = decodeFloat16( src[ 50 ] );
			dst[ 53 ] = decodeFloat16( src[ 56 ] );
			dst[ 54 ] = decodeFloat16( src[ 59 ] );
			dst[ 55 ] = decodeFloat16( src[ 61 ] );
			dst[ 56 ] = decodeFloat16( src[ 35 ] );
			dst[ 57 ] = decodeFloat16( src[ 36 ] );
			dst[ 58 ] = decodeFloat16( src[ 48 ] );
			dst[ 59 ] = decodeFloat16( src[ 49 ] );

			dst[ 60 ] = decodeFloat16( src[ 57 ] );
			dst[ 61 ] = decodeFloat16( src[ 58 ] );
			dst[ 62 ] = decodeFloat16( src[ 62 ] );
			dst[ 63 ] = decodeFloat16( src[ 63 ] );

		}

		function dctInverse( data ) {

			const a = 0.5 * Math.cos( 3.14159 / 4.0 );
			const b = 0.5 * Math.cos( 3.14159 / 16.0 );
			const c = 0.5 * Math.cos( 3.14159 / 8.0 );
			const d = 0.5 * Math.cos( 3.0 * 3.14159 / 16.0 );
			const e = 0.5 * Math.cos( 5.0 * 3.14159 / 16.0 );
			const f = 0.5 * Math.cos( 3.0 * 3.14159 / 8.0 );
			const g = 0.5 * Math.cos( 7.0 * 3.14159 / 16.0 );

			const alpha = new Array( 4 );
			const beta = new Array( 4 );
			const theta = new Array( 4 );
			const gamma = new Array( 4 );

			for ( let row = 0; row < 8; ++ row ) {

				const rowPtr = row * 8;

				alpha[ 0 ] = c * data[ rowPtr + 2 ];
				alpha[ 1 ] = f * data[ rowPtr + 2 ];
				alpha[ 2 ] = c * data[ rowPtr + 6 ];
				alpha[ 3 ] = f * data[ rowPtr + 6 ];

				beta[ 0 ] = b * data[ rowPtr + 1 ] + d * data[ rowPtr + 3 ] + e * data[ rowPtr + 5 ] + g * data[ rowPtr + 7 ];
				beta[ 1 ] = d * data[ rowPtr + 1 ] - g * data[ rowPtr + 3 ] - b * data[ rowPtr + 5 ] - e * data[ rowPtr + 7 ];
				beta[ 2 ] = e * data[ rowPtr + 1 ] - b * data[ rowPtr + 3 ] + g * data[ rowPtr + 5 ] + d * data[ rowPtr + 7 ];
				beta[ 3 ] = g * data[ rowPtr + 1 ] - e * data[ rowPtr + 3 ] + d * data[ rowPtr + 5 ] - b * data[ rowPtr + 7 ];

				theta[ 0 ] = a * ( data[ rowPtr + 0 ] + data[ rowPtr + 4 ] );
				theta[ 3 ] = a * ( data[ rowPtr + 0 ] - data[ rowPtr + 4 ] );
				theta[ 1 ] = alpha[ 0 ] + alpha[ 3 ];
				theta[ 2 ] = alpha[ 1 ] - alpha[ 2 ];

				gamma[ 0 ] = theta[ 0 ] + theta[ 1 ];
				gamma[ 1 ] = theta[ 3 ] + theta[ 2 ];
				gamma[ 2 ] = theta[ 3 ] - theta[ 2 ];
				gamma[ 3 ] = theta[ 0 ] - theta[ 1 ];

				data[ rowPtr + 0 ] = gamma[ 0 ] + beta[ 0 ];
				data[ rowPtr + 1 ] = gamma[ 1 ] + beta[ 1 ];
				data[ rowPtr + 2 ] = gamma[ 2 ] + beta[ 2 ];
				data[ rowPtr + 3 ] = gamma[ 3 ] + beta[ 3 ];

				data[ rowPtr + 4 ] = gamma[ 3 ] - beta[ 3 ];
				data[ rowPtr + 5 ] = gamma[ 2 ] - beta[ 2 ];
				data[ rowPtr + 6 ] = gamma[ 1 ] - beta[ 1 ];
				data[ rowPtr + 7 ] = gamma[ 0 ] - beta[ 0 ];

			}

			for ( let column = 0; column < 8; ++ column ) {

				alpha[ 0 ] = c * data[ 16 + column ];
				alpha[ 1 ] = f * data[ 16 + column ];
				alpha[ 2 ] = c * data[ 48 + column ];
				alpha[ 3 ] = f * data[ 48 + column ];

				beta[ 0 ] = b * data[ 8 + column ] + d * data[ 24 + column ] + e * data[ 40 + column ] + g * data[ 56 + column ];
				beta[ 1 ] = d * data[ 8 + column ] - g * data[ 24 + column ] - b * data[ 40 + column ] - e * data[ 56 + column ];
				beta[ 2 ] = e * data[ 8 + column ] - b * data[ 24 + column ] + g * data[ 40 + column ] + d * data[ 56 + column ];
				beta[ 3 ] = g * data[ 8 + column ] - e * data[ 24 + column ] + d * data[ 40 + column ] - b * data[ 56 + column ];

				theta[ 0 ] = a * ( data[ column ] + data[ 32 + column ] );
				theta[ 3 ] = a * ( data[ column ] - data[ 32 + column ] );

				theta[ 1 ] = alpha[ 0 ] + alpha[ 3 ];
				theta[ 2 ] = alpha[ 1 ] - alpha[ 2 ];

				gamma[ 0 ] = theta[ 0 ] + theta[ 1 ];
				gamma[ 1 ] = theta[ 3 ] + theta[ 2 ];
				gamma[ 2 ] = theta[ 3 ] - theta[ 2 ];
				gamma[ 3 ] = theta[ 0 ] - theta[ 1 ];

				data[ 0 + column ] = gamma[ 0 ] + beta[ 0 ];
				data[ 8 + column ] = gamma[ 1 ] + beta[ 1 ];
				data[ 16 + column ] = gamma[ 2 ] + beta[ 2 ];
				data[ 24 + column ] = gamma[ 3 ] + beta[ 3 ];

				data[ 32 + column ] = gamma[ 3 ] - beta[ 3 ];
				data[ 40 + column ] = gamma[ 2 ] - beta[ 2 ];
				data[ 48 + column ] = gamma[ 1 ] - beta[ 1 ];
				data[ 56 + column ] = gamma[ 0 ] - beta[ 0 ];

			}

		}

		function csc709Inverse( data ) {

			for ( let i = 0; i < 64; ++ i ) {

				const y = data[ 0 ][ i ];
				const cb = data[ 1 ][ i ];
				const cr = data[ 2 ][ i ];

				data[ 0 ][ i ] = y + 1.5747 * cr;
				data[ 1 ][ i ] = y - 0.1873 * cb - 0.4682 * cr;
				data[ 2 ][ i ] = y + 1.8556 * cb;

			}

		}

		function convertToHalf( src, dst, idx ) {

			for ( let i = 0; i < 64; ++ i ) {

				dst[ idx + i ] = DataUtils.toHalfFloat( toLinear( src[ i ] ) );

			}

		}

		function toLinear( float ) {

			if ( float <= 1 ) {

				return Math.sign( float ) * Math.pow( Math.abs( float ), 2.2 );

			} else {

				return Math.sign( float ) * Math.pow( logBase, Math.abs( float ) - 1.0 );

			}

		}

		function uncompressRAW( info ) {

			return new DataView( info.array.buffer, info.offset.value, info.size );

		}

		function uncompressRLE( info ) {

			const compressed = info.viewer.buffer.slice( info.offset.value, info.offset.value + info.size );

			const rawBuffer = new Uint8Array( decodeRunLength( compressed ) );
			const tmpBuffer = new Uint8Array( rawBuffer.length );

			predictor( rawBuffer ); // revert predictor

			interleaveScalar( rawBuffer, tmpBuffer ); // interleave pixels

			return new DataView( tmpBuffer.buffer );

		}

		function uncompressZIP( info ) {

			const compressed = info.array.slice( info.offset.value, info.offset.value + info.size );

			const rawBuffer = unzlibSync( compressed );
			const tmpBuffer = new Uint8Array( rawBuffer.length );

			predictor( rawBuffer ); // revert predictor

			interleaveScalar( rawBuffer, tmpBuffer ); // interleave pixels

			return new DataView( tmpBuffer.buffer );

		}

		function uncompressPIZ( info ) {

			const inDataView = info.viewer;
			const inOffset = { value: info.offset.value };

			const outBuffer = new Uint16Array( info.columns * info.lines * ( info.inputChannels.length * info.type ) );
			const bitmap = new Uint8Array( BITMAP_SIZE );

			// Setup channel info
			let outBufferEnd = 0;
			const pizChannelData = new Array( info.inputChannels.length );
			for ( let i = 0, il = info.inputChannels.length; i < il; i ++ ) {

				pizChannelData[ i ] = {};
				pizChannelData[ i ][ 'start' ] = outBufferEnd;
				pizChannelData[ i ][ 'end' ] = pizChannelData[ i ][ 'start' ];
				pizChannelData[ i ][ 'nx' ] = info.columns;
				pizChannelData[ i ][ 'ny' ] = info.lines;
				pizChannelData[ i ][ 'size' ] = info.type;

				outBufferEnd += pizChannelData[ i ].nx * pizChannelData[ i ].ny * pizChannelData[ i ].size;

			}

			// Read range compression data

			const minNonZero = parseUint16( inDataView, inOffset );
			const maxNonZero = parseUint16( inDataView, inOffset );

			if ( maxNonZero >= BITMAP_SIZE ) {

				throw new Error( 'Something is wrong with PIZ_COMPRESSION BITMAP_SIZE' );

			}

			if ( minNonZero <= maxNonZero ) {

				for ( let i = 0; i < maxNonZero - minNonZero + 1; i ++ ) {

					bitmap[ i + minNonZero ] = parseUint8( inDataView, inOffset );

				}

			}

			// Reverse LUT
			const lut = new Uint16Array( USHORT_RANGE );
			const maxValue = reverseLutFromBitmap( bitmap, lut );

			const length = parseUint32( inDataView, inOffset );

			// Huffman decoding
			hufUncompress( info.array, inDataView, inOffset, length, outBuffer, outBufferEnd );

			// Wavelet decoding
			for ( let i = 0; i < info.inputChannels.length; ++ i ) {

				const cd = pizChannelData[ i ];

				for ( let j = 0; j < pizChannelData[ i ].size; ++ j ) {

					wav2Decode(
						outBuffer,
						cd.start + j,
						cd.nx,
						cd.size,
						cd.ny,
						cd.nx * cd.size,
						maxValue
					);

				}

			}

			// Expand the pixel data to their original range
			applyLut( lut, outBuffer, outBufferEnd );

			// Rearrange the pixel data into the format expected by the caller.
			let tmpOffset = 0;
			const tmpBuffer = new Uint8Array( outBuffer.buffer.byteLength );
			for ( let y = 0; y < info.lines; y ++ ) {

				for ( let c = 0; c < info.inputChannels.length; c ++ ) {

					const cd = pizChannelData[ c ];

					const n = cd.nx * cd.size;
					const cp = new Uint8Array( outBuffer.buffer, cd.end * INT16_SIZE, n * INT16_SIZE );

					tmpBuffer.set( cp, tmpOffset );
					tmpOffset += n * INT16_SIZE;
					cd.end += n;

				}

			}

			return new DataView( tmpBuffer.buffer );

		}

		function uncompressPXR( info ) {

			const compressed = info.array.slice( info.offset.value, info.offset.value + info.size );

			const rawBuffer = unzlibSync( compressed );

			const byteSize = info.inputChannels.length * info.lines * info.columns * info.totalBytes;
			const tmpBuffer = new ArrayBuffer( byteSize );
			const viewer = new DataView( tmpBuffer );

			let tmpBufferEnd = 0;
			let writePtr = 0;
			const ptr = new Array( 4 );

			for ( let y = 0; y < info.lines; y ++ ) {

				for ( let c = 0; c < info.inputChannels.length; c ++ ) {

					let pixel = 0;

					const type = info.inputChannels[ c ].pixelType;
					switch ( type ) {

						case 1:

							ptr[ 0 ] = tmpBufferEnd;
							ptr[ 1 ] = ptr[ 0 ] + info.columns;
							tmpBufferEnd = ptr[ 1 ] + info.columns;

							for ( let j = 0; j < info.columns; ++ j ) {

								const diff = ( rawBuffer[ ptr[ 0 ] ++ ] << 8 ) | rawBuffer[ ptr[ 1 ] ++ ];

								pixel += diff;

								viewer.setUint16( writePtr, pixel, true );
								writePtr += 2;

							}

							break;

						case 2:

							ptr[ 0 ] = tmpBufferEnd;
							ptr[ 1 ] = ptr[ 0 ] + info.columns;
							ptr[ 2 ] = ptr[ 1 ] + info.columns;
							tmpBufferEnd = ptr[ 2 ] + info.columns;

							for ( let j = 0; j < info.columns; ++ j ) {

								const diff = ( rawBuffer[ ptr[ 0 ] ++ ] << 24 ) | ( rawBuffer[ ptr[ 1 ] ++ ] << 16 ) | ( rawBuffer[ ptr[ 2 ] ++ ] << 8 );

								pixel += diff;

								viewer.setUint32( writePtr, pixel, true );
								writePtr += 4;

							}

							break;

					}

				}

			}

			return viewer;

		}

		function uncompressDWA( info ) {

			const inDataView = info.viewer;
			const inOffset = { value: info.offset.value };
			const outBuffer = new Uint8Array( info.columns * info.lines * ( info.inputChannels.length * info.type * INT16_SIZE ) );

			// Read compression header information
			const dwaHeader = {

				version: parseInt64( inDataView, inOffset ),
				unknownUncompressedSize: parseInt64( inDataView, inOffset ),
				unknownCompressedSize: parseInt64( inDataView, inOffset ),
				acCompressedSize: parseInt64( inDataView, inOffset ),
				dcCompressedSize: parseInt64( inDataView, inOffset ),
				rleCompressedSize: parseInt64( inDataView, inOffset ),
				rleUncompressedSize: parseInt64( inDataView, inOffset ),
				rleRawSize: parseInt64( inDataView, inOffset ),
				totalAcUncompressedCount: parseInt64( inDataView, inOffset ),
				totalDcUncompressedCount: parseInt64( inDataView, inOffset ),
				acCompression: parseInt64( inDataView, inOffset )

			};

			if ( dwaHeader.version < 2 )
				throw new Error( 'EXRLoader.parse: ' + EXRHeader.compression + ' version ' + dwaHeader.version + ' is unsupported' );

			// Read channel ruleset information
			const channelRules = new Array();
			let ruleSize = parseUint16( inDataView, inOffset ) - INT16_SIZE;

			while ( ruleSize > 0 ) {

				const name = parseNullTerminatedString( inDataView.buffer, inOffset );
				const value = parseUint8( inDataView, inOffset );
				const compression = ( value >> 2 ) & 3;
				const csc = ( value >> 4 ) - 1;
				const index = new Int8Array( [ csc ] )[ 0 ];
				const type = parseUint8( inDataView, inOffset );

				channelRules.push( {
					name: name,
					index: index,
					type: type,
					compression: compression,
				} );

				ruleSize -= name.length + 3;

			}

			// Classify channels
			const channels = EXRHeader.channels;
			const channelData = new Array( info.inputChannels.length );

			for ( let i = 0; i < info.inputChannels.length; ++ i ) {

				const cd = channelData[ i ] = {};
				const channel = channels[ i ];

				cd.name = channel.name;
				cd.compression = UNKNOWN;
				cd.decoded = false;
				cd.type = channel.pixelType;
				cd.pLinear = channel.pLinear;
				cd.width = info.columns;
				cd.height = info.lines;

			}

			const cscSet = {
				idx: new Array( 3 )
			};

			for ( let offset = 0; offset < info.inputChannels.length; ++ offset ) {

				const cd = channelData[ offset ];

				for ( let i = 0; i < channelRules.length; ++ i ) {

					const rule = channelRules[ i ];

					if ( cd.name == rule.name ) {

						cd.compression = rule.compression;

						if ( rule.index >= 0 ) {

							cscSet.idx[ rule.index ] = offset;

						}

						cd.offset = offset;

					}

				}

			}

			let acBuffer, dcBuffer, rleBuffer;

			// Read DCT - AC component data
			if ( dwaHeader.acCompressedSize > 0 ) {

				switch ( dwaHeader.acCompression ) {

					case STATIC_HUFFMAN:

						acBuffer = new Uint16Array( dwaHeader.totalAcUncompressedCount );
						hufUncompress( info.array, inDataView, inOffset, dwaHeader.acCompressedSize, acBuffer, dwaHeader.totalAcUncompressedCount );
						break;

					case DEFLATE:

						const compressed = info.array.slice( inOffset.value, inOffset.value + dwaHeader.totalAcUncompressedCount );
						const data = unzlibSync( compressed );
						acBuffer = new Uint16Array( data.buffer );
						inOffset.value += dwaHeader.totalAcUncompressedCount;
						break;

				}


			}

			// Read DCT - DC component data
			if ( dwaHeader.dcCompressedSize > 0 ) {

				const zlibInfo = {
					array: info.array,
					offset: inOffset,
					size: dwaHeader.dcCompressedSize
				};
				dcBuffer = new Uint16Array( uncompressZIP( zlibInfo ).buffer );
				inOffset.value += dwaHeader.dcCompressedSize;

			}

			// Read RLE compressed data
			if ( dwaHeader.rleRawSize > 0 ) {

				const compressed = info.array.slice( inOffset.value, inOffset.value + dwaHeader.rleCompressedSize );
				const data = unzlibSync( compressed );
				rleBuffer = decodeRunLength( data.buffer );

				inOffset.value += dwaHeader.rleCompressedSize;

			}

			// Prepare outbuffer data offset
			let outBufferEnd = 0;
			const rowOffsets = new Array( channelData.length );
			for ( let i = 0; i < rowOffsets.length; ++ i ) {

				rowOffsets[ i ] = new Array();

			}

			for ( let y = 0; y < info.lines; ++ y ) {

				for ( let chan = 0; chan < channelData.length; ++ chan ) {

					rowOffsets[ chan ].push( outBufferEnd );
					outBufferEnd += channelData[ chan ].width * info.type * INT16_SIZE;

				}

			}

			// Decode lossy DCT data if we have a valid color space conversion set with the first RGB channel present
			if ( cscSet.idx[ 0 ] !== undefined && channelData[ cscSet.idx[ 0 ] ] ) {

				lossyDctDecode( cscSet, rowOffsets, channelData, acBuffer, dcBuffer, outBuffer );

			}

			// Decode other channels
			for ( let i = 0; i < channelData.length; ++ i ) {

				const cd = channelData[ i ];

				if ( cd.decoded ) continue;

				switch ( cd.compression ) {

					case RLE:

						let row = 0;
						let rleOffset = 0;

						for ( let y = 0; y < info.lines; ++ y ) {

							let rowOffsetBytes = rowOffsets[ i ][ row ];

							for ( let x = 0; x < cd.width; ++ x ) {

								for ( let byte = 0; byte < INT16_SIZE * cd.type; ++ byte ) {

									outBuffer[ rowOffsetBytes ++ ] = rleBuffer[ rleOffset + byte * cd.width * cd.height ];

								}

								rleOffset ++;

							}

							row ++;

						}

						break;

					case LOSSY_DCT:

						lossyDctChannelDecode( i, rowOffsets, channelData, acBuffer, dcBuffer, outBuffer );

						break;

					default:
						throw new Error( 'EXRLoader.parse: unsupported channel compression' );

				}

			}

			return new DataView( outBuffer.buffer );

		}

		function parseNullTerminatedString( buffer, offset ) {

			const uintBuffer = new Uint8Array( buffer );
			let endOffset = 0;

			while ( uintBuffer[ offset.value + endOffset ] != 0 ) {

				endOffset += 1;

			}

			const stringValue = new TextDecoder().decode(
				uintBuffer.slice( offset.value, offset.value + endOffset )
			);

			offset.value = offset.value + endOffset + 1;

			return stringValue;

		}

		function parseFixedLengthString( buffer, offset, size ) {

			const stringValue = new TextDecoder().decode(
				new Uint8Array( buffer ).slice( offset.value, offset.value + size )
			);

			offset.value = offset.value + size;

			return stringValue;

		}

		function parseRational( dataView, offset ) {

			const x = parseInt32( dataView, offset );
			const y = parseUint32( dataView, offset );

			return [ x, y ];

		}

		function parseTimecode( dataView, offset ) {

			const x = parseUint32( dataView, offset );
			const y = parseUint32( dataView, offset );

			return [ x, y ];

		}

		function parseInt32( dataView, offset ) {

			const Int32 = dataView.getInt32( offset.value, true );

			offset.value = offset.value + INT32_SIZE;

			return Int32;

		}

		function parseUint32( dataView, offset ) {

			const Uint32 = dataView.getUint32( offset.value, true );

			offset.value = offset.value + INT32_SIZE;

			return Uint32;

		}

		function parseUint8Array( uInt8Array, offset ) {

			const Uint8 = uInt8Array[ offset.value ];

			offset.value = offset.value + INT8_SIZE;

			return Uint8;

		}

		function parseUint8( dataView, offset ) {

			const Uint8 = dataView.getUint8( offset.value );

			offset.value = offset.value + INT8_SIZE;

			return Uint8;

		}

		const parseInt64 = function ( dataView, offset ) {

			let int;

			if ( 'getBigInt64' in DataView.prototype ) {

				int = Number( dataView.getBigInt64( offset.value, true ) );

			} else {

				int = dataView.getUint32( offset.value + 4, true ) + Number( dataView.getUint32( offset.value, true ) << 32 );

			}

			offset.value += ULONG_SIZE;

			return int;

		};

		function parseFloat32( dataView, offset ) {

			const float = dataView.getFloat32( offset.value, true );

			offset.value += FLOAT32_SIZE;

			return float;

		}

		function decodeFloat32( dataView, offset ) {

			return DataUtils.toHalfFloat( parseFloat32( dataView, offset ) );

		}

		// https://stackoverflow.com/questions/5678432/decompressing-half-precision-floats-in-javascript
		function decodeFloat16( binary ) {

			const exponent = ( binary & 0x7C00 ) >> 10,
				fraction = binary & 0x03FF;

			return ( binary >> 15 ? -1 : 1 ) * (
				exponent ?
					(
						exponent === 0x1F ?
							fraction ? NaN : Infinity :
							Math.pow( 2, exponent - 15 ) * ( 1 + fraction / 0x400 )
					) :
					6.103515625e-5 * ( fraction / 0x400 )
			);

		}

		function parseUint16( dataView, offset ) {

			const Uint16 = dataView.getUint16( offset.value, true );

			offset.value += INT16_SIZE;

			return Uint16;

		}

		function parseFloat16( buffer, offset ) {

			return decodeFloat16( parseUint16( buffer, offset ) );

		}

		function parseChlist( dataView, buffer, offset, size ) {

			const startOffset = offset.value;
			const channels = [];

			while ( offset.value < ( startOffset + size - 1 ) ) {

				const name = parseNullTerminatedString( buffer, offset );
				const pixelType = parseInt32( dataView, offset );
				const pLinear = parseUint8( dataView, offset );
				offset.value += 3; // reserved, three chars
				const xSampling = parseInt32( dataView, offset );
				const ySampling = parseInt32( dataView, offset );

				channels.push( {
					name: name,
					pixelType: pixelType,
					pLinear: pLinear,
					xSampling: xSampling,
					ySampling: ySampling
				} );

			}

			offset.value += 1;

			return channels;

		}

		function parseChromaticities( dataView, offset ) {

			const redX = parseFloat32( dataView, offset );
			const redY = parseFloat32( dataView, offset );
			const greenX = parseFloat32( dataView, offset );
			const greenY = parseFloat32( dataView, offset );
			const blueX = parseFloat32( dataView, offset );
			const blueY = parseFloat32( dataView, offset );
			const whiteX = parseFloat32( dataView, offset );
			const whiteY = parseFloat32( dataView, offset );

			return { redX: redX, redY: redY, greenX: greenX, greenY: greenY, blueX: blueX, blueY: blueY, whiteX: whiteX, whiteY: whiteY };

		}

		function parseCompression( dataView, offset ) {

			const compressionCodes = [
				'NO_COMPRESSION',
				'RLE_COMPRESSION',
				'ZIPS_COMPRESSION',
				'ZIP_COMPRESSION',
				'PIZ_COMPRESSION',
				'PXR24_COMPRESSION',
				'B44_COMPRESSION',
				'B44A_COMPRESSION',
				'DWAA_COMPRESSION',
				'DWAB_COMPRESSION'
			];

			const compression = parseUint8( dataView, offset );

			return compressionCodes[ compression ];

		}

		function parseBox2i( dataView, offset ) {

			const xMin = parseInt32( dataView, offset );
			const yMin = parseInt32( dataView, offset );
			const xMax = parseInt32( dataView, offset );
			const yMax = parseInt32( dataView, offset );

			return { xMin: xMin, yMin: yMin, xMax: xMax, yMax: yMax };

		}

		function parseLineOrder( dataView, offset ) {

			const lineOrders = [
				'INCREASING_Y',
				'DECREASING_Y',
				'RANDOM_Y',
			];

			const lineOrder = parseUint8( dataView, offset );

			return lineOrders[ lineOrder ];

		}

		function parseEnvmap( dataView, offset ) {

			const envmaps = [
				'ENVMAP_LATLONG',
				'ENVMAP_CUBE'
			];

			const envmap = parseUint8( dataView, offset );

			return envmaps[ envmap ];

		}

		function parseTiledesc( dataView, offset ) {

			const levelModes = [
				'ONE_LEVEL',
				'MIPMAP_LEVELS',
				'RIPMAP_LEVELS',
			];

			const roundingModes = [
				'ROUND_DOWN',
				'ROUND_UP',
			];

			const xSize = parseUint32( dataView, offset );
			const ySize = parseUint32( dataView, offset );
			const modes = parseUint8( dataView, offset );

			return {
				xSize: xSize,
				ySize: ySize,
				levelMode: levelModes[ modes & 0xf ],
				roundingMode: roundingModes[ modes >> 4 ]
			};

		}

		function parseV2f( dataView, offset ) {

			const x = parseFloat32( dataView, offset );
			const y = parseFloat32( dataView, offset );

			return [ x, y ];

		}

		function parseV3f( dataView, offset ) {

			const x = parseFloat32( dataView, offset );
			const y = parseFloat32( dataView, offset );
			const z = parseFloat32( dataView, offset );

			return [ x, y, z ];

		}

		function parseValue( dataView, buffer, offset, type, size ) {

			if ( type === 'string' || type === 'stringvector' || type === 'iccProfile' ) {

				return parseFixedLengthString( buffer, offset, size );

			} else if ( type === 'chlist' ) {

				return parseChlist( dataView, buffer, offset, size );

			} else if ( type === 'chromaticities' ) {

				return parseChromaticities( dataView, offset );

			} else if ( type === 'compression' ) {

				return parseCompression( dataView, offset );

			} else if ( type === 'box2i' ) {

				return parseBox2i( dataView, offset );

			} else if ( type === 'envmap' ) {

				return parseEnvmap( dataView, offset );

			} else if ( type === 'tiledesc' ) {

				return parseTiledesc( dataView, offset );

			} else if ( type === 'lineOrder' ) {

				return parseLineOrder( dataView, offset );

			} else if ( type === 'float' ) {

				return parseFloat32( dataView, offset );

			} else if ( type === 'v2f' ) {

				return parseV2f( dataView, offset );

			} else if ( type === 'v3f' ) {

				return parseV3f( dataView, offset );

			} else if ( type === 'int' ) {

				return parseInt32( dataView, offset );

			} else if ( type === 'rational' ) {

				return parseRational( dataView, offset );

			} else if ( type === 'timecode' ) {

				return parseTimecode( dataView, offset );

			} else if ( type === 'preview' ) {

				offset.value += size;
				return 'skipped';

			} else {

				offset.value += size;
				return undefined;

			}

		}

		function roundLog2( x, mode ) {

			const log2 = Math.log2( x );
			return mode == 'ROUND_DOWN' ? Math.floor( log2 ) : Math.ceil( log2 );

		}

		function calculateTileLevels( tiledesc, w, h ) {

			let num = 0;

			switch ( tiledesc.levelMode ) {

				case 'ONE_LEVEL':
					num = 1;
					break;

				case 'MIPMAP_LEVELS':
					num = roundLog2( Math.max( w, h ), tiledesc.roundingMode ) + 1;
					break;

				case 'RIPMAP_LEVELS':
					throw new Error( 'THREE.EXRLoader: RIPMAP_LEVELS tiles currently unsupported.' );

			}

			return num;

		}

		function calculateTiles( count, dataSize, size, roundingMode ) {

			const tiles = new Array( count );

			for ( let i = 0; i < count; i ++ ) {

				const b = ( 1 << i );
				let s = ( dataSize / b ) | 0;

				if ( roundingMode == 'ROUND_UP' && s * b < dataSize ) s += 1;

				const l = Math.max( s, 1 );

				tiles[ i ] = ( ( l + size - 1 ) / size ) | 0;

			}

			return tiles;

		}

		function parseTiles() {

			const EXRDecoder = this;
			const offset = EXRDecoder.offset;
			const tmpOffset = { value: 0 };

			for ( let tile = 0; tile < EXRDecoder.tileCount; tile ++ ) {

				const tileX = parseInt32( EXRDecoder.viewer, offset );
				const tileY = parseInt32( EXRDecoder.viewer, offset );
				offset.value += 8; // skip levels - only parsing top-level
				EXRDecoder.size = parseUint32( EXRDecoder.viewer, offset );

				const startX = tileX * EXRDecoder.blockWidth;
				const startY = tileY * EXRDecoder.blockHeight;
				EXRDecoder.columns = ( startX + EXRDecoder.blockWidth > EXRDecoder.width ) ? EXRDecoder.width - startX : EXRDecoder.blockWidth;
				EXRDecoder.lines = ( startY + EXRDecoder.blockHeight > EXRDecoder.height ) ? EXRDecoder.height - startY : EXRDecoder.blockHeight;

				const bytesBlockLine = EXRDecoder.columns * EXRDecoder.totalBytes;
				const isCompressed = EXRDecoder.size < EXRDecoder.lines * bytesBlockLine;
				const viewer = isCompressed ? EXRDecoder.uncompress( EXRDecoder ) : uncompressRAW( EXRDecoder );

				offset.value += EXRDecoder.size;

				for ( let line = 0; line < EXRDecoder.lines; line ++ ) {

					const lineOffset = line * EXRDecoder.columns * EXRDecoder.totalBytes;

					for ( let channelID = 0; channelID < EXRDecoder.inputChannels.length; channelID ++ ) {

						const name = EXRHeader.channels[ channelID ].name;
						const lOff = EXRDecoder.channelByteOffsets[ name ] * EXRDecoder.columns;
						const cOff = EXRDecoder.decodeChannels[ name ];

						if ( cOff === undefined ) continue;

						tmpOffset.value = lineOffset + lOff;
						const outLineOffset = ( EXRDecoder.height - ( 1 + startY + line ) ) * EXRDecoder.outLineWidth;

						for ( let x = 0; x < EXRDecoder.columns; x ++ ) {

							const outIndex = outLineOffset + ( x + startX ) * EXRDecoder.outputChannels + cOff;
							EXRDecoder.byteArray[ outIndex ] = EXRDecoder.getter( viewer, tmpOffset );

						}

					}

				}

			}

		}

		function parseScanline() {

			const EXRDecoder = this;
			const offset = EXRDecoder.offset;
			const tmpOffset = { value: 0 };

			for ( let scanlineBlockIdx = 0; scanlineBlockIdx < EXRDecoder.height / EXRDecoder.blockHeight; scanlineBlockIdx ++ ) {

				const line = parseInt32( EXRDecoder.viewer, offset ) - EXRHeader.dataWindow.yMin; // line_no
				EXRDecoder.size = parseUint32( EXRDecoder.viewer, offset ); // data_len
				EXRDecoder.lines = ( ( line + EXRDecoder.blockHeight > EXRDecoder.height ) ? ( EXRDecoder.height - line ) : EXRDecoder.blockHeight );

				const bytesPerLine = EXRDecoder.columns * EXRDecoder.totalBytes;
				const isCompressed = EXRDecoder.size < EXRDecoder.lines * bytesPerLine;
				const viewer = isCompressed ? EXRDecoder.uncompress( EXRDecoder ) : uncompressRAW( EXRDecoder );

				offset.value += EXRDecoder.size;

				for ( let line_y = 0; line_y < EXRDecoder.blockHeight; line_y ++ ) {

					const scan_y = scanlineBlockIdx * EXRDecoder.blockHeight;
					const true_y = line_y + EXRDecoder.scanOrder( scan_y );
					if ( true_y >= EXRDecoder.height ) continue;

					const lineOffset = line_y * bytesPerLine;
					const outLineOffset = ( EXRDecoder.height - 1 - true_y ) * EXRDecoder.outLineWidth;

					for ( let channelID = 0; channelID < EXRDecoder.inputChannels.length; channelID ++ ) {

						const name = EXRHeader.channels[ channelID ].name;
						const lOff = EXRDecoder.channelByteOffsets[ name ] * EXRDecoder.columns;
						const cOff = EXRDecoder.decodeChannels[ name ];

						if ( cOff === undefined ) continue;

						tmpOffset.value = lineOffset + lOff;

						for ( let x = 0; x < EXRDecoder.columns; x ++ ) {

							const outIndex = outLineOffset + x * EXRDecoder.outputChannels + cOff;
							EXRDecoder.byteArray[ outIndex ] = EXRDecoder.getter( viewer, tmpOffset );

						}

					}

				}

			}

		}

		function parseHeader( dataView, buffer, offset ) {

			const EXRHeader = {};

			if ( dataView.getUint32( 0, true ) != 20000630 ) { // magic

				throw new Error( 'THREE.EXRLoader: Provided file doesn\'t appear to be in OpenEXR format.' );

			}

			EXRHeader.version = dataView.getUint8( 4 );

			const spec = dataView.getUint8( 5 ); // fullMask

			EXRHeader.spec = {
				singleTile: !! ( spec & 2 ),
				longName: !! ( spec & 4 ),
				deepFormat: !! ( spec & 8 ),
				multiPart: !! ( spec & 16 ),
			};

			// start of header

			offset.value = 8; // start at 8 - after pre-amble

			let keepReading = true;

			while ( keepReading ) {

				const attributeName = parseNullTerminatedString( buffer, offset );

				if ( attributeName === '' ) {

					keepReading = false;

				} else {

					const attributeType = parseNullTerminatedString( buffer, offset );
					const attributeSize = parseUint32( dataView, offset );
					const attributeValue = parseValue( dataView, buffer, offset, attributeType, attributeSize );

					if ( attributeValue === undefined ) {

						console.warn( `THREE.EXRLoader: Skipped unknown header attribute type \'${attributeType}\'.` );

					} else {

						EXRHeader[ attributeName ] = attributeValue;

					}

				}

			}

			if ( ( spec & -7 ) != 0 ) { // unsupported deep-image, multi-part

				console.error( 'THREE.EXRHeader:', EXRHeader );
				throw new Error( 'THREE.EXRLoader: Provided file is currently unsupported.' );

			}

			return EXRHeader;

		}

		function setupDecoder( EXRHeader, dataView, uInt8Array, offset, outputType, outputFormat ) {

			const EXRDecoder = {
				size: 0,
				viewer: dataView,
				array: uInt8Array,
				offset: offset,
				width: EXRHeader.dataWindow.xMax - EXRHeader.dataWindow.xMin + 1,
				height: EXRHeader.dataWindow.yMax - EXRHeader.dataWindow.yMin + 1,
				inputChannels: EXRHeader.channels,
				channelByteOffsets: {},
				shouldExpand: false,
				scanOrder: null,
				totalBytes: null,
				columns: null,
				lines: null,
				type: null,
				uncompress: null,
				getter: null,
				format: null,
				colorSpace: LinearSRGBColorSpace,
			};

			switch ( EXRHeader.compression ) {

				case 'NO_COMPRESSION':
					EXRDecoder.blockHeight = 1;
					EXRDecoder.uncompress = uncompressRAW;
					break;

				case 'RLE_COMPRESSION':
					EXRDecoder.blockHeight = 1;
					EXRDecoder.uncompress = uncompressRLE;
					break;

				case 'ZIPS_COMPRESSION':
					EXRDecoder.blockHeight = 1;
					EXRDecoder.uncompress = uncompressZIP;
					break;

				case 'ZIP_COMPRESSION':
					EXRDecoder.blockHeight = 16;
					EXRDecoder.uncompress = uncompressZIP;
					break;

				case 'PIZ_COMPRESSION':
					EXRDecoder.blockHeight = 32;
					EXRDecoder.uncompress = uncompressPIZ;
					break;

				case 'PXR24_COMPRESSION':
					EXRDecoder.blockHeight = 16;
					EXRDecoder.uncompress = uncompressPXR;
					break;

				case 'DWAA_COMPRESSION':
					EXRDecoder.blockHeight = 32;
					EXRDecoder.uncompress = uncompressDWA;
					break;

				case 'DWAB_COMPRESSION':
					EXRDecoder.blockHeight = 256;
					EXRDecoder.uncompress = uncompressDWA;
					break;

				default:
					throw new Error( 'EXRLoader.parse: ' + EXRHeader.compression + ' is unsupported' );

			}

			const channels = {};
			for ( const channel of EXRHeader.channels ) {

				switch ( channel.name ) {

					case 'Y':
					case 'R':
					case 'G':
					case 'B':
					case 'A':
						channels[ channel.name ] = true;
						EXRDecoder.type = channel.pixelType;

				}

			}

			// RGB images will be converted to RGBA format, preventing software emulation in select devices.
			let fillAlpha = false;
			let invalidOutput = false;

			// Validate if input texture contain supported channels
			if ( channels.R && channels.G && channels.B ) {

				EXRDecoder.outputChannels = 4;

			} else if ( channels.Y ) {

				EXRDecoder.outputChannels = 1;

			} else {

				throw new Error( 'EXRLoader.parse: file contains unsupported data channels.' );

			}

			// Setup output texture configuration
			switch ( EXRDecoder.outputChannels ) {

				case 4:

					if ( outputFormat == RGBAFormat ) {

						fillAlpha = ! channels.A;
						EXRDecoder.format = RGBAFormat;
						EXRDecoder.colorSpace = LinearSRGBColorSpace;
						EXRDecoder.outputChannels = 4;
						EXRDecoder.decodeChannels = { R: 0, G: 1, B: 2, A: 3 };

					} else if ( outputFormat == RGFormat ) {

						EXRDecoder.format = RGFormat;
						EXRDecoder.colorSpace = LinearSRGBColorSpace;
						EXRDecoder.outputChannels = 2;
						EXRDecoder.decodeChannels = { R: 0, G: 1 };

					} else if ( outputFormat == RedFormat ) {

						EXRDecoder.format = RedFormat;
						EXRDecoder.colorSpace = LinearSRGBColorSpace;
						EXRDecoder.outputChannels = 1;
						EXRDecoder.decodeChannels = { R: 0 };

					} else {

						invalidOutput = true;

					}

					break;

				case 1:

					if ( outputFormat == RGBAFormat ) {

						fillAlpha = true;
						EXRDecoder.format = RGBAFormat;
						EXRDecoder.colorSpace = LinearSRGBColorSpace;
						EXRDecoder.outputChannels = 4;
						EXRDecoder.shouldExpand = true;
						EXRDecoder.decodeChannels = { Y: 0 };

					} else if ( outputFormat == RGFormat ) {

						EXRDecoder.format = RGFormat;
						EXRDecoder.colorSpace = LinearSRGBColorSpace;
						EXRDecoder.outputChannels = 2;
						EXRDecoder.shouldExpand = true;
						EXRDecoder.decodeChannels = { Y: 0 };

					} else if ( outputFormat == RedFormat ) {

						EXRDecoder.format = RedFormat;
						EXRDecoder.colorSpace = LinearSRGBColorSpace;
						EXRDecoder.outputChannels = 1;
						EXRDecoder.decodeChannels = { Y: 0 };

					} else {

						invalidOutput = true;

					}

					break;

				default:

					invalidOutput = true;

			}

			if ( invalidOutput ) throw new Error( 'EXRLoader.parse: invalid output format for specified file.' );

			if ( EXRDecoder.type == 1 ) {

				// half
				switch ( outputType ) {

					case FloatType:
						EXRDecoder.getter = parseFloat16;
						break;

					case HalfFloatType:
						EXRDecoder.getter = parseUint16;
						break;

				}

			} else if ( EXRDecoder.type == 2 ) {

				// float
				switch ( outputType ) {

					case FloatType:
						EXRDecoder.getter = parseFloat32;
						break;

					case HalfFloatType:
						EXRDecoder.getter = decodeFloat32;

				}

			} else {

				throw new Error( 'EXRLoader.parse: unsupported pixelType ' + EXRDecoder.type + ' for ' + EXRHeader.compression + '.' );

			}

			EXRDecoder.columns = EXRDecoder.width;
			const size = EXRDecoder.width * EXRDecoder.height * EXRDecoder.outputChannels;

			switch ( outputType ) {

				case FloatType:
					EXRDecoder.byteArray = new Float32Array( size );

					// Fill initially with 1s for the alpha value if the texture is not RGBA, RGB values will be overwritten
					if ( fillAlpha )
						EXRDecoder.byteArray.fill( 1, 0, size );

					break;

				case HalfFloatType:
					EXRDecoder.byteArray = new Uint16Array( size );

					if ( fillAlpha )
						EXRDecoder.byteArray.fill( 0x3C00, 0, size ); // Uint16Array holds half float data, 0x3C00 is 1

					break;

				default:
					console.error( 'THREE.EXRLoader: unsupported type: ', outputType );
					break;

			}

			let byteOffset = 0;
			for ( const channel of EXRHeader.channels ) {

				if ( EXRDecoder.decodeChannels[ channel.name ] !== undefined ) {

					EXRDecoder.channelByteOffsets[ channel.name ] = byteOffset;

				}

				byteOffset += channel.pixelType * 2;

			}

			EXRDecoder.totalBytes = byteOffset;
			EXRDecoder.outLineWidth = EXRDecoder.width * EXRDecoder.outputChannels;

			if ( EXRHeader.lineOrder === 'INCREASING_Y' ) {

				EXRDecoder.scanOrder = ( y ) => y;

			} else {

				EXRDecoder.scanOrder = ( y ) => EXRDecoder.height - 1 - y;

			}

			if ( EXRHeader.spec.singleTile ) {

				EXRDecoder.blockHeight = EXRHeader.tiles.ySize;
				EXRDecoder.blockWidth = EXRHeader.tiles.xSize;

				const numXLevels = calculateTileLevels( EXRHeader.tiles, EXRDecoder.width, EXRDecoder.height );
				// const numYLevels = calculateTileLevels( EXRHeader.tiles, EXRDecoder.width, EXRDecoder.height );

				const numXTiles = calculateTiles( numXLevels, EXRDecoder.width, EXRHeader.tiles.xSize, EXRHeader.tiles.roundingMode );
				const numYTiles = calculateTiles( numXLevels, EXRDecoder.height, EXRHeader.tiles.ySize, EXRHeader.tiles.roundingMode );

				EXRDecoder.tileCount = numXTiles[ 0 ] * numYTiles[ 0 ];

				for ( let l = 0; l < numXLevels; l ++ )
					for ( let y = 0; y < numYTiles[ l ]; y ++ )
						for ( let x = 0; x < numXTiles[ l ]; x ++ )
							parseInt64( dataView, offset ); // tileOffset

				EXRDecoder.decode = parseTiles.bind( EXRDecoder );

			} else {

				EXRDecoder.blockWidth = EXRDecoder.width;
				const blockCount = Math.ceil( EXRDecoder.height / EXRDecoder.blockHeight );

				for ( let i = 0; i < blockCount; i ++ )
					parseInt64( dataView, offset ); // scanlineOffset

				EXRDecoder.decode = parseScanline.bind( EXRDecoder );

			}

			return EXRDecoder;

		}

		// start parsing file [START]
		const offset = { value: 0 };
		const bufferDataView = new DataView( buffer );
		const uInt8Array = new Uint8Array( buffer );

		// get header information and validate format.
		const EXRHeader = parseHeader( bufferDataView, buffer, offset );

		// get input compression information and prepare decoding.
		const EXRDecoder = setupDecoder( EXRHeader, bufferDataView, uInt8Array, offset, this.type, this.outputFormat );

		// parse input data
		EXRDecoder.decode();

		// output texture post-processing
		if ( EXRDecoder.shouldExpand ) {

			const byteArray = EXRDecoder.byteArray;

			if ( this.outputFormat == RGBAFormat ) {

				for ( let i = 0; i < byteArray.length; i += 4 )
					byteArray[ i + 2 ] = ( byteArray[ i + 1 ] = byteArray[ i ] );

			} else if ( this.outputFormat == RGFormat ) {

				for ( let i = 0; i < byteArray.length; i += 2 )
					byteArray[ i + 1 ] = byteArray[ i ];

			}

		}

		return {
			header: EXRHeader,
			width: EXRDecoder.width,
			height: EXRDecoder.height,
			data: EXRDecoder.byteArray,
			format: EXRDecoder.format,
			colorSpace: EXRDecoder.colorSpace,
			type: this.type,
		};

	}

	/**
	 * Sets the texture type.
	 *
	 * @param {(HalfFloatType|FloatType)} value - The texture type to set.
	 * @return {EXRLoader} A reference to this loader.
	 */
	setDataType( value ) {

		this.type = value;
		return this;

	}

	/**
	 * Sets texture output format. Defaults to `RGBAFormat`.
	 *
	 * @param {(RGBAFormat|RGFormat|RedFormat)} value - Texture output format.
	 * @return {EXRLoader} A reference to this loader.
	 */
	setOutputFormat( value ) {

		this.outputFormat = value;
		return this;

	}

	load( url, onLoad, onProgress, onError ) {

		function onLoadCallback( texture, texData ) {

			texture.colorSpace = texData.colorSpace;
			texture.minFilter = LinearFilter;
			texture.magFilter = LinearFilter;
			texture.generateMipmaps = false;
			texture.flipY = false;

			if ( onLoad ) onLoad( texture, texData );

		}

		return super.load( url, onLoadCallback, onProgress, onError );

	}

}

// import { resolvePublicPath } from '@/offscreen/utils/publicPath';

const RESOURCES = [
	// {
	// 	name: 'envmap',
	// 	url: resolvePublicPath( 'hdr/ninomaru_teien_2k.hdr' ),
	// 	fileSize: 2097152, // approximately 2MB
	// }
];

var h={};function B(o){let t=h[o];return t||(t=h[o]=new PlaneGeometry(1,1,o,o).translate(.5,.5,0)),t}var a="aThreeBlocksGlyphBounds",u$1="aThreeBlocksGlyphIndex",l="aThreeBlocksGlyphColor",f="aThreeBlocksGlyphLetterIndex",d=class extends InstancedBufferGeometry{constructor(){super(),this.detail=1,this.groups=[{start:0,count:1/0,materialIndex:0},{start:0,count:1/0,materialIndex:1}],this.boundingSphere=new Sphere,this.boundingBox=new Box3,this.setAttribute(a,new InstancedBufferAttribute(new Float32Array(0),4)),this.setAttribute(u$1,new InstancedBufferAttribute(new Float32Array(0),1)),this.setAttribute(l,new InstancedBufferAttribute(new Float32Array(0),3)),this.setAttribute(f,new InstancedBufferAttribute(new Float32Array(0),1));}computeBoundingSphere(){}computeBoundingBox(){}set detail(t){if(t!==this._detail){this._detail=t,(typeof t!="number"||t<1)&&(t=1);let e=B(t);["position","normal","uv"].forEach(n=>{this.attributes[n]=e.attributes[n].clone();}),this.setIndex(e.getIndex().clone());}}get detail(){return this._detail}updateGlyphs(t,e,n,s,i){this.updateAttributeData(a,t,4),this.updateAttributeData(u$1,e,1),this.updateAttributeData(l,i,3),this._blockBounds=n,this._chunkedBounds=s,this.instanceCount=e.length,this._updateBounds();}_updateBounds(){let t=this._blockBounds;if(t){let{boundingBox:e}=this;e.min.set(t[0],t[1],0),e.max.set(t[2],t[3],0),e.getBoundingSphere(this.boundingSphere);}}applyClipRect(t){let e=this.getAttribute(u$1).count,n=this._chunkedBounds;if(n)for(let s=n.length;s--;){e=n[s].end;let i=n[s].rect;if(i[1]<t.w&&i[3]>t.y&&i[0]<t.z&&i[2]>t.x)break}this.instanceCount=e;}updateAttributeData(t,e,n){let s=this.getAttribute(t);e?s&&s.array.length===e.length?(s.array.set(e),s.needsUpdate=true):(this.setAttribute(t,new InstancedBufferAttribute(e,n)),delete this._maxInstanceCount,this.dispose()):s&&this.deleteAttribute(t);}};

function S$1({glyphBounds:L,atlasIndex:c,letterId:W,wordId:X,clipRect:e,posOffset:v,distanceOffset:u,blurRadius:r,totalBounds:d,sdfTextureSize:m,sdfGlyphSize:b}){return Fn(()=>{let o=vec4(L).toVar();o.addAssign(v.x,v.y.negate(),v.x,v.y.negate());let i=vec4(o).toVar(),x=float(u).toVar();i.addAssign(x.negate().sub(r),x.negate().sub(r),x.add(r),x.add(r));let w=vec4(clamp(i.xy,e.xy,e.zw),clamp(i.zw,e.xy,e.zw)).toVar(),Y=normalLocal.toVar(),y=vec2(o.xy).toVar(),z=vec2(o.zw).toVar(),T=vec2(mix(w.xy,w.zw,positionLocal.xy).sub(y).div(z.sub(y))).toVar(),P=vec3(mix(y,z,T),positionLocal.z).toVar(),q=vec2(P.xy.sub(d.xy).div(d.zw.sub(d.xy))).toVar(),p=float(m.x.div(b)).toVar(),U=vec2(b.div(m)).toVar(),k=vec2(U.mul(vec2(mod(floor(float(c).div(4)),p),floor(floor(float(c).div(4)).div(p))))).toVar();return varyingProperty("vec2","vTextStyleParams").assign(vec2(u,r)),varyingProperty("vec4","vTextPacked0").assign(vec4(q,T.xy)),varyingProperty("vec4","vTextTextureUVBounds").assign(vec4(k,vec2(k).add(U))),varyingProperty("vec4","vTextPacked1").assign(vec4(o.z.sub(o.x),o.w.sub(o.y),mod(float(c),4),W)),varyingProperty("float","vTextWordId").assign(X),varyingProperty("vec4","vThreeBlocksDimsChan").assign(vec4(o.z.sub(o.x),o.w.sub(o.y),mod(float(c),4),float(0))),normalLocal.assign(Y),P})}

/*!
  Three.js Blocks (@three-blocks/core)

  Proprietary Software — All Rights Reserved
  Copyright (c) 2025 three-blocks

  License Notice
  This software and all associated packages (@three-blocks/core, @three-blocks/starter,
  create-three-blocks-starter, and related tools) are licensed exclusively to active,
  paid subscribers of the threejs-blocks project. Without a valid and current subscription,
  you are NOT permitted to use this software.

  Permitted Usage (Active Subscribers Only)
  - Use in personal and commercial projects via the public API
  - Deploy applications to production environments
  - Integrate the software into your applications
  - Access updates, bug fixes, and new features during active subscription

  Restrictions
  - You may NOT reverse engineer, decompile, disassemble, or attempt to derive the
    source code, underlying algorithms, or techniques employed in this software.
  - You may NOT study, analyze, inspect, or learn from the implementation details,
    code structure, or internal workings of this software.
  - You may NOT modify, adapt, translate, or create derivative works.
  - You may NOT copy, share, distribute, publish, or resell any part of the software.
  - You may NOT sublicense or transfer rights to any third party.
  - You may NOT remove, alter, or obscure this license header or any copyright notices.
  - You may NOT use this software after your subscription has expired or been terminated.
  - You may NOT use this source code, in whole or in part, to train, fine-tune, or
    develop any artificial intelligence models, machine learning systems, or large
    language models (LLMs).
  - You may NOT feed this code into AI-assisted development tools for the purpose
    of generating derivative code, training said tools, or extracting patterns.
  - You may NOT use automated transformation tools or AI systems to create modified
    versions or derivatives of this software.

  Enforcement
  Unauthorized use, reproduction, distribution, reverse engineering, or violation of
  the AI/ML prohibition is strictly prohibited and may result in immediate termination
  of your license, civil liability, and/or criminal penalties under applicable copyright
  and contract law.

  By using this software, you acknowledge that you have read, understood, and agree to
  be bound by the complete terms of this license agreement.

  For licensing inquiries and compliance: https://threejs-blocks.com/license
*/

function $t(Bt,ht){let Lt=/[\u00AD\u034F\u061C\u115F-\u1160\u17B4-\u17B5\u180B-\u180E\u200B-\u200F\u202A-\u202E\u2060-\u206F\u3164\uFE00-\uFE0F\uFEFF\uFFA0\uFFF0-\uFFF8]/,At="[^\\S\\u00A0]",Wt=new RegExp(`${At}|[\\-\\u007C\\u00AD\\u2010\\u2012-\\u2014\\u2027\\u2056\\u2E17\\u2E40]`);function vt({text:t,lang:o,fonts:g,style:D,weight:d,preResolvedFonts:H,unicodeFontsURL:_},B){let x=({chars:y,fonts:pt})=>{let q,$,it=[];for(let L=0;L<y.length;L++)y[L]!==$?($=y[L],it.push(q={start:L,end:L,fontObj:pt[y[L]]})):q.end=L;B(it);};H?x(H):Bt(t,x,{lang:o,fonts:g,style:D,weight:d,unicodeFontsURL:_});}function Ft({text:t="",font:o,lang:g,sdfGlyphSize:D=64,fontSize:d=400,fontWeight:H=1,fontStyle:_="normal",letterSpacing:B=0,lineHeight:x="normal",maxWidth:y=1/0,direction:pt,textAlign:q="left",textIndent:$=0,whiteSpace:it="normal",overflowWrap:L="normal",anchorX:O=0,anchorY:m=0,metricsOnly:Dt=false,unicodeFontsURL:Nt,preResolvedFonts:kt=null,includeCaretPositions:It=false,chunkedBoundsSize:Ht=8192,colorRanges:X=null},Ot){let Gt=nt(),ut={fontLoad:0,typesetting:0};t.indexOf("\r")>-1&&(console.info("Typesetter: got text with \\r chars; normalizing to \\n"),t=t.replace(/\r\n/g,`
`).replace(/\r/g,`
`)),d=+d,B=+B,y=+y,x=x||"normal",$=+$,vt({text:t,lang:g,style:_,weight:H,fonts:typeof o=="string"?[{src:o}]:o,unicodeFontsURL:Nt,preResolvedFonts:kt},Tt=>{ut.fontLoad=nt()-Gt;let jt=isFinite(y),dt=null,yt=null,st=null,lt=null,Y=null,N=null,W=null,gt=null,G=0,tt=0,Rt=it!=="nowrap",at=new Map,Ut=nt(),J=$,Et=0,I=new k,v=[I];Tt.forEach(n=>{let{fontObj:w}=n,{ascender:h,descender:p,unitsPerEm:E,lineGap:C,capHeight:f,xHeight:P}=w,r=at.get(w);if(!r){let s=d/E,l=x==="normal"?(h-p+C)*s:x*d,et=(l-(h-p)*s)/2,a=Math.min(l,(h-p)*s),i=(h+p)/2*s+a/2;r={index:at.size,src:w.src,fontObj:w,fontSizeMult:s,unitsPerEm:E,ascender:h*s,descender:p*s,capHeight:f*s,xHeight:P*s,lineHeight:l,baseline:-et-h*s,caretTop:(h+p)/2*s+a/2,caretBottom:i-a},at.set(w,r);}let{fontSizeMult:Q}=r,Z=t.slice(n.start,n.end+1),S,R;w.forEachGlyph(Z,d,B,(s,l,et,a)=>{l+=Et,a+=n.start,S=l,R=s;let i=t.charAt(a),A=s.advanceWidth*Q,F=I.count,e;if("isEmpty"in s||(s.isWhitespace=!!i&&new RegExp(At).test(i),s.canBreakAfter=!!i&&Wt.test(i),s.isEmpty=s.xMin===s.xMax||s.yMin===s.yMax||Lt.test(i)),!s.isWhitespace&&!s.isEmpty&&tt++,Rt&&jt&&!s.isWhitespace&&l+A+J>y&&F){if(I.glyphAt(F-1).glyphObj.canBreakAfter)e=new k,J=-l;else for(let M=F;M--;)if(M===0&&L==="break-word"){e=new k,J=-l;break}else if(I.glyphAt(M).glyphObj.canBreakAfter){e=I.splitAt(M+1);let b=e.glyphAt(0).x;J-=b;for(let u=e.count;u--;)e.glyphAt(u).x-=b;break}e&&(I.isSoftWrapped=true,I=e,v.push(I),G=y);}let c=I.glyphAt(I.count);c.glyphObj=s,c.x=l+J,c.y=et,c.width=A,c.charIndex=a,c.fontData=r,i===`
`&&(I=new k,v.push(I),J=-(l+A+B*d)+$);}),Et=S+R.advanceWidth*Q+B*d;});let T=0;v.forEach(n=>{let w=true;for(let h=n.count;h--;){let p=n.glyphAt(h);w&&!p.glyphObj.isWhitespace&&(n.width=p.x+p.width,n.width>G&&(G=n.width),w=false);let{lineHeight:E,capHeight:C,xHeight:f,baseline:P}=p.fontData;E>n.lineHeight&&(n.lineHeight=E);let r=P-n.baseline;r<0&&(n.baseline+=r,n.cap+=r,n.ex+=r),n.cap=Math.max(n.cap,n.baseline+C),n.ex=Math.max(n.ex,n.baseline+f);}n.baseline-=T,n.cap-=T,n.ex-=T,T+=n.lineHeight;});let K=0,j=0;if(O&&(typeof O=="number"?K=-O:typeof O=="string"&&(K=-G*(O==="left"?0:O==="center"?.5:O==="right"?1:bt(O)))),m&&(typeof m=="number"?j=-m:typeof m=="string"&&(j=m==="top"?0:m==="top-baseline"?-v[0].baseline:m==="top-cap"?-v[0].cap:m==="top-ex"?-v[0].ex:m==="middle"?T/2:m==="bottom"?T:m==="bottom-baseline"?v[v.length-1].baseline:bt(m)*T)),!Dt){let n=ht.getEmbeddingLevels(t,pt);dt=new Uint16Array(tt),yt=new Uint8Array(tt),st=new Float32Array(tt*2),lt={},W=[1/0,1/0,-1/0,-1/0],gt=[],It&&(N=new Float32Array(t.length*4)),X&&(Y=new Uint8Array(tt*3));let w=0,h=-1,p=-1,E,C;if(v.forEach((f,P)=>{let{count:r,width:Q}=f;if(r>0){let Z=0;for(let a=r;a--&&f.glyphAt(a).glyphObj.isWhitespace;)Z++;let S=0,R=0;if(q==="center")S=(G-Q)/2;else if(q==="right")S=G-Q;else if(q==="justify"&&f.isSoftWrapped){let a=0;for(let i=r-Z;i--;)f.glyphAt(i).glyphObj.isWhitespace&&a++;R=(G-Q)/a;}if(R||S){let a=0;for(let i=0;i<r;i++){let A=f.glyphAt(i),F=A.glyphObj;A.x+=S+a,R!==0&&F.isWhitespace&&i<r-Z&&(a+=R,A.width+=R);}}let s=ht.getReorderSegments(t,n,f.glyphAt(0).charIndex,f.glyphAt(f.count-1).charIndex);for(let a=0;a<s.length;a++){let[i,A]=s[a],F=1/0,e=-1/0;for(let c=0;c<r;c++)if(f.glyphAt(c).charIndex>=i){let M=c,b=c;for(;b<r;b++){let u=f.glyphAt(b);if(u.charIndex>A)break;b<r-Z&&(F=Math.min(F,u.x),e=Math.max(e,u.x+u.width));}for(let u=M;u<b;u++){let V=f.glyphAt(u);V.x=e-(V.x+V.width-F);}break}}let l,et=a=>l=a;for(let a=0;a<r;a++){let i=f.glyphAt(a);l=i.glyphObj;let A=l.index,F=n.levels[i.charIndex]&1;if(F){let e=ht.getMirroredCharacter(t[i.charIndex]);e&&i.fontData.fontObj.forEachGlyph(e,0,0,et);}if(It){let{charIndex:e,fontData:c}=i,M=i.x+K,b=i.x+i.width+K;N[e*4]=F?b:M,N[e*4+1]=F?M:b,N[e*4+2]=f.baseline+c.caretBottom+j,N[e*4+3]=f.baseline+c.caretTop+j;let u=e-h;u>1&&mt(N,h,u),h=e;}if(X){let{charIndex:e}=i;for(;e>p;)p++,X.hasOwnProperty(p)&&(C=X[p]);}if(!l.isWhitespace&&!l.isEmpty){let e=w++,{fontSizeMult:c,src:M,index:b}=i.fontData,u=lt[M]||(lt[M]={});u[A]||(u[A]={path:l.path,pathBounds:[l.xMin,l.yMin,l.xMax,l.yMax]});let V=i.x+K,xt=i.y+f.baseline+j;st[e*2]=V,st[e*2+1]=xt;let ot=V+l.xMin*c,ft=xt+l.yMin*c,rt=V+l.xMax*c,ct=xt+l.yMax*c;ot<W[0]&&(W[0]=ot),ft<W[1]&&(W[1]=ft),rt>W[2]&&(W[2]=rt),ct>W[3]&&(W[3]=ct),e%Ht===0&&(E={start:e,end:e,rect:[1/0,1/0,-1/0,-1/0]},gt.push(E)),E.end++;let U=E.rect;if(ot<U[0]&&(U[0]=ot),ft<U[1]&&(U[1]=ft),rt>U[2]&&(U[2]=rt),ct>U[3]&&(U[3]=ct),dt[e]=A,yt[e]=b,X){let wt=e*3;Y[wt]=C>>16&255,Y[wt+1]=C>>8&255,Y[wt+2]=C&255;}}}}}),N){let f=t.length-h;f>1&&mt(N,h,f);}}let Mt=[];at.forEach(({index:n,src:w,unitsPerEm:h,ascender:p,descender:E,lineHeight:C,capHeight:f,xHeight:P})=>{Mt[n]={src:w,unitsPerEm:h,ascender:p,descender:E,lineHeight:C,capHeight:f,xHeight:P};}),ut.typesetting=nt()-Ut,Ot({glyphIds:dt,glyphFontIndices:yt,glyphPositions:st,glyphData:lt,fontData:Mt,caretPositions:N,glyphColors:Y,chunkedBounds:gt,fontSize:d,topBaseline:j+v[0].baseline,blockBounds:[K,j-T,K+G,j],visibleBounds:W,timings:ut});});}function Ct(t,o){Ft({...t,metricsOnly:true},g=>{let[D,d,H,_]=g.blockBounds;o({width:H-D,height:_-d});});}function bt(t){let o=t.match(/^([\d.]+)%$/),g=o?parseFloat(o[1]):NaN;return isNaN(g)?0:g/100}function mt(t,o,g){let D=t[o*4],d=t[o*4+1],H=t[o*4+2],_=t[o*4+3],B=(d-D)/g;for(let x=0;x<g;x++){let y=(o+x)*4;t[y]=D+B*x,t[y+1]=D+B*(x+1),t[y+2]=H,t[y+3]=_;}}function nt(){return (self.performance||Date).now()}function k(){this.data=[];}let z=["glyphObj","x","y","width","charIndex","fontData"];return k.prototype={width:0,lineHeight:0,baseline:0,cap:0,ex:0,isSoftWrapped:false,get count(){return Math.ceil(this.data.length/z.length)},glyphAt(t){let o=k.flyweight;return o.data=this.data,o.index=t,o},splitAt(t){let o=new k;return o.data=this.data.splice(t*z.length),o}},k.flyweight=z.reduce((t,o,g,D)=>(Object.defineProperty(t,o,{get(){return this.data[this.index*z.length+g]},set(d){this.data[this.index*z.length+g]=d;}}),t),{data:null,index:0}),{typeset:Ft,measure:Ct}}

/*!
  Three.js Blocks (@three-blocks/core)

  Proprietary Software — All Rights Reserved
  Copyright (c) 2025 three-blocks

  License Notice
  This software and all associated packages (@three-blocks/core, @three-blocks/starter,
  create-three-blocks-starter, and related tools) are licensed exclusively to active,
  paid subscribers of the threejs-blocks project. Without a valid and current subscription,
  you are NOT permitted to use this software.

  Permitted Usage (Active Subscribers Only)
  - Use in personal and commercial projects via the public API
  - Deploy applications to production environments
  - Integrate the software into your applications
  - Access updates, bug fixes, and new features during active subscription

  Restrictions
  - You may NOT reverse engineer, decompile, disassemble, or attempt to derive the
    source code, underlying algorithms, or techniques employed in this software.
  - You may NOT study, analyze, inspect, or learn from the implementation details,
    code structure, or internal workings of this software.
  - You may NOT modify, adapt, translate, or create derivative works.
  - You may NOT copy, share, distribute, publish, or resell any part of the software.
  - You may NOT sublicense or transfer rights to any third party.
  - You may NOT remove, alter, or obscure this license header or any copyright notices.
  - You may NOT use this software after your subscription has expired or been terminated.
  - You may NOT use this source code, in whole or in part, to train, fine-tune, or
    develop any artificial intelligence models, machine learning systems, or large
    language models (LLMs).
  - You may NOT feed this code into AI-assisted development tools for the purpose
    of generating derivative code, training said tools, or extracting patterns.
  - You may NOT use automated transformation tools or AI systems to create modified
    versions or derivatives of this software.

  Enforcement
  Unauthorized use, reproduction, distribution, reverse engineering, or violation of
  the AI/ML prohibition is strictly prohibited and may result in immediate termination
  of your license, civil liability, and/or criminal penalties under applicable copyright
  and contract law.

  By using this software, you acknowledge that you have read, understood, and agree to
  be bound by the complete terms of this license agreement.

  For licensing inquiries and compliance: https://threejs-blocks.com/license
*/

function V$1(){return (function(k){var p=function(){this.buckets=new Map;};p.prototype.add=function(r){var n=r>>5;this.buckets.set(n,(this.buckets.get(n)||0)|1<<(31&r));},p.prototype.has=function(r){var n=this.buckets.get(r>>5);return n!==void 0&&(n&1<<(31&r))!=0},p.prototype.serialize=function(){var r=[];return this.buckets.forEach(function(n,e){r.push((+e).toString(36)+":"+n.toString(36));}),r.join(",")},p.prototype.deserialize=function(r){var n=this;this.buckets.clear(),r.split(",").forEach(function(e){var o=e.split(":");n.buckets.set(parseInt(o[0],36),parseInt(o[1],36));});};var C=Math.pow(2,8),E=C-1,D=~E;function W(r){var n=(function(o){return o&D})(r).toString(16),e=(function(o){return (o&D)+C-1})(r).toString(16);return "codepoint-index/plane"+(r>>16)+"/"+n+"-"+e+".json"}function H(r,n){var e=r&E,o=n.codePointAt(e/6|0);return ((o=(o||48)-48)&1<<e%6)!=0}function q(r,n){var e;(e=r,e.replace(/U\+/gi,"").replace(/^,+|,+$/g,"").split(/,+/).map(function(o){return o.split("-").map(function(f){return parseInt(f.trim(),16)})})).forEach(function(o){var f=o[0],v=o[1];v===void 0&&(v=f),n(f,v);});}function N(r,n){q(r,function(e,o){for(var f=e;f<=o;f++)n(f);});}var m={},A={},_=new WeakMap,U="https://cdn.jsdelivr.net/gh/lojjic/unicode-font-resolver@v1.0.1/packages/data";function B(r){var n=_.get(r);return n||(n=new p,N(r.ranges,function(e){return n.add(e)}),_.set(r,n)),n}var j,F=new Map;function $(r,n,e){return r[n]?n:r[e]?e:(function(o){for(var f in o)return f})(r)}function G(r,n){var e=n;if(!r.includes(e)){e=1/0;for(var o=0;o<r.length;o++)Math.abs(r[o]-n)<Math.abs(e-n)&&(e=r[o]);}return e}function J(r){return j||(j=new Set,N("9-D,20,85,A0,1680,2000-200A,2028-202F,205F,3000",function(n){j.add(n);})),j.has(r)}return k.CodePointSet=p,k.clearCache=function(){m={},A={};},k.getFontsForString=function(r,n){n===void 0&&(n={});var e,o=n.lang;o===void 0&&(o=/\p{Script=Hangul}/u.test(e=r)?"ko":/\p{Script=Hiragana}|\p{Script=Katakana}/u.test(e)?"ja":"en");var f=n.category;f===void 0&&(f="sans-serif");var v=n.style;v===void 0&&(v="normal");var x=n.weight;x===void 0&&(x=400);var y=(n.dataUrl||U).replace(/\/$/g,""),M=new Map,g=new Uint8Array(r.length),K={},O={},S=new Array(r.length),d=new Map,R=false;function I(i){var a=F.get(i);return a||(a=fetch(y+"/"+i).then(function(t){if(!t.ok)throw new Error(t.statusText);return t.json().then(function(c){if(!Array.isArray(c)||c[0]!==1)throw new Error("Incorrect schema version; need 1, got "+c[0]);return c[1]})}).catch(function(t){if(y!==U)return R||(console.error('unicode-font-resolver: Failed loading from dataUrl "'+y+'", trying default CDN. '+t.message),R=true),y=U,F.delete(i),I(i);throw t}),F.set(i,a)),a}for(var L=function(i){var a=r.codePointAt(i),t=W(a);S[i]=t,m[t]||d.has(t)||d.set(t,I(t).then(function(c){m[t]=c;})),a>65535&&(i++,P=i);},P=0;P<r.length;P++)L(P);return Promise.all(d.values()).then(function(){d.clear();for(var i=function(t){var c=r.codePointAt(t),u=null,s=m[S[t]],w=void 0;for(var l in s){var b=O[l];if(b===void 0&&(b=O[l]=new RegExp(l).test(o||"en")),b){for(var h in w=l,s[l])if(H(c,s[l][h])){u=h;break}break}}if(!u){r:for(var z in s)if(z!==w){for(var T in s[z])if(H(c,s[z][T])){u=T;break r}}}u||(console.debug("No font coverage for U+"+c.toString(16)),u="latin"),S[t]=u,A[u]||d.has(u)||d.set(u,I("font-meta/"+u+".json").then(function(Q){A[u]=Q;})),c>65535&&(t++,a=t);},a=0;a<r.length;a++)i(a);return Promise.all(d.values())}).then(function(){for(var i,a=null,t=0;t<r.length;t++){var c=r.codePointAt(t);if(a&&(J(c)||B(a).has(c)))g[t]=g[t-1];else {a=A[S[t]];var u=K[a.id];if(!u){var s=a.typeforms,w=$(s,f,"sans-serif"),l=$(s[w],v,"normal"),b=G((i=s[w])===null||i===void 0?void 0:i[l],x);u=K[a.id]=y+"/font-files/"+a.id+"/"+w+"."+l+"."+b+".woff";}var h=M.get(u);h==null&&(h=M.size,M.set(u,h)),g[t]=h;}c>65535&&(t++,g[t]=g[t-1]);}return {fontUrls:Array.from(M.keys()),chars:g}})},Object.defineProperty(k,"__esModule",{value:true}),k})({})}

/*!
  Three.js Blocks (@three-blocks/core)

  Proprietary Software — All Rights Reserved
  Copyright (c) 2025 three-blocks

  License Notice
  This software and all associated packages (@three-blocks/core, @three-blocks/starter,
  create-three-blocks-starter, and related tools) are licensed exclusively to active,
  paid subscribers of the threejs-blocks project. Without a valid and current subscription,
  you are NOT permitted to use this software.

  Permitted Usage (Active Subscribers Only)
  - Use in personal and commercial projects via the public API
  - Deploy applications to production environments
  - Integrate the software into your applications
  - Access updates, bug fixes, and new features during active subscription

  Restrictions
  - You may NOT reverse engineer, decompile, disassemble, or attempt to derive the
    source code, underlying algorithms, or techniques employed in this software.
  - You may NOT study, analyze, inspect, or learn from the implementation details,
    code structure, or internal workings of this software.
  - You may NOT modify, adapt, translate, or create derivative works.
  - You may NOT copy, share, distribute, publish, or resell any part of the software.
  - You may NOT sublicense or transfer rights to any third party.
  - You may NOT remove, alter, or obscure this license header or any copyright notices.
  - You may NOT use this software after your subscription has expired or been terminated.
  - You may NOT use this source code, in whole or in part, to train, fine-tune, or
    develop any artificial intelligence models, machine learning systems, or large
    language models (LLMs).
  - You may NOT feed this code into AI-assisted development tools for the purpose
    of generating derivative code, training said tools, or extracting patterns.
  - You may NOT use automated transformation tools or AI systems to create modified
    versions or derivatives of this software.

  Enforcement
  Unauthorized use, reproduction, distribution, reverse engineering, or violation of
  the AI/ML prohibition is strictly prohibited and may result in immediate termination
  of your license, civil liability, and/or criminal penalties under applicable copyright
  and contract law.

  By using this software, you acknowledge that you have read, understood, and agree to
  be bound by the complete terms of this license agreement.

  For licensing inquiries and compliance: https://threejs-blocks.com/license
*/

function q$1(){return typeof window>"u"&&(self.window=self),(function(k){var i={parse:function(r){var e=i._bin,n=new Uint8Array(r);if(e.readASCII(n,0,4)=="ttcf"){var o=4;e.readUshort(n,o),o+=2,e.readUshort(n,o),o+=2;var a=e.readUint(n,o);o+=4;for(var s=[],t=0;t<a;t++){var h=e.readUint(n,o);o+=4,s.push(i._readFont(n,h));}return s}return [i._readFont(n,0)]},_readFont:function(r,e){var n=i._bin,o=e;n.readFixed(r,e),e+=4;var a=n.readUshort(r,e);e+=2,n.readUshort(r,e),e+=2,n.readUshort(r,e),e+=2,n.readUshort(r,e),e+=2;for(var s=["cmap","head","hhea","maxp","hmtx","name","OS/2","post","loca","glyf","kern","CFF ","GDEF","GPOS","GSUB","SVG "],t={_data:r,_offset:o},h={},d=0;d<a;d++){var f=n.readASCII(r,e,4);e+=4,n.readUint(r,e),e+=4;var v=n.readUint(r,e);e+=4;var u=n.readUint(r,e);e+=4,h[f]={offset:v,length:u};}for(d=0;d<s.length;d++){var l=s[d];h[l]&&(t[l.trim()]=i[l.trim()].parse(r,h[l].offset,h[l].length,t));}return t},_tabOffset:function(r,e,n){for(var o=i._bin,a=o.readUshort(r,n+4),s=n+12,t=0;t<a;t++){var h=o.readASCII(r,s,4);s+=4,o.readUint(r,s),s+=4;var d=o.readUint(r,s);if(s+=4,o.readUint(r,s),s+=4,h==e)return d}return 0}};i._bin={readFixed:function(r,e){return (r[e]<<8|r[e+1])+(r[e+2]<<8|r[e+3])/65540},readF2dot14:function(r,e){return i._bin.readShort(r,e)/16384},readInt:function(r,e){return i._bin._view(r).getInt32(e)},readInt8:function(r,e){return i._bin._view(r).getInt8(e)},readShort:function(r,e){return i._bin._view(r).getInt16(e)},readUshort:function(r,e){return i._bin._view(r).getUint16(e)},readUshorts:function(r,e,n){for(var o=[],a=0;a<n;a++)o.push(i._bin.readUshort(r,e+2*a));return o},readUint:function(r,e){return i._bin._view(r).getUint32(e)},readUint64:function(r,e){return 4294967296*i._bin.readUint(r,e)+i._bin.readUint(r,e+4)},readASCII:function(r,e,n){for(var o="",a=0;a<n;a++)o+=String.fromCharCode(r[e+a]);return o},readUnicode:function(r,e,n){for(var o="",a=0;a<n;a++){var s=r[e++]<<8|r[e++];o+=String.fromCharCode(s);}return o},_tdec:typeof window<"u"&&window.TextDecoder?new window.TextDecoder:null,readUTF8:function(r,e,n){var o=i._bin._tdec;return o&&e==0&&n==r.length?o.decode(r):i._bin.readASCII(r,e,n)},readBytes:function(r,e,n){for(var o=[],a=0;a<n;a++)o.push(r[e+a]);return o},readASCIIArray:function(r,e,n){for(var o=[],a=0;a<n;a++)o.push(String.fromCharCode(r[e+a]));return o},_view:function(r){return r._dataView||(r._dataView=r.buffer?new DataView(r.buffer,r.byteOffset,r.byteLength):new DataView(new Uint8Array(r).buffer))}},i._lctf={},i._lctf.parse=function(r,e,n,o,a){var s=i._bin,t={},h=e;s.readFixed(r,e),e+=4;var d=s.readUshort(r,e);e+=2;var f=s.readUshort(r,e);e+=2;var v=s.readUshort(r,e);return e+=2,t.scriptList=i._lctf.readScriptList(r,h+d),t.featureList=i._lctf.readFeatureList(r,h+f),t.lookupList=i._lctf.readLookupList(r,h+v,a),t},i._lctf.readLookupList=function(r,e,n){var o=i._bin,a=e,s=[],t=o.readUshort(r,e);e+=2;for(var h=0;h<t;h++){var d=o.readUshort(r,e);e+=2;var f=i._lctf.readLookupTable(r,a+d,n);s.push(f);}return s},i._lctf.readLookupTable=function(r,e,n){var o=i._bin,a=e,s={tabs:[]};s.ltype=o.readUshort(r,e),e+=2,s.flag=o.readUshort(r,e),e+=2;var t=o.readUshort(r,e);e+=2;for(var h=s.ltype,d=0;d<t;d++){var f=o.readUshort(r,e);e+=2;var v=n(r,h,a+f,s);s.tabs.push(v);}return s},i._lctf.numOfOnes=function(r){for(var e=0,n=0;n<32;n++)(r>>>n&1)!=0&&e++;return e},i._lctf.readClassDef=function(r,e){var n=i._bin,o=[],a=n.readUshort(r,e);if(e+=2,a==1){var s=n.readUshort(r,e);e+=2;var t=n.readUshort(r,e);e+=2;for(var h=0;h<t;h++)o.push(s+h),o.push(s+h),o.push(n.readUshort(r,e)),e+=2;}if(a==2){var d=n.readUshort(r,e);for(e+=2,h=0;h<d;h++)o.push(n.readUshort(r,e)),e+=2,o.push(n.readUshort(r,e)),e+=2,o.push(n.readUshort(r,e)),e+=2;}return o},i._lctf.getInterval=function(r,e){for(var n=0;n<r.length;n+=3){var o=r[n],a=r[n+1];if(r[n+2],o<=e&&e<=a)return n}return  -1},i._lctf.readCoverage=function(r,e){var n=i._bin,o={};o.fmt=n.readUshort(r,e),e+=2;var a=n.readUshort(r,e);return e+=2,o.fmt==1&&(o.tab=n.readUshorts(r,e,a)),o.fmt==2&&(o.tab=n.readUshorts(r,e,3*a)),o},i._lctf.coverageIndex=function(r,e){var n=r.tab;if(r.fmt==1)return n.indexOf(e);if(r.fmt==2){var o=i._lctf.getInterval(n,e);if(o!=-1)return n[o+2]+(e-n[o])}return  -1},i._lctf.readFeatureList=function(r,e){var n=i._bin,o=e,a=[],s=n.readUshort(r,e);e+=2;for(var t=0;t<s;t++){var h=n.readASCII(r,e,4);e+=4;var d=n.readUshort(r,e);e+=2;var f=i._lctf.readFeatureTable(r,o+d);f.tag=h.trim(),a.push(f);}return a},i._lctf.readFeatureTable=function(r,e){var n=i._bin,o=e,a={},s=n.readUshort(r,e);e+=2,s>0&&(a.featureParams=o+s);var t=n.readUshort(r,e);e+=2,a.tab=[];for(var h=0;h<t;h++)a.tab.push(n.readUshort(r,e+2*h));return a},i._lctf.readScriptList=function(r,e){var n=i._bin,o=e,a={},s=n.readUshort(r,e);e+=2;for(var t=0;t<s;t++){var h=n.readASCII(r,e,4);e+=4;var d=n.readUshort(r,e);e+=2,a[h.trim()]=i._lctf.readScriptTable(r,o+d);}return a},i._lctf.readScriptTable=function(r,e){var n=i._bin,o=e,a={},s=n.readUshort(r,e);e+=2,s>0&&(a.default=i._lctf.readLangSysTable(r,o+s));var t=n.readUshort(r,e);e+=2;for(var h=0;h<t;h++){var d=n.readASCII(r,e,4);e+=4;var f=n.readUshort(r,e);e+=2,a[d.trim()]=i._lctf.readLangSysTable(r,o+f);}return a},i._lctf.readLangSysTable=function(r,e){var n=i._bin,o={};n.readUshort(r,e),e+=2,o.reqFeature=n.readUshort(r,e),e+=2;var a=n.readUshort(r,e);return e+=2,o.features=n.readUshorts(r,e,a),o},i.CFF={},i.CFF.parse=function(r,e,n){var o=i._bin;(r=new Uint8Array(r.buffer,e,n))[e=0],r[++e],r[++e],r[++e],e++;var a=[];e=i.CFF.readIndex(r,e,a);for(var s=[],t=0;t<a.length-1;t++)s.push(o.readASCII(r,e+a[t],a[t+1]-a[t]));e+=a[a.length-1];var h=[];e=i.CFF.readIndex(r,e,h);var d=[];for(t=0;t<h.length-1;t++)d.push(i.CFF.readDict(r,e+h[t],e+h[t+1]));e+=h[h.length-1];var f=d[0],v=[];e=i.CFF.readIndex(r,e,v);var u=[];for(t=0;t<v.length-1;t++)u.push(o.readASCII(r,e+v[t],v[t+1]-v[t]));if(e+=v[v.length-1],i.CFF.readSubrs(r,e,f),f.CharStrings){e=f.CharStrings,v=[],e=i.CFF.readIndex(r,e,v);var l=[];for(t=0;t<v.length-1;t++)l.push(o.readBytes(r,e+v[t],v[t+1]-v[t]));f.CharStrings=l;}if(f.ROS){e=f.FDArray;var U=[];for(e=i.CFF.readIndex(r,e,U),f.FDArray=[],t=0;t<U.length-1;t++){var c=i.CFF.readDict(r,e+U[t],e+U[t+1]);i.CFF._readFDict(r,c,u),f.FDArray.push(c);}e+=U[U.length-1],e=f.FDSelect,f.FDSelect=[];var g=r[e];if(e++,g!=3)throw g;var p=o.readUshort(r,e);for(e+=2,t=0;t<p+1;t++)f.FDSelect.push(o.readUshort(r,e),r[e+2]),e+=3;}return f.Encoding&&(f.Encoding=i.CFF.readEncoding(r,f.Encoding,f.CharStrings.length)),f.charset&&(f.charset=i.CFF.readCharset(r,f.charset,f.CharStrings.length)),i.CFF._readFDict(r,f,u),f},i.CFF._readFDict=function(r,e,n){var o;for(var a in e.Private&&(o=e.Private[1],e.Private=i.CFF.readDict(r,o,o+e.Private[0]),e.Private.Subrs&&i.CFF.readSubrs(r,o+e.Private.Subrs,e.Private)),e)["FamilyName","FontName","FullName","Notice","version","Copyright"].indexOf(a)!=-1&&(e[a]=n[e[a]-426+35]);},i.CFF.readSubrs=function(r,e,n){var o=i._bin,a=[];e=i.CFF.readIndex(r,e,a);var s,t=a.length;s=t<1240?107:t<33900?1131:32768,n.Bias=s,n.Subrs=[];for(var h=0;h<a.length-1;h++)n.Subrs.push(o.readBytes(r,e+a[h],a[h+1]-a[h]));},i.CFF.tableSE=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,0,111,112,113,114,0,115,116,117,118,119,120,121,122,0,123,0,124,125,126,127,128,129,130,131,0,132,133,0,134,135,136,137,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,138,0,139,0,0,0,0,140,141,142,143,0,0,0,0,0,144,0,0,0,145,0,0,146,147,148,149,0,0,0,0],i.CFF.glyphByUnicode=function(r,e){for(var n=0;n<r.charset.length;n++)if(r.charset[n]==e)return n;return  -1},i.CFF.glyphBySE=function(r,e){return e<0||e>255?-1:i.CFF.glyphByUnicode(r,i.CFF.tableSE[e])},i.CFF.readEncoding=function(r,e,n){i._bin;var o=[".notdef"],a=r[e];if(e++,a!=0)throw "error: unknown encoding format: "+a;var s=r[e];e++;for(var t=0;t<s;t++)o.push(r[e+t]);return o},i.CFF.readCharset=function(r,e,n){var o=i._bin,a=[".notdef"],s=r[e];if(e++,s==0)for(var t=0;t<n;t++){var h=o.readUshort(r,e);e+=2,a.push(h);}else {if(s!=1&&s!=2)throw "error: format: "+s;for(;a.length<n;){h=o.readUshort(r,e),e+=2;var d=0;for(s==1?(d=r[e],e++):(d=o.readUshort(r,e),e+=2),t=0;t<=d;t++)a.push(h),h++;}}return a},i.CFF.readIndex=function(r,e,n){var o=i._bin,a=o.readUshort(r,e)+1,s=r[e+=2];if(e++,s==1)for(var t=0;t<a;t++)n.push(r[e+t]);else if(s==2)for(t=0;t<a;t++)n.push(o.readUshort(r,e+2*t));else if(s==3)for(t=0;t<a;t++)n.push(16777215&o.readUint(r,e+3*t-1));else if(a!=1)throw "unsupported offset size: "+s+", count: "+a;return (e+=a*s)-1},i.CFF.getCharString=function(r,e,n){var o=i._bin,a=r[e],s=r[e+1];r[e+2],r[e+3],r[e+4];var t=1,h=null,d=null;a<=20&&(h=a,t=1),a==12&&(h=100*a+s,t=2),21<=a&&a<=27&&(h=a,t=1),a==28&&(d=o.readShort(r,e+1),t=3),29<=a&&a<=31&&(h=a,t=1),32<=a&&a<=246&&(d=a-139,t=1),247<=a&&a<=250&&(d=256*(a-247)+s+108,t=2),251<=a&&a<=254&&(d=256*-(a-251)-s-108,t=2),a==255&&(d=o.readInt(r,e+1)/65535,t=5),n.val=d??"o"+h,n.size=t;},i.CFF.readCharString=function(r,e,n){for(var o=e+n,a=i._bin,s=[];e<o;){var t=r[e],h=r[e+1];r[e+2],r[e+3],r[e+4];var d=1,f=null,v=null;t<=20&&(f=t,d=1),t==12&&(f=100*t+h,d=2),t!=19&&t!=20||(f=t,d=2),21<=t&&t<=27&&(f=t,d=1),t==28&&(v=a.readShort(r,e+1),d=3),29<=t&&t<=31&&(f=t,d=1),32<=t&&t<=246&&(v=t-139,d=1),247<=t&&t<=250&&(v=256*(t-247)+h+108,d=2),251<=t&&t<=254&&(v=256*-(t-251)-h-108,d=2),t==255&&(v=a.readInt(r,e+1)/65535,d=5),s.push(v??"o"+f),e+=d;}return s},i.CFF.readDict=function(r,e,n){for(var o=i._bin,a={},s=[];e<n;){var t=r[e],h=r[e+1];r[e+2],r[e+3],r[e+4];var d=1,f=null,v=null;if(t==28&&(v=o.readShort(r,e+1),d=3),t==29&&(v=o.readInt(r,e+1),d=5),32<=t&&t<=246&&(v=t-139,d=1),247<=t&&t<=250&&(v=256*(t-247)+h+108,d=2),251<=t&&t<=254&&(v=256*-(t-251)-h-108,d=2),t==255)throw v=o.readInt(r,e+1)/65535,d=5,"unknown number";if(t==30){var u=[];for(d=1;;){var l=r[e+d];d++;var U=l>>4,c=15&l;if(U!=15&&u.push(U),c!=15&&u.push(c),c==15)break}for(var g="",p=[0,1,2,3,4,5,6,7,8,9,".","e","e-","reserved","-","endOfNumber"],m=0;m<u.length;m++)g+=p[u[m]];v=parseFloat(g);}t<=21&&(f=["version","Notice","FullName","FamilyName","Weight","FontBBox","BlueValues","OtherBlues","FamilyBlues","FamilyOtherBlues","StdHW","StdVW","escape","UniqueID","XUID","charset","Encoding","CharStrings","Private","Subrs","defaultWidthX","nominalWidthX"][t],d=1,t==12&&(f=["Copyright","isFixedPitch","ItalicAngle","UnderlinePosition","UnderlineThickness","PaintType","CharstringType","FontMatrix","StrokeWidth","BlueScale","BlueShift","BlueFuzz","StemSnapH","StemSnapV","ForceBold",0,0,"LanguageGroup","ExpansionFactor","initialRandomSeed","SyntheticBase","PostScript","BaseFontName","BaseFontBlend",0,0,0,0,0,0,"ROS","CIDFontVersion","CIDFontRevision","CIDFontType","CIDCount","UIDBase","FDArray","FDSelect","FontName"][h],d=2)),f!=null?(a[f]=s.length==1?s[0]:s,s=[]):s.push(v),e+=d;}return a},i.cmap={},i.cmap.parse=function(r,e,n){r=new Uint8Array(r.buffer,e,n),e=0;var o=i._bin,a={};o.readUshort(r,e),e+=2;var s=o.readUshort(r,e);e+=2;var t=[];a.tables=[];for(var h=0;h<s;h++){var d=o.readUshort(r,e);e+=2;var f=o.readUshort(r,e);e+=2;var v=o.readUint(r,e);e+=4;var u="p"+d+"e"+f,l=t.indexOf(v);if(l==-1){var U;l=a.tables.length,t.push(v);var c=o.readUshort(r,v);c==0?U=i.cmap.parse0(r,v):c==4?U=i.cmap.parse4(r,v):c==6?U=i.cmap.parse6(r,v):c==12?U=i.cmap.parse12(r,v):U=null,a.tables.push(U);}if(a[u]!=null)throw "multiple tables for one platform+encoding";a[u]=l;}return a},i.cmap.parse0=function(r,e){var n=i._bin,o={};o.format=n.readUshort(r,e),e+=2;var a=n.readUshort(r,e);e+=2,n.readUshort(r,e),e+=2,o.map=[];for(var s=0;s<a-6;s++)o.map.push(r[e+s]);return o},i.cmap.parse4=function(r,e){var n=i._bin,o=e,a={};a.format=n.readUshort(r,e),e+=2;var s=n.readUshort(r,e);e+=2,n.readUshort(r,e),e+=2;var t=n.readUshort(r,e);e+=2;var h=t/2;a.searchRange=n.readUshort(r,e),e+=2,a.entrySelector=n.readUshort(r,e),e+=2,a.rangeShift=n.readUshort(r,e),e+=2,a.endCount=n.readUshorts(r,e,h),e+=2*h,e+=2,a.startCount=n.readUshorts(r,e,h),e+=2*h,a.idDelta=[];for(var d=0;d<h;d++)a.idDelta.push(n.readShort(r,e)),e+=2;for(a.idRangeOffset=n.readUshorts(r,e,h),e+=2*h,a.glyphIdArray=[];e<o+s;)a.glyphIdArray.push(n.readUshort(r,e)),e+=2;return a},i.cmap.parse6=function(r,e){var n=i._bin,o={};o.format=n.readUshort(r,e),e+=2,n.readUshort(r,e),e+=2,n.readUshort(r,e),e+=2,o.firstCode=n.readUshort(r,e),e+=2;var a=n.readUshort(r,e);e+=2,o.glyphIdArray=[];for(var s=0;s<a;s++)o.glyphIdArray.push(n.readUshort(r,e)),e+=2;return o},i.cmap.parse12=function(r,e){var n=i._bin,o={};o.format=n.readUshort(r,e),e+=2,e+=2,n.readUint(r,e),e+=4,n.readUint(r,e),e+=4;var a=n.readUint(r,e);e+=4,o.groups=[];for(var s=0;s<a;s++){var t=e+12*s,h=n.readUint(r,t+0),d=n.readUint(r,t+4),f=n.readUint(r,t+8);o.groups.push([h,d,f]);}return o},i.glyf={},i.glyf.parse=function(r,e,n,o){for(var a=[],s=0;s<o.maxp.numGlyphs;s++)a.push(null);return a},i.glyf._parseGlyf=function(r,e){var n=i._bin,o=r._data,a=i._tabOffset(o,"glyf",r._offset)+r.loca[e];if(r.loca[e]==r.loca[e+1])return null;var s={};if(s.noc=n.readShort(o,a),a+=2,s.xMin=n.readShort(o,a),a+=2,s.yMin=n.readShort(o,a),a+=2,s.xMax=n.readShort(o,a),a+=2,s.yMax=n.readShort(o,a),a+=2,s.xMin>=s.xMax||s.yMin>=s.yMax)return null;if(s.noc>0){s.endPts=[];for(var t=0;t<s.noc;t++)s.endPts.push(n.readUshort(o,a)),a+=2;var h=n.readUshort(o,a);if(a+=2,o.length-a<h)return null;s.instructions=n.readBytes(o,a,h),a+=h;var d=s.endPts[s.noc-1]+1;for(s.flags=[],t=0;t<d;t++){var f=o[a];if(a++,s.flags.push(f),(8&f)!=0){var v=o[a];a++;for(var u=0;u<v;u++)s.flags.push(f),t++;}}for(s.xs=[],t=0;t<d;t++){var l=(2&s.flags[t])!=0,U=(16&s.flags[t])!=0;l?(s.xs.push(U?o[a]:-o[a]),a++):U?s.xs.push(0):(s.xs.push(n.readShort(o,a)),a+=2);}for(s.ys=[],t=0;t<d;t++)l=(4&s.flags[t])!=0,U=(32&s.flags[t])!=0,l?(s.ys.push(U?o[a]:-o[a]),a++):U?s.ys.push(0):(s.ys.push(n.readShort(o,a)),a+=2);var c=0,g=0;for(t=0;t<d;t++)c+=s.xs[t],g+=s.ys[t],s.xs[t]=c,s.ys[t]=g;}else {var p;s.parts=[];do{p=n.readUshort(o,a),a+=2;var m={m:{a:1,b:0,c:0,d:1,tx:0,ty:0},p1:-1,p2:-1};if(s.parts.push(m),m.glyphIndex=n.readUshort(o,a),a+=2,1&p){var y=n.readShort(o,a);a+=2;var F=n.readShort(o,a);a+=2;}else y=n.readInt8(o,a),a++,F=n.readInt8(o,a),a++;2&p?(m.m.tx=y,m.m.ty=F):(m.p1=y,m.p2=F),8&p?(m.m.a=m.m.d=n.readF2dot14(o,a),a+=2):64&p?(m.m.a=n.readF2dot14(o,a),a+=2,m.m.d=n.readF2dot14(o,a),a+=2):128&p&&(m.m.a=n.readF2dot14(o,a),a+=2,m.m.b=n.readF2dot14(o,a),a+=2,m.m.c=n.readF2dot14(o,a),a+=2,m.m.d=n.readF2dot14(o,a),a+=2);}while(32&p);if(256&p){var b=n.readUshort(o,a);for(a+=2,s.instr=[],t=0;t<b;t++)s.instr.push(o[a]),a++;}}return s},i.GDEF={},i.GDEF.parse=function(r,e,n,o){var a=e;e+=4;var s=i._bin.readUshort(r,e);return {glyphClassDef:s===0?null:i._lctf.readClassDef(r,a+s)}},i.GPOS={},i.GPOS.parse=function(r,e,n,o){return i._lctf.parse(r,e,n,o,i.GPOS.subt)},i.GPOS.subt=function(r,e,n,o){var a=i._bin,s=n,t={};if(t.fmt=a.readUshort(r,n),n+=2,e==1||e==2||e==3||e==7||e==8&&t.fmt<=2){var h=a.readUshort(r,n);n+=2,t.coverage=i._lctf.readCoverage(r,h+s);}if(e==1&&t.fmt==1){var d=a.readUshort(r,n);n+=2,d!=0&&(t.pos=i.GPOS.readValueRecord(r,n,d));}else if(e==2&&t.fmt>=1&&t.fmt<=2){d=a.readUshort(r,n),n+=2;var f=a.readUshort(r,n);n+=2;var v=i._lctf.numOfOnes(d),u=i._lctf.numOfOnes(f);if(t.fmt==1){t.pairsets=[];var l=a.readUshort(r,n);n+=2;for(var U=0;U<l;U++){var c=s+a.readUshort(r,n);n+=2;var g=a.readUshort(r,c);c+=2;for(var p=[],m=0;m<g;m++){var y=a.readUshort(r,c);c+=2,d!=0&&(S=i.GPOS.readValueRecord(r,c,d),c+=2*v),f!=0&&(x=i.GPOS.readValueRecord(r,c,f),c+=2*u),p.push({gid2:y,val1:S,val2:x});}t.pairsets.push(p);}}if(t.fmt==2){var F=a.readUshort(r,n);n+=2;var b=a.readUshort(r,n);n+=2;var C=a.readUshort(r,n);n+=2;var _=a.readUshort(r,n);for(n+=2,t.classDef1=i._lctf.readClassDef(r,s+F),t.classDef2=i._lctf.readClassDef(r,s+b),t.matrix=[],U=0;U<C;U++){var I=[];for(m=0;m<_;m++){var S=null,x=null;d!=0&&(S=i.GPOS.readValueRecord(r,n,d),n+=2*v),f!=0&&(x=i.GPOS.readValueRecord(r,n,f),n+=2*u),I.push({val1:S,val2:x});}t.matrix.push(I);}}}else if(e==4&&t.fmt==1)t.markCoverage=i._lctf.readCoverage(r,a.readUshort(r,n)+s),t.baseCoverage=i._lctf.readCoverage(r,a.readUshort(r,n+2)+s),t.markClassCount=a.readUshort(r,n+4),t.markArray=i.GPOS.readMarkArray(r,a.readUshort(r,n+6)+s),t.baseArray=i.GPOS.readBaseArray(r,a.readUshort(r,n+8)+s,t.markClassCount);else if(e==6&&t.fmt==1)t.mark1Coverage=i._lctf.readCoverage(r,a.readUshort(r,n)+s),t.mark2Coverage=i._lctf.readCoverage(r,a.readUshort(r,n+2)+s),t.markClassCount=a.readUshort(r,n+4),t.mark1Array=i.GPOS.readMarkArray(r,a.readUshort(r,n+6)+s),t.mark2Array=i.GPOS.readBaseArray(r,a.readUshort(r,n+8)+s,t.markClassCount);else if(e==9&&t.fmt==1){var O=a.readUshort(r,n);n+=2;var P=a.readUint(r,n);if(n+=4,o.ltype==9)o.ltype=O;else if(o.ltype!=O)throw "invalid extension substitution";return i.GPOS.subt(r,o.ltype,s+P)}return t},i.GPOS.readValueRecord=function(r,e,n){var o=i._bin,a=[];return a.push(1&n?o.readShort(r,e):0),e+=1&n?2:0,a.push(2&n?o.readShort(r,e):0),e+=2&n?2:0,a.push(4&n?o.readShort(r,e):0),e+=4&n?2:0,a.push(8&n?o.readShort(r,e):0),e+=8&n?2:0,a},i.GPOS.readBaseArray=function(r,e,n){var o=i._bin,a=[],s=e,t=o.readUshort(r,e);e+=2;for(var h=0;h<t;h++){for(var d=[],f=0;f<n;f++)d.push(i.GPOS.readAnchorRecord(r,s+o.readUshort(r,e))),e+=2;a.push(d);}return a},i.GPOS.readMarkArray=function(r,e){var n=i._bin,o=[],a=e,s=n.readUshort(r,e);e+=2;for(var t=0;t<s;t++){var h=i.GPOS.readAnchorRecord(r,n.readUshort(r,e+2)+a);h.markClass=n.readUshort(r,e),o.push(h),e+=4;}return o},i.GPOS.readAnchorRecord=function(r,e){var n=i._bin,o={};return o.fmt=n.readUshort(r,e),o.x=n.readShort(r,e+2),o.y=n.readShort(r,e+4),o},i.GSUB={},i.GSUB.parse=function(r,e,n,o){return i._lctf.parse(r,e,n,o,i.GSUB.subt)},i.GSUB.subt=function(r,e,n,o){var a=i._bin,s=n,t={};if(t.fmt=a.readUshort(r,n),n+=2,e!=1&&e!=2&&e!=4&&e!=5&&e!=6)return null;if(e==1||e==2||e==4||e==5&&t.fmt<=2||e==6&&t.fmt<=2){var h=a.readUshort(r,n);n+=2,t.coverage=i._lctf.readCoverage(r,s+h);}if(e==1&&t.fmt>=1&&t.fmt<=2){if(t.fmt==1)t.delta=a.readShort(r,n),n+=2;else if(t.fmt==2){var d=a.readUshort(r,n);n+=2,t.newg=a.readUshorts(r,n,d),n+=2*t.newg.length;}}else if(e==2&&t.fmt==1){d=a.readUshort(r,n),n+=2,t.seqs=[];for(var f=0;f<d;f++){var v=a.readUshort(r,n)+s;n+=2;var u=a.readUshort(r,v);t.seqs.push(a.readUshorts(r,v+2,u));}}else if(e==4)for(t.vals=[],d=a.readUshort(r,n),n+=2,f=0;f<d;f++){var l=a.readUshort(r,n);n+=2,t.vals.push(i.GSUB.readLigatureSet(r,s+l));}else if(e==5&&t.fmt==2){if(t.fmt==2){var U=a.readUshort(r,n);n+=2,t.cDef=i._lctf.readClassDef(r,s+U),t.scset=[];var c=a.readUshort(r,n);for(n+=2,f=0;f<c;f++){var g=a.readUshort(r,n);n+=2,t.scset.push(g==0?null:i.GSUB.readSubClassSet(r,s+g));}}}else if(e==6&&t.fmt==3){if(t.fmt==3){for(f=0;f<3;f++){d=a.readUshort(r,n),n+=2;for(var p=[],m=0;m<d;m++)p.push(i._lctf.readCoverage(r,s+a.readUshort(r,n+2*m)));n+=2*d,f==0&&(t.backCvg=p),f==1&&(t.inptCvg=p),f==2&&(t.ahedCvg=p);}d=a.readUshort(r,n),n+=2,t.lookupRec=i.GSUB.readSubstLookupRecords(r,n,d);}}else if(e==7&&t.fmt==1){var y=a.readUshort(r,n);n+=2;var F=a.readUint(r,n);if(n+=4,o.ltype==9)o.ltype=y;else if(o.ltype!=y)throw "invalid extension substitution";return i.GSUB.subt(r,o.ltype,s+F)}return t},i.GSUB.readSubClassSet=function(r,e){var n=i._bin.readUshort,o=e,a=[],s=n(r,e);e+=2;for(var t=0;t<s;t++){var h=n(r,e);e+=2,a.push(i.GSUB.readSubClassRule(r,o+h));}return a},i.GSUB.readSubClassRule=function(r,e){var n=i._bin.readUshort,o={},a=n(r,e),s=n(r,e+=2);e+=2,o.input=[];for(var t=0;t<a-1;t++)o.input.push(n(r,e)),e+=2;return o.substLookupRecords=i.GSUB.readSubstLookupRecords(r,e,s),o},i.GSUB.readSubstLookupRecords=function(r,e,n){for(var o=i._bin.readUshort,a=[],s=0;s<n;s++)a.push(o(r,e),o(r,e+2)),e+=4;return a},i.GSUB.readChainSubClassSet=function(r,e){var n=i._bin,o=e,a=[],s=n.readUshort(r,e);e+=2;for(var t=0;t<s;t++){var h=n.readUshort(r,e);e+=2,a.push(i.GSUB.readChainSubClassRule(r,o+h));}return a},i.GSUB.readChainSubClassRule=function(r,e){for(var n=i._bin,o={},a=["backtrack","input","lookahead"],s=0;s<a.length;s++){var t=n.readUshort(r,e);e+=2,s==1&&t--,o[a[s]]=n.readUshorts(r,e,t),e+=2*o[a[s]].length;}return t=n.readUshort(r,e),e+=2,o.subst=n.readUshorts(r,e,2*t),e+=2*o.subst.length,o},i.GSUB.readLigatureSet=function(r,e){var n=i._bin,o=e,a=[],s=n.readUshort(r,e);e+=2;for(var t=0;t<s;t++){var h=n.readUshort(r,e);e+=2,a.push(i.GSUB.readLigature(r,o+h));}return a},i.GSUB.readLigature=function(r,e){var n=i._bin,o={chain:[]};o.nglyph=n.readUshort(r,e),e+=2;var a=n.readUshort(r,e);e+=2;for(var s=0;s<a-1;s++)o.chain.push(n.readUshort(r,e)),e+=2;return o},i.head={},i.head.parse=function(r,e,n){var o=i._bin,a={};return o.readFixed(r,e),e+=4,a.fontRevision=o.readFixed(r,e),e+=4,o.readUint(r,e),e+=4,o.readUint(r,e),e+=4,a.flags=o.readUshort(r,e),e+=2,a.unitsPerEm=o.readUshort(r,e),e+=2,a.created=o.readUint64(r,e),e+=8,a.modified=o.readUint64(r,e),e+=8,a.xMin=o.readShort(r,e),e+=2,a.yMin=o.readShort(r,e),e+=2,a.xMax=o.readShort(r,e),e+=2,a.yMax=o.readShort(r,e),e+=2,a.macStyle=o.readUshort(r,e),e+=2,a.lowestRecPPEM=o.readUshort(r,e),e+=2,a.fontDirectionHint=o.readShort(r,e),e+=2,a.indexToLocFormat=o.readShort(r,e),e+=2,a.glyphDataFormat=o.readShort(r,e),e+=2,a},i.hhea={},i.hhea.parse=function(r,e,n){var o=i._bin,a={};return o.readFixed(r,e),e+=4,a.ascender=o.readShort(r,e),e+=2,a.descender=o.readShort(r,e),e+=2,a.lineGap=o.readShort(r,e),e+=2,a.advanceWidthMax=o.readUshort(r,e),e+=2,a.minLeftSideBearing=o.readShort(r,e),e+=2,a.minRightSideBearing=o.readShort(r,e),e+=2,a.xMaxExtent=o.readShort(r,e),e+=2,a.caretSlopeRise=o.readShort(r,e),e+=2,a.caretSlopeRun=o.readShort(r,e),e+=2,a.caretOffset=o.readShort(r,e),e+=2,e+=8,a.metricDataFormat=o.readShort(r,e),e+=2,a.numberOfHMetrics=o.readUshort(r,e),e+=2,a},i.hmtx={},i.hmtx.parse=function(r,e,n,o){for(var a=i._bin,s={aWidth:[],lsBearing:[]},t=0,h=0,d=0;d<o.maxp.numGlyphs;d++)d<o.hhea.numberOfHMetrics&&(t=a.readUshort(r,e),e+=2,h=a.readShort(r,e),e+=2),s.aWidth.push(t),s.lsBearing.push(h);return s},i.kern={},i.kern.parse=function(r,e,n,o){var a=i._bin,s=a.readUshort(r,e);if(e+=2,s==1)return i.kern.parseV1(r,e-2,n,o);var t=a.readUshort(r,e);e+=2;for(var h={glyph1:[],rval:[]},d=0;d<t;d++){e+=2,n=a.readUshort(r,e),e+=2;var f=a.readUshort(r,e);e+=2;var v=f>>>8;if((v&=15)!=0)throw "unknown kern table format: "+v;e=i.kern.readFormat0(r,e,h);}return h},i.kern.parseV1=function(r,e,n,o){var a=i._bin;a.readFixed(r,e),e+=4;var s=a.readUint(r,e);e+=4;for(var t={glyph1:[],rval:[]},h=0;h<s;h++){a.readUint(r,e),e+=4;var d=a.readUshort(r,e);e+=2,a.readUshort(r,e),e+=2;var f=d>>>8;if((f&=15)!=0)throw "unknown kern table format: "+f;e=i.kern.readFormat0(r,e,t);}return t},i.kern.readFormat0=function(r,e,n){var o=i._bin,a=-1,s=o.readUshort(r,e);e+=2,o.readUshort(r,e),e+=2,o.readUshort(r,e),e+=2,o.readUshort(r,e),e+=2;for(var t=0;t<s;t++){var h=o.readUshort(r,e);e+=2;var d=o.readUshort(r,e);e+=2;var f=o.readShort(r,e);e+=2,h!=a&&(n.glyph1.push(h),n.rval.push({glyph2:[],vals:[]}));var v=n.rval[n.rval.length-1];v.glyph2.push(d),v.vals.push(f),a=h;}return e},i.loca={},i.loca.parse=function(r,e,n,o){var a=i._bin,s=[],t=o.head.indexToLocFormat,h=o.maxp.numGlyphs+1;if(t==0)for(var d=0;d<h;d++)s.push(a.readUshort(r,e+(d<<1))<<1);if(t==1)for(d=0;d<h;d++)s.push(a.readUint(r,e+(d<<2)));return s},i.maxp={},i.maxp.parse=function(r,e,n){var o=i._bin,a={},s=o.readUint(r,e);return e+=4,a.numGlyphs=o.readUshort(r,e),e+=2,s==65536&&(a.maxPoints=o.readUshort(r,e),e+=2,a.maxContours=o.readUshort(r,e),e+=2,a.maxCompositePoints=o.readUshort(r,e),e+=2,a.maxCompositeContours=o.readUshort(r,e),e+=2,a.maxZones=o.readUshort(r,e),e+=2,a.maxTwilightPoints=o.readUshort(r,e),e+=2,a.maxStorage=o.readUshort(r,e),e+=2,a.maxFunctionDefs=o.readUshort(r,e),e+=2,a.maxInstructionDefs=o.readUshort(r,e),e+=2,a.maxStackElements=o.readUshort(r,e),e+=2,a.maxSizeOfInstructions=o.readUshort(r,e),e+=2,a.maxComponentElements=o.readUshort(r,e),e+=2,a.maxComponentDepth=o.readUshort(r,e),e+=2),a},i.name={},i.name.parse=function(r,e,n){var o=i._bin,a={};o.readUshort(r,e),e+=2;var s=o.readUshort(r,e);e+=2,o.readUshort(r,e);for(var t,h=["copyright","fontFamily","fontSubfamily","ID","fullName","version","postScriptName","trademark","manufacturer","designer","description","urlVendor","urlDesigner","licence","licenceURL","---","typoFamilyName","typoSubfamilyName","compatibleFull","sampleText","postScriptCID","wwsFamilyName","wwsSubfamilyName","lightPalette","darkPalette"],d=e+=2,f=0;f<s;f++){var v=o.readUshort(r,e);e+=2;var u=o.readUshort(r,e);e+=2;var l=o.readUshort(r,e);e+=2;var U=o.readUshort(r,e);e+=2;var c=o.readUshort(r,e);e+=2;var g=o.readUshort(r,e);e+=2;var p,m=h[U],y=d+12*s+g;if(v==0)p=o.readUnicode(r,y,c/2);else if(v==3&&u==0)p=o.readUnicode(r,y,c/2);else if(u==0)p=o.readASCII(r,y,c);else if(u==1)p=o.readUnicode(r,y,c/2);else if(u==3)p=o.readUnicode(r,y,c/2);else {if(v!=1)throw "unknown encoding "+u+", platformID: "+v;p=o.readASCII(r,y,c),console.debug("reading unknown MAC encoding "+u+" as ASCII");}var F="p"+v+","+l.toString(16);a[F]==null&&(a[F]={}),a[F][m!==void 0?m:U]=p,a[F]._lang=l;}for(var b in a)if(a[b].postScriptName!=null&&a[b]._lang==1033)return a[b];for(var b in a)if(a[b].postScriptName!=null&&a[b]._lang==0)return a[b];for(var b in a)if(a[b].postScriptName!=null&&a[b]._lang==3084)return a[b];for(var b in a)if(a[b].postScriptName!=null)return a[b];for(var b in a){t=b;break}return console.debug("returning name table with languageID "+a[t]._lang),a[t]},i["OS/2"]={},i["OS/2"].parse=function(r,e,n){var o=i._bin.readUshort(r,e);e+=2;var a={};if(o==0)i["OS/2"].version0(r,e,a);else if(o==1)i["OS/2"].version1(r,e,a);else if(o==2||o==3||o==4)i["OS/2"].version2(r,e,a);else {if(o!=5)throw "unknown OS/2 table version: "+o;i["OS/2"].version5(r,e,a);}return a},i["OS/2"].version0=function(r,e,n){var o=i._bin;return n.xAvgCharWidth=o.readShort(r,e),e+=2,n.usWeightClass=o.readUshort(r,e),e+=2,n.usWidthClass=o.readUshort(r,e),e+=2,n.fsType=o.readUshort(r,e),e+=2,n.ySubscriptXSize=o.readShort(r,e),e+=2,n.ySubscriptYSize=o.readShort(r,e),e+=2,n.ySubscriptXOffset=o.readShort(r,e),e+=2,n.ySubscriptYOffset=o.readShort(r,e),e+=2,n.ySuperscriptXSize=o.readShort(r,e),e+=2,n.ySuperscriptYSize=o.readShort(r,e),e+=2,n.ySuperscriptXOffset=o.readShort(r,e),e+=2,n.ySuperscriptYOffset=o.readShort(r,e),e+=2,n.yStrikeoutSize=o.readShort(r,e),e+=2,n.yStrikeoutPosition=o.readShort(r,e),e+=2,n.sFamilyClass=o.readShort(r,e),e+=2,n.panose=o.readBytes(r,e,10),e+=10,n.ulUnicodeRange1=o.readUint(r,e),e+=4,n.ulUnicodeRange2=o.readUint(r,e),e+=4,n.ulUnicodeRange3=o.readUint(r,e),e+=4,n.ulUnicodeRange4=o.readUint(r,e),e+=4,n.achVendID=[o.readInt8(r,e),o.readInt8(r,e+1),o.readInt8(r,e+2),o.readInt8(r,e+3)],e+=4,n.fsSelection=o.readUshort(r,e),e+=2,n.usFirstCharIndex=o.readUshort(r,e),e+=2,n.usLastCharIndex=o.readUshort(r,e),e+=2,n.sTypoAscender=o.readShort(r,e),e+=2,n.sTypoDescender=o.readShort(r,e),e+=2,n.sTypoLineGap=o.readShort(r,e),e+=2,n.usWinAscent=o.readUshort(r,e),e+=2,n.usWinDescent=o.readUshort(r,e),e+=2},i["OS/2"].version1=function(r,e,n){var o=i._bin;return e=i["OS/2"].version0(r,e,n),n.ulCodePageRange1=o.readUint(r,e),e+=4,n.ulCodePageRange2=o.readUint(r,e),e+=4},i["OS/2"].version2=function(r,e,n){var o=i._bin;return e=i["OS/2"].version1(r,e,n),n.sxHeight=o.readShort(r,e),e+=2,n.sCapHeight=o.readShort(r,e),e+=2,n.usDefault=o.readUshort(r,e),e+=2,n.usBreak=o.readUshort(r,e),e+=2,n.usMaxContext=o.readUshort(r,e),e+=2},i["OS/2"].version5=function(r,e,n){var o=i._bin;return e=i["OS/2"].version2(r,e,n),n.usLowerOpticalPointSize=o.readUshort(r,e),e+=2,n.usUpperOpticalPointSize=o.readUshort(r,e),e+=2},i.post={},i.post.parse=function(r,e,n){var o=i._bin,a={};return a.version=o.readFixed(r,e),e+=4,a.italicAngle=o.readFixed(r,e),e+=4,a.underlinePosition=o.readShort(r,e),e+=2,a.underlineThickness=o.readShort(r,e),e+=2,a},i==null&&(i={}),i.U==null&&(i.U={}),i.U.codeToGlyph=function(r,e){var n=r.cmap,o=-1;if(n.p0e4!=null?o=n.p0e4:n.p3e1!=null?o=n.p3e1:n.p1e0!=null?o=n.p1e0:n.p0e3!=null&&(o=n.p0e3),o==-1)throw "no familiar platform and encoding!";var a=n.tables[o];if(a.format==0)return e>=a.map.length?0:a.map[e];if(a.format==4){for(var s=-1,t=0;t<a.endCount.length;t++)if(e<=a.endCount[t]){s=t;break}return s==-1||a.startCount[s]>e?0:65535&(a.idRangeOffset[s]!=0?a.glyphIdArray[e-a.startCount[s]+(a.idRangeOffset[s]>>1)-(a.idRangeOffset.length-s)]:e+a.idDelta[s])}if(a.format==12){if(e>a.groups[a.groups.length-1][1])return 0;for(t=0;t<a.groups.length;t++){var h=a.groups[t];if(h[0]<=e&&e<=h[1])return h[2]+(e-h[0])}return 0}throw "unknown cmap table format "+a.format},i.U.glyphToPath=function(r,e){var n={cmds:[],crds:[]};if(r.SVG&&r.SVG.entries[e]){var o=r.SVG.entries[e];return o==null?n:(typeof o=="string"&&(o=i.SVG.toPath(o),r.SVG.entries[e]=o),o)}if(r.CFF){var a={x:0,y:0,stack:[],nStems:0,haveWidth:false,width:r.CFF.Private?r.CFF.Private.defaultWidthX:0,open:false},s=r.CFF,t=r.CFF.Private;if(s.ROS){for(var h=0;s.FDSelect[h+2]<=e;)h+=2;t=s.FDArray[s.FDSelect[h+1]].Private;}i.U._drawCFF(r.CFF.CharStrings[e],a,s,t,n);}else r.glyf&&i.U._drawGlyf(e,r,n);return n},i.U._drawGlyf=function(r,e,n){var o=e.glyf[r];o==null&&(o=e.glyf[r]=i.glyf._parseGlyf(e,r)),o!=null&&(o.noc>-1?i.U._simpleGlyph(o,n):i.U._compoGlyph(o,e,n));},i.U._simpleGlyph=function(r,e){for(var n=0;n<r.noc;n++){for(var o=n==0?0:r.endPts[n-1]+1,a=r.endPts[n],s=o;s<=a;s++){var t=s==o?a:s-1,h=s==a?o:s+1,d=1&r.flags[s],f=1&r.flags[t],v=1&r.flags[h],u=r.xs[s],l=r.ys[s];if(s==o)if(d){if(!f){i.U.P.moveTo(e,u,l);continue}i.U.P.moveTo(e,r.xs[t],r.ys[t]);}else f?i.U.P.moveTo(e,r.xs[t],r.ys[t]):i.U.P.moveTo(e,(r.xs[t]+u)/2,(r.ys[t]+l)/2);d?f&&i.U.P.lineTo(e,u,l):v?i.U.P.qcurveTo(e,u,l,r.xs[h],r.ys[h]):i.U.P.qcurveTo(e,u,l,(u+r.xs[h])/2,(l+r.ys[h])/2);}i.U.P.closePath(e);}},i.U._compoGlyph=function(r,e,n){for(var o=0;o<r.parts.length;o++){var a={cmds:[],crds:[]},s=r.parts[o];i.U._drawGlyf(s.glyphIndex,e,a);for(var t=s.m,h=0;h<a.crds.length;h+=2){var d=a.crds[h],f=a.crds[h+1];n.crds.push(d*t.a+f*t.b+t.tx),n.crds.push(d*t.c+f*t.d+t.ty);}for(h=0;h<a.cmds.length;h++)n.cmds.push(a.cmds[h]);}},i.U._getGlyphClass=function(r,e){var n=i._lctf.getInterval(e,r);return n==-1?0:e[n+2]},i.U._applySubs=function(r,e,n,o){for(var a=r.length-e-1,s=0;s<n.tabs.length;s++)if(n.tabs[s]!=null){var t,h=n.tabs[s];if(!h.coverage||(t=i._lctf.coverageIndex(h.coverage,r[e]))!=-1){if(n.ltype==1)r[e],h.fmt==1?r[e]=r[e]+h.delta:r[e]=h.newg[t];else if(n.ltype==4)for(var d=h.vals[t],f=0;f<d.length;f++){var v=d[f],u=v.chain.length;if(!(u>a)){for(var l=true,U=0,c=0;c<u;c++){for(;r[e+U+(1+c)]==-1;)U++;v.chain[c]!=r[e+U+(1+c)]&&(l=false);}if(l){for(r[e]=v.nglyph,c=0;c<u+U;c++)r[e+c+1]=-1;break}}}else if(n.ltype==5&&h.fmt==2)for(var g=i._lctf.getInterval(h.cDef,r[e]),p=h.cDef[g+2],m=h.scset[p],y=0;y<m.length;y++){var F=m[y],b=F.input;if(!(b.length>a)){for(l=true,c=0;c<b.length;c++){var C=i._lctf.getInterval(h.cDef,r[e+1+c]);if(g==-1&&h.cDef[C+2]!=b[c]){l=false;break}}if(l){var _=F.substLookupRecords;for(f=0;f<_.length;f+=2)_[f],_[f+1];}}}else if(n.ltype==6&&h.fmt==3){if(!i.U._glsCovered(r,h.backCvg,e-h.backCvg.length)||!i.U._glsCovered(r,h.inptCvg,e)||!i.U._glsCovered(r,h.ahedCvg,e+h.inptCvg.length))continue;var I=h.lookupRec;for(y=0;y<I.length;y+=2){g=I[y];var S=o[I[y+1]];i.U._applySubs(r,e+g,S,o);}}}}},i.U._glsCovered=function(r,e,n){for(var o=0;o<e.length;o++)if(i._lctf.coverageIndex(e[o],r[n+o])==-1)return  false;return  true},i.U.glyphsToPath=function(r,e,n){for(var o={cmds:[],crds:[]},a=0,s=0;s<e.length;s++){var t=e[s];if(t!=-1){for(var h=s<e.length-1&&e[s+1]!=-1?e[s+1]:0,d=i.U.glyphToPath(r,t),f=0;f<d.crds.length;f+=2)o.crds.push(d.crds[f]+a),o.crds.push(d.crds[f+1]);for(n&&o.cmds.push(n),f=0;f<d.cmds.length;f++)o.cmds.push(d.cmds[f]);n&&o.cmds.push("X"),a+=r.hmtx.aWidth[t],s<e.length-1&&(a+=i.U.getPairAdjustment(r,t,h));}}return o},i.U.P={},i.U.P.moveTo=function(r,e,n){r.cmds.push("M"),r.crds.push(e,n);},i.U.P.lineTo=function(r,e,n){r.cmds.push("L"),r.crds.push(e,n);},i.U.P.curveTo=function(r,e,n,o,a,s,t){r.cmds.push("C"),r.crds.push(e,n,o,a,s,t);},i.U.P.qcurveTo=function(r,e,n,o,a){r.cmds.push("Q"),r.crds.push(e,n,o,a);},i.U.P.closePath=function(r){r.cmds.push("Z");},i.U._drawCFF=function(r,e,n,o,a){for(var s=e.stack,t=e.nStems,h=e.haveWidth,d=e.width,f=e.open,v=0,u=e.x,l=e.y,U=0,c=0,g=0,p=0,m=0,y=0,F=0,b=0,C=0,_=0,I={val:0,size:0};v<r.length;){i.CFF.getCharString(r,v,I);var S=I.val;if(v+=I.size,S=="o1"||S=="o18")s.length%2!=0&&!h&&(d=s.shift()+o.nominalWidthX),t+=s.length>>1,s.length=0,h=true;else if(S=="o3"||S=="o23")s.length%2!=0&&!h&&(d=s.shift()+o.nominalWidthX),t+=s.length>>1,s.length=0,h=true;else if(S=="o4")s.length>1&&!h&&(d=s.shift()+o.nominalWidthX,h=true),f&&i.U.P.closePath(a),l+=s.pop(),i.U.P.moveTo(a,u,l),f=true;else if(S=="o5")for(;s.length>0;)u+=s.shift(),l+=s.shift(),i.U.P.lineTo(a,u,l);else if(S=="o6"||S=="o7")for(var x=s.length,O=S=="o6",P=0;P<x;P++){var G=s.shift();O?u+=G:l+=G,O=!O,i.U.P.lineTo(a,u,l);}else if(S=="o8"||S=="o24"){x=s.length;for(var w=0;w+6<=x;)U=u+s.shift(),c=l+s.shift(),g=U+s.shift(),p=c+s.shift(),u=g+s.shift(),l=p+s.shift(),i.U.P.curveTo(a,U,c,g,p,u,l),w+=6;S=="o24"&&(u+=s.shift(),l+=s.shift(),i.U.P.lineTo(a,u,l));}else {if(S=="o11")break;if(S=="o1234"||S=="o1235"||S=="o1236"||S=="o1237")S=="o1234"&&(c=l,g=(U=u+s.shift())+s.shift(),_=p=c+s.shift(),y=p,b=l,u=(F=(m=(C=g+s.shift())+s.shift())+s.shift())+s.shift(),i.U.P.curveTo(a,U,c,g,p,C,_),i.U.P.curveTo(a,m,y,F,b,u,l)),S=="o1235"&&(U=u+s.shift(),c=l+s.shift(),g=U+s.shift(),p=c+s.shift(),C=g+s.shift(),_=p+s.shift(),m=C+s.shift(),y=_+s.shift(),F=m+s.shift(),b=y+s.shift(),u=F+s.shift(),l=b+s.shift(),s.shift(),i.U.P.curveTo(a,U,c,g,p,C,_),i.U.P.curveTo(a,m,y,F,b,u,l)),S=="o1236"&&(U=u+s.shift(),c=l+s.shift(),g=U+s.shift(),_=p=c+s.shift(),y=p,F=(m=(C=g+s.shift())+s.shift())+s.shift(),b=y+s.shift(),u=F+s.shift(),i.U.P.curveTo(a,U,c,g,p,C,_),i.U.P.curveTo(a,m,y,F,b,u,l)),S=="o1237"&&(U=u+s.shift(),c=l+s.shift(),g=U+s.shift(),p=c+s.shift(),C=g+s.shift(),_=p+s.shift(),m=C+s.shift(),y=_+s.shift(),F=m+s.shift(),b=y+s.shift(),Math.abs(F-u)>Math.abs(b-l)?u=F+s.shift():l=b+s.shift(),i.U.P.curveTo(a,U,c,g,p,C,_),i.U.P.curveTo(a,m,y,F,b,u,l));else if(S=="o14"){if(s.length>0&&!h&&(d=s.shift()+n.nominalWidthX,h=true),s.length==4){var L=s.shift(),W=s.shift(),M=s.shift(),V=s.shift(),N=i.CFF.glyphBySE(n,M),E=i.CFF.glyphBySE(n,V);i.U._drawCFF(n.CharStrings[N],e,n,o,a),e.x=L,e.y=W,i.U._drawCFF(n.CharStrings[E],e,n,o,a);}f&&(i.U.P.closePath(a),f=false);}else if(S=="o19"||S=="o20")s.length%2!=0&&!h&&(d=s.shift()+o.nominalWidthX),t+=s.length>>1,s.length=0,h=true,v+=t+7>>3;else if(S=="o21")s.length>2&&!h&&(d=s.shift()+o.nominalWidthX,h=true),l+=s.pop(),u+=s.pop(),f&&i.U.P.closePath(a),i.U.P.moveTo(a,u,l),f=true;else if(S=="o22")s.length>1&&!h&&(d=s.shift()+o.nominalWidthX,h=true),u+=s.pop(),f&&i.U.P.closePath(a),i.U.P.moveTo(a,u,l),f=true;else if(S=="o25"){for(;s.length>6;)u+=s.shift(),l+=s.shift(),i.U.P.lineTo(a,u,l);U=u+s.shift(),c=l+s.shift(),g=U+s.shift(),p=c+s.shift(),u=g+s.shift(),l=p+s.shift(),i.U.P.curveTo(a,U,c,g,p,u,l);}else if(S=="o26")for(s.length%2&&(u+=s.shift());s.length>0;)U=u,c=l+s.shift(),u=g=U+s.shift(),l=(p=c+s.shift())+s.shift(),i.U.P.curveTo(a,U,c,g,p,u,l);else if(S=="o27")for(s.length%2&&(l+=s.shift());s.length>0;)c=l,g=(U=u+s.shift())+s.shift(),p=c+s.shift(),u=g+s.shift(),l=p,i.U.P.curveTo(a,U,c,g,p,u,l);else if(S=="o10"||S=="o29"){var B=S=="o10"?o:n;if(s.length==0)console.debug("error: empty stack");else {var X=s.pop(),z=B.Subrs[X+B.Bias];e.x=u,e.y=l,e.nStems=t,e.haveWidth=h,e.width=d,e.open=f,i.U._drawCFF(z,e,n,o,a),u=e.x,l=e.y,t=e.nStems,h=e.haveWidth,d=e.width,f=e.open;}}else if(S=="o30"||S=="o31"){var A=s.length,D=(w=0,S=="o31");for(w+=A-(x=-3&A);w<x;)D?(c=l,g=(U=u+s.shift())+s.shift(),l=(p=c+s.shift())+s.shift(),x-w==5?(u=g+s.shift(),w++):u=g,D=false):(U=u,c=l+s.shift(),g=U+s.shift(),p=c+s.shift(),u=g+s.shift(),x-w==5?(l=p+s.shift(),w++):l=p,D=true),i.U.P.curveTo(a,U,c,g,p,u,l),w+=4;}else {if((S+"").charAt(0)=="o")throw console.debug("Unknown operation: "+S,r),S;s.push(S);}}}e.x=u,e.y=l,e.nStems=t,e.haveWidth=h,e.width=d,e.open=f;};var T=i,R={Typr:T};return k.Typr=T,k.default=R,Object.defineProperty(k,"__esModule",{value:true}),k})({}).Typr}

/*!
  Three.js Blocks (@three-blocks/core)

  Proprietary Software — All Rights Reserved
  Copyright (c) 2025 three-blocks

  License Notice
  This software and all associated packages (@three-blocks/core, @three-blocks/starter,
  create-three-blocks-starter, and related tools) are licensed exclusively to active,
  paid subscribers of the threejs-blocks project. Without a valid and current subscription,
  you are NOT permitted to use this software.

  Permitted Usage (Active Subscribers Only)
  - Use in personal and commercial projects via the public API
  - Deploy applications to production environments
  - Integrate the software into your applications
  - Access updates, bug fixes, and new features during active subscription

  Restrictions
  - You may NOT reverse engineer, decompile, disassemble, or attempt to derive the
    source code, underlying algorithms, or techniques employed in this software.
  - You may NOT study, analyze, inspect, or learn from the implementation details,
    code structure, or internal workings of this software.
  - You may NOT modify, adapt, translate, or create derivative works.
  - You may NOT copy, share, distribute, publish, or resell any part of the software.
  - You may NOT sublicense or transfer rights to any third party.
  - You may NOT remove, alter, or obscure this license header or any copyright notices.
  - You may NOT use this software after your subscription has expired or been terminated.
  - You may NOT use this source code, in whole or in part, to train, fine-tune, or
    develop any artificial intelligence models, machine learning systems, or large
    language models (LLMs).
  - You may NOT feed this code into AI-assisted development tools for the purpose
    of generating derivative code, training said tools, or extracting patterns.
  - You may NOT use automated transformation tools or AI systems to create modified
    versions or derivatives of this software.

  Enforcement
  Unauthorized use, reproduction, distribution, reverse engineering, or violation of
  the AI/ML prohibition is strictly prohibited and may result in immediate termination
  of your license, civil liability, and/or criminal penalties under applicable copyright
  and contract law.

  By using this software, you acknowledge that you have read, understood, and agree to
  be bound by the complete terms of this license agreement.

  For licensing inquiries and compliance: https://threejs-blocks.com/license
*/

function Un(){return (function(J){var w=Uint8Array,y=Uint16Array,P=Uint32Array,Z=new w([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),R=new w([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),sn=new w([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),I=function(e,r){for(var n=new y(31),o=0;o<31;++o)n[o]=r+=1<<e[o-1];var t=new P(n[30]);for(o=1;o<30;++o)for(var c=n[o];c<n[o+1];++c)t[c]=c-n[o]<<5|o;return [n,t]},q=I(Z,2),nn=q[0],cn=q[1];nn[28]=258,cn[258]=28;for(var ln=I(R,0)[0],Q=new y(32768),v=0;v<32768;++v){var D=(43690&v)>>>1|(21845&v)<<1;D=(61680&(D=(52428&D)>>>2|(13107&D)<<2))>>>4|(3855&D)<<4,Q[v]=((65280&D)>>>8|(255&D)<<8)>>>1;}var j=function(e,r,n){for(var o=e.length,t=0,c=new y(r);t<o;++t)++c[e[t]-1];var l,u=new y(r);for(t=0;t<r;++t)u[t]=u[t-1]+c[t-1]<<1;{l=new y(1<<r);var m=15-r;for(t=0;t<o;++t)if(e[t])for(var a=t<<4|e[t],i=r-e[t],s=u[e[t]-1]++<<i,h=s|(1<<i)-1;s<=h;++s)l[Q[s]>>>m]=a;}return l},G=new w(288);for(v=0;v<144;++v)G[v]=8;for(v=144;v<256;++v)G[v]=9;for(v=256;v<280;++v)G[v]=7;for(v=280;v<288;++v)G[v]=8;var en=new w(32);for(v=0;v<32;++v)en[v]=5;var un=j(G,9),wn=j(en,5),$=function(e){for(var r=e[0],n=1;n<e.length;++n)e[n]>r&&(r=e[n]);return r},d=function(e,r,n){var o=r/8|0;return (e[o]|e[o+1]<<8)>>(7&r)&n},F=function(e,r){var n=r/8|0;return (e[n]|e[n+1]<<8|e[n+2]<<16)>>(7&r)},hn=["unexpected EOF","invalid block type","invalid length/literal","invalid distance","stream finished","no stream handler",,"no callback","invalid UTF-8 data","extra field too long","date not in range 1980-2099","filename too long","stream finishing","invalid zip data"],L=function(e,r,n){var o=new Error(r||hn[e]);if(o.code=e,Error.captureStackTrace&&Error.captureStackTrace(o,L),!n)throw o;return o},dn=function(e,r,n){var o=e.length;if(!o||n&&!n.l&&o<5)return r||new w(0);var t=!r||n,c=!n||n.i;n||(n={}),r||(r=new w(3*o));var l,u=function(A){var x=r.length;if(A>x){var E=new w(Math.max(2*x,A));E.set(r),r=E;}},m=n.f||0,a=n.p||0,i=n.b||0,s=n.l,h=n.d,U=n.m,k=n.n,M=8*o;do{if(!s){n.f=m=d(e,a,1);var _=d(e,a+1,3);if(a+=3,!_){var z=e[(g=((l=a)/8|0)+(7&l&&1)+4)-4]|e[g-3]<<8,O=g+z;if(O>o){c&&L(0);break}t&&u(i+z),r.set(e.subarray(g,O),i),n.b=i+=z,n.p=a=8*O;continue}if(_==1)s=un,h=wn,U=9,k=5;else if(_==2){var f=d(e,a,31)+257,S=d(e,a+10,15)+4,H=f+d(e,a+5,31)+1;a+=14;for(var p=new w(H),V=new w(19),b=0;b<S;++b)V[sn[b]]=d(e,a+3*b,7);a+=3*S;var tn=$(V),pn=(1<<tn)-1,gn=j(V,tn);for(b=0;b<H;){var g,rn=gn[d(e,a,pn)];if(a+=15&rn,(g=rn>>>4)<16)p[b++]=g;else {var W=0,B=0;for(g==16?(B=3+d(e,a,3),a+=2,W=p[b-1]):g==17?(B=3+d(e,a,7),a+=3):g==18&&(B=11+d(e,a,127),a+=7);B--;)p[b++]=W;}}var an=p.subarray(0,f),T=p.subarray(f);U=$(an),k=$(T),s=j(an,U),h=j(T,k);}else L(1);if(a>M){c&&L(0);break}}t&&u(i+131072);for(var yn=(1<<U)-1,Ln=(1<<k)-1,Y=a;;Y=a){var C=(W=s[F(e,a)&yn])>>>4;if((a+=15&W)>M){c&&L(0);break}if(W||L(2),C<256)r[i++]=C;else {if(C==256){Y=a,s=null;break}var on=C-254;if(C>264){var X=Z[b=C-257];on=d(e,a,(1<<X)-1)+nn[b],a+=X;}var N=h[F(e,a)&Ln],K=N>>>4;if(N||L(3),a+=15&N,T=ln[K],K>3&&(X=R[K],T+=F(e,a)&(1<<X)-1,a+=X),a>M){c&&L(0);break}t&&u(i+131072);for(var fn=i+on;i<fn;i+=4)r[i]=r[i-T],r[i+1]=r[i+1-T],r[i+2]=r[i+2-T],r[i+3]=r[i+3-T];i=fn;}}n.l=s,n.p=Y,n.b=i,s&&(m=1,n.m=U,n.d=h,n.n=k);}while(!m);return i==r.length?r:(function(A,x,E){(E==null||E>A.length)&&(E=A.length);var vn=new(A instanceof y?y:A instanceof P?P:w)(E-x);return vn.set(A.subarray(x,E)),vn})(r,0,i)},mn=new w(0),bn=typeof TextDecoder<"u"&&new TextDecoder;try{bn.decode(mn,{stream:!0});}catch{}return J.convert_streams=function(e){var r=new DataView(e),n=0;function o(){var f=r.getUint16(n);return n+=2,f}function t(){var f=r.getUint32(n);return n+=4,f}function c(f){z.setUint16(O,f),O+=2;}function l(f){z.setUint32(O,f),O+=4;}for(var u={signature:t(),flavor:t(),length:t(),numTables:o(),reserved:o(),totalSfntSize:t(),majorVersion:o(),minorVersion:o(),metaOffset:t(),metaLength:t(),metaOrigLength:t(),privOffset:t(),privLength:t()},m=0;Math.pow(2,m)<=u.numTables;)m++;m--;for(var a=16*Math.pow(2,m),i=16*u.numTables-a,s=12,h=[],U=0;U<u.numTables;U++)h.push({tag:t(),offset:t(),compLength:t(),origLength:t(),origChecksum:t()}),s+=16;var k,M=new Uint8Array(12+16*h.length+h.reduce(function(f,S){return f+S.origLength+4},0)),_=M.buffer,z=new DataView(_),O=0;return l(u.flavor),c(u.numTables),c(a),c(m),c(i),h.forEach(function(f){l(f.tag),l(f.origChecksum),l(s),l(f.origLength),f.outOffset=s,(s+=f.origLength)%4!=0&&(s+=4-s%4);}),h.forEach(function(f){var S,H=e.slice(f.offset,f.offset+f.compLength);if(f.compLength!=f.origLength){var p=new Uint8Array(f.origLength);S=new Uint8Array(H,2),dn(S,p);}else p=new Uint8Array(H);M.set(p,f.outOffset);var V=0;(s=f.outOffset+f.origLength)%4!=0&&(V=4-s%4),M.set(new Uint8Array(V).buffer,f.outOffset+f.origLength),k=s+V;}),_.slice(0,k)},Object.defineProperty(J,"__esModule",{value:true}),J})({}).convert_streams}

function workerBootstrap() {
  var modules = /* @__PURE__ */ Object.create(null);
  function registerModule(ref, callback) {
    var id = ref.id;
    var name = ref.name;
    var dependencies = ref.dependencies;
    if (dependencies === void 0) dependencies = [];
    var init = ref.init;
    if (init === void 0) init = function() {
    };
    var getTransferables = ref.getTransferables;
    if (getTransferables === void 0) getTransferables = null;
    if (modules[id]) {
      return;
    }
    try {
      dependencies = dependencies.map(function(dep) {
        if (dep && dep.isWorkerModule) {
          registerModule(dep, function(depResult) {
            if (depResult instanceof Error) {
              throw depResult;
            }
          });
          dep = modules[dep.id].value;
        }
        return dep;
      });
      init = rehydrate("<" + name + ">.init", init);
      if (getTransferables) {
        getTransferables = rehydrate("<" + name + ">.getTransferables", getTransferables);
      }
      var value = null;
      if (typeof init === "function") {
        value = init.apply(void 0, dependencies);
      } else {
        console.error("worker module init function failed to rehydrate");
      }
      modules[id] = {
        id,
        value,
        getTransferables
      };
      callback(value);
    } catch (err) {
      if (!(err && err.noLog)) {
        console.error(err);
      }
      callback(err);
    }
  }
  function callModule(ref, callback) {
    var ref$1;
    var id = ref.id;
    var args = ref.args;
    if (!modules[id] || typeof modules[id].value !== "function") {
      callback(new Error("Worker module " + id + ": not found or its 'init' did not return a function"));
    }
    try {
      var result = (ref$1 = modules[id]).value.apply(ref$1, args);
      if (result && typeof result.then === "function") {
        result.then(handleResult, function(rej) {
          return callback(rej instanceof Error ? rej : new Error("" + rej));
        });
      } else {
        handleResult(result);
      }
    } catch (err) {
      callback(err);
    }
    function handleResult(result2) {
      try {
        var tx = modules[id].getTransferables && modules[id].getTransferables(result2);
        if (!tx || !Array.isArray(tx) || !tx.length) {
          tx = void 0;
        }
        callback(result2, tx);
      } catch (err) {
        console.error(err);
        callback(err);
      }
    }
  }
  function rehydrate(name, str) {
    var result = void 0;
    self.troikaDefine = function(r) {
      return result = r;
    };
    var url = URL.createObjectURL(
      new Blob(
        ["/** " + name.replace(/\*/g, "") + " **/\n\ntroikaDefine(\n" + str + "\n)"],
        { type: "application/javascript" }
      )
    );
    try {
      importScripts(url);
    } catch (err) {
      console.error(err);
    }
    URL.revokeObjectURL(url);
    delete self.troikaDefine;
    return result;
  }
  self.addEventListener("message", function(e) {
    var ref = e.data;
    var messageId = ref.messageId;
    var action = ref.action;
    var data = ref.data;
    try {
      if (action === "registerModule") {
        registerModule(data, function(result) {
          if (result instanceof Error) {
            postMessage({
              messageId,
              success: false,
              error: result.message
            });
          } else {
            postMessage({
              messageId,
              success: true,
              result: { isCallable: typeof result === "function" }
            });
          }
        });
      }
      if (action === "callModule") {
        callModule(data, function(result, transferables) {
          if (result instanceof Error) {
            postMessage({
              messageId,
              success: false,
              error: result.message
            });
          } else {
            postMessage({
              messageId,
              success: true,
              result
            }, transferables || void 0);
          }
        });
      }
    } catch (err) {
      postMessage({
        messageId,
        success: false,
        error: err.stack
      });
    }
  });
}
function defineMainThreadModule(options) {
  var moduleFunc = function() {
    var args = [], len = arguments.length;
    while (len--) args[len] = arguments[len];
    return moduleFunc._getInitResult().then(function(initResult) {
      if (typeof initResult === "function") {
        return initResult.apply(void 0, args);
      } else {
        throw new Error("Worker module function was called but `init` did not return a callable function");
      }
    });
  };
  moduleFunc._getInitResult = function() {
    var dependencies = options.dependencies;
    var init = options.init;
    dependencies = Array.isArray(dependencies) ? dependencies.map(function(dep) {
      if (dep) {
        dep = dep.onMainThread || dep;
        if (dep._getInitResult) {
          dep = dep._getInitResult();
        }
      }
      return dep;
    }) : [];
    var initPromise = Promise.all(dependencies).then(function(deps) {
      return init.apply(null, deps);
    });
    moduleFunc._getInitResult = function() {
      return initPromise;
    };
    return initPromise;
  };
  return moduleFunc;
}
var supportsWorkers = function() {
  var supported = false;
  if (typeof window !== "undefined" && typeof window.document !== "undefined") {
    try {
      var worker = new Worker(
        URL.createObjectURL(new Blob([""], { type: "application/javascript" }))
      );
      worker.terminate();
      supported = true;
    } catch (err) {
      {
        console.log(
          "Troika createWorkerModule: web workers not allowed; falling back to main thread execution. Cause: [" + err.message + "]"
        );
      }
    }
  }
  supportsWorkers = function() {
    return supported;
  };
  return supported;
};
var _workerModuleId = 0;
var _messageId = 0;
var _allowInitAsString = false;
var workers = /* @__PURE__ */ Object.create(null);
var registeredModules = /* @__PURE__ */ Object.create(null);
var openRequests = /* @__PURE__ */ Object.create(null);
function defineWorkerModule(options) {
  if ((!options || typeof options.init !== "function") && !_allowInitAsString) {
    throw new Error("requires `options.init` function");
  }
  var dependencies = options.dependencies;
  var init = options.init;
  var getTransferables = options.getTransferables;
  var workerId = options.workerId;
  var onMainThread = defineMainThreadModule(options);
  if (workerId == null) {
    workerId = "#default";
  }
  var id = "workerModule" + ++_workerModuleId;
  var name = options.name || id;
  var registrationPromise = null;
  dependencies = dependencies && dependencies.map(function(dep) {
    if (typeof dep === "function" && !dep.workerModuleData) {
      _allowInitAsString = true;
      dep = defineWorkerModule({
        workerId,
        name: "<" + name + "> function dependency: " + dep.name,
        init: "function(){return (\n" + stringifyFunction(dep) + "\n)}"
      });
      _allowInitAsString = false;
    }
    if (dep && dep.workerModuleData) {
      dep = dep.workerModuleData;
    }
    return dep;
  });
  function moduleFunc() {
    var args = [], len = arguments.length;
    while (len--) args[len] = arguments[len];
    if (!supportsWorkers()) {
      return onMainThread.apply(void 0, args);
    }
    if (!registrationPromise) {
      registrationPromise = callWorker(workerId, "registerModule", moduleFunc.workerModuleData);
      var unregister = function() {
        registrationPromise = null;
        registeredModules[workerId].delete(unregister);
      };
      (registeredModules[workerId] || (registeredModules[workerId] = /* @__PURE__ */ new Set())).add(unregister);
    }
    return registrationPromise.then(function(ref) {
      var isCallable = ref.isCallable;
      if (isCallable) {
        return callWorker(workerId, "callModule", { id, args });
      } else {
        throw new Error("Worker module function was called but `init` did not return a callable function");
      }
    });
  }
  moduleFunc.workerModuleData = {
    isWorkerModule: true,
    id,
    name,
    dependencies,
    init: stringifyFunction(init),
    getTransferables: getTransferables && stringifyFunction(getTransferables)
  };
  moduleFunc.onMainThread = onMainThread;
  return moduleFunc;
}
function terminateWorker(workerId) {
  if (registeredModules[workerId]) {
    registeredModules[workerId].forEach(function(unregister) {
      unregister();
    });
  }
  if (workers[workerId]) {
    workers[workerId].terminate();
    delete workers[workerId];
  }
}
function stringifyFunction(fn) {
  var str = fn.toString();
  if (!/^function/.test(str) && /^\w+\s*\(/.test(str)) {
    str = "function " + str;
  }
  return str;
}
function getWorker(workerId) {
  var worker = workers[workerId];
  if (!worker) {
    var bootstrap = stringifyFunction(workerBootstrap);
    worker = workers[workerId] = new Worker(
      URL.createObjectURL(
        new Blob(
          ["/** Worker Module Bootstrap: " + workerId.replace(/\*/g, "") + " **/\n\n;(" + bootstrap + ")()"],
          { type: "application/javascript" }
        )
      )
    );
    worker.onmessage = function(e) {
      var response = e.data;
      var msgId = response.messageId;
      var callback = openRequests[msgId];
      if (!callback) {
        throw new Error("WorkerModule response with empty or unknown messageId");
      }
      delete openRequests[msgId];
      callback(response);
    };
  }
  return worker;
}
function callWorker(workerId, action, data) {
  return new Promise(function(resolve, reject) {
    var messageId = ++_messageId;
    openRequests[messageId] = function(response) {
      if (response.success) {
        resolve(response.result);
      } else {
        reject(new Error("Error in worker " + action + " call: " + response.error));
      }
    };
    getWorker(workerId).postMessage({
      messageId,
      action,
      data
    });
  });
}

function oe$1(g,D){let F={M:2,L:2,Q:4,C:6,Z:0},U={C:"18g,ca,368,1kz",D:"17k,6,2,2+4,5+c,2+6,2+1,10+1,9+f,j+11,2+1,a,2,2+1,15+2,3,j+2,6+3,2+8,2,2,2+1,w+a,4+e,3+3,2,3+2,3+5,23+w,2f+4,3,2+9,2,b,2+3,3,1k+9,6+1,3+1,2+2,2+d,30g,p+y,1,1+1g,f+x,2,sd2+1d,jf3+4,f+3,2+4,2+2,b+3,42,2,4+2,2+1,2,3,t+1,9f+w,2,el+2,2+g,d+2,2l,2+1,5,3+1,2+1,2,3,6,16wm+1v",R:"17m+3,2,2,6+3,m,15+2,2+2,h+h,13,3+8,2,2,3+1,2,p+1,x,5+4,5,a,2,2,3,u,c+2,g+1,5,2+1,4+1,5j,6+1,2,b,2+2,f,2+1,1s+2,2,3+1,7,1ez0,2,2+1,4+4,b,4,3,b,42,2+2,4,3,2+1,2,o+3,ae,ep,x,2o+2,3+1,3,5+1,6",L:"x9u,jff,a,fd,jv",T:"4t,gj+33,7o+4,1+1,7c+18,2,2+1,2+1,2,21+a,2,1b+k,h,2u+6,3+5,3+1,2+3,y,2,v+q,2k+a,1n+8,a,p+3,2+8,2+2,2+4,18+2,3c+e,2+v,1k,2,5+7,5,4+6,b+1,u,1n,5+3,9,l+1,r,3+1,1m,5+1,5+1,3+2,4,v+1,4,c+1,1m,5+4,2+1,5,l+1,n+5,2,1n,3,2+3,9,8+1,c+1,v,1q,d,1f,4,1m+2,6+2,2+3,8+1,c+1,u,1n,3,7,6+1,l+1,t+1,1m+1,5+3,9,l+1,u,21,8+2,2,2j,3+6,d+7,2r,3+8,c+5,23+1,s,2,2,1k+d,2+4,2+1,6+a,2+z,a,2v+3,2+5,2+1,3+1,q+1,5+2,h+3,e,3+1,7,g,jk+2,qb+2,u+2,u+1,v+1,1t+1,2+6,9,3+a,a,1a+2,3c+1,z,3b+2,5+1,a,7+2,64+1,3,1n,2+6,2,2,3+7,7+9,3,1d+d,1,1+1,1s+3,1d,2+4,2,6,15+8,d+1,x+3,3+1,2+2,1l,2+1,4,2+2,1n+7,3+1,49+2,2+c,2+6,5,7,4+1,5j+1l,2+4,ek,3+1,r+4,1e+4,6+5,2p+c,1+3,1,1+2,1+b,2db+2,3y,2p+v,ff+3,30+1,n9x,1+2,2+9,x+1,29+1,7l,4,5,q+1,6,48+1,r+h,e,13+7,q+a,1b+2,1d,3+3,3+1,14,1w+5,3+1,3+1,d,9,1c,1g,2+2,3+1,6+1,2,17+1,9,6n,3,5,fn5,ki+f,h+f,5s,6y+2,ea,6b,46+4,1af+2,2+1,6+3,15+2,5,4m+1,fy+3,as+1,4a+a,4x,1j+e,1l+2,1e+3,3+1,1y+2,11+4,2+7,1r,d+1,1h+8,b+3,3,2o+2,3,2+1,7,4h,4+7,m+1,1m+1,4,12+6,4+4,5g+7,3+2,2,o,2d+5,2,5+1,2+1,6n+3,7+1,2+1,s+1,2e+7,3,2+1,2z,2,3+5,2,2u+2,3+3,2+4,78+8,2+1,75+1,2,5,41+3,3+1,5,x+9,15+5,3+3,9,a+5,3+2,1b+c,2+1,bb+6,2+5,2,2b+l,3+6,2+1,2+1,3f+5,4,2+1,2+6,2,21+1,4,2,9o+1,470+8,at4+4,1o+6,t5,1s+3,2a,f5l+1,2+3,43o+2,a+7,1+7,3+6,v+3,45+2,1j0+1i,5+1d,9,f,n+4,2+e,11t+6,2+g,3+6,2+1,2+4,7a+6,c6+3,15t+6,32+6,1,gzau,v+2n,3l+6n"},A=1,J=2,L=4,q=8,M=16,j=32,w;function V(t){if(!w){let n={R:J,L:A,D:L,C:M,U:j,T:q};w=new Map;for(let e in U){let o=0;U[e].split(",").forEach(r=>{let[c,f]=r.split("+");c=parseInt(c,36),f=f?parseInt(f,36):0,w.set(o+=c,n[e]);for(let i=f;i--;)w.set(++o,n[e]);});}}return w.get(t)||j}let N=1,z=2,H=3,W=4,X=[null,"isol","init","fina","medi"];function Z(t){let n=new Uint8Array(t.length),e=j,o=N,r=-1;for(let c=0;c<t.length;c++){let f=t.codePointAt(c),i=V(f)|0,d=N;i&q||(e&(A|L|M)?i&(J|L|M)?(d=H,(o===N||o===H)&&n[r]++):i&(A|j)&&(o===z||o===W)&&n[r]--:e&(J|j)&&(o===z||o===W)&&n[r]--,o=n[c]=d,e=i,r=c,f>65535&&c++);}return n}function K(t,n){let e=[];for(let r=0;r<n.length;r++){let c=n.codePointAt(r);c>65535&&r++,e.push(g.U.codeToGlyph(t,c));}let o=t.GSUB;if(o){let{lookupList:r,featureList:c}=o,f,i=/^(rlig|liga|mset|isol|init|fina|medi|half|pres|blws|ccmp)$/,d=[];c.forEach(a=>{if(i.test(a.tag))for(let x=0;x<a.tab.length;x++){if(d[a.tab[x]])continue;d[a.tab[x]]=true;let u=r[a.tab[x]],k=/^(isol|init|fina|medi)$/.test(a.tag);k&&!f&&(f=Z(n));for(let s=0;s<e.length;s++)(!f||!k||X[f[s]]===a.tag)&&g.U._applySubs(e,s,u,r);}});}return e}function Y(t,n){let e=new Int16Array(n.length*3),o=0;for(;o<n.length;o++){let i=n[o];if(i===-1)continue;e[o*3+2]=t.hmtx.aWidth[i];let d=t.GPOS;if(d){let a=d.lookupList;for(let x=0;x<a.length;x++){let u=a[x];for(let k=0;k<u.tabs.length;k++){let s=u.tabs[k];if(u.ltype===1){if(g._lctf.coverageIndex(s.coverage,i)!==-1&&s.pos){f(s.pos,o);break}}else if(u.ltype===2){let p=null,l=r();if(l!==-1){let b=g._lctf.coverageIndex(s.coverage,n[l]);if(b!==-1){if(s.fmt===1){let m=s.pairsets[b];for(let h=0;h<m.length;h++)m[h].gid2===i&&(p=m[h]);}else if(s.fmt===2){let m=g.U._getGlyphClass(n[l],s.classDef1),h=g.U._getGlyphClass(i,s.classDef2);p=s.matrix[m][h];}if(p){p.val1&&f(p.val1,l),p.val2&&f(p.val2,o);break}}}}else if(u.ltype===4){let p=g._lctf.coverageIndex(s.markCoverage,i);if(p!==-1){let l=r(c),b=l===-1?-1:g._lctf.coverageIndex(s.baseCoverage,n[l]);if(b!==-1){let m=s.markArray[p],h=s.baseArray[b][m.markClass];e[o*3]=h.x-m.x+e[l*3]-e[l*3+2],e[o*3+1]=h.y-m.y+e[l*3+1];break}}}else if(u.ltype===6){let p=g._lctf.coverageIndex(s.mark1Coverage,i);if(p!==-1){let l=r();if(l!==-1){let b=n[l];if(B(t,b)===3){let m=g._lctf.coverageIndex(s.mark2Coverage,b);if(m!==-1){let h=s.mark1Array[p],I=s.mark2Array[m][h.markClass];e[o*3]=I.x-h.x+e[l*3]-e[l*3+2],e[o*3+1]=I.y-h.y+e[l*3+1];break}}}}}}}}else if(t.kern&&!t.cff){let a=r();if(a!==-1){let x=t.kern.glyph1.indexOf(n[a]);if(x!==-1){let u=t.kern.rval[x].glyph2.indexOf(i);u!==-1&&(e[a*3+2]+=t.kern.rval[x].vals[u]);}}}}return e;function r(i){for(let d=o-1;d>=0;d--)if(n[d]!==-1&&(!i||i(n[d])))return d;return  -1}function c(i){return B(t,i)===1}function f(i,d){for(let a=0;a<3;a++)e[d*3+a]+=i[a]||0;}}function B(t,n){let e=t.GDEF&&t.GDEF.glyphClassDef;return e?g.U._getGlyphClass(n,e):0}function C(...t){for(let n=0;n<t.length;n++)if(typeof t[n]=="number")return t[n]}function ee(t){let n=Object.create(null),e=t["OS/2"],o=t.hhea,r=t.head.unitsPerEm,c=C(e&&e.sTypoAscender,o&&o.ascender,r),f={unitsPerEm:r,ascender:c,descender:C(e&&e.sTypoDescender,o&&o.descender,0),capHeight:C(e&&e.sCapHeight,c),xHeight:C(e&&e.sxHeight,c),lineGap:C(e&&e.sTypoLineGap,o&&o.lineGap),supportsCodePoint(i){return g.U.codeToGlyph(t,i)>0},forEachGlyph(i,d,a,x){let u=0,k=1/f.unitsPerEm*d,s=K(t,i),p=0,l=Y(t,s);return s.forEach((b,m)=>{if(b!==-1){let h=n[b];if(!h){let{cmds:I,crds:_}=g.U.glyphToPath(t,b),R="",ne=0;for(let v=0,S=I.length;v<S;v++){let G=F[I[v]];R+=I[v];for(let y=1;y<=G;y++)R+=(y>1?",":"")+_[ne++];}let O,T,E,P;if(_.length){O=T=1/0,E=P=-1/0;for(let v=0,S=_.length;v<S;v+=2){let G=_[v],y=_[v+1];G<O&&(O=G),y<T&&(T=y),G>E&&(E=G),y>P&&(P=y);}}else O=E=T=P=0;h=n[b]={index:b,advanceWidth:t.hmtx.aWidth[b],xMin:O,yMin:T,xMax:E,yMax:P,path:R};}x.call(null,h,u+l[m*3]*k,l[m*3+1]*k,p),u+=l[m*3+2]*k,a&&(u+=a*d);}p+=i.codePointAt(p)>65535?2:1;}),u}};return f}return function(n){let e=new Uint8Array(n,0,4),o=g._bin.readASCII(e,0,4);if(o==="wOFF")n=D(n);else if(o==="wOF2")throw new Error("woff2 fonts not supported");return ee(g.parse(n)[0])}}var ie=defineWorkerModule({name:"Typr Font Parser",dependencies:[q$1,Un,oe$1],init(g,D,F){let U=g(),A=D();return F(U,A)}}),ce=ie;

function W$1(C,b){let L=Object.create(null),v=Object.create(null);function D(o,g){let s=n=>{console.error(`Failure loading font ${o}`,n);};try{let n=new XMLHttpRequest;n.open("get",o,!0),n.responseType="arraybuffer",n.onload=function(){if(n.status>=400)s(new Error(n.statusText));else if(n.status>0)try{let a=C(n.response);a.src=o,g(a);}catch(a){s(a);}},n.onerror=s,n.send();}catch(n){s(n);}}function S(o,g){let s=L[o];s?g(s):v[o]?v[o].push(g):(v[o]=[g],D(o,n=>{n.src=o,L[o]=n,v[o].forEach(a=>a(n)),delete v[o];}));}return function(o,g,{lang:s,fonts:n=[],style:a="normal",weight:y="normal",unicodeFontsURL:F,unicodeFontsDebug:p}={}){let f=new Uint8Array(o.length),u=[];o.length||k();let O=new Map,l=[];if(a!=="italic"&&(a="normal"),typeof y!="number"&&(y=y==="bold"?700:400),n&&!Array.isArray(n)&&(n=[n]),n=n.slice().filter(c=>!c.lang||c.lang.test(s)).reverse(),n.length){let r=0;(function E($=0){for(let e=$,h=o.length;e<h;e++){let i=o.codePointAt(e);if(r===1&&u[f[e-1]].supportsCodePoint(i)||/\s/.test(o[e]))f[e]=f[e-1],r===2&&(l[l.length-1][1]=e,console.log("carry forward",o[e]));else for(let R=f[e],j=n.length;R<=j;R++)if(R===j){let m=r===2?l[l.length-1]:l[l.length]=[e,e];m[1]=e,r=2,console.log("needs fallback",o[e]);}else {f[e]=R;let{src:m,unicodeRange:I}=n[R];if(!I||_(i,I)){let A=L[m];if(!A){S(m,()=>{E(e);});return}if(A.supportsCodePoint(i)){let N=O.get(A);typeof N!="number"&&(N=u.length,u.push(A),O.set(A,N)),f[e]=N,r=1;break}}}i>65535&&e+1<h&&(f[e+1]=f[e],e++,r===2&&(l[l.length-1][1]=e));}K();})();}else l.push([0,o.length-1]),K();function K(){if(l.length){let c=l.map(t=>o.substring(t[0],t[1]+1)).join(`
`);if(p)try{let t=l.map(([d,r])=>`${d}-${r}`).join(",");console.info(`[FontResolver] Requesting fallback fonts. lang=${s||"auto"} style=${a} weight=${y} dataUrl=${F||"(default CDN)"} ranges=[${t}] textLen=${c.length}`);}catch{}b.getFontsForString(c,{lang:s||void 0,style:a,weight:y,dataUrl:F,debug:p}).then(({fontUrls:t,chars:d})=>{if(p)try{console.info(`[FontResolver] Resolved ${t.length} fallback font URL(s):`,t);}catch{}let r=u.length,E=0;l.forEach(e=>{for(let h=0,i=e[1]-e[0];h<=i;h++)f[e[0]+h]=d[E++]+r;E++;});let $=0;t.forEach((e,h)=>{if(p)try{console.info(`[FontResolver] Loading fallback font: ${e}`);}catch{}S(e,i=>{if(u[h+r]=i,++$===t.length){if(p)try{console.info("[FontResolver] All fallback fonts loaded");}catch{}k();}});});});}else {if(p)try{console.info("[FontResolver] No fallback ranges; user fonts cover all glyphs");}catch{}k();}}function k(){g({chars:f,fonts:u});}function _(c,t){for(let d=0;d<t.length;d++){let[r,E=r]=t[d];if(r<=c&&c<=E)return  true}return  false}}}var T$2=defineWorkerModule({name:"FontResolver",dependencies:[W$1,ce,V$1],init(C,b,L){return C(b,L())}});

function SDFGenerator() {
var exports = (function (exports) {

  /**
   * Find the point on a quadratic bezier curve at t where t is in the range [0, 1]
   */
  function pointOnQuadraticBezier (x0, y0, x1, y1, x2, y2, t, pointOut) {
    var t2 = 1 - t;
    pointOut.x = t2 * t2 * x0 + 2 * t2 * t * x1 + t * t * x2;
    pointOut.y = t2 * t2 * y0 + 2 * t2 * t * y1 + t * t * y2;
  }

  /**
   * Find the point on a cubic bezier curve at t where t is in the range [0, 1]
   */
  function pointOnCubicBezier (x0, y0, x1, y1, x2, y2, x3, y3, t, pointOut) {
    var t2 = 1 - t;
    pointOut.x = t2 * t2 * t2 * x0 + 3 * t2 * t2 * t * x1 + 3 * t2 * t * t * x2 + t * t * t * x3;
    pointOut.y = t2 * t2 * t2 * y0 + 3 * t2 * t2 * t * y1 + 3 * t2 * t * t * y2 + t * t * t * y3;
  }

  /**
   * Parse a path string into its constituent line/curve commands, invoking a callback for each.
   * @param {string} pathString - An SVG-like path string to parse; should only contain commands: M/L/Q/C/Z
   * @param {function(
   *   command: 'L'|'Q'|'C',
   *   startX: number,
   *   startY: number,
   *   endX: number,
   *   endY: number,
   *   ctrl1X?: number,
   *   ctrl1Y?: number,
   *   ctrl2X?: number,
   *   ctrl2Y?: number
   * )} commandCallback - A callback function that will be called once for each parsed path command, passing the
   *                      command identifier (only L/Q/C commands) and its numeric arguments.
   */
  function forEachPathCommand(pathString, commandCallback) {
    var segmentRE = /([MLQCZ])([^MLQCZ]*)/g;
    var match, firstX, firstY, prevX, prevY;
    while ((match = segmentRE.exec(pathString))) {
      var args = match[2]
        .replace(/^\s*|\s*$/g, '')
        .split(/[,\s]+/)
        .map(function (v) { return parseFloat(v); });
      switch (match[1]) {
        case 'M':
          prevX = firstX = args[0];
          prevY = firstY = args[1];
          break
        case 'L':
          if (args[0] !== prevX || args[1] !== prevY) { // yup, some fonts have zero-length line commands
            commandCallback('L', prevX, prevY, (prevX = args[0]), (prevY = args[1]));
          }
          break
        case 'Q': {
          commandCallback('Q', prevX, prevY, (prevX = args[2]), (prevY = args[3]), args[0], args[1]);
          break
        }
        case 'C': {
          commandCallback('C', prevX, prevY, (prevX = args[4]), (prevY = args[5]), args[0], args[1], args[2], args[3]);
          break
        }
        case 'Z':
          if (prevX !== firstX || prevY !== firstY) {
            commandCallback('L', prevX, prevY, firstX, firstY);
          }
          break
      }
    }
  }

  /**
   * Convert a path string to a series of straight line segments
   * @param {string} pathString - An SVG-like path string to parse; should only contain commands: M/L/Q/C/Z
   * @param {function(x1:number, y1:number, x2:number, y2:number)} segmentCallback - A callback
   *        function that will be called once for every line segment
   * @param {number} [curvePoints] - How many straight line segments to use when approximating a
   *        bezier curve in the path. Defaults to 16.
   */
  function pathToLineSegments (pathString, segmentCallback, curvePoints) {
    if ( curvePoints === void 0 ) curvePoints = 16;

    var tempPoint = { x: 0, y: 0 };
    forEachPathCommand(pathString, function (command, startX, startY, endX, endY, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y) {
      switch (command) {
        case 'L':
          segmentCallback(startX, startY, endX, endY);
          break
        case 'Q': {
          var prevCurveX = startX;
          var prevCurveY = startY;
          for (var i = 1; i < curvePoints; i++) {
            pointOnQuadraticBezier(
              startX, startY,
              ctrl1X, ctrl1Y,
              endX, endY,
              i / (curvePoints - 1),
              tempPoint
            );
            segmentCallback(prevCurveX, prevCurveY, tempPoint.x, tempPoint.y);
            prevCurveX = tempPoint.x;
            prevCurveY = tempPoint.y;
          }
          break
        }
        case 'C': {
          var prevCurveX$1 = startX;
          var prevCurveY$1 = startY;
          for (var i$1 = 1; i$1 < curvePoints; i$1++) {
            pointOnCubicBezier(
              startX, startY,
              ctrl1X, ctrl1Y,
              ctrl2X, ctrl2Y,
              endX, endY,
              i$1 / (curvePoints - 1),
              tempPoint
            );
            segmentCallback(prevCurveX$1, prevCurveY$1, tempPoint.x, tempPoint.y);
            prevCurveX$1 = tempPoint.x;
            prevCurveY$1 = tempPoint.y;
          }
          break
        }
      }
    });
  }

  var viewportQuadVertex = "precision highp float;attribute vec2 aUV;varying vec2 vUV;void main(){vUV=aUV;gl_Position=vec4(mix(vec2(-1.0),vec2(1.0),aUV),0.0,1.0);}";

  var copyTexFragment = "precision highp float;uniform sampler2D tex;varying vec2 vUV;void main(){gl_FragColor=texture2D(tex,vUV);}";

  var cache = new WeakMap();

  var glContextParams = {
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
    antialias: false,
    depth: false,
  };

  /**
   * This is a little helper library for WebGL. It assists with state management for a GL context.
   * It's pretty tightly wrapped to the needs of this package, not very general-purpose.
   *
   * @param { WebGLRenderingContext | HTMLCanvasElement | OffscreenCanvas } glOrCanvas - the GL context to wrap
   * @param { ({gl, getExtension, withProgram, withTexture, withTextureFramebuffer, handleContextLoss}) => void } callback
   */
  function withWebGLContext (glOrCanvas, callback) {
    var gl = glOrCanvas.getContext ? glOrCanvas.getContext('webgl', glContextParams) : glOrCanvas;
    var wrapper = cache.get(gl);
    if (!wrapper) {
      var isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
      var extensions = {};
      var programs = {};
      var textures = {};
      var textureUnit = -1;
      var framebufferStack = [];

      gl.canvas.addEventListener('webglcontextlost', function (e) {
        handleContextLoss();
        e.preventDefault();
      }, false);

      function getExtension (name) {
        var ext = extensions[name];
        if (!ext) {
          ext = extensions[name] = gl.getExtension(name);
          if (!ext) {
            throw new Error((name + " not supported"))
          }
        }
        return ext
      }

      function compileShader (src, type) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        // const status = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
        // if (!status && !gl.isContextLost()) {
        //   throw new Error(gl.getShaderInfoLog(shader).trim())
        // }
        return shader
      }

      function withProgram (name, vert, frag, func) {
        if (!programs[name]) {
          var attributes = {};
          var uniforms = {};
          var program = gl.createProgram();
          gl.attachShader(program, compileShader(vert, gl.VERTEX_SHADER));
          gl.attachShader(program, compileShader(frag, gl.FRAGMENT_SHADER));
          gl.linkProgram(program);

          programs[name] = {
            program: program,
            transaction: function transaction (func) {
              gl.useProgram(program);
              func({
                setUniform: function setUniform (type, name) {
                  var values = [], len = arguments.length - 2;
                  while ( len-- > 0 ) values[ len ] = arguments[ len + 2 ];

                  var uniformLoc = uniforms[name] || (uniforms[name] = gl.getUniformLocation(program, name));
                  gl[("uniform" + type)].apply(gl, [ uniformLoc ].concat( values ));
                },

                setAttribute: function setAttribute (name, size, usage, instancingDivisor, data) {
                  var attr = attributes[name];
                  if (!attr) {
                    attr = attributes[name] = {
                      buf: gl.createBuffer(), // TODO should we destroy our buffers?
                      loc: gl.getAttribLocation(program, name),
                      data: null
                    };
                  }
                  gl.bindBuffer(gl.ARRAY_BUFFER, attr.buf);
                  gl.vertexAttribPointer(attr.loc, size, gl.FLOAT, false, 0, 0);
                  gl.enableVertexAttribArray(attr.loc);
                  if (isWebGL2) {
                    gl.vertexAttribDivisor(attr.loc, instancingDivisor);
                  } else {
                    getExtension('ANGLE_instanced_arrays').vertexAttribDivisorANGLE(attr.loc, instancingDivisor);
                  }
                  if (data !== attr.data) {
                    gl.bufferData(gl.ARRAY_BUFFER, data, usage);
                    attr.data = data;
                  }
                }
              });
            }
          };
        }

        programs[name].transaction(func);
      }

      function withTexture (name, func) {
        textureUnit++;
        try {
          gl.activeTexture(gl.TEXTURE0 + textureUnit);
          var texture = textures[name];
          if (!texture) {
            texture = textures[name] = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          }
          gl.bindTexture(gl.TEXTURE_2D, texture);
          func(texture, textureUnit);
        } finally {
          textureUnit--;
        }
      }

      function withTextureFramebuffer (texture, textureUnit, func) {
        var framebuffer = gl.createFramebuffer();
        framebufferStack.push(framebuffer);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.activeTexture(gl.TEXTURE0 + textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        try {
          func(framebuffer);
        } finally {
          gl.deleteFramebuffer(framebuffer);
          gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferStack[--framebufferStack.length - 1] || null);
        }
      }

      function handleContextLoss () {
        extensions = {};
        programs = {};
        textures = {};
        textureUnit = -1;
        framebufferStack.length = 0;
      }

      cache.set(gl, wrapper = {
        gl: gl,
        isWebGL2: isWebGL2,
        getExtension: getExtension,
        withProgram: withProgram,
        withTexture: withTexture,
        withTextureFramebuffer: withTextureFramebuffer,
        handleContextLoss: handleContextLoss,
      });
    }
    callback(wrapper);
  }


  function renderImageData(glOrCanvas, imageData, x, y, width, height, channels, framebuffer) {
    if ( channels === void 0 ) channels = 15;
    if ( framebuffer === void 0 ) framebuffer = null;

    withWebGLContext(glOrCanvas, function (ref) {
      var gl = ref.gl;
      var withProgram = ref.withProgram;
      var withTexture = ref.withTexture;

      withTexture('copy', function (tex, texUnit) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
        withProgram('copy', viewportQuadVertex, copyTexFragment, function (ref) {
          var setUniform = ref.setUniform;
          var setAttribute = ref.setAttribute;

          setAttribute('aUV', 2, gl.STATIC_DRAW, 0, new Float32Array([0, 0, 2, 0, 0, 2]));
          setUniform('1i', 'image', texUnit);
          gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer || null);
          gl.disable(gl.BLEND);
          gl.colorMask(channels & 8, channels & 4, channels & 2, channels & 1);
          gl.viewport(x, y, width, height);
          gl.scissor(x, y, width, height);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        });
      });
    });
  }

  /**
   * Resizing a canvas clears its contents; this utility copies the previous contents over.
   * @param canvas
   * @param newWidth
   * @param newHeight
   */
  function resizeWebGLCanvasWithoutClearing(canvas, newWidth, newHeight) {
    var width = canvas.width;
    var height = canvas.height;
    withWebGLContext(canvas, function (ref) {
      var gl = ref.gl;

      var data = new Uint8Array(width * height * 4);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
      canvas.width = newWidth;
      canvas.height = newHeight;
      renderImageData(gl, data, 0, 0, width, height);
    });
  }

  var webglUtils = /*#__PURE__*/Object.freeze({
    __proto__: null,
    withWebGLContext: withWebGLContext,
    renderImageData: renderImageData,
    resizeWebGLCanvasWithoutClearing: resizeWebGLCanvasWithoutClearing
  });

  function generate$2 (sdfWidth, sdfHeight, path, viewBox, maxDistance, sdfExponent) {
    if ( sdfExponent === void 0 ) sdfExponent = 1;

    var textureData = new Uint8Array(sdfWidth * sdfHeight);

    var viewBoxWidth = viewBox[2] - viewBox[0];
    var viewBoxHeight = viewBox[3] - viewBox[1];

    // Decompose all paths into straight line segments and add them to an index
    var segments = [];
    pathToLineSegments(path, function (x1, y1, x2, y2) {
      segments.push({
        x1: x1, y1: y1, x2: x2, y2: y2,
        minX: Math.min(x1, x2),
        minY: Math.min(y1, y2),
        maxX: Math.max(x1, x2),
        maxY: Math.max(y1, y2)
      });
    });

    // Sort segments by maxX, this will let us short-circuit some loops below
    segments.sort(function (a, b) { return a.maxX - b.maxX; });

    // For each target SDF texel, find the distance from its center to its nearest line segment,
    // map that distance to an alpha value, and write that alpha to the texel
    for (var sdfX = 0; sdfX < sdfWidth; sdfX++) {
      for (var sdfY = 0; sdfY < sdfHeight; sdfY++) {
        var signedDist = findNearestSignedDistance(
          viewBox[0] + viewBoxWidth * (sdfX + 0.5) / sdfWidth,
          viewBox[1] + viewBoxHeight * (sdfY + 0.5) / sdfHeight
        );

        // Use an exponential scale to ensure the texels very near the glyph path have adequate
        // precision, while allowing the distance field to cover the entire texture, given that
        // there are only 8 bits available. Formula visualized: https://www.desmos.com/calculator/uiaq5aqiam
        var alpha = Math.pow((1 - Math.abs(signedDist) / maxDistance), sdfExponent) / 2;
        if (signedDist < 0) {
          alpha = 1 - alpha;
        }

        alpha = Math.max(0, Math.min(255, Math.round(alpha * 255))); //clamp
        textureData[sdfY * sdfWidth + sdfX] = alpha;
      }
    }

    return textureData

    /**
     * For a given x/y, search the index for the closest line segment and return
     * its signed distance. Negative = inside, positive = outside, zero = on edge
     * @param x
     * @param y
     * @returns {number}
     */
    function findNearestSignedDistance (x, y) {
      var closestDistSq = Infinity;
      var closestDist = Infinity;

      for (var i = segments.length; i--;) {
        var seg = segments[i];
        if (seg.maxX + closestDist <= x) { break } //sorting by maxX means no more can be closer, so we can short-circuit
        if (x + closestDist > seg.minX && y - closestDist < seg.maxY && y + closestDist > seg.minY) {
          var distSq = absSquareDistanceToLineSegment(x, y, seg.x1, seg.y1, seg.x2, seg.y2);
          if (distSq < closestDistSq) {
            closestDistSq = distSq;
            closestDist = Math.sqrt(closestDistSq);
          }
        }
      }

      // Flip to negative distance if inside the poly
      if (isPointInPoly(x, y)) {
        closestDist = -closestDist;
      }
      return closestDist
    }

    /**
     * Determine whether the given point lies inside or outside the glyph. Uses a simple
     * winding-number ray casting algorithm using a ray pointing east from the point.
     */
    function isPointInPoly (x, y) {
      var winding = 0;
      for (var i = segments.length; i--;) {
        var seg = segments[i];
        if (seg.maxX <= x) { break } //sorting by maxX means no more can cross, so we can short-circuit
        var intersects = ((seg.y1 > y) !== (seg.y2 > y)) && (x < (seg.x2 - seg.x1) * (y - seg.y1) / (seg.y2 - seg.y1) + seg.x1);
        if (intersects) {
          winding += seg.y1 < seg.y2 ? 1 : -1;
        }
      }
      return winding !== 0
    }
  }

  function generateIntoCanvas$2(sdfWidth, sdfHeight, path, viewBox, maxDistance, sdfExponent, canvas, x, y, channel) {
    if ( sdfExponent === void 0 ) sdfExponent = 1;
    if ( x === void 0 ) x = 0;
    if ( y === void 0 ) y = 0;
    if ( channel === void 0 ) channel = 0;

    generateIntoFramebuffer$1(sdfWidth, sdfHeight, path, viewBox, maxDistance, sdfExponent, canvas, null, x, y, channel);
  }

  function generateIntoFramebuffer$1 (sdfWidth, sdfHeight, path, viewBox, maxDistance, sdfExponent, glOrCanvas, framebuffer, x, y, channel) {
    if ( sdfExponent === void 0 ) sdfExponent = 1;
    if ( x === void 0 ) x = 0;
    if ( y === void 0 ) y = 0;
    if ( channel === void 0 ) channel = 0;

    var data = generate$2(sdfWidth, sdfHeight, path, viewBox, maxDistance, sdfExponent);
    // Expand single-channel data to rbga
    var rgbaData = new Uint8Array(data.length * 4);
    for (var i = 0; i < data.length; i++) {
      rgbaData[i * 4 + channel] = data[i];
    }
    renderImageData(glOrCanvas, rgbaData, x, y, sdfWidth, sdfHeight, 1 << (3 - channel), framebuffer);
  }

  /**
   * Find the absolute distance from a point to a line segment at closest approach
   */
  function absSquareDistanceToLineSegment (x, y, lineX0, lineY0, lineX1, lineY1) {
    var ldx = lineX1 - lineX0;
    var ldy = lineY1 - lineY0;
    var lengthSq = ldx * ldx + ldy * ldy;
    var t = lengthSq ? Math.max(0, Math.min(1, ((x - lineX0) * ldx + (y - lineY0) * ldy) / lengthSq)) : 0;
    var dx = x - (lineX0 + t * ldx);
    var dy = y - (lineY0 + t * ldy);
    return dx * dx + dy * dy
  }

  var javascript = /*#__PURE__*/Object.freeze({
    __proto__: null,
    generate: generate$2,
    generateIntoCanvas: generateIntoCanvas$2,
    generateIntoFramebuffer: generateIntoFramebuffer$1
  });

  var mainVertex = "precision highp float;uniform vec4 uGlyphBounds;attribute vec2 aUV;attribute vec4 aLineSegment;varying vec4 vLineSegment;varying vec2 vGlyphXY;void main(){vLineSegment=aLineSegment;vGlyphXY=mix(uGlyphBounds.xy,uGlyphBounds.zw,aUV);gl_Position=vec4(mix(vec2(-1.0),vec2(1.0),aUV),0.0,1.0);}";

  var mainFragment = "precision highp float;uniform vec4 uGlyphBounds;uniform float uMaxDistance;uniform float uExponent;varying vec4 vLineSegment;varying vec2 vGlyphXY;float absDistToSegment(vec2 point,vec2 lineA,vec2 lineB){vec2 lineDir=lineB-lineA;float lenSq=dot(lineDir,lineDir);float t=lenSq==0.0 ? 0.0 : clamp(dot(point-lineA,lineDir)/lenSq,0.0,1.0);vec2 linePt=lineA+t*lineDir;return distance(point,linePt);}void main(){vec4 seg=vLineSegment;vec2 p=vGlyphXY;float dist=absDistToSegment(p,seg.xy,seg.zw);float val=pow(1.0-clamp(dist/uMaxDistance,0.0,1.0),uExponent)*0.5;bool crossing=(seg.y>p.y!=seg.w>p.y)&&(p.x<(seg.z-seg.x)*(p.y-seg.y)/(seg.w-seg.y)+seg.x);bool crossingUp=crossing&&vLineSegment.y<vLineSegment.w;gl_FragColor=vec4(crossingUp ? 1.0/255.0 : 0.0,crossing&&!crossingUp ? 1.0/255.0 : 0.0,0.0,val);}";

  var postFragment = "precision highp float;uniform sampler2D tex;varying vec2 vUV;void main(){vec4 color=texture2D(tex,vUV);bool inside=color.r!=color.g;float val=inside ? 1.0-color.a : color.a;gl_FragColor=vec4(val);}";

  // Single triangle covering viewport
  var viewportUVs = new Float32Array([0, 0, 2, 0, 0, 2]);

  var implicitContext = null;
  var isTestingSupport = false;
  var NULL_OBJECT = {};
  var supportByCanvas = new WeakMap(); // canvas -> bool

  function validateSupport (glOrCanvas) {
    if (!isTestingSupport && !isSupported(glOrCanvas)) {
      throw new Error('WebGL generation not supported')
    }
  }

  function generate$1 (sdfWidth, sdfHeight, path, viewBox, maxDistance, sdfExponent, glOrCanvas) {
    if ( sdfExponent === void 0 ) sdfExponent = 1;
    if ( glOrCanvas === void 0 ) glOrCanvas = null;

    if (!glOrCanvas) {
      glOrCanvas = implicitContext;
      if (!glOrCanvas) {
        var canvas = typeof OffscreenCanvas === 'function'
          ? new OffscreenCanvas(1, 1)
          : typeof document !== 'undefined'
            ? document.createElement('canvas')
            : null;
        if (!canvas) {
          throw new Error('OffscreenCanvas or DOM canvas not supported')
        }
        glOrCanvas = implicitContext = canvas.getContext('webgl', { depth: false });
      }
    }

    validateSupport(glOrCanvas);

    var rgbaData = new Uint8Array(sdfWidth * sdfHeight * 4); //not Uint8ClampedArray, cuz Safari

    // Render into a background texture framebuffer
    withWebGLContext(glOrCanvas, function (ref) {
      var gl = ref.gl;
      var withTexture = ref.withTexture;
      var withTextureFramebuffer = ref.withTextureFramebuffer;

      withTexture('readable', function (texture, textureUnit) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sdfWidth, sdfHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        withTextureFramebuffer(texture, textureUnit, function (framebuffer) {
          generateIntoFramebuffer(
            sdfWidth,
            sdfHeight,
            path,
            viewBox,
            maxDistance,
            sdfExponent,
            gl,
            framebuffer,
            0,
            0,
            0 // red channel
          );
          gl.readPixels(0, 0, sdfWidth, sdfHeight, gl.RGBA, gl.UNSIGNED_BYTE, rgbaData);
        });
      });
    });

    // Throw away all but the red channel
    var data = new Uint8Array(sdfWidth * sdfHeight);
    for (var i = 0, j = 0; i < rgbaData.length; i += 4) {
      data[j++] = rgbaData[i];
    }

    return data
  }

  function generateIntoCanvas$1(sdfWidth, sdfHeight, path, viewBox, maxDistance, sdfExponent, canvas, x, y, channel) {
    if ( sdfExponent === void 0 ) sdfExponent = 1;
    if ( x === void 0 ) x = 0;
    if ( y === void 0 ) y = 0;
    if ( channel === void 0 ) channel = 0;

    generateIntoFramebuffer(sdfWidth, sdfHeight, path, viewBox, maxDistance, sdfExponent, canvas, null, x, y, channel);
  }

  function generateIntoFramebuffer (sdfWidth, sdfHeight, path, viewBox, maxDistance, sdfExponent, glOrCanvas, framebuffer, x, y, channel) {
    if ( sdfExponent === void 0 ) sdfExponent = 1;
    if ( x === void 0 ) x = 0;
    if ( y === void 0 ) y = 0;
    if ( channel === void 0 ) channel = 0;

    // Verify support
    validateSupport(glOrCanvas);

    // Compute path segments
    var lineSegmentCoords = [];
    pathToLineSegments(path, function (x1, y1, x2, y2) {
      lineSegmentCoords.push(x1, y1, x2, y2);
    });
    lineSegmentCoords = new Float32Array(lineSegmentCoords);

    withWebGLContext(glOrCanvas, function (ref) {
      var gl = ref.gl;
      var isWebGL2 = ref.isWebGL2;
      var getExtension = ref.getExtension;
      var withProgram = ref.withProgram;
      var withTexture = ref.withTexture;
      var withTextureFramebuffer = ref.withTextureFramebuffer;
      var handleContextLoss = ref.handleContextLoss;

      withTexture('rawDistances', function (intermediateTexture, intermediateTextureUnit) {
        if (sdfWidth !== intermediateTexture._lastWidth || sdfHeight !== intermediateTexture._lastHeight) {
          gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA,
            intermediateTexture._lastWidth = sdfWidth,
            intermediateTexture._lastHeight = sdfHeight,
            0, gl.RGBA, gl.UNSIGNED_BYTE, null
          );
        }

        // Unsigned distance pass
        withProgram('main', mainVertex, mainFragment, function (ref) {
          var setAttribute = ref.setAttribute;
          var setUniform = ref.setUniform;

          // Init extensions
          var instancingExtension = !isWebGL2 && getExtension('ANGLE_instanced_arrays');
          var blendMinMaxExtension = !isWebGL2 && getExtension('EXT_blend_minmax');

          // Init/update attributes
          setAttribute('aUV', 2, gl.STATIC_DRAW, 0, viewportUVs);
          setAttribute('aLineSegment', 4, gl.DYNAMIC_DRAW, 1, lineSegmentCoords);

          // Init/update uniforms
          setUniform.apply(void 0, [ '4f', 'uGlyphBounds' ].concat( viewBox ));
          setUniform('1f', 'uMaxDistance', maxDistance);
          setUniform('1f', 'uExponent', sdfExponent);

          // Render initial unsigned distance / winding number info to a texture
          withTextureFramebuffer(intermediateTexture, intermediateTextureUnit, function (framebuffer) {
            gl.enable(gl.BLEND);
            gl.colorMask(true, true, true, true);
            gl.viewport(0, 0, sdfWidth, sdfHeight);
            gl.scissor(0, 0, sdfWidth, sdfHeight);
            gl.blendFunc(gl.ONE, gl.ONE);
            // Red+Green channels are incremented (FUNC_ADD) for segment-ray crossings to give a "winding number".
            // Alpha holds the closest (MAX) unsigned distance.
            gl.blendEquationSeparate(gl.FUNC_ADD, isWebGL2 ? gl.MAX : blendMinMaxExtension.MAX_EXT);
            gl.clear(gl.COLOR_BUFFER_BIT);
            if (isWebGL2) {
              gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, lineSegmentCoords.length / 4);
            } else {
              instancingExtension.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 3, lineSegmentCoords.length / 4);
            }
            // Debug
            // const debug = new Uint8Array(sdfWidth * sdfHeight * 4)
            // gl.readPixels(0, 0, sdfWidth, sdfHeight, gl.RGBA, gl.UNSIGNED_BYTE, debug)
            // console.log('intermediate texture data: ', debug)
          });
        });

        // Use the data stored in the texture to apply inside/outside and write to the output framebuffer rect+channel.
        withProgram('post', viewportQuadVertex, postFragment, function (program) {
          program.setAttribute('aUV', 2, gl.STATIC_DRAW, 0, viewportUVs);
          program.setUniform('1i', 'tex', intermediateTextureUnit);
          gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
          gl.disable(gl.BLEND);
          gl.colorMask(channel === 0, channel === 1, channel === 2, channel === 3);
          gl.viewport(x, y, sdfWidth, sdfHeight);
          gl.scissor(x, y, sdfWidth, sdfHeight);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        });
      });

      // Handle context loss occurring during any of the above calls
      if (gl.isContextLost()) {
        handleContextLoss();
        throw new Error('webgl context lost')
      }
    });
  }

  function isSupported (glOrCanvas) {
    var key = (!glOrCanvas || glOrCanvas === implicitContext) ? NULL_OBJECT : (glOrCanvas.canvas || glOrCanvas);
    var supported = supportByCanvas.get(key);
    if (supported === undefined) {
      isTestingSupport = true;
      var failReason = null;
      try {
        // Since we can't detect all failure modes up front, let's just do a trial run of a
        // simple path and compare what we get back to the correct expected result. This will
        // also serve to prime the shader compilation.
        var expectedResult = [
          97, 106, 97, 61,
          99, 137, 118, 80,
          80, 118, 137, 99,
          61, 97, 106, 97
        ];
        var testResult = generate$1(
          4,
          4,
          'M8,8L16,8L24,24L16,24Z',
          [0, 0, 32, 32],
          24,
          1,
          glOrCanvas
        );
        supported = testResult && expectedResult.length === testResult.length &&
          testResult.every(function (val, i) { return val === expectedResult[i]; });
        if (!supported) {
          failReason = 'bad trial run results';
          console.info(expectedResult, testResult);
        }
      } catch (err) {
        // TODO if it threw due to webgl context loss, should we maybe leave isSupported as null and try again later?
        supported = false;
        failReason = err.message;
      }
      if (failReason) {
        console.warn('WebGL SDF generation not supported:', failReason);
      }
      isTestingSupport = false;
      supportByCanvas.set(key, supported);
    }
    return supported
  }

  var webgl = /*#__PURE__*/Object.freeze({
    __proto__: null,
    generate: generate$1,
    generateIntoCanvas: generateIntoCanvas$1,
    generateIntoFramebuffer: generateIntoFramebuffer,
    isSupported: isSupported
  });

  /**
   * Generate an SDF texture image for a 2D path.
   *
   * @param {number} sdfWidth - width of the SDF output image in pixels.
   * @param {number} sdfHeight - height of the SDF output image in pixels.
   * @param {string} path - an SVG-like path string describing the glyph; should only contain commands: M/L/Q/C/Z.
   * @param {number[]} viewBox - [minX, minY, maxX, maxY] in font units aligning with the texture's edges.
   * @param {number} maxDistance - the maximum distance from the glyph path in font units that will be encoded; defaults
   *        to half the maximum viewBox dimension.
   * @param {number} [sdfExponent] - specifies an exponent for encoding the SDF's distance values; higher exponents
   *        will give greater precision nearer the glyph's path.
   * @return {Uint8Array}
   */
  function generate(
    sdfWidth,
    sdfHeight,
    path,
    viewBox,
    maxDistance,
    sdfExponent
  ) {
    if ( maxDistance === void 0 ) maxDistance = Math.max(viewBox[2] - viewBox[0], viewBox[3] - viewBox[1]) / 2;
    if ( sdfExponent === void 0 ) sdfExponent = 1;

    try {
      return generate$1.apply(webgl, arguments)
    } catch(e) {
      console.info('WebGL SDF generation failed, falling back to JS', e);
      return generate$2.apply(javascript, arguments)
    }
  }

  /**
   * Generate an SDF texture image for a 2D path, inserting the result into a WebGL `canvas` at a given x/y position
   * and color channel. This is generally much faster than calling `generate` because it does not require reading pixels
   * back from the GPU->CPU -- the `canvas` can be used directly as a WebGL texture image, so it all stays on the GPU.
   *
   * @param {number} sdfWidth - width of the SDF output image in pixels.
   * @param {number} sdfHeight - height of the SDF output image in pixels.
   * @param {string} path - an SVG-like path string describing the glyph; should only contain commands: M/L/Q/C/Z.
   * @param {number[]} viewBox - [minX, minY, maxX, maxY] in font units aligning with the texture's edges.
   * @param {number} maxDistance - the maximum distance from the glyph path in font units that will be encoded; defaults
   *        to half the maximum viewBox dimension.
   * @param {number} [sdfExponent] - specifies an exponent for encoding the SDF's distance values; higher exponents
   *        will give greater precision nearer the glyph's path.
   * @param {HTMLCanvasElement|OffscreenCanvas} canvas - a WebGL-enabled canvas into which the SDF will be rendered.
   *        Only the relevant rect/channel will be modified, the rest will be preserved. To avoid unpredictable results
   *        due to shared GL context state, this canvas should be dedicated to use by this library alone.
   * @param {number} x - the x position at which to render the SDF.
   * @param {number} y - the y position at which to render the SDF.
   * @param {number} channel - the color channel index (0-4) into which the SDF will be rendered.
   * @return {Uint8Array}
   */
  function generateIntoCanvas(
    sdfWidth,
    sdfHeight,
    path,
    viewBox,
    maxDistance,
    sdfExponent,
    canvas,
    x,
    y,
    channel
  ) {
    if ( maxDistance === void 0 ) maxDistance = Math.max(viewBox[2] - viewBox[0], viewBox[3] - viewBox[1]) / 2;
    if ( sdfExponent === void 0 ) sdfExponent = 1;
    if ( x === void 0 ) x = 0;
    if ( y === void 0 ) y = 0;
    if ( channel === void 0 ) channel = 0;

    try {
      return generateIntoCanvas$1.apply(webgl, arguments)
    } catch(e) {
      console.info('WebGL SDF generation failed, falling back to JS', e);
      return generateIntoCanvas$2.apply(javascript, arguments)
    }
  }

  exports.forEachPathCommand = forEachPathCommand;
  exports.generate = generate;
  exports.generateIntoCanvas = generateIntoCanvas;
  exports.javascript = javascript;
  exports.pathToLineSegments = pathToLineSegments;
  exports.webgl = webgl;
  exports.webglUtils = webglUtils;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

}({}));
return exports
}

var u=()=>(self.performance||Date).now(),S=SDFGenerator(),p;function A(e,r,n,o,i,c,f,g,d,l,s=true){return s?L(e,r,n,o,i,c,f,g,d,l).then(null,t=>(p||(console.warn("WebGL SDF generation failed, falling back to JS",t),p=true),W(e,r,n,o,i,c,f,g,d,l))):W(e,r,n,o,i,c,f,g,d,l)}var D$1=[],q=5,k=0;function G$1(){let e=u();for(;D$1.length&&u()-e<q;)D$1.shift()();k=D$1.length?setTimeout(G$1,0):0;}var L=(...e)=>new Promise((r,n)=>{D$1.push(()=>{let o=u();try{S.webgl.generateIntoCanvas(...e),r({timing:u()-o});}catch(i){n(i);}}),k||(k=setTimeout(G$1,0));}),U=4,I$1=2e3,C={},J$1=0;function W(e,r,n,o,i,c,f,g,d,l){let s="ThreeBlocksTextSDFGenerator_JS_"+J$1++%U,t=C[s];return t||(t=C[s]={workerModule:defineWorkerModule({name:s,workerId:s,dependencies:[SDFGenerator,u],init(a,T){let b=a().javascript.generate;return function(...w){let m=T();return {textureData:b(...w),timing:T()-m}}},getTransferables(a){return [a.textureData.buffer]}}),requests:0,idleTimer:null}),t.requests++,clearTimeout(t.idleTimer),t.workerModule(e,r,n,o,i,c).then(({textureData:a,timing:T})=>{let b=u(),w=new Uint8Array(a.length*4);for(let m=0;m<a.length;m++)w[m*4+l]=a[m];return S.webglUtils.renderImageData(f,w,g,d,e,r,1<<3-l),T+=u()-b,--t.requests===0&&(t.idleTimer=setTimeout(()=>{terminateWorker(s);},I$1)),{timing:T}})}function N(e){e._warm||(S.webgl.isSupported(e),e._warm=true);}var P$2=S.webglUtils.resizeWebGLCanvasWithoutClearing;

function bidiFactory() {
var bidi = (function (exports) {

  // Bidi character types data, auto generated
  var DATA = {
    "R": "13k,1a,2,3,3,2+1j,ch+16,a+1,5+2,2+n,5,a,4,6+16,4+3,h+1b,4mo,179q,2+9,2+11,2i9+7y,2+68,4,3+4,5+13,4+3,2+4k,3+29,8+cf,1t+7z,w+17,3+3m,1t+3z,16o1+5r,8+30,8+mc,29+1r,29+4v,75+73",
    "EN": "1c+9,3d+1,6,187+9,513,4+5,7+9,sf+j,175h+9,qw+q,161f+1d,4xt+a,25i+9",
    "ES": "17,2,6dp+1,f+1,av,16vr,mx+1,4o,2",
    "ET": "z+2,3h+3,b+1,ym,3e+1,2o,p4+1,8,6u,7c,g6,1wc,1n9+4,30+1b,2n,6d,qhx+1,h0m,a+1,49+2,63+1,4+1,6bb+3,12jj",
    "AN": "16o+5,2j+9,2+1,35,ed,1ff2+9,87+u",
    "CS": "18,2+1,b,2u,12k,55v,l,17v0,2,3,53,2+1,b",
    "B": "a,3,f+2,2v,690",
    "S": "9,2,k",
    "WS": "c,k,4f4,1vk+a,u,1j,335",
    "ON": "x+1,4+4,h+5,r+5,r+3,z,5+3,2+1,2+1,5,2+2,3+4,o,w,ci+1,8+d,3+d,6+8,2+g,39+1,9,6+1,2,33,b8,3+1,3c+1,7+1,5r,b,7h+3,sa+5,2,3i+6,jg+3,ur+9,2v,ij+1,9g+9,7+a,8m,4+1,49+x,14u,2+2,c+2,e+2,e+2,e+1,i+n,e+e,2+p,u+2,e+2,36+1,2+3,2+1,b,2+2,6+5,2,2,2,h+1,5+4,6+3,3+f,16+2,5+3l,3+81,1y+p,2+40,q+a,m+13,2r+ch,2+9e,75+hf,3+v,2+2w,6e+5,f+6,75+2a,1a+p,2+2g,d+5x,r+b,6+3,4+o,g,6+1,6+2,2k+1,4,2j,5h+z,1m+1,1e+f,t+2,1f+e,d+3,4o+3,2s+1,w,535+1r,h3l+1i,93+2,2s,b+1,3l+x,2v,4g+3,21+3,kz+1,g5v+1,5a,j+9,n+v,2,3,2+8,2+1,3+2,2,3,46+1,4+4,h+5,r+5,r+a,3h+2,4+6,b+4,78,1r+24,4+c,4,1hb,ey+6,103+j,16j+c,1ux+7,5+g,fsh,jdq+1t,4,57+2e,p1,1m,1m,1m,1m,4kt+1,7j+17,5+2r,d+e,3+e,2+e,2+10,m+4,w,1n+5,1q,4z+5,4b+rb,9+c,4+c,4+37,d+2g,8+b,l+b,5+1j,9+9,7+13,9+t,3+1,27+3c,2+29,2+3q,d+d,3+4,4+2,6+6,a+o,8+6,a+2,e+6,16+42,2+1i",
    "BN": "0+8,6+d,2s+5,2+p,e,4m9,1kt+2,2b+5,5+5,17q9+v,7k,6p+8,6+1,119d+3,440+7,96s+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+75,6p+2rz,1ben+1,1ekf+1,1ekf+1",
    "NSM": "lc+33,7o+6,7c+18,2,2+1,2+1,2,21+a,1d+k,h,2u+6,3+5,3+1,2+3,10,v+q,2k+a,1n+8,a,p+3,2+8,2+2,2+4,18+2,3c+e,2+v,1k,2,5+7,5,4+6,b+1,u,1n,5+3,9,l+1,r,3+1,1m,5+1,5+1,3+2,4,v+1,4,c+1,1m,5+4,2+1,5,l+1,n+5,2,1n,3,2+3,9,8+1,c+1,v,1q,d,1f,4,1m+2,6+2,2+3,8+1,c+1,u,1n,g+1,l+1,t+1,1m+1,5+3,9,l+1,u,21,8+2,2,2j,3+6,d+7,2r,3+8,c+5,23+1,s,2,2,1k+d,2+4,2+1,6+a,2+z,a,2v+3,2+5,2+1,3+1,q+1,5+2,h+3,e,3+1,7,g,jk+2,qb+2,u+2,u+1,v+1,1t+1,2+6,9,3+a,a,1a+2,3c+1,z,3b+2,5+1,a,7+2,64+1,3,1n,2+6,2,2,3+7,7+9,3,1d+g,1s+3,1d,2+4,2,6,15+8,d+1,x+3,3+1,2+2,1l,2+1,4,2+2,1n+7,3+1,49+2,2+c,2+6,5,7,4+1,5j+1l,2+4,k1+w,2db+2,3y,2p+v,ff+3,30+1,n9x+3,2+9,x+1,29+1,7l,4,5,q+1,6,48+1,r+h,e,13+7,q+a,1b+2,1d,3+3,3+1,14,1w+5,3+1,3+1,d,9,1c,1g,2+2,3+1,6+1,2,17+1,9,6n,3,5,fn5,ki+f,h+f,r2,6b,46+4,1af+2,2+1,6+3,15+2,5,4m+1,fy+3,as+1,4a+a,4x,1j+e,1l+2,1e+3,3+1,1y+2,11+4,2+7,1r,d+1,1h+8,b+3,3,2o+2,3,2+1,7,4h,4+7,m+1,1m+1,4,12+6,4+4,5g+7,3+2,2,o,2d+5,2,5+1,2+1,6n+3,7+1,2+1,s+1,2e+7,3,2+1,2z,2,3+5,2,2u+2,3+3,2+4,78+8,2+1,75+1,2,5,41+3,3+1,5,x+5,3+1,15+5,3+3,9,a+5,3+2,1b+c,2+1,bb+6,2+5,2d+l,3+6,2+1,2+1,3f+5,4,2+1,2+6,2,21+1,4,2,9o+1,f0c+4,1o+6,t5,1s+3,2a,f5l+1,43t+2,i+7,3+6,v+3,45+2,1j0+1i,5+1d,9,f,n+4,2+e,11t+6,2+g,3+6,2+1,2+4,7a+6,c6+3,15t+6,32+6,gzhy+6n",
    "AL": "16w,3,2,e+1b,z+2,2+2s,g+1,8+1,b+m,2+t,s+2i,c+e,4h+f,1d+1e,1bwe+dp,3+3z,x+c,2+1,35+3y,2rm+z,5+7,b+5,dt+l,c+u,17nl+27,1t+27,4x+6n,3+d",
    "LRO": "6ct",
    "RLO": "6cu",
    "LRE": "6cq",
    "RLE": "6cr",
    "PDF": "6cs",
    "LRI": "6ee",
    "RLI": "6ef",
    "FSI": "6eg",
    "PDI": "6eh"
  };

  var TYPES = {};
  var TYPES_TO_NAMES = {};
  TYPES.L = 1; //L is the default
  TYPES_TO_NAMES[1] = 'L';
  Object.keys(DATA).forEach(function (type, i) {
    TYPES[type] = 1 << (i + 1);
    TYPES_TO_NAMES[TYPES[type]] = type;
  });
  Object.freeze(TYPES);

  var ISOLATE_INIT_TYPES = TYPES.LRI | TYPES.RLI | TYPES.FSI;
  var STRONG_TYPES = TYPES.L | TYPES.R | TYPES.AL;
  var NEUTRAL_ISOLATE_TYPES = TYPES.B | TYPES.S | TYPES.WS | TYPES.ON | TYPES.FSI | TYPES.LRI | TYPES.RLI | TYPES.PDI;
  var BN_LIKE_TYPES = TYPES.BN | TYPES.RLE | TYPES.LRE | TYPES.RLO | TYPES.LRO | TYPES.PDF;
  var TRAILING_TYPES = TYPES.S | TYPES.WS | TYPES.B | ISOLATE_INIT_TYPES | TYPES.PDI | BN_LIKE_TYPES;

  var map = null;

  function parseData () {
    if (!map) {
      //const start = performance.now()
      map = new Map();
      var loop = function ( type ) {
        if (DATA.hasOwnProperty(type)) {
          var lastCode = 0;
          DATA[type].split(',').forEach(function (range) {
            var ref = range.split('+');
            var skip = ref[0];
            var step = ref[1];
            skip = parseInt(skip, 36);
            step = step ? parseInt(step, 36) : 0;
            map.set(lastCode += skip, TYPES[type]);
            for (var i = 0; i < step; i++) {
              map.set(++lastCode, TYPES[type]);
            }
          });
        }
      };

      for (var type in DATA) loop( type );
      //console.log(`char types parsed in ${performance.now() - start}ms`)
    }
  }

  /**
   * @param {string} char
   * @return {number}
   */
  function getBidiCharType (char) {
    parseData();
    return map.get(char.codePointAt(0)) || TYPES.L
  }

  function getBidiCharTypeName(char) {
    return TYPES_TO_NAMES[getBidiCharType(char)]
  }

  // Bidi bracket pairs data, auto generated
  var data$1 = {
    "pairs": "14>1,1e>2,u>2,2wt>1,1>1,1ge>1,1wp>1,1j>1,f>1,hm>1,1>1,u>1,u6>1,1>1,+5,28>1,w>1,1>1,+3,b8>1,1>1,+3,1>3,-1>-1,3>1,1>1,+2,1s>1,1>1,x>1,th>1,1>1,+2,db>1,1>1,+3,3>1,1>1,+2,14qm>1,1>1,+1,4q>1,1e>2,u>2,2>1,+1",
    "canonical": "6f1>-6dx,6dy>-6dx,6ec>-6ed,6ee>-6ed,6ww>2jj,-2ji>2jj,14r4>-1e7l,1e7m>-1e7l,1e7m>-1e5c,1e5d>-1e5b,1e5c>-14qx,14qy>-14qx,14vn>-1ecg,1ech>-1ecg,1edu>-1ecg,1eci>-1ecg,1eda>-1ecg,1eci>-1ecg,1eci>-168q,168r>-168q,168s>-14ye,14yf>-14ye"
  };

  /**
   * Parses an string that holds encoded codepoint mappings, e.g. for bracket pairs or
   * mirroring characters, as encoded by scripts/generateBidiData.js. Returns an object
   * holding the `map`, and optionally a `reverseMap` if `includeReverse:true`.
   * @param {string} encodedString
   * @param {boolean} includeReverse - true if you want reverseMap in the output
   * @return {{map: Map<number, number>, reverseMap?: Map<number, number>}}
   */
  function parseCharacterMap (encodedString, includeReverse) {
    var radix = 36;
    var lastCode = 0;
    var map = new Map();
    var reverseMap = includeReverse && new Map();
    var prevPair;
    encodedString.split(',').forEach(function visit(entry) {
      if (entry.indexOf('+') !== -1) {
        for (var i = +entry; i--;) {
          visit(prevPair);
        }
      } else {
        prevPair = entry;
        var ref = entry.split('>');
        var a = ref[0];
        var b = ref[1];
        a = String.fromCodePoint(lastCode += parseInt(a, radix));
        b = String.fromCodePoint(lastCode += parseInt(b, radix));
        map.set(a, b);
        includeReverse && reverseMap.set(b, a);
      }
    });
    return { map: map, reverseMap: reverseMap }
  }

  var openToClose, closeToOpen, canonical;

  function parse$1 () {
    if (!openToClose) {
      //const start = performance.now()
      var ref = parseCharacterMap(data$1.pairs, true);
      var map = ref.map;
      var reverseMap = ref.reverseMap;
      openToClose = map;
      closeToOpen = reverseMap;
      canonical = parseCharacterMap(data$1.canonical, false).map;
      //console.log(`brackets parsed in ${performance.now() - start}ms`)
    }
  }

  function openingToClosingBracket (char) {
    parse$1();
    return openToClose.get(char) || null
  }

  function closingToOpeningBracket (char) {
    parse$1();
    return closeToOpen.get(char) || null
  }

  function getCanonicalBracket (char) {
    parse$1();
    return canonical.get(char) || null
  }

  // Local type aliases
  var TYPE_L = TYPES.L;
  var TYPE_R = TYPES.R;
  var TYPE_EN = TYPES.EN;
  var TYPE_ES = TYPES.ES;
  var TYPE_ET = TYPES.ET;
  var TYPE_AN = TYPES.AN;
  var TYPE_CS = TYPES.CS;
  var TYPE_B = TYPES.B;
  var TYPE_S = TYPES.S;
  var TYPE_ON = TYPES.ON;
  var TYPE_BN = TYPES.BN;
  var TYPE_NSM = TYPES.NSM;
  var TYPE_AL = TYPES.AL;
  var TYPE_LRO = TYPES.LRO;
  var TYPE_RLO = TYPES.RLO;
  var TYPE_LRE = TYPES.LRE;
  var TYPE_RLE = TYPES.RLE;
  var TYPE_PDF = TYPES.PDF;
  var TYPE_LRI = TYPES.LRI;
  var TYPE_RLI = TYPES.RLI;
  var TYPE_FSI = TYPES.FSI;
  var TYPE_PDI = TYPES.PDI;

  /**
   * @typedef {object} GetEmbeddingLevelsResult
   * @property {{start, end, level}[]} paragraphs
   * @property {Uint8Array} levels
   */

  /**
   * This function applies the Bidirectional Algorithm to a string, returning the resolved embedding levels
   * in a single Uint8Array plus a list of objects holding each paragraph's start and end indices and resolved
   * base embedding level.
   *
   * @param {string} string - The input string
   * @param {"ltr"|"rtl"|"auto"} [baseDirection] - Use "ltr" or "rtl" to force a base paragraph direction,
   *        otherwise a direction will be chosen automatically from each paragraph's contents.
   * @return {GetEmbeddingLevelsResult}
   */
  function getEmbeddingLevels (string, baseDirection) {
    var MAX_DEPTH = 125;

    // Start by mapping all characters to their unicode type, as a bitmask integer
    var charTypes = new Uint32Array(string.length);
    for (var i = 0; i < string.length; i++) {
      charTypes[i] = getBidiCharType(string[i]);
    }

    var charTypeCounts = new Map(); //will be cleared at start of each paragraph
    function changeCharType(i, type) {
      var oldType = charTypes[i];
      charTypes[i] = type;
      charTypeCounts.set(oldType, charTypeCounts.get(oldType) - 1);
      if (oldType & NEUTRAL_ISOLATE_TYPES) {
        charTypeCounts.set(NEUTRAL_ISOLATE_TYPES, charTypeCounts.get(NEUTRAL_ISOLATE_TYPES) - 1);
      }
      charTypeCounts.set(type, (charTypeCounts.get(type) || 0) + 1);
      if (type & NEUTRAL_ISOLATE_TYPES) {
        charTypeCounts.set(NEUTRAL_ISOLATE_TYPES, (charTypeCounts.get(NEUTRAL_ISOLATE_TYPES) || 0) + 1);
      }
    }

    var embedLevels = new Uint8Array(string.length);
    var isolationPairs = new Map(); //init->pdi and pdi->init

    // === 3.3.1 The Paragraph Level ===
    // 3.3.1 P1: Split the text into paragraphs
    var paragraphs = []; // [{start, end, level}, ...]
    var paragraph = null;
    for (var i$1 = 0; i$1 < string.length; i$1++) {
      if (!paragraph) {
        paragraphs.push(paragraph = {
          start: i$1,
          end: string.length - 1,
          // 3.3.1 P2-P3: Determine the paragraph level
          level: baseDirection === 'rtl' ? 1 : baseDirection === 'ltr' ? 0 : determineAutoEmbedLevel(i$1, false)
        });
      }
      if (charTypes[i$1] & TYPE_B) {
        paragraph.end = i$1;
        paragraph = null;
      }
    }

    var FORMATTING_TYPES = TYPE_RLE | TYPE_LRE | TYPE_RLO | TYPE_LRO | ISOLATE_INIT_TYPES | TYPE_PDI | TYPE_PDF | TYPE_B;
    var nextEven = function (n) { return n + ((n & 1) ? 1 : 2); };
    var nextOdd = function (n) { return n + ((n & 1) ? 2 : 1); };

    // Everything from here on will operate per paragraph.
    for (var paraIdx = 0; paraIdx < paragraphs.length; paraIdx++) {
      paragraph = paragraphs[paraIdx];
      var statusStack = [{
        _level: paragraph.level,
        _override: 0, //0=neutral, 1=L, 2=R
        _isolate: 0 //bool
      }];
      var stackTop = (void 0);
      var overflowIsolateCount = 0;
      var overflowEmbeddingCount = 0;
      var validIsolateCount = 0;
      charTypeCounts.clear();

      // === 3.3.2 Explicit Levels and Directions ===
      for (var i$2 = paragraph.start; i$2 <= paragraph.end; i$2++) {
        var charType = charTypes[i$2];
        stackTop = statusStack[statusStack.length - 1];

        // Set initial counts
        charTypeCounts.set(charType, (charTypeCounts.get(charType) || 0) + 1);
        if (charType & NEUTRAL_ISOLATE_TYPES) {
          charTypeCounts.set(NEUTRAL_ISOLATE_TYPES, (charTypeCounts.get(NEUTRAL_ISOLATE_TYPES) || 0) + 1);
        }

        // Explicit Embeddings: 3.3.2 X2 - X3
        if (charType & FORMATTING_TYPES) { //prefilter all formatters
          if (charType & (TYPE_RLE | TYPE_LRE)) {
            embedLevels[i$2] = stackTop._level; // 5.2
            var level = (charType === TYPE_RLE ? nextOdd : nextEven)(stackTop._level);
            if (level <= MAX_DEPTH && !overflowIsolateCount && !overflowEmbeddingCount) {
              statusStack.push({
                _level: level,
                _override: 0,
                _isolate: 0
              });
            } else if (!overflowIsolateCount) {
              overflowEmbeddingCount++;
            }
          }

          // Explicit Overrides: 3.3.2 X4 - X5
          else if (charType & (TYPE_RLO | TYPE_LRO)) {
            embedLevels[i$2] = stackTop._level; // 5.2
            var level$1 = (charType === TYPE_RLO ? nextOdd : nextEven)(stackTop._level);
            if (level$1 <= MAX_DEPTH && !overflowIsolateCount && !overflowEmbeddingCount) {
              statusStack.push({
                _level: level$1,
                _override: (charType & TYPE_RLO) ? TYPE_R : TYPE_L,
                _isolate: 0
              });
            } else if (!overflowIsolateCount) {
              overflowEmbeddingCount++;
            }
          }

          // Isolates: 3.3.2 X5a - X5c
          else if (charType & ISOLATE_INIT_TYPES) {
            // X5c - FSI becomes either RLI or LRI
            if (charType & TYPE_FSI) {
              charType = determineAutoEmbedLevel(i$2 + 1, true) === 1 ? TYPE_RLI : TYPE_LRI;
            }

            embedLevels[i$2] = stackTop._level;
            if (stackTop._override) {
              changeCharType(i$2, stackTop._override);
            }
            var level$2 = (charType === TYPE_RLI ? nextOdd : nextEven)(stackTop._level);
            if (level$2 <= MAX_DEPTH && overflowIsolateCount === 0 && overflowEmbeddingCount === 0) {
              validIsolateCount++;
              statusStack.push({
                _level: level$2,
                _override: 0,
                _isolate: 1,
                _isolInitIndex: i$2
              });
            } else {
              overflowIsolateCount++;
            }
          }

          // Terminating Isolates: 3.3.2 X6a
          else if (charType & TYPE_PDI) {
            if (overflowIsolateCount > 0) {
              overflowIsolateCount--;
            } else if (validIsolateCount > 0) {
              overflowEmbeddingCount = 0;
              while (!statusStack[statusStack.length - 1]._isolate) {
                statusStack.pop();
              }
              // Add to isolation pairs bidirectional mapping:
              var isolInitIndex = statusStack[statusStack.length - 1]._isolInitIndex;
              if (isolInitIndex != null) {
                isolationPairs.set(isolInitIndex, i$2);
                isolationPairs.set(i$2, isolInitIndex);
              }
              statusStack.pop();
              validIsolateCount--;
            }
            stackTop = statusStack[statusStack.length - 1];
            embedLevels[i$2] = stackTop._level;
            if (stackTop._override) {
              changeCharType(i$2, stackTop._override);
            }
          }


          // Terminating Embeddings and Overrides: 3.3.2 X7
          else if (charType & TYPE_PDF) {
            if (overflowIsolateCount === 0) {
              if (overflowEmbeddingCount > 0) {
                overflowEmbeddingCount--;
              } else if (!stackTop._isolate && statusStack.length > 1) {
                statusStack.pop();
                stackTop = statusStack[statusStack.length - 1];
              }
            }
            embedLevels[i$2] = stackTop._level; // 5.2
          }

          // End of Paragraph: 3.3.2 X8
          else if (charType & TYPE_B) {
            embedLevels[i$2] = paragraph.level;
          }
        }

        // Non-formatting characters: 3.3.2 X6
        else {
          embedLevels[i$2] = stackTop._level;
          // NOTE: This exclusion of BN seems to go against what section 5.2 says, but is required for test passage
          if (stackTop._override && charType !== TYPE_BN) {
            changeCharType(i$2, stackTop._override);
          }
        }
      }

      // === 3.3.3 Preparations for Implicit Processing ===

      // Remove all RLE, LRE, RLO, LRO, PDF, and BN characters: 3.3.3 X9
      // Note: Due to section 5.2, we won't remove them, but we'll use the BN_LIKE_TYPES bitset to
      // easily ignore them all from here on out.

      // 3.3.3 X10
      // Compute the set of isolating run sequences as specified by BD13
      var levelRuns = [];
      var currentRun = null;
      for (var i$3 = paragraph.start; i$3 <= paragraph.end; i$3++) {
        var charType$1 = charTypes[i$3];
        if (!(charType$1 & BN_LIKE_TYPES)) {
          var lvl = embedLevels[i$3];
          var isIsolInit = charType$1 & ISOLATE_INIT_TYPES;
          var isPDI = charType$1 === TYPE_PDI;
          if (currentRun && lvl === currentRun._level) {
            currentRun._end = i$3;
            currentRun._endsWithIsolInit = isIsolInit;
          } else {
            levelRuns.push(currentRun = {
              _start: i$3,
              _end: i$3,
              _level: lvl,
              _startsWithPDI: isPDI,
              _endsWithIsolInit: isIsolInit
            });
          }
        }
      }
      var isolatingRunSeqs = []; // [{seqIndices: [], sosType: L|R, eosType: L|R}]
      for (var runIdx = 0; runIdx < levelRuns.length; runIdx++) {
        var run = levelRuns[runIdx];
        if (!run._startsWithPDI || (run._startsWithPDI && !isolationPairs.has(run._start))) {
          var seqRuns = [currentRun = run];
          for (var pdiIndex = (void 0); currentRun && currentRun._endsWithIsolInit && (pdiIndex = isolationPairs.get(currentRun._end)) != null;) {
            for (var i$4 = runIdx + 1; i$4 < levelRuns.length; i$4++) {
              if (levelRuns[i$4]._start === pdiIndex) {
                seqRuns.push(currentRun = levelRuns[i$4]);
                break
              }
            }
          }
          // build flat list of indices across all runs:
          var seqIndices = [];
          for (var i$5 = 0; i$5 < seqRuns.length; i$5++) {
            var run$1 = seqRuns[i$5];
            for (var j = run$1._start; j <= run$1._end; j++) {
              seqIndices.push(j);
            }
          }
          // determine the sos/eos types:
          var firstLevel = embedLevels[seqIndices[0]];
          var prevLevel = paragraph.level;
          for (var i$6 = seqIndices[0] - 1; i$6 >= 0; i$6--) {
            if (!(charTypes[i$6] & BN_LIKE_TYPES)) { //5.2
              prevLevel = embedLevels[i$6];
              break
            }
          }
          var lastIndex = seqIndices[seqIndices.length - 1];
          var lastLevel = embedLevels[lastIndex];
          var nextLevel = paragraph.level;
          if (!(charTypes[lastIndex] & ISOLATE_INIT_TYPES)) {
            for (var i$7 = lastIndex + 1; i$7 <= paragraph.end; i$7++) {
              if (!(charTypes[i$7] & BN_LIKE_TYPES)) { //5.2
                nextLevel = embedLevels[i$7];
                break
              }
            }
          }
          isolatingRunSeqs.push({
            _seqIndices: seqIndices,
            _sosType: Math.max(prevLevel, firstLevel) % 2 ? TYPE_R : TYPE_L,
            _eosType: Math.max(nextLevel, lastLevel) % 2 ? TYPE_R : TYPE_L
          });
        }
      }

      // The next steps are done per isolating run sequence
      for (var seqIdx = 0; seqIdx < isolatingRunSeqs.length; seqIdx++) {
        var ref = isolatingRunSeqs[seqIdx];
        var seqIndices$1 = ref._seqIndices;
        var sosType = ref._sosType;
        var eosType = ref._eosType;
        /**
         * All the level runs in an isolating run sequence have the same embedding level.
         * 
         * DO NOT change any `embedLevels[i]` within the current scope.
         */
        var embedDirection = ((embedLevels[seqIndices$1[0]]) & 1) ? TYPE_R : TYPE_L;

        // === 3.3.4 Resolving Weak Types ===

        // W1 + 5.2. Search backward from each NSM to the first character in the isolating run sequence whose
        // bidirectional type is not BN, and set the NSM to ON if it is an isolate initiator or PDI, and to its
        // type otherwise. If the NSM is the first non-BN character, change the NSM to the type of sos.
        if (charTypeCounts.get(TYPE_NSM)) {
          for (var si = 0; si < seqIndices$1.length; si++) {
            var i$8 = seqIndices$1[si];
            if (charTypes[i$8] & TYPE_NSM) {
              var prevType = sosType;
              for (var sj = si - 1; sj >= 0; sj--) {
                if (!(charTypes[seqIndices$1[sj]] & BN_LIKE_TYPES)) { //5.2 scan back to first non-BN
                  prevType = charTypes[seqIndices$1[sj]];
                  break
                }
              }
              changeCharType(i$8, (prevType & (ISOLATE_INIT_TYPES | TYPE_PDI)) ? TYPE_ON : prevType);
            }
          }
        }

        // W2. Search backward from each instance of a European number until the first strong type (R, L, AL, or sos)
        // is found. If an AL is found, change the type of the European number to Arabic number.
        if (charTypeCounts.get(TYPE_EN)) {
          for (var si$1 = 0; si$1 < seqIndices$1.length; si$1++) {
            var i$9 = seqIndices$1[si$1];
            if (charTypes[i$9] & TYPE_EN) {
              for (var sj$1 = si$1 - 1; sj$1 >= -1; sj$1--) {
                var prevCharType = sj$1 === -1 ? sosType : charTypes[seqIndices$1[sj$1]];
                if (prevCharType & STRONG_TYPES) {
                  if (prevCharType === TYPE_AL) {
                    changeCharType(i$9, TYPE_AN);
                  }
                  break
                }
              }
            }
          }
        }

        // W3. Change all ALs to R
        if (charTypeCounts.get(TYPE_AL)) {
          for (var si$2 = 0; si$2 < seqIndices$1.length; si$2++) {
            var i$10 = seqIndices$1[si$2];
            if (charTypes[i$10] & TYPE_AL) {
              changeCharType(i$10, TYPE_R);
            }
          }
        }

        // W4. A single European separator between two European numbers changes to a European number. A single common
        // separator between two numbers of the same type changes to that type.
        if (charTypeCounts.get(TYPE_ES) || charTypeCounts.get(TYPE_CS)) {
          for (var si$3 = 1; si$3 < seqIndices$1.length - 1; si$3++) {
            var i$11 = seqIndices$1[si$3];
            if (charTypes[i$11] & (TYPE_ES | TYPE_CS)) {
              var prevType$1 = 0, nextType = 0;
              for (var sj$2 = si$3 - 1; sj$2 >= 0; sj$2--) {
                prevType$1 = charTypes[seqIndices$1[sj$2]];
                if (!(prevType$1 & BN_LIKE_TYPES)) { //5.2
                  break
                }
              }
              for (var sj$3 = si$3 + 1; sj$3 < seqIndices$1.length; sj$3++) {
                nextType = charTypes[seqIndices$1[sj$3]];
                if (!(nextType & BN_LIKE_TYPES)) { //5.2
                  break
                }
              }
              if (prevType$1 === nextType && (charTypes[i$11] === TYPE_ES ? prevType$1 === TYPE_EN : (prevType$1 & (TYPE_EN | TYPE_AN)))) {
                changeCharType(i$11, prevType$1);
              }
            }
          }
        }

        // W5. A sequence of European terminators adjacent to European numbers changes to all European numbers.
        if (charTypeCounts.get(TYPE_EN)) {
          for (var si$4 = 0; si$4 < seqIndices$1.length; si$4++) {
            var i$12 = seqIndices$1[si$4];
            if (charTypes[i$12] & TYPE_EN) {
              for (var sj$4 = si$4 - 1; sj$4 >= 0 && (charTypes[seqIndices$1[sj$4]] & (TYPE_ET | BN_LIKE_TYPES)); sj$4--) {
                changeCharType(seqIndices$1[sj$4], TYPE_EN);
              }
              for (si$4++; si$4 < seqIndices$1.length && (charTypes[seqIndices$1[si$4]] & (TYPE_ET | BN_LIKE_TYPES | TYPE_EN)); si$4++) {
                if (charTypes[seqIndices$1[si$4]] !== TYPE_EN) {
                  changeCharType(seqIndices$1[si$4], TYPE_EN);
                }
              }
            }
          }
        }

        // W6. Otherwise, separators and terminators change to Other Neutral.
        if (charTypeCounts.get(TYPE_ET) || charTypeCounts.get(TYPE_ES) || charTypeCounts.get(TYPE_CS)) {
          for (var si$5 = 0; si$5 < seqIndices$1.length; si$5++) {
            var i$13 = seqIndices$1[si$5];
            if (charTypes[i$13] & (TYPE_ET | TYPE_ES | TYPE_CS)) {
              changeCharType(i$13, TYPE_ON);
              // 5.2 transform adjacent BNs too:
              for (var sj$5 = si$5 - 1; sj$5 >= 0 && (charTypes[seqIndices$1[sj$5]] & BN_LIKE_TYPES); sj$5--) {
                changeCharType(seqIndices$1[sj$5], TYPE_ON);
              }
              for (var sj$6 = si$5 + 1; sj$6 < seqIndices$1.length && (charTypes[seqIndices$1[sj$6]] & BN_LIKE_TYPES); sj$6++) {
                changeCharType(seqIndices$1[sj$6], TYPE_ON);
              }
            }
          }
        }

        // W7. Search backward from each instance of a European number until the first strong type (R, L, or sos)
        // is found. If an L is found, then change the type of the European number to L.
        // NOTE: implemented in single forward pass for efficiency
        if (charTypeCounts.get(TYPE_EN)) {
          for (var si$6 = 0, prevStrongType = sosType; si$6 < seqIndices$1.length; si$6++) {
            var i$14 = seqIndices$1[si$6];
            var type = charTypes[i$14];
            if (type & TYPE_EN) {
              if (prevStrongType === TYPE_L) {
                changeCharType(i$14, TYPE_L);
              }
            } else if (type & STRONG_TYPES) {
              prevStrongType = type;
            }
          }
        }

        // === 3.3.5 Resolving Neutral and Isolate Formatting Types ===

        if (charTypeCounts.get(NEUTRAL_ISOLATE_TYPES)) {
          // N0. Process bracket pairs in an isolating run sequence sequentially in the logical order of the text
          // positions of the opening paired brackets using the logic given below. Within this scope, bidirectional
          // types EN and AN are treated as R.
          var R_TYPES_FOR_N_STEPS = (TYPE_R | TYPE_EN | TYPE_AN);
          var STRONG_TYPES_FOR_N_STEPS = R_TYPES_FOR_N_STEPS | TYPE_L;

          // * Identify the bracket pairs in the current isolating run sequence according to BD16.
          var bracketPairs = [];
          {
            var openerStack = [];
            for (var si$7 = 0; si$7 < seqIndices$1.length; si$7++) {
              // NOTE: for any potential bracket character we also test that it still carries a NI
              // type, as that may have been changed earlier. This doesn't seem to be explicitly
              // called out in the spec, but is required for passage of certain tests.
              if (charTypes[seqIndices$1[si$7]] & NEUTRAL_ISOLATE_TYPES) {
                var char = string[seqIndices$1[si$7]];
                var oppositeBracket = (void 0);
                // Opening bracket
                if (openingToClosingBracket(char) !== null) {
                  if (openerStack.length < 63) {
                    openerStack.push({ char: char, seqIndex: si$7 });
                  } else {
                    break
                  }
                }
                // Closing bracket
                else if ((oppositeBracket = closingToOpeningBracket(char)) !== null) {
                  for (var stackIdx = openerStack.length - 1; stackIdx >= 0; stackIdx--) {
                    var stackChar = openerStack[stackIdx].char;
                    if (stackChar === oppositeBracket ||
                      stackChar === closingToOpeningBracket(getCanonicalBracket(char)) ||
                      openingToClosingBracket(getCanonicalBracket(stackChar)) === char
                    ) {
                      bracketPairs.push([openerStack[stackIdx].seqIndex, si$7]);
                      openerStack.length = stackIdx; //pop the matching bracket and all following
                      break
                    }
                  }
                }
              }
            }
            bracketPairs.sort(function (a, b) { return a[0] - b[0]; });
          }
          // * For each bracket-pair element in the list of pairs of text positions
          for (var pairIdx = 0; pairIdx < bracketPairs.length; pairIdx++) {
            var ref$1 = bracketPairs[pairIdx];
            var openSeqIdx = ref$1[0];
            var closeSeqIdx = ref$1[1];
            // a. Inspect the bidirectional types of the characters enclosed within the bracket pair.
            // b. If any strong type (either L or R) matching the embedding direction is found, set the type for both
            // brackets in the pair to match the embedding direction.
            var foundStrongType = false;
            var useStrongType = 0;
            for (var si$8 = openSeqIdx + 1; si$8 < closeSeqIdx; si$8++) {
              var i$15 = seqIndices$1[si$8];
              if (charTypes[i$15] & STRONG_TYPES_FOR_N_STEPS) {
                foundStrongType = true;
                var lr = (charTypes[i$15] & R_TYPES_FOR_N_STEPS) ? TYPE_R : TYPE_L;
                if (lr === embedDirection) {
                  useStrongType = lr;
                  break
                }
              }
            }
            // c. Otherwise, if there is a strong type it must be opposite the embedding direction. Therefore, test
            // for an established context with a preceding strong type by checking backwards before the opening paired
            // bracket until the first strong type (L, R, or sos) is found.
            //    1. If the preceding strong type is also opposite the embedding direction, context is established, so
            //    set the type for both brackets in the pair to that direction.
            //    2. Otherwise set the type for both brackets in the pair to the embedding direction.
            if (foundStrongType && !useStrongType) {
              useStrongType = sosType;
              for (var si$9 = openSeqIdx - 1; si$9 >= 0; si$9--) {
                var i$16 = seqIndices$1[si$9];
                if (charTypes[i$16] & STRONG_TYPES_FOR_N_STEPS) {
                  var lr$1 = (charTypes[i$16] & R_TYPES_FOR_N_STEPS) ? TYPE_R : TYPE_L;
                  if (lr$1 !== embedDirection) {
                    useStrongType = lr$1;
                  } else {
                    useStrongType = embedDirection;
                  }
                  break
                }
              }
            }
            if (useStrongType) {
              charTypes[seqIndices$1[openSeqIdx]] = charTypes[seqIndices$1[closeSeqIdx]] = useStrongType;
              // * Any number of characters that had original bidirectional character type NSM prior to the application
              // of W1 that immediately follow a paired bracket which changed to L or R under N0 should change to match
              // the type of their preceding bracket.
              if (useStrongType !== embedDirection) {
                for (var si$10 = openSeqIdx + 1; si$10 < seqIndices$1.length; si$10++) {
                  if (!(charTypes[seqIndices$1[si$10]] & BN_LIKE_TYPES)) {
                    if (getBidiCharType(string[seqIndices$1[si$10]]) & TYPE_NSM) {
                      charTypes[seqIndices$1[si$10]] = useStrongType;
                    }
                    break
                  }
                }
              }
              if (useStrongType !== embedDirection) {
                for (var si$11 = closeSeqIdx + 1; si$11 < seqIndices$1.length; si$11++) {
                  if (!(charTypes[seqIndices$1[si$11]] & BN_LIKE_TYPES)) {
                    if (getBidiCharType(string[seqIndices$1[si$11]]) & TYPE_NSM) {
                      charTypes[seqIndices$1[si$11]] = useStrongType;
                    }
                    break
                  }
                }
              }
            }
          }

          // N1. A sequence of NIs takes the direction of the surrounding strong text if the text on both sides has the
          // same direction.
          // N2. Any remaining NIs take the embedding direction.
          for (var si$12 = 0; si$12 < seqIndices$1.length; si$12++) {
            if (charTypes[seqIndices$1[si$12]] & NEUTRAL_ISOLATE_TYPES) {
              var niRunStart = si$12, niRunEnd = si$12;
              var prevType$2 = sosType; //si === 0 ? sosType : (charTypes[seqIndices[si - 1]] & R_TYPES_FOR_N_STEPS) ? TYPE_R : TYPE_L
              for (var si2 = si$12 - 1; si2 >= 0; si2--) {
                if (charTypes[seqIndices$1[si2]] & BN_LIKE_TYPES) {
                  niRunStart = si2; //5.2 treat BNs adjacent to NIs as NIs
                } else {
                  prevType$2 = (charTypes[seqIndices$1[si2]] & R_TYPES_FOR_N_STEPS) ? TYPE_R : TYPE_L;
                  break
                }
              }
              var nextType$1 = eosType;
              for (var si2$1 = si$12 + 1; si2$1 < seqIndices$1.length; si2$1++) {
                if (charTypes[seqIndices$1[si2$1]] & (NEUTRAL_ISOLATE_TYPES | BN_LIKE_TYPES)) {
                  niRunEnd = si2$1;
                } else {
                  nextType$1 = (charTypes[seqIndices$1[si2$1]] & R_TYPES_FOR_N_STEPS) ? TYPE_R : TYPE_L;
                  break
                }
              }
              for (var sj$7 = niRunStart; sj$7 <= niRunEnd; sj$7++) {
                charTypes[seqIndices$1[sj$7]] = prevType$2 === nextType$1 ? prevType$2 : embedDirection;
              }
              si$12 = niRunEnd;
            }
          }
        }
      }

      // === 3.3.6 Resolving Implicit Levels ===

      for (var i$17 = paragraph.start; i$17 <= paragraph.end; i$17++) {
        var level$3 = embedLevels[i$17];
        var type$1 = charTypes[i$17];
        // I2. For all characters with an odd (right-to-left) embedding level, those of type L, EN or AN go up one level.
        if (level$3 & 1) {
          if (type$1 & (TYPE_L | TYPE_EN | TYPE_AN)) {
            embedLevels[i$17]++;
          }
        }
          // I1. For all characters with an even (left-to-right) embedding level, those of type R go up one level
        // and those of type AN or EN go up two levels.
        else {
          if (type$1 & TYPE_R) {
            embedLevels[i$17]++;
          } else if (type$1 & (TYPE_AN | TYPE_EN)) {
            embedLevels[i$17] += 2;
          }
        }

        // 5.2: Resolve any LRE, RLE, LRO, RLO, PDF, or BN to the level of the preceding character if there is one,
        // and otherwise to the base level.
        if (type$1 & BN_LIKE_TYPES) {
          embedLevels[i$17] = i$17 === 0 ? paragraph.level : embedLevels[i$17 - 1];
        }

        // 3.4 L1.1-4: Reset the embedding level of segment/paragraph separators, and any sequence of whitespace or
        // isolate formatting characters preceding them or the end of the paragraph, to the paragraph level.
        // NOTE: this will also need to be applied to each individual line ending after line wrapping occurs.
        if (i$17 === paragraph.end || getBidiCharType(string[i$17]) & (TYPE_S | TYPE_B)) {
          for (var j$1 = i$17; j$1 >= 0 && (getBidiCharType(string[j$1]) & TRAILING_TYPES); j$1--) {
            embedLevels[j$1] = paragraph.level;
          }
        }
      }
    }

    // DONE! The resolved levels can then be used, after line wrapping, to flip runs of characters
    // according to section 3.4 Reordering Resolved Levels
    return {
      levels: embedLevels,
      paragraphs: paragraphs
    }

    function determineAutoEmbedLevel (start, isFSI) {
      // 3.3.1 P2 - P3
      for (var i = start; i < string.length; i++) {
        var charType = charTypes[i];
        if (charType & (TYPE_R | TYPE_AL)) {
          return 1
        }
        if ((charType & (TYPE_B | TYPE_L)) || (isFSI && charType === TYPE_PDI)) {
          return 0
        }
        if (charType & ISOLATE_INIT_TYPES) {
          var pdi = indexOfMatchingPDI(i);
          i = pdi === -1 ? string.length : pdi;
        }
      }
      return 0
    }

    function indexOfMatchingPDI (isolateStart) {
      // 3.1.2 BD9
      var isolationLevel = 1;
      for (var i = isolateStart + 1; i < string.length; i++) {
        var charType = charTypes[i];
        if (charType & TYPE_B) {
          break
        }
        if (charType & TYPE_PDI) {
          if (--isolationLevel === 0) {
            return i
          }
        } else if (charType & ISOLATE_INIT_TYPES) {
          isolationLevel++;
        }
      }
      return -1
    }
  }

  // Bidi mirrored chars data, auto generated
  var data = "14>1,j>2,t>2,u>2,1a>g,2v3>1,1>1,1ge>1,1wd>1,b>1,1j>1,f>1,ai>3,-2>3,+1,8>1k0,-1jq>1y7,-1y6>1hf,-1he>1h6,-1h5>1ha,-1h8>1qi,-1pu>1,6>3u,-3s>7,6>1,1>1,f>1,1>1,+2,3>1,1>1,+13,4>1,1>1,6>1eo,-1ee>1,3>1mg,-1me>1mk,-1mj>1mi,-1mg>1mi,-1md>1,1>1,+2,1>10k,-103>1,1>1,4>1,5>1,1>1,+10,3>1,1>8,-7>8,+1,-6>7,+1,a>1,1>1,u>1,u6>1,1>1,+5,26>1,1>1,2>1,2>2,8>1,7>1,4>1,1>1,+5,b8>1,1>1,+3,1>3,-2>1,2>1,1>1,+2,c>1,3>1,1>1,+2,h>1,3>1,a>1,1>1,2>1,3>1,1>1,d>1,f>1,3>1,1a>1,1>1,6>1,7>1,13>1,k>1,1>1,+19,4>1,1>1,+2,2>1,1>1,+18,m>1,a>1,1>1,lk>1,1>1,4>1,2>1,f>1,3>1,1>1,+3,db>1,1>1,+3,3>1,1>1,+2,14qm>1,1>1,+1,6>1,4j>1,j>2,t>2,u>2,2>1,+1";

  var mirrorMap;

  function parse () {
    if (!mirrorMap) {
      //const start = performance.now()
      var ref = parseCharacterMap(data, true);
      var map = ref.map;
      var reverseMap = ref.reverseMap;
      // Combine both maps into one
      reverseMap.forEach(function (value, key) {
        map.set(key, value);
      });
      mirrorMap = map;
      //console.log(`mirrored chars parsed in ${performance.now() - start}ms`)
    }
  }

  function getMirroredCharacter (char) {
    parse();
    return mirrorMap.get(char) || null
  }

  /**
   * Given a string and its resolved embedding levels, build a map of indices to replacement chars
   * for any characters in right-to-left segments that have defined mirrored characters.
   * @param string
   * @param embeddingLevels
   * @param [start]
   * @param [end]
   * @return {Map<number, string>}
   */
  function getMirroredCharactersMap(string, embeddingLevels, start, end) {
    var strLen = string.length;
    start = Math.max(0, start == null ? 0 : +start);
    end = Math.min(strLen - 1, end == null ? strLen - 1 : +end);

    var map = new Map();
    for (var i = start; i <= end; i++) {
      if (embeddingLevels[i] & 1) { //only odd (rtl) levels
        var mirror = getMirroredCharacter(string[i]);
        if (mirror !== null) {
          map.set(i, mirror);
        }
      }
    }
    return map
  }

  /**
   * Given a start and end denoting a single line within a string, and a set of precalculated
   * bidi embedding levels, produce a list of segments whose ordering should be flipped, in sequence.
   * @param {string} string - the full input string
   * @param {GetEmbeddingLevelsResult} embeddingLevelsResult - the result object from getEmbeddingLevels
   * @param {number} [start] - first character in a subset of the full string
   * @param {number} [end] - last character in a subset of the full string
   * @return {number[][]} - the list of start/end segments that should be flipped, in order.
   */
  function getReorderSegments(string, embeddingLevelsResult, start, end) {
    var strLen = string.length;
    start = Math.max(0, start == null ? 0 : +start);
    end = Math.min(strLen - 1, end == null ? strLen - 1 : +end);

    var segments = [];
    embeddingLevelsResult.paragraphs.forEach(function (paragraph) {
      var lineStart = Math.max(start, paragraph.start);
      var lineEnd = Math.min(end, paragraph.end);
      if (lineStart < lineEnd) {
        // Local slice for mutation
        var lineLevels = embeddingLevelsResult.levels.slice(lineStart, lineEnd + 1);

        // 3.4 L1.4: Reset any sequence of whitespace characters and/or isolate formatting characters at the
        // end of the line to the paragraph level.
        for (var i = lineEnd; i >= lineStart && (getBidiCharType(string[i]) & TRAILING_TYPES); i--) {
          lineLevels[i] = paragraph.level;
        }

        // L2. From the highest level found in the text to the lowest odd level on each line, including intermediate levels
        // not actually present in the text, reverse any contiguous sequence of characters that are at that level or higher.
        var maxLevel = paragraph.level;
        var minOddLevel = Infinity;
        for (var i$1 = 0; i$1 < lineLevels.length; i$1++) {
          var level = lineLevels[i$1];
          if (level > maxLevel) { maxLevel = level; }
          if (level < minOddLevel) { minOddLevel = level | 1; }
        }
        for (var lvl = maxLevel; lvl >= minOddLevel; lvl--) {
          for (var i$2 = 0; i$2 < lineLevels.length; i$2++) {
            if (lineLevels[i$2] >= lvl) {
              var segStart = i$2;
              while (i$2 + 1 < lineLevels.length && lineLevels[i$2 + 1] >= lvl) {
                i$2++;
              }
              if (i$2 > segStart) {
                segments.push([segStart + lineStart, i$2 + lineStart]);
              }
            }
          }
        }
      }
    });
    return segments
  }

  /**
   * @param {string} string
   * @param {GetEmbeddingLevelsResult} embedLevelsResult
   * @param {number} [start]
   * @param {number} [end]
   * @return {string} the new string with bidi segments reordered
   */
  function getReorderedString(string, embedLevelsResult, start, end) {
    var indices = getReorderedIndices(string, embedLevelsResult, start, end);
    var chars = [].concat( string );
    indices.forEach(function (charIndex, i) {
      chars[i] = (
        (embedLevelsResult.levels[charIndex] & 1) ? getMirroredCharacter(string[charIndex]) : null
      ) || string[charIndex];
    });
    return chars.join('')
  }

  /**
   * @param {string} string
   * @param {GetEmbeddingLevelsResult} embedLevelsResult
   * @param {number} [start]
   * @param {number} [end]
   * @return {number[]} an array with character indices in their new bidi order
   */
  function getReorderedIndices(string, embedLevelsResult, start, end) {
    var segments = getReorderSegments(string, embedLevelsResult, start, end);
    // Fill an array with indices
    var indices = [];
    for (var i = 0; i < string.length; i++) {
      indices[i] = i;
    }
    // Reverse each segment in order
    segments.forEach(function (ref) {
      var start = ref[0];
      var end = ref[1];

      var slice = indices.slice(start, end + 1);
      for (var i = slice.length; i--;) {
        indices[end - i] = slice[i];
      }
    });
    return indices
  }

  exports.closingToOpeningBracket = closingToOpeningBracket;
  exports.getBidiCharType = getBidiCharType;
  exports.getBidiCharTypeName = getBidiCharTypeName;
  exports.getCanonicalBracket = getCanonicalBracket;
  exports.getEmbeddingLevels = getEmbeddingLevels;
  exports.getMirroredCharacter = getMirroredCharacter;
  exports.getMirroredCharactersMap = getMirroredCharactersMap;
  exports.getReorderSegments = getReorderSegments;
  exports.getReorderedIndices = getReorderedIndices;
  exports.getReorderedString = getReorderedString;
  exports.openingToClosingBracket = openingToClosingBracket;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

}({}));
return bidi}

var y={unicodeFontsURL:null,sdfGlyphSize:256,sdfMargin:1/16,sdfExponent:9,textureWidth:2048},ge=new Color;function b(){return (self.performance||Date).now()}var D=Object.create(null);function me(n,e,t){e=ne({},e);let o=b(),u=[];if(e.font&&u.push({label:"user",src:Z(e.font)}),e.font=u,e.text=""+e.text,e.sdfGlyphSize=e.sdfGlyphSize||y.sdfGlyphSize,e.unicodeFontsURL=e.unicodeFontsURL||y.unicodeFontsURL,e.colorRanges!=null){let s={};for(let p in e.colorRanges)if(e.colorRanges.hasOwnProperty(p)){let g=e.colorRanges[p];typeof g!="number"&&(g=ge.set(g).getHex()),s[p]=g;}e.colorRanges=s;}Object.freeze(e);let{textureWidth:c$1,sdfExponent:m}=y,{sdfGlyphSize:h}=e,R=c$1/h*4,i=D[h];if(!i){let s=c$1,p=h*256/R,g=typeof document<"u"?document.createElement("canvas"):new OffscreenCanvas(s,p);g.width=s,g.height=p;let M=h*256/R;i=D[h]={glyphCount:0,sdfGlyphSize:h,sdfCanvas:g,sdfTexture:n?(()=>{let v=new DataTexture(new Uint8Array(c$1*M*4),c$1,M,RGBAFormat,UnsignedByteType);return v.magFilter=LinearFilter,v.minFilter=LinearFilter,v})():new CanvasTexture(g,void 0,void 0,void 0,LinearFilter,LinearFilter),contextLost:false,glyphsByFont:new Map},i.sdfTexture.generateMipmaps=false,xe(n,i);}let{sdfTexture:d,sdfCanvas:w}=i;(y.useWorker?se:we)(e).then(s=>{let{glyphIds:p,glyphFontIndices:g,fontData:M,glyphPositions:v,fontSize:ie,timings:C}=s,P=[],B=new Float32Array(p.length*4),k=0,q=0,ae=b(),W=M.map(r=>{let f=i.glyphsByFont.get(r.src);return f||i.glyphsByFont.set(r.src,f=new Map),f});p.forEach((r,f)=>{let l=g[f],{src:L,unitsPerEm:F}=M[l],U=W[l].get(r);if(!U){let{path:de,pathBounds:x}=s.glyphData[L][r],I=Math.max(x[2]-x[0],x[3]-x[1])/h*(y.sdfMargin*h+.5),fe=i.glyphCount++,le=[x[0]-I,x[1]-I,x[2]+I,x[3]+I];W[l].set(r,U={path:de,atlasIndex:fe,sdfViewBox:le}),P.push(U);}let{sdfViewBox:E}=U,O=v[q++],$=v[q++],A=ie/F;B[k++]=O+E[0]*A,B[k++]=$+E[1]*A,B[k++]=O+E[2]*A,B[k++]=$+E[3]*A,p[f]=U.atlasIndex;}),C.quads=(C.quads||0)+(b()-ae);let re=b();C.sdf={};let G=w.height,ce=Math.ceil(i.glyphCount/R),S=Math.pow(2,Math.ceil(Math.log2(ce*h)));if(S>G)if(console.info(`Increasing SDF texture size ${G}->${S}`),P$2(w,c$1,S),n){let r=i.sdfTexture,f=new Uint8Array(c$1*S*4),l=new DataTexture(f,c$1,S,RGBAFormat,UnsignedByteType);l.magFilter=LinearFilter,l.minFilter=LinearFilter,l.generateMipmaps=false,l.needsUpdate=true,i.sdfTexture=l,d=l,r&&(typeof requestAnimationFrame<"u"?F=>requestAnimationFrame(()=>requestAnimationFrame(F)):F=>setTimeout(F,32))(()=>{try{r.dispose();}catch(F){console.warn("Deferred dispose of old SDF texture failed",F);}});}else d.dispose();Promise.all(P.map(r=>te(r,i,e.gpuAccelerateSDF).then(({timing:f})=>{C.sdf[r.atlasIndex]=f;}))).then(()=>{if(P.length&&!i.contextLost)if(n&&d.isDataTexture){let r=w.getContext("webgl");if(r){let{width:f,height:l}=w,L=f*l*4;(!d.image.data||d.image.data.length!==L)&&(d.image.data=new Uint8Array(L),d.image.width=f,d.image.height=l),r.readPixels(0,0,f,l,r.RGBA,r.UNSIGNED_BYTE,d.image.data),d.needsUpdate=true;}}else oe(n,i),d.needsUpdate=true;C.sdfTotal=b()-re,C.total=b()-o,t(Object.freeze({parameters:e,sdfTexture:d,sdfGlyphSize:h,sdfExponent:m,glyphBounds:B,glyphAtlasIndices:p,glyphColors:s.glyphColors,caretPositions:s.caretPositions,chunkedBounds:s.chunkedBounds,ascender:s.ascender,descender:s.descender,lineHeight:s.lineHeight,capHeight:s.capHeight,xHeight:s.xHeight,topBaseline:s.topBaseline,blockBounds:s.blockBounds,visibleBounds:s.visibleBounds,timings:s.timings}));});}),Promise.resolve().then(()=>{i.contextLost||N(w);});}function te({path:n,atlasIndex:e,sdfViewBox:t},{sdfGlyphSize:o,sdfCanvas:a,contextLost:u},c){if(u)return Promise.resolve({timing:-1});let{textureWidth:m,sdfExponent:h}=y,R=Math.max(t[2]-t[0],t[3]-t[1]),i=Math.floor(e/4),d=i%(m/o)*o,w=Math.floor(i/(m/o))*o,z=e%4;return A(o,o,n,t,R,h,a,d,w,z,c)}function xe(n,e){let t=e.sdfCanvas;t.addEventListener("webglcontextlost",o=>{console.log("Context Lost",o),o.preventDefault(),e.contextLost=true;}),t.addEventListener("webglcontextrestored",o=>{console.log("Context Restored",o),e.contextLost=false;let a=[];e.glyphsByFont.forEach(u=>{u.forEach(c=>{a.push(te(c,e,true));});}),Promise.all(a).then(()=>{oe(n,e),e.sdfTexture.needsUpdate=true;});});}function ne(n,e){for(let t in e)e.hasOwnProperty(t)&&(n[t]=e[t]);return n}var H;function Z(n){if(typeof document>"u")try{return new URL(n,self.location?.href||"http://localhost/").href}catch{return n}return H||(H=document.createElement("a")),H.href=n,H.href}function oe(n,e){if(typeof createImageBitmap!="function"){console.info("Safari<15: applying SDF canvas workaround");let{sdfCanvas:t,sdfTexture:o}=e,{width:a,height:u}=t,c=e.sdfCanvas.getContext("webgl"),m=o.image.data;(!m||m.length!==a*u*4)&&(m=new Uint8Array(a*u*4),o.image={width:a,height:u,data:m},o.flipY=false,o.isDataTexture=true),c.readPixels(0,0,a,u,c.RGBA,c.UNSIGNED_BYTE,m);}}var ye=defineWorkerModule({name:"Typesetter",dependencies:[$t,T$2,bidiFactory],init(n,e,t){return n(e,t())}}),se=defineWorkerModule({name:"Typesetter",dependencies:[ye],init(n){return function(e){return new Promise(t=>{n.typeset(e,t);})}},getTransferables(n){let e=[];for(let t in n)n[t]&&n[t].buffer&&e.push(n[t].buffer);return e}}),we=se.onMainThread;

var t=class extends Node{static get type(){return "TextNode"}constructor(s){super("void"),this.text=s;}setup(s){let e=this.text.uniforms,i=attribute("aThreeBlocksGlyphBounds","vec4"),u=attribute("aThreeBlocksGlyphIndex","float"),a$1=attribute(f,"float"),h=S$1({glyphBounds:i,atlasIndex:u,letterId:a$1,wordId:float(0),clipRect:e.uThreeBlocksClipRect,posOffset:vec2(e.uThreeBlocksPositionOffset.x,e.uThreeBlocksPositionOffset.y),distanceOffset:e.uThreeBlocksDistanceOffset,blurRadius:e.uThreeBlocksBlurRadius,totalBounds:e.uThreeBlocksTotalBounds,sdfTextureSize:e.uThreeBlocksSDFTextureSize,sdfGlyphSize:e.uThreeBlocksSDFGlyphSize}),d$1=subBuild(h(),"POSITION","vec3"),r=e.uThreeBlocksOrient.mul(d$1);return positionLocal.assign(r),normalLocal.assign(e.uThreeBlocksOrient.mul(normalLocal)),r}},P$1=nodeProxy(t).setParameterLength(1);

var T$1=class T extends Node{static get type(){return "TextColorNode"}constructor(D,p=null){super("vec4"),this.text=D,this.baseDiffuse=p;}setup(D){let p=this.text,s=p.uniforms,I=p.sdfMap,L=Fn(([r,e])=>{let a=float(r).toVar(),n=float(max$1(e.x,e.y)).toVar(),o=float(sub(1,pow(float(2).mul(select(a.greaterThan(.5),sub(1,a),a)),float(1).div(s.uThreeBlocksSDFExponent))).mul(n)).toVar();return float(o.mul(select(a.greaterThan(.5),-1,1))).toVar()}),b=Fn(([r,e,a])=>{let n=vec2(mix(e.xy,e.zw,r)).toVar(),o=vec4(I.sample(n)).toVar(),c=float(floor(a.add(.5))).toVar();return select(c.equal(0),o.r,select(c.equal(1),o.g,select(c.equal(2),o.b,o.a)))}),N=Fn(([r,e,a,n])=>{let o=vec2(r).toVar();return L(b(o,e,a),n)}),Z=Fn(([r,e])=>{let a=vec2(r).toVar();return float(length(fwidth(a).mul(e)).mul(.5)).toVar()}),j=Fn(([r,e,a,n])=>{let o=vec2(r).toVar(),c=vec2(clamp(o,div(.5,s.uThreeBlocksSDFGlyphSize),sub(1,div(.5,s.uThreeBlocksSDFGlyphSize)))).toVar(),x=float(N(c,a,n,e)).toVar();return x.addAssign(select(c.x.equal(o.x).and(c.y.equal(o.y)),0,length(o.sub(c).mul(e)))),x}),y=Fn(([r,e,a])=>{let n=float(a).toVar(),o=float(e).toVar(),c=float(r).toVar();return float(smoothstep(o.add(n),o.sub(n),c)).toVar()}),H=varyingProperty("vec4","vTextPacked0"),B=varyingProperty("vec4","vTextTextureUVBounds"),G=varyingProperty("vec4","vTextPacked1"),g=vec2(H.zw).toVar(),O=vec2(G.xy).toVar(),A=G.z,S=this.baseDiffuse?vec4(this.baseDiffuse):vec4(diffuseColor),J=float(S.a).toVar(),K=float(Z(g,O)).toVar(),F=float(j(g,O,B,A)).toVar(),U=vec3(S.rgb).toVar(),Q=vec3(s.uThreeBlocksBaseColor).mul(U).toVar(),W=vec3(s.uThreeBlocksOutlineColor).mul(U).toVar(),q=vec4(Q,s.uThreeBlocksFillOpacity).toVar(),P=vec4(W,s.uThreeBlocksOutlineOpacity).toVar(),w=float(max$1(K,s.uThreeBlocksBlurRadius)).toVar(),C=float(y(F,0,w)).toVar(),X=float(y(F,s.uThreeBlocksDistanceOffset,w)).toVar(),Y=float(q.a).toVar(),_=float(P.a).toVar(),$=s.uThreeBlocksDistanceOffset.greaterThan(0),m=float(Y.mul(C)).toVar(),tt=float(max$1(X.sub(C),0)).toVar(),R=float(select($,_.mul(tt),0)).toVar(),d=float(m.add(R.mul(sub(1,m)))).toVar(),ot=vec3(select(d.greaterThan(0),q.rgb.mul(m).add(P.rgb.mul(R.mul(sub(1,m)))).div(d),vec3(0))).toVar();If(s.uThreeBlocksSdfDebug.greaterThan(0),()=>{d.assign(b(g,B,A));}),d.equal(0).discard();let z=float(d.mul(J)).toVar();return z.equal(0).discard(),vec4(ot,z)}},mt$1=nodeProxy(T$1).setParameterLength(2);

var pt=new MeshBasicNodeMaterial({color:0,side:DoubleSide,transparent:true,colorWrite:false}),J=new Matrix4,P=new Vector3,M=new Vector3,V=[],yt=new Vector3,G="+x+y",st=()=>{let S=new Mesh(new PlaneGeometry(1,1),pt);return st=()=>S,S},gt={type:"syncstart"},mt={type:"synccomplete"},it=["font","fontSize","fontStyle","fontWeight","lang","letterSpacing","lineHeight","maxWidth","overflowWrap","text","direction","textAlign","textIndent","whiteSpace","anchorX","anchorY","colorRanges","sdfGlyphSize"],xt=it.concat("material","color","depthOffset","clipRect","orientation","glyphGeometryDetail","screenSpace"),I=class extends Mesh{constructor(){let t=new d;super(t,null),this.text="",this.anchorX=0,this.anchorY=0,this.direction="auto",this.unicodeFontsURL=null,this.fontSize=.1,this.fontWeight="normal",this.fontStyle="normal",this.lang=null,this.letterSpacing=0,this.lineHeight="normal",this.maxWidth=1/0,this.overflowWrap="normal",this.textAlign="left",this.textIndent=0,this.whiteSpace="normal",this.material=new MeshBasicNodeMaterial({color:0,side:DoubleSide,transparent:true,colorWrite:false,refractionRatio:0,reflectivity:0}),this.material._uWallBounds=uniform(new Vector2),this.material.forceSinglePass=true,this.color=new Color(16777215),this.colorRanges=null,this.outlineWidth=0,this.outlineColor=16777215,this.outlineOpacity=1,this.outlineBlur=0,this.outlineOffsetX=0,this.outlineOffsetY=0,this.fillOpacity=1,this.depthOffset=0,this.clipRect=null,this.orientation=G,this.glyphGeometryDetail=1,this.sdfGlyphSize=null,this.gpuAccelerateSDF=true,this.debugSDF=false,this._billboarding=false,this._batchedText=null,this._visible=true,Object.defineProperty(this,"visible",{get:()=>this._visible,set:e=>{this._visible!==e&&(this._visible=e,this._batchedText&&(this._batchedText._visibilityDirty=true));}}),this.uniforms={uThreeBlocksSdfDebug:uniform(0),uThreeBlocksSDFTextureSize:uniform(new Vector2),uThreeBlocksSDFGlyphSize:uniform(0),uThreeBlocksSDFExponent:uniform(0),uThreeBlocksTotalBounds:uniform(new Vector4(0,0,0,0)),uThreeBlocksClipRect:uniform(new Vector4(0,0,0,0)),uThreeBlocksDistanceOffset:uniform(0),uThreeBlocksOutlineOpacity:uniform(0),uThreeBlocksFillOpacity:uniform(1),uThreeBlocksBaseColor:uniform(new Color(0)),uThreeBlocksOutlineColor:uniform(new Color(16777215)),uThreeBlocksPositionOffset:uniform(new Vector2),uThreeBlocksBlurRadius:uniform(0),uThreeBlocksOrient:uniform(new Matrix3),uThreeBlocksBillboard:uniform(0)},this.patchWebGPU(new Float32Array);}patchWebGPU(t){let e=t.length,o=new Float32Array(e),n=new Float32Array(e);for(let s=0;s<e;s++)o[s]=t[s];if(e<=1)e===1&&(n[0]=0);else for(let s=0;s<e;s++)n[s]=s/(e-1);return this.geometry.instanceCount=1,[o,n]}sync(t,e){this._needsSync&&(this._needsSync=false,this._isSyncing?(this._queuedSyncs||(this._queuedSyncs=[])).push(t):(this._isSyncing=true,this.dispatchEvent(gt),me(e.backend.isWebGPUBackend,{text:this.text,font:this.font,lang:this.lang,fontSize:this.fontSize||.1,fontWeight:this.fontWeight||"normal",fontStyle:this.fontStyle||"normal",letterSpacing:this.letterSpacing||0,lineHeight:this.lineHeight||"normal",maxWidth:this.maxWidth,direction:this.direction||"auto",textAlign:this.textAlign,textIndent:this.textIndent,whiteSpace:this.whiteSpace,overflowWrap:this.overflowWrap,anchorX:this.anchorX,anchorY:this.anchorY,colorRanges:this.colorRanges,includeCaretPositions:true,sdfGlyphSize:this.sdfGlyphSize,gpuAccelerateSDF:this.gpuAccelerateSDF,unicodeFontsURL:this.unicodeFontsURL},o=>{this._isSyncing=false,this._textRenderInfo=o;let[n,s]=this.patchWebGPU(o.glyphAtlasIndices);this.geometry.updateGlyphs(o.glyphBounds,n,o.blockBounds,o.chunkedBounds,o.glyphColors),this.geometry.updateAttributeData(f,s,1),this.prepareMaterial(this.material);let a=this._queuedSyncs;a&&(this._queuedSyncs=null,this._needsSync=true,this.sync(()=>{a.forEach(h=>h&&h());},e)),this.dispatchEvent(mt),t&&t();})));}prepareMaterial(t){let e=this.textRenderInfo;if(this.material._isUtsuboText)return;let{sdfTexture:o}=e;this.sdfMap=texture(o);let n=!!(this._screenSpace||t._screenSpace),s=t._uWallBounds||uniform(new Vector2(1,1));t._uWallBounds=s;let a=t._uScreenOffset||uniform(new Vector2(0,0));t._uScreenOffset=a,t._textInstance=this,t._uBillboard=this.uniforms.uThreeBlocksBillboard;let h=Fn(([i])=>{let l=t._uBillboard,r=vec3(0,0,0).toVar();return If(l.greaterThan(0),()=>{let p=modelWorldMatrix.mul(vec4(0,0,0,1)).xyz.toVar(),g=modelWorldMatrix.mul(vec4(1,0,0,0)).xyz.toVar(),u=modelWorldMatrix.mul(vec4(0,1,0,0)).xyz.toVar(),f=modelWorldMatrix.mul(vec4(0,0,1,0)).xyz.toVar(),B=g.length().toVar(),T=u.length().toVar(),_=f.length().toVar(),k=cameraPosition.sub(p).toVar(),m=vec3(k.x,0,k.z).toVar(),b=m.length().toVar();If(b.lessThan(1e-4),()=>{m.assign(vec3(0,0,1));}).Else(()=>{m.divAssign(b);});let z=vec3(0,1,0).cross(m).normalize(),R=m.cross(z).normalize(),W=p.add(z.mul(i.x.mul(B))).add(R.mul(i.y.mul(T))).add(m.mul(i.z.mul(_)));r.assign(W),normalLocal.assign(m);}).Else(()=>{r.assign(modelWorldMatrix.mul(vec4(i,1)).xyz);}),r});t.setupVertex=i=>{let l=subBuild(P$1(i.object),"POSITION","vec3"),r=l;t.positionNode!==null&&(positionLocal.assign(l),r=subBuild(t.positionNode,"POSITION","vec3"));let p=h(r);return positionLocal.assign(r),Fn(()=>{let u=t._uBillboard,f=vec4(0,0,0,1).toVar();return If(u.greaterThan(0),()=>{f.assign(cameraProjectionMatrix.mul(cameraViewMatrix).mul(vec4(p,1)));}).Else(()=>{f.assign(cameraProjectionMatrix.mul(modelViewMatrix).mul(vec4(r,1)));}),f})()},n&&(t.vertexNode=Fn(()=>{let i=positionLocal.toVar(),l=vec2(a).toVar(),r=vec2(s).toVar(),p=screenSize.y.div(r.y).toVar(),g=i.x.mul(p).add(l.x).toVar(),u=i.y.mul(p).add(l.y).toVar(),f=cameraViewport.toVar(),B=g.sub(f.x).div(f.z).toVar(),T=u.sub(f.y).div(f.w).toVar(),_=B.mul(2).sub(1).toVar(),k=T.mul(2).sub(1).toVar(),b=i.z.toVar().sub(cameraPosition.z).toVar(),E=cameraProjectionMatrix.element(0).element(0).toVar(),z=cameraProjectionMatrix.element(1).element(1).toVar(),R=_.mul(b.negate()).div(E).toVar(),W=k.mul(b.negate()).div(z).toVar();return varyingProperty("vec3","vTextNdc").assign(vec3(i.x,i.y,i.z)),cameraProjectionMatrix.mul(vec4(R,W,b,1))})());let d=t.setupDiffuseColor?t.setupDiffuseColor.bind(t):null;t.setupDiffuseColor=i=>{d&&d(i);let l=vec4(diffuseColor).toVar(),r=mt$1(i.object,l);diffuseColor.assign(r);},this.material=t,this.material._isUtsuboText=true,this.material.colorWrite=true,this.material.transparent=true,this.material.needsUpdate=true;}onBeforeRender(t,e,o,n,s){this.sync(null,t),this._prepareForRender(s),s._originalSide=s.side;}onAfterRender(t,e,o,n,s){s._originalSide!==void 0&&(s.side=s._originalSide,delete s._originalSide);}dispose(){this.geometry.dispose();}get textRenderInfo(){return this._textRenderInfo||null}get billboarding(){return this._billboarding}set billboarding(t){this._billboarding!==t&&(this._billboarding=t,this.uniforms.uThreeBlocksBillboard.value=t?1:0,this.material&&(this.material._isUtsuboText=false,this.material.needsUpdate=true,this._needsSync=true));}get screenSpace(){return this._screenSpace||false}set screenSpace(t){this._screenSpace!==t&&(this._screenSpace=t,this.material&&(this.material._isUtsuboText=false,this.material.needsUpdate=true,this._needsSync=true));}get glyphGeometryDetail(){return this.geometry.detail}set glyphGeometryDetail(t){this.geometry.detail=t;}async _prepareForRender(t){let e=this.uniforms,o=this.textRenderInfo,n=this.outlineWidth||this.outlineBlur||this.outlineOffsetX||this.outlineOffsetY;if(!o)return;if(o){let{sdfTexture:a,blockBounds:h}=o;e.uThreeBlocksSDFTextureSize.value.set(a.image.width,a.image.height),typeof window<"u"&&(window.sdfTexture=a),e.uThreeBlocksSDFGlyphSize.value=o.sdfGlyphSize,e.uThreeBlocksSDFExponent.value=o.sdfExponent,e.uThreeBlocksTotalBounds.value.fromArray(h);let d=0,i=0,l=1,r=0,p=0;if(n){let{outlineWidth:u,outlineOffsetX:f,outlineOffsetY:B,outlineBlur:T,outlineOpacity:_}=this;d=this._parsePercent(u)||0,i=Math.max(0,this._parsePercent(T)||0),l=_,r=this._parsePercent(f)||0,p=this._parsePercent(B)||0;}else l=this.fillOpacity;e.uThreeBlocksDistanceOffset.value=d,e.uThreeBlocksPositionOffset.value.set(r,p),e.uThreeBlocksBlurRadius.value=i,e.uThreeBlocksFillOpacity.value=l??1;let g=this.clipRect;if(g&&Array.isArray(g)&&g.length===4)e.uThreeBlocksClipRect.value.fromArray(g);else {let u=(this.fontSize||.1)*100;e.uThreeBlocksClipRect.value.set(h[0]-u,h[1]-u,h[2]+u,h[3]+u);}this.geometry.applyClipRect(e.uThreeBlocksClipRect.value);}if(!o.sdfTexture)return;this.sdfMap&&(this.sdfMap.value=o.sdfTexture,this.sdfMap.needsUpdate=true),t.polygonOffset=!!this.depthOffset,t.polygonOffsetFactor=t.polygonOffsetUnits=this.depthOffset||0,t.color&&t.color.set(this.color),e.uThreeBlocksBaseColor.value.set(this.color),e.uThreeBlocksOutlineColor.value.set(this.outlineColor||16777215),e.uThreeBlocksOutlineOpacity.value=n?this.outlineOpacity??1:0;let s=this.orientation||G;if(s!==t._orientation){let a=e.uThreeBlocksOrient.value;s=s.replace(/[^-+xyz]/g,"");let h=s!==G&&s.match(/^([-+])([xyz])([-+])([xyz])$/);if(h){let[,d,i,l,r]=h;P.set(0,0,0)[i]=d==="-"?1:-1,M.set(0,0,0)[r]=l==="-"?-1:1,J.lookAt(yt,P.cross(M),M),a.setFromMatrix4(J);}else a.identity();t._orientation=s;}}_parsePercent(t){if(typeof t=="string"){let e=t.match(/^(-?[\d.]+)%$/),o=e?parseFloat(e[1]):NaN;t=(isNaN(o)?0:o/100)*this.fontSize;}return t}localPositionToTextCoords(t,e=new Vector2){return e.copy(t),e}worldPositionToTextCoords(t,e=new Vector2){return P.copy(t),this.localPositionToTextCoords(this.worldToLocal(P),e)}raycast(t,e){let{textRenderInfo:o}=this;if(o){let n=o.blockBounds,s=st(),a=s.geometry,{position:h,uv:d}=a.attributes;for(let i=0;i<d.count;i++){let l=n[0]+d.getX(i)*(n[2]-n[0]),r=n[1]+d.getY(i)*(n[3]-n[1]);h.setXYZ(i,l,r,0);}a.boundingSphere=this.geometry.boundingSphere,a.boundingBox=this.geometry.boundingBox,s.matrixWorld=this.matrixWorld,s.material.side=this.material.side,V.length=0,s.raycast(t,V);for(let i=0;i<V.length;i++)V[i].object=this,e.push(V[i]);}}copy(t){let e=this.geometry;return super.copy(t),this.geometry=e,xt.forEach(o=>{this[o]=t[o];}),this}clone(){return new this.constructor().copy(this)}};it.forEach(S=>{let t="_private_"+S;Object.defineProperty(I.prototype,S,{get(){return this[t]},set(e){e!==this[t]&&(this[t]=e,this._needsSync=true);}});});

/**
 * @module NURBSUtils
 * @three_import import * as NURBSUtils from 'three/addons/curves/NURBSUtils.js';
 */

/**
 * Finds knot vector span.
 *
 * @param {number} p - The degree.
 * @param {number} u - The parametric value.
 * @param {Array<number>} U - The knot vector.
 * @return {number} The span.
 */
function findSpan( p, u, U ) {

	const n = U.length - p - 1;

	if ( u >= U[ n ] ) {

		return n - 1;

	}

	if ( u <= U[ p ] ) {

		return p;

	}

	let low = p;
	let high = n;
	let mid = Math.floor( ( low + high ) / 2 );

	while ( u < U[ mid ] || u >= U[ mid + 1 ] ) {

		if ( u < U[ mid ] ) {

			high = mid;

		} else {

			low = mid;

		}

		mid = Math.floor( ( low + high ) / 2 );

	}

	return mid;

}

/**
 * Calculates basis functions. See The NURBS Book, page 70, algorithm A2.2.
 *
 * @param {number} span - The span in which `u` lies.
 * @param {number} u - The parametric value.
 * @param {number} p - The degree.
 * @param {Array<number>} U - The knot vector.
 * @return {Array<number>} Array[p+1] with basis functions values.
 */
function calcBasisFunctions( span, u, p, U ) {

	const N = [];
	const left = [];
	const right = [];
	N[ 0 ] = 1.0;

	for ( let j = 1; j <= p; ++ j ) {

		left[ j ] = u - U[ span + 1 - j ];
		right[ j ] = U[ span + j ] - u;

		let saved = 0.0;

		for ( let r = 0; r < j; ++ r ) {

			const rv = right[ r + 1 ];
			const lv = left[ j - r ];
			const temp = N[ r ] / ( rv + lv );
			N[ r ] = saved + rv * temp;
			saved = lv * temp;

		}

		N[ j ] = saved;

	}

	return N;

}

/**
 * Calculates B-Spline curve points. See The NURBS Book, page 82, algorithm A3.1.
 *
 * @param {number} p - The degree of the B-Spline.
 * @param {Array<number>} U - The knot vector.
 * @param {Array<Vector4>} P - The control points
 * @param {number} u - The parametric point.
 * @return {Vector4} The point for given `u`.
 */
function calcBSplinePoint( p, U, P, u ) {

	const span = findSpan( p, u, U );
	const N = calcBasisFunctions( span, u, p, U );
	const C = new Vector4( 0, 0, 0, 0 );

	for ( let j = 0; j <= p; ++ j ) {

		const point = P[ span - p + j ];
		const Nj = N[ j ];
		const wNj = point.w * Nj;
		C.x += point.x * wNj;
		C.y += point.y * wNj;
		C.z += point.z * wNj;
		C.w += point.w * Nj;

	}

	return C;

}

/**
 * Calculates basis functions derivatives. See The NURBS Book, page 72, algorithm A2.3.
 *
 * @param {number} span - The span in which `u` lies.
 * @param {number} u - The parametric point.
 * @param {number} p - The degree.
 * @param {number} n - number of derivatives to calculate
 * @param {Array<number>} U - The knot vector.
 * @return {Array<Array<number>>} An array[n+1][p+1] with basis functions derivatives.
 */
function calcBasisFunctionDerivatives( span, u, p, n, U ) {

	const zeroArr = [];
	for ( let i = 0; i <= p; ++ i )
		zeroArr[ i ] = 0.0;

	const ders = [];

	for ( let i = 0; i <= n; ++ i )
		ders[ i ] = zeroArr.slice( 0 );

	const ndu = [];

	for ( let i = 0; i <= p; ++ i )
		ndu[ i ] = zeroArr.slice( 0 );

	ndu[ 0 ][ 0 ] = 1.0;

	const left = zeroArr.slice( 0 );
	const right = zeroArr.slice( 0 );

	for ( let j = 1; j <= p; ++ j ) {

		left[ j ] = u - U[ span + 1 - j ];
		right[ j ] = U[ span + j ] - u;

		let saved = 0.0;

		for ( let r = 0; r < j; ++ r ) {

			const rv = right[ r + 1 ];
			const lv = left[ j - r ];
			ndu[ j ][ r ] = rv + lv;

			const temp = ndu[ r ][ j - 1 ] / ndu[ j ][ r ];
			ndu[ r ][ j ] = saved + rv * temp;
			saved = lv * temp;

		}

		ndu[ j ][ j ] = saved;

	}

	for ( let j = 0; j <= p; ++ j ) {

		ders[ 0 ][ j ] = ndu[ j ][ p ];

	}

	for ( let r = 0; r <= p; ++ r ) {

		let s1 = 0;
		let s2 = 1;

		const a = [];
		for ( let i = 0; i <= p; ++ i ) {

			a[ i ] = zeroArr.slice( 0 );

		}

		a[ 0 ][ 0 ] = 1.0;

		for ( let k = 1; k <= n; ++ k ) {

			let d = 0.0;
			const rk = r - k;
			const pk = p - k;

			if ( r >= k ) {

				a[ s2 ][ 0 ] = a[ s1 ][ 0 ] / ndu[ pk + 1 ][ rk ];
				d = a[ s2 ][ 0 ] * ndu[ rk ][ pk ];

			}

			const j1 = ( rk >= -1 ) ? 1 : - rk;
			const j2 = ( r - 1 <= pk ) ? k - 1 : p - r;

			for ( let j = j1; j <= j2; ++ j ) {

				a[ s2 ][ j ] = ( a[ s1 ][ j ] - a[ s1 ][ j - 1 ] ) / ndu[ pk + 1 ][ rk + j ];
				d += a[ s2 ][ j ] * ndu[ rk + j ][ pk ];

			}

			if ( r <= pk ) {

				a[ s2 ][ k ] = - a[ s1 ][ k - 1 ] / ndu[ pk + 1 ][ r ];
				d += a[ s2 ][ k ] * ndu[ r ][ pk ];

			}

			ders[ k ][ r ] = d;

			const j = s1;
			s1 = s2;
			s2 = j;

		}

	}

	let r = p;

	for ( let k = 1; k <= n; ++ k ) {

		for ( let j = 0; j <= p; ++ j ) {

			ders[ k ][ j ] *= r;

		}

		r *= p - k;

	}

	return ders;

}

/**
 * Calculates derivatives of a B-Spline. See The NURBS Book, page 93, algorithm A3.2.
 *
 * @param {number} p - The degree.
 * @param {Array<number>} U - The knot vector.
 * @param {Array<Vector4>} P - The control points
 * @param {number} u - The parametric point.
 * @param {number} nd - The number of derivatives.
 * @return {Array<Vector4>} An array[d+1] with derivatives.
 */
function calcBSplineDerivatives( p, U, P, u, nd ) {

	const du = nd < p ? nd : p;
	const CK = [];
	const span = findSpan( p, u, U );
	const nders = calcBasisFunctionDerivatives( span, u, p, du, U );
	const Pw = [];

	for ( let i = 0; i < P.length; ++ i ) {

		const point = P[ i ].clone();
		const w = point.w;

		point.x *= w;
		point.y *= w;
		point.z *= w;

		Pw[ i ] = point;

	}

	for ( let k = 0; k <= du; ++ k ) {

		const point = Pw[ span - p ].clone().multiplyScalar( nders[ k ][ 0 ] );

		for ( let j = 1; j <= p; ++ j ) {

			point.add( Pw[ span - p + j ].clone().multiplyScalar( nders[ k ][ j ] ) );

		}

		CK[ k ] = point;

	}

	for ( let k = du + 1; k <= nd + 1; ++ k ) {

		CK[ k ] = new Vector4( 0, 0, 0 );

	}

	return CK;

}

/**
 * Calculates "K over I".
 *
 * @param {number} k - The K value.
 * @param {number} i - The I value.
 * @return {number} k!/(i!(k-i)!)
 */
function calcKoverI( k, i ) {

	let nom = 1;

	for ( let j = 2; j <= k; ++ j ) {

		nom *= j;

	}

	let denom = 1;

	for ( let j = 2; j <= i; ++ j ) {

		denom *= j;

	}

	for ( let j = 2; j <= k - i; ++ j ) {

		denom *= j;

	}

	return nom / denom;

}

/**
 * Calculates derivatives (0-nd) of rational curve. See The NURBS Book, page 127, algorithm A4.2.
 *
 * @param {Array<Vector4>} Pders - Array with derivatives.
 * @return {Array<Vector3>} An array with derivatives for rational curve.
 */
function calcRationalCurveDerivatives( Pders ) {

	const nd = Pders.length;
	const Aders = [];
	const wders = [];

	for ( let i = 0; i < nd; ++ i ) {

		const point = Pders[ i ];
		Aders[ i ] = new Vector3( point.x, point.y, point.z );
		wders[ i ] = point.w;

	}

	const CK = [];

	for ( let k = 0; k < nd; ++ k ) {

		const v = Aders[ k ].clone();

		for ( let i = 1; i <= k; ++ i ) {

			v.sub( CK[ k - i ].clone().multiplyScalar( calcKoverI( k, i ) * wders[ i ] ) );

		}

		CK[ k ] = v.divideScalar( wders[ 0 ] );

	}

	return CK;

}

/**
 * Calculates NURBS curve derivatives. See The NURBS Book, page 127, algorithm A4.2.
 *
 * @param {number} p - The degree.
 * @param {Array<number>} U - The knot vector.
 * @param {Array<Vector4>} P - The control points in homogeneous space.
 * @param {number} u - The parametric point.
 * @param {number} nd - The number of derivatives.
 * @return {Array<Vector3>} array with derivatives for rational curve.
 */
function calcNURBSDerivatives( p, U, P, u, nd ) {

	const Pders = calcBSplineDerivatives( p, U, P, u, nd );
	return calcRationalCurveDerivatives( Pders );

}

/**
 * This class represents a NURBS curve.
 *
 * Implementation is based on `(x, y [, z=0 [, w=1]])` control points with `w=weight`.
 *
 * @augments Curve
 * @three_import import { NURBSCurve } from 'three/addons/curves/NURBSCurve.js';
 */
class NURBSCurve extends Curve {

	/**
	 * Constructs a new NURBS curve.
	 *
	 * @param {number} degree - The NURBS degree.
	 * @param {Array<number>} knots - The knots as a flat array of numbers.
	 * @param {Array<Vector2|Vector3|Vector4>} controlPoints - An array holding control points.
	 * @param {number} [startKnot] - Index of the start knot into the `knots` array.
	 * @param {number} [endKnot] - Index of the end knot into the `knots` array.
	 */
	constructor( degree, knots, controlPoints, startKnot, endKnot ) {

		super();

		const knotsLength = knots ? knots.length - 1 : 0;
		const pointsLength = controlPoints ? controlPoints.length : 0;

		/**
		 * The NURBS degree.
		 *
		 * @type {number}
		 */
		this.degree = degree;

		/**
		 * The knots as a flat array of numbers.
		 *
		 * @type {Array<number>}
		 */
		this.knots = knots;

		/**
		 * An array of control points.
		 *
		 * @type {Array<Vector4>}
		 */
		this.controlPoints = [];

		/**
		 * Index of the start knot into the `knots` array.
		 *
		 * @type {number}
		 */
		this.startKnot = startKnot || 0;

		/**
		 * Index of the end knot into the `knots` array.
		 *
		 * @type {number}
		 */
		this.endKnot = endKnot || knotsLength;

		for ( let i = 0; i < pointsLength; ++ i ) {

			// ensure Vector4 for control points
			const point = controlPoints[ i ];
			this.controlPoints[ i ] = new Vector4( point.x, point.y, point.z, point.w );

		}

	}

	/**
	 * This method returns a vector in 3D space for the given interpolation factor.
	 *
	 * @param {number} t - A interpolation factor representing a position on the curve. Must be in the range `[0,1]`.
	 * @param {Vector3} [optionalTarget] - The optional target vector the result is written to.
	 * @return {Vector3} The position on the curve.
	 */
	getPoint( t, optionalTarget = new Vector3() ) {

		const point = optionalTarget;

		const u = this.knots[ this.startKnot ] + t * ( this.knots[ this.endKnot ] - this.knots[ this.startKnot ] ); // linear mapping t->u

		// following results in (wx, wy, wz, w) homogeneous point
		const hpoint = calcBSplinePoint( this.degree, this.knots, this.controlPoints, u );

		if ( hpoint.w !== 1.0 ) {

			// project to 3D space: (wx, wy, wz, w) -> (x, y, z, 1)
			hpoint.divideScalar( hpoint.w );

		}

		return point.set( hpoint.x, hpoint.y, hpoint.z );

	}

	/**
	 * Returns a unit vector tangent for the given interpolation factor.
	 *
	 * @param {number} t - The interpolation factor.
	 * @param {Vector3} [optionalTarget] - The optional target vector the result is written to.
	 * @return {Vector3} The tangent vector.
	 */
	getTangent( t, optionalTarget = new Vector3() ) {

		const tangent = optionalTarget;

		const u = this.knots[ 0 ] + t * ( this.knots[ this.knots.length - 1 ] - this.knots[ 0 ] );
		const ders = calcNURBSDerivatives( this.degree, this.knots, this.controlPoints, u, 1 );
		tangent.copy( ders[ 1 ] ).normalize();

		return tangent;

	}

	toJSON() {

		const data = super.toJSON();

		data.degree = this.degree;
		data.knots = [ ...this.knots ];
		data.controlPoints = this.controlPoints.map( p => p.toArray() );
		data.startKnot = this.startKnot;
		data.endKnot = this.endKnot;

		return data;

	}

	fromJSON( json ) {

		super.fromJSON( json );

		this.degree = json.degree;
		this.knots = [ ...json.knots ];
		this.controlPoints = json.controlPoints.map( p => new Vector4( p[ 0 ], p[ 1 ], p[ 2 ], p[ 3 ] ) );
		this.startKnot = json.startKnot;
		this.endKnot = json.endKnot;

		return this;

	}

}

var R=0,T=class{constructor(e){this.parser=e,this.name="UTSUBO_curve_extension";}afterRoot(e){let t=this.parser,r=t.json;return r.nodes?t.getDependencies("node").then(s=>this.createCurves(r.nodes,e,s)):null}createCurves(e,t,r){let s=[];for(let i=0;i<e.length;i++){let c=e[i];if(c.extensions&&c.extensions[this.name]){if(Array.isArray(c.children)&&c.children.some(p=>{let f=e[p];return f&&f.extensions&&f.extensions[this.name]}))continue;s.push(this.createCurve(c,t,i,r[i]));}}return Promise.all(s)}createCurve(e,t,r,s){let i=e.extensions[this.name],c=[];i.splines.forEach(a=>{let E;if(a.type==="BEZIER"){let l=a.points.map(u=>this.convertBlenderToThreeCoordinates(u.co)),m=a.points.map(u=>this.convertBlenderToThreeCoordinates(u.handle_left)),v=a.points.map(u=>this.convertBlenderToThreeCoordinates(u.handle_right));if(l.length===2)E=new CubicBezierCurve3(l[0],v[0],m[1],l[1]);else {E=new CurvePath;for(let u=0;u<l.length-1;u++){let C=new CubicBezierCurve3(l[u],v[u],m[u+1],l[u+1]);E.curves.push(C);}if(a.use_cyclic_u){let u=l.length-1,C=new CubicBezierCurve3(l[u],v[u],m[0],l[0]);E.curves.push(C),E.curves[0].v0=l[0].clone();}}}else if(a.type==="NURBS")E=this.createNURBSCurvePath(a);else {let l=a.points.map(m=>this.convertBlenderToThreeCoordinates(m.co));E=new CatmullRomCurve3(l,a.use_cyclic_u);}E&&c.push(E);});let o=c[0];c.length>1&&(o=new CurvePath,c.forEach(a=>o.add(a)));let p=o.getPoints(i.splines[0].resolution_u*10||100),f=new BufferGeometry().setFromPoints(p),d=new LineBasicMaterial({color:16777215}),h=new Line(f,d);return h.name=e.name?`${e.name}_curve`:`curve_${R++}`,this.applyNodeTransform(h,e),h.userData.curve=o,this.parser.associations.has(h)||this.parser.associations.set(h,{}),this.parser.associations.get(h).nodes=r,Promise.resolve(h).then(a=>(this.replaceCurveInScene(t,a,s),a))}convertBlenderToThreeCoordinates(e){return new Vector3(e[0],e[2],-e[1])}applyNodeTransform(e,t){if(t.matrix!==void 0){let r=new Matrix4;r.fromArray(t.matrix),e.applyMatrix4(r);}else {if(t.translation!==void 0&&e.position.fromArray(t.translation),t.rotation!==void 0){let r=new Quaternion().fromArray(t.rotation),s=new Euler().setFromQuaternion(r,"XYZ");s.x=-s.x,s.y=-s.y,e.rotation.copy(s);}t.scale!==void 0&&e.scale.fromArray(t.scale);}}replaceCurveInScene(e,t,r){if(r&&r.parent){let s=r.parent;t.position.copy(r.position),t.quaternion.copy(r.quaternion),t.scale.copy(r.scale),t.userData={...r.userData,...t.userData},s.add(t);}else console.warn("Original node or its parent not found. Adding curve to scene root."),e.scene.add(t);}createNURBSCurvePath(e){let t=e.order_u-1,r=e.knots||this.generateKnots(e.points.length,t,e.use_cyclic_u),s=e.points.map(h=>{let a=this.convertBlenderToThreeCoordinates(h.co);return new Vector4(a.x,a.y,a.z,h.w||1)}),i,c;e.use_cyclic_u?(i=t,c=r.length-t-1):(i=0,c=r.length-1);let o=new NURBSCurve(t,r,s,i,c),p=Math.max(200,e.resolution_u*10),f=o.getPoints(p),d=new CurvePath;return d.add(new CatmullRomCurve3(f,e.use_cyclic_u,"centripetal")),d}generateKnots(e,t,r){let s=t+1,i=[];if(r){let o=e+s;for(let p=0;p<o;p++)i.push(p);}else {for(let o=0;o<s;o++)i.push(0);for(let o=1;o<=e-s;o++)i.push(o);for(let o=0;o<s;o++)i.push(e-s+1);}let c=i[i.length-1];return i.map(o=>o/c)}};

let textureLoader;
const isOffscreen = typeof window === 'undefined';

if ( isOffscreen ) {

	textureLoader = new ImageBitmapLoader();
	textureLoader.setOptions( { imageOrientation: 'flipY' } );

} else {

	textureLoader = new TextureLoader();

}

function convertBitmapToTexture( bitmap ) {

	const texture = new Texture( bitmap );
	texture.needsUpdate = true;
	texture.flipY = true;
	texture.colorSpace = SRGBColorSpace;
	return texture;

}

// Configure and create Draco decoder.
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath( resolvePublicPath( 'draco/' ) );
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader( dracoLoader );
gltfLoader.setMeshoptDecoder( MeshoptDecoder );
gltfLoader.register( parser => new T( parser ) );

const ktxLoader = new KTX2Loader().setTranscoderPath( resolvePublicPath( 'basis/' ) );
// Define a mapping from file extensions to Three.js loaders
const loadersMap = {
	'.png': textureLoader, // 'png' extension will use TextureLoader internally
	'.jpg': textureLoader,
	'.jpeg': textureLoader,
	'.webp': textureLoader,
	'.avif': textureLoader,
	'.glb': gltfLoader,
	'.gltf': gltfLoader,
	'.hdr': HDRLoader,
	'.exr': EXRLoader,
	'.bin': FileLoader,
	'.ktx2': KTX2Loader,
	// ... add other mappings as needed
};
const DESKTOP_ONLY_FILE = '_desktop';
const MOBILE_ONLY_FILE = '_mobile';

class Loader {

	constructor() {}

	initResources() {

		const { isIOS, isSafari, isMobileOrTablet } = store;
		const ios = isIOS;
		// define here the assets that are desktop only (add android check if needed)
		this.deviceSpecificResources = ! ios ? DESKTOP_ONLY_FILE : MOBILE_ONLY_FILE;
		this.doNotSupportOpusFiles = ios || isSafari;
		this.shouldLoadFontFile = ! isMobileOrTablet;

		// console.log(
		//   'Loading resources with extension for device:',
		//   this.deviceSpecificResources
		// );

		this.resources = {};
		this.totalImagesForCubeTexture = 6;
		this.defaultFileSize = 1024; // 128KB in bytes
		this.totalBytes = 0;
		this.loadedBytes = 0;
		this.currentProgress = 0;

		for ( const res of RESOURCES ) {

			const formattedResource = this.formatResourcesForLoader( res );
			if ( formattedResource ) {

				this.resources[ res.name ] = formattedResource;
				this.totalBytes += this.resources[ res.name ].total;

			}

		}

	}

	formatResourcesForLoader( res ) {

		const resFiltered = this.filterDeviceSpecificResources(
			this.filterAudioResources( res )
		);

		if ( ! resFiltered || ( ! this.shouldLoadFontFile && resFiltered.isFont ) ) {

			return null;

		}

		return {
			name: resFiltered.name,
			url: resFiltered.url,
			asset: null,
			loaded: 0,
			total: resFiltered.fileSize,
			isCubeTexture: Array.isArray( resFiltered.url ),
			cubeTextureProgress: Array.isArray( resFiltered.url )
				? Array( this.totalImagesForCubeTexture ).fill( 0 )
				: null,
			// Initialize an empty promise object, resolve and reject will be assigned later
			loading: { promise: null, resolve: null, reject: null },
		};

	}

	filterDeviceSpecificResources( res ) {

		if ( ! res ) {

			return false;

		}

		const resName = res.name;
		const isDesktopOnlyFile = resName.endsWith( DESKTOP_ONLY_FILE );
		const isMobileOnlyFile = resName.endsWith( MOBILE_ONLY_FILE );

		if ( resName.includes( this.deviceSpecificResources ) ) {

			res.name = resName.replace( this.deviceSpecificResources, '' );
			return res;

		} else if ( isDesktopOnlyFile || isMobileOnlyFile ) {

			return false;

		}

		return res;

	}

	filterAudioResources( res ) {

		const isMp3 = res.url.includes( '.mp3' );
		const isOpus = res.url.includes( '.opus' );

		if ( ! isMp3 && ! isOpus ) {

			return res;

		}

		if (
			( isOpus && this.doNotSupportOpusFiles ) ||
      ( isMp3 && ! this.doNotSupportOpusFiles )
		) {

			return false;

		}

		const name = res.name.replace( isOpus ? '_opus' : '_mp3', '' );
		if ( this.resources[ name ] ) {

			// check if the resource already exists after the name has been modified
			return false;

		}

		res.name = name;
		return res;

	}

	load() {

		this.initResources();

		dispatcherSingleton.trigger( { name: 'loadStart' } );
		const loadPromises = Object.values( this.resources ).map( ( resource ) => {

			// Create the loading promise for each resource
			resource.loading.promise = new Promise( ( resolve, reject ) => {

				resource.loading.resolve = resolve;
				resource.loading.reject = reject;

			} );

			return this.loadResource( resource );

		} );

		return Promise.allSettled( loadPromises ).then( ( results ) => {

			this.finish( results );

		} );

	}

	loadResource( res ) {

		return new Promise( async ( resolve, reject ) => {

			if ( Array.isArray( res.url ) ) {

				const imagePromises = res.url.map( ( url, index ) => {

					return this.fetchImage( url, res.name, index );

				} );

				Promise.all( imagePromises )
					.then( ( images ) => {

						// Convert ImageBitmaps to textures if in offscreen context
						const processedImages = isOffscreen
							? images.map( ( img ) => convertBitmapToTexture( img ) )
							: images;

						const convertedAsset = new CubeTexture( processedImages );
						convertedAsset.needsUpdate = true;
						this.resources[ res.name ].asset = convertedAsset;
						this.resources[ res.name ].loading.resolve( convertedAsset );
						resolve( convertedAsset );

					} )
					.catch( reject );

				return;

			}

			const extension = res.url.substring( res.url.lastIndexOf( '.' ) );
			let loader = loadersMap[ extension ] || FileLoader;

			if ( extension === '.json' ) {

				loader = new FileLoader();
				loader.setResponseType( 'json' );

			}

			if ( typeof loader === 'function' ) {

				loader = new loader();

			}

			// Handle texture loading differently in offscreen context
			const isTextureFile = [ '.png', '.jpg', '.jpeg', '.webp' ].includes(
				extension
			);

			if ( isOffscreen && isTextureFile ) {

				loader.load(
					res.url,
					( bitmap ) => {

						const texture = convertBitmapToTexture( bitmap );
						this.resources[ res.name ].asset = texture;
						this.resources[ res.name ].loading.resolve( texture );
						resolve( texture );

					},
					( progressEvent ) => {

						this.onProgress( res.name, progressEvent );

					},
					reject
				);
				return;

			}

			if ( extension === '.glb' ) {

				const { gl } = store;

				ktxLoader.detectSupportAsync( gl ).then( () => {

					gltfLoader.setKTX2Loader( ktxLoader );

					loader.load(
						res.url,
						( asset ) => {

							const convertedAsset = asset;

							const resource = this.resources[ res.name ];
							resource.asset = convertedAsset;
							resource.loading.resolve( convertedAsset );
							resource.loaded = resource.total;
							this.updateOverallProgress();

							resolve( convertedAsset ); // Resolve the promise here

						},
						( progressEvent ) => {

							this.onProgress( res.name, progressEvent );

						},
						( error ) => {

							console.error( 'Error loading asset:', error );
							reject( error ); // Reject the promise here

						}
					);

				} );

				return;

			}

			if ( extension === '.bin' ) {

				loader.setResponseType( 'arraybuffer' );

			}

			if ( extension === '.ktx2' ) {

				const { gl } = store;
				loader = ktxLoader;
				await loader.detectSupportAsync( gl );

			}

			loader.load(
				res.url,
				( asset ) => {

					const convertedAsset = asset;

					this.resources[ res.name ].asset = convertedAsset;
					this.resources[ res.name ].loaded = this.resources[ res.name ].total;
					this.resources[ res.name ].loading.resolve( convertedAsset );
					this.updateOverallProgress();

					resolve( convertedAsset ); // Resolve the promise here

				},
				( progressEvent ) => {

					this.onProgress( res.name, progressEvent );

				},
				( error ) => {

					console.error( 'Error loading asset:', error );
					reject( error ); // Reject the promise here

				}
			);

		} );

	}

	async fetchImage( url, resourceName, imageIndex ) {

		try {

			const response = await fetch( url );
			const contentLength = response.headers.get( 'Content-Length' );
			const totalSize = contentLength
				? Number.parseInt( contentLength, 10 )
				: this.defaultFileSize;

			this.resources[ resourceName ].cubeTextureProgress[ imageIndex ] = totalSize;
			this.updateResourceTotal( resourceName );

			const blob = await response.blob();
			const bitmap = await createImageBitmap( blob );

			this.resources[ resourceName ].loaded +=
        this.resources[ resourceName ].cubeTextureProgress[ imageIndex ];
			this.updateOverallProgress();

			return bitmap;

		} catch ( error ) {

			this.resources[ resourceName ].reject( error );
			throw error;

		}

	}

	updateResourceTotal( resourceName ) {

		const resource = this.resources[ resourceName ];
		if ( resource.isCubeTexture ) {

			resource.total = resource.cubeTextureProgress.reduce(
				( acc, val ) => acc + val,
				0
			);

			// Adjust the total bytes for all resources
			this.totalBytes = Object.values( this.resources ).reduce(
				( acc, res ) => acc + res.total,
				0
			);

		}

	}

	onCubeTextureProgress( resourceName, imageIndex, response ) {

		const resource = this.resources[ resourceName ];
		if ( resource.isCubeTexture ) {

			let fileSize;
			if ( response.headers.get( 'Content-Length' ) ) {

				fileSize = parseInt( response.headers.get( 'Content-Length' ), 10 );

			} else {

				// If length is not computable, use a default size
				fileSize = this.defaultFileSize;

			}

			// Update progress for the current image
			resource.cubeTextureProgress[ imageIndex ] = fileSize;

			// Update total size once
			if ( resource.total === 0 ) {

				resource.total = resource.cubeTextureProgress.reduce(
					( acc, val ) => acc + val,
					0
				);

			}

			// Incrementally update loaded size
			resource.loaded += fileSize;

			// Update overall progress
			this.updateOverallProgress();

		}

	}

	onProgress( resourceName, progressEvent ) {

		const resource = this.resources[ resourceName ];

		if ( progressEvent.lengthComputable ) {

			// When length is computable, use the standard progress calculation
			resource.loaded = progressEvent.loaded;
			resource.total = progressEvent.total;

		} else {

			// Fallback for when length is not computable
			const defaultFileSize = 1024; // 128KB in bytes
			resource.total = defaultFileSize;
			resource.loaded = defaultFileSize;

		}

		this.updateOverallProgress();

	}

	updateOverallProgress() {

		const totalBytes = Object.values( this.resources ).reduce(
			( acc, res ) => acc + res.total,
			0
		);
		const loadedBytes = Object.values( this.resources ).reduce(
			( acc, res ) => acc + res.loaded,
			0
		);

		const progress = Math.round(
			totalBytes > 0 ? ( loadedBytes / totalBytes ) * 100 : 0
		);

		if ( this.currentProgress === progress ) {

			return;

		}

		this.currentProgress = progress;
		dispatcherSingleton.trigger( { name: 'loadProgress' }, { progress } );

	}

	finish() {

		dispatcherSingleton.trigger( { name: 'loadEnd', fireAtStart: true }, {} );

	}

}

const loader = new Loader();

/**
 * Worker-side manager for DOM-synchronized Text instances.
 * Receives updates from main thread DOMTextSync and creates/updates/removes
 * Text meshes positioned in screen space to match DOM elements.
 */
class DOMTextManager extends component( null ) {

	init() {

		this._textInstances = new Map(); // id -> Text mesh
		// Canvas rect will be set by first domTextSync event from main thread
		this._canvasRect = { width: 1, height: 1 };
		this._fontMap = DOMTextManager.fontMap || {};

	}

	/**
	 * Handle resize events to update canvas rect and reposition text.
	 */
	onResize( { width, height } ) {

		this._canvasRect = { width, height };

		// Update bounds for all text instances
		for ( const text of this._textInstances.values() ) {

			if ( text.material && text.material._uWallBounds ) {

				text.material._uWallBounds.value.set( width, height );

			}

		}

	}

	/**
	 * Handle batch updates from main thread.
	 * @param {Object} payload - { updates: Array, canvasRect: Object }
	 */
	onDomTextSync( { updates, canvasRect } ) {

		if ( canvasRect ) {

			this._canvasRect = canvasRect;

		}

		for ( const update of updates ) {

			switch ( update.type ) {

			case 'create':
				this._createText( update.id, update.styles, update.rect, update.zIndex );
				break;
			case 'update':
				this._updateText( update.id, update );
				break;
			case 'rect':
				this._updateRect( update.id, update.rect );
				break;
			case 'visibility':
				this._updateVisibility( update.id, update.visible );
				break;
			case 'remove':
				this._removeText( update.id );
				break;

			}

		}

	}

	_createText( id, styles, rect, zIndex = 0 ) {

		const text = new I();
		text.name = id;
		text.screenSpace = true;

		// Store zIndex for depth positioning (used in shader via position.z)
		text._zIndex = zIndex;

		// Center anchor for positioning
		text.anchorX = 'center';
		text.anchorY = 'middle';

		// Apply styles
		this._applyStyles( text, styles );

		// Store rect for applying after material is ready
		text._pendingRect = rect;

		const { scene, gl } = store;
		scene.add( text );
		this._textInstances.set( id, text );

		// Guard against store.gl not being initialized yet
		if ( ! gl ) {

			console.warn( 'DOMTextManager: store.gl not initialized, deferring text sync' );
			return;

		}

		// Trigger async glyph generation - apply rect after sync completes
		text._needsSync = true;
		text.sync( () => {

			if ( text._pendingRect ) {

				this._applyRect( text, text._pendingRect );
				delete text._pendingRect;

			}

		}, gl );

	}

	_updateText( id, { styles, rect } ) {

		const text = this._textInstances.get( id );
		if ( ! text ) return;

		const { gl } = store;

		if ( styles ) {

			this._applyStyles( text, styles );
			// Re-sync if text content changed
			text._needsSync = true;

			if ( rect ) {

				text._pendingRect = rect;

			}

			// Guard against store.gl not being initialized yet
			if ( ! gl ) {

				console.warn( 'DOMTextManager: store.gl not initialized, deferring text sync' );
				return;

			}

			text.sync( () => {

				if ( text._pendingRect ) {

					this._applyRect( text, text._pendingRect );
					delete text._pendingRect;

				}

			}, gl );

		} else if ( rect ) {

			this._applyRect( text, rect );

		}

	}

	_updateRect( id, rect ) {

		const text = this._textInstances.get( id );
		if ( ! text || ! rect ) return;

		// If material not ready yet, store for later
		if ( ! text.material || ! text.material._uScreenOffset ) {

			text._pendingRect = rect;
			return;

		}

		this._applyRect( text, rect );

	}

	_updateVisibility( id, visible ) {

		const text = this._textInstances.get( id );
		if ( text ) {

			text.visible = visible;

		}

	}

	_removeText( id ) {

		const text = this._textInstances.get( id );
		if ( ! text ) return;

		const { scene } = store;
		scene.remove( text );
		text.dispose();
		this._textInstances.delete( id );

	}

	_applyStyles( text, styles ) {

		if ( styles.text !== undefined ) {

			text.text = styles.text;

		}

		if ( styles.fontSize !== undefined ) {

			// For screen-space mode with bounds = screen size, fontSize maps 1:1 to pixels
			text.fontSize = styles.fontSize;

		}

		if ( styles.fontFamily !== undefined ) {

			// Use font map if available, otherwise let troika resolve
			text.font = this._fontMap[ styles.fontFamily ] || null;

		}

		if ( styles.fontWeight !== undefined ) {

			text.fontWeight = styles.fontWeight;

		}

		if ( styles.fontStyle !== undefined ) {

			text.fontStyle = styles.fontStyle;

		}

		if ( styles.lineHeight !== undefined && styles.fontSize > 0 ) {

			// CSS lineHeight in pixels → convert to relative multiplier for Text.js
			const lh = parseFloat( styles.lineHeight );
			if ( ! isNaN( lh ) ) {

				text.lineHeight = lh / styles.fontSize;

			}

		}

		if ( styles.color !== undefined ) {

			text.color = new Color( styles.color );

		}

		if ( styles.letterSpacing !== undefined ) {

			// Letter spacing in pixels (1:1 mapping in screen-space mode)
			text.letterSpacing = styles.letterSpacing;

		}

		if ( styles.textAlign !== undefined ) {

			// Map CSS text-align to Text values
			const alignMap = {
				'left': 'left',
				'center': 'center',
				'right': 'right',
				'justify': 'left', // Text doesn't support justify
				'start': 'left',
				'end': 'right',
			};
			text.textAlign = alignMap[ styles.textAlign ] || 'left';

		}

		if ( styles.opacity !== undefined ) {

			text.fillOpacity = styles.opacity;

		}

	}

	_applyRect( text, rect ) {

		const { width: cw, height: ch } = this._canvasRect;

		// Calculate the center position of the element in screen pixels
		// The shader expects offset in pixels from the viewport origin
		const centerX = rect.x + rect.width / 2;
		// Flip Y: DOM has Y=0 at top, shader expects Y=0 at bottom
		const centerY = ch - ( rect.y + rect.height / 2 );

		// Update screen offset uniform (in pixels)
		if ( text.material && text.material._uScreenOffset ) {

			text.material._uScreenOffset.value.set( centerX, centerY );

		}

		// Set bounds to screen dimensions for 1:1 pixel scaling
		// This ensures fontSize in layout units = fontSize in screen pixels
		if ( text.material && text.material._uWallBounds ) {

			text.material._uWallBounds.value.set( cw, ch );

		}

		// Set z-position for depth ordering (negative = further back)
		// This affects clip space z via the screen-space shader
		if ( text._zIndex !== undefined && text._zIndex !== 0 ) {

			text.position.z = text._zIndex;

		}

		// Set maxWidth to element width for text wrapping
		if ( rect.width > 0 ) {

			text.maxWidth = rect.width;

		}

	}

	dispose() {

		const { scene } = store;

		for ( const text of this._textInstances.values() ) {

			scene.remove( text );
			text.dispose();

		}

		this._textInstances.clear();
		super.dispose?.();

	}

}

// Static font map for custom fonts (can be configured by user)
DOMTextManager.fontMap = {};

/**
 * This class represents a scene with a basic room setup that can be used as
 * input for {@link PMREMGenerator#fromScene}. The resulting PMREM represents the room's
 * lighting and can be used for Image Based Lighting by assigning it to {@link Scene#environment}
 * or directly as an environment map to PBR materials.
 *
 * The implementation is based on the [EnvironmentScene](https://github.com/google/model-viewer/blob/master/packages/model-viewer/src/three-components/EnvironmentScene.ts)
 * component from the `model-viewer` project.
 *
 * ```js
 * const environment = new RoomEnvironment();
 * const pmremGenerator = new THREE.PMREMGenerator( renderer );
 *
 * const envMap = pmremGenerator.fromScene( environment ).texture;
 * scene.environment = envMap;
 * ```
 *
 * @augments Scene
 * @three_import import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
 */
class RoomEnvironment extends Scene {

	constructor() {

		super();

		this.name = 'RoomEnvironment';

		const geometry = new BoxGeometry();
		geometry.deleteAttribute( 'uv' );

		const roomMaterial = new MeshStandardMaterial( { side: BackSide } );
		const boxMaterial = new MeshStandardMaterial();

		const mainLight = new PointLight( 0xffffff, 900, 28, 2 );
		mainLight.position.set( 0.418, 16.199, 0.300 );
		this.add( mainLight );

		const room = new Mesh( geometry, roomMaterial );
		room.position.set( -0.757, 13.219, 0.717 );
		room.scale.set( 31.713, 28.305, 28.591 );
		this.add( room );

		const boxes = new InstancedMesh( geometry, boxMaterial, 6 );
		const transform = new Object3D();

		// box1
		transform.position.set( -10.906, 2.009, 1.846 );
		transform.rotation.set( 0, -0.195, 0 );
		transform.scale.set( 2.328, 7.905, 4.651 );
		transform.updateMatrix();
		boxes.setMatrixAt( 0, transform.matrix );

		// box2
		transform.position.set( -5.607, -0.754, -0.758 );
		transform.rotation.set( 0, 0.994, 0 );
		transform.scale.set( 1.970, 1.534, 3.955 );
		transform.updateMatrix();
		boxes.setMatrixAt( 1, transform.matrix );

		// box3
		transform.position.set( 6.167, 0.857, 7.803 );
		transform.rotation.set( 0, 0.561, 0 );
		transform.scale.set( 3.927, 6.285, 3.687 );
		transform.updateMatrix();
		boxes.setMatrixAt( 2, transform.matrix );

		// box4
		transform.position.set( -2.017, 0.018, 6.124 );
		transform.rotation.set( 0, 0.333, 0 );
		transform.scale.set( 2.002, 4.566, 2.064 );
		transform.updateMatrix();
		boxes.setMatrixAt( 3, transform.matrix );

		// box5
		transform.position.set( 2.291, -0.756, -2.621 );
		transform.rotation.set( 0, -0.286, 0 );
		transform.scale.set( 1.546, 1.552, 1.496 );
		transform.updateMatrix();
		boxes.setMatrixAt( 4, transform.matrix );

		// box6
		transform.position.set( -2.193, -0.369, -5.547 );
		transform.rotation.set( 0, 0.516, 0 );
		transform.scale.set( 3.875, 3.487, 2.986 );
		transform.updateMatrix();
		boxes.setMatrixAt( 5, transform.matrix );

		this.add( boxes );


		// -x right
		const light1 = new Mesh( geometry, createAreaLightMaterial( 50 ) );
		light1.position.set( -16.116, 14.37, 8.208 );
		light1.scale.set( 0.1, 2.428, 2.739 );
		this.add( light1 );

		// -x left
		const light2 = new Mesh( geometry, createAreaLightMaterial( 50 ) );
		light2.position.set( -16.109, 18.021, -8.207 );
		light2.scale.set( 0.1, 2.425, 2.751 );
		this.add( light2 );

		// +x
		const light3 = new Mesh( geometry, createAreaLightMaterial( 17 ) );
		light3.position.set( 14.904, 12.198, -1.832 );
		light3.scale.set( 0.15, 4.265, 6.331 );
		this.add( light3 );

		// +z
		const light4 = new Mesh( geometry, createAreaLightMaterial( 43 ) );
		light4.position.set( -0.462, 8.89, 14.520 );
		light4.scale.set( 4.38, 5.441, 0.088 );
		this.add( light4 );

		// -z
		const light5 = new Mesh( geometry, createAreaLightMaterial( 20 ) );
		light5.position.set( 3.235, 11.486, -12.541 );
		light5.scale.set( 2.5, 2.0, 0.1 );
		this.add( light5 );

		// +y
		const light6 = new Mesh( geometry, createAreaLightMaterial( 100 ) );
		light6.position.set( 0.0, 20.0, 0.0 );
		light6.scale.set( 1.0, 0.1, 1.0 );
		this.add( light6 );

	}

	/**
	 * Frees internal resources. This method should be called
	 * when the environment is no longer required.
	 */
	dispose() {

		const resources = new Set();

		this.traverse( ( object ) => {

			if ( object.isMesh ) {

				resources.add( object.geometry );
				resources.add( object.material );

			}

		} );

		for ( const resource of resources ) {

			resource.dispose();

		}

	}

}

function createAreaLightMaterial( intensity ) {

	// create an emissive-only material. see #31348
	const material = new MeshLambertMaterial( {
		color: 0x000000,
		emissive: 0xffffff,
		emissiveIntensity: intensity
	} );

	return material;

}

class Demo extends component(Object3D, {
  raf: {
    renderPriority: 1,
    fps: Number.Infinity
  }
}) {
  init() {
    this._galleryLinks = /* @__PURE__ */ new Map();
    this._raycaster = new Raycaster();
    const gal1Loader = new GLTFLoader();
    gal1Loader.load(resolvePublicPath("Assets/Gallery1.glb"), (gal1) => {
      this.add(gal1.scene);
      this.registerGalleryLink(gal1.scene, "https://www.refractstudio.net/mwvegas");
      this.applyVideoTextureToObject(gal1.scene, resolvePublicPath("Assets/Orange.mp4"));
    });
    const gal1text = new GLTFLoader();
    gal1text.load(resolvePublicPath("Assets/Text.glb"), (gal1text2) => {
      this.add(gal1text2.scene);
    });
    const gal2Loader = new GLTFLoader();
    gal2Loader.load(resolvePublicPath("Assets/Gallery2.glb"), (gal2) => {
      this.add(gal2.scene);
      this.registerGalleryLink(gal2.scene, "https://www.refractstudio.net/mwportals");
      this.applyVideoTextureToObject(gal2.scene, resolvePublicPath("Assets/Portals.mp4"));
    });
    const gal3Loader = new GLTFLoader();
    gal3Loader.load(resolvePublicPath("Assets/Gallery3.glb"), (gal3) => {
      this.add(gal3.scene);
      this.registerGalleryLink(gal3.scene, "https://www.route66remixed.com/tour?location=lets-not-forget-albuquerque-is-a-character-too");
      this.applyVideoTextureToObject(gal3.scene, resolvePublicPath("Assets/cinimatest.mp4"));
    });
    const gal4Loader = new GLTFLoader();
    gal4Loader.load(resolvePublicPath("Assets/Gallery4.glb"), (gal4) => {
      this.add(gal4.scene);
      this.registerGalleryLink(gal4.scene, "https://www.route66remixed.com/tour?location=the-old-road---el-viejo-camino");
      this.applyVideoTextureToObject(gal4.scene, resolvePublicPath("Assets/Dancer.mp4"));
    });
    const gal5Loader = new GLTFLoader();
    gal5Loader.load(resolvePublicPath("Assets/Gallery5.glb"), (gal5) => {
      this.add(gal5.scene);
      this.registerGalleryLink(gal5.scene, "https://avap-cmd.github.io/RefractProteinWebApp/");
      this.applyVideoTextureToObject(gal5.scene, resolvePublicPath("Assets/Protien Vis.mp4"));
    });
    const gal6Loader = new GLTFLoader();
    gal6Loader.load(resolvePublicPath("Assets/Gallery6.glb"), (gal6) => {
      this.add(gal6.scene);
      this.registerGalleryLink(gal6.scene, "https://www.youtube.com/watch?v=wSC3FplLdz0");
      this.applyVideoTextureToObject(gal6.scene, resolvePublicPath("Assets/ueenv.mp4"));
    });
    const gal7Loader = new GLTFLoader();
    gal7Loader.load(resolvePublicPath("Assets/Gallery7.glb"), (gal7) => {
      this.add(gal7.scene);
      this.applyVideoTextureToObject(gal7.scene, resolvePublicPath("Assets/arch.mp4"));
    });
    const gal8Loader = new GLTFLoader();
    gal8Loader.load(resolvePublicPath("Assets/Gallery8.glb"), (gal8) => {
      this.add(gal8.scene);
      this.registerGalleryLink(gal8.scene, "https://www.youtube.com/watch?v=NPFdrMhuLjk");
      this.applyVideoTextureToObject(gal8.scene, resolvePublicPath("Assets/jetpack.mp4"));
    });
    const dirLight = new DirectionalLight(16777215, 1);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    this.add(dirLight);
    const ambientLight = new AmbientLight(16777215, 0.4);
    this.add(ambientLight);
    scene.add(this);
    this.setupEnvironment();
  }
  applyVideoTextureToObject(object, url) {
    if (typeof document === "undefined") {
      console.warn("VideoTexture needs a DOM video element (main thread / offscreen: false).");
      return;
    }
    const video = document.createElement("video");
    video.src = url;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    const texture = new VideoTexture(video);
    texture.colorSpace = SRGBColorSpace;
    texture.flipY = false;
    texture.needsUpdate = true;
    this._orangeVideo = video;
    this._orangeVideoTexture = texture;
    const applyToMeshes = () => {
      object.traverse((child) => {
        if (!child.isMesh || !child.material) return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        child.material = materials.map((material) => {
          const next = material.clone();
          next.map = texture;
          next.color = new Color(16777215);
          if ("emissiveMap" in next) {
            next.emissiveMap = texture;
            next.emissive = new Color(16777215);
          }
          next.needsUpdate = true;
          return next;
        });
        if (child.material.length === 1) {
          child.material = child.material[0];
        }
      });
    };
    video.addEventListener("loadeddata", () => {
      applyToMeshes();
      texture.needsUpdate = true;
      video.play().catch(() => {
      });
    }, { once: true });
    video.load();
    if (video.readyState >= 2) {
      applyToMeshes();
      texture.needsUpdate = true;
      video.play().catch(() => {
      });
    }
  }
  setupEnvironment() {
    const environment = new RoomEnvironment();
    const pmremGenerator = new PMREMGenerator(store.gl);
    scene.environment = pmremGenerator.fromScene(environment).texture;
    scene.environmentIntensity = 0.5;
    pmremGenerator.dispose();
    scene.background = null;
  }
  createGradientBackground() {
    const canvas = typeof document !== "undefined" ? document.createElement("canvas") : new OffscreenCanvas(2, 512);
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "rgb(108, 0, 162)");
    gradient.addColorStop(1, "rgb(0, 17, 82)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }
  registerGalleryLink(root, url) {
    this._galleryLinks.set(root, url);
  }
  onClick() {
    if (typeof window === "undefined" || this._galleryLinks.size === 0) return;
    const { camera, pointer } = store;
    this._raycaster.setFromCamera(pointer, camera);
    const hits = this._raycaster.intersectObject(this, true);
    if (!hits.length) return;
    let obj = hits[0].object;
    while (obj) {
      const url = this._galleryLinks.get(obj);
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }
      obj = obj.parent;
    }
  }
  onRaf({ delta }) {
  }
  onResize() {
  }
  dispose() {
    super.dispose();
  }
}

// Configure font map: CSS font-family → TTF URL for Text.js 3D rendering
// Note: troika doesn't support woff2, must use TTF/OTF
DOMTextManager.fontMap = {
	'Geist Sans': resolvePublicPath( 'fonts/Geist-Variable.ttf' ),
	'Geist Mono': resolvePublicPath( 'fonts/GeistMono-Variable.ttf' )
};


class Site extends component( null, {
	raf: {
		renderPriority: Number.Infinity, // always render in last the loop
		fps: Number.Infinity, // no throttle to the render RAF
	},
} ) {

	init( { gl } ) {

		this.gl = gl;
		this.progressDamp = 0;

		debugInfo();
		store.gl = gl;

		// Initialize DOM text synchronization
		this.domTextManager = new DOMTextManager();

		const { camera } = store;

		if ( typeof window !== 'undefined' ) {

			camera.initOrbitControls( gl.domElement );

		} else {

			camera.initOrbitControls( virtualElement );

		}

		raf.start( gl );

	}

	onWorkerReady() {

		loader.load();

	}

	onInitDebug( { gui } ) {

		console.log( '🏗️ Debug mode is enabled' );

		const isOffscreen = typeof window === 'undefined';

		if ( ! isOffscreen ) {

			dispatcherSingleton.trigger(
				{ name: 'debug', fireAtStart: true },
				{
					gui,
				}
			);

		}

	}
	onRaf() {}
	onDebug() {}

	onLoadEnd() {

		// basic scene setup
		// const px = loader.resources.px.asset;
		// const nx = loader.resources.nx.asset;
		// const py = loader.resources.py.asset;
		// const ny = loader.resources.ny.asset;
		// const pz = loader.resources.pz.asset;
		// const nz = loader.resources.nz.asset;

		// const texture = new THREE.CubeTexture([px, nx, py, ny, pz, nz]);

		// [texture].map((t) => {
		//   t.type = THREE.HalfFloatType;
		//   t.colorSpace = THREE.LinearSRGBColorSpace;
		//   t.minFilter = THREE.LinearFilter;
		//   t.magFilter = THREE.LinearFilter;
		//   t.generateMipmaps = false;
		//   t.needsUpdate = true;
		// });
		// scene.environment = texture;
		// scene.environmentIntensity = 2;

		const dirLight = new DirectionalLight( 0xffffff, 1 );
		dirLight.castShadow = false;
		dirLight.position.set( 5, 100, 10 );
		dirLight.shadow.camera.near = 1;
		dirLight.shadow.camera.far = 40;
		dirLight.shadow.camera.right = 30;
		dirLight.shadow.camera.left = -30;
		dirLight.shadow.camera.top = 30;
		dirLight.shadow.camera.bottom = -30;
		dirLight.shadow.mapSize.width = 2048 * 2;
		dirLight.shadow.mapSize.height = 2048 * 2;
		dirLight.shadow.bias = -9e-3;
		scene.add( dirLight );



		// SPH Demo
		new Demo();

		// Wait for compilation to finish to start rendering
		compileScene( this.gl, scene ).then( () => {

			dispatcherSingleton.trigger( { name: 'compileEnd', fireAtStart: true } );

		} );

	}

}

export { Site as default };
