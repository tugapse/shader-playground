// --- Request Schemas ---

/**
 * Represents the payload for creating a new code file.
 */
export interface CreateFileRequest {
  path: string;
  template: string;
}

/**
 * Represents the payload for updating the content of a code file.
 */
export interface UpdateFileContentRequest {
  path:string;
  content: string;
}

// --- Response & Utility Schemas ---

export interface WorkspaceNode {
  name: string;
  relativePath: string;
  isDirectory: boolean;
  children?: WorkspaceNode[];
}

export interface FileContentResult {
  path: string;
  content: string;
  language: string;
}

export interface CompileError {
  text: string;
}

export interface CompileResult {
  success: boolean;
  message: string;
  code: string | null;
  errors: CompileError[] | null;
}