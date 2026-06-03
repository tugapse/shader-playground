import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { FileNode } from './file-explorer.model';

// Mock file system data
const MOCK_FILE_SYSTEM: FileNode = {
  name: 'root',
  path: '/',
  type: 'directory',
  children: [
    {
      name: 'assets',
      path: '/assets',
      type: 'directory',
      children: [
        { name: 'icon.png', path: '/assets/icon.png', type: 'file', size: 1536, extension: '.png' },
        { name: 'model.gltf', path: '/assets/model.gltf', type: 'file', size: 10240, extension: '.gltf' },
      ],
    },
    {
      name: 'scenes',
      path: '/scenes',
      type: 'directory',
      children: [
        { name: 'main.scene', path: '/scenes/main.scene', type: 'file', size: 2048, extension: '.scene' },
      ],
    },
    { name: 'README.md', path: '/README.md', type: 'file', size: 512, extension: '.md' },
  ],
};

@Injectable({
  providedIn: 'root',
})
export class FileSystemService {
  private currentDirectorySubject = new BehaviorSubject<FileNode[]>([]);
  public currentDirectory$: Observable<FileNode[]> = this.currentDirectorySubject.asObservable();

  constructor() {
    // Initialize with the root directory content
    this.navigateToDirectory('/');
  }

  /**
   * Updates the current directory stream with nodes for the given path.
   * This is a mock implementation that navigates the MOCK_FILE_SYSTEM object.
   * @param path The path of the directory to navigate to.
   */
  navigateToDirectory(path: string): void {
    // Simulate async operation
    of(this.findNodeByPath(MOCK_FILE_SYSTEM, path))
      .pipe(delay(100)) // Simulate network latency
      .subscribe(node => {
        if (node && node.type === 'directory' && node.children) {
          this.currentDirectorySubject.next(node.children);
        } else {
          // Path not found or not a directory, default to root
          this.currentDirectorySubject.next(MOCK_FILE_SYSTEM.children || []);
        }
      });
  }

  /**
   * Retrieves the content of a file at the specified path.
   * @param path The path of the file to read.
   * @returns An observable that emits the file content as a string.
   */
  getFileContent(path: string): Observable<string> {
    const node = this.findNodeByPath(MOCK_FILE_SYSTEM, path);
    const content = node && node.type === 'file'
      ? `Mock content for: ${node.name}\nPath: ${node.path}\nSize: ${node.size} bytes`
      : `File not found at path: ${path}`;
    
    // Simulate async file read
    return of(content).pipe(delay(50));
  }

  /**
   * Helper to recursively find a node in the mock file system.
   */
  private findNodeByPath(root: FileNode, path: string): FileNode | undefined {
    if (root.path === path) {
      return root;
    }
    if (root.children) {
      for (const child of root.children) {
        const found = this.findNodeByPath(child, path);
        if (found) {
          return found;
        }
      }
    }
    return undefined;
  }
}