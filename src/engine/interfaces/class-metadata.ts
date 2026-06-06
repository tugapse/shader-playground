import { ClassType } from "@engine/enums/class-type.enum";

export interface ClassMetadata {
    name: string;
    type: ClassType;
    path: string;
    description?: string;
}   