import { Animation, AnimationGroup, Engine, MeshBuilder, Scene, SceneLoader, SineEase, UniversalCamera, Vector3 } from "@babylonjs/core"
import { SkyMaterial } from "@babylonjs/materials"
import "@babylonjs/loaders/glTF"

export function buildScene(engine: Engine) {
    const scene = new Scene(engine)
    scene.collisionsEnabled = true
    scene.enablePhysics()

    SceneLoader.Append("", "bioworld.glb", scene)
    console.log(scene.meshes.map(m => `Name: ${m.name} | ID: ${m.id}`).join("\n"))

    const camera = new UniversalCamera("camera", new Vector3(0, 2, 0), scene)
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
    camera.checkCollisions = true;
    camera.applyGravity = true;

    const skybox = MeshBuilder.CreateBox("skyBox", { size: 1000.0, updatable: false }, scene);
    skybox.disableEdgesRendering()
    const skyboxMaterial = new SkyMaterial("sky", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.rayleigh = 3
    skyboxMaterial.turbidity = 3
    skyboxMaterial.useSunPosition = false
    const sunAzi = new Animation("timeazim", "azimuth", 1, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE, true)
    sunAzi.setKeys([{frame: 0, value: 90/360}, {frame: 30, value: 180/360}, {frame: 60, value: 270/360}])
    const sunAziEase = new SineEase()
    sunAziEase.setEasingMode(SineEase.EASINGMODE_EASEINOUT)
    sunAzi.setEasingFunction(sunAziEase)
    const sunIncl = new Animation("timeincl", "inclination", 1, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE, true)
    sunIncl.setKeys([{frame: 0, value: 0}, {frame: 30, value: 0.5}, {frame: 60, value: 0}])
    const sunAnim = new AnimationGroup("sunAnim", scene)
    sunAnim.addTargetedAnimation(sunAzi, skyboxMaterial)
    sunAnim.addTargetedAnimation(sunIncl, skyboxMaterial)
    sunAnim.start(true)
    skybox.material = skyboxMaterial;

    const ground = MeshBuilder.CreateGround("ground", {width: 1000, height: 1000}, scene)
    ground.checkCollisions = true


    engine.runRenderLoop(scene.render);
}