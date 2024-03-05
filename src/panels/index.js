import Vue from "vue";
import { SpinalForgeExtention } from "spinal-env-viewer-panel-manager-service_spinalforgeextention";
import { ConfigPanel } from "../js/constants";
import ConfigPanelVue from "./components/config.vue";


const panels = [
    {
        name: ConfigPanel,
        vueMountComponent: Vue.extend(ConfigPanelVue),
        panel: {
            title: "Calcul offset", 
            closeBehaviour: "hide",
        },
        style: {
            minWidth: "660px",
            height: "475px",
            left: "400px",
        },
    },
];


for (const element of panels) {
  const panelExtension = SpinalForgeExtention.createExtention(element);
  SpinalForgeExtention.registerExtention(element.name, panelExtension);
}