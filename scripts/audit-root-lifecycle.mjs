import fs from 'node:fs';
import path from 'node:path';
import { loadPolicy, policyPath, projectRoot } from './lib/dependency-lifecycle.mjs';

try {
	const manifestPath = path.join(projectRoot, 'package.json');
	const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
	const { policy } = loadPolicy();
	const errors = [];

	for (const [scriptName, expected] of Object.entries(policy.rootScripts)) {
		const actual = manifest.scripts?.[scriptName] ?? null;
		if (actual !== expected) {
			errors.push(
				`${scriptName}: expected ${JSON.stringify(expected)}, found ${JSON.stringify(actual)}`,
			);
		}
	}

	if (errors.length > 0) {
		console.error(`Root lifecycle policy mismatch (${path.relative(projectRoot, policyPath)}):`);
		for (const error of errors) console.error(`ERROR: ${error}`);
		process.exitCode = 1;
	} else {
		for (const [scriptName, command] of Object.entries(policy.rootScripts)) {
			console.log(`${scriptName}: ${command ?? 'absent'}`);
		}
		console.log('Root lifecycle audit passed.');
	}
} catch (error) {
	console.error(error instanceof Error ? error.stack : error);
	process.exitCode = 1;
}
