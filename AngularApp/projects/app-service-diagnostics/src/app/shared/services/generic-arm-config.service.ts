import { Injectable } from '@angular/core';
import { ArmApiConfig, ArmResourceConfig, LiveChatConfig } from '../models/arm/armResourceConfig'
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Category } from "../../shared-v2/models/category";
import { Observable, of, forkJoin } from 'rxjs';
import { AppInsightsTelemetryService, ResourceDescriptor, TelemetryEventNames } from 'diagnostic-data';
import { PortalKustoTelemetryService } from './portal-kusto-telemetry.service';

@Injectable()
export class GenericArmConfigService {
  public resourceMap: Array<ArmResourceConfig> = [];
  public resourceConfig: ArmResourceConfig;
  public overrideConfig: ArmResourceConfig;

  getValue(source: any, override: any): any {

    if (typeof source != 'undefined' && typeof override == 'undefined') {
      return source;
    }

    if (typeof source == 'undefined' && typeof override != 'undefined') {
      return override;
    }


    if (
      ((source instanceof Array) && !(override instanceof Array))
      || (!(source instanceof Array) && (override instanceof Array))
      || ((typeof source != typeof override))
    ) {
      return override;
    }

    if (source instanceof Array) {
      //Assumes string array so the action is to merge the two string arrays.
      //The override value will always be present along with what the user entered.
      if (override.length > 0) {
        var tempVal = (source.join(',') + ',' + override.join(',')).split(',');
        var value = [];
        tempVal.forEach(element => {
          if (value.indexOf(element) < 0) {
            value.push(element);
          }
        });
        return value;
      }
      else {
        return source;
      }
    }

    if ((typeof source == 'string')) {
      if (override !== '') {
        return override;
      }
      else {
        return source;
      }
    }
    else {
      if ((typeof source == 'boolean') || (typeof source == 'number')) {
        return override;
      }
    }
    return null;
  }

  public distinctStringValues(value: string, index: number, self: string[]): boolean {
    return self.indexOf(value) === index;
  }

  logEvent(eventMessage: string, properties: { [name: string]: string }, measurements?: any) {
    try
    {
      if(!!this._telemetryService) {
        this._telemetryService.logEvent(eventMessage, properties, measurements);
      }
    }
    catch(error) {}
  }

  logException(exception: Error, handledAt?: string, properties?: { [name: string]: string }, measurements?: any, severityLevel?: any) {
    try
    {
      if(!!this._telemetryService) {
        this._telemetryService.logException(exception, handledAt, properties, measurements, severityLevel);
      }
    }
    catch(error) {}
  }


  constructor(private _http: HttpClient, private _telemetryService?: PortalKustoTelemetryService) { }

  public initArmConfig(resourceUri: string): Observable<ArmResourceConfig> {
    if (!resourceUri.startsWith('/')) {
      resourceUri = '/' + resourceUri;
    }
    let resourceDesc = ResourceDescriptor.parseResourceUri(resourceUri);
    const baseUri: string = 'armResourceConfig/' + resourceDesc.provider + '/' + resourceDesc.type + '/';

    let override = this._http.get<ArmResourceConfig>(baseUri + 'override.json')
    let config = this._http.get<ArmResourceConfig>(baseUri + 'config.json')

    return forkJoin(override, config).pipe(catchError(err => of(err)),
      map(configs => {
        if (!(configs instanceof Array)) {
          console.log(`Error occurred while reading arm resource config. Details...`);
          console.log(configs);
        }
        this.overrideConfig = configs[0];
        this.resourceConfig = configs[1];

        //Marging the two configs.
        var currConfig: ArmResourceConfig = {
          homePageText: {
            title: '',
            description: '',
            searchBarPlaceHolder: ''
          },
          armApiConfig: {
            armApiVersion: '',
            isArmApiResponseBase64Encoded:false
          },
          isSearchEnabled:true,
          categories: [{
            id: '',
            name: '',
            overviewDetectorId: '',
            description: '',
            keywords: [],
            color: '',
            createFlowForCategory: true,
            chatEnabled: false
          }],
          quickLinks: [],
          disableGenie: false
        }

        //currConfig.homePageText.title
        try {
          if (
            (this.overrideConfig && this.overrideConfig.homePageText && this.overrideConfig.homePageText.title) ||
            (this.resourceConfig && this.resourceConfig.homePageText && this.resourceConfig.homePageText.title)
          ) {
            currConfig.homePageText.title = this.getValue(this.resourceConfig.homePageText.title, this.overrideConfig.homePageText.title);
          }
        } catch (error) {
          this.logException(error, null, {
            "resourceUri": resourceUri,
            "reason": `${TelemetryEventNames.ArmConfigMergeError}: Error while merging armConfig.`,
            "field": "homePageText.title"
          });
          throw error;
        }


        //currConfig.homePageText.description
        try {
          if (
            (this.overrideConfig && this.overrideConfig.homePageText && this.overrideConfig.homePageText.description) ||
            (this.resourceConfig && this.resourceConfig.homePageText && this.resourceConfig.homePageText.description)
          ) {
            currConfig.homePageText.description = this.getValue(this.resourceConfig.homePageText.description, this.overrideConfig.homePageText.description);
          }
        } catch (error) {
          this.logException(error, null, {
            "resourceUri": resourceUri,
            "reason": `${TelemetryEventNames.ArmConfigMergeError}: Error while merging armConfig.`,
            "field": "homePageText.description"
          });
          throw error;
        }

        //currConfig.homePageText.searchBarPlaceHolder
        try {
          if (
            (this.overrideConfig && this.overrideConfig.homePageText && this.overrideConfig.homePageText.searchBarPlaceHolder) ||
            (this.resourceConfig && this.resourceConfig.homePageText && this.resourceConfig.homePageText.searchBarPlaceHolder)
          ) {
            currConfig.homePageText.searchBarPlaceHolder = this.getValue(this.resourceConfig.homePageText.searchBarPlaceHolder, this.overrideConfig.homePageText.searchBarPlaceHolder);
          }
        } catch (error) {
          this.logException(error, null, {
            "resourceUri": resourceUri,
            "reason": `${TelemetryEventNames.ArmConfigMergeError}: Error while merging armConfig.`,
            "field": "homePageText.searchBarPlaceHolder"
          });
          throw error;
        }

        //currConfig.matchRegEx
        try {
          if (this.getValue(this.resourceConfig.matchRegEx, this.overrideConfig.matchRegEx) != null) {
            currConfig.matchRegEx = this.getValue(this.resourceConfig.matchRegEx, this.overrideConfig.matchRegEx);
          }
        } catch (error) {
          this.logException(error, null, {
            "resourceUri": resourceUri,
            "reason": `${TelemetryEventNames.ArmConfigMergeError}: Error while merging armConfig.`,
            "field": "matchRegEx"
          });
          throw error;
        }


        //currConfig.searchSuffix
        try {
          if (this.getValue(this.resourceConfig.searchSuffix, this.overrideConfig.searchSuffix) != null) {
            currConfig.searchSuffix = this.getValue(this.resourceConfig.searchSuffix, this.overrideConfig.searchSuffix);
          }
        } catch (error) {
          this.logException(error, null, {
            "resourceUri": resourceUri,
            "reason": `${TelemetryEventNames.ArmConfigMergeError}: Error while merging armConfig.`,
            "field": "searchSuffix"
          });
          throw error;
        }


        //currConfig.azureServiceName
        try {
          if (this.getValue(this.resourceConfig.azureServiceName, this.overrideConfig.azureServiceName) != null) {
            currConfig.azureServiceName = this.getValue(this.resourceConfig.azureServiceName, this.overrideConfig.azureServiceName);
          }
        } catch (error) {
          this.logException(error, null, {
            "resourceUri": resourceUri,
            "reason": `${TelemetryEventNames.ArmConfigMergeError}: Error while merging armConfig.`,
            "field": "azureServiceName"
          });
          throw error;
        }


        //currConfig.armApiConfig
        try {
          if(this.overrideConfig.armApiConfig && !this.resourceConfig.armApiConfig) {
            //armApiConfig present only in override.json
            currConfig.armApiConfig = this.overrideConfig.armApiConfig;
          }
          else {
            if(!this.overrideConfig.armApiConfig && this.resourceConfig.armApiConfig) {
              //armApiConfig present only in config.json
              currConfig.armApiConfig = this.resourceConfig.armApiConfig;
            }
            else {
              let currArmApiConfig:ArmApiConfig = {
                armApiVersion:'',
                isArmApiResponseBase64Encoded:false
              };
              if(this.overrideConfig.armApiConfig && this.resourceConfig.armApiConfig) {
                //armApiConfig is not present in both configs. Merge.

                //armApiConfig.armApiVersion
                try{
                  if (!!this.getValue(this.resourceConfig.armApiConfig.armApiVersion, this.overrideConfig.armApiConfig.armApiVersion)) {
                    currArmApiConfig.armApiVersion = this.getValue(this.resourceConfig.armApiConfig.armApiVersion, this.overrideConfig.armApiConfig.armApiVersion);
                  }
                }
                catch(error) {
                  this.logException(error, null, {
                    "resourceUri": resourceUri,
                    "reason": `${TelemetryEventNames.ArmConfigMergeError}: Error while merging armConfig.`,
                    "field": "armApiConfig.armApiVersion"
                  });
                  throw error;
                }

                //armApiConfig.isArmApiResponseBase64Encoded
                try{
                  if (!!this.getValue(this.resourceConfig.armApiConfig.isArmApiResponseBase64Encoded, this.overrideConfig.armApiConfig.isArmApiResponseBase64Encoded)) {
                    currArmApiConfig.isArmApiResponseBase64Encoded = this.getValue(this.resourceConfig.armApiConfig.isArmApiResponseBase64Encoded, this.overrideConfig.armApiConfig.isArmApiResponseBase64Encoded);
                  }
                }
                catch(error) {
                  this.logException(error, null, {
                    "resourceUri": resourceUri,
                    "reason": `${TelemetryEventNames.ArmConfigMergeError}: Error while merging armConfig.`,
                    "field": "armApiConfig.isArmApiResponseBase64Encoded"
                  });
                  throw error;
                }
              }
              //Update the merged config.
              currConfig.armApiConfig = currArmApiConfig;
            }
          }
        } catch (error) {
          this.logException(error, null, {
            "resourceUri": resourceUri,
            "reason": `${TelemetryEventNames.ArmConfigMergeError}: Error while merging armConfig.`,
            "field": "armApiConfig"
          });
          throw error;
        }


        //currConfig.isSearchEnabled
        try {
          if (this.getValue(this.resourceConfig.isSearchEnabled, this.overrideConfig.isSearchEnabled) != null) {
            currConfig.isSearchEnabled = this.getValue(this.resourceConfig.isSearchEnabled, this.overrideConfig.isSearchEnabled);
          }
        } catch (error) {
          this.logException(error, null, {
            "resourceUri": resourceUri,
            "reason": `${TelemetryEventNames.ArmConfigMergeError}: Error while merging armConfig.`,
            "field": "isSearchEnabled"
          });
          throw error;
        }


        //currConfig.pesId
        try {
          if (this.getValue(this.resourceConfig.pesId, this.overrideConfig.pesId) != null) {
            currConfig.pesId = this.getValue(this.resourceConfig.pesId, this.overrideConfig.pesId);
          }
        } catch (error) {
          this.logException(error, null, {
            "resourceUri": resourceUri,
            "reason": `${TelemetryEventNames.ArmConfigMergeError}: Error while merging armConfig.`,
            "field": "pesId"
          });
          throw error;
        }


        //currConfig.liveChatConfig
        try {
          if (this.overrideConfig.liveChatConfig && !this.resourceConfig.liveChatConfig) {
            currConfig.liveChatConfig = this.overrideConfig.liveChatConfig;
          }
          else {
            if (!this.overrideConfig.liveChatConfig && this.resourceConfig.liveChatConfig) {
              currConfig.liveChatConfig = this.resourceConfig.liveChatConfig;
            }
            else {
              let currLiveChatConfig: LiveChatConfig = {
                isApplicableForLiveChat: false,
                supportTopicIds: []
              };
              if (this.getValue(this.resourceConfig.liveChatConfig.isApplicableForLiveChat, this.overrideConfig.liveChatConfig.isApplicableForLiveChat)) {
                currLiveChatConfig.isApplicableForLiveChat = this.getValue(this.resourceConfig.liveChatConfig.isApplicableForLiveChat, this.overrideConfig.liveChatConfig.isApplicableForLiveChat);
              }

              //Process supported support topics for live chat
              let currMergedSupportTopicIds: string[] = [];

              if (this.overrideConfig.liveChatConfig.supportTopicIds && this.overrideConfig.liveChatConfig.supportTopicIds.length > 0 &&
                (!this.resourceConfig.liveChatConfig.supportTopicIds
                  || (this.resourceConfig.liveChatConfig.supportTopicIds && this.resourceConfig.liveChatConfig.supportTopicIds.length < 1)
                )
              ) {
                //Valid support topics exist only in overrideConfig
                currMergedSupportTopicIds = this.overrideConfig.liveChatConfig.supportTopicIds;
              }
              else {
                if (this.resourceConfig.liveChatConfig.supportTopicIds && this.resourceConfig.liveChatConfig.supportTopicIds.length > 0 &&
                  (!this.overrideConfig.liveChatConfig.supportTopicIds
                    || (this.overrideConfig.liveChatConfig.supportTopicIds && this.overrideConfig.liveChatConfig.supportTopicIds.length < 1)
                  )
                ) {
                  //Valid support topics exist only in resourceConfig
                  currMergedSupportTopicIds = this.resourceConfig.liveChatConfig.supportTopicIds;
                }
                else {
                  if (this.overrideConfig.liveChatConfig.supportTopicIds && this.resourceConfig.liveChatConfig.supportTopicIds &&
                    this.overrideConfig.liveChatConfig.supportTopicIds.length > 0 && this.resourceConfig.liveChatConfig.supportTopicIds.length > 0
                  ) {
                    //Support topics exist in both resourceConfig and overrideConfig, merge them
                    currMergedSupportTopicIds = this.overrideConfig.liveChatConfig.supportTopicIds.concat(this.resourceConfig.liveChatConfig.supportTopicIds);

                    //Make sure that we have distinct values after merging.
                    currMergedSupportTopicIds = currMergedSupportTopicIds.filter(this.distinctStringValues);

                    if (currMergedSupportTopicIds.findIndex((currEntry: string) => { return currEntry === '*' }) > -1) {
                      currMergedSupportTopicIds = [];
                      //* means enabled for all support topics. So if we find it, make sure it is the only entry.
                      //This will help with perf later.
                      currMergedSupportTopicIds.push('*');
                    }

                    //Convert each entry to lowercase
                    currMergedSupportTopicIds.filter((value: string, index: number, self: string[]) => {
                      self[index] = self[index].toLowerCase();
                    });

                  } //Else of this means that support topics do not exist in either and it is fine since we already initialize currMergedSupportTopicIds as an empty array.
                }
              }
              currLiveChatConfig.supportTopicIds = currMergedSupportTopicIds;
              currConfig.liveChatConfig = currLiveChatConfig;
            }
          }
        } catch (error) {
          this.logException(error, null, {
            "resourceUri": resourceUri,
            "reason": `${TelemetryEventNames.ArmConfigMergeError}: Error while merging armConfig.`,
            "field": "liveChatConfig"
          });
          throw error;
        }


        //currConfig.categories
        try {
          if (this.overrideConfig.categories && !this.resourceConfig.categories) {
            currConfig.categories = this.overrideConfig.categories.filter(cat => { return cat.id !== '' });
          }
          else {
            if (!this.overrideConfig.categories && this.resourceConfig.categories) {
              currConfig.categories = this.resourceConfig.categories.filter(cat => { return cat.id !== '' });
            }
            else {

              var processedCategories: string[] = [];
              let mergedCategories: Category[] = [];
              let currMergedCategory: Category = {
                id: '',
                name: '',
                overviewDetectorId: '',
                description: '',
                keywords: [],
                color: '',
                createFlowForCategory: true,
                chatEnabled: false
              };

              this.resourceConfig.categories.forEach(currCat => {

                var categoryToCompare: Category = null;
                this.overrideConfig.categories.some(overrideCat => {
                  if (overrideCat.id === currCat.id) {
                    categoryToCompare = overrideCat;
                    return true;
                  }
                })

                if (categoryToCompare) {
                  //currConfig.categories[x].id
                  currMergedCategory.id = categoryToCompare.id;

                  //currConfig.categories[x].name
                  if (categoryToCompare.name || currCat.name) {
                    currMergedCategory.name = this.getValue(currCat.name, categoryToCompare.name);
                  }

                  //currConfig.categories[x].description
                  if (categoryToCompare.description || currCat.description) {
                    currMergedCategory.description = this.getValue(currCat.description, categoryToCompare.description);
                  }

                  //currConfig.categories[x].keywords
                  if (categoryToCompare.keywords || currCat.keywords) {
                    currMergedCategory.keywords = this.getValue(currCat.keywords, categoryToCompare.keywords);
                  }

                  //currConfig.categories[x].color
                  if (categoryToCompare.color || currCat.color) {
                    currMergedCategory.color = this.getValue(currCat.color, categoryToCompare.color);
                  }

                  //currConfig.categories[x].createFlowForCategory
                  if (this.getValue(currCat.createFlowForCategory, categoryToCompare.createFlowForCategory) != null) {
                    currMergedCategory.createFlowForCategory = this.getValue(currCat.createFlowForCategory, categoryToCompare.createFlowForCategory);
                  }

                  //currConfig.categories[x].chatEnabled
                  if (this.getValue(currCat.chatEnabled, categoryToCompare.chatEnabled) != null) {
                    currMergedCategory.chatEnabled = this.getValue(currCat.chatEnabled, categoryToCompare.chatEnabled);
                  }

                  mergedCategories.push(currMergedCategory);
                  processedCategories.push(currMergedCategory.id);
                }
                else {
                  mergedCategories.push(currCat);
                  processedCategories.push(currCat.id);
                }
              });

              //Check to see if there was a config placed in the override that we haven't already processed

              this.overrideConfig.categories.forEach(currCat => {
                if (currCat.id != '') {
                  if (processedCategories.indexOf(currCat.id) < 0) {
                    mergedCategories.push(currCat);
                    processedCategories.push(currCat.id);
                  }
                }
              });

              //Override the default for all categories. Look for a category with empty id in override and then use it to override every category value in merged categories

              this.overrideConfig.categories.some(currCat => {
                if (currCat.id == '') {
                  mergedCategories.forEach(mergedCat => {

                    //Check to see if this overriding was already processed.
                    //If an element with the same id is found, then it was already processed. No need to apply the global rules here.
                    var tempCat: Category;
                    tempCat = this.overrideConfig.categories.find((element) => {
                      return element.id === mergedCat.id;
                    });
                    if (!tempCat) {
                      //Override keywords
                      if (currCat.keywords && currCat.keywords.length > 0) {
                        var mergedArray: string[];
                        mergedArray = (mergedCat.keywords.join(',') + ',' + currCat.keywords.join(',')).split(',');
                        mergedArray.forEach(strElement => {
                          if (mergedCat.keywords.indexOf(strElement) < 0) {
                            mergedCat.keywords.push(strElement);
                          }
                        });
                      }

                      //Override color
                      if (!mergedCat.color) {
                        mergedCat.color = this.getValue(mergedCat.color, currCat.color);
                      }

                      //Override createFlowForCategory
                      if (this.getValue(mergedCat.createFlowForCategory, currCat.createFlowForCategory) != null) {
                        mergedCat.createFlowForCategory = this.getValue(mergedCat.createFlowForCategory, currCat.createFlowForCategory);
                      }

                      //Override chatEnabled
                      if (this.getValue(mergedCat.chatEnabled, currCat.chatEnabled) != null) {
                        mergedCat.chatEnabled = this.getValue(mergedCat.chatEnabled, currCat.chatEnabled);
                      }
                    }
                  });

                  return true;
                }
              });
              if (mergedCategories.length > 0) {
                currConfig.categories = mergedCategories;
              }
            }
          }
        } catch (error) {
          this.logException(error, null, {
            "resourceUri": resourceUri,
            "reason": `${TelemetryEventNames.ArmConfigMergeError}: Error while merging armConfig.`,
            "field": "categories"
          });
          throw error;
        }


        //currConfig.quickLinks
        try {
          if (this.getValue(this.resourceConfig.quickLinks, this.overrideConfig.quickLinks) != null) {
            currConfig.quickLinks = this.getValue(this.resourceConfig.quickLinks, this.overrideConfig.quickLinks);
          }
        } catch (error) {
          this.logException(error, null, {
            "resourceUri": resourceUri,
            "reason": `${TelemetryEventNames.ArmConfigMergeError}: Error while merging armConfig.`,
            "field": "quickLinks"
          });
          throw error;
        }

        //currConfig.keystoneDetectorId
        try {
          if (this.getValue(this.resourceConfig.keystoneDetectorId, this.overrideConfig.keystoneDetectorId) != null) {
            currConfig.keystoneDetectorId = this.getValue(this.resourceConfig.keystoneDetectorId, this.overrideConfig.keystoneDetectorId);
          }
        } catch (error) {
          this.logException(error, null, {
            "resourceUri": resourceUri,
            "reason": `${TelemetryEventNames.ArmConfigMergeError}: Error while merging armConfig.`,
            "field": "keystoneDetectorId"
          });
          throw error;
        }

          //currConfig.riskAlertConfigs
          try {
            if (this.getValue(this.resourceConfig.riskAlertConfigs, this.overrideConfig.riskAlertConfigs) != null) {
              currConfig.riskAlertConfigs = this.getValue(this.resourceConfig.riskAlertConfigs, this.overrideConfig.riskAlertConfigs);
            }
          } catch (error) {
            this.logException(error, null, {
              "resourceUri": resourceUri,
              "reason": `${TelemetryEventNames.ArmConfigMergeError}: Error while merging armConfig.`,
              "field": "riskAlertConfigs"
            });
            throw error;
          }

            //currConfig.notificationConfig
        try {
            if (this.getValue(this.resourceConfig.notificationConfig, this.overrideConfig.notificationConfig) != null) {
              currConfig.notificationConfig = this.getValue(this.resourceConfig.notificationConfig, this.overrideConfig.notificationConfig);
            }
          } catch (error) {
            this.logException(error, null, {
              "resourceUri": resourceUri,
              "reason": `${TelemetryEventNames.ArmConfigMergeError}: Error while merging armConfig.`,
              "field": "notificationConfig"
            });
            throw error;
          }

          //currConfig.disableGenie
          try {
            if (this.getValue(this.resourceConfig.disableGenie, this.overrideConfig.disableGenie) != null) {
              currConfig.disableGenie = this.getValue(this.resourceConfig.disableGenie, this.overrideConfig.disableGenie);
            }
          } catch (error) {
            this.logException(error, null, {
              "resourceUri": resourceUri,
              "reason": `${TelemetryEventNames.ArmConfigMergeError}: Error while merging armConfig.`,
              "field": "disableGenie"
            });
            throw error;
          }

        this.resourceMap.push(currConfig);
        return currConfig;
      })
    );
  }


  getArmResourceConfig(resourceUri: string, recurse?: boolean): ArmResourceConfig {
    let returnValue: ArmResourceConfig = new ArmResourceConfig();
    if (this.resourceMap.length > 0) {
      this.resourceMap.some((resource: ArmResourceConfig) => {
        const matchPattern: RegExp = new RegExp(`${resource.matchRegEx.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}`, "i");
        var result = resourceUri.match(matchPattern);
        if (result && result.length > 0) {
          returnValue = resource;
          return true;
        }
      });
    }
    return returnValue;
  }

  getArmApiConfig(resourceUri: string): ArmApiConfig {
    if (this.getArmResourceConfig(resourceUri) && !!this.getArmResourceConfig(resourceUri).armApiConfig) {
      return this.getArmResourceConfig(resourceUri).armApiConfig;
    }
    else {
      return null;
    }
  }

  getApiVersion(resourceUri: string): string {
    let apiVersion = '';
    if (!!this.getArmApiConfig(resourceUri) && !!this.getArmApiConfig(resourceUri).armApiVersion) {
      apiVersion = this.getArmApiConfig(resourceUri).armApiVersion;
    }
    return apiVersion;
  }

  isArmApiResponseBase64Encoded(resourceUri:string):boolean {
    if (!!this.getArmApiConfig(resourceUri) && !!this.getArmApiConfig(resourceUri).isArmApiResponseBase64Encoded) {
       return true;
    }
    else {
      return false;
    }
  }

}
