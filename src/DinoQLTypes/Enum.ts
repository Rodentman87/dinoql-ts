import { BaseDinoQLObject } from "./Base";
import { DinoQLDocument } from "./Document";

export class DinoQLEnum extends BaseDinoQLObject {
	constructor(
		public name: string,
		public values: string[],
		public docComment: string | null,
		public document: DinoQLDocument
	) {
		super();
	}

	type: "enum" = "enum";

	validateSchema() {
		if (this.values.length === 0)
			throw new Error(`Enum ${this.name} has no values`);
	}

	checkValue(value: any): boolean | string {
		if (typeof value !== "string") return false;
		if (this.values.includes(value)) return true;
		return `Value must be one of ${this.values.join(", ")}`;
	}
}
