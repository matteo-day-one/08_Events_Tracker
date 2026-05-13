export type EventMode = "in-person" | "online" | "hybrid";

export type FeeInfo =
  | {
      type: "free";
      notes?: string;
    }
  | {
      type: "paid";
      amount?: number;
      currency?: string;
      notes?: string;
    }
  | {
      type: "unknown";
      notes?: string;
    };

export type ExternalAttachment = {
  label: string;
  type: "external";
  url: string;
  description?: string;
};

export type RepositoryAttachment = {
  label: string;
  type: "repository";
  path: string;
  description?: string;
};

export type EventAttachment = ExternalAttachment | RepositoryAttachment;

export type EventRecord = {
  id: string;
  name: string;
  description: string;
  website: string;
  location: string;
  mode: EventMode;
  startDate: string;
  endDate?: string;
  applicationDeadline?: string;
  fee: FeeInfo;
  macrotopics: string[];
  subtopics: string[];
  attachments: EventAttachment[];
  createdAt: string;
  updatedAt: string;
};

export type LocationRegion = "Europe" | "North America" | "Asia" | "Middle East" | "Africa";

export type LocationCatalogRecord = {
  location: string;
  city?: string;
  country?: string;
  region?: LocationRegion;
  latitude?: number;
  longitude?: number;
  mappable: boolean;
  notes?: string;
};

export type TaxonomySubtopic = {
  id: string;
  label: string;
};

export type TaxonomyMacrotopic = {
  id: string;
  label: string;
  subtopics: TaxonomySubtopic[];
};

export type Taxonomy = {
  macrotopics: TaxonomyMacrotopic[];
};

export type ValidationResult = {
  ok: boolean;
  errors: string[];
};
