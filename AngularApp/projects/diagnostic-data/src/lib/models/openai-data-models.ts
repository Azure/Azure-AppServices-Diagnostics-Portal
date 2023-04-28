export interface TextCompletionModel {
    model: TextModels;
    prompt: string;
    temperature: number;
    max_tokens: number;
}

export interface CodeCompletionModel {
    model: CodeModels;
    prompt: string;
    temperature: number;
    max_tokens: number;
}

export enum TextModels {
    Default = "text-davinci-003",
    /*Davinci = "text-davinci-002",
    Ada = "text-ada-001",
    Curie = "text-curie-001",
    Babbage = "text-babbage-001"*/
}

export enum CodeModels {
    Default = "code-davinci-002",
    Davinci = "code-davinci-002",
    Cushman = "code-cushman-001"
}

export enum ResponseTokensSize {
    Small = 50,
    Medium = 100,
    Large = 500,
    XLarge = 1000
}

/*
It is very important to understand temperature before using it.
The temperature determines how greedy the generative model is.

- If the temperature is low, the probabilities to sample other but the class with the highest log probability will be small,
    and the model will probably output the most correct text, but rather boring, with small variation.

- If the temperature is high, the model can output, with rather high probability, other words than those with the highest probability.
    The generated text will be more diverse, but there is a higher possibility of grammar mistakes and generation of nonsense.
*/
export enum QueryTemperature {
    Low = 0.1,
    Medium = 0.3,
    High = 0.5,
    Hot = 0.8
}

export function CreateTextCompletionModel(text: string, model: TextModels = TextModels.Default, responseSize: ResponseTokensSize = ResponseTokensSize.Small, queryTemperature: QueryTemperature = QueryTemperature.Low): TextCompletionModel {
    return {
        model: TextModels.Default,
        prompt: `${text}`,
        temperature: queryTemperature,
        max_tokens: responseSize
    };
}

export interface OpenAIAPIResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: OpenAIResponseText[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    }
}

export interface OpenAIResponseText {
    text: string;
    index: number;
    logprobs: string;
    finish_reason: string;
}