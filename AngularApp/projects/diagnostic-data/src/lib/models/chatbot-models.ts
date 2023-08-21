export interface ChatMessage {
    
    id: string;
    
    // message displayed to users in chat ui
    displayMessage: string;
    
    // message field used to for backend processing like api calls etc. Mostly same as displayMessage but
    //sometimes can be different when components decide to add some additional context in the message but dont want to display it to user.
    message: string;
    
    messageSource: MessageSource;
    timestamp: number;
    messageDisplayDate: string;
    renderingType: MessageRenderingType;
    userFeedback: string;
    status: MessageStatus;
}

export enum MessageRenderingType {
    Text = "text",
    Markdown = "markdown",
    Code = "code"
}

export enum MessageStatus {
    Created = 0,
    Waiting = 1,
    InProgress = 2,
    Finished = 3,
    Cancelled = 4
}

export enum MessageSource {
    User = "user",
    System = "system"
}

export enum ChatAlignment {
    Left = "left",
    Center = "center"
}

export enum ChatModel {
    GPT3 = "gpt3",
    GPT35 = "gpt35",
    GPT4 = "gpt4"
}

export enum APIProtocol {
    Rest = "rest",
    WebSocket = "websocket"
}