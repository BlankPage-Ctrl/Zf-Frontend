export namespace categories {
	
	export class Category {
	    id: string;
	    name: string;
	    color?: string;
	    is_default: boolean;
	    created_at: string;
	
	    static createFrom(source: any = {}) {
	        return new Category(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.color = source["color"];
	        this.is_default = source["is_default"];
	        this.created_at = source["created_at"];
	    }
	}
	export class CategoryDto {
	    name: string;
	    color?: string;
	
	    static createFrom(source: any = {}) {
	        return new CategoryDto(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.color = source["color"];
	    }
	}

}

export namespace chats {
	
	export class Chat {
	    id: string;
	    title: string;
	    providerId?: string;
	    modelId?: string;
	    systemPrompt?: string;
	    thinkingMode: string;
	    workspaceId: string;
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new Chat(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.providerId = source["providerId"];
	        this.modelId = source["modelId"];
	        this.systemPrompt = source["systemPrompt"];
	        this.thinkingMode = source["thinkingMode"];
	        this.workspaceId = source["workspaceId"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class ChatDto {
	    title: string;
	    modelId?: string;
	    providerId?: string;
	    systemPrompt?: string;
	    thinkingMode?: string;
	
	    static createFrom(source: any = {}) {
	        return new ChatDto(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.title = source["title"];
	        this.modelId = source["modelId"];
	        this.providerId = source["providerId"];
	        this.systemPrompt = source["systemPrompt"];
	        this.thinkingMode = source["thinkingMode"];
	    }
	}

}

export namespace files {
	
	export class FileMeta {
	    isSymlink: boolean;
	    symlinkTarget?: string;
	
	    static createFrom(source: any = {}) {
	        return new FileMeta(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.isSymlink = source["isSymlink"];
	        this.symlinkTarget = source["symlinkTarget"];
	    }
	}
	export class FileNode {
	    id: string;
	    name: string;
	    path: string;
	    type: string;
	    isDirectory: boolean;
	    size?: number;
	    lastModified?: number;
	    hasChildren?: boolean;
	    children?: FileNode[];
	    meta?: FileMeta;
	
	    static createFrom(source: any = {}) {
	        return new FileNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.path = source["path"];
	        this.type = source["type"];
	        this.isDirectory = source["isDirectory"];
	        this.size = source["size"];
	        this.lastModified = source["lastModified"];
	        this.hasChildren = source["hasChildren"];
	        this.children = this.convertValues(source["children"], FileNode);
	        this.meta = this.convertValues(source["meta"], FileMeta);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class GetStatData {
	    node: FileNode;
	
	    static createFrom(source: any = {}) {
	        return new GetStatData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.node = this.convertValues(source["node"], FileNode);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ListDirData {
	    requestedPath: string;
	    nodes: FileNode[];
	
	    static createFrom(source: any = {}) {
	        return new ListDirData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.requestedPath = source["requestedPath"];
	        this.nodes = this.convertValues(source["nodes"], FileNode);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ReadFileData {
	    path: string;
	    content: string;
	    encoding: string;
	    size: number;
	    truncated: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ReadFileData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.content = source["content"];
	        this.encoding = source["encoding"];
	        this.size = source["size"];
	        this.truncated = source["truncated"];
	    }
	}
	export class SearchFilesData {
	    query: string;
	    matches: FileNode[];
	
	    static createFrom(source: any = {}) {
	        return new SearchFilesData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.query = source["query"];
	        this.matches = this.convertValues(source["matches"], FileNode);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace messages {
	
	export class UIMessagePart {
	    type: string;
	    text?: string;
	    content?: string;
	    state?: string;
	    toolCallId?: string;
	    input?: any;
	    output?: any;
	    errorText?: string;
	    providerExecuted?: boolean;
	    sourceId?: string;
	    url?: string;
	    title?: string;
	    mediaType?: string;
	    filename?: string;
	    data?: any;
	    id?: string;
	
	    static createFrom(source: any = {}) {
	        return new UIMessagePart(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.text = source["text"];
	        this.content = source["content"];
	        this.state = source["state"];
	        this.toolCallId = source["toolCallId"];
	        this.input = source["input"];
	        this.output = source["output"];
	        this.errorText = source["errorText"];
	        this.providerExecuted = source["providerExecuted"];
	        this.sourceId = source["sourceId"];
	        this.url = source["url"];
	        this.title = source["title"];
	        this.mediaType = source["mediaType"];
	        this.filename = source["filename"];
	        this.data = source["data"];
	        this.id = source["id"];
	    }
	}
	export class UIMessage {
	    id: string;
	    role: string;
	    content: string;
	    parts?: UIMessagePart[];
	
	    static createFrom(source: any = {}) {
	        return new UIMessage(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.role = source["role"];
	        this.content = source["content"];
	        this.parts = this.convertValues(source["parts"], UIMessagePart);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace models {
	
	export class Model {
	    id: string;
	    modelId: string;
	    displayName?: string;
	    providerId: string;
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new Model(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.modelId = source["modelId"];
	        this.displayName = source["displayName"];
	        this.providerId = source["providerId"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class ModelDto {
	    modelId: string;
	    displayName?: string;
	
	    static createFrom(source: any = {}) {
	        return new ModelDto(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.modelId = source["modelId"];
	        this.displayName = source["displayName"];
	    }
	}

}

export namespace notes {
	
	export class MovePosition {
	    before?: string;
	    after?: string;
	
	    static createFrom(source: any = {}) {
	        return new MovePosition(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.before = source["before"];
	        this.after = source["after"];
	    }
	}
	export class Note {
	    id: string;
	    name: string;
	    category_id: string;
	    desc: string;
	    details: string;
	    rank: string;
	    priority: string;
	    created_at: string;
	    updated_at: string;
	    version: number;
	
	    static createFrom(source: any = {}) {
	        return new Note(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.category_id = source["category_id"];
	        this.desc = source["desc"];
	        this.details = source["details"];
	        this.rank = source["rank"];
	        this.priority = source["priority"];
	        this.created_at = source["created_at"];
	        this.updated_at = source["updated_at"];
	        this.version = source["version"];
	    }
	}
	export class NoteDto {
	    name: string;
	    category_id?: string;
	    desc?: string;
	    details?: string;
	    priority?: string;
	
	    static createFrom(source: any = {}) {
	        return new NoteDto(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.category_id = source["category_id"];
	        this.desc = source["desc"];
	        this.details = source["details"];
	        this.priority = source["priority"];
	    }
	}

}

export namespace providers {
	
	export class ProviderModel {
	    id: string;
	    modelId: string;
	    displayName?: string;
	    providerId: string;
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new ProviderModel(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.modelId = source["modelId"];
	        this.displayName = source["displayName"];
	        this.providerId = source["providerId"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class Provider {
	    id: string;
	    name: string;
	    type: string;
	    apiKey?: string;
	    baseURL?: string;
	    models: ProviderModel[];
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new Provider(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.type = source["type"];
	        this.apiKey = source["apiKey"];
	        this.baseURL = source["baseURL"];
	        this.models = this.convertValues(source["models"], ProviderModel);
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProviderDto {
	    name: string;
	    type: string;
	    apiKey?: string;
	    baseURL?: string;
	
	    static createFrom(source: any = {}) {
	        return new ProviderDto(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.type = source["type"];
	        this.apiKey = source["apiKey"];
	        this.baseURL = source["baseURL"];
	    }
	}

}

export namespace settings {
	
	export class DefaultProvider {
	    providerId?: string;
	    modelId?: string;
	
	    static createFrom(source: any = {}) {
	        return new DefaultProvider(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.providerId = source["providerId"];
	        this.modelId = source["modelId"];
	    }
	}
	export class SettingValue {
	    key: string;
	    value?: string;
	
	    static createFrom(source: any = {}) {
	        return new SettingValue(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.key = source["key"];
	        this.value = source["value"];
	    }
	}

}

export namespace workspaces {
	
	export class Workspace {
	    id: string;
	    name: string;
	    description?: string;
	    projectPath: string;
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new Workspace(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.projectPath = source["projectPath"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class WorkspaceDto {
	    name: string;
	    description?: string;
	    projectPath: string;
	
	    static createFrom(source: any = {}) {
	        return new WorkspaceDto(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	        this.projectPath = source["projectPath"];
	    }
	}

}

