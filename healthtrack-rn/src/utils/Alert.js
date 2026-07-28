import { Alert as RNAlert, Platform } from 'react-native';

export const Alert = {
  alert: (title, message, buttons) => {
    if (Platform.OS === 'web') {
      if (buttons && buttons.length > 0) {
        // If there's a Cancel/destructive/action button arrangement
        const cancelBtn = buttons.find(b => b.style === 'cancel' || b.text?.toLowerCase() === 'cancel');
        const actionBtn = buttons.find(b => b.style !== 'cancel' && b.text?.toLowerCase() !== 'cancel');
        
        if (cancelBtn && actionBtn) {
          const result = window.confirm(`${title}\n\n${message}`);
          if (result) {
            if (actionBtn.onPress) actionBtn.onPress();
          } else {
            if (cancelBtn.onPress) cancelBtn.onPress();
          }
        } else {
          // General fallback for single button or first action button
          const primaryBtn = buttons[0];
          const result = window.confirm(`${title}\n\n${message}`);
          if (result && primaryBtn && primaryBtn.onPress) {
            primaryBtn.onPress();
          }
        }
      } else {
        window.alert(`${title}\n\n${message}`);
      }
    } else {
      RNAlert.alert(title, message, buttons);
    }
  }
};
