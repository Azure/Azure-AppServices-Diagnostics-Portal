class Logging {
    shellSrc = "";
    constructor(shellSrc) {
        this.shellSrc = shellSrc;
    }

    postMessage(verb, data) {
        if (LoggingUtilities.inIFrame()) {
            let dataString = data;
            try {
                var dataJsonObject = data === null ? {} : JSON.parse(data);
                const dataObjectWithEventType = {
                    signature: LoggingUtilities.iFrameSignature,
                    eventType: verb,
                    ...dataJsonObject,
                }

                dataString = JSON.stringify(dataObjectWithEventType);
            }
            catch (error) {
            }

            window.parent.postMessage({
                signature: LoggingUtilities.portalSignature,
                kind: verb,
                data: dataString
            }, this.shellSrc);
        }
    }

    logAction(subcomponent, action, data) {
        const actionStr = JSON.stringify({
            subcomponent: subcomponent,
            action: action,
            data: data
        });
        this.postMessage(LoggingUtilities.logAction, actionStr);
    }

    logEvent(eventMessage, properties) {
        const eventProp = {
            ...properties,
            'url': window.location.href
        };
        this.logAction('diagnostic-data', eventMessage, eventProp);
    }
}

class LoggingUtilities {
    static portalSignature = "FxFrameBlade";
    static iFrameSignature = 'AppServiceDiagnosticsIFrame'
    static logAction = "log-action";

    static monitoringTimeout = 30;
    static portalBlankPageEvent = "PortalBlankPage";
    static startMonitoringIFrame = "StartMonitoringIFrame";

    static inIFrame() {
        return window.parent !== window;
    }

    static getQueryMap() {
        const query = window.location.search.substring(1);
        const parameterList = query.split('&');
        const map = {};
        for (let i = 0; i < parameterList.length; i++) {
            const pair = parameterList[i].split('=');
            map[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }

        return map;
    }

    static getQueryStringParameter(name) {
        return this.getQueryMap()[name] || '';
    }
}


function monitoring() {
    const shellSrc = LoggingUtilities.getQueryStringParameter("trustedAuthority");
    const logger = new Logging(shellSrc);
    logger.postMessage("initializationcomplete",null);
    logger.logEvent(LoggingUtilities.startMonitoringIFrame,{});
    let timer = setTimeout(() => {
        const eles = document.getElementsByTagName("sc-app");
        for (const ele of eles) {
            if (ele.innerText.length === 0) {
                logger.logEvent(LoggingUtilities.portalBlankPageEvent, {});
            }
        }
        clearTimeout(timer);
    }, LoggingUtilities.monitoringTimeout * 1000);
}

monitoring();




