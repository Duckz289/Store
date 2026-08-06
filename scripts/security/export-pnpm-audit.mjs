import { spawnSync } from "node:child_process"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "../..")
const labelArg = process.argv.find((arg) => arg.startsWith("--label="))
const label = labelArg?.slice("--label=".length) || "current"
const outputDir = resolve(root, "docs/security")

const packageFiles = {
  root: "package.json",
  "apps/backend": "apps/backend/package.json",
  "apps/storefront": "apps/storefront/package.json",
}

const surfaceRules = [
  {
    match: (row) => row.package === "lodash" && row.chain[0] === "apps/storefront",
    surface: "Storefront server/client utility calls",
    reachability: "runtime-reachable",
    actualRisk: "medium",
    rationale: "The storefront imports isEqual, pick, and mapKeys. Exploitation still depends on advisory-specific attacker-controlled values.",
  },
  {
    match: (row) => row.package === "sharp",
    surface: "Next.js optional image optimizer dependency",
    reachability: "not-reachable-with-current-configuration",
    actualRisk: "low",
    rationale: "apps/storefront/next.config.js sets images.unoptimized to true, so the current storefront does not invoke Sharp image optimization.",
  },
  {
    match: (row) => ["postcss", "rollup", "vite"].includes(row.package),
    surface: "Admin/storefront compilation and development server",
    reachability: "build-or-development-only",
    actualRisk: "low",
    rationale: "The vulnerable parser/bundler path is not used by Store API requests. Risk remains for CI/build input and exposed development servers.",
  },
  {
    match: (row) => ["@babel/core", "esbuild"].includes(row.package),
    surface: "Admin/storefront compilation",
    reachability: "build-or-development-only",
    actualRisk: "low",
    rationale: "The package processes trusted repository source during compilation and is not invoked by Store API requests.",
  },
  {
    match: (row) => row.path.includes("@medusajs/telemetry"),
    surface: "Medusa CLI telemetry HTTP client",
    reachability: "operational-cli-only",
    actualRisk: "low",
    rationale: "The path is invoked by Medusa CLI telemetry, not by customer-controlled Store API request handling.",
  },
  {
    match: (row) => row.path.includes("@opentelemetry") || row.path.includes("@grpc/"),
    surface: "Medusa CLI OpenTelemetry gRPC export",
    reachability: "operational-cli-only",
    actualRisk: "low",
    rationale: "The affected codec is under the CLI telemetry exporter. No protobuf decoding endpoint is exposed by this application.",
  },
  {
    match: (row) => row.package === "path-to-regexp" && row.path.includes("@medusajs/cli"),
    surface: "Express route compilation during Medusa CLI startup",
    reachability: "startup-configuration-only",
    actualRisk: "low",
    rationale: "An attacker cannot define application route patterns through Store or Admin APIs.",
  },
  {
    match: (row) => row.package === "brace-expansion",
    surface: "CLI, glob, and local package tooling",
    reachability: "build-or-development-only",
    actualRisk: "low",
    rationale: "No public endpoint accepts glob or brace expressions for these dependency paths.",
  },
  {
    match: (row) => row.package === "immutable" && row.path.includes("relay-compiler"),
    surface: "GraphQL/Relay code generation",
    reachability: "build-or-development-only",
    actualRisk: "low",
    rationale: "The affected value processing occurs in generated-code tooling, not Store API request handling.",
  },
  {
    match: (row) => row.package === "ajv" && row.path.includes("@medusajs/cli"),
    surface: "Database migration and CLI command validation",
    reachability: "migration-or-operational-cli-only",
    actualRisk: "low",
    rationale: "The path validates trusted migration/CLI input and is not exposed through Store or Admin APIs.",
  },
  {
    match: (row) => row.package === "qs" && row.chain[0] === "apps/storefront",
    surface: "Unused direct storefront dependency",
    reachability: "not-reachable-in-current-source",
    actualRisk: "low",
    rationale: "Source search found no import or require of qs in the storefront or backend.",
  },
  {
    match: (row) => row.package === "qs" && row.path.includes("express"),
    surface: "Medusa HTTP query-string parsing",
    reachability: "conditionally-runtime-reachable",
    actualRisk: "medium",
    rationale: "Query strings are attacker-controlled, but route validation, query-size limits, reverse-proxy limits, and rate limiting constrain exploitation.",
  },
  {
    match: (row) => row.package === "uuid" && row.path.includes("event-bus-redis"),
    surface: "Redis event bus job identifiers",
    reachability: "conditionally-runtime-reachable",
    actualRisk: "low",
    rationale: "The local deployment has no REDIS_URL and uses the local event bus. The path becomes relevant only when Redis event bus is enabled.",
  },
  {
    match: (row) => row.package === "body-parser" && row.path.includes("express"),
    surface: "Medusa HTTP request body parsing",
    reachability: "conditionally-runtime-reachable",
    actualRisk: "medium",
    rationale: "Request bodies are attacker-controlled, but endpoint body limits, reverse-proxy limits, authentication, and rate limiting constrain exploitation.",
  },
  {
    match: (row) => ["react-router", "react-router-dom"].includes(row.package),
    surface: "Authenticated Medusa Admin browser application",
    reachability: "admin-runtime-conditional",
    actualRisk: "medium",
    rationale: "The router executes in Admin, not Store API. Exploitation depends on advisory-specific routing/redirect behavior and an authenticated Admin context.",
  },
  {
    match: (row) => row.package === "picomatch",
    surface: "Dependency discovery, file globbing, and Admin build",
    reachability: "startup-build-or-development-only",
    actualRisk: "low",
    rationale: "No public endpoint passes attacker-controlled glob patterns to these call paths.",
  },
]

function runAudit(prodOnly) {
  const command = process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "corepack"
  const args =
    process.platform === "win32"
      ? ["/d", "/s", "/c", `corepack pnpm audit ${prodOnly ? "--prod " : ""}--json`]
      : ["pnpm", "audit", ...(prodOnly ? ["--prod"] : []), "--json"]

  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  })

  if (result.error) {
    throw result.error
  }
  if (!result.stdout?.trim()) {
    throw new Error(`pnpm audit returned no JSON: ${result.stderr?.trim() || "unknown error"}`)
  }

  const parsed = JSON.parse(result.stdout)
  if (!parsed.advisories || !parsed.metadata) {
    throw new Error(`pnpm audit response is incomplete: ${JSON.stringify(parsed)}`)
  }

  return parsed
}

function normalizePath(path) {
  return path
    .split(">")
    .map((part) => part.replaceAll("apps__", "apps/"))
}

function directDeclaration(chain) {
  if (chain.length !== 2) {
    return { dependencyType: "transitive", declaration: null }
  }

  const workspace = chain[0]
  const packageName = chain[1]
  const file = packageFiles[workspace]
  if (!file) {
    return { dependencyType: "transitive", declaration: null }
  }

  const manifest = JSON.parse(readFileSync(resolve(root, file), "utf8"))
  if (manifest.dependencies?.[packageName]) {
    return {
      dependencyType: "direct",
      declaration: `dependencies:${manifest.dependencies[packageName]}`,
    }
  }
  if (manifest.devDependencies?.[packageName]) {
    return {
      dependencyType: "direct",
      declaration: `devDependencies:${manifest.devDependencies[packageName]}`,
    }
  }

  return { dependencyType: "transitive", declaration: null }
}

function flatten(audit, productionKeys) {
  const rows = []
  const advisories = Object.entries(audit.advisories || {})

  for (const [registryId, advisory] of advisories) {
    for (const finding of advisory.findings || []) {
      for (const path of finding.paths || []) {
        const chain = normalizePath(path)
        const key = `${advisory.url}|${finding.version}|${path}`
        const declaration = directDeclaration(chain)
        const row = {
          registryId,
          ghsa: advisory.url?.split("/").at(-1) || null,
          package: advisory.module_name,
          currentVersion: finding.version,
          severity: advisory.severity,
          vulnerableVersions: advisory.vulnerable_versions,
          patchedVersions: advisory.patched_versions,
          title: advisory.title,
          cves: advisory.cves || [],
          cwe: advisory.cwe || [],
          url: advisory.url,
          dependencyScope: productionKeys.has(key) ? "production" : "development-only",
          dependencyType: declaration.dependencyType,
          declaration: declaration.declaration,
          path,
          chain,
        }

        const rule = surfaceRules.find((candidate) => candidate.match(row))
        const compatibility = compatibilityFor(row)
        rows.push({
          ...row,
          surface: rule?.surface || "Framework runtime or tooling; manual review required",
          reachability: rule?.reachability || "undetermined",
          actualRisk: rule?.actualRisk || "needs-manual-review",
          reachabilityRationale: rule?.rationale || "No package-specific reachability rule has been assigned.",
          ...compatibility,
          recommendation: advisory.recommendation,
        })
      }
    }
  }

  return rows
}

function csvCell(value) {
  const rendered = Array.isArray(value) ? value.join(";") : String(value ?? "")
  return `"${rendered.replaceAll('"', '""')}"`
}

function compatibilityFor(row) {
  const compatiblePackages = new Map([
    ["@babel/core", "Upgrade to 7.29.6 within the parent caret range."],
    ["@opentelemetry/core", "Upgrade to 2.9.0 within the parent ^2.0.0 range."],
    ["@protobufjs/utf8", "Resolved as part of the compatible protobufjs 7.6.5 update."],
    ["axios", "Upgrade to 1.19.0 within the parent ^1.x range."],
    ["body-parser", "Upgrade to 1.20.6 within Express's ~1.20.3 range."],
    ["brace-expansion", "Upgrade separately within major 1 or major 5."],
    ["follow-redirects", "Resolved by the compatible Axios dependency refresh."],
    ["form-data", "Upgrade to 4.0.6 within Axios's 4.x range."],
    ["lodash", "Upgrade direct and transitive Lodash 4 to 4.18.1."],
    ["path-to-regexp", "Upgrade to 0.1.13 within Express's ~0.1.12 range."],
    ["picomatch", "Upgrade separately within major 2 or major 4."],
    ["protobufjs", "Upgrade to 7.6.5 within proto-loader's ^7.2.5 range."],
    ["rollup", "Upgrade Rollup 4 to 4.62.4 within Vite's ^4.20.0 range."],
  ])

  if (compatiblePackages.has(row.package)) {
    return {
      patchCompatibility: "compatible-patch-applied",
      remediationPlan: compatiblePackages.get(row.package),
      breakingChangeRisk: "low",
    }
  }

  if (row.package === "postcss" && !row.path.includes(">next>")) {
    return {
      patchCompatibility: "compatible-patch-applied",
      remediationPlan: "Upgrade Vite/PostCSS paths to 8.5.25 within Vite's ^8.4.43 range.",
      breakingChangeRisk: "low",
    }
  }

  if (row.package === "qs" && row.chain[0] === "apps/storefront") {
    return {
      patchCompatibility: "compatible-patch-applied",
      remediationPlan: "Upgrade direct storefront QS to 6.15.2 within its caret range.",
      breakingChangeRisk: "low",
    }
  }

  if (row.package === "immutable" && row.ghsa === "GHSA-wf6x-7x77-mvgw") {
    return {
      patchCompatibility: "compatible-patch-applied",
      remediationPlan: "Upgrade Immutable 3.7.6 to 3.8.3 within the parent ~3.7.6 range.",
      breakingChangeRisk: "low",
    }
  }

  const blockedPlans = {
    ajv: "AJV 8.18.0 is outside the parent's ~8.13.0 range.",
    esbuild: "esbuild 0.25 is outside Vite 5's ^0.21.3 range.",
    immutable: "The remaining fix requires Immutable 4 while relay-compiler pins ~3.7.6.",
    postcss: "Next 15.5.21 pins PostCSS exactly to 8.4.31.",
    qs: "QS 6.15.2 is outside Express 4.22.1's ~6.14.0 range.",
    "react-router": "The fix requires React Router 7 while Medusa Admin is on 6.30.4.",
    "react-router-dom": "The advisory has no patched 6.x release; Medusa Admin is on 6.30.4.",
    sharp: "Sharp 0.35 is outside Next 15.5.21's ^0.34.3 range.",
    uuid: "UUID 11 is outside BullMQ 5.13.0's ^9.0.0 range.",
    vite: "Vite 6.4.x is outside Medusa 2.18's ^5.4.21 peer range.",
  }

  return {
    patchCompatibility: "no-compatible-patch-in-parent-range",
    remediationPlan: blockedPlans[row.package] || "Wait for a compatible upstream parent release.",
    breakingChangeRisk: "high",
  }
}

const columns = [
  "findingNumber",
  "registryId",
  "ghsa",
  "package",
  "currentVersion",
  "severity",
  "patchedVersions",
  "dependencyScope",
  "dependencyType",
  "declaration",
  "reachability",
  "surface",
  "actualRisk",
  "patchCompatibility",
  "remediationPlan",
  "breakingChangeRisk",
  "path",
  "url",
]

function classify(row) {
  const rule = surfaceRules.find((candidate) => candidate.match(row))
  return {
    ...row,
    surface: rule?.surface || "Framework runtime or tooling; manual review required",
    reachability: rule?.reachability || "undetermined",
    actualRisk: rule?.actualRisk || "needs-manual-review",
    reachabilityRationale: rule?.rationale || "No package-specific reachability rule has been assigned.",
    ...compatibilityFor(row),
  }
}

function writeCsv(path, findings) {
  const csv = [
    columns.map(csvCell).join(","),
    ...findings.map((row) => columns.map((column) => csvCell(row[column])).join(",")),
  ].join("\n")
  writeFileSync(path, `${csv}\n`, "utf8")
}

const reclassifyArg = process.argv.find((arg) => arg.startsWith("--reclassify="))
if (reclassifyArg) {
  const jsonPath = resolve(root, reclassifyArg.slice("--reclassify=".length))
  const report = JSON.parse(readFileSync(jsonPath, "utf8"))
  report.productionFindings = report.productionFindings.map(classify)
  report.developmentOnlyFindings = report.developmentOnlyFindings.map(classify)
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8")
  const csvPath = jsonPath.replace(/\.json$/, ".csv")
  writeCsv(csvPath, report.productionFindings)
  process.stdout.write(`${JSON.stringify({ jsonPath, csvPath, reclassified: true })}\n`)
  process.exit(0)
}

const prodAudit = runAudit(true)
const allAudit = runAudit(false)
const productionRows = flatten(prodAudit, new Set()).map((row) => ({
  ...row,
  dependencyScope: "production",
}))
const productionVulnerabilityKeys = new Set(
  productionRows.map((row) => `${row.url}|${row.package}|${row.currentVersion}`)
)
const allRows = flatten(allAudit, new Set())
const developmentOnlyFindings = allRows
  .filter(
    (row) =>
      !productionVulnerabilityKeys.has(`${row.url}|${row.package}|${row.currentVersion}`)
  )
  .map((row) => ({ ...row, dependencyScope: "development-only" }))
const productionFindings = productionRows
const baselineFindings = productionFindings.map((row, index) => ({
  findingNumber: index + 1,
  ...row,
}))

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  label,
  source: "pnpm audit --prod --json and pnpm audit --json",
  nodeVersion: process.version,
  packageManager: JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")).packageManager,
  productionSummary: {
    uniqueAdvisories: Object.keys(prodAudit.advisories || {}).length,
    vulnerabilityInstances: baselineFindings.length,
    metadata: prodAudit.metadata,
  },
  allDependencySummary: {
    uniqueAdvisories: Object.keys(allAudit.advisories || {}).length,
    vulnerabilityInstances: allRows.length,
    metadata: allAudit.metadata,
  },
  productionFindings: baselineFindings,
  developmentOnlyFindings,
}

mkdirSync(outputDir, { recursive: true })
const jsonPath = resolve(outputDir, `pnpm-audit-${label}.json`)
const csvPath = resolve(outputDir, `pnpm-audit-${label}.csv`)
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8")

writeCsv(csvPath, baselineFindings)

process.stdout.write(
  `${JSON.stringify({
    jsonPath,
    csvPath,
    productionFindings: baselineFindings.length,
    productionAdvisories: report.productionSummary.uniqueAdvisories,
    developmentOnlyFindings: report.developmentOnlyFindings.length,
  })}\n`
)
