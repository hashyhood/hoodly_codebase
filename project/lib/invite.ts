import { supabase } from './supabase';
import { analytics } from './analytics';

export interface InviteLink {
  id: string;
  code: string;
  type: 'user' | 'group' | 'event';
  created_by: string;
  created_at: string;
  expires_at?: string;
  max_uses?: number;
  current_uses: number;
  is_active: boolean;
  metadata?: Record<string, any>;
}

export interface CreateInviteLinkParams {
  type: 'user' | 'group' | 'event';
  expires_at?: string;
  max_uses?: number;
  metadata?: Record<string, any>;
}

export interface UseInviteLinkParams {
  code: string;
  used_by: string;
}

class InviteService {
  async createInviteLink(params: CreateInviteLinkParams): Promise<InviteLink> {
    try {
      const code = this.generateInviteCode();
      
      const { data, error } = await supabase
        .from('invite_links')
        .insert({
          code,
          type: params.type,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          expires_at: params.expires_at,
          max_uses: params.max_uses,
          current_uses: 0,
          is_active: true,
          metadata: params.metadata,
        })
        .select()
        .single();

      if (error) throw error;

      await analytics.trackEvent('invite_link_created', {
        invite_type: params.type,
        code,
      });

      return data;
    } catch (error) {
      console.error('Error creating invite link:', error);
      throw error;
    }
  }

  async getInviteLink(code: string): Promise<InviteLink | null> {
    try {
      const { data, error } = await supabase
        .from('invite_links')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting invite link:', error);
      throw error;
    }
  }

  async useInviteLink(params: UseInviteLinkParams): Promise<boolean> {
    try {
      const inviteLink = await this.getInviteLink(params.code);
      
      if (!inviteLink) {
        throw new Error('Invalid or expired invite link');
      }

      // Check if expired
      if (inviteLink.expires_at && new Date(inviteLink.expires_at) < new Date()) {
        throw new Error('Invite link has expired');
      }

      // Check if max uses reached
      if (inviteLink.max_uses && inviteLink.current_uses >= inviteLink.max_uses) {
        throw new Error('Invite link has reached maximum uses');
      }

      // Update usage count
      const { error } = await supabase
        .from('invite_links')
        .update({ 
          current_uses: inviteLink.current_uses + 1,
          is_active: inviteLink.max_uses ? inviteLink.current_uses + 1 < inviteLink.max_uses : true,
        })
        .eq('code', params.code);

      if (error) throw error;

      // Record usage
      await supabase
        .from('invite_link_usage')
        .insert({
          invite_link_id: inviteLink.id,
          used_by: params.used_by,
          used_at: new Date().toISOString(),
        });

      await analytics.trackEvent('invite_link_used', {
        invite_type: inviteLink.type,
        code: params.code,
      });

      return true;
    } catch (error) {
      console.error('Error using invite link:', error);
      throw error;
    }
  }

  async getUserInviteLinks(userId: string): Promise<InviteLink[]> {
    try {
      const { data, error } = await supabase
        .from('invite_links')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting user invite links:', error);
      throw error;
    }
  }

  async deactivateInviteLink(code: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('invite_links')
        .update({ is_active: false })
        .eq('code', code);

      if (error) throw error;

      await analytics.trackEvent('invite_link_deactivated', {
        code,
      });
    } catch (error) {
      console.error('Error deactivating invite link:', error);
      throw error;
    }
  }

  async getInviteLinkStats(code: string): Promise<{
    total_uses: number;
    recent_uses: number;
    unique_users: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('invite_link_usage')
        .select('*')
        .eq('invite_link_id', code);

      if (error) throw error;

      const uses = data || [];
      const uniqueUsers = new Set(uses.map(use => use.used_by)).size;
      const recentUses = uses.filter(use => {
        const useDate = new Date(use.used_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return useDate > weekAgo;
      }).length;

      return {
        total_uses: uses.length,
        recent_uses: recentUses,
        unique_users: uniqueUsers,
      };
    } catch (error) {
      console.error('Error getting invite link stats:', error);
      throw error;
    }
  }

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Utility methods for different invite types
  async createUserInviteLink(expiresAt?: string): Promise<InviteLink> {
    return this.createInviteLink({
      type: 'user',
      expires_at: expiresAt,
      max_uses: 1,
    });
  }

  async createGroupInviteLink(groupId: string, maxUses?: number, expiresAt?: string): Promise<InviteLink> {
    return this.createInviteLink({
      type: 'group',
      expires_at: expiresAt,
      max_uses: maxUses,
      metadata: { group_id: groupId },
    });
  }

  async createEventInviteLink(eventId: string, maxUses?: number, expiresAt?: string): Promise<InviteLink> {
    return this.createInviteLink({
      type: 'event',
      expires_at: expiresAt,
      max_uses: maxUses,
      metadata: { event_id: eventId },
    });
  }

  // Validation methods
  isValidInviteCode(code: string): boolean {
    return /^[A-Z0-9]{8}$/.test(code);
  }

  isExpired(inviteLink: InviteLink): boolean {
    if (!inviteLink.expires_at) return false;
    return new Date(inviteLink.expires_at) < new Date();
  }

  isMaxUsesReached(inviteLink: InviteLink): boolean {
    if (!inviteLink.max_uses) return false;
    return inviteLink.current_uses >= inviteLink.max_uses;
  }

  canUseInviteLink(inviteLink: InviteLink): boolean {
    return inviteLink.is_active && 
           !this.isExpired(inviteLink) && 
           !this.isMaxUsesReached(inviteLink);
  }

  // Format methods
  formatInviteLink(code: string): string {
    return `https://hoodly.app/invite/${code}`;
  }

  formatExpiryDate(expiresAt: string): string {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    return `Expires in ${diffDays} days`;
  }

  // Share methods
  async shareInviteLink(code: string, platform?: string): Promise<void> {
    const inviteLink = await this.getInviteLink(code);
    if (!inviteLink) throw new Error('Invalid invite link');

    const shareText = this.generateShareText(inviteLink);
    
    // You can integrate with native sharing here
    console.log('Share text:', shareText);
    
    await analytics.trackEvent('invite_link_shared', {
      invite_type: inviteLink.type,
      code,
      platform,
    });
  }

  private generateShareText(inviteLink: InviteLink): string {
    const baseUrl = this.formatInviteLink(inviteLink.code);
    
    switch (inviteLink.type) {
      case 'user':
        return `Join me on Hoodly! Use my invite code: ${inviteLink.code}\n\nDownload the app and enter this code to get exclusive rewards! 🎉\n\n${baseUrl}`;
      case 'group':
        return `Join our group on Hoodly! Use this invite code: ${inviteLink.code}\n\n${baseUrl}`;
      case 'event':
        return `Join our event on Hoodly! Use this invite code: ${inviteLink.code}\n\n${baseUrl}`;
      default:
        return `Join Hoodly! Use this invite code: ${inviteLink.code}\n\n${baseUrl}`;
    }
  }
}

export const inviteService = new InviteService(); 
export default inviteService; 