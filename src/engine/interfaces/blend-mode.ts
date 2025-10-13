import { BlendingSourceFactor, BlendingDestinationFactor } from "../enums/gl/blend.enum";

export interface BlendingMode {
    sourcefactor: BlendingSourceFactor;
    destfactor: BlendingDestinationFactor;
}