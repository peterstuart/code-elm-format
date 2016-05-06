'use strict';
import * as vscode from 'vscode';

const dumpError = e => {
	if (e) console.log('elm-format err:', e);
	return [];
};

function format(document, range) {
    const originalText = document.getText(document.validateRange(range));
    return Promise.resolve(originalText + "Test 123");
}

// registered on actiation
export function activate(context: vscode.ExtensionContext) {
	
    context.subscriptions.push(vscode.commands.registerCommand('elm-format.format', () => {
		const active = vscode.window.activeTextEditor;
		if (!active) return;
		if (!active.document) return;
		const range = new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE);
		
		format(active.document, range)
			.then(newText => {
                vscode.window.showInformationMessage('Succesfully formatting your Elm code.');
                return active.edit(editor => editor.replace(range, newText));
            }, dumpError);
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {
}