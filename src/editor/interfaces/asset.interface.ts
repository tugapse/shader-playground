export interface IAsset {
  id: string;
  name: string;
  virtualPath: string;
  type: 'file' | 'folder' | string;
  projectId: string;
  children?: IAsset[];
}
