import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  AnalyticsOverview,
  CreatePromptDto,
  PaginatedPromptResponse,
  Prompt,
  Tag,
} from '../models/prompt.model';

@Injectable({
  providedIn: 'root'
})
export class PromptService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getPrompts(tag?: string, page: number = 1, limit: number = 12, search?: string): Observable<PaginatedPromptResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (tag) {
      params = params.set('tag', tag);
    }

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PaginatedPromptResponse>(`${this.baseUrl}/prompts/`, { params });
  }

  getBookmarks(tag?: string, page: number = 1, limit: number = 12, search?: string): Observable<PaginatedPromptResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (tag) {
      params = params.set('tag', tag);
    }

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PaginatedPromptResponse>(`${this.baseUrl}/bookmarks/`, { params });
  }

  getPrompt(id: number): Observable<Prompt> {
    return this.http.get<Prompt>(`${this.baseUrl}/prompts/${id}/`);
  }

  createPrompt(data: CreatePromptDto): Observable<Prompt> {
    return this.http.post<Prompt>(`${this.baseUrl}/prompts/`, data);
  }

  getTags(): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${this.baseUrl}/tags/`);
  }

  likePrompt(id: number): Observable<Prompt> {
    return this.http.post<Prompt>(`${this.baseUrl}/prompts/${id}/like/`, {});
  }

  unlikePrompt(id: number): Observable<Prompt> {
    return this.http.delete<Prompt>(`${this.baseUrl}/prompts/${id}/like/`);
  }

  bookmarkPrompt(id: number): Observable<Prompt> {
    return this.http.post<Prompt>(`${this.baseUrl}/prompts/${id}/bookmark/`, {});
  }

  unbookmarkPrompt(id: number): Observable<Prompt> {
    return this.http.delete<Prompt>(`${this.baseUrl}/prompts/${id}/bookmark/`);
  }

  getAnalytics(tag?: string, search?: string): Observable<AnalyticsOverview> {
    let params = new HttpParams();

    if (tag) {
      params = params.set('tag', tag);
    }

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<AnalyticsOverview>(`${this.baseUrl}/analytics/overview/`, { params });
  }
}
