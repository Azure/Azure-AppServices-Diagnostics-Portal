import { TelemetryService } from 'diagnostic-data';
import { Globals } from 'projects/app-service-diagnostics/src/app/globals';
import { stringify } from 'querystring';
import { ResponseMessageEnvelope } from '../../../models/responsemessageenvelope';
import { Site, SiteInfoMetaData } from '../../../models/site';
import { ArmService } from '../../../services/arm.service';
import { SiteService } from '../../../services/site.service';

enum ConnectionCheckStatus { success, timeout, hostNotFound, blocked, refused }
export enum OutboundType { SWIFT, gateway };
export enum InboundType { privateEndpoint, serviceEndpoint }

function delay(second: number): Promise<void> {
    return new Promise(resolve =>
        setTimeout(resolve, second * 1000));
}

export class DiagProvider {
    private _siteInfo: SiteInfoMetaData & Site & { fullSiteName: string };
    private _armService: ArmService;
    private _siteService: SiteService;
    private _globals: Globals;
    private _dict: Map<string, any>;
    public portalDomain: string;
    public scmHostName: string;
    private _telemetryService: TelemetryService;
    constructor(siteInfo: SiteInfoMetaData & Site & { fullSiteName: string }, armService: ArmService, siteService: SiteService, portalDomain: string, globals: Globals, telemetryService: TelemetryService) {
        this._siteInfo = siteInfo;
        this._armService = armService;
        this._siteService = siteService;
        this._globals = globals;
        this._telemetryService = telemetryService;
        this._dict = new Map<string, any>();
        var scmHostNameState = this._siteInfo.hostNameSslStates.filter(h => h.hostType == 1)[0];
        this.scmHostName = scmHostNameState == null ? null : scmHostNameState.name;
        this.portalDomain = portalDomain;
        armService.clearCache();
    }


    public get logException() {
        return this._telemetryService.logException.bind(this._telemetryService);
    }

    public generateResourcePortalLink(resourceUri: string): string {
        if (resourceUri.startsWith("/")) {
            resourceUri = resourceUri.substr(1);
        }
        return `${this.portalDomain}/#@/resource/${resourceUri}`;
    }

    public async getVNetIntegrationStatusAsync() {
        var result = { isVnetIntegrated: false, outboundType: <OutboundType>null, outboundSubnets: [], inboundType: <InboundType>null, inboundSubnets: [], siteVnetInfo: null };
        var siteArmId = this._siteInfo["id"];
        var siteVnetInfo = await this.getWebAppVnetInfo();
        result.siteVnetInfo = siteVnetInfo;
        if (siteVnetInfo != null) {
            var subnetResourceId = siteVnetInfo.properties["subnetResourceId"];
            if (subnetResourceId != null) {
                result.isVnetIntegrated = true;
                result.outboundType = OutboundType.SWIFT;
            } else {
                var siteGWVnetInfo = await this.getArmResourceAsync(siteArmId + "/virtualNetworkConnections");

                if (siteGWVnetInfo.length > 0) {
                    result.isVnetIntegrated = true;
                    result.outboundType = OutboundType.gateway;
                }
            }
        }
        return result;
    }

    public getArmResourceAsync(resourceUri: string, apiVersion?: string, invalidateCache: boolean = false): Promise<any> {
        var stack = new Error("error_message_placeholder").stack;
        var key = "GET;" + resourceUri + ";" + apiVersion;
        if (!invalidateCache && this._dict.has(key)) {
            return this._dict.get(key);
        }
        var result = this._armService.requestResource<any, any>("GET", resourceUri, null, apiVersion)
            .toPromise()
            .then(t => {
                var result = t.body;
                result.status = t.status;
                return result;
            })
            .catch(e => {
                e.stack = stack.replace("error_message_placeholder", e.message || "");
                this._globals.logDebugMessage(e);

                if (e.status != null) {
                    return e;
                }
                throw e;
            });
        this._dict.set(key, result);
        return result;
    }

    public postResourceAsync<T, S>(resourceUri: string, body?: S, apiVersion?: string, invalidateCache: boolean = false, appendBodyToCacheKey: boolean = false): Promise<boolean | {} | ResponseMessageEnvelope<T>> {
        return this.postArmResourceAsync(resourceUri, body, apiVersion, invalidateCache, appendBodyToCacheKey);
    }

    public postArmResourceAsync<T, S>(resourceUri: string, body?: S, apiVersion?: string, invalidateCache: boolean = false, appendBodyToCacheKey: boolean = false): Promise<boolean | {} | ResponseMessageEnvelope<T>> {
        var stack = new Error("error_message_placeholder").stack;
        return this._armService.postResource<T, S>(resourceUri, body, apiVersion, invalidateCache, appendBodyToCacheKey)
            .toPromise()
            .catch(e => {
                e.stack = stack.replace("error_message_placeholder", e.message || "");
                throw e;
            });
    }

    public requestResourceAsync<T, S>(method: string, resourceUri: string, body?: S, apiVersion?: string): Promise<boolean | {} | ResponseMessageEnvelope<T>> {
        var stack = new Error("error_message_placeholder").stack;
        return this._armService.requestResource<T, S>(method, resourceUri, body, apiVersion)
            .toPromise()
            .catch(e => {
                if (e.status != null) {
                    return e;
                }
                e.stack = stack.replace("error_message_placeholder", e.message || "");
                throw e;
            });
    }

    public postDaaSExtApiAsync(api: string, body?: any, timeoutInSec: number = 15): Promise<any> {
        var params = "api-version=2015-08-01";
        var prefix = `management.azure.com/${this._siteInfo.resourceUri}/extensions/DaaS/api`;
        var stack = new Error("error_message_placeholder").stack;
        var promise = this._armService.post(`https://${prefix}/${api}?${params}`, body)         
            .toPromise()
            .catch(e => {
                e.stack = stack.replace("error_message_placeholder", e);
                throw e;
            });
        var timeoutPromise = delay(timeoutInSec).then(() => {
            throw new Error(`postDaaSExtApiAsync timeout after ${timeoutInSec}s`);
        });
        return Promise.race([promise, timeoutPromise]);
    }
    public getAppSettingApiAsync(api: string, params = [], timeoutInSec: number = 15): Promise<any> {      
        var prefix = `management.azure.com/${this._siteInfo.resourceUri}/extensions/DaaS/api`;
        var stack = new Error("error_message_placeholder").stack;
        var promise = this._armService.get(`https://${prefix}/${api}?${params.join("&")}`)         
            .toPromise()
            .catch(e => {
                e.stack = stack.replace("error_message_placeholder", e);
                throw e;
            });     
            var timeoutPromise = delay(timeoutInSec).then(() => {
                throw new Error(`postDaaSExtApiAsync timeout after ${timeoutInSec}s`);
            });
            return Promise.race([promise, timeoutPromise]);        
    }
    public getDaaSVersionAsync(api: string, timeoutInSec: number = 15): Promise<any> {      
        var params = "api-version=2015-08-01";
        var prefix = `management.azure.com/${this._siteInfo.resourceUri}/extensions/DaaS/api`;  
        var stack = new Error("error_message_placeholder").stack;
        var promise = this._armService.get(`https://${prefix}/${api}?${params}`)      
            .toPromise()
            .catch(e => {
                e.stack = stack.replace("error_message_placeholder", e);
                throw e;
            });     
            var timeoutPromise = delay(timeoutInSec).then(() => {
                throw new Error(`getDaaSVersionAsync timeout after ${timeoutInSec}s`);
            });
            return Promise.race([promise, timeoutPromise]);        
    }

    public async checkConnectionStringAsync(connectionString: string, type: string, timeoutInSec: number = 30): Promise<any> {
        var result: any = await this.postDaaSExtApiAsync("connectionstringvalidation/validate", { "ConnectionString": connectionString, "Type": type }, timeoutInSec);
        return result;       
    }
    public async checkConnectionViaAppSetting(appSetting: string, type: string, entityName?: string, timeoutInSec: number = 30): Promise<any> {
        var param = [];
        param.push("api-version=2015-08-01");
        param.push("appSettingName="+appSetting);
        param.push("type="+type);
        if(entityName != undefined){
            param.push("entityName="+entityName);  
        }
        var response: any = await this.getAppSettingApiAsync("connectionstringvalidation/validateappsetting", param, timeoutInSec);
        if(response == null && response.body == null)
        {
          throw Error("something went wrong while checking connection string via app setting");
        }
        return response.body;        
    }

    public getKuduApiAsync(uri: string, instance?: string, timeoutInSec: number = 15, scm = false): Promise<any> {
        var stack = new Error("error_message_placeholder").stack;
        var params = [];
        if (instance != null) {
            params.push(`instance=${instance}`);
        }
        return this.getExtensionApiAsync("api/" + uri, params, timeoutInSec, scm);
    }

    public getExtensionApiAsync(uri: string, params = [], timeoutInSec: number = 15, scm = false): Promise<any> {
        var stack = new Error("error_message_placeholder").stack;
        var prefix = scm ? this.scmHostName : `management.azure.com/${this._siteInfo.resourceUri}/extensions`;
        if (!scm) {
            params.push("api-version=2015-08-01");
        }
        return this._armService.get(`https://${prefix}/${uri}?${params.join("&")}`)
            .toPromise()
            .catch(e => {
                e.stack = stack.replace("error_message_placeholder", e.message || e);
                throw e;
            });
    }

    public postKuduApiAsync(uri: string, body?: any, instance?: string, timeoutInSec: number = 15, scm = false): Promise<any> {
        var params = [instance == null ? null : `instance=${instance}`, scm ? null : "api-version=2015-08-01"].filter(s => s != null).join("&");
        var postfix = (params == "" ? "" : `?${params}`);
        var prefix = scm ? this.scmHostName : `management.azure.com/${this._siteInfo.resourceUri}/extensions`;
        var stack = new Error("error_message_placeholder").stack;
        var promise = this._armService.post(`https://${prefix}/api/${uri}${postfix}`, body)
            .toPromise()
            .catch(e => {
                e.stack = stack.replace("error_message_placeholder", e.message || "");
                throw e;
            });
        var timeoutPromise = delay(timeoutInSec).then(() => {
            throw new Error(`postKuduApiAsync timeout after ${timeoutInSec}s`);
        });
        return Promise.race([promise, timeoutPromise]);
    }

    public async runKuduCommand(command: string, dir?: string, instance?: string, timeoutInSec?: number): Promise<any> {
        var result: any = await this.postKuduApiAsync("command", { "command": command, "dir": dir }, instance, timeoutInSec);
        return result.Output.slice(0, -2);
    }

    public getEnvironmentVariablesAsync(names: string[], instance?: string) {
        var stack = new Error("error_message_placeholder").stack;
        var promise = (async () => {
            names = names.map(n => `%${n}%`);
            var echoPromise = this.runKuduCommand(`echo ${names.join(";")}`, undefined, instance).catch(e => {
                this._globals.logDebugMessage("getEnvironmentVariables failed", e);
                e.message = "getEnvironmentVariablesAsync failed:" + e.message;
                throw e;
            });
            var result = await echoPromise;
            result = result.split(";").map((r, i) => r == names[i] ? null : r);
            return result;
        })();

        return promise.catch(e => {
            e.stack = stack.replace("error_message_placeholder", e.message || "");
            throw e;
        });
    }

    public async tcpPingAsync(hostname: string, port: number, count: number = 1, timeout: number = 10, instance?: string): Promise<{ status: ConnectionCheckStatus, statuses: ConnectionCheckStatus[] }> {
        var stack = new Error("error_message_placeholder").stack;
        var promise = (async () => {
            // TODO: implement tcpping in DaaS extension to replace the CLI
            var pingPromise = this.runKuduCommand(`tcpping -n ${count} -w ${timeout} ${hostname}:${port}`, undefined, instance).catch(e => {
                this._globals.logDebugMessage("tcpping failed", e);
                return null;
            });
            var pingResult = await pingPromise;

            var statuses: ConnectionCheckStatus[] = [];
            if (pingResult != null) {
                var splited = pingResult.split("\r\n");
                for (var i in splited) {
                    var line = splited[i];
                    if (line.startsWith("Connected to ")) {
                        statuses.push(ConnectionCheckStatus.success);
                    } else if (line.includes("No such host is known")) {
                        statuses.push(ConnectionCheckStatus.hostNotFound);
                    } else if (line.includes("Connection timed out")) {
                        statuses.push(ConnectionCheckStatus.timeout);
                    } else if (line.startsWith("Connection attempt failed: An attempt was made to access a socket")) {
                        statuses.push(ConnectionCheckStatus.blocked);
                    } else if (line.startsWith("Complete")) {
                        break;
                    } else {
                        throw new Error(`tcpPingAsync: unknown status ${pingResult}`);
                    }
                }
            }
            var status: ConnectionCheckStatus = statuses.some(s => s == ConnectionCheckStatus.success) ? ConnectionCheckStatus.success : statuses[0];
            return { status, statuses };
        })();

        return promise.catch(e => {
            e.stack = stack.replace("error_message_placeholder", e.message || "");
            throw e;
        });
    }

    public async nameResolveAsync(hostname: string, dns: string, instance?: string): Promise<{ ip: string, aliases: string }> {
        var ip: string = null, aliases: string = null;
        if (this.isIp(hostname)) {
            ip = hostname;
        } else {
            try {
                // TODO: implement nameresolver in DaaS extension to replace the CLI
                var result = await this.runKuduCommand(`nameresolver ${hostname} ${dns || ""}`, undefined, instance);
                if (result != null) {
                    if (result.includes("Aliases")) {
                        var match = result.match(/Addresses:\s*([\S\s]*)Aliases:\s*([\S\s]*)$/);
                        if (match != null) {
                            ip = match[1].split("\r\n").filter(i => i.length > 0).join(";");
                            aliases = match[2].split("\r\n").filter(i => i.length > 0).join(";");
                        }
                    } else {
                        var match = result.match(/Addresses:\s*([\S\s]*)$/);
                        if (match != null) {
                            ip = match[1].split("\r\n").map(s => s.trim()).filter(s => s.length > 0).join(";");
                        }
                    }
                }
            } catch (e) {

            }
        }
        return { ip, aliases };
    }

    public async nameResolveByDaasAsync(hostname: string, instance?: string): Promise<{ ip: string, aliases: string }> {
        var ip: string = null, aliases: string = null;
        if (this.isIp(hostname)) {
            ip = hostname;
        } else {
            // TODO: implement nameresolver in DaaS extension to replace the CLI
            var resp = await this.getExtensionApiAsync("DaaS/api/nameresolver", [`hostname=${hostname}`]);
            if (resp != null && resp.body != null) {
                var result = resp.body;
                if (result.Status == "success") {
                    ip = result.IpAddresses.join(";");
                }else if(result.Status == "host not found"){
                    ip = "";
                }
                else{
                    throw new Error("DaaS nameresolver failed, result: " + stringify(result));
                }
            } else {
                throw new Error("DaaS nameresolver response is null, response: " + stringify(resp));
            }
        }
        return { ip, aliases };
    }

    public async checkKuduReachable(timeoutInSec: number): Promise<boolean> {
        try {
            var result = await this.runKuduCommand("echo ok", undefined, undefined, timeoutInSec);
            return result == "ok";
        } catch (error) {
            return false;
        }
    }

    public async checkDaasExtReachable(timeoutInSec: number): Promise<boolean> {
        try {
            var result = await this.checkConnectionStringAsync("dummy-connection-string", "BlobStorageAccount");

            return (result != undefined);
        } catch (error) {
            return false;
        }
    }
    public async getDaasVersion(): Promise<any> {        
        
        var daasVersionInfo = await this.getDaaSVersionAsync("daasversion");
        return daasVersionInfo;
    }
    public async getWebAppVnetInfo(): Promise<any> {
        //This is the regional VNet Integration endpoint
        var swiftUrl = this._siteInfo["id"] + "/config/virtualNetwork";
        var siteVnetInfo = await this.getArmResourceAsync(swiftUrl, "2018-02-01");
        return siteVnetInfo;
    }

    public async getWebConfigAsync(): Promise<any> {
        //This is the regional VNet Integration endpoint
        var swiftUrl = this._siteInfo["id"] + "/config/web";
        var webConfig = await this.getArmResourceAsync(swiftUrl, "2018-02-01");
        return webConfig;
    }

    public isIp(s: string, ipV4Only = false) {
        if (s.match(/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/)) {
            // ipv4
            return true;
        } else if (!ipV4Only && s.match(/^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$/)) {
            // ipv6
            return true;
        }
        return false;
    }

    public async getAppSettings(): Promise<any> {
        var siteInfo = this._siteInfo;
        return (await this._siteService.getSiteAppSettings(siteInfo.subscriptionId, siteInfo.resourceGroupName, siteInfo.siteName, siteInfo.slot).toPromise()).properties
    }
}
