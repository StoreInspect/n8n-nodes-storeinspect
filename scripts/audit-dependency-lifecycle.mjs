import { auditInstalledDependencies, packageKey } from './lib/dependency-lifecycle.mjs';

try {
	const { policy, records, errors } = auditInstalledDependencies();
	if (errors.length > 0) {
		for (const error of errors) console.error(`ERROR: ${error}`);
		process.exitCode = 1;
	} else {
		for (const record of records) {
			const entry = policy.packages.find(
				(candidate) =>
					packageKey(candidate.name, candidate.version) === packageKey(record.name, record.version),
			);
			console.log(
				`${entry.action.toUpperCase()} ${record.name}@${record.version} (${record.location})`,
			);
		}
		console.log(
			`Lifecycle audit passed: ${records.length} installed lifecycle declarations are reviewed.`,
		);
	}
} catch (error) {
	console.error(error instanceof Error ? error.stack : error);
	process.exitCode = 1;
}
