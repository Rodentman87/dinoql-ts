const { readFileSync, writeFileSync } = require("fs");
const { join } = require("path");
const peggy = require("peggy");
const tspegjs = require("ts-pegjs");

const file = readFileSync(join(__dirname, "../grammar/dinoql.pegjs"), "utf8");

const parser = peggy.generate(file, {
	output: "source",
	format: "commonjs",
	plugins: [tspegjs],
	tspegjs: {
		returnTypes: {
			document: "DinoQLDocument",
		},
	},
});

writeFileSync(join(__dirname, "../src/parser.ts"), parser, "utf8");
