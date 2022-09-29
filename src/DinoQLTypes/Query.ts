import { BaseDinoQLObject } from "./Base.js";
import { DinoQLDocument } from "./Document.js";
import { DinoQLParameter } from "./Parameter.js";
import { DinoQLType } from "./Type.js";

export class DinoQLQuery extends BaseDinoQLObject {
	constructor(
		public name: string,
		public isStatic: boolean,
		public parameters: DinoQLParameter[],
		public returnType: DinoQLType,
		public docComment: string | null,
		public document: DinoQLDocument
	) {
		super();
	}

	validateSchema() {
		for (const parameter of this.parameters) {
			parameter.validateSchema();
		}
		this.returnType.validateSchema();
	}

	validateParameters(parameters: Record<string, any>) {
		const errors: Record<string, any> = {};
		const valid = this.parameters.every((p: DinoQLParameter) => {
			const value = parameters[p.name];
			if (value === undefined && !p.isOptional)
				errors[p.name] = `Parameter ${p.name} is required`;
			else if (value === undefined) return true;
			const valid = p.type.checkValue(value);
			if (valid !== true) {
				errors[p.name] = valid;
				return false;
			}
			return valid;
		});
		if (!valid) return errors;
		return valid;
	}
}
