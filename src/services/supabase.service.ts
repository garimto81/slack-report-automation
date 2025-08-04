import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Report } from '../types';

export class SupabaseService {
  private client: SupabaseClient;

  constructor(url: string, key: string) {
    this.client = createClient(url, key);
  }

  async saveReport(report: Report): Promise<void> {
    const { error } = await this.client
      .from('reports')
      .insert({
        type: report.type,
        channel_id: report.channelId,
        analysis: report.analysis,
        sent_to: report.sentTo,
        created_at: report.createdAt
      });

    if (error) {
      console.error('Error saving report:', error);
    }
  }

  async getReports(type?: string, limit = 10): Promise<Report[]> {
    let query = this.client
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reports:', error);
      return [];
    }

    return data?.map(row => ({
      id: row.id,
      type: row.type,
      channelId: row.channel_id,
      analysis: row.analysis,
      sentTo: row.sent_to,
      createdAt: new Date(row.created_at)
    })) || [];
  }
}