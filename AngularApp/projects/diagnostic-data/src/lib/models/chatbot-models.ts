export interface ChatMessage{
    id: string;
    message: string;
    messageSource: MessageSource;
    timestamp: number;
    messageDisplayDate: string;
    renderingType: MessageRenderingType;
    userFeedback: UserFeedbackType;
    status: MessageStatus;
}

export enum MessageRenderingType{
    Text = "text",
    Markdown = "markdown",
    Code = "code"
}

export enum MessageStatus{
    Created = 0,
    Waiting = 1,
    InProgress = 2,
    Finished = 3,
}

export enum UserFeedbackType {
    Like = "like",
    Dislike = "dislike",
    None = "none"
}

export enum MessageSource {
    User = "user",
    System = "system"
}