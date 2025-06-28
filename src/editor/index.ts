import { GitHubEditorProvider } from './providers/github-editor-provider';
import { DiskEditorProvider } from './providers/disk-editor-provider';
import { NpmEditorProvider } from './providers/npm-editor-provider';
import { FrameworkConfiguration } from 'aurelia-framework';
import { EditorManager } from './editor-manager';
import { makeDir } from '../utility/fs';
import { remote } from 'electron';
import * as path from 'path';

export async function configure(config: FrameworkConfiguration): Promise<void> {
    const editorDir = await makeDir(path.join(remote.app.getPath('userData'), 'Editors'));
    await Promise.all([
        makeDir(path.join(editorDir, 'github')),
        makeDir(path.join(editorDir, 'npm')),
    ]);
    const manager = new EditorManager();
    manager.registerProvider('disk', new DiskEditorProvider());
    manager.registerProvider('github', new GitHubEditorProvider(path.join(editorDir, 'github')));
    manager.registerProvider('npm', new NpmEditorProvider(path.join(editorDir, 'npm')));
    config.instance(EditorManager, manager);
}
