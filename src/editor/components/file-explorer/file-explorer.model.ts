export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  extension?: string;
  children?: FileNode[];
}

export interface ContextMenuAction {
  id: string;
  label: string;
  icon?: string;
}