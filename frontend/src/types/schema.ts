export interface SchemaFeatureCategorical {
  name: string;
  type: "categorical";
  allowed_values: string[];
}

export interface SchemaFeatureNumeric {
  name: string;
  type: "numeric";
  min_observed: number;
  max_observed: number;
  example: number;
}

export type SchemaFeature = SchemaFeatureCategorical | SchemaFeatureNumeric;

export interface InputSchema {
  features: SchemaFeature[];
}