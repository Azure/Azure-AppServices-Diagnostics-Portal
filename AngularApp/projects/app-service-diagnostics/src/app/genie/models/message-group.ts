import { Message } from './message';

export class MessageGroup {
  constructor(
    public key: string,
    public messages: Message[] = [],
    public next_key: () => string = () => ''
  ) {}
}
