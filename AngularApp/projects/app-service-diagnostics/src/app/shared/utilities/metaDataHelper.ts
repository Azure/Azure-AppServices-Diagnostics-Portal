import { INameValuePair } from '../models/namevaluepair';
import {
  ApplicationRestartInfo,
  InstanceInfo,
  SiteDaasInfo
} from '../models/solution-metadata';

export class MetaDataHelper {
  static getMetaDataValue(metaData: INameValuePair[][], key: string): string {
    const searchKey = key.toLowerCase();
    let returnValue = null;
    if (metaData && metaData.length > 0) {
      metaData.forEach((element) => {
        element.forEach((nameValuePair) => {
          if (nameValuePair.name.toLowerCase() === searchKey) {
            returnValue = nameValuePair.value;
          }
        });
      });
    }
    return returnValue;
  }

  static getMetaDataValues(
    metaData: INameValuePair[][],
    key: string
  ): string[] {
    const values: string[] = [];
    const searchKey = key.toLowerCase();
    if (metaData && metaData.length > 0) {
      metaData.forEach((element) => {
        element.forEach((nameValuePair) => {
          if (nameValuePair.name.toLowerCase() === searchKey) {
            values.push(nameValuePair.value);
          }
        });
      });
    }

    return values;
  }

  static getSiteDaasData(metaData: INameValuePair[][]): SiteDaasInfo {
    if (metaData.length > 0) {
      const siteNameWithSlot = MetaDataHelper.getValueForName(
        metaData[0],
        'sitename'
      );
      let siteName = '';
      let slotName = '';

      if (siteNameWithSlot.indexOf('(') >= 0) {
        const parts = siteNameWithSlot.split('(');
        siteName = parts[0];
        slotName = parts[1].replace(')', '');
      } else {
        siteName = siteNameWithSlot;
      }

      const siteDaasInfo: SiteDaasInfo = {
        resourceUri: '',
        subscriptionId: MetaDataHelper.getValueForName(
          metaData[0],
          'subscriptionid'
        ),
        resourceGroupName: MetaDataHelper.getValueForName(
          metaData[0],
          'resourcegroup'
        ),
        siteName: siteName,
        slot: slotName,
        instances: []
      };

      return siteDaasInfo;
    }
  }

  static getRestartData(metaData: INameValuePair[][]): ApplicationRestartInfo {
    if (metaData.length > 0) {
      const restartInfo: ApplicationRestartInfo = {
        resourceUri: '',
        subscriptionId: MetaDataHelper.getValueForName(
          metaData[0],
          'subscriptionid'
        ),
        resourceGroupName: MetaDataHelper.getValueForName(
          metaData[0],
          'resourcegroup'
        ),
        siteName: MetaDataHelper.getValueForName(metaData[0], 'sitename'),
        slot: '', // In this case slot is part of siteName - TODO: reconsider changing this on back end
        instances: []
      };

      return restartInfo;
    }
  }

  static getAdvancedApplicationRestartData(
    metaData: INameValuePair[][]
  ): ApplicationRestartInfo {
    if (metaData.length > 0) {
      const restartInfo = this.getRestartData(metaData);

      metaData.forEach((nameValuePairSet: INameValuePair[]) => {
        restartInfo.instances.push(<InstanceInfo>{
          machineName: MetaDataHelper.getValueForName(
            nameValuePairSet,
            'machinename'
          ),
          instanceId: MetaDataHelper.getValueForName(
            nameValuePairSet,
            'instanceid'
          )
        });
      });

      return restartInfo;
    }
  }

  static getValueForName(
    nameValuePairSet: INameValuePair[],
    name: string
  ): string {
    const matchingNameValuePair = nameValuePairSet.find(
      (nvp) => nvp.name.toLowerCase() === name.toLowerCase()
    );
    return matchingNameValuePair && matchingNameValuePair.value
      ? matchingNameValuePair.value
      : '';
  }
}
