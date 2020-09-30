export class PIIUtilities {
    public static removePII(text: string) {
        //IE is not compatiable with some regex syntax
        const isIE_Browser = /msie\s|trident\//i.test(window.navigator.userAgent);
        if(isIE_Browser) {
            return text;
        }

        let res = text;

        res = this.maskPhone(res);
        res = this.maskEmails(res);
        res = this.maskIPV4Address(res);
        res = this.maskPassword(res);
        res = this.maskQueryString(res);
        return res;
    }

    public static maskPhone(text: string) {
        let res = text;
        try {
            const regexStr = "(\+?\d?\d?\d?)([\d\-)\(\s]{10})";
            const regex = new RegExp(regexStr,"g");
            res = text.replace(regex, " ********** ");
        } catch (e) {
            
        }
        return res;
    }

    public static maskEmails(text: string) {
        let res = text;
        try {
            const regexStr = "(?<=[\w]{1})[\w-\._\+%]*(?=@([\w-_]+)[\.]{0})";
            const regex = new RegExp(regexStr,"g");
            res = text.replace(regex, s => "*".repeat(s.length));
        } catch (e) {

        }
        return res;
    }

    public static maskIPV4Address(text: string) {
        let res = text;
        try {
            const regexStr = "(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])";

            const regex = new RegExp(regexStr,"g");
            res = text.replace(regex, s => s.split(".")[0] + '.' + s.split(".")[1] + '.' + s.split(".")[2] + '.XXX'
            );
        } catch (e) {

        }
        return res;
    }

    public static maskPassword(text: string) {
        let res = text;
        try {
            const regexStr = "(?<=(\bpass\b)|(\bpwd\b)|(\bpassword\b)|(\buserpass\b))[^\w\r\n]+(.+)";
            const regex = new RegExp(regexStr,"gi");
            res = text.replace(regex, ":****");
        } catch (e) {

        }
        return res;
    }

    public static maskQueryString(text: string) {
        let res = text;
        try {
            const regexStr = "(?<=https?:\/\/[\w\.-_%]+\?)([\w-\._&%]+=[\w-\._%]+)+";
            const regex = new RegExp(regexStr,"g");
            res = text.replace(regex, "****");
        } catch (e) {

        }
        return res;
    }
}