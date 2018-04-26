import { OperatingSystem } from "./site";

export class Category
{
    Name:string;
    Subcategories: Subcategory[]
    Collapsed: boolean = true;
    BgColor: string;
    TextColor: string;
}

export class Subcategory
{
    Name:string;    
    BgColor: string;
    TextColor:string;
    Href: string;
    OperatingSystem: OperatingSystem;
    AppStack: string;
}