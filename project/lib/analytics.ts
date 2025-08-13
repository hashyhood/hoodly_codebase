import { Platform } from 'react-native';
import { supabase } from './supabase';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
}

interface AnalyticsUser {
  id: string;
  properties?: Record<string, any>;
}

class Analytics {
  private isInitialized = false;
  private userId: string | null = null;
  private sessionId: string | null = null;
  private queue: AnalyticsEvent[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize analytics service
      console.log('Analytics initialized');
      this.isInitialized = true;
      
      // Process any queued events
      this.processQueue();
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    for (const event of events) {
      await this.trackEvent(event.event, event.properties);
    }
  }

  async trackEvent(event: string, properties?: Record<string, any>): Promise<void> {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        platform: Platform.OS,
        sessionId: this.sessionId,
        timestamp: Date.now(),
      },
      userId: this.userId || undefined,
    };

    if (!this.isInitialized) {
      this.queue.push(analyticsEvent);
      return;
    }

    try {
      // Send to analytics service
      await this.sendEvent(analyticsEvent);
      
      // DB sink - store in analytics_events table
      await this.track(event, properties, this.userId || undefined);
      
      console.log('Analytics event tracked:', event, properties);
    } catch (error) {
      console.error('Failed to track analytics event:', error);
      // Re-queue failed events
      this.queue.push(analyticsEvent);
    }
  }

  // DB sink - store analytics events in database
  async track(event: string, properties?: Record<string, any>, userId?: string): Promise<void> {
    try {
      if (!this.isInitialized) await this.initialize();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('analytics_events').insert({
        user_id: userId || user?.id || null,
        event,
        props: properties || {},
      });
    } catch (e) {
      console.warn('analytics.track failed', e);
    }
  }

  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    // Implementation depends on your analytics service
    // For now, we'll just log the event
    console.log('Analytics event:', JSON.stringify(event, null, 2));
    
    // You can integrate with services like:
    // - Firebase Analytics
    // - Mixpanel
    // - Amplitude
    // - Segment
    // - Custom analytics service
  }

  async identifyUser(userId: string, properties?: Record<string, any>): Promise<void> {
    this.userId = userId;
    
    const userData: AnalyticsUser = {
      id: userId,
      properties: {
        ...properties,
        platform: Platform.OS,
        sessionId: this.sessionId,
        identifiedAt: Date.now(),
      },
    };

    try {
      await this.sendUserData(userData);
      console.log('User identified:', userId);
    } catch (error) {
      console.error('Failed to identify user:', error);
    }
  }

  private async sendUserData(userData: AnalyticsUser): Promise<void> {
    // Implementation depends on your analytics service
    console.log('User data:', JSON.stringify(userData, null, 2));
  }

  async trackScreen(screenName: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('screen_view', {
      screen_name: screenName,
      ...properties,
    });
  }

  async trackUserAction(action: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('user_action', {
      action,
      ...properties,
    });
  }

  async trackError(error: Error, context?: string): Promise<void> {
    await this.trackEvent('error', {
      error_message: error.message,
      error_stack: error.stack,
      context,
    });
  }

  async trackPerformance(metric: string, value: number, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('performance', {
      metric,
      value,
      ...properties,
    });
  }

  // Social features tracking
  async trackFriendRequest(sent: boolean, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('friend_request', {
      action: sent ? 'sent' : 'received',
      ...properties,
    });
  }

  async trackPostCreated(properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('post_created', properties);
  }

  async trackPostLiked(properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('post_liked', properties);
  }

  async trackCommentAdded(properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('comment_added', properties);
  }

  async trackMessageSent(properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('message_sent', properties);
  }

  async trackGroupJoined(properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('group_joined', properties);
  }

  async trackEventCreated(properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('event_created', properties);
  }

  async trackEventJoined(properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('event_joined', properties);
  }

  // Location features tracking
  async trackLocationShared(properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('location_shared', properties);
  }

  async trackNearbyUsersFound(count: number, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('nearby_users_found', {
      count,
      ...properties,
    });
  }

  // Notification tracking
  async trackNotificationReceived(type: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('notification_received', {
      notification_type: type,
      ...properties,
    });
  }

  async trackNotificationOpened(type: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('notification_opened', {
      notification_type: type,
      ...properties,
    });
  }

  // App usage tracking
  async trackAppOpen(): Promise<void> {
    await this.trackEvent('app_open');
  }

  async trackAppClose(): Promise<void> {
    await this.trackEvent('app_close');
  }

  async trackFeatureUsed(feature: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('feature_used', {
      feature,
      ...properties,
    });
  }

  // User engagement tracking
  async trackSessionStart(): Promise<void> {
    await this.trackEvent('session_start');
  }

  async trackSessionEnd(duration: number): Promise<void> {
    await this.trackEvent('session_end', {
      duration_seconds: duration,
    });
  }

  async trackUserEngagement(engagementType: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('user_engagement', {
      engagement_type: engagementType,
      ...properties,
    });
  }

  // Privacy and settings tracking
  async trackPrivacySettingChanged(setting: string, value: any): Promise<void> {
    await this.trackEvent('privacy_setting_changed', {
      setting,
      value,
    });
  }

  async trackNotificationSettingChanged(setting: string, enabled: boolean): Promise<void> {
    await this.trackEvent('notification_setting_changed', {
      setting,
      enabled,
    });
  }

  // Error and crash tracking
  async trackCrash(error: Error, stackTrace?: string): Promise<void> {
    await this.trackEvent('crash', {
      error_message: error.message,
      stack_trace: stackTrace || error.stack,
    });
  }

  async trackApiError(endpoint: string, statusCode: number, error: string): Promise<void> {
    await this.trackEvent('api_error', {
      endpoint,
      status_code: statusCode,
      error,
    });
  }

  // Utility methods
  setUserId(userId: string): void {
    this.userId = userId;
  }

  getUserId(): string | null {
    return this.userId;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  clearUser(): void {
    this.userId = null;
  }

  async flush(): Promise<void> {
    await this.processQueue();
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Initialize analytics on import
analytics.initialize().catch(console.error); 