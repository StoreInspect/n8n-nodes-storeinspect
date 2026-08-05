import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
	auditInstalledDependencies,
	packageKey,
	projectRoot,
} from './lib/dependency-lifecycle.mjs';

const isolatedHome = fs.mkdtempSync(path.join(os.tmpdir(), 'storeinspect-lifecycle-home-'));

function safeEnvironment() {
	const allowedNames = [
		'CI',
		'COMSPEC',
		'LANG',
		'LC_ALL',
		'PATH',
		'PATHEXT',
		'SystemRoot',
		'TEMP',
		'TMP',
		'TMPDIR',
	];
	const environment = Object.fromEntries(
		allowedNames
			.filter((name) => process.env[name] !== undefined)
			.map((name) => [name, process.env[name]]),
	);
	environment.HOME = isolatedHome;
	environment.USERPROFILE = isolatedHome;
	environment.NPM_CONFIG_USERCONFIG = process.platform === 'win32' ? 'NUL' : '/dev/null';
	environment.npm_config_cache = path.join(os.tmpdir(), 'storeinspect-npm-rebuild-cache');
	return environment;
}

function run(command, args, environment = process.env) {
	const result = spawnSync(command, args, {
		cwd: projectRoot,
		env: environment,
		stdio: 'inherit',
		shell: false,
	});
	if (result.error) throw result.error;
	if (result.status !== 0) {
		throw new Error(`${command} ${args.join(' ')} exited with status ${result.status}`);
	}
}

try {
	const { policy, records, errors } = auditInstalledDependencies();
	if (errors.length > 0) throw new Error(errors.join('\n'));

	const npmExecutable = process.env.npm_execpath;
	if (!npmExecutable) throw new Error('Run this command through `npm run deps:rebuild`.');

	for (const entry of policy.packages.filter((candidate) => candidate.action === 'rebuild')) {
		const key = packageKey(entry.name, entry.version);
		const matches = records.filter((record) => packageKey(record.name, record.version) === key);
		if (matches.length === 0) throw new Error(`Approved rebuild target is not installed: ${key}`);

		if (entry.verifyModule) {
			run(
				process.execPath,
				['-e', `require(${JSON.stringify(entry.verifyModule)})`],
				safeEnvironment(),
			);
		}

		console.log(`Rebuilding approved dependency ${key}`);
		run(
			process.execPath,
			[
				npmExecutable,
				'rebuild',
				key,
				'--ignore-scripts=false',
				'--foreground-scripts',
				'--no-audit',
				'--no-fund',
			],
			safeEnvironment(),
		);

		if (entry.verifyModule) {
			run(
				process.execPath,
				['-e', `require(${JSON.stringify(entry.verifyModule)})`],
				safeEnvironment(),
			);
		}
	}

	console.log('Approved dependency rebuilds completed.');
} catch (error) {
	console.error(error instanceof Error ? error.stack : error);
	process.exitCode = 1;
} finally {
	fs.rmSync(isolatedHome, { recursive: true, force: true });
}
