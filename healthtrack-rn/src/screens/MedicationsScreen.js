import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { colors } from '../theme/colors';
import { Alert } from '../utils/Alert';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function MedicationsScreen({
  medicines = [],
  onAddPress,
  onEditPress,
  onMarkMedicineStatus,
  onDeleteMedicine,
  onRefreshData,
  isDark,
}) {
  const c = isDark ? colors.dark : colors.light;
  const notificationTimers = useRef({});

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          await Notifications.requestPermissionsAsync();
        }
        for (const med of medicines) {
          await scheduleMedicationNotification(med);
        }
      } catch (e) {
        console.warn('Notification permission error:', e);
      }
    })();
  }, [medicines]);

  const [search, setSearch] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('All'); // All, Morning, Afternoon, Night

  const todayDateString = new Date().toISOString().split('T')[0];

  const scheduleMedicationNotification = async (med) => {
    if (!med || !med.reminder_time) return;
    const [hourStr, minuteStr] = med.reminder_time.split(':');
    const now = new Date();
    const reminder = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hourStr, 10), parseInt(minuteStr, 10));
    if (reminder.getTime() <= now.getTime()) {
      reminder.setDate(reminder.getDate() + 1);
    }
    const triggerMs = reminder.getTime() - now.getTime();
    if (triggerMs <= 0) return;

    // Schedule native expo notification if on device
    if (Device.isDevice) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '⏰ Medication Reminder',
            body: `It is time to take ${med.name} (${med.dosage || ''}). Instructions: ${med.instructions || 'Take as prescribed.'}`,
            data: { medId: med.id },
            sound: true,
          },
          trigger: { seconds: Math.max(1, Math.round(triggerMs / 1000)) },
        });
      } catch (err) {
        console.warn('Native notification schedule error:', err);
      }
    }

    // Timer fallback for active app / emulator / web view testing
    if (notificationTimers.current[med.id]) {
      clearTimeout(notificationTimers.current[med.id]);
    }
    notificationTimers.current[med.id] = setTimeout(async () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([500, 250, 500, 250, 500]);
          const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
          if (perm === 'granted') {
            const notifTitle = '⏰ Medication Reminder';
            const notifBody = `Time to take ${med.name} (${med.dosage || ''}). ${med.instructions || ''}`;
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('./sw.js').then(reg => {
                reg.showNotification(notifTitle, {
                  body: notifBody,
                  icon: 'https://cdn-icons-png.flaticon.com/512/883/883407.png',
                  vibrate: [500, 250, 500],
                  requireInteraction: true
                });
              }).catch(() => new Notification(notifTitle, { body: notifBody }));
            } else {
              new Notification(notifTitle, { body: notifBody });
            }
          }
        } catch (e) { console.log('notif err', e); }
      }
      Alert.alert(
        '⏰ MEDICATION REMINDER',
        `Time to take your medication: ${med.name} (${med.dosage || ''})\n${med.instructions ? 'Instructions: ' + med.instructions : ''}`,
        [
          { text: 'Mark as Taken', onPress: () => handleMarkTaken(med) },
          { text: 'Dismiss', style: 'cancel' }
        ]
      );
    }, triggerMs);
  };

  const handleDeleteMed = (med) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to remove ${med.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDeleteMedicine(med.id);
          }
        }
      ]
    );
  };

  // Filter medicines
  const filteredMeds = medicines.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || 
                        (m.instructions && m.instructions.toLowerCase().includes(search.toLowerCase()));
    const matchPeriod = filterPeriod === 'All' || m.period.toLowerCase() === filterPeriod.toLowerCase();
    return matchSearch && matchPeriod;
  });

  const testPhoneNotification = async () => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([300, 100, 300, 100, 300]);
        const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
        if (perm === 'granted') {
          if ('serviceWorker' in navigator) {
            try {
              const reg = await navigator.serviceWorker.register('./sw.js');
              await reg.showNotification('⏰ Medication Reminder Alarm', {
                body: 'It is time to take your scheduled medication dose.',
                icon: 'https://cdn-icons-png.flaticon.com/512/883/883407.png',
                badge: 'https://cdn-icons-png.flaticon.com/512/883/883407.png',
                vibrate: [300, 100, 300, 100, 300],
                requireInteraction: true,
                tag: 'medication-alarm-test-' + Date.now(),
              });
            } catch (e) {
              new Notification('⏰ Medication Reminder Alarm', {
                body: 'It is time to take your scheduled medication dose.',
                icon: 'https://cdn-icons-png.flaticon.com/512/883/883407.png',
                requireInteraction: true,
              });
            }
          } else {
            new Notification('⏰ Medication Reminder Alarm', {
              body: 'It is time to take your scheduled medication dose.',
              icon: 'https://cdn-icons-png.flaticon.com/512/883/883407.png',
              requireInteraction: true,
            });
          }
        } else {
          Alert.alert('Permission Needed', 'Please allow Notification permissions in your browser or phone settings.');
          return;
        }
      } else {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '⏰ Medication Reminder Alarm',
            body: 'It is time to take your scheduled medication dose.',
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.MAX,
            vibrate: [0, 250, 250, 250],
          },
          trigger: null,
        });
      }
      Alert.alert('🔔 Success', 'Home screen notification sent to your phone!');
    } catch (err) {
      Alert.alert('Notification Notice', 'Please allow notification permissions in your phone or browser settings.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: c.surface, color: c.text, borderColor: c.border, borderWidth: 1 }]}
          placeholder="Search active prescriptions..."
          placeholderTextColor={c.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={[styles.testNotifBtn, { backgroundColor: c.primary + '15', borderColor: c.primary, borderWidth: 1, marginTop: 10, padding: 12, borderRadius: 12, alignItems: 'center' }]}
          onPress={testPhoneNotification}
        >
          <Text style={{ color: c.primary, fontWeight: '700', fontSize: 13 }}>🔔 Test Phone Home Screen Notification</Text>
        </TouchableOpacity>
      </View>

      {/* Period Filtering Tabs */}
      <View style={styles.tabRow}>
        {['All', 'Morning', 'Afternoon', 'Night'].map((period) => {
          const isSelected = filterPeriod === period;
          return (
            <TouchableOpacity
              key={period}
              style={[
                styles.tabBtn,
                { borderBottomColor: isSelected ? c.primary : 'transparent', borderBottomWidth: isSelected ? 3 : 0 }
              ]}
              onPress={() => setFilterPeriod(period)}
            >
              <Text style={[styles.tabBtnText, { color: isSelected ? c.primary : c.textMuted, fontWeight: isSelected ? 'bold' : 'normal' }]}>
                {period}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Medicines List */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {filteredMeds.length === 0 ? (
          <Text style={[styles.emptyLabel, { color: c.textMuted }]}>No medicines configured in this category.</Text>
        ) : (
          filteredMeds.map((med) => {
            const isLowStock = med.remaining_quantity <= 5;
            let extractedDate = med.date;
            let cleanInstructions = med.instructions || '';
            if (cleanInstructions.startsWith('[Date: ')) {
              const match = cleanInstructions.match(/^\[Date:\s*([^\]]+)\]/);
              if (match) extractedDate = match[1];
              cleanInstructions = cleanInstructions.replace(/^\[Date:\s*[^\]]+\]\s*/, '');
            }
            const medDateStr = extractedDate || (med.created_at ? new Date(med.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }));
            return (
              <View
                key={med.id}
                style={[styles.medCard, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}
              >
                <View style={styles.medCardHeader}>
                  <View>
                    <Text style={[styles.medName, { color: c.text }]}>{med.name}</Text>
                    <Text style={[styles.medDetails, { color: c.textMuted }]}>
                      {med.dosage}  •  {med.type}  •  📅 Date: {medDateStr}
                    </Text>
                  </View>
                  <View style={styles.timeBadge}>
                    <Text style={[styles.timeText, { color: c.primary }]}>{med.reminder_time}</Text>
                    <Text style={[styles.periodText, { color: c.textMuted }]}>{med.period}</Text>
                  </View>
                </View>

                {cleanInstructions ? (
                  <Text style={[styles.medInst, { color: c.textMuted }]}>
                    📝 {cleanInstructions}
                  </Text>
                ) : null}

                <View style={styles.stockAdherenceRow}>
                  <Text style={[styles.statLabel, { color: isLowStock ? c.error : c.textMuted, fontWeight: isLowStock ? 'bold' : 'normal' }]}>
                    Stock: {med.remaining_quantity} left
                  </Text>
                  <Text style={[styles.statLabel, { color: c.textMuted }]}>
                    Taken: {med.total_adherence_count}  •  Missed: {med.missed_count}
                  </Text>
                </View>

                {/* Quick actions panel */}
                <View style={[styles.actionsRow, { borderTopColor: c.border, borderTopWidth: 1 }]}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: c.primary + '15' }]}
                    onPress={() => handleMarkTaken(med)}
                  >
                    <Text style={[styles.actionBtnText, { color: c.primary }]}>Taken</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: c.error + '15', marginLeft: 6 }]}
                    onPress={() => onMarkMedicineStatus(med, 'Missed')}
                  >
                    <Text style={[styles.actionBtnText, { color: c.error }]}>Missed</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: c.inputBg, marginLeft: 6 }]}
                    onPress={() => onEditPress(med)}
                  >
                    <Text style={[styles.actionBtnText, { color: c.text }]}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.deleteBtn, { marginLeft: 6 }]}
                    onPress={() => handleDeleteMed(med)}
                  >
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.floatingAddBtn, { backgroundColor: c.primary }]}
        onPress={onAddPress}
      >
        <Text style={styles.addBtnIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tabBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tabBtnText: {
    fontSize: 14,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyLabel: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  medCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  medCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  medDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  timeBadge: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  periodText: {
    fontSize: 10,
    fontWeight: '600',
  },
  medInst: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  stockAdherenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 11,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingTop: 12,
    alignItems: 'center',
  },
  actionBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFE4E6',
  },
  deleteBtnText: {
    fontSize: 14,
  },
  floatingAddBtn: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  addBtnIcon: {
    color: '#FFF',
    fontSize: 30,
    fontWeight: '300',
    marginTop: -2,
  },
});
