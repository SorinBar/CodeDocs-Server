import { GenezioDeploy } from "@genezio/types";
import OpenAI from "openai";
import dotenv from 'dotenv'

dotenv.config();

export enum Language {
  Ro = "Ro",
  En = "En"
};

export interface AIResponse {
  status: String,
  data: String
};

const SYSTEM_CONTEXT_FUNCTION: string = 
`
  Generate a documentation for a function containing:
    - params with their description
    - description of the function
    - usage containing the usage of the API

  Structure the response in a JSON compatible format such as:
  
  "{\"params\":{\"param1\":\"description1\",\"param2\":\"description2\"},\"description\":\"the whole function description\",\"usage\":\"how to use the function API\"}"
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

  async functionGenDoc(language: Language, data: string) {
    let response: AIResponse = {
      status: "success",
      data: ""
    };
    let response_str: string | null | undefined;
    
    const GPT_response = await this.openai?.chat.completions.create({
      // the used model at the moment of writing this article
      model: "gpt-3.5-turbo",
      // tells ChatGPT to rephrase the requestText
      messages: [
        {"role": "system", "content": SYSTEM_CONTEXT_FUNCTION},
        {"role": "user", "content": data}
      ]
    });

    try {
      response_str = GPT_response?.choices[0].message.content;
      console.log(response_str);
      if (response_str) {
        response.data = JSON.parse(response_str);
      } else {
        response.status = "error";
        response.data = "";
      }
    } catch (error) {
      console.log(error);
      response.status = "error";
      response.data = "";
    }

    return JSON.stringify(response);
  }
}
