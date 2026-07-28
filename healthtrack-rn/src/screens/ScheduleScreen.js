import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';

export default function ScheduleScreen({ medicines, medicationLogs, onMarkMedicineStatus, isDark }) {
  const c = isDark ? colors.dark : colors.light;

  const todayDateString = new Date().toISOString().split('T')[0];
  const logs = medicationLogs || [];

  const handleMarkTaken = (med) => {
    onMarkMedicineStatus(med, 'Taken');
  };

  const renderPeriodTimeline = (periodTitle, icon) => {
    const periodMeds = medicines.filter(m => m.period.toLowerCase() === periodTitle.toLowerCase());
    
    return (
      <View style={styles.periodSection}>
        <View style={styles.periodHeader}>
          <Text style={styles.periodHeaderIcon}>{icon}</Text>
          <Text style={[styles.periodHeaderTitle, { color: c.text }]}>{periodTitle}</Text>
        </View>

        {periodMeds.length === 0 ? (
          <Text style={[styles.emptyLabel, { color: c.textMuted }]}>
            No medicines scheduled in this period.
          </Text>
        ) : (
          periodMeds.map(med => {
            const medLog = logs.find(l => l.medicine_id === med.id);
            const status = medLog?.status || 'Pending';
            
            let statusColor = c.textMuted;
            if (status === 'Taken') statusColor = colors.light.success;
            if (status === 'Missed') statusColor = colors.light.error;

            return (
              <View
                key={med.id}
                style={[styles.scheduleCard, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}
              >
                <View style={styles.scheduleHeader}>
                  <View style={styles.flex1}>
                    <Text style={[styles.medName, { color: c.text }]}>{med.name} ({med.dosage})</Text>
                    <Text style={[styles.medTime, { color: c.primary }]}>⏰ {med.reminder_time}</Text>
                  </View>
                  <View style={styles.statusBox}>
                    <Text style={[styles.statusText, { color: statusColor, fontWeight: 'bold' }]}>
                      {status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <Text style={[styles.instructions, { color: c.textMuted }]}>
                    {med.instructions || 'Take with food'}
                  </Text>
                  
                  {status === 'Pending' && (
                    <TouchableOpacity
                      style={[styles.takeBtn, { backgroundColor: c.primary }]}
                      onPress={() => handleMarkTaken(med)}
                    >
                      <Text style={styles.takeBtnText}>Mark Taken</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.scrollContent}>
      <Text style={[styles.title, { color: c.text }]}>Today's Schedule</Text>
      <Text style={[styles.subtitle, { color: c.textMuted }]}>
        Track intake compliance markers sequentially throughout the day.
      </Text>

      {renderPeriodTimeline('Morning', '🌅')}
      {renderPeriodTimeline('Afternoon', '☀️')}
      {renderPeriodTimeline('Night', '🌙')}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
  periodSection: {
    marginBottom: 24,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  periodHeaderIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  periodHeaderTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  emptyLabel: {
    fontSize: 12,
    marginLeft: 28,
  },
  scheduleCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  flex1: {
    flex: 1,
  },
  medName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  medTime: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statusBox: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instructions: {
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  takeBtn: {
    paddingHorizontal: 16,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  takeBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
