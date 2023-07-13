import { Animation, AnimationGroup, Engine, HavokPlugin, MeshBuilder, PhysicsAggregate, PhysicsShapeType, Scene, SceneLoader, SineEase, UniversalCamera, Vector3 } from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";
import { SkyMaterial } from "@babylonjs/materials";
// import { Inspector } from '@babylonjs/inspector';

//@ts-ignore
globalThis.HK = await HavokPhysics(); 

export function buildScene(engine: Engine) {
    const scene = new Scene(engine)
    const physicsPlugin = new HavokPlugin();
    scene.enablePhysics(undefined, physicsPlugin)
    // Inspector.Show(scene, {"enableClose": true})

    SceneLoader.AppendAsync("", "bioworld.babylon", scene)
    .then(() => {
        // const dome = scene.getMeshByName("Dome")!

        const pillars = scene.getMeshByName("Pillars")!
        new PhysicsAggregate(pillars, PhysicsShapeType.CYLINDER, {mass: 375000}, scene)
    })

    const camera = new UniversalCamera("camera", new Vector3(0, 40, 0), scene)
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

    const skybox = MeshBuilder.CreateBox("skyBox", { size: 1000.0, updatable: false }, scene);
    skybox.disableEdgesRendering()
    const skyboxMaterial = new SkyMaterial("sky", scene);
    skyboxMaterial.disableDepthWrite = true;
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.luminance = 0.4
    skyboxMaterial.rayleigh = 3
    skyboxMaterial.turbidity = 3
    skyboxMaterial.useSunPosition = false
    const sunAzi = new Animation("timeazim", "azimuth", 1, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE, true)
    sunAzi.setKeys([{frame: 0, value: 90/360}, {frame: 30, value: 180/360}, {frame: 60, value: 270/360}, {frame: 90, value: 1}])
    const sunAziEase = new SineEase()
    sunAziEase.setEasingMode(SineEase.EASINGMODE_EASEINOUT)
    sunAzi.setEasingFunction(sunAziEase)
    const sunIncl = new Animation("timeincl", "inclination", 1, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE, true)
    sunIncl.setKeys([{frame: 0, value: 0}, {frame: 30, value: 0.5}, {frame: 60, value: 0}, {frame: 90, value: 0}])
    const sunAnim = new AnimationGroup("sunAnim", scene)
    sunAnim.addTargetedAnimation(sunAzi, skyboxMaterial)
    sunAnim.addTargetedAnimation(sunIncl, skyboxMaterial)
    sunAnim.start(true)
    skybox.material = skyboxMaterial;

    const ground = MeshBuilder.CreateGround("ground", {width: 1000, height: 1000}, scene)
    new PhysicsAggregate(ground, PhysicsShapeType.MESH, {mass: 0}, scene)

    engine.runRenderLoop(() => scene.render());
}