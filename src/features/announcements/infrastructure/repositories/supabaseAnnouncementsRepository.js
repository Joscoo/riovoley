import { supabase } from '../../../../config/supabase';
import { AnnouncementsError } from '../../domain/announcementsError';

const normalizeError = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
};

export class SupabaseAnnouncementsRepository {
  async listAdminAnnouncements({ priority, is_active, search }) {
    let query = supabase
      .from('announcements_with_creator')
      .select('*')
      .order('created_at', { ascending: false });

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (is_active !== 'all') {
      query = query.eq('is_active', is_active === 'true');
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) {
      throw new AnnouncementsError(normalizeError(error, 'Error cargando anuncios de administracion'), error);
    }

    return data || [];
  }

  async createAnnouncement(payload) {
    const { error } = await supabase
      .from('announcements')
      .insert([payload]);

    if (error) {
      throw new AnnouncementsError(normalizeError(error, 'Error creando anuncio'), error);
    }
  }

  async updateAnnouncement(announcementId, payload) {
    const { error } = await supabase
      .from('announcements')
      .update(payload)
      .eq('id', announcementId);

    if (error) {
      throw new AnnouncementsError(normalizeError(error, 'Error actualizando anuncio'), error);
    }
  }

  async deleteAnnouncement(announcementId) {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', announcementId);

    if (error) {
      throw new AnnouncementsError(normalizeError(error, 'Error eliminando anuncio'), error);
    }
  }

  async listViewerAnnouncements({ userRole, selectedPriority, limit, nowIso }) {
    let query = supabase
      .from('announcements_with_creator')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (userRole !== 'all') {
      query = query.or(`target_audience.cs.{all},target_audience.cs.{${userRole}}`);
    }

    query = query.or(`expires_at.is.null,expires_at.gt.${nowIso}`);

    if (selectedPriority !== 'all') {
      query = query.eq('priority', selectedPriority);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) {
      throw new AnnouncementsError(normalizeError(error, 'Error cargando anuncios publicos'), error);
    }

    return data || [];
  }
}
