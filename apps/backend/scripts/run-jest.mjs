import { spawnSync } from "node:child_process"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const mode = process.argv[2]
const testTypes = {
  unit: "unit",
  "integration-http": "integration:http",
  "integration-modules": "integration:modules",
}

if (!testTypes[mode]) {
  console.error(`Unknown test mode: ${mode || "<missing>"}`)
  process.exit(1)
}

const jestBinary = require.resolve("jest/bin/jest")
const args = [
  "--experimental-vm-modules",
  jestBinary,
  "--runInBand",
  "--passWithNoTests",
]

if (mode !== "unit") {
  args.push("--forceExit", "--silent=false")
}

const result = spawnSync(process.execPath, args, {
  cwd: new URL("..", import.meta.url),
  env: {
    ...process.env,
    TEST_TYPE: testTypes[mode],
  },
  stdio: "inherit",
})

process.exit(result.status ?? 1)
