const [major, minor, patch] = process.versions.node.split(".").map(Number)

console.log(`Build Node.js: ${process.version}`)

if (major !== 24 || minor < 22 || (minor === 22 && patch < 1)) {
  console.error("Node.js >=24.22.1 <25 is required. See .nvmrc.")
  process.exit(1)
}
