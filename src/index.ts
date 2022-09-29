import { DinoQLDocument } from "./DinoQLTypes";
import { IParseOptions, parse as untypedParser } from "./parser";

export const parse = untypedParser as (
	input: string,
	options?: IParseOptions
) => DinoQLDocument;

export {
	DeserializationError,
	Serializer,
	ScalarHandler,
	SerializerOptions,
} from "./deserializer";

export * from "./DinoQLTypes";
