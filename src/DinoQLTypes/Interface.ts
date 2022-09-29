import { BaseDinoQLObject } from "./Base.js";
import { DinoQLDocument } from "./Document.js";
import { DinoQLProperty } from "./Property.js";

export class DinoQLInterface extends BaseDinoQLObject {
	properties: Map<string, DinoQLProperty> = new Map();

	constructor(
		public name: string,
		properties: DinoQLProperty[],
		public docComment: string | null,
		public document: DinoQLDocument
	) {
		super();
		properties.forEach((p) => this.properties.set(p.name, p));
	}

	type: "interface" = "interface";

	validateSchema() {
		for (const [_name, prop] of this.properties) {
			prop.validateSchema();
		}
	}

	checkValue(value: any): boolean | string | Record<string, any> {
		const errors: Record<string, any> = {};
		if (typeof value !== "object") return "Value must be an object";
		for (const [key, prop] of this.properties) {
			if (prop.isOptional && !value.hasOwnProperty(key)) continue;
			const valid = prop.type.checkValue(value[key]);
			if (valid !== true) errors[key] = valid;
		}
		if (Object.keys(errors).length > 0) return errors;
		return true;
	}
}
