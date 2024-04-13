import { GenezioDeploy } from "@genezio/types";
import OpenAI from "openai";
import dotenv from 'dotenv'
dotenv.config();


export enum Season {
  Winter = "Winter",
  Summer = "Summer"
}

/**
 * This class represents a hello world server that can be deployed on genezio infrastructure
 * using "genezio deploy" command or tested locally using "genezio local".
 */
@GenezioDeploy()
export class HelloWorld {
  private openai: OpenAI | null = null;
  constructor(){
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_SECRET_KEY,
    });
  }
  /**
  * Method that returns a "Hello world" message.
  */
  async helloWorld() {
    console.log("Hello world request received!")
    return "Hello world!";
  }

  /**
   * Method that returns a personalized "Hello world" message.
   */
  hello(name: string, from: string, value: Season): string {
    console.log(`Hello world request received with name ${name} from ${from} value ${value}!`)

    const message = `Hello, ${name}, from ${from} during this ${value}`;
    console.log(message)

    return message
  }

  async askChatGPT(requestText: string) {
    const completion = await this.openai?.chat.completions.create({
      // the used model at the moment of writing this article
      model: "gpt-3.5-turbo",
      // tells ChatGPT to rephrase the requestText
      messages: [{ role: "user", content: "rephrase this:" + requestText }],
    });

    console.log(
      `DEBUG: request: ${requestText}, response: ${completion?.choices[0].message}`
    );
    return completion?.choices[0].message.content;
  }
}
