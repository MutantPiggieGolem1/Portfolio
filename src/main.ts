import { Animation, AnimationGroup, DefaultRenderingPipeline, DirectionalLight, Engine, MeshBuilder, SSRRenderingPipeline, Scene, SceneLoader, UniversalCamera, Vector3 } from "@babylonjs/core";
import { SkyMaterial } from "@babylonjs/materials";
// import { Inspector } from '@babylonjs/inspector';

export async function buildScene(engine: Engine) {
    const scene = new Scene(engine)
    await SceneLoader.AppendAsync("", "bioworld.babylon", scene)
    // Inspector.Show(scene, {})
    const camera = setupCamera(scene);

    const pipeline = new DefaultRenderingPipeline("pipeline", true, scene, [camera]);
    pipeline.samples = 6
    pipeline.bloomEnabled = true
    pipeline.depthOfFieldEnabled = true
    pipeline.depthOfField.focalLength = 30*1000
    pipeline.depthOfField.focusDistance = 12*1000
    pipeline.depthOfField.fStop = 10

    // const ssr = new SSRRenderingPipeline("ssr", scene, [camera], false);
    // ssr.

    const sun = scene.getNodeByName("Sun") as DirectionalLight

    const skybox = MeshBuilder.CreateBox("skyBox", { size: 300.0, updatable: false }, scene);
    skybox.disableEdgesRendering()
    skybox.isPickable = false
    skybox.infiniteDistance = true
    const skyboxMaterial = new SkyMaterial("sky", scene);
    skyboxMaterial.disableDepthWrite = true;
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.luminance = 0.9
    skyboxMaterial.rayleigh = 3
    skyboxMaterial.turbidity = 3
    skyboxMaterial.azimuth = 0.7
    skyboxMaterial.useSunPosition = false
    const skyAnim = new AnimationGroup("skyAni", scene);
    const inclAnim = new Animation("skyIncl", "inclination", 2, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
    inclAnim.setKeys([{frame: 0, value: -0.5}, {frame: 60, value: 0.5}, {frame: 120, value: 1.5}]);
    skyAnim.addTargetedAnimation(inclAnim, skyboxMaterial);
    skyAnim.start(true);
    scene.registerBeforeRender(() => sun.direction = skyboxMaterial.sunPosition.scale(-1))
    skybox.material = skyboxMaterial;

    engine.runRenderLoop(() => scene.render());
}

function setupCamera(scene: Scene) {
    const camera = scene.getNodeByName("Camera") as UniversalCamera;
    camera.attachControl(null, true);
    camera.keysUpward  = [32]; // Space
    camera.keysDownward= [16]; // Shift
    camera.keysUp      = [87]; // W
    camera.keysDown    = [83]; // S
    camera.keysLeft    = [65]; // A
    camera.keysRight   = [68]; // D
    camera.speed = 0.5

    let isLocked = false;
    scene.onPointerDown = () => {
        if (isLocked) return
        const canvas = scene.getEngine().getRenderingCanvas()!;
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.msRequestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
        if (canvas.requestPointerLock) canvas.requestPointerLock();
    }
    function onPointerLockChange() {
        //@ts-ignore
        isLocked = document.mozPointerLockElement || document.webkitPointerLockElement || document.msPointerLockElement || document.pointerLockElement || null;
    }
    document.addEventListener("pointerlockchange", onPointerLockChange, false);
    document.addEventListener("mspointerlockchange", onPointerLockChange, false);
    document.addEventListener("mozpointerlockchange", onPointerLockChange, false);
    document.addEventListener("webkitpointerlockchange", onPointerLockChange, false);
    return camera;
}