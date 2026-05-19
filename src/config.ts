export const repositoryUrl =
  import.meta.env.VITE_REPOSITORY_URL ?? "https://github.com/your-user/public-event-tracker";

export const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

export const googleMapsMapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim() || undefined;
