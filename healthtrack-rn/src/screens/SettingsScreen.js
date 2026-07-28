import React from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import { supabase } from '../supabase/supabaseClient';
import { Alert } from '../utils/Alert';

export default function SettingsScreen({ isDark, onToggleDarkMode, onLogout, isDarkTheme }) {
  const c = isDark ? colors.dark : colors.light;

  const handleLogout = () => {
    Alert.alert(
      'Logout Confirmation',
      'Are you sure you want to end this secure health monitoring session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
            } catch (e) {
              console.warn("Failed to sign out", e);
            }
            onLogout();
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: c.text }]}>Settings & Configuration</Text>
        <Text style={[styles.subtitle, { color: c.textMuted }]}>
          Manage local interfaces, API credentials, and user sessions.
        </Text>

        {/* Toggle Dark Mode */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}>
          <View style={styles.settingRow}>
            <View>
              <Text style={[styles.settingLabel, { color: c.text }]}>Display Theme (Dark Mode)</Text>
              <Text style={[styles.settingDesc, { color: c.textMuted }]}>Toggle high contrast color layouts</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={onToggleDarkMode}
              trackColor={{ false: '#CBD5E1', true: c.primary }}
              thumbColor={Platform.OS === 'android' ? '#F8FAFC' : undefined}
            />
          </View>
        </View>

        {/* Health & Notification Preferences */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}>
          <Text style={[styles.sectionHeader, { color: c.primary }]}>HEALTH & NOTIFICATION PREFERENCES</Text>
          
          <View style={styles.metaRow}>
            <Text style={[styles.metaKey, { color: c.textMuted }]}>Dosage Reminders</Text>
            <Text style={[styles.metaVal, { color: c.primary, fontWeight: '700' }]}>Enabled (Push & In-App)</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={[styles.metaKey, { color: c.textMuted }]}>Biometric Measurement Units</Text>
            <Text style={[styles.metaVal, { color: c.text }]}>Metric (kg, mL, mmHg)</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={[styles.metaKey, { color: c.textMuted }]}>AI Health Assistant Mode</Text>
            <Text style={[styles.metaVal, { color: c.text }]}>Gemini Pro Precision</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={[styles.metaKey, { color: c.textMuted }]}>SOS Emergency Alert Delay</Text>
            <Text style={[styles.metaVal, { color: c.text }]}>3 Seconds Countdown</Text>
          </View>
        </View>

        {/* Mock Data Injector */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: c.primary, borderWidth: 1, marginBottom: 10 }]}
          onPress={async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return Alert.alert('Error', 'Not logged in');
              
              // Seed random medicine
              const { error } = await supabase.from('medicines').insert([
                {
                  user_id: user.id,
                  name: `Sample Med ${Math.floor(Math.random() * 100)}`,
                  dosage: "200mg",
                  type: "Tablet",
                  frequency: "Daily",
                  reminder_time: "09:00",
                  period: "Morning",
                  recurring: true,
                  remaining_quantity: 30,
                  total_adherence_count: 5,
                  missed_count: 0,
                  instructions: "Take with water"
                }
              ]);

              if (error) {
                console.error("Seed error:", error);
                Alert.alert('Database Error', `Failed to inject: ${error.message}`);
              } else {
                Alert.alert('Success', 'Successfully injected sample medicine! Go to the Dashboard to see it.');
              }
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          }}
        >
          <Text style={[styles.logoutBtnText, { color: c.primary }]}>Inject Sample Medicine</Text>
        </TouchableOpacity>

        {/* Logout action */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: c.error, borderWidth: 1 }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutBtnText, { color: c.error }]}>End Secure Health Session (Logout)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 20,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  metaKey: {
    fontSize: 12,
  },
  metaVal: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
