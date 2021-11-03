export class JsonUtilities {
    static parseData<T>(s: string): T {
        let data: T = null;
        try {
            data = <T>JSON.parse(s);
        } catch (e) {

        }
        return data;
    }
}