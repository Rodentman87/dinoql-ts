import { BaseDinoQLObject } from "./Base.js";
import { DinoQLDocument } from "./Document.js";
import { BuiltInScalars } from "./Scalar.js";

export class DinoQLType extends BaseDinoQLObject {
	constructor(
		public baseTypeId: string,
		public nullable: boolean,
		public array: boolean,
		public document: DinoQLDocument
	) {
		super();
	}

	get baseTypeDef() {
		return this.document.getTypeDefinition(this.baseTypeId);
	}

	validateSchema() {
		if (BuiltInScalars.includes(this.baseTypeId)) return;
		if (!this.baseTypeDef) throw new Error(`Type ${this.baseTypeId} not found`);
	}

	checkValue(value: any): boolean | string | Record<string, any> {
		// Check null stuff
		if (this.nullable && value === null) return true;
		if (value === null) return "Value must not be null";

		// Check array stuff
		if (this.array && !Array.isArray(value)) return "Value must be an array";
		if (this.array) {
			const errors: Record<string, any> = {};
			value.forEach((v: any, index: number) => {
				const valid = this.checkBaseType(v);
				if (valid !== true) errors[index.toString()] = valid;
			});
			if (Object.keys(errors).length > 0) return errors;
			return true;
		}

		return this.checkBaseType(value);
	}

	private checkBaseType(value: any): boolean | string | Record<string, any> {
		if (this.baseTypeId === "string") {
			if (typeof value === "string") return true;
			return "Value must be a string";
		}
		if (this.baseTypeId === "boolean") {
			if (typeof value === "boolean") return true;
			return "Value must be a boolean";
		}
		if (this.baseTypeId === "integer") {
			if (typeof value === "number" && Number.isInteger(value)) return true;
			return "Value must be an integer";
		}
		if (this.baseTypeId === "float") {
			if (typeof value === "number") return true;
			return "Value must be a float";
		}

		const typeDef = this.baseTypeDef;

		if (!typeDef) throw new Error(`Type ${this.baseTypeId} not found`);
		return typeDef.checkValue(value);
	}

	toString(): string {
		if (this.array) return `[${this.baseTypeId}${this.nullable ? "?" : ""}]`;
		return `${this.baseTypeId}${this.nullable ? "?" : ""}`;
	}
}
