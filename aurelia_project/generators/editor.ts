import { Project, ProjectItem, CLIOptions, UI } from 'aurelia-cli';
import { autoinject } from 'aurelia-dependency-injection';
import * as fs from 'fs';

@autoinject()
export default class EditorGenerator {
    constructor(private project: Project, private options: CLIOptions, private ui: UI) { }

    async execute() {
        const gameName = await this.ui.ensureAnswer(this.options.args[0], 'What is the name of the game?');
        const scid = await this.ui.ensureAnswer(this.options.args[1], 'What is the game\'s SCID?');

        const folderName = this.project.makeFileName(gameName);
        const className = this.project.makeClassName(gameName.replace(/ /g, ''));

        this.project.editors.add(
            ProjectItem.text(`${folderName}/index.ts`, this.generateSource(className)),
            ProjectItem.text(`${folderName}/index.html`, defaultMarkup),
        );

        const editorsPath = this.project.editors.name;
        const titlesFile = editorsPath + '.ts';

        let titles = fs.readFileSync(titlesFile, 'utf8');
        titles = titles.slice(0, -2) + this.generateTitleDefinition(gameName, scid, folderName) + '\r\n];';

        fs.writeFileSync(titlesFile, titles, 'utf8');
        await this.project.commitChanges();

        this.ui.log(`Created ${gameName} save editor in ${editorsPath}/${folderName}`);
    }

    private generateSource(className: string): string {
        return `import { SaveEditor } from '../../save-editor';
import { Stream } from '../../../utility/stream';

export class ${className} implements SaveEditor {
    private io: Stream;

    public load(io: Stream): void {
        this.io = io;
        // TODO: Read save data
    }

    public save(): Stream {
        // TODO: Write save data
        return this.io;
    }
}`
    }

    private generateTitleDefinition(gameName: string, scid: string, folder: string): string {
        return `    {
        name: '${gameName}',
        scid: '${scid}',
        thumbnailUrl: 'static/images/emblem.svg',
        editors: [
            {
                src: '${folder}/index',
                name: '${gameName} Editor',
                fileFilter: null, // TODO
            }
        ]
    },`
    }
}

const defaultMarkup = `<template>
	<header>Category 1</header>
	<section>
		<label>Unlimited Ammo</label>
		<switch value.bind="unlimitedAmmo"></switch>
	</section>
</template>`;