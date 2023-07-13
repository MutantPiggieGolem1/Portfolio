import { AbstractMesh, Animation, AnimationEvent, AnimationGroup, ArcRotateCamera, Axis, BackEase, Color3, CubeTexture, DefaultRenderingPipeline, DepthOfFieldEffectBlurLevel, Engine, Mesh, MeshBuilder, PointLight, Quaternion, Scene, SineEase, Space, StandardMaterial, Texture, VRDeviceOrientationArcRotateCamera, Vector3, VertexBuffer, VolumetricLightScatteringPostProcess } from "@babylonjs/core";
// import VerdanaBold from "./Verdana_Bold.json";
// import earcut from "earcut"

const BLOCKDIST = 1.1;
const moveMap = {"L": "0xx", "R": "2xx", "U": "x2x", "D": "x0x", "F": "xx0", "B": "xx2"}
const ROTSTEP = 1/48;

export function buildIntro(engine: Engine): Promise<Scene> {
    const scene = new Scene(engine);
    scene.disablePhysicsEngine()

    /* Camera Config */
    const camera = new ArcRotateCamera("introcam", Math.PI*3/2, Math.PI*2/3, 10, Vector3.Zero(), scene);
    camera.inputs.clear()
    camera.inputs.addVRDeviceOrientation()
    camera.useAutoRotationBehavior = true
    camera.autoRotationBehavior!.idleRotationSpeed = 1.1
    camera.autoRotationBehavior!.idleRotationWaitTime = 250
    camera.autoRotationBehavior!.idleRotationSpinupTime = 1000
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

    // const text = "compewper"
    const cubeMaterial = new StandardMaterial("cubemat", scene)
    cubeMaterial.emissiveColor = new Color3(0.2, 0.2, 0.2);
    for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) for (let z = 0; z < 3; z++) {
        let box = MeshBuilder.CreateBox(""+x+y+z, {updatable: false, faceColors: [
            z === 2 ? Color3.Red() : Color3.Black(),
            z === 0 ? new Color3(1, 0.5, 0) : Color3.Black(),
            x === 2 ? Color3.Green() : Color3.Black(),
            x === 0 ? Color3.Blue() : Color3.Black(),
            y === 2 ? Color3.White() : Color3.Black(),
            y === 0 ? new Color3(1, 0.75, 0) : Color3.Black(),
        ] as any[]}, scene)
        box.position = new Vector3(x-1, y-1, z-1).scale(BLOCKDIST)
        // if (z === 2) {
        //     const letter = MeshBuilder.CreateText("letter_"+x+","+y, text[(2-x)+(2-y)*3], VerdanaBold, {depth: 0.1, size: 0.9}, scene, earcut)!
        //     letter.rotation = new Vector3(0, -Math.PI, 0)
        //     letter.position = box.position.add(new Vector3(0, -0.2, 0.2))
        //     box = Mesh.MergeMeshes([box, letter], true)!
        // }
        box.enableEdgesRendering()
        box.material = cubeMaterial
        box.rotationQuaternion = Quaternion.Identity()
        box.doNotSyncBoundingInfo = true
    }

    engine.runRenderLoop(() => {if (scene?.activeCamera) scene.render()});

    scene.freezeActiveMeshes()
    return new Promise(async resolve => {
        for (let m of "L'R'UDFBL'R'".matchAll(/(\w)('?)(?=\w|$)/gi)) await performMove(m[1] as any, m[2] === "'", scene)
        const transitiongroup = new AnimationGroup("transition", scene)
        const camtransition = new Animation("camtransition", "position", 10, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT, true)
        camtransition.setKeys([
            {frame: 20, value: new Vector3(0, 0, 10)},
            {frame: 70, value: new Vector3(0, 0, BLOCKDIST+0.5)},
            {frame: 80, value: new Vector3(0, 0, 0)}
        ])
        camtransition.addEvent(new AnimationEvent(0, () => camera.setTarget(new Vector3())))
        camtransition.addEvent(new AnimationEvent(70,() => resolve(scene)))
        camtransition.setEasingFunction(new BackEase())
        transitiongroup.addTargetedAnimation(camtransition, camera)
        for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 3; c++) {
            const mesh = scene.getMeshByName(`${a}${b}${c}`);
            if (!mesh) continue;
            const postransition = new Animation("postransition"+mesh.name, "position", 10, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT, true)
            postransition.setKeys([{frame: 0, value: mesh.position}, {frame: 30, value: mesh.position.scale(1/BLOCKDIST)}])
            postransition.addEvent(new AnimationEvent(30, () => {
                const vertices = mesh.getVerticesData(VertexBuffer.ColorKind)!;
                for (let i = 0; i < vertices.length; i+=4) if (vertices.slice(i, i+3).every(a => a === 0)) vertices[i+3] = 0;
                mesh.setVerticesData(VertexBuffer.ColorKind, vertices)
            }))
            transitiongroup.addTargetedAnimation(postransition, mesh)
        }
        scene.stopAllAnimations()
        camera.useAutoRotationBehavior = false
        transitiongroup.start()
    });
}

const animCache: {[key: string]: Animation} = {}
function performMove(move: keyof typeof moveMap, isClockwise: boolean, scene: Scene): Promise<void> {
    const meshes: AbstractMesh[] = []
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
        const mesh = scene.getMeshByName(moveMap[move].replace("x", a.toString()).replace("x", b.toString()));
        if (mesh) meshes.push(mesh)
    }
    const moveID = move+(isClockwise?"":"'")
    let animGroup = new AnimationGroup(moveID, scene)
    const pivotStr = moveMap[move].replaceAll("x", "1")
    const pivot = new Vector3(parseInt(pivotStr[0])-1, parseInt(pivotStr[1])-1, parseInt(pivotStr[2])-1).scale(BLOCKDIST)
    const axis = (move === "L" || move === "R" ? Axis.X : (move === "U" || move === "D" ? Axis.Y : (Axis.Z))).normalize()
    for (const mesh of meshes) {
        const animID: string = mesh.name+moveID;
        if (!(animID in animCache)) {
            animCache[animID] = new Animation(animID+"rot", "rotationQuaternion", 8, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CONSTANT, false)
            const rotKeys = []
            for (let frame = 0; frame <= 0.5/ROTSTEP; frame+=8) {
                const angle = (isClockwise ? 1 : -1) * frame * ROTSTEP * Math.PI;
                rotKeys.push({frame, value: Quaternion.RotationAxis(axis, angle)})
            }
            animCache[animID].setKeys(rotKeys)
        }
        mesh.setPivotPoint(pivot, Space.WORLD);
        animGroup.addTargetedAnimation(animCache[animID], mesh)
    }
    animGroup.play()
    return new Promise<AnimationGroup>((resolve, _) => animGroup.onAnimationGroupEndObservable.add((animGroup, _) => resolve(animGroup))).then((animGroup) => {
        for (const tAnim of animGroup.children) {
            const mesh: Mesh = tAnim.target;

            const finalWorldPos = new Vector3();
            mesh.getWorldMatrix().decompose(undefined, undefined, finalWorldPos);

            // Bake the rotation
            mesh.setPivotPoint(Vector3.Zero(), Space.LOCAL);
            mesh.position.setAll(0);
            mesh.bakeCurrentTransformIntoVertices()

            // Reset the position
            mesh.position.copyFrom(finalWorldPos);
            mesh.computeWorldMatrix(true);

            // Rename
            const scalePos = mesh.position.scale(1/BLOCKDIST);
            const roundPos = new Vector3(Math.round(scalePos.x), Math.round(scalePos.y), Math.round(scalePos.z))
            mesh.position = roundPos.scale(BLOCKDIST); // snap to grid
            mesh.name = ""+(roundPos.x+1)+(roundPos.y+1)+(roundPos.z+1)
        }
    }).then()
}