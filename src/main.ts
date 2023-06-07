import { Animation, AnimationGroup, Color3, Engine, MeshBuilder, Scene, SineEase, StandardMaterial, UniversalCamera, VRDeviceOrientationFreeCamera, Vector3 } from "@babylonjs/core"
import { SkyMaterial } from "@babylonjs/materials"

export function buildScene(engine: Engine) {
    const scene = new Scene(engine)
    scene.physicsEnabled = true
    scene.collisionsEnabled = true

    const camera = new UniversalCamera("camera", new Vector3(0, 2, 0), scene)
    camera.attachControl(engine.getRenderingCanvas(), true);
    camera.keysUpward  = [32]; // Space
    camera.keysDownward= [16]; // Shift
    camera.keysUp      = [87]; // w
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
    const sunAzi = new Animation("time", "azimuth", 1, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE, true)
    sunAzi.setKeys([{frame: 0, value: 0}, {frame: 60, value: 0.5}])
    // const sunAziEase = new SineEase()
    // sunAziEase.setEasingMode(SineEase.EASINGMODE_EASEINOUT)
    // sunAzi.setEasingFunction(sunAziEase)
    const sunIncl = new Animation("time", "inclination", 1, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE, true)
    sunIncl.setKeys([{frame: 0, value: -0.5}, {frame: 60, value: 0.5}])
    const sunAnim = new AnimationGroup("sunAnim", scene)
    sunAnim.addTargetedAnimation(sunAzi, skyboxMaterial)
    sunAnim.addTargetedAnimation(sunIncl, skyboxMaterial)
    sunAnim.start(true)
    skybox.material = skyboxMaterial;

    const ground = MeshBuilder.CreateGround("ground", {width: 1000, height: 1000}, scene)
    ground.checkCollisions = true

    const columnRadius = 24
    const columnHeight = 16
    const columnMat = new StandardMaterial("columnMat", scene)
    columnMat.diffuseColor = Color3.Gray()
    for (let i = 0; i < 8; i++) {
        const angle = (i/4) * Math.PI
        const mesh = MeshBuilder.CreateCylinder("pillar", {diameter: 4, height: columnHeight}, scene);
        mesh.position = new Vector3(columnRadius*Math.cos(angle), columnHeight/2, columnRadius*Math.sin(angle))
        mesh.checkCollisions = true
    }

    engine.runRenderLoop(() => {if (scene?.activeCamera) scene.render()});
}