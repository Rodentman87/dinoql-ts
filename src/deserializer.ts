import {
	DinoQLAction,
	DinoQLDocument,
	DinoQLEnum,
	DinoQLInterface,
	DinoQLParameter,
	DinoQLProperty,
	DinoQLQuery,
	DinoQLResource,
	DinoQLType,
} from "./DinoQLTypes";

export interface ScalarHandler<S, D> {
	name: string;
	serialize: (value: D) => S;
	deserialize: (value: S) => D;
}

const defaultScalarHandlers: ScalarHandler<any, any>[] = [
	{
		name: "string",
		serialize: (value) => {
			if (typeof value !== "string")
				throw new Error(`Error serializing value. ${value} is not a string`);
			return value;
		},
		deserialize: (value) => {
			if (typeof value !== "string")
				throw new Error(`Expected string, but got ${value}`);
			return value;
		},
	},
	{
		name: "boolean",
		serialize: (value) => {
			if (typeof value !== "boolean")
				throw new Error(`Error serializing value. ${value} is not a boolean`);
			return value;
		},
		deserialize: (value) => {
			if (typeof value !== "boolean")
				throw new Error(`Expected boolean, but got ${value}`);
			return value;
		},
	},
	{
		name: "integer",
		serialize: (value) => {
			if (typeof value !== "number" || !Number.isInteger(value))
				throw new Error(`Error serializing value. ${value} is not an integer`);
			return value;
		},
		deserialize: (value) => {
			if (typeof value !== "number" || !Number.isInteger(value))
				throw new Error(`Expected integer, but got ${value}`);
			return value;
		},
	},
	{
		name: "float",
		serialize: (value) => {
			if (typeof value !== "number")
				throw new Error(`Error serializing value. ${value} is not a float`);
			return value;
		},
		deserialize: (value) => {
			if (typeof value !== "number")
				throw new Error(`Expected float, but got ${value}`);
			return value;
		},
	},
];

export interface SerializerOptions {
	/**
	 * If server mode is enabled, resources will be deserialized with just their ID properties to save the uneccesary time spent to deserialize other properties.
	 */
	serverMode?: boolean;
}

export class Serializer {
	private scalarHandlerMap = new Map<string, ScalarHandler<any, any>>();
	private serverMode: boolean = false;

	constructor(public document: DinoQLDocument, options?: SerializerOptions) {
		document.validateSchema();
		if (options?.serverMode !== undefined) this.serverMode = options.serverMode;
		defaultScalarHandlers.forEach(this.registerScalarHandler.bind(this));
	}

	public registerScalarHandler<S, D>(handler: ScalarHandler<S, D>) {
		if (this.scalarHandlerMap.has(handler.name))
			throw new Error(`Scalar handler for ${handler.name} already registered`);
		this.scalarHandlerMap.set(handler.name, handler);
	}

	public deserializeParameters(
		object: Record<string, any>,
		method: DinoQLAction | DinoQLQuery
	) {
		return this.deserializeObject("params", object, method.parameters);
	}

	private deserializeObject(
		name: string,
		object: Record<string, any>,
		props: (DinoQLParameter | DinoQLProperty)[]
	) {
		let deserialized: Record<string, any> = {};
		let errors: DeserializationError[] = [];
		for (const prop of props) {
			const value = object[prop.name];
			if (value === undefined) {
				if (!prop.isOptional) {
					errors.push(
						new DeserializationError(
							prop.name,
							`Missing required property ${prop.name}`
						)
					);
				}
				continue;
			}
			const type = prop.type;
			if (type.array) {
				if (!Array.isArray(value)) {
					errors.push(
						new DeserializationError(
							prop.name,
							`Expected array, got ${typeof value}`
						)
					);
					continue;
				}
				const out = [];
				let index = -1;
				const valErrors: DeserializationError[] = [];
				for (const val of value) {
					index++;
					try {
						out.push(this.deserializeSingleValue(index.toString(), type, val));
					} catch (e) {
						if (e instanceof DeserializationError) valErrors.push(e);
						else throw e;
					}
				}
				if (valErrors.length > 0) {
					errors.push(...valErrors);
					continue;
				}
				deserialized[prop.name] = out;
			} else {
				if (Array.isArray(value)) {
					errors.push(
						new DeserializationError(
							prop.name,
							`Expected ${type.baseTypeId}, got array`
						)
					);
					continue;
				}
				try {
					const result = this.deserializeSingleValue(prop.name, type, value);
					deserialized[prop.name] = result;
				} catch (e) {
					if (e instanceof DeserializationError) errors.push(e);
					else throw e;
				}
			}
		}
		if (errors.length > 0) throw new DeserializationError(name, errors);
		return deserialized;
	}

	private deserializeSingleValue(name: string, type: DinoQLType, value: any) {
		const typeDef = type.baseTypeDef;
		let kind: "scalar" | "enum" | "interface" | "resource";
		if (typeDef === undefined)
			// This is a default scalar, we know this because the validation of the schema
			kind = "scalar";
		else kind = typeDef.type;
		switch (kind) {
			case "scalar":
				try {
					return this.deserializeScalar(type.baseTypeId, value);
				} catch (e) {
					if (e instanceof Error)
						throw new DeserializationError(name, e.message);
					else throw e;
				}
			case "enum":
				// TODO: Real Enum deserialization
				try {
					if ((typeDef as DinoQLEnum).values.includes(value)) return value;
					else
						throw new Error(
							`Invalid enum value ${value}, expected one of ${(
								typeDef as DinoQLEnum
							).values.join(", ")}`
						);
				} catch (e) {
					if (e instanceof Error)
						throw new DeserializationError(name, e.message);
					else throw e;
				}
			case "interface":
				return this.deserializeObject(name, value, [
					...(typeDef as DinoQLInterface).properties.values(),
				]);
			case "resource":
				if (this.serverMode) {
					return this.deserializeObject(name, value, [
						...(typeDef as DinoQLResource).idProperties.values(),
					]);
				}
				return this.deserializeObject(name, value, [
					...(typeDef as DinoQLResource).properties.values(),
				]);
		}
	}

	public deserializeScalar(name: string, value: any) {
		const scalarHandler = this.scalarHandlerMap.get(name);
		if (!scalarHandler) throw new Error(`No scalar handler for ${name}`);
		return scalarHandler.deserialize(value);
	}
}

export class DeserializationError {
	constructor(
		public property: string,
		public message: string | DeserializationError[]
	) {}

	toJSON(): string | SerializedError {
		if (typeof this.message === "string") return this.message;
		else
			return this.message.reduce<SerializedError>((acc, err) => {
				const newAcc = {
					...acc,
				};
				newAcc[err.property] = err.toJSON();
				return newAcc;
			}, {});
	}
}

interface SerializedError {
	[key: string]: string | SerializedError;
}
