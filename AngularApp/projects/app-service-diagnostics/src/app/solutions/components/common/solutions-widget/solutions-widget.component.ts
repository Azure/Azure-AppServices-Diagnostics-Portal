import { Component, Input, OnInit, AfterViewInit } from '@angular/core';
import { SolutionUIModelBase } from '../../../../shared/models/solution-ui-model/solution-ui-model-base';
import { SolutionMetadata } from '../../../../shared/models/solution-ui-model/solutionproperties';
import { ReplaySubject } from 'rxjs';
import { SolutionFactory } from '../../../../shared/models/solution-ui-model/solutionfactory';
import { SolutionHolder } from '../../../../shared/models/solution-holder';
import { ISolution } from '../../../../shared/models/solution';
import { SolutionFactoryService } from '../../../../shared/services/solution-factory.service';

@Component({
  selector: 'solutions-widget',
  templateUrl: 'solutions-widget.component.html'
})
export class SolutionsWidgetComponent implements OnInit {
  private _solutionModelSubject: ReplaySubject<ISolution[]> = new ReplaySubject<
    ISolution[]
  >(1);

  constructor(private _solutionFactoryService: SolutionFactoryService) {}

  @Input() set solutionModels(model: ISolution[]) {
    this._solutionModelSubject.next(model);
  }

  @Input() showTitle: boolean = true;
  @Input() smallMenu: boolean = false;

  @Input() defaultSolutions: ISolution[];

  solutions: SolutionHolder[] = [];
  loadingSolutions: boolean = true;

  ngOnInit(): void {
    this._solutionModelSubject.subscribe((solutions: ISolution[]) => {
      this.loadingSolutions = true;
      solutions = this.updateSolutions(solutions);

      const solutionHolders: SolutionHolder[] = [];

      //this._injectSampleData();

      solutions.forEach((solution) => {
        if (
          !solutionHolders.find(
            (holder) => holder.data.solution.id === solution.id
          )
        ) {
          const solutionHolder =
            this._solutionFactoryService.getSolution(solution);
          if (solutionHolder) {
            //Hack for handling different CPU solutions
            if (
              !(
                solutionHolder.data.solution.id === 2 &&
                solutionHolders.find(
                  (solution) => solution.data.solution.id === 1
                )
              )
            ) {
              solutionHolders.push(solutionHolder);
            }
          }
        }
      });

      // Allow default solutions to be passed
      if (solutionHolders.length <= 0 && this.defaultSolutions) {
        this.defaultSolutions.forEach((solution) => {
          const t = this._solutionFactoryService.getSolution(solution);
          solutionHolders.push(t);
        });
      }

      this.solutions = solutionHolders;

      this.loadingSolutions = false;
    });
  }

  private _injectSampleData() {
    const sampleRestart = <ISolution>{
      id: 1.0,
      displayName: 'Kill Process(es) on Instance',
      order: 1.0,
      description:
        'This action will only kill a specific process on specified instances. Other processes are not affected and the whole site is not restarted.',
      data: [
        [
          {
            name: 'SubscriptionId',
            value: '1402be24-4f35-4ab7-a212-2cd496ebdf14'
          },
          { name: 'ResourceGroup', value: 'netpractice' },
          { name: 'SiteName', value: 'netpractice' },
          { name: 'ProcessName', value: 'netpractice' },
          { name: 'MachineName', value: 'RD0003FF57EA9A' },
          {
            name: 'InstanceId',
            value:
              '8fa4a4ad3d3b6a29f92b0728c845d7800e2e2aa3ddaee4c3b878971ac3e46506'
          }
        ]
      ],
      metadata: []
    };
    const sampleProfiler = <ISolution>{
      id: 104,
      displayName: 'Kill Process(es) on Instance',
      order: 1.0,
      description:
        'This action will only kill a specific process on specified instances. Other processes are not affected and the whole site is not restarted.',
      data: [
        [
          {
            name: 'SubscriptionId',
            value: '1402be24-4f35-4ab7-a212-2cd496ebdf14'
          },
          { name: 'ResourceGroup', value: 'puneetgdemowebcamp' },
          { name: 'SiteName', value: 'demowebcamp' },
          { name: 'ProcessName', value: 'demowebcamp' },
          { name: 'MachineName', value: 'RD00155D3BFE27' },
          {
            name: 'InstanceId',
            value:
              '23975d61d45f1de4d5980442c107a28d6438e0ac0f28a1eb70c5f89025990aac'
          }
        ],
        [
          {
            name: 'SubscriptionId',
            value: 'ef90e930-9d7f-4a60-8a99-748e0eea69de'
          },
          { name: 'ResourceGroup', value: 'puneetgdemowebcamp' },
          { name: 'SiteName', value: 'demowebcamp' },
          { name: 'ProcessName', value: 'demowebcamp' },
          { name: 'MachineName', value: 'RD00155D3BEAA4' },
          {
            name: 'InstanceId',
            value:
              '177d406f6116588e488f229322e0d416f7026376e4e4d991b40ce5085affb0fe'
          }
        ],
        [
          {
            name: 'SubscriptionId',
            value: '1402be24-4f35-4ab7-a212-2cd496ebdf14'
          },
          { name: 'ResourceGroup', value: 'puneetgdemowebcamp' },
          { name: 'SiteName', value: 'demowebcamp' },
          { name: 'ProcessName', value: 'demowebcamp' },
          { name: 'MachineName', value: 'RD00155D3C2142' },
          {
            name: 'InstanceId',
            value:
              'bae4a5f918cf044087f6b73d3e3ee0cecd6caaef4f0d85a2471cbaa2574cd8c8'
          }
        ]
      ],
      metadata: []
    };
    const sampleMemoryDump = <ISolution>{
      id: 103,
      displayName: 'Kill Process(es) on Instance',
      order: 1.0,
      description:
        'This action will only kill a specific process on specified instances. Other processes are not affected and the whole site is not restarted.',
      data: [
        [
          {
            name: 'SubscriptionId',
            value: '1402be24-4f35-4ab7-a212-2cd496ebdf14'
          },
          { name: 'ResourceGroup', value: 'puneetgdemowebcamp' },
          { name: 'SiteName', value: 'demowebcamp' },
          { name: 'ProcessName', value: 'demowebcamp' },
          { name: 'MachineName', value: 'RD00155D3BFE27' },
          {
            name: 'InstanceId',
            value:
              '23975d61d45f1de4d5980442c107a28d6438e0ac0f28a1eb70c5f89025990aac'
          }
        ],
        [
          {
            name: 'SubscriptionId',
            value: 'ef90e930-9d7f-4a60-8a99-748e0eea69de'
          },
          { name: 'ResourceGroup', value: 'puneetgdemowebcamp' },
          { name: 'SiteName', value: 'demowebcamp' },
          { name: 'ProcessName', value: 'demowebcamp' },
          { name: 'MachineName', value: 'RD00155D3BEAA4' },
          {
            name: 'InstanceId',
            value:
              '177d406f6116588e488f229322e0d416f7026376e4e4d991b40ce5085affb0fe'
          }
        ],
        [
          {
            name: 'SubscriptionId',
            value: '1402be24-4f35-4ab7-a212-2cd496ebdf14'
          },
          { name: 'ResourceGroup', value: 'puneetgdemowebcamp' },
          { name: 'SiteName', value: 'demowebcamp' },
          { name: 'ProcessName', value: 'demowebcamp' },
          { name: 'MachineName', value: 'RD00155D3C2142' },
          {
            name: 'InstanceId',
            value:
              'bae4a5f918cf044087f6b73d3e3ee0cecd6caaef4f0d85a2471cbaa2574cd8c8'
          }
        ]
      ],
      metadata: []
    };

    if (this.solutions.findIndex((x) => x.data.solution.id === 1) < 0) {
      const t = this._solutionFactoryService.getSolution(sampleRestart);
      this.solutions.push(t);
    }

    if (this.solutions.findIndex((x) => x.data.solution.id === 3) < 0) {
      const t = this._solutionFactoryService.getSolution(<ISolution>{
        id: 3
      });
      this.solutions.push(t);
    }

    if (this.solutions.findIndex((x) => x.data.solution.id === 4) < 0) {
      const t = this._solutionFactoryService.getSolution(<ISolution>{
        id: 4
      });
      this.solutions.push(t);
    }

    if (this.solutions.findIndex((x) => x.data.solution.id === 12) < 0) {
      const t = this._solutionFactoryService.getSolution(<ISolution>{
        id: 12
      });
      this.solutions.push(t);
    }

    if (this.solutions.findIndex((x) => x.data.solution.id === 17) < 0) {
      const t = this._solutionFactoryService.getSolution(<ISolution>{
        id: 17
      });
      this.solutions.push(t);
    }

    if (this.solutions.findIndex((x) => x.data.solution.id === 104) < 0) {
      const t = this._solutionFactoryService.getSolution(sampleProfiler);
      this.solutions.push(t);
    }

    if (this.solutions.findIndex((x) => x.data.solution.id === 103) < 0) {
      const t = this._solutionFactoryService.getSolution(sampleMemoryDump);
      this.solutions.push(t);
    }
  }

  updateSolutions(solutions: ISolution[]) {
    const finalSolutions: ISolution[] = [];
    if (solutions && solutions.length > 0) {
      const advancedRestarts = solutions.filter((x) => x.id === 1);
      const rest = solutions.filter((x) => x.id !== 1);

      if (advancedRestarts.length > 0) {
        const original = advancedRestarts[0];
        if (advancedRestarts.length > 1) {
          advancedRestarts.forEach((x) => {
            if (x !== original && x.data.length > 0) {
              original.data.push(x.data[0]);
            }
          });
        }

        finalSolutions.push(original);
      }

      rest.forEach((r) => {
        if (r.id === 21) {
          r.id = 3;
        }
        finalSolutions.push(r);
      });
    }
    return finalSolutions;
  }
}
