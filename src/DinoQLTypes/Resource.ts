import { DinoQLAction } from "./Action.js";
import { BaseDinoQLObject } from "./Base.js";
import { DinoQLDocument } from "./Document.js";
import { DinoQLParameter } from "./Parameter.js";
import { DinoQLProperty } from "./Property.js";
import { DinoQLQuery } from "./Query.js";
import { DinoQLType } from "./Type.js";

export class DinoQLResource extends BaseDinoQLObject {
	public idProperties: DinoQLProperty[];
	public properties: Map<string, DinoQLProperty> = new Map();
	public queries: Map<string, DinoQLQuery> = new Map();
	public actions: Map<string, DinoQLAction> = new Map();

	constructor(
		public name: string,
		public isStatic: boolean,
		properties: DinoQLProperty[],
		queries: DinoQLQuery[],
		actions: DinoQLAction[],
		public docComment: string | null,
		public document: DinoQLDocument
	) {
		super();
		properties.forEach((p) => this.properties.set(p.name, p));
		queries.forEach((q) => this.queries.set(q.name, q));
		actions.forEach((a) => this.actions.set(a.name, a));
		const idProps = properties.filter((p: DinoQLProperty) => p.isId);
		this.idProperties = idProps;
		// Create the default get query
		const returnType = new DinoQLType(this.name, false, false, this.document);
		let parameters: DinoQLParameter[] = [];
		if (!this.isStatic) {
			// Create the static query for the resource with no parameters
			parameters = this.idProperties.map((p: DinoQLProperty) => {
				return new DinoQLParameter(p.name, p.type, false, null, this.document);
			});
		}
		const query = new DinoQLQuery(
			"get",
			true,
			parameters,
			returnType,
			null,
			this.document
		);
		this.queries.set("get", query);
	}

	type: "resource" = "resource";

	validateSchema() {
		if (this.idProperties.length < 1 && !this.isStatic)
			throw new Error(`Instanced resource ${this.name} has no id properties`);
		for (const [_name, property] of this.properties) {
			property.validateSchema();
		}
		for (const [_name, query] of this.queries) {
			query.validateSchema();
		}
		for (const [_name, action] of this.actions) {
			action.validateSchema();
		}
	}

	checkValue(value: any): boolean {
		if (typeof value !== "object") return false;
		for (const [key, prop] of this.properties) {
			if (!prop.type.checkValue(value[key])) return false;
		}
		return true;
	}

	getMethod(name: string): DinoQLAction | DinoQLQuery | undefined {
		return this.actions.get(name) || this.queries.get(name);
	}
}
