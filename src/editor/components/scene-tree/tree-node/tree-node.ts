import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GlEntity } from '@engine';
import { Icon } from "src/app/components/icon/icon";
import { TreeNode } from '../scene-node';

@Component({
  selector: 'app-tree-node',
  imports: [Icon],
  templateUrl: './tree-node.html',
  styleUrl: './tree-node.scss'
})

export class TreeNodeComponent<T> {

  @Input() node!: TreeNode<T>;
  @Input() selectedNodeId: string = "";

  @Output() nodeDropped = new EventEmitter<{ draggedNode: TreeNode<T>, targetNode: TreeNode<T>, dropPosition: 'above' | 'below' | 'inside' }>();
  @Output() visibilityChange = new EventEmitter<TreeNode<T>>();
  @Output() nodeSelected = new EventEmitter<TreeNode<T>>();
  @Output() nodeDeleted = new EventEmitter<TreeNode<T>>();

  isDropAbove = false;
  isDropBelow = false;
  isDropInside = false;

  onDeleteClick(node: TreeNode<T>, event: MouseEvent) {
    event.stopPropagation();
    this.nodeDeleted.emit(node);
  }

  onChildDeleted(node: TreeNode<T>) {
    this.nodeDeleted.emit(node);
  }

  onDragStart(event: DragEvent): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify(this.node));
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const y = event.clientY - rect.top;

    this.isDropAbove = false;
    this.isDropBelow = false;
    this.isDropInside = false;

    if (y < rect.height / 3) {
      this.isDropAbove = true;
    } else if (y > (rect.height / 3) * 2) {
      this.isDropBelow = true;
    } else {
      this.isDropInside = true;
    }
  }

  onDragLeave(event: DragEvent): void {
    this.isDropAbove = false;
    this.isDropBelow = false;
    this.isDropInside = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer) {
      const draggedNode = JSON.parse(event.dataTransfer.getData('application/json'));
      if (draggedNode && draggedNode.name !== this.node.name) {
        
        const dropPosition = this.isDropAbove ? 'above' : (this.isDropBelow ? 'below' : 'inside');
        this.nodeDropped.emit({ draggedNode, targetNode: this.node, dropPosition });
      }
    }
    this.isDropAbove = false;
    this.isDropBelow = false;
    this.isDropInside = false;
  }

  onChildDropped(event: { draggedNode: TreeNode<T>, targetNode: TreeNode<T>, dropPosition: 'above' | 'below' | 'inside' }): void {
    this.nodeDropped.emit(event);
  }

  onNodeClick(node: TreeNode<T>) {
    if(node && node.id != this.selectedNodeId){
      console.debug("selected node", node);
        this.nodeSelected.emit(node);
    }
  }


  onMouseUp(node: TreeNode<T>, event: any){
      console.debug("Node mouse up", node);
    this.onNodeClick(node);
      event.preventDefault();
      event.stopPropagation();
  }
}
