import fs from "fs";
import path from "path";
import OpenAI from "openai";

const args = process.argv.slice(2);
type VoiceJSONTYPE = Record<'en'|'fr'|'jp',{
    "title": string,
    "voice": string,
    "text": string
}[]>
const shouldOverwrite = args.includes("--overwrite") || args.includes("-o");
const dontCopyVoiceJson = args.includes("--copy") || args.includes("-c");

// Get API_KEY from CLI arg
const apiKey = args.find(arg =>arg.startsWith('sk-'))
if (!apiKey) {
    console.error("Please provide the OpenAI API key as a command line argument.");
    process.exit(1);
}

const voiceInputs = fs.readFileSync(path.resolve('./voices.json'), 'utf-8');
const inputs = JSON.parse(voiceInputs) as VoiceJSONTYPE

const openai = new OpenAI({
    apiKey: apiKey,
});

for(const [language,values] of Object.entries(inputs)) {
    if(values.length === 0) continue;
    for(const input of values) {
        let name = `${language}-${input.title}`
        const speechFile = path.resolve(`./public/audio/${name}.mp3`);
        const index = values.indexOf(input);
        inputs[language][index].path = '/'+path.relative(path.resolve(`./public`),speechFile).replace(/\\/g, '/');

        if (!shouldOverwrite && fs.existsSync(speechFile)) {
            console.log(`File ${name}.mp3 already exists. Use --overwrite to overwrite.`);
            continue;
        }

        const mp3 = await openai.audio.speech.create({
            model: "gpt-4o-mini-tts",//'tts-1-hd'
            voice: input.voice,
            input: input.text,
            instructions: `
            Voice Affect: Calm, chipmunk-like high pitch.
            Pacing: Steady and moderate; unhurried enough to communicate care, yet efficient enough to demonstrate professionalism.
            `,
            speed: 0.7,
          });
        const buffer = Buffer.from(await mp3.arrayBuffer());
        await fs.promises.writeFile(speechFile, buffer);

    }

}


if (!dontCopyVoiceJson) {
    const jsonFile = path.resolve(`./src/data/voices.json`);
    await fs.promises.writeFile(jsonFile, JSON.stringify(inputs, null, 2));
    console.log(`Wrote ${jsonFile}`);
}

