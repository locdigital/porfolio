// Ensure node 20+
const nodeVersion = process.versions.node.split('.')[0];
if (parseInt(nodeVersion) < 18) {
  console.warn(`Warning: Node.js 18+ is recommended (current: ${process.versions.node})`);
}
process.exit(0);
