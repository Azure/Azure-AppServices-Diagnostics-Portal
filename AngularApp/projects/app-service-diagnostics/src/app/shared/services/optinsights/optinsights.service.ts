import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class OptinsightsService {

  private GATEWAY_HOST_URL: string = "https://gateway.azureserviceprofiler.net";
  
  constructor(private http: HttpClient) { }

  getAccessToken(username: string, password: string) {
    const credentials = {
      grant_type: 'password',
      username: username,
      password: password
    };

    return this.http.post('https://example.com/oauth/token', credentials);
  }
}
