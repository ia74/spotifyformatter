const fs = require('fs');
const home = require('os').homedir();
const target = home + '\\AppData\\Roaming\\Spotify\\Apps\\xpui.spa'

const zip = require('adm-zip');

const injectHost = fs.readFileSync('inject.html', 'utf8');

const { exec } = require('child_process');

exec('taskkill /F /IM spotify.exe', (error, stdout, stderr) => {
    if (error && error.message.includes('not found')) {
		console.log('Spotify not open! Still continuing')
	}
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
	console.log('Probably killed Spotify.')
	inject();
});

function inject() {
	const Zip = new zip(target);

	const targetSpaFile = Zip.getEntry('index.html');

	const targetSpa = Zip.readAsText(targetSpaFile);

	const inject = targetSpa.replace(/<\/body><\/html>/, injectHost); // injectHost has the closing tags

	Zip.updateFile('index.html', inject);

	Zip.writeZip(target);

	console.log('Injected loader into Spotify.');
}