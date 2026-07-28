import React, { useState, useEffect, useRef } from 'react';
import SummaryCard from '../components/SummaryCard';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated,
  Linking,
} from 'react-native';
import { colors } from '../theme/colors';
import { getHealthSuggestions } from '../network/geminiClient';
const { width } = Dimensions.get('window');

export default function DashboardScreen({
  user,
  medicines,
  healthLogs,
  moodLogs,
  medicationLogs,
  onLogMood,
  onLogVitalsPress,
  onSosPress,
  isDark,
  onRefreshData,
  onAddMedicinePress,
}) {
  const c = isDark ? colors.dark : colors.light;
  const fadeAnim = useRef(new Animated.Value(0)).current;


  const [aiSuggestion, setAiSuggestion] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);

  // Vitals stats calculations
  const latestLog = healthLogs?.[0] || null;
  const latestMood = moodLogs?.[0] || null;

  // Fade-in animation trigger
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Compute summary card data
  const todayMedsRemaining = medicines ? medicines.filter(m => {
    if (!m.reminder_time) return false;
    const parts = m.reminder_time.split(':');
    if (parts.length < 2) return false;
    const [h, mnt] = parts;
    const now = new Date();
    const reminder = new Date();
    reminder.setHours(parseInt(h, 10), parseInt(mnt, 10), 0, 0);
    return reminder >= now;
  }) : [];

  const medsValue = todayMedsRemaining.length > 0
    ? todayMedsRemaining.map(m => m.name).join(', ')
    : 'None remaining';

  const bpString = latestLog
    ? `${latestLog.systolic_bp || '--'}/${latestLog.diastolic_bp || '--'}`
    : '--/--';
  const hrString = latestLog ? `${latestLog.heart_rate || '--'} bpm` : '-- bpm';
  const bsString = latestLog ? `${latestLog.blood_sugar || '--'} mg/dL` : '-- mg/dL';
  const healthStatsValue = latestLog
    ? `BP: ${bpString}\nHR: ${hrString}\nSugar: ${bsString}`
    : 'No vitals logged';

  const moodValue = latestMood
    ? `${latestMood.mood || 'Neutral'}\n${new Date(latestMood.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'No mood logged';


  // Calculate Pill Adherence today
  const todayDateString = new Date().toISOString().split('T')[0];
  const todayLogs = medicationLogs ? medicationLogs.filter(l => l.date_string === todayDateString) : [];

  useEffect(() => {
    refreshSuggestions();
  }, [medicines, healthLogs, moodLogs]);

  const refreshSuggestions = async () => {
    setLoadingAi(true);
    try {
      const suggestions = await getHealthSuggestions(latestLog, medicines, user, latestMood?.mood);
      setAiSuggestion(suggestions);
    } catch (e) {
      setAiSuggestion("Offline recommendation system error. Please review your manual log sheets.");
    } finally {
      setLoadingAi(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefreshData();
    await refreshSuggestions();
    setRefreshing(false);
  };

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
    onLogMood(mood);
  };

  // Compute adherence score
  const adherencePercent = (() => {
    if (todayLogs.length === 0) return 100;
    const taken = todayLogs.filter(l => l.status === 'Taken').length;
    return Math.round((taken / todayLogs.length) * 100) || 100;
  })();

  // Calculate dynamic health rating index
  const wellnessScore = (() => {
    if (!latestLog) return 85; // Default neutral starting score
    let score = 100;
    const sys = latestLog.systolic_bp;
    const dia = latestLog.diastolic_bp;
    const sugar = latestLog.blood_sugar;
    const spo2 = latestLog.oxygen_saturation;
    const sleep = latestLog.sleep_hours;
    const water = latestLog.water_intake_ml;
    const steps = latestLog.steps;

    if (sys && dia) {
      if (sys >= 140 || dia >= 90) score -= 15;
      else if (sys >= 130 || dia >= 80) score -= 5;
    }
    if (sugar && (sugar > 125.0 || sugar < 70.0)) score -= 10;
    if (spo2 && spo2 < 95) score -= 15;
    if (sleep && sleep < 7.0) score -= 10;
    if (water && water < 1500) score -= 10;
    if (steps && steps < 5000) score -= 10;

    return Math.max(0, Math.min(100, score));
  })();

  const hasLowRefills = medicines?.some(m => m.remaining_quantity <= 5);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 17) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  const getNextMedicine = () => {
    if (!medicines || medicines.length === 0) return null;
    const sorted = [...medicines].sort((a, b) => a.reminder_time.localeCompare(b.reminder_time));
    return sorted[0];
  };

  const nextMed = getNextMedicine();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={c.primary} />
      }
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Top Greeting Block */}
        <View style={styles.headerRow}>
          <View style={styles.greetingContainer}>
            <Text style={[styles.greetingSub, { color: c.textMuted }]}>{getGreeting()}</Text>
            <Text style={[styles.userName, { color: c.text }]} numberOfLines={1}>{user?.full_name || 'Valued Patient'}</Text>
            <Text style={[styles.dateText, { color: c.primary }]}>
              {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>

          {/* Profile Summary */}
          <View style={[styles.profileCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.profileItem, styles.profileName, { color: c.text }]} numberOfLines={1}>{user?.full_name || ''}</Text>
            <Text style={[styles.profileItem, { color: c.textMuted }]} numberOfLines={1}>{user?.age ? `${user.age} yrs` : ''} • {user?.gender || ''}</Text>
            <Text style={[styles.profileItem, { color: c.textMuted }]} numberOfLines={1}>{user?.blood_group || ''}</Text>
            {user?.emergency_contact_number && (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${user.emergency_contact_number}`)}>
                <Text style={[styles.profileItem, styles.emergencyText, { color: c.error }]} numberOfLines={1}>
                  Emergency: {user.emergency_contact_name || ''} ({user.emergency_contact_number})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Summary Cards Row */}
        <View style={styles.summaryRow}>
          <SummaryCard
            title="Today's Meds"
            value={medsValue}
            icon={<Text style={{ fontSize: 20 }}>💊</Text>}
            isDark={isDark}
          />
          <SummaryCard
            title="Health Stats"
            value={healthStatsValue}
            icon={<Text style={{ fontSize: 20 }}>❤️</Text>}
            isDark={isDark}
          />
        </View>

        {/* Critical Warnings */}
        {hasLowRefills && (
          <View style={[styles.warningCard, { backgroundColor: isDark ? '#450A0A' : '#FEF2F2', borderColor: isDark ? '#991B1B40' : '#FEE2E2' }]}>
            <Text style={styles.warningIcon}>🚨</Text>
            <View style={styles.warningInfo}>
              <Text style={[styles.warningTitle, { color: c.error }]}>Critical Refill Alert</Text>
              <Text style={[styles.warningDesc, { color: c.text }]}>Some medications are down to &lt;= 5 pills. Check stock logs.</Text>
            </View>
          </View>
        )}

        {/* Overview Cards Row */}
        <View style={styles.cardsRow}>
          {/* Pill Adherence Card */}
          <View style={[styles.weightCard, { backgroundColor: c.primary }]}>
            <Text style={styles.adherenceTitle}>Pill Adherence</Text>
            <Text style={styles.adherenceVal}>{adherencePercent}%</Text>
            <View style={styles.progressBg}>
              <View style={[styles.progressBar, { width: `${adherencePercent}%` }]} />
            </View>
            <Text style={styles.adherenceDesc}>
              {adherencePercent === 100 ? 'Perfect compliance' : 'Pills tracking today'}
            </Text>
          </View>

          {/* Wellness Rating Card */}
          <View style={[styles.weightCard, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}>
            <View style={styles.ratingHeader}>
              <Text style={[styles.ratingTitle, { color: c.textMuted }]}>Wellness Rating</Text>
              <Text style={styles.ratingStar}>⭐️</Text>
            </View>
            <Text style={[styles.ratingVal, { color: c.text }]}>{wellnessScore}</Text>
            <Text style={[styles.ratingDesc, { color: c.textMuted }]}>Calculated dynamically from vitals</Text>
          </View>
        </View>

        {/* Today's Medications Card */}
        {medicines && medicines.length > 0 && (
          <View style={styles.todayMedsCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: c.textMuted, marginBottom: 0 }]}>Today's Medications</Text>
              <TouchableOpacity
                style={[styles.smallAddBtn, { backgroundColor: c.primaryContainer }]}
                onPress={onAddMedicinePress}
              >
                <Text style={[styles.smallAddBtnText, { color: c.primary }]}>+ Add</Text>
              </TouchableOpacity>
            </View>
            {medicines
              .filter(m => {
                if (!m.reminder_time) return false;
                const parts = m.reminder_time.split(':');
                if (parts.length < 2) return false;
                const [h, mnt] = parts;
                const now = new Date();
                const reminder = new Date();
                reminder.setHours(parseInt(h, 10), parseInt(mnt, 10), 0, 0);
                return reminder >= now;
              })
              .map(m => (
                <View key={m.id} style={styles.medItem}>
                  <Text style={[styles.medName, { color: c.text }]}>{m.name} ({m.dosage})</Text>
                  <Text style={[styles.medTime, { color: c.textMuted }]}>{m.reminder_time}</Text>
                </View>
              ))}
          </View>
        )}

        {/* Next Medicine Alert timeline */}
        {nextMed && (
          <View style={[styles.timelineCard, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}>
            <Text style={[styles.sectionTitle, { color: c.textMuted, fontSize: 13 }]}>NEXT MEDICATION SCHEDULED</Text>
            <View style={styles.medTimelineRow}>
              <Text style={styles.medIcon}>💊</Text>
              <View style={styles.medInfo}>
                <Text style={[styles.medName, { color: c.text }]}>{nextMed.name} ({nextMed.dosage})</Text>
                <Text style={[styles.medInst, { color: c.textMuted }]}>{nextMed.instructions || 'Take with food'}</Text>
              </View>
              <View style={styles.medTimeBox}>
                <Text style={[styles.medTime, { color: c.primary }]}>{nextMed.reminder_time}</Text>
                <Text style={[styles.medPeriod, { color: c.textMuted }]}>{nextMed.period}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Log Daily Vitals Quick Trigger */}
        <TouchableOpacity
          style={[styles.primaryActionBtn, { backgroundColor: c.primary, marginTop: 12 }]}
          onPress={onLogVitalsPress}
        >
          <Text style={styles.primaryActionBtnText}>+ Log Daily Biometrics</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  greetingContainer: {
    flex: 1,
    marginRight: 16,
  },
  greetingSub: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  warningCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 16,
  },
  warningIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  warningInfo: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  warningDesc: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginHorizontal: -6,
    width: '100%',
  },
  weightCard: {
    flex: 1,
    minHeight: 150,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
    marginHorizontal: 6,
  },
  adherenceTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: 'bold',
  },
  adherenceVal: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
  },
  progressBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 4,
  },
  adherenceDesc: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    marginTop: 4,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  ratingStar: {
    fontSize: 14,
  },
  ratingVal: {
    fontSize: 38,
    fontWeight: '900',
  },
  ratingDesc: {
    fontSize: 10,
  },
  timelineCard: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 12,
  },
  medTimelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  medInst: {
    fontSize: 12,
    marginTop: 2,
  },
  medTimeBox: {
    alignItems: 'flex-end',
  },
  medTime: {
    fontSize: 16,
    fontWeight: '800',
  },
  medPeriod: {
    fontSize: 10,
    fontWeight: '600',
  },
  sectionCard: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodPill: {
    width: (width - 72) / 5,
    aspectRatio: 0.9,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 2,
  },
  aiCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  refreshText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  aiLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  aiLoadingLabel: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  aiSuggestionText: {
    fontSize: 13,
    lineHeight: 20,
  },
  primaryActionBtn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryActionBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    flexShrink: 1,
    maxWidth: width * 0.54,
  },
  profileItem: {
    fontSize: 13,
    marginBottom: 3,
  },
  profileName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emergencyText: {
    fontWeight: '700',
    marginTop: 2,
  },
  todayMedsCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  medItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginHorizontal: -6,
    flexWrap: 'wrap',
    width: '100%',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  smallAddBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  smallAddBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
