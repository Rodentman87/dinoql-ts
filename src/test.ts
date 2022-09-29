import { readFileSync } from "fs";
import { join } from "path";
import { DeserializationError, Serializer } from "./deserializer";
import { DinoQLResource } from "./DinoQLTypes";
import { parse } from "./index";

const file = readFileSync(join(__dirname, "../test.dinoql"), "utf8");

console.log("Trying to parse");
console.log("====================================");
console.log(file);
console.log("====================================");

try {
	const start = performance.now();

	const output = parse(file, {});

	const end = performance.now();

	console.log(`DinoQLDocument: ${output.definitions.size} definitions`);

	console.log(`Parsed in ${end - start}ms`);

	const deserializer = new Serializer(output, { serverMode: true });

	deserializer.registerScalarHandler({
		name: "Date",
		serialize: (value: Date) => value.toISOString(),
		deserialize: (value: string) => {
			if (typeof value !== "string")
				throw new Error(`Expected ISO 8601 date string, but got ${value}`);
			if (!isIsoDate(value))
				throw new Error(`Expected ISO 8601 date string, but got ${value}`);
			return new Date(value);
		},
	});

	console.log("Trying to deserialize input for Me.sendFriendRequest");

	const userObj = output.getTypeDefinition("Me");
	const action = (userObj as DinoQLResource).getMethod("sendFriendRequest");

	const input = {
		user: {
			id: 2,
		},
	};

	const deserializeStart = performance.now();

	const deserialized = deserializer.deserializeParameters(input, action!);

	const deserializeEnd = performance.now();

	console.log(deserialized);
	console.log(`Deserialized in ${deserializeEnd - deserializeStart}ms`);
} catch (e) {
	if (typeof e.format === "function") {
		console.log(e.format([{ text: file }]));
	} else if (e instanceof DeserializationError) {
		console.log(e.toJSON());
	} else {
		throw e;
	}
}

// ISO string checking function from this Stack Overflow answer https://stackoverflow.com/a/52869830/7595722 by mplungjan (https://stackoverflow.com/users/295783/mplungjan)
function isIsoDate(str: string) {
	if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
	const d = new Date(str);
	return d instanceof Date && !isNaN(d.getTime()) && d.toISOString() === str; // valid date
}
