import { GenezioDeploy } from "@genezio/types";
import OpenAI from "openai";
import dotenv from 'dotenv'

dotenv.config();

export enum Language {
  Ro = "Ro",
  En = "En"
};

export enum CodeType {
  Function = "Function",
  Component = "Component",
  None = "None"
};

export enum ResponseStatus {
  Success = "Success",
  Error = "Error"
}

export enum ResponseError {
  Parsing = "Error during JSON Parsing",
  GPT = "Error receiving response from GPT",
  None = "Error invalid code type in request"
}

export interface APIResponse {
  type: CodeType,
  status: ResponseStatus,
  data?: String,
  info?: ResponseError
};

const SYSTEM_CONTEXT_DECISION: string = 
`
  Tell me if the code is a function or a React component.
  Structure the response will be a single or:
  Function / Componenet / None
`;

const SYSTEM_CONTEXT_FUNCTION_EN: string = 
`
  Generate in english a documentation for a function containing:
    - name of the function
    - params with their description
    - description of the function
    - usage containing the usage of the API

  Structure the response in a JSON compatible format such as:
  
  "{\"name\":\"the name of the function without async\",\"params\":{\"param1\":\"description1\",\"param2\":\"description2\"},\"description\":\"the whole function description\",\"usage\":\"how to use the function API\"}"
`;

const SYSTEM_CONTEXT_COMPONENT_EN: string = 
`
  Generate in english a documentation for a React component containing:
    - props with their description
    - description of the component
    - usage containing the usage of the component API

  Structure the response in a JSON compatible format such as:
  
  "{\"name\":\"the name of the component\",\"props\":{\"prop1\":\"description1\",\"prop2\":\"description2\"},\"description\":\"the whole component description\",\"usage\":\"how to use the component API\"}"
`;

const SYSTEM_CONTEXT_FUNCTION_RO: string = 
`
  Genereaza in romana o documentatie pentru o functie care sa contina:
    - numele functie
    - parametri cu descrierea
    - descrierea functiei
    - modul in care putem folosii API-ul functiei

  Structureaza raspunsul intr-un JSON compatibil cu formatul:
  
  "{\"name\":\"numele functiei fara async\",\"params\":{\"parametrul1\":\"descrierea1\",\"parametrul2\":\"descrierea2\"},\"description\":\"descrierea intregii functiei\",\"usage\":\"cum se foloseste API functiei\"}"
`;

const SYSTEM_CONTEXT_COMPONENT_RO: string = 
`
  Genereaza in romana o documentatie pentru o componenta React care sa contina:
    - numele componentei
    - parametri cu descrierea
    - descrierea componentei
    - modul in care putem folosii API-ul componentei

  Structureaza raspunsul intr-un JSON compatibil cu formatul:
  
  "{\"name\":\"numele componentei\",\"props\":{\"proprietatea1\":\"descrierea1\",\"proprietatea2\":\"descrierea2\"},\"description\":\"descrierea intregii componente\",\"usage\":\"cum se foloseste API componentei\"}"
`;


@GenezioDeploy()
export class Server {
  private openai: OpenAI | null = null;
  
  constructor(){
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_SECRET_KEY,
    });
  }

  /**
  * Test method
  */
  async helloWorld() {
    console.log("Hello world request received!")
    return "Hello world!";
  }

  async generateDoc(language: Language, data: string) {
    let response_str: string | null | undefined;

    const GPT_response = await this.openai?.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {"role": "system", "content": SYSTEM_CONTEXT_DECISION},
        {"role": "user", "content": data}
      ]
    });
    response_str = GPT_response?.choices[0].message.content;
    if (response_str == CodeType.Function) {
      return await this.functionDoc(language, data);
    } else if (response_str == CodeType.Component) {
      return await this.componentDoc(language, data);
    } else {
      return JSON.stringify({
        type: CodeType.None,
        status: ResponseStatus.Error,
        info: ResponseError.None
      } as APIResponse);
    }
  }

  private async functionDoc(language: Language, data: string) {
    let response: APIResponse = {
      type: CodeType.Function,
      status: ResponseStatus.Success,
    };
    let response_str: string | null | undefined;
    let system_context: string;
    
    if (language == Language.En) {
      system_context = SYSTEM_CONTEXT_FUNCTION_EN;
    } else {
      system_context = SYSTEM_CONTEXT_FUNCTION_RO;
    }

    const GPT_response = await this.openai?.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {"role": "system", "content": system_context},
        {"role": "user", "content": data}
      ]
    });

    try {
      response_str = GPT_response?.choices[0].message.content;
      if (response_str) {
        response.data = JSON.parse(response_str);
      } else {
        response.status = ResponseStatus.Error;
        response.info = ResponseError.GPT;
      }
    } catch (error) {
      console.log(error);
      response.status = ResponseStatus.Error;
      response.info = ResponseError.Parsing;
    }

    return JSON.stringify(response);
  }

  private async componentDoc(language: Language, data: string) {
    let response: APIResponse = {
      type: CodeType.Component,
      status: ResponseStatus.Success,
      data: ""
    };
    let response_str: string | null | undefined;
    let system_context: string;

    if (language == Language.En) {
      system_context = SYSTEM_CONTEXT_COMPONENT_EN;
    } else {
      system_context = SYSTEM_CONTEXT_COMPONENT_RO;
    }

    const GPT_response = await this.openai?.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {"role": "system", "content": system_context},
        {"role": "user", "content": data}
      ]
    });

    try {
      response_str = GPT_response?.choices[0].message.content;
      if (response_str) {
        response.data = JSON.parse(response_str);
      } else {
        response.status = ResponseStatus.Error;
        response.info = ResponseError.GPT;
      }
    } catch (error) {
      console.log(error);
      response.status = ResponseStatus.Error;
      response.info = ResponseError.Parsing;
    }

    return JSON.stringify(response);
  }
}
