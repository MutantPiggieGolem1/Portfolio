import { Animation, AnimationGroup, Engine, MeshBuilder, Scene, SceneLoader, SineEase, UniversalCamera, Vector3 } from "@babylonjs/core";
import { SkyMaterial } from "@babylonjs/materials";
import { Inspector } from '@babylonjs/inspector';

export function buildScene(engine: Engine) {
    const scene = new Scene(engine)
    scene.disablePhysicsEngine()
    scene.gravity = new Vector3(0, 9.8/60, 0);
    scene.collisionsEnabled = true
    Inspector.Show(scene, {"enableClose": true})

    SceneLoader.AppendAsync("", "bioworld.babylon", scene).then(() => {
        const dome = scene.getMeshByName("Dome")!
        dome.checkCollisions = true

        const pillars = scene.getMeshByName("Pillars")!
        pillars.checkCollisions = true
    })

    const camera = new UniversalCamera("camera", new Vector3(0, 5, 0), scene)
    camera.attachControl(engine.getRenderingCanvas(), true);
    camera.inputs.addMouse(true)
    camera.inputs.addDeviceOrientation()
    camera.keysUpward  = [32]; // Space
    camera.keysDownward= [16]; // Shift
    camera.keysUp      = [87]; // W
    camera.keysDown    = [83]; // S
    camera.keysLeft    = [65]; // A
    camera.keysRight   = [68]; // D
    camera.speed = 0.5

    //Mouse Pointer Lock
    let isLocked = false;
    scene.onPointerDown = () => {
        if (isLocked) return
        let canvas = engine.getRenderingCanvas()!;
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

    camera.ellipsoid = new Vector3(0.7, 2, 0.7);
    camera.checkCollisions = true
    camera.applyGravity = true
    camera.needMoveForGravity = true

    const skybox = MeshBuilder.CreateBox("skyBox", { size: 1000.0, updatable: false }, scene);
    skybox.disableEdgesRendering()
    const skyboxMaterial = new SkyMaterial("sky", scene);
    skyboxMaterial.disableDepthWrite = true;
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.luminance = 0.9
    skyboxMaterial.rayleigh = 3
    skyboxMaterial.turbidity = 3
    skyboxMaterial.useSunPosition = false
    const sunAzi = new Animation("timeazim", "azimuth", 1, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE, true)
    sunAzi.setKeys([{frame: 0, value: 90/360}, {frame: 30, value: 180/360}, {frame: 60, value: 270/360}, {frame: 90, value: 1}])
    const sunAziEase = new SineEase()
    sunAziEase.setEasingMode(SineEase.EASINGMODE_EASEINOUT)
    sunAzi.setEasingFunction(sunAziEase)
    const sunIncl = new Animation("timeincl", "inclination", 1, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE, true)
    sunIncl.setKeys([{frame: 0, value: 0}, {frame: 30, value: 0.5}, {frame: 60, value: 0}, {frame: 90, value: -0.5}])
    const sunAnim = new AnimationGroup("sunAnim", scene)
    sunAnim.addTargetedAnimation(sunAzi, skyboxMaterial)
    sunAnim.addTargetedAnimation(sunIncl, skyboxMaterial)
    sunAnim.start(true)
    skybox.material = skyboxMaterial;

    const ground = MeshBuilder.CreateGround("ground", {width: 1000, height: 1000}, scene)
    ground.checkCollisions = true

    engine.runRenderLoop(() => scene.render());
}