import { AppType, PlatformType, SitePropertiesParser, StackType } from '../../../../shared/utilities/applens-site-properties-parsing-utilities';

export interface AnalysisPickerModel {
    id: string;
    name?: string;
  }

export interface SupportTopicResponseModel {
    supportTopicId: string;
    sapSupportTopicId: string;
    sapProductId: string;
    supportTopicPath: string;
    productName: string;
    supportTopicL2Name: string;
    supportTopicL3Name: string
  }
  
  export interface SupportTopicPickerModel {
    supportTopicId: string;
    pesId: string;
    sapSupportTopicId: string;
    sapProductId: string;
    supportTopicPath?: string;
    productName?: string;
    supportTopicL2Name?: string;
    supportTopicL3Name?: string
  }

  export enum EntityType {
    Analysis = 0,
    Detector = 1
  }
  
  export class DetectorSettingsModel {
    /**
     * Name of the provider for the resource. E.g..for a  Microsoft.Web/sites resource, it will be Microsoft.Web.
     */
    public providerName:string;

    /**
     * Name of the resource type. E.g..for a  Microsoft.Web/sites resource, it will be sites.
     */
    public resourceTypeName:string;

    private _id: string;

    /**
     * The id of the detector.
     */
    public get id(): string {
        if(this._id){
            return this._id;
        }
        else {
            return this.providerName + '_' + this.resourceTypeName + '_' + this.name.replace(/\s/g, '_',).replace(/\./g, '_');
        }
    }

    public set id(value: string) {
        if(value){
            this._id = value;
        }
    }

    /**
     * The name of the detector.
     */
    public name: string = 'Auto Generated Detector Name';

    /**
     * The description of the detector. Optional, however recommended as it powers a lot of data learning operations.
     */
    public description?: string;

    /**
     * The type of the detector. This is used to determine the the current entity is an Anaysis, Detector etc.
     */
    public type:EntityType = EntityType.Detector;

    /**
     * Holds the alias of detector author(s).
     */    
    public authors: string[];
    
    /**
     * The category of the detector. This is used to determine the category this detector is associated with.
     */
    public category?: string;

    /**
     * The list app types this detector is applicable to. Relevant only in the case of Microsoft.Web detectors.
     */
    public appTypes?:AppType[];

    /**
     * The list platform types this detector is applicable to. Relevant only in the case of Microsoft.Web detectors.
     */
    public platformTypes?:PlatformType[];

    /**
     * The list stack types this detector is applicable to. Relevant only in the case of Microsoft.Web detectors.
     */
    public stackTypes?:StackType[];

    /**
     * Identifies if the detector is internal only or public facing.
     */
    public isInternalOnly:boolean = true;

    /**
     * Identifies if the detector is private to the authors. This automatically implies that the detector is internal only.
     */
    public isPrivate: boolean = false;

    /**
     * Indicates whether the UI elements will wait for user click to render or render automatically.
     */
    public isOnDemandRenderEnabled: boolean = false;

    /**
     * The list of analysis this detector should be associated with. When any of these analysis are executed, this detector will be executed as well.
     */
    public analysisList?: AnalysisPickerModel[];

    /**
     * The list of support topics this detector should be associated with.
     */
    public supportTopicList?: SupportTopicPickerModel[];

    public GetJson(): string {
      return JSON.stringify(this);
    }

    public get isAppService(): boolean {
        return this.providerName.toLowerCase() === 'microsoft.web' && this.resourceTypeName.toLowerCase() === 'sites';
    }

    public constructor(providerName:string, resourceTypeName:string, detectorName?:string, detectorId?:string) {
      this.providerName = providerName;
      this.resourceTypeName = resourceTypeName;

      if(detectorName){
        this.name = detectorName;
      }

      this.id = detectorId;
    }
  }