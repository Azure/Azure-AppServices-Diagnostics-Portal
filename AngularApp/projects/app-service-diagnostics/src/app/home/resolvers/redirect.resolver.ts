import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from "@angular/router";
import { FeatureNavigationService } from "diagnostic-data";
import { Observable, of } from "rxjs";
import { FeatureService } from "../../shared-v2/services/feature.service";
import { AuthService } from "../../startup/services/auth.service";

@Injectable({ providedIn: "root" })
export class RedirectResolver implements Resolve<Observable<{}>> {
    private resourceId:string = "";
    constructor(private router: Router, private featureNavigationService: FeatureNavigationService, private featureService: FeatureService,private authService:AuthService) {
        this.authService.getStartupInfo().subscribe(s => {
            this.resourceId = s.resourceId;
        });
    }

    resolve(activatedRouteSnapshot: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<{}> {
        const detector = activatedRouteSnapshot.params["detectorName"];
        this.featureNavigationService.OnDetectorNavigate.subscribe(_ => {
            const categoryId = this.featureService.getCategoryIdByhDetectorId(detector);
            this.router.navigateByUrl(`resource${this.resourceId}/categories/${categoryId}/detectors/${detector}`);
        });
        return of({});
    }
}