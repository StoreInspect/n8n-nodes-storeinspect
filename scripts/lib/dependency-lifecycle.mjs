import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const lifecycleNames = ['preinstall', 'install', 'postinstall'];

const scriptsDirectory = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const projectRoot = path.dirname(scriptsDirectory);
export const policyPath = path.join(scriptsDirectory, 'dependency-lifecycle-policy.json');

export function packageKey(name, version) {
	return `${name}@${version}`;
}

export function loadPolicy() {
	const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));

	if (policy.schemaVersion !== 1 || !Array.isArray(policy.packages)) {
		throw new Error(`Unsupported lifecycle policy in ${path.relative(projectRoot, policyPath)}`);
	}

	const entries = new Map();
	for (const entry of policy.packages) {
		const key = packageKey(entry.name, entry.version);
		if (entries.has(key)) throw new Error(`Duplicate lifecycle policy entry: ${key}`);
		if (!['rebuild', 'skip'].includes(entry.action)) {
			throw new Error(`Invalid lifecycle action for ${key}: ${entry.action}`);
		}
		if (!entry.scripts || Object.keys(entry.scripts).length === 0) {
			throw new Error(`Lifecycle policy entry has no scripts: ${key}`);
		}
		for (const scriptName of Object.keys(entry.scripts)) {
			if (!lifecycleNames.includes(scriptName)) {
				throw new Error(`Invalid lifecycle name for ${key}: ${scriptName}`);
			}
		}
		entries.set(key, entry);
	}

	return { policy, entries };
}

function lifecycleScripts(packageDirectory, manifest) {
	const scripts = {};
	for (const scriptName of lifecycleNames) {
		if (typeof manifest.scripts?.[scriptName] === 'string') {
			scripts[scriptName] = manifest.scripts[scriptName];
		}
	}

	if (
		fs.existsSync(path.join(packageDirectory, 'binding.gyp')) &&
		scripts.preinstall === undefined &&
		scripts.install === undefined
	) {
		scripts.install = 'node-gyp rebuild (implicit npm default)';
	}

	return scripts;
}

function packageDirectories(nodeModulesDirectory) {
	if (!fs.existsSync(nodeModulesDirectory)) return [];

	const directories = [];
	const entries = fs
		.readdirSync(nodeModulesDirectory, { withFileTypes: true })
		.sort((left, right) => left.name.localeCompare(right.name));

	for (const entry of entries) {
		if (entry.name === '.bin' || entry.name.startsWith('.')) continue;
		const entryPath = path.join(nodeModulesDirectory, entry.name);

		if (entry.isSymbolicLink()) {
			throw new Error(`Refusing symlinked dependency directory: ${entryPath}`);
		}
		if (!entry.isDirectory()) continue;

		if (entry.name.startsWith('@')) {
			for (const scopedEntry of fs
				.readdirSync(entryPath, { withFileTypes: true })
				.sort((left, right) => left.name.localeCompare(right.name))) {
				if (scopedEntry.isSymbolicLink()) {
					throw new Error(
						`Refusing symlinked dependency directory: ${path.join(entryPath, scopedEntry.name)}`,
					);
				}
				if (scopedEntry.isDirectory()) directories.push(path.join(entryPath, scopedEntry.name));
			}
		} else {
			directories.push(entryPath);
		}
	}

	return directories;
}

export function scanInstalledDependencies(root = projectRoot) {
	const records = [];

	function scanNodeModules(nodeModulesDirectory) {
		for (const packageDirectory of packageDirectories(nodeModulesDirectory)) {
			const manifestPath = path.join(packageDirectory, 'package.json');
			if (!fs.existsSync(manifestPath)) {
				throw new Error(`Dependency directory has no package.json: ${packageDirectory}`);
			}

			const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
			const scripts = lifecycleScripts(packageDirectory, manifest);
			if (Object.keys(scripts).length > 0) {
				records.push({
					name: manifest.name,
					version: manifest.version,
					directory: packageDirectory,
					location: path.relative(root, packageDirectory),
					scripts,
				});
			}

			scanNodeModules(path.join(packageDirectory, 'node_modules'));
		}
	}

	scanNodeModules(path.join(root, 'node_modules'));
	return records.sort((left, right) =>
		`${left.name}@${left.version}:${left.location}`.localeCompare(
			`${right.name}@${right.version}:${right.location}`,
		),
	);
}

function equalScripts(actual, expected) {
	return JSON.stringify(actual) === JSON.stringify(expected);
}

export function auditInstalledDependencies(root = projectRoot) {
	const { policy, entries } = loadPolicy();
	const records = scanInstalledDependencies(root);
	const seen = new Set();
	const errors = [];

	for (const record of records) {
		if (!record.name || !record.version) {
			errors.push(`Invalid dependency identity at ${record.location}`);
			continue;
		}

		const key = packageKey(record.name, record.version);
		const entry = entries.get(key);
		if (!entry) {
			errors.push(
				`Unapproved lifecycle dependency ${key} at ${record.location}: ${JSON.stringify(record.scripts)}`,
			);
			continue;
		}

		seen.add(key);
		if (!equalScripts(record.scripts, entry.scripts)) {
			errors.push(
				`Lifecycle script mismatch for ${key} at ${record.location}: expected ${JSON.stringify(entry.scripts)}, found ${JSON.stringify(record.scripts)}`,
			);
		}
	}

	for (const entry of policy.packages) {
		const key = packageKey(entry.name, entry.version);
		if (!entry.optional && !seen.has(key))
			errors.push(`Required lifecycle dependency is missing: ${key}`);
	}

	return { policy, records, errors };
}
