{{
import { DinoQLScalar, DinoQLDocument, DinoQLEnum, DinoQLType, DinoQLProperty, DinoQLInterface, DinoQLParameter, DinoQLQuery, DinoQLAction, DinoQLResource } from "./DinoQLTypes";

const doc = new DinoQLDocument([]);

function makeInteger(digits: string[], radix = 10): number {
	return parseInt(digits.join(""), radix);
}

function makeFloat(int: number, decimal: number): number {
	return parseFloat(int + "." + decimal);
}
}}

document
  = (expression _)+ { return doc; }

expression
  = scalar / enum / interface / resource;

resource "resource"
  = comment:docComment? _ isStatic:"static"? _ "resource" _ name:identifier _ "{" _ members:(@resourceMember _)* _ "}" {
		const props = members.filter((p: any) => p instanceof DinoQLProperty) as DinoQLProperty[];
		const queries = members.filter((p: any) => p instanceof DinoQLQuery) as DinoQLQuery[];
		const actions = members.filter((p: any) => p instanceof DinoQLAction) as DinoQLAction[];
		const resource = new DinoQLResource(name, isStatic !== null, props, queries, actions, comment, doc);
		resource.location = location();
		doc.addDefinition(resource);
		return resource;
	}
	
resourceMember
  = action / query / property;

interface "interface" 
  = comment:docComment? _ "interface" _ name:identifier _ "{" _ properties:(@property _)* _ "}" _ {
		const inter = new DinoQLInterface(name, properties, comment, doc);
		inter.location = location();
		doc.addDefinition(inter);
		return inter;
	}
	
enum "enum"
	= comment:docComment? _ "enum" _ name:identifier _ "{" _ values:enumValueList "}" {
		const e = new DinoQLEnum(name, values, comment, doc);
		e.location = location();
		doc.addDefinition(e);
		return e;
	}
	
enumValueList
  = head:identifier tail:("," _ @identifier _)* { return [head, ...tail]; }
	
scalar "scalar"
	= comment:docComment? _ "scalar" _ name:identifier _ fallback:identifier ";" {
		const scalar = new DinoQLScalar(name, fallback, comment, doc);
		scalar.location = location();
		doc.addDefinition(scalar);
		return scalar;
	}
	
action "action"
  = comment:docComment? _ isStatic:"static"? _ "action" _ name:identifier _ "(" _ parameters:parameterList? _ ")" _ ":" _ type:type _ ";"{
		const action = new DinoQLAction(name, isStatic !== null, parameters, type, comment, doc);
		action.location = location();
		return action;
	}
	
query "query"
  = comment:docComment? _ isStatic:"static"? _ "query" _ name:identifier _ "(" _ parameters:parameterList? _ ")" _ ":" _ type:type _ ";" {
		const query = new DinoQLQuery(name, isStatic !== null, parameters, type, comment, doc);
		query.location = location();
		return query;
	}
	
property "property"
	= comment:docComment? id:"#"? name:identifier optional:"?"? ":" _ type:type ";" {
		const prop = new DinoQLProperty(name, type, id !== null, optional !== null, comment, doc);
		prop.location = location();
		return prop;
	}
	
parameterList
  = head:parameter tail:("," _ @parameter)* {
		return [head, ...tail];
	}
	
parameter "parameter"
	= comment:docComment? name:identifier optional:"?"? ":" _ type:type {
		const param = new DinoQLParameter(name, type, optional !== null, comment, doc);
		param.location = location();
		return param;
	}
	
type "type"
  = array:"["? _ type:identifier _ "]"? nullable:"?"? {
		const typeObj = new DinoQLType(type, nullable !== null, array !== null, doc);
		typeObj.location = location();
		return typeObj;
	}
	
docComment "doc comment"
	= "/*" text:(!"*/" .)* "*/" {
		return text.flat().join("").trim();
	}	

identifier "identifier"
	= $ ([a-zA-Z_][a-zA-Z0-9_-]*)

string "string"
	= "\"" content:(escapedQuote  / [^"])* "\"" { return content; }

escapedQuote = "\\" "\""

number "number"
  = float / integer / hexadecimalLiteral / octalLiteral / binaryLiteral 

octalLiteral 
	= "0o" digits:[0-7]+ {
		return makeInteger(digits, 8)
	}

binaryLiteral 
	= "0b" digits:[01]+ {
		return makeInteger(digits, 2)
	}

hexadecimalLiteral 
  = "0x" digits:[0-9a-fA-F]+ { return makeInteger(digits, 16); }

float 
	= int:integer "." decimal:integer { return makeFloat(int, decimal); }

integer 
  = digits:[0-9]+ { return makeInteger(digits); }
	
_ "whitespace"
	= [ \t\n\r]* { return ""; }