'use strict';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as cp from 'child_process';
import * as tmp from "tmp";

const dumpError = e => {
	if (e) console.log('elm-format err:', e);
	return [];
};

function format(document, range) : Promise<string> {
	const originalText = document.getText(document.validateRange(range));
		return new Promise((resolve, reject) => {
		tmp.file({ postfix: '.elm' }, (err, path, fd, cleanupCallback) => {
			if (err) throw err;

			console.log("Creating a temporary .elm file: ", path);

			fs.write(fd, originalText, () => {
				console.log("Executing elm-format");
				let bStderr = new Buffer(0);
				const process = cp.spawn('elm-format', [path, '--yes']);
				
				console.log(process.pid);
				
				if (!process.pid) {
					reject("Unable to execute elm-format. Please make sure you have elm-format on your PATH");
				}

				process.stderr.on('data', (stderr) => {
					bStderr = Buffer.concat([bStderr, new Buffer(stderr)]);
				});
				
				process.stdout.on('data', (data: Buffer) => {
					console.log(data.toString());
				});
				
				process.stdout.on('end', function (code) {
					if (!!code) { reject(bStderr.toString()); }

					fs.readFile(path, (err, data) => {
						cleanupCallback();
						const newText = data.toString();
						console.log(newText);
						resolve(newText);
					});
				});
			});
		});

	});
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
			})
			.catch((err) => {
				vscode.window.showErrorMessage(err);
			});
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {
}