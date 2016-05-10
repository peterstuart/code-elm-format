'use strict';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as cp from 'child_process';
import * as tmp from "tmp";

const dumpError = e => {
	if (e) console.log('elm-format err:', e);
	return [];
};


// registered on actiation
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('elm-format.format', formatCommand));
	startOnSaveWatcher(context.subscriptions);
}

function startOnSaveWatcher(subscriptions: vscode.Disposable[]) {
	let ignoreNextSave = new WeakSet<vscode.TextDocument>();
	
	vscode.workspace.onDidSaveTextDocument(document => {
		if (document.languageId !== 'elm' || ignoreNextSave.has(document)) {
			return;
		}
		
		const config = vscode.workspace.getConfiguration('elm-format');
		const active = vscode.window.activeTextEditor;	
		const range = new vscode.Range(0, 0, document.lineCount, document.getText().length);
		
		if (config['formatOnSave'] && active.document === document) {
			format()
			.then(() => {
				ignoreNextSave.add(document);
				return document.save();
			})
			.then(() => {
				ignoreNextSave.delete(document);
			});
		}
	}, null, subscriptions);
}

function formatCommand () {
	format()
	.then(() => {
		vscode.window.showInformationMessage('Succesfully formatting your Elm code.');
	});
}

function format() {
	const active = vscode.window.activeTextEditor;
	if (!active) return;
	if (!active.document) return;
	const document = active.document;
	const range = new vscode.Range(0, 0, document.lineCount, document.getText().length);

	const originalText = document.getText(document.validateRange(range));
	return createTmp(originalText)
		.then(runElmFormat)
		.then(readFile)
		.then(newText => updateEditor(newText, active, range))
		.catch(err => {
			vscode.window.showErrorMessage(err);
		});		
}

function updateEditor(newText, active, range) : Promise<string> {
	return active.edit(editor => editor.replace(range, newText));
}

function createTmp(originalText : string) : Promise<string> {
	return new Promise((resolve, reject) => {
		tmp.file({ postfix: '.elm' }, (err, path, fd) => {
			if (err) throw err;

			console.log("Creating a temporary .elm file: ", path);

			fs.write(fd, originalText, () => {
				resolve(path);
			});
		});	
	});
}

function runElmFormat(path) : Promise<string> {
	return new Promise((resolve, reject) => {
		console.log("Executing elm-format");
		
		let bStderr = new Buffer(0);
		const process = cp.spawn('elm-format', [path, '--yes']);
		
		if (!process.pid) {
			reject("Unable to execute elm-format. Please make sure you have elm-format on your PATH");
		}

		process.stderr.on('data', (stderr) => {
			bStderr = Buffer.concat([bStderr, new Buffer(stderr)]);
		});
		
		process.stdout.on('end', function (code) {
			if (!!code) { reject(bStderr.toString()); }
			resolve(path);
		});	
	});
}

function readFile(path) : Promise<string> {
	return new Promise((resolve, reject) => {
			fs.readFile(path, (err, data) => {
				if (err) {
					reject(err);
				} else {
					resolve(data.toString());					
				}
			});
	});
}

// this method is called when your extension is deactivated
export function deactivate() {
}