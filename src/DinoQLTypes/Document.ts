import { DinoQLEnum } from "./Enum.js";
import { DinoQLInterface } from "./Interface.js";
import { DinoQLResource } from "./Resource.js";
import { DinoQLScalar } from "./Scalar.js";

export type DinoQLDefinition =
	| DinoQLScalar
	| DinoQLEnum
	| DinoQLInterface
	| DinoQLResource;

export class DinoQLDocument {
	definitions: Map<string, DinoQLDefinition> = new Map();
	private hasBeenValidated = false;

	constructor(definitions: DinoQLDefinition[]) {
		definitions.forEach((d) => this.addDefinition(d));
	}

	validateSchema() {
		if (this.hasBeenValidated) return;
		for (const [_name, definition] of this.definitions) {
			definition.validateSchema();
		}
		this.hasBeenValidated = true;
	}

	addDefinition(definition: DinoQLDefinition) {
		if (this.definitions.has(definition.name)) {
			throw new Error(`Duplicate definition for ${definition.name}`);
		}
		this.hasBeenValidated = false;
		this.definitions.set(definition.name, definition);
	}

	getTypeDefinition(name: string): DinoQLDefinition | undefined {
		return this.definitions.get(name);
	}

	getDefinitions(type: "interface"): DinoQLInterface[];
	getDefinitions(type: "scalar"): DinoQLScalar[];
	getDefinitions(type: "enum"): DinoQLEnum[];
	getDefinitions(type: "resource"): DinoQLResource[];
	getDefinitions(
		type?: "interface" | "scalar" | "enum" | "resource"
	): DinoQLDefinition[] {
		if (!type) return Array.from(this.definitions.values());
		return Array.from(this.definitions.values()).filter(
			(val) => val.type === type
		);
	}

	provideCustomScalarValidator(
		name: string,
		validator: (value: any) => boolean
	) {
		const scalar = this.getTypeDefinition(name);
		if (!scalar || !(scalar instanceof DinoQLScalar))
			throw new Error(`Scalar ${name} not found`);
		scalar.checkValue = validator;
	}
}
