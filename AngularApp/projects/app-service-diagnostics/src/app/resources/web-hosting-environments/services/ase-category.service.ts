import { Injectable } from '@angular/core';
import { Category } from '../../../shared-v2/models/category';
import { CategoryService } from '../../../shared-v2/services/category.service';

@Injectable()
export class AseCategoryService extends CategoryService {
  private _aseCategories: Category[] = [
    {
      id: 'networkingase',
      name: 'Networking',
      description:
        'Find out if your network setup is configured correctly for your ASE.',
      keywords: [
        'NSG',
        'Connectivity',
        'Outbound Connections',
        'Subnet',
        'Express Route'
      ],
      color: 'rgb(208, 175, 239)',
      createFlowForCategory: true,
      chatEnabled: false,
      overviewDetectorId: 'networkingoverview_ase'
    },
    {
      id: 'scalingase',
      name: 'Scaling',
      description:
        'Check the status of scale operations and troubleshoot latency and failures.',
      keywords: ['Scale Up', 'Scale Out', 'Deployment', 'Stuck'],
      color: 'rgb(249, 213, 180)',
      createFlowForCategory: true,
      chatEnabled: false,
      overviewDetectorId: 'stuckscaling'
    }
  ];

  constructor() {
    super();
    this._addCategories(this._aseCategories);
  }
}
