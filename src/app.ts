import { AbstractMesh, Animation, AnimationGroup, ArcRotateCamera, Color3, CubeTexture, Engine, MeshBuilder, MotionBlurPostProcess, PointLight, Scene, SineEase, StandardMaterial, Texture, Vector3, VolumetricLightScatteringPostProcess } from "@babylonjs/core";
const BLOCKDIST = 1.1;

class App {
    constructor() {
        /* Canvas Setup */
        document.body.style.width = document.body.style.height = "100%"
        document.body.style.padding = document.body.style.margin = "0"
        document.body.style.overflow = "hidden"
        const canvas = document.createElement("canvas");
        canvas.style.width = canvas.style.height = "100%";
        canvas.style.padding = canvas.style.margin = "0"
        canvas.style.overflow = "hidden"
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);
        /* -- */

        const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, disableWebGL2Support: false });
        const scene = new Scene(engine);

        /* Camera Config */
        // const camera = new UniversalCamera("testcam", Vector3.Zero(), scene);
        const camera = new ArcRotateCamera("introcam", 0, Math.PI/3, 10, Vector3.Zero(), scene);
        camera.inputs.clear();
        camera.useAutoRotationBehavior = true
        if (camera.autoRotationBehavior) {
            camera.autoRotationBehavior.idleRotationSpeed = 1.1
            camera.autoRotationBehavior.idleRotationWaitTime = 100
        }
        const camBetaAnim = new Animation("introcambeta", "beta", 5, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE, true)
        const betaAnimEasing = new SineEase();
        betaAnimEasing.setEasingMode(SineEase.EASINGMODE_EASEINOUT)
        camBetaAnim.setEasingFunction(betaAnimEasing)
        camBetaAnim.setKeys([
            {frame: 0  , value: Math.PI/3},
            {frame: 100, value: Math.PI*2/3},
            {frame: 200  , value: Math.PI/3},
        ])
        camera.animations.push(camBetaAnim)
        scene.beginAnimation(camera, 0, 200, true);
        const camblur = new MotionBlurPostProcess("introcamblur", scene, 1.0, camera);
        camblur.motionStrength = 0.4;
        camblur.motionBlurSamples = 16;
        /* -- */

        /* Skybox Config */
        const skybox = MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
        skybox.disableEdgesRendering()
        const skyboxMaterial = new StandardMaterial("skyBox", scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new CubeTexture("textures/sky", scene, ["_nx.png", "_ny.png", "_nz.png", "_px.png", "_py.png", "_pz.png"]);
        skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = skyboxMaterial.specularColor = Color3.Black();
        skybox.material = skyboxMaterial;
        /* -- */

        /* Light Config */
        const sun = new PointLight("sunLight", new Vector3(-2, 132.5, 500), scene)
        sun.specular = new Color3(1, 87/255, 51/255);
        const godrays = new VolumetricLightScatteringPostProcess('godrays', 1.0, camera, // FIXME: Godrays do not show up
            MeshBuilder.CreateSphere("sun", {diameter: 50}, scene), 
            50, Texture.BILINEAR_SAMPLINGMODE, engine, false
        )
        godrays.mesh.position = sun.position;
        /* -- */

        const cubeMaterial = new StandardMaterial("cubemat", scene)
        cubeMaterial.emissiveColor = new Color3(0.2, 0.2, 0.2);
        for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) for (let z = 0; z < 3; z++) {
            const box = MeshBuilder.CreateBox(""+x+y+z, {faceColors: [
                z === 2 ? new Color3(1, 0.5, 0) : Color3.Black(),
                z === 0 ? Color3.White() : Color3.Black(),
                x === 2 ? Color3.Green() : Color3.Black(),
                x === 0 ? Color3.Blue() : Color3.Black(),
                y === 2 ? Color3.Red() : Color3.Black(),
                y === 0 ? new Color3(1, 0.75, 0) : Color3.Black(),
            ] as any[]}, scene).enableEdgesRendering()
            box.position = new Vector3(x-1, y-1, z-1).scale(BLOCKDIST)
            box.material = cubeMaterial
        }

        // performMove("L", true, scene)

        scene.freezeActiveMeshes();

        // hide/show the Inspector
        window.addEventListener("keydown", ev => {
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key === 'i') // Shift+Ctrl+Alt+I
            scene.debugLayer.isVisible() ? scene.debugLayer.hide() : scene.debugLayer.show();
        });
        window.addEventListener("resize", () => engine.resize());
        engine.runRenderLoop(() => {if (scene?.activeCamera) scene.render()});
    }
}
// enum Moves {"L" = "0xx", "R" = "2xx", "U" = "x2x", "D" = "x0x"}
// const rotateAnimCache: {[key: string]: Animation} = {}
// function performMove(move: keyof typeof Moves, isClockwise: boolean, scene: Scene) {
//     const meshes: AbstractMesh[] = []
//     for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
//         const mesh = scene.getMeshByName(Moves[move].replace("x", a.toString()).replace("x", b.toString()));
//         if (mesh) meshes.push(mesh)
//     }
//     const animGroup = new AnimationGroup(move+isClockwise?"t":"f", scene)
//     for (const mesh of meshes) {
//         const animID = mesh.name+isClockwise?"t":"f";
//         if (!(animID in rotateAnimCache)) {
//             rotateAnimCache[animID] = new Animation(animID, "position", 5, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT, false)
//             const animKeys = []
//             const step = Math.PI/200
//             for (let frame = 0; frame * step < Math.PI/2; frame+=5) animKeys.push({
//                 frame: frame, value: new Vector3().scale(BLOCKDIST)
//             })
//             rotateAnimCache[animID].setKeys()
//         }
//         animGroup.addTargetedAnimation(rotateAnimCache[animID], mesh)
//     }
//     animGroup.play()
//     animGroup.onAnimationGroupEndObservable.add((animGroup) => {
//         for (const tAnim of animGroup.children) {
//             tAnim.target.name = t
//         }
//     })
// }
new App();