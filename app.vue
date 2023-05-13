<script setup lang="ts">
const transcription = ref("");
const chatContext = ref("");
const recognition: Ref<SpeechRecognition> = ref(null) as any;

const grammar = `
#JSGF V1.0;
grammar tech;

public <brands> = (Apple | Google | Microsoft | Amazon | Facebook | Twitter | IBM | Oracle | Cisco | Intel | HP);
public <tools> = (Figma | Notion | Trello | Asana | Jira | Slack | Zoom | GitHub | GitLab | VS Code | IntelliJ | PyCharm | Sublime Text | Atom | Docker | Kubernetes);
public <projects> = (Notion Charts | Ava | Pulsar | Juicery | 42 School | Ecole 42);
public <peach> =  Peach /pitch/;

public <tech> = <brands> | <tools> | <projects> | <peach>;
`;

function startListening() {
  recognition.value.start();
}

function stopListening() {
  recognition.value.stop();
}

async function askGpt(prompt: string) {
  return useFetch("/api/prompt", {
    method: "POST",
    body: prompt,
  });
}

function speak(text: string) {
  return new Promise(async (resolve) => {
    const message = new SpeechSynthesisUtterance(text);
    message.lang = "fr-FR";

    // Get a list of available voices
    const voices = speechSynthesis.getVoices();

    // Find a voice with the desired language
    const frenchVoice = voices.find((voice) => voice.lang === "fr-FR");

    if (frenchVoice) {
      // Set the voice of the message
      message.voice = frenchVoice;
    }

    speechSynthesis.cancel();
    speechSynthesis.speak(message);

    while (speechSynthesis.pending || speechSynthesis.speaking) {
      await new Promise((r) => setTimeout(r, 500));
    }

    resolve(true);
  });
}

onMounted(() => {
  recognition.value = new (window.SpeechRecognition ||
    window.webkitSpeechRecognition)();

  recognition.value.lang = "fr-FR";
  recognition.value.continuous = true;
  recognition.value.filter_profanities = false;

  const speechRecognitionList = new window.webkitSpeechGrammarList();
  speechRecognitionList.addFromString(grammar, 1);
  recognition.value.grammars = speechRecognitionList;

  recognition.value.onresult = async function (event) {
    console.log(event.results);
    recognition.value.stop();
    transcription.value = Array.from(event.results)
      .map((x) => Array.from(x).map((y) => y.transcript))
      .flat()
      .join("\n");
    const res = await askGpt(
      Array.from(Array.from(event.results).reverse()[0])
        .map((y) => y.transcript)
        .join("\n")
    );

    chatContext.value = res?.data?.value?.choices?.[0]?.message?.content || "";
    for (const sentence of res?.data?.value?.choices?.[0]?.message?.content?.split?.(
      /\.\?\!/
    ) || []) {
      await speak(sentence + ".");
    }
    recognition.value.start();
  };

  console.log("Component mounted.");
});

onUnmounted(() => {
  console.log("Component unmounted.");
});
</script>

<template>
  <div>
    <h1>Speech Recognition API + GPT-3.5 + Speech Synthesis API</h1>
    <button @click="startListening">Start Listening</button>
    <button @click="stopListening">Stop Listening</button>
    <p v-if="transcription">{{ transcription }}</p>

    <br />
    <br />

    <p>{{ chatContext }}</p>
  </div>
</template>
