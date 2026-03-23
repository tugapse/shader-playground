import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class ProjectApiService {
  private apiUrl = 'http://localhost:5000/api/projects';
  private http = inject(HttpClient);

  getProjects(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getProject(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createProject(name: string): Observable<any> {
    return this.http.post(this.apiUrl, { name });
  }

  saveProjectConfig(id: string, config: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, { config });
  }
}
