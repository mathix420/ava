import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from "openai"

const configuration = new Configuration({apiKey: ''});
const openai = new OpenAIApi(configuration, 'https://free.churchless.tech/v1/');

const history: ChatCompletionRequestMessage[] = []

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    console.log(body, history)

    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [...history, {"role": "user", "content": body}]
    });

    if (completion.data.choices[0].message) {
      history.push({"role": "user", "content": body})
      history.push(completion.data.choices[0].message)
    }

    console.log(completion.data.choices[0].message);

    return completion.data
})