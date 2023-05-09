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
}

/*export enum UserFeedbackType {
    Like = "like",
    Dislike = "dislike",
    None = "none"
}*/

export enum MessageSource {
    User = "user",
    System = "system"
}

export enum ChatAlignment {
    Left = "left",
    Center = "center"
}