import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { Icon } from "../../../app/components/icon/icon";
import { SceneTreeService } from '../../services/scene-tree.service';
import { GlEntity, EntityType, Scene } from '@engine';
import { EditorService } from '@editor/services/editor.service';
import { TreeNode } from './scene-node';
import { TreeNodeComponent } from './tree-node/tree-node';


@Component({
  selector: 'app-scene-tree',
  imports: [CommonModule, Icon, TreeNodeComponent],
  templateUrl: './scene-tree.html',
  styleUrl: './scene-tree.scss'
})
export class SceneTree {




  @Input() public set targetScene(scene: Scene) {
      this.scene = scene;
      this.prepareObjects();
  };



  constructor(public sceneTreeService: SceneTreeService, private editorService: EditorService) {
    this.sceneTreeService.onSceneUpdated.subscribe(scene => {
      this.targetScene = scene;
    });
    this.editorService.onSceneLoaded.subscribe(scene => {
      this.targetScene = scene;

      const entity = scene.getEntitieByUuid(this.selectedUuid);
      this.sceneTreeService.onEntitySelected.emit(entity);
    });
    this.sceneTreeService.onEntitySelected.subscribe(entity => {
      this.selectedUuid = entity?.uuid;
    })
  }


  objectsToDraw: GlEntity[] = []
  scene!: Scene;
  selectedUuid!: string;
  sceneTreeNodes!: TreeNode<string>[];
  treeNodeMap: { [key: string]: GlEntity } = {};

  readonly iconNames: { [key: string]: string } = {
    [EntityType.STATIC]: "fa-object-group",
    [EntityType.CAMERA]: "fa-camera",
    [EntityType.LIGHT_AMBIENT]: "fa-circle-half-stroke",
    [EntityType.LIGHT_DIRECTIONAL]: "fa-sun",
    [EntityType.LIGHT_POINT]: "fa-lightbulb",
    [EntityType.LIGHT_SPOT]: "fa-traffic-light",
    [EntityType.SCENE]: "fa-bank",
  }

  toggleObj(obj: GlEntity, event: Event) {
    event.preventDefault();
    obj.show = !obj.show;
  }

  entitySelected(entity: GlEntity, event: MouseEvent) {
    if (entity.uuid == (event.target! as any).id) {
      this.selectedUuid = entity.uuid;
      this.sceneTreeService.onEntitySelected.emit(entity);
      setTimeout(() => this.editorService.requestCanvasResize(), 30);
    }
  }

  prepareObjects() {
    if (!this.scene) return;
    const sceneObjects = this.scene.objects;
    this.treeNodeMap = sceneObjects.reduce((acc, curr) => { return { ...acc, [curr.uuid]: curr } }, {});
    const rootObjects = [...sceneObjects.filter(e => !e.transform.parent?.parentEntity)];
    const childObjects: { [key: string]: GlEntity[] } = {};

    sceneObjects.forEach(ob => {
      if (ob.transform.parent) {
        if (ob.transform.parent.parentEntity) {
          const key = ob.transform.parent.parentEntity.uuid;
          const parentList: GlEntity[] = childObjects[key] = childObjects[key] || [];
          parentList.push(ob);
        }
      }
    });
    const nodes = this.createNodeListFromObjectArray(rootObjects, childObjects);
    this.objectsToDraw = rootObjects;
    this.sceneTreeNodes = nodes;
  }

  protected createNodeListFromObjectArray(objs: GlEntity[], childObjectsMap: { [key: string]: GlEntity[] }) {
    const result: TreeNode<string>[] = [];

    for (const elm of objs) {
      const node: TreeNode<string> = {
        icon: this.iconNames[elm.entityType],
        name: elm.name,
        id: elm.uuid,
        object: elm.uuid
      };
      const child = childObjectsMap[elm.uuid];
      if (child?.length > 0) {
        node.children = this.createNodeListFromObjectArray(child, childObjectsMap);
      }
      result.push(node);
    }

    return result;
  }


  handleNodeDropped(event: { draggedNode: TreeNode<string>, targetNode: TreeNode<string>, dropPosition: 'above' | 'below' | 'inside' }) {

    debugger
    const { draggedNode, targetNode, dropPosition } = event;

    const { node: foundDraggedNode, parent: draggedParent } = this.findNodeAndParent(this.sceneTreeNodes, draggedNode.name);
    const { node: foundTargetNode, parent: targetParent } = this.findNodeAndParent(this.sceneTreeNodes, targetNode.name);

    if (!foundDraggedNode) return;

    // Remove the dragged node from its original location
    if (draggedParent) {
      draggedParent.children = draggedParent.children?.filter(n => n.name !== foundDraggedNode.name);
    } else {
      this.sceneTreeNodes = this.sceneTreeNodes.filter(n => n.name !== foundDraggedNode.name);
    }

    const childEntity = this.treeNodeMap[foundDraggedNode.id];
    // Insert the dragged node into the new location based on dropPosition
    if (dropPosition === 'inside' && foundTargetNode) {
      if (!foundTargetNode.children) {
        foundTargetNode.children = [];
      }
      foundTargetNode.children.push(foundDraggedNode);
      const parentEntity = this.treeNodeMap[foundTargetNode.id];
      childEntity.transform.setParent(parentEntity.transform);

    } else if (dropPosition === 'above' && targetParent) {
      const index = targetParent.children?.findIndex(n => n.name === foundTargetNode?.name) || 0;
      targetParent.children?.splice(index, 0, foundDraggedNode);
    } else if (dropPosition === 'below' && targetParent) {
      const index = targetParent.children?.findIndex(n => n.name === foundTargetNode?.name) || 0;
      targetParent.children?.splice(index + 1, 0, foundDraggedNode);
    } else {
      // Handles dropping above/below a root node
      const index = this.sceneTreeNodes.findIndex(n => n.name === foundTargetNode?.name);
      if (index !== -1 && index !== undefined) {
        if (dropPosition === 'above') {
          this.sceneTreeNodes.splice(index, 0, foundDraggedNode);
        } else {
          this.sceneTreeNodes.splice(index + 1, 0, foundDraggedNode);
        }
      }
    }

    this.sceneTreeNodes = [...this.sceneTreeNodes]; // Trigger change detection
  }

  // Helper function to find a node and its direct parent
  private findNodeAndParent(nodes: TreeNode<string>[], name: string, parent: TreeNode<string> | null = null): { node: TreeNode<string> | null, parent: TreeNode<string> | null } {
    for (const node of nodes) {
      if (node.name === name) {
        return { node, parent };
      }
      if (node.children) {
        const found = this.findNodeAndParent(node.children, name, node);
        if (found.node) {
          return found;
        }
      }
    }
    return { node: null, parent: null };
  }

  onNodeSelected(node: TreeNode<string>) {
    console.debug("Scene tree selected ", node);
    this.selectedUuid = node.id;
    const entity = this.treeNodeMap[this.selectedUuid];
    if (entity) {
      this.sceneTreeService.onEntitySelected.emit(entity);
      setTimeout(() => this.editorService.requestCanvasResize(), 30);
    } else {
      debugger
    }
  }

  onSceneTreeAddNewRequested() {
    this.sceneTreeService.onAddNewRequested.emit();
  }
}
