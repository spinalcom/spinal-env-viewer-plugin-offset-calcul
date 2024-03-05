import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { ConfigPanel, SIDEBAR, SCENE_CONTEXT, sceneType } from "../js/constants";
 import { spinalPanelManagerService } from "spinal-env-viewer-panel-manager-service";
  
class GenerateOffsetBtn extends SpinalContextApp {
    constructor() {
        super("Generate Offset", "This button generates an offset", {
            icon: "add",
            icon_type: "in",
            backgroundColor: "#FF0000",
            fontColor: "#FFFFFF"
        });
    }

    async isShown(option) {
        const { context, selectedNode } = option;
        
        const contextName = context.name.get();
        if (contextName !== SCENE_CONTEXT) return -1;
        if(context.id.get() === selectedNode.id.get() ) return true;
        if (selectedNode.type.get() === sceneType) return true;
        
        return -1

    }


    action(option) {
        spinalPanelManagerService.openPanel(ConfigPanel, option);
    }
}


const generateOffsetBtn = new GenerateOffsetBtn();
spinalContextMenuService.registerApp(SIDEBAR, generateOffsetBtn, [3]);

export default generateOffsetBtn;