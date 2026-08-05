# Dependency installation security

This repository treats dependency lifecycle scripts as untrusted code. The default npm configuration disables scripts, and dependency installation must use this sequence:

```sh
npm ci --ignore-scripts
npm run security:audit-root
npm run deps:audit
npm run deps:rebuild
```

Do not use `npm install` in CI and do not run an untargeted `npm rebuild`. Node 22.23.2 and npm 10.9.8 are required and can be checked with `npm run verify:runtime`.

The targeted rebuild runner passes only a narrow environment allowlist, uses an isolated temporary home and npm cache, and does not forward registry, deployment, cloud, or database credentials.

`scripts/dependency-lifecycle-policy.json` pins each reviewed dependency declaration by exact package name, version, lifecycle name, and command. The audit fails if any installed dependency adds or changes a `preinstall`, `install`, or `postinstall` declaration. It also treats npm's implicit `node-gyp rebuild` for packages with `binding.gyp` as an install script.

## Reviewed dependency lifecycle declarations

| Package                               | Declaration   | Policy           | Review result                                                                                                                                                                      |
| ------------------------------------- | ------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cpu-features@0.0.10`                 | `install`     | Skip             | Optional ssh2 acceleration. It shells out, writes build metadata, and compiles with node-gyp; ssh2's JavaScript fallback works without it.                                         |
| `esbuild@0.28.1`                      | `postinstall` | Skip             | The platform binary is already installed. Missing-binary fallback code can invoke npm or download from the registry.                                                               |
| `eslint-plugin-n8n-nodes-base@1.16.7` | `preinstall`  | Skip             | A dependency-development guard that invokes `npx only-allow pnpm`; it is incompatible with this npm project and may download code.                                                 |
| `isolated-vm@6.1.2`                   | `install`     | Targeted rebuild | Selects a packaged native prebuild. The runner proves the module loads before and after the exact `isolated-vm@6.1.2` rebuild, so its node-gyp compile fallback cannot be reached. |
| `ssh2@1.15.0`                         | `install`     | Skip             | Attempts to compile an optional native crypto binding by shelling out to node-gyp. The JavaScript implementation loads without it.                                                 |
| `unrs-resolver@1.12.2`                | `postinstall` | Skip             | The platform binding is already installed. Its missing-binding fallback can invoke npm or download a tarball.                                                                      |

None of the reviewed scripts scans credentials, establishes persistence, contains obfuscation, or writes outside its package directory. The skipped scripts are kept disabled because they are unnecessary and expose network, shell, or native-build behavior. The approved `isolated-vm` command invokes a local executable through npm's lifecycle shell and only selects the shipped prebuild after the runner's load check.

## Root scripts

The root policy separately asserts that `preinstall`, `install`, `postinstall`, `prepare`, `prebuild`, and `postbuild` are absent; `build` is exactly `n8n-node build`; and `prepublishOnly` is exactly `n8n-node prerelease`. CI invokes lint, tests, and build explicitly. Packaging and publishing use `--ignore-scripts`, so the n8n `prepublishOnly` guard is not used as a build step; publishing is restricted to the tag-triggered workflow and uses an already-validated tarball.
