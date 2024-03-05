<template>
  <div class="config_container">
    
    <md-list>
        <md-list-item md-expand 
            v-for="scene in tree" 
            :key="scene.id" @click.stop="() => calculateOffset(scene)">

            <md-icon>apartment</md-icon>
            <span class="md-list-item-text">
                {{scene.name}}
            </span>

            <md-list slot="md-expand" class="md-double-line">
                <md-list-item 
                        v-for="rvt in scene.children" :key="rvt.id" >
                     <div class="md-list-item-text">
                        <span>{{rvt.name}}</span>
                        <span>actual offsetValue : {{"-"}}</span>
                    </div>

                    <md-button class="md-icon-button md-list-action" @click.stop="() => calculateOffset(scene,rvt.node)">
                        <md-icon>sync</md-icon>
                    </md-button>
                </md-list-item>
            </md-list>

            <md-button class="md-icon-button md-list-action">
                <md-icon>sync</md-icon>
            </md-button>
        </md-list-item>
    </md-list>

    <!-- <md-list class="md-double-line">
      <md-subheader>Calculate offset</md-subheader>

      <md-list-item v-for="rvt in rvtNodes" :key="rvt.id" @click="() => calculateOffset(rvt)">
        <md-icon class="md-primary">apartment</md-icon>

        <div class="md-list-item-text">
          <span>{{rvt.name}}</span>
          <span>actual offsetValue : {{rvt.offset || "-"}}</span>
        </div>

        <md-button class="md-icon-button md-list-action">
          <md-icon>add</md-icon>
        </md-button>
      </md-list-item>
    </md-list> -->
    
  </div>
</template>


<script>
import { ConfigPanel, sceneType } from "../../js/constants";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { serviceDocumentation } from "spinal-env-viewer-plugin-documentation-service";

export default {
    name: ConfigPanel,
    data() {
        return {
            selectedNode: null,
            context: null,
            tree: [],
        }
    },
    methods: {
        async opened(option) {
            
            this.context = option.context;
            this.selectedNode = option.selectedNode;

            this.tree = await this.getTree(this.selectedNode, this.context);
            
        },

        closed() { },

        async getTree(selectedNode, context) {
            if (selectedNode.type.get() === sceneType) {
                const children = await this.getRvtNodes(selectedNode.id.get(), context.id.get(), true);
                return [this._formatNodeAsTree(selectedNode, children)];
            }

            if(selectedNode.id.get() === context.id.get()) {
                const scenes = await SpinalGraphService.getChildrenInContext(selectedNode.id.get(), context.id.get());
                const promises = scenes.map(async scene => {
                    const children = await this.getRvtNodes(scene.id.get(), context.id.get(), true);
                    return this._formatNodeAsTree(scene, children);
                });

                return Promise.all(promises);
            }

            return [];
        },

        getRvtNodes(nodeId, contextId, isScene = false) {
            if (nodeId === contextId || isScene) {
                return SpinalGraphService.getChildrenInContext(nodeId, contextId);
            }

            return [SpinalGraphService.getInfo(nodeId)];
        },

        async calculateOffset(scene, nodeRef) {


            const refs = nodeRef ? [nodeRef] : scene.children.map(child => child.node);

            const promises = refs.map(async ref => {
                const fileVersion = await this.getSvfFile(ref);
                const offset = await this.getOffset(scene, fileVersion.aecPath.get());
                this.setOffset(fileVersion, scene.id, offset);
                return offset
            });

            return Promise.all(promises);

            // const nodeRef = this.nodeRefs[node.id];
            // const aecPath = await this.getAecPath(nodeRef);
            // const scenes = await this.getScenes(nodeRef.id.get());

            // for (const scene of scenes) {
            //     const offset = await this.getOffset(scene, aecPath);
            //     console.log("offset", offset);
            // }
        },

        async getSvfFile(bimFile) {
            const element = await bimFile.element.load();
            return new Promise((resolve, reject) => {
                element.currentVersion.load((version) => {
                    resolve(version);
                });
            });
        },

        async getScenes(nodeId) {
            const scenes = await SpinalGraphService.getParents(nodeId, ["hasParts"]);
            return scenes.map(scene => scene.get());
        },

        async getOffset(scene, aecPath) {
            const methods = {
                CenterToCenter : 0,
                OriginToOrigin : 1,
                ShareCoordinates : 2
            }

            if(scene.sceneAlignMethod === methods.OriginToOrigin) return spinal.SpinalForgeViewer.get1stGlobalOffset();
            if(scene.sceneAlignMethod === methods.ShareCoordinates) return spinal.SpinalForgeViewer.addOffsetFromAEC(aecPath);
        },

        setOffset(fileVersion, sceneId, offset) {

            if (!fileVersion.offset) fileVersion.add_attr({ offset: {} });
            if (!fileVersion.offset[sceneId]) fileVersion.offset.add_attr({ [sceneId]: {} });

            fileVersion.offset[sceneId].mod_attr('x',offset.x);
            fileVersion.offset[sceneId].mod_attr('y',offset.y);
            fileVersion.offset[sceneId].mod_attr('z',offset.z);

            // const realNode = SpinalGraphService.getRealNode(nodeId);
            // if (!realNode.info.offset) realNode.info.add_attr({ offset: {} });
            // if (!realNode.info.offset[sceneId]) realNode.info.offset.add_attr({ [sceneId]: {} });

            // realNode.info.offset[sceneId].mod_attr('x',offset.x);
            // realNode.info.offset[sceneId].mod_attr('y',offset.y);
            // realNode.info.offset[sceneId].mod_attr('z',offset.z);
            
        },

        _formatNodeAsTree(node, children) {
            const info = node.get();
            info.node = node;
            info.children = children.map(child => this._formatNodeAsTree(child, []));
            return info;
        },

        // _createAttributes(node) {
        //     const categoryName = "Spatial";
        //     const realNode = SpinalGraphService.getRealNode(nodeId);

        //     return serviceDocumentation.addCategoryAttribute(realNode, categoryName).then((attributeCategory) => {
        //     const promises = []

        //     for (const key of elementModel._attribute_names) {
        //         promises.push(serviceDocumentation.addAttributeByCategory(realNode, attributeCategory, key, elementModel[key]));
        //     }

        //     return Promise.all(promises);
        //     }).catch((err) => {

        //     });
        // }
    }
}
</script>

<style  lang="scss" scoped>
    .config_container {
        width: 100%;
        height: calc(100% - 15px);
        overflow: auto;
          
    }
</style>

<style lang="scss">
// .config_container {
//     .md-list-item-content {
//         background: transparent !important;
//     }
// }

.config_container * {
    box-sizing: border-box;
    background: transparent !important;
}
</style>