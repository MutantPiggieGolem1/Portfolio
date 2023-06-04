import { Database, Engine } from "@babylonjs/core";
import { buildIntro } from "./intro";
import { buildScene } from "./main";

export const isOnMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

class App {
    constructor() {
        Database.IDBStorageEnabled = true;
        const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
        if (!canvas) throw "No canvas found."

        const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, disableWebGL2Support: false, xrCompatible: true });
        if (!isOnMobile) window.addEventListener("resize", () => engine.resize());

        this.start(engine);
    }

    private async start(engine: Engine) {
        const introScene = await buildIntro(engine)
        introScene.cameras[0].dispose()
        engine.stopRenderLoop()
        const scene = buildScene(engine)
    }
}
new App();