// Google Analytics tracking utilities
// This module provides helper functions for tracking custom events in Google Analytics

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Check if gtag is available (for development/production environments)
const isGtagAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

// Enhanced debug logging
const debugLog = (eventName: string, eventCategory: string, parameters: Record<string, any>) => {
  console.group(`🔍 [Analytics] ${eventName}`);
  console.log('Category:', eventCategory);
  console.log('Parameters:', parameters);
  console.log('Timestamp:', new Date().toISOString());
  console.groupEnd();
};

// Generic event tracking function
export const trackEvent = (
  eventName: string,
  eventCategory: string,
  parameters: Record<string, any> = {}
) => {
  // Always show debug info in development
  if (process.env.NODE_ENV === 'development') {
    debugLog(eventName, eventCategory, parameters);
  }

  if (!isGtagAvailable()) {
    console.warn('Google Analytics not available - event not sent to GA');
    return;
  }

  try {
    window.gtag('event', eventName, {
      event_category: eventCategory,
      ...parameters,
    });
    
    // Confirm event was sent in production
    if (process.env.NODE_ENV === 'production') {
      console.log(`✅ GA Event: ${eventName}`);
    }
  } catch (error) {
    console.error('❌ Error tracking event:', error);
  }
};

// Specific tracking functions for different user interactions

export const trackModeChange = (newMode: string, previousMode: string) => {
  trackEvent('mode_change', 'navigation', {
    new_mode: newMode,
    previous_mode: previousMode,
  });
};

export const trackEmojiInput = (emoji: string, inputMethod: 'typing' | 'random') => {
  trackEvent('emoji_input', 'content', {
    emoji: emoji,
    input_method: inputMethod,
    emoji_length: emoji.length,
  });
};

export const trackRandomizeEmoji = (newEmoji: string) => {
  trackEvent('randomize_emoji', 'interaction', {
    generated_emoji: newEmoji,
  });
};

export const trackColorChange = (
  color: string, 
  inputMethod: 'text_input' | 'color_picker' | 'random'
) => {
  trackEvent('color_change', 'customization', {
    color: color,
    input_method: inputMethod,
  });
};

export const trackTextareaInput = (
  contentLength: number,
  hasContent: boolean,
  content?: string
) => {
  const eventData: Record<string, any> = {
    content_length: contentLength,
    has_content: hasContent,
  };

  // Only include actual content if it's not too sensitive/long
  // You can adjust this based on your privacy requirements
  if (content && content.length <= 100) {
    eventData.content_preview = content;
  }

  trackEvent('ai_description_input', 'content', eventData);
};

export const trackImageSizeChange = (
  size: number, 
  mode: 'ai' | 'paste',
  interactionType: 'start' | 'change' | 'end'
) => {
  trackEvent('image_size_change', 'customization', {
    size: size,
    mode: mode,
    interaction_type: interactionType,
  });
};

export const trackPasteImage = (success: boolean, fileType?: string) => {
  trackEvent('paste_image', 'content', {
    success: success,
    file_type: fileType || 'unknown',
  });
};

export const trackDownload = (mode: string, hasCustomizations: boolean) => {
  trackEvent('download_png', 'conversion', {
    mode: mode,
    has_customizations: hasCustomizations,
  });
};

export const trackAiGeneration = (
  action: 'start' | 'success' | 'error',
  descriptionLength?: number,
  errorMessage?: string
) => {
  const eventData: Record<string, any> = {
    action: action,
  };

  if (descriptionLength !== undefined) {
    eventData.description_length = descriptionLength;
  }

  if (errorMessage) {
    eventData.error_type = errorMessage.substring(0, 50); // Truncate long error messages
  }

  trackEvent('ai_generation', 'content', eventData);
};

// Utility function to track user engagement
export const trackEngagement = (interactionType: string, details: Record<string, any> = {}) => {
  trackEvent('user_engagement', 'engagement', {
    interaction_type: interactionType,
    ...details,
  });
};