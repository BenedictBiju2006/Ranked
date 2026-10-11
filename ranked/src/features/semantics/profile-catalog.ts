import { supabase } from "@/lib/supabase";
import { createSupabaseProfileCatalogRepository } from "./repositories/supabase-profile-catalog.repository";
import { createProfileCatalogService } from "./services/profile-catalog.service";

export const profileCatalogService = createProfileCatalogService(createSupabaseProfileCatalogRepository(supabase));
