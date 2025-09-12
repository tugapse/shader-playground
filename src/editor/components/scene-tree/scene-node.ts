export interface TreeNode<T> {
  id:string;
  name: string;
  icon: string;
  isClickable?: boolean;
  children?: TreeNode<T>[];
  object:T;
}
