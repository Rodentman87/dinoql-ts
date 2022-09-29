import { BaseDinoQLObject } from "./Base.js";
import { DinoQLDocument } from "./Document.js";
import { DinoQLType } from "./Type.js";

export class DinoQLProperty extends BaseDinoQLObject {
	constructor(
		public name: string,
		public type: DinoQLType,
		public isId: boolean,
		public isOptional: boolean,
		public docComment: string | null,
		public document: DinoQLDocument
	) {
		super();
	}

	validateSchema() {
		this.type.validateSchema();
	}
}
