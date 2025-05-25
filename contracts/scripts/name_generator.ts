import { uniqueNamesGenerator, Config, adjectives, colors, names } from 'unique-names-generator';
import fs from 'fs';

const customConfig: Config = {
  dictionaries: [adjectives, names],
  separator: ' ',
  length: 2,
};

export function generateName(): string {
    const nameLength = Math.ceil(Math.random()*2)
    if(nameLength==1){
        customConfig.dictionaries = [names];
    }else {
        customConfig.dictionaries = [adjectives, names];
    }
    customConfig.length = nameLength;
  return uniqueNamesGenerator(customConfig);
}

export function generate1KNames (): string[] {
    const names: string[] = [];
    for (let i = 0; i < 1000; i++) {
        let name =generateName()
        while(names.includes(name)) {
            name = generateName();
        }

        // Make sure first letter is capitalized
        name = name.charAt(0).toUpperCase() + name.slice(1);

        names.push(name);
    }

    // Dump into a JSON file

    //current path
    const currentPath = process.cwd();
    // Create a directory called 'data' if it doesn't exist
    const dataDir = `${currentPath}/data`;
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }

    // Write the names to a JSON file
    const filePath = `${dataDir}/names.json`;
    fs.writeFileSync(filePath, JSON.stringify(names, null, 2), 'utf8');

    return names;
}

generate1KNames()