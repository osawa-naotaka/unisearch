
export class UniSearchError extends Error {};

const UniSearchType = {
    Linear: 0,
} as const;
type UniSearchType = typeof UniSearchType[keyof typeof UniSearchType];

const version = "1.0";

export type Path = string;
type FieldName = string;
type FieldNameMap = Record<FieldName, Path>

export type LinearSearchIndex<T> = {
    field_names: Record<FieldName, Path>;
    key_fields: Path[];
    search_targets: Path[];
    contents: T[];
}

export type UniIndex<T> = {
    version: string;
    type: UniSearchType;
    index: LinearSearchIndex<T>;
};

export function createIndex<T>(contents: T[], key_fields: Path[], search_targets: Path[] = [], field_names: FieldNameMap = {}) : UniIndex<T> | UniSearchError {
    try {
        if(contents.length === 0) throw new UniSearchError("unisearch: contents must not be empty.");
        return {
            version: version,
            type: UniSearchType.Linear,
            index: {
                field_names: field_names,
                key_fields: key_fields,
                search_targets: search_targets,
                contents: contents
            }
        };
    } catch(e) {
        if(e instanceof UniSearchError) {
            return e;
        }
        throw e;
    }
}
