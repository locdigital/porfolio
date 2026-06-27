const requiredMajor = 20;
const actual = process.versions.node;
const actualMajor = Number(actual.split(".")[0]);

if (actualMajor !== requiredMajor) {
  console.error(
    [
      `This project must run on Node ${requiredMajor}.x.`,
      `Current Node: ${actual}`,
      "",
      "Switch to the project version before running dev/build:",
      "  nvm use",
      "  # or install it first: nvm install 20",
      "",
      "Vercel also reads package.json engines.node, so production builds will use Node 20.x.",
    ].join("\n"),
  );
  process.exit(1);
}
