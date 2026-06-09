# Scene Save Functionality (`Ctrl+S`) Documentation

This document details the implementation of the "Save Scene" feature in the editor and the data payload sent to the API. This was created to help diagnose a reported API error.

## 1. Frontend Implementation Overview

The feature was implemented to trigger a save operation when the user presses `Ctrl+S` within the editor.

The core logic resides in `src/editor/editor.ts`. A `@HostListener` was added to capture the `keydown.control.s` event document-wide.

```typescript
// File: src/editor/editor.ts

import { ..., HostListener, ... } from '@angular/core';
// ... other imports

export class Editor implements OnDestroy, OnInit {
  
  // ... existing class properties

  @HostListener('document:keydown.control.s', ['$event'])
  onKeydownHandler(event: Event) {
    event.preventDefault();
    this.saveSceneToApi();
  }

  saveSceneToApi(): void {
    const project = this.editorState.activeProject();
    if (!project || !project.id || !project.scene) {
      console.error('No active project or scene to save.');
      return;
    }

    if (!this.scene) {
      console.error('Scene is not loaded, cannot save.');
      return;
    }

    const sceneData = this.scene.toJsonObject();
    const sceneString = JSON.stringify(sceneData, null, 2);

    this.assetService.updateRawAssetContent(project.id, project.scene, sceneString)
      .subscribe({
        next: (response) => console.log('Scene saved successfully', response),
        error: (err) => console.error('Failed to save scene', err)
      });
  }

  // ... rest of the class
}
```

## 2. API Request and Payload

The `saveSceneToApi` method performs the following steps:
1.  Retrieves the active `projectId` and `sceneId`.
2.  Serializes the entire current scene into a JSON object using the `this.scene.toJsonObject()` method, which is part of the `@engine` library.
3.  Converts this JSON object into a string.
4.  Calls the `assetService.updateRawAssetContent()` method, which sends a `PUT` or `POST` request to the API endpoint responsible for updating raw asset content.

### Payload Structure

The payload is a JSON string representing the scene. Based on the `toJsonObject()` method, the structure is expected to be as follows.

**Example Payload:**

```json
{
  "name": "SampleScene",
  "entities": [
    {
      "name": "Camera",
      "id": "uuid-camera-123",
      "components": [
        {
          "type": "Transform",
          "position": [0, 0, 10],
          "rotation": [0, 0, 0],
          "scale": [1, 1, 1]
        },
        {
          "type": "Camera",
          "fieldOfView": 45,
          "nearClip": 0.1,
          "farClip": 1000
        }
      ],
      "children": []
    },
    {
      "name": "Light",
      "id": "uuid-light-456",
      "components": [
        {
          "type": "Transform",
          "position": [5, 10, 5],
          "rotation": [0, 0, 0],
          "scale": [1, 1, 1]
        },
        {
          "type": "Light",
          "color": "#FFFFFF",
          "intensity": 1.0
        }
      ],
      "children": []
    }
  ],
  "settings": {
    "clearColor": [0.6, 0.8, 1.0, 1.0]
  }
}
```

**Note:** This is a representative example. The actual content, entity count, and component properties will vary depending on the state of the scene at the moment of saving.

## 3. Request for API Investigation

The frontend appears to be correctly serializing the scene and sending it. An error on the API suggests a potential issue with how the incoming JSON data is being parsed, validated, or processed by the backend service.