export class PortalUtils {
    
    static getBrowserType = () => {  
        const userAgent = navigator.userAgent;  
          
        if (userAgent.indexOf("Firefox") > -1) {  
          return "Mozilla Firefox";  
        } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {  
          return "Opera";  
        } else if (userAgent.indexOf("Edg") > -1) {  
          return "Microsoft Edge";  
        } else if (userAgent.indexOf("Chrome") > -1) {  
          return "Google Chrome";  
        } else if (userAgent.indexOf("Safari") > -1) {  
          return "Apple Safari";  
        } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) {  
          return "Microsoft Internet Explorer";  
        } else {  
          return "Unknown Browser";  
        }  
      }
}