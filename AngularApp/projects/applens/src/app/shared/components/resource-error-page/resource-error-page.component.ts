import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ResourceError } from '../../models/resources';

@Component({
  selector: 'resource-error-page',
  templateUrl: './resource-error-page.component.html',
  styleUrls: ['./resource-error-page.component.scss']
})
export class ResourceErrorPageComponent implements OnInit {
  //Redirect from InitResolver in Dashboard.module if resource not exist or Observer returning 5xx
  error: any = null;
  resource: string = "";
  errorMessage: string = "";
  constructor(private router: Router) {
    const resourceError: ResourceError = this.router.getCurrentNavigation()?.extras.state?.resourceError ?? null;
    const errorStr = resourceError?.error ?? null;
    this.error = JSON.parse(errorStr);
    this.resource = resourceError?.resource ?? "";

    this.errorMessage = `Having trouble for validating resource ${this.resource}.`;
  }
  ngOnInit(): void {
    if (this.error && this.error.status === 404) {
      this.errorMessage = `Resource "${this.resource}" is not Found. Please check resource exists.`;
    }
  }
}
