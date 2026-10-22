import { execFileSync } from 'node:child_process';

const expectedNode = 'v22.23.4';
const expectedNpm = '10.9.8';
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const actualNpm = execFileSync(npmCommand, ['--version'], { encoding: 'utf8' }).trim();

if (process.version !== expectedNode || actualNpm !== expectedNpm) {
	console.error(
		`Runtime mismatch: expected Node ${expectedNode} / npm ${expectedNpm}, found Node ${process.version} / npm ${actualNpm}`,
	);
	process.exitCode = 1;
} else {
	console.log(`Runtime verified: Node ${process.version} / npm ${actualNpm}`);
}
