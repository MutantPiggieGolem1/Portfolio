import { ArcRotateCamera, Animation, Color3, CubeTexture, DefaultRenderingPipeline, DepthOfFieldEffectBlurLevel, MeshBuilder, PointLight, Quaternion, Scene, SineEase, StandardMaterial, Texture, VRDeviceOrientationArcRotateCamera, Vector3, VolumetricLightScatteringPostProcess, AbstractMesh, AnimationGroup, Axis, Mesh, Engine, VRCameraMetrics, AnimationEvent, VertexBuffer } from "@babylonjs/core";
import { isOnMobile } from "./app"

const BLOCKDIST = 1.1;
const moveMap = {"L": "0xx", "R": "2xx", "U": "x2x", "D": "x0x", "F": "xx0", "B": "xx2"}
const ROTSTEP = 1/32;

export function buildIntro(engine: Engine): Promise<Scene> {
    const scene = new Scene(engine);
    scene.disablePhysicsEngine()

    /* Camera Config */
    const camera = isOnMobile ?
        new VRDeviceOrientationArcRotateCamera("introcam", Math.PI*3/2, Math.PI*2/3, 10, Vector3.Zero(), scene) :
        new ArcRotateCamera("introcam", Math.PI*3/2, Math.PI*2/3, 10, Vector3.Zero(), scene);
    // camera.attachControl(scene, true)
    scene._inputManager.detachControl()
    camera.useAutoRotationBehavior = true
    camera.autoRotationBehavior!.idleRotationSpeed = 1.1
    const camBetaAnim = new Animation("introcambeta", "beta", 5, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE, true)
    const betaAnimEasing = new SineEase();
    betaAnimEasing.setEasingMode(SineEase.EASINGMODE_EASEINOUT)
    camBetaAnim.setEasingFunction(betaAnimEasing)
    camBetaAnim.setKeys([
        {frame: 0  , value: Math.PI*2/3},
        {frame: 100, value: Math.PI/3},
        {frame: 200, value: Math.PI*2/3},
    ])
    camera.animations.push(camBetaAnim)
    scene.beginAnimation(camera, 0, 200, true);
    /* -- */

    /* Pipeline Config */
    const pipeline = new DefaultRenderingPipeline("introPipeline", true, scene, [camera]);
    pipeline.depthOfFieldEnabled = true;
    pipeline.depthOfFieldBlurLevel = DepthOfFieldEffectBlurLevel.High;
    pipeline.depthOfField.focusDistance = 15000
    pipeline.depthOfField.focalLength = 150
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
    skyboxMaterial.disableLighting = true
    skybox.material = skyboxMaterial;
    /* -- */

    /* Light Config */
    const sunLight = new PointLight("sunLight", new Vector3(-2, 132.5, 500), scene)
    sunLight.specular = new Color3(1, 87/255, 51/255);
    const sunMesh = MeshBuilder.CreateSphere("sun", {diameter: 45}, scene);
    const sunMat = new StandardMaterial("sunMat", scene);
    sunMat.emissiveColor = sunLight.specular;
    sunMat.disableLighting = true
    const sunMatInvis = new StandardMaterial("sunMatInvis", scene);
    sunMatInvis.disableColorWrite = true;
    sunMesh.material = sunMat;
    sunMesh.setMaterialForRenderPass(camera.renderPassId, sunMatInvis);
    sunMesh.position = sunLight.position;
    sunMesh.freezeWorldMatrix()
    sunMesh.doNotSyncBoundingInfo = true
    const godrays = new VolumetricLightScatteringPostProcess('godrays', 1.0, camera, sunMesh, 100, Texture.BILINEAR_SAMPLINGMODE, undefined, true, scene)
    godrays.decay = 0.97
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
        box.rotationQuaternion = Quaternion.Identity()
        box.doNotSyncBoundingInfo = true
    }

    engine.runRenderLoop(() => {if (scene?.activeCamera) scene.render()});

    scene.freezeActiveMeshes()
    return new Promise(async resolve => {
        for (let i = 0; i < 15; i++) await performMove(["L", "R", "U", "D", "F", "B"][Math.floor(6 * Math.random())] as any, Math.random() < 0.5, scene)
        const camtransition = new Animation("camtransition", "position", 10, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT, true)
        camtransition.setKeys([
            {frame: 20, value: new Vector3(0, 0, 10)},
            {frame: 70, value: new Vector3(0, 0, BLOCKDIST+0.5)},
            {frame: 80, value: new Vector3(0, 0, 0)}
        ])
        camtransition.addEvent(new AnimationEvent(0, () => camera.setTarget(new Vector3())))
        const transitiongroup = new AnimationGroup("transition", scene)
        transitiongroup.addTargetedAnimation(camtransition, camera)
        // TODO: Figure out how to set up inner face culling
        for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 3; c++) {
            const mesh = scene.getMeshByName(`${a}${b}${c}`);
            if (!mesh) continue;
            const postransition = new Animation("postransition"+mesh.name, "position", 10, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT, true)
            postransition.setKeys([{frame: 30, value: mesh.position.scale(1/BLOCKDIST)}])
            transitiongroup.addTargetedAnimation(postransition, mesh)
        }
        scene.stopAllAnimations()
        camera.useAutoRotationBehavior = false
        transitiongroup.start()
        transitiongroup.onAnimationGroupEndObservable.add(() => resolve(scene))
    });
}

const animCache: {[key: string]: {rotation: Animation, position: Animation}} = {}
function performMove(move: keyof typeof moveMap, isClockwise: boolean, scene: Scene): Promise<void> {
    const meshes: AbstractMesh[] = []
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
        const mesh = scene.getMeshByName(moveMap[move].replace("x", a.toString()).replace("x", b.toString()));
        if (mesh) meshes.push(mesh)
    }
    const moveID = move+(isClockwise?"":"'")
    let animGroup = new AnimationGroup(moveID, scene)
    const pivotStr = moveMap[move].replaceAll("x", "1")
    const pivot = new Vector3(parseInt(pivotStr[0])-1, parseInt(pivotStr[1])-1, parseInt(pivotStr[2])-1)
    const axis = (move === "L" || move === "R" ? Axis.X : (move === "U" || move === "D" ? Axis.Y : (Axis.Z))).normalize()
    for (const mesh of meshes) { // FIXME: Animations snap to expected starting rotation
        const animID: string = mesh.name+moveID;
        if (!(animID in animCache)) {
            animCache[animID] = {
                position: new Animation(animID+"pos", "position", 8, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT, false),
                rotation: new Animation(animID+"rot", "rotationQuaternion", 8, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CONSTANT, false)
            }
            const posKeys = []
            const rotKeys = []
            for (let frame = 0; frame <= 0.5/ROTSTEP; frame+=8) {
                const angle = (isClockwise ? 1 : -1) * frame * ROTSTEP * Math.PI;
                const q = Quaternion.RotationAxis(axis, angle);	
                posKeys.push({frame, value: mesh.position
                    .subtract(pivot)
                    .applyRotationQuaternion(q)
                    .add(pivot)
                })
                rotKeys.push({frame, value: q})
            }
            animCache[animID].position.setKeys(posKeys)
            animCache[animID].rotation.setKeys(rotKeys)
        }
        animGroup.addTargetedAnimation(animCache[animID].position, mesh)
        animGroup.addTargetedAnimation(animCache[animID].rotation, mesh)
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