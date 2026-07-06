import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { Icon } from '../../../app/components/icon/icon';
import { SceneTreeService } from '../../services/scene-tree.service';
import {
  SceneEntity,
  EntityType,
  Scene,
  ObjectInstanciator,
  ClassMetadata,
  ClassType,
} from 'omega-game-engine';
import { EditorService } from '@editor/services/editor.service';
import { TreeNode } from './scene-node';
import { TreeNodeComponent } from './tree-node/tree-node';
import { AddBehaviourMenuComponent } from '../../components/add-behaviour-menu/add-behaviour-menu';

@Component({
  selector: 'app-scene-tree',
  imports: [CommonModule, Icon, TreeNodeComponent, AddBehaviourMenuComponent],
  templateUrl: './scene-tree.html',
  styleUrl: './scene-tree.scss',
})
export class SceneTree {
  @Input() public set targetScene(scene: Scene) {
    if (!scene) return;
    this.scene = scene;
    this.prepareObjects();
  }

  constructor(
    public sceneTreeService: SceneTreeService,
    private editorService: EditorService,
  ) {
    this.editorService.onSceneUpdated.subscribe((scene) => {
      this.targetScene = scene;
    });
    this.editorService.onSceneLoaded.subscribe((scene) => {
      this.targetScene = scene;

      const entity = scene.getEntitieByUuid(this.selectedUuid);
      this.sceneTreeService.onEntitySelected.emit(entity);
    });
    this.sceneTreeService.onEntitySelected.subscribe((entity) => {
      this.selectedUuid = entity?.uuid;
    });
    this.editorService.onSceneUpdated.subscribe((scene) => {
      this.targetScene = scene;
    });
  }

  objectsToDraw: SceneEntity[] = [];
  scene!: Scene;
  selectedUuid!: string;
  sceneTreeNodes!: TreeNode<string>[];
  treeNodeMap: { [key: string]: SceneEntity } = {};

  readonly iconNames: { [key: string]: string } = {
    [EntityType.STATIC]: 'fa-object-group',
    [EntityType.CAMERA]: 'fa-camera',
    [EntityType.LIGHT_AMBIENT]: 'fa-circle-half-stroke',
    [EntityType.LIGHT_DIRECTIONAL]: 'fa-sun',
    [EntityType.LIGHT_POINT]: 'fa-lightbulb',
    [EntityType.LIGHT_SPOT]: 'fa-traffic-light',
    [EntityType.SCENE]: 'fa-bank',
  };

  toggleObj(obj: SceneEntity, event: Event) {
    event.preventDefault();
    obj.show = !obj.show;
  }

  entitySelected(entity: SceneEntity, event: MouseEvent) {
    if (entity.uuid == (event.target! as any).id) {
      this.selectedUuid = entity.uuid;
      this.sceneTreeService.onEntitySelected.emit(entity);
      setTimeout(() => this.editorService.requestCanvasResize(), 30);
    }
  }

  refreshTree() {
    this.prepareObjects();
  }

  prepareObjects() {
    if (!this.scene) return;
    const sceneObjects = this.scene.objects;
    this.treeNodeMap = sceneObjects.reduce((acc, curr) => {
      return { ...acc, [curr.uuid]: curr };
    }, {});
    const rootObjects = [
      ...sceneObjects.filter((e) => !e.transform.parent?.parentEntity),
    ];
    const childObjects: { [key: string]: SceneEntity[] } = {};

    sceneObjects.forEach((ob) => {
      if (ob.transform.parent) {
        if (ob.transform.parent.parentEntity) {
          const key = ob.transform.parent.parentEntity.uuid;
          const parentList: SceneEntity[] = (childObjects[key] =
            childObjects[key] || []);
          parentList.push(ob);
        }
      }
    });
    const nodes = this.createNodeListFromObjectArray(rootObjects, childObjects);
    this.objectsToDraw = rootObjects;
    this.sceneTreeNodes = nodes;
  }

  protected createNodeListFromObjectArray(
    objs: SceneEntity[],
    childObjectsMap: { [key: string]: SceneEntity[] },
  ) {
    const result: TreeNode<string>[] = [];

    for (const elm of objs) {
      const node: TreeNode<string> = {
        icon: this.iconNames[elm.entityType],
        name: elm.name,
        id: elm.uuid,
        object: elm.uuid,
      };
      const child = childObjectsMap[elm.uuid];
      if (child?.length > 0) {
        node.children = this.createNodeListFromObjectArray(
          child,
          childObjectsMap,
        );
      }
      result.push(node);
    }

    return result;
  }

  handleNodeDropped(event: {
    draggedNode: TreeNode<string>;
    targetNode: TreeNode<string>;
    dropPosition: 'above' | 'below' | 'inside';
  }) {
    const { draggedNode, targetNode, dropPosition } = event;

    const { node: foundDraggedNode, parent: draggedParent } =
      this.findNodeAndParent(this.sceneTreeNodes, draggedNode.name);
    const { node: foundTargetNode, parent: targetParent } =
      this.findNodeAndParent(this.sceneTreeNodes, targetNode.name);

    if (!foundDraggedNode) return;

    // Remove the dragged node from its original location
    if (draggedParent) {
      draggedParent.children = draggedParent.children?.filter(
        (n) => n.name !== foundDraggedNode.name,
      );
    } else {
      this.sceneTreeNodes = this.sceneTreeNodes.filter(
        (n) => n.name !== foundDraggedNode.name,
      );
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
      const index =
        targetParent.children?.findIndex(
          (n) => n.name === foundTargetNode?.name,
        ) || 0;
      targetParent.children?.splice(index, 0, foundDraggedNode);
    } else if (dropPosition === 'below' && targetParent) {
      const index =
        targetParent.children?.findIndex(
          (n) => n.name === foundTargetNode?.name,
        ) || 0;
      targetParent.children?.splice(index + 1, 0, foundDraggedNode);
    } else {
      // Handles dropping above/below a root node
      const index = this.sceneTreeNodes.findIndex(
        (n) => n.name === foundTargetNode?.name,
      );
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

  onNodeDeleted(node: TreeNode<string>) {
    if (!this.scene) return;
    const entity = this.treeNodeMap[node.id];
    if (entity) {
      this.deleteEntityAndChildren(entity);
      this.editorService.onSceneUpdated.emit(this.scene);
      if (this.selectedUuid === node.id) {
        this.selectedUuid = '';
        this.sceneTreeService.onEntitySelected.emit(undefined as any);
      }
    }
  }

  private deleteEntityAndChildren(entity: SceneEntity) {
    const children = this.scene.objects.filter(
      (e) => e.transform.parent?.parentEntity === entity,
    );
    for (const child of children) {
      this.deleteEntityAndChildren(child);
    }
    this.scene.removeEntity(entity);
  }

  // Helper function to find a node and its direct parent
  private findNodeAndParent(
    nodes: TreeNode<string>[],
    name: string,
    parent: TreeNode<string> | null = null,
  ): { node: TreeNode<string> | null; parent: TreeNode<string> | null } {
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
    console.debug('Scene tree selected ', node);
    this.selectedUuid = node.id;
    const entity = this.treeNodeMap[this.selectedUuid];
    if (entity) {
      this.sceneTreeService.onEntitySelected.emit(entity);
      setTimeout(() => this.editorService.requestCanvasResize(), 30);
    } else {
    }
  }

  isAddEntityMenuOpen = false;
  availableEntities: ClassMetadata[] = [];
  menuX = 0;
  menuY = 0;

  onSceneTreeAddNewRequested(event: MouseEvent) {
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    // Position slightly below the button
    this.menuY = rect.bottom + 5;
    this.menuX = rect.left;
    const hiddenentities = ['SceneEntity', 'Scene'];
    this.availableEntities = ObjectInstanciator.getMetadata([
      ClassType.Entity,
      ClassType.Light,
    ]).filter((meta) => !hiddenentities.includes(meta.name));
    this.isAddEntityMenuOpen = true;
  }

  onEntitySelected(entityMetadata: ClassMetadata) {
    if (!this.scene) return;
    const instance = ObjectInstanciator.instanciateObjectFromJsonData(
      entityMetadata.name,
      ['New ' + entityMetadata.name],
    );
    if (instance) {
      this.scene.addEntity(instance as SceneEntity);
      this.editorService.onSceneUpdated.emit(this.scene);
      this.sceneTreeService.onEntitySelected.emit(instance as SceneEntity);
    }
  }

  inspectScene(arg0: Scene) {
    this.sceneTreeService.onEntitySelected.emit(this.scene as SceneEntity);
  }
}
