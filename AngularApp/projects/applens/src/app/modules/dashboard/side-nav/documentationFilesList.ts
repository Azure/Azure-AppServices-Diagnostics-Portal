export class DocumentationFilesList{
    static list: string[] = [];

    constructor(){}

    public addDocument(name: string){
        DocumentationFilesList.list.push(name);
    }
    public getDocumentListOptions(){
        let options: {key:string, text:string}[] = [];
        DocumentationFilesList.list.forEach(element => {
            options.push({
                key: element,
                text: element
            });
        });
        return options;
    }
}