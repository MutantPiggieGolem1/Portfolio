import { Engine, MeshBuilder, Scene, UniversalCamera, Vector3 } from "@babylonjs/core"

export function buildScene(engine: Engine) {
    const scene = new Scene(engine)
    scene.physicsEnabled = true

    const camera = new UniversalCamera("camera", Vector3.Zero(), scene)
    camera.attachControl(scene, true)

    MeshBuilder.CreateGround("ground", {}, scene)

    engine.runRenderLoop(() => {if (scene?.activeCamera) scene.render()});
}