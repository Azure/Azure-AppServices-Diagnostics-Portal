import { Component, ViewEncapsulation, } from '@angular/core';

@Component({
    templateUrl: 'network-checks.component.html',
    styleUrls: ['../styles/daasstyles.scss', './network-checks.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class NetworkCheckComponent{
    title: string = 'Network/Connectivity Troubleshooter';
    description: string = 'Check your network connectivity and troubleshoot network issues';
    constructor(){
        if (window["debugMode"]){
            this.title += " - debug mode";
        }
    }
}