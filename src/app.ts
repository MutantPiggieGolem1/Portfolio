import { AbstractMesh, Animation, AnimationGroup, ArcRotateCamera, Axis, Color3, CubeTexture, Database, DefaultRenderingPipeline, DepthOfFieldEffectBlurLevel, Engine, Mesh, MeshBuilder, MotionBlurPostProcess, PointLight, Quaternion, Scene, SineEase, StandardMaterial, Texture, UniversalCamera, VRDeviceOrientationArcRotateCamera, Vector3, VolumetricLightScatteringPostProcess } from "@babylonjs/core";
const BLOCKDIST = 1.1;
const moveMap = {"L": "0xx", "R": "2xx", "U": "x2x", "D": "x0x", "F": "xx0", "B": "xx2"}
const ROTSTEP = Math.PI/32;

class App {
    public isOnMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    constructor() {
        Database.IDBStorageEnabled = true;
        const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
        if (!canvas) throw "No canvas found."

        const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, disableWebGL2Support: false, xrCompatible: true });
        const scene = new Scene(engine);
        
        /* Camera Config */
        const camera = this.isOnMobile ?
            new VRDeviceOrientationArcRotateCamera("introcam", 0, Math.PI/3, 10, Vector3.Zero(), scene) :
            new ArcRotateCamera("introcam", 0, Math.PI/3, 10, Vector3.Zero(), scene);
        // camera.attachControl(scene, true)
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
            {frame: 200, value: Math.PI/3},
        ])
        camera.animations.push(camBetaAnim)
        scene.beginAnimation(camera, 0, 200, true);
        /* -- */

        /* Pipeline Config */
        const pipeline = new DefaultRenderingPipeline("introPipeline", true, scene, [camera]);
        pipeline.depthOfFieldEnabled = true;
        pipeline.depthOfFieldBlurLevel = DepthOfFieldEffectBlurLevel.High;
        pipeline.depthOfField.focusDistance = 20000
        pipeline.depthOfField.focalLength = 100
        pipeline.bloomEnabled = true;
        pipeline.bloomThreshold = 1;
        pipeline.bloomWeight = 0.25;
        /* -- */

        /* Skybox Config */
        const skybox = MeshBuilder.CreateBox("skyBox", { size: 1000.0, updatable: false }, scene);
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
        // const godrays = new VolumetricLightScatteringPostProcess('godrays', 1.0, camera, MeshBuilder.CreateSphere("sun", {diameter: 50}, scene), 100, Texture.BILINEAR_SAMPLINGMODE, engine, true)
        // godrays.mesh.position = sun.position; FIXME Godrays dont work
        /* -- */

        const cubeMaterial = new StandardMaterial("cubemat", scene)
        cubeMaterial.emissiveColor = new Color3(0.2, 0.2, 0.2);
        for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) for (let z = 0; z < 3; z++) {
            const box = MeshBuilder.CreateBox(""+x+y+z, {updatable: false, faceColors: [
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

        // hide/show the Inspector
        window.addEventListener("keydown", ev => {
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key.toLowerCase() === 'i') { // Shift+Ctrl+Alt+I
                if (scene.debugLayer.isVisible()) scene.debugLayer.hide()
                else scene.debugLayer.show();
            }
        });
        window.addEventListener("resize", () => engine.resize());
        engine.runRenderLoop(() => {if (scene?.activeCamera) scene.render()});

        (async () => {
            for (let i = 0; i < 100; i++) await this.performMove(["L", "R", "U", "D", "F", "B"][Math.floor(6 * Math.random())] as any, Math.random() < 0.5, scene)
            scene.freezeActiveMeshes()
        })();
    }

    private animCache: {[key: string]: {rotation: Animation, position: Animation}} = {}
    private performMove(move: keyof typeof moveMap, isClockwise: boolean, scene: Scene): Promise<void> {
        const meshes: AbstractMesh[] = []
        for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
            const mesh = scene.getMeshByName(moveMap[move].replace("x", a.toString()).replace("x", b.toString()));
            if (mesh) meshes.push(mesh)
        }
        const moveID = move+(isClockwise?"":"'")
        const animGroup = new AnimationGroup(moveID, scene)
        const pivotStr = moveMap[move].replaceAll("x", "1")
        const pivot = new Vector3(parseInt(pivotStr[0])-1, parseInt(pivotStr[1])-1, parseInt(pivotStr[2])-1)
        const axis = (move === "L" || move === "R" ? Axis.X : (move === "U" || move === "D" ? Axis.Y : (Axis.Z))).normalize()
        for (const mesh of meshes) {
            const animID: string = mesh.name+moveID;
            if (!(animID in this.animCache)) {
                this.animCache[animID] = {
                    position: new Animation(animID, "position", 8, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT, false),
                    rotation: new Animation(animID, "rotationQuaternion", 8, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CONSTANT, false)
                };
                const posKeys = []
                const rotKeys = []
                let rq = Quaternion.RotationYawPitchRoll(mesh.rotation.y, mesh.rotation.x, mesh.rotation.z); // FIXME: Rotations assume cubes are normal to location
                for (let frame = 0; frame * ROTSTEP <= Math.PI/2; frame+=8) {
                    const angle = (isClockwise ? 1 : -1) * frame * ROTSTEP;
                    var _p = new Quaternion(mesh.position.x - pivot.x, mesh.position.y - pivot.y, mesh.position.z - pivot.z, 0);
                    var _q = Quaternion.RotationAxis(axis, angle);	
                    var _pdash = _q.multiply(_p).multiply(_q.invert());
                    posKeys.push({frame, value: new Vector3(pivot.x + _pdash.x, pivot.y + _pdash.y, pivot.z + _pdash.z)})
                    rotKeys.push({frame, value: rq.multiply(_q)})
                }
                this.animCache[animID].position.setKeys(posKeys)
                this.animCache[animID].rotation.setKeys(rotKeys)
            }
            animGroup.addTargetedAnimation(this.animCache[animID].position, mesh)
            animGroup.addTargetedAnimation(this.animCache[animID].rotation, mesh)
        }
        animGroup.play()
        return new Promise<AnimationGroup>((resolve, _) => animGroup.onAnimationGroupEndObservable.add((animGroup, _) => resolve(animGroup))).then((animGroup) => {
            for (const tAnim of animGroup.children) {
                const mesh: Mesh = tAnim.target;
                const scalePos = mesh.position.scale(1/BLOCKDIST);
                const roundPos = new Vector3(Math.round(scalePos.x), Math.round(scalePos.y), Math.round(scalePos.z))
                mesh.position = roundPos.scale(BLOCKDIST); // snap to grid
                mesh.name = ""+(roundPos.x+1)+(roundPos.y+1)+(roundPos.z+1)
            }
        }).then()
    }
}
new App();