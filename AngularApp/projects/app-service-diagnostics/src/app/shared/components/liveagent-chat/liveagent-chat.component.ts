import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'liveagent-chat',
  template: ''
})
export class LiveAgentChatComponent implements OnInit {
  @Input() autoOpen: boolean = false;
  @Input() source: string = '';

  constructor() {}

  ngOnInit(): void {}
}
