import * as Sentry from 'sentry-expo';

// Helper function to capture errors
export const captureError = (error: Error | string, context?: Record<string, any>) => {
  if (typeof error === 'string') {
    Sentry.Native.captureMessage(error, 'error');
  } else {
    Sentry.Native.captureException(error, {
      extra: context,
    });
  }
};

// Helper function to capture messages
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.Native.captureMessage(message, level);
};

// Helper function to set user context
export const setUser = (user: { id: string; email?: string; username?: string }) => {
  Sentry.Native.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
};

// Helper function to clear user context
export const clearUser = () => {
  Sentry.Native.setUser(null);
};

// Helper function to add breadcrumbs
export const addBreadcrumb = (
  message: string,
  category: string = 'app',
  data?: Record<string, any>
) => {
  Sentry.Native.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
};

// Helper function to set tags
export const setTag = (key: string, value: string) => {
  Sentry.Native.setTag(key, value);
};

// Helper function to set extra context
export const setExtra = (key: string, value: any) => {
  Sentry.Native.setExtra(key, value);
};
