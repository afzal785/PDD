import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { colors } from '../theme/colors';

const isWeb = Platform.OS === 'web';

export default function HealthLogScreen({ healthLogs, onLogVitalsPress, isDark }) {
  const c = isDark ? colors.dark : colors.light;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [viewMode, setViewMode] = useState(isDesktop ? 'table' : 'cards');

  const latestLog = healthLogs?.[0] || null;

  const getBpStatusColor = (sys, dia) => {
    if (!sys || !dia) return null;
    if (sys >= 140 || dia >= 90) return colors.light.error;
    if (sys >= 130 || dia >= 80) return colors.light.warning;
    return colors.light.success;
  };

  const getSugarStatusColor = (val) => {
    if (!val) return null;
    if (val > 125.0 || val < 70.0) return colors.light.error;
    return colors.light.success;
  };

  const getSpo2StatusColor = (val) => {
    if (!val) return null;
    if (val < 95) return colors.light.error;
    return colors.light.success;
  };

  // Build vitals data array for clean rendering
  const vitalsData = [
    {
      label: 'Blood Pressure',
      value: latestLog?.systolic_bp && latestLog?.diastolic_bp
        ? `${latestLog.systolic_bp}/${latestLog.diastolic_bp}`
        : null,
      unit: 'mmHg',
      icon: '❤️',
      statusColor: getBpStatusColor(latestLog?.systolic_bp, latestLog?.diastolic_bp),
      normalRange: '< 120/80',
    },
    {
      label: 'Heart Rate',
      value: latestLog?.heart_rate,
      unit: 'bpm',
      icon: '🫀',
      statusColor: latestLog?.heart_rate > 100 || latestLog?.heart_rate < 55 ? colors.light.error : colors.light.success,
      normalRange: '60–100',
    },
    {
      label: 'Blood Sugar',
      value: latestLog?.blood_sugar,
      unit: 'mg/dL',
      icon: '🩸',
      statusColor: getSugarStatusColor(latestLog?.blood_sugar),
      normalRange: '70–100',
    },
    {
      label: 'Oxygen (SpO2)',
      value: latestLog?.oxygen_saturation,
      unit: '%',
      icon: '🌬️',
      statusColor: getSpo2StatusColor(latestLog?.oxygen_saturation),
      normalRange: '95–100',
    },
    {
      label: 'Temperature',
      value: latestLog?.body_temp,
      unit: '°C',
      icon: '🌡️',
      statusColor: latestLog?.body_temp > 37.5 || latestLog?.body_temp < 36.0 ? colors.light.error : colors.light.success,
      normalRange: '36.1–37.2',
    },
    {
      label: 'Weight',
      value: latestLog?.weight,
      unit: 'kg',
      icon: '⚖️',
      statusColor: c.textMuted,
      normalRange: '—',
    },
    {
      label: 'Sleep',
      value: latestLog?.sleep_hours,
      unit: 'hours',
      icon: '🛌',
      statusColor: latestLog?.sleep_hours < 7.0 ? colors.light.warning : colors.light.success,
      normalRange: '7–9',
    },
    {
      label: 'Water Intake',
      value: latestLog?.water_intake_ml,
      unit: 'mL',
      icon: '💧',
      statusColor: latestLog?.water_intake_ml < 1500 ? colors.light.warning : colors.light.success,
      normalRange: '> 2000',
    },
    {
      label: 'Steps',
      value: latestLog?.steps,
      unit: 'steps',
      icon: '🚶',
      statusColor: latestLog?.steps < 5000 ? colors.light.warning : colors.light.success,
      normalRange: '> 10,000',
    },
  ];

  // Row 1: Primary vitals (3 cols) - BP, HR, Sugar
  // Row 2: Secondary vitals (3 cols) - SpO2, Temp, Weight
  // Row 3: Lifestyle (3 cols) - Sleep, Water, Steps
  const row1 = vitalsData.slice(0, 3);
  const row2 = vitalsData.slice(3, 6);
  const row3 = vitalsData.slice(6, 9);

  const renderVitalCard = (vital) => {
    const hasValue = vital.value !== null && vital.value !== undefined;
    const cardWidthStyle = isDesktop
      ? { flex: 1 }
      : { width: '47%', flexGrow: 1 };
    return (
      <View
        key={vital.label}
        style={[
          styles.vitalCard,
          cardWidthStyle,
          { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 },
        ]}
      >
        <View style={styles.cardTopRow}>
          <Text style={styles.cardIcon}>{vital.icon}</Text>
          <View style={styles.cardTitleBlock}>
            <Text style={[styles.cardLabel, { color: c.textMuted }]}>{vital.label}</Text>
            <Text style={[styles.normalRange, { color: c.textMuted }]}>Normal: {vital.normalRange}</Text>
          </View>
        </View>
        <View style={styles.cardValueRow}>
          <Text style={[styles.cardVal, { color: hasValue ? c.text : c.textMuted }]}>
            {hasValue ? `${vital.value}` : '—'}
          </Text>
          <Text style={[styles.cardUnit, { color: hasValue ? (vital.statusColor || c.textMuted) : c.textMuted }]}>
            {hasValue ? vital.unit : 'Not logged'}
          </Text>
        </View>
        {hasValue && (
          <View style={[styles.statusDot, { backgroundColor: vital.statusColor || c.textMuted }]} />
        )}
      </View>
    );
  };

  const renderRow = (rowData, rowLabel) => (
    <View style={styles.sectionBlock}>
      <Text style={[styles.rowLabel, { color: c.textMuted }]}>{rowLabel}</Text>
      <View style={[styles.gridRow, !isDesktop && styles.gridRowMobile]}>
        {rowData.map(renderVitalCard)}
      </View>
    </View>
  );

  // History table columns
  const tableHeaders = ['Date', 'BP', 'HR', 'Sugar', 'SpO2', 'Temp', 'Weight', 'Sleep', 'Water', 'Steps'];

  const formatDate = (log) => {
    if (log.date_string) {
      const d = new Date(log.date_string);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    return new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const formatCardDate = (log) => {
    const dateObj = log.date_string ? new Date(log.date_string) : new Date(log.timestamp);
    return dateObj.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getHeaderIcon = (header) => {
    switch (header) {
      case 'BP': return '❤️';
      case 'HR': return '🫀';
      case 'Sugar': return '🩸';
      case 'SpO2': return '🌬️';
      case 'Temp': return '🌡️';
      case 'Weight': return '⚖️';
      case 'Sleep': return '🛌';
      case 'Water': return '💧';
      case 'Steps': return '🚶';
      default: return '📌';
    }
  };

  const getHeaderUnit = (header) => {
    switch (header) {
      case 'BP': return 'mmHg';
      case 'HR': return 'bpm';
      case 'Sugar': return 'mg/dL';
      case 'SpO2': return '%';
      case 'Temp': return '°C';
      case 'Weight': return 'kg';
      case 'Sleep': return 'hrs';
      case 'Water': return 'mL';
      case 'Steps': return 'steps';
      default: return '';
    }
  };

  const getCellColumnStyle = (header) => {
    switch (header) {
      case 'Date':
        return { width: 110, minWidth: 110, flexShrink: 0, alignItems: 'flex-start', paddingLeft: 12 };
      case 'BP':
        return { width: 95, minWidth: 95, flexShrink: 0, alignItems: 'center' };
      case 'Sugar':
      case 'Weight':
      case 'Water':
        return { width: 80, minWidth: 80, flexShrink: 0, alignItems: 'center' };
      default:
        return { width: 75, minWidth: 75, flexShrink: 0, alignItems: 'center' };
    }
  };

  const getCellValue = (log, header) => {
    switch (header) {
      case 'Date': return formatDate(log);
      case 'BP': return log.systolic_bp && log.diastolic_bp ? `${log.systolic_bp}/${log.diastolic_bp}` : '—';
      case 'HR': return log.heart_rate || '—';
      case 'Sugar': return log.blood_sugar || '—';
      case 'SpO2': return log.oxygen_saturation ? `${log.oxygen_saturation}%` : '—';
      case 'Temp': return log.body_temp ? `${log.body_temp}°` : '—';
      case 'Weight': return log.weight ? `${log.weight}` : '—';
      case 'Sleep': return log.sleep_hours ? `${log.sleep_hours}h` : '—';
      case 'Water': return log.water_intake_ml ? `${log.water_intake_ml}` : '—';
      case 'Steps': return log.steps || '—';
      default: return '—';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: c.text }]}>Health Log</Text>
            <Text style={[styles.subtitle, { color: c.textMuted }]}>
              {latestLog ? 'Your latest vitals at a glance' : 'Start logging your daily vitals'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.logBtn, { backgroundColor: c.primary }]}
            onPress={onLogVitalsPress}
          >
            <Text style={styles.logBtnText}>+ Log Vitals</Text>
          </TouchableOpacity>
        </View>

        {/* Vitals Grid - 3 rows × 3 columns */}
        {renderRow(row1, '🩺 Primary Vitals')}
        {renderRow(row2, '📊 Secondary Metrics')}
        {renderRow(row3, '🏃 Lifestyle & Activity')}

        {/* History Table / Cards */}
        <View style={styles.historySection}>
          <View style={styles.historyHeaderRow}>
            <Text style={[styles.sectionTitle, { color: c.text, marginBottom: 0 }]}>📋 Log History</Text>
            {healthLogs && healthLogs.length > 0 && (
              <View style={[styles.toggleContainer, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0', borderColor: c.border }]}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    viewMode === 'cards' && [styles.toggleBtnActive, { backgroundColor: c.primary }],
                  ]}
                  onPress={() => setViewMode('cards')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      { color: viewMode === 'cards' ? '#FFF' : c.textMuted },
                    ]}
                  >
                    📇 Cards
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    viewMode === 'table' && [styles.toggleBtnActive, { backgroundColor: c.primary }],
                  ]}
                  onPress={() => setViewMode('table')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      { color: viewMode === 'table' ? '#FFF' : c.textMuted },
                    ]}
                  >
                    📊 Table
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {healthLogs && healthLogs.length > 0 ? (
            viewMode === 'table' ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ flexGrow: 0, paddingBottom: 8 }}>
                <View style={[styles.tableContainer, { borderColor: c.border, backgroundColor: c.surface }]}>
                  {/* Table Header Row */}
                  <View style={[styles.tableHeaderRow, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                    {tableHeaders.map((header) => (
                      <View key={header} style={[styles.tableCell, getCellColumnStyle(header)]}>
                        <Text style={[styles.tableHeaderText, { color: c.textMuted }]}>{header}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Table Data Rows */}
                  {healthLogs.map((log, index) => (
                    <View
                      key={log.id}
                      style={[
                        styles.tableRow,
                        { backgroundColor: index % 2 === 0 ? c.surface : c.background },
                        { borderBottomColor: c.border, borderBottomWidth: 1 },
                      ]}
                    >
                      {tableHeaders.map((header) => {
                        const val = getCellValue(log, header);
                        const isEmpty = val === '—';
                        return (
                          <View key={header} style={[styles.tableCell, getCellColumnStyle(header)]}>
                            <Text style={[styles.tableCellText, { color: isEmpty ? c.textMuted : c.text }]}>
                              {val}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.mobileHistoryList}>
                {healthLogs.map((log) => {
                  const loggedHeaders = tableHeaders.filter((h) => h !== 'Date' && getCellValue(log, h) !== '—');
                  return (
                    <View
                      key={log.id}
                      style={[
                        styles.mobileHistoryCard,
                        { backgroundColor: c.surface, borderColor: c.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.mobileHistoryHeader,
                          {
                            borderBottomColor: c.border,
                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                          },
                        ]}
                      >
                        <View style={styles.mobileHistoryDateBlock}>
                          <Text style={styles.mobileHistoryDateIcon}>📅</Text>
                          <Text style={[styles.mobileHistoryDate, { color: c.text }]}>
                            {formatCardDate(log)}
                          </Text>
                        </View>
                        <View style={[styles.mobileHistoryBadge, { backgroundColor: isDark ? '#1E293B' : '#EDE8FF' }]}>
                          <Text style={[styles.mobileHistoryBadgeText, { color: c.primary }]}>
                            {loggedHeaders.length} {loggedHeaders.length === 1 ? 'vital' : 'vitals'} logged
                          </Text>
                        </View>
                      </View>
                      <View style={styles.mobileHistoryGrid}>
                        {tableHeaders
                          .filter((h) => h !== 'Date')
                          .map((header) => {
                            const val = getCellValue(log, header);
                            if (val === '—') return null;
                            const icon = getHeaderIcon(header);
                            const formattedValue =
                              header === 'BP'
                                ? `${val} mmHg`
                                : header === 'HR'
                                ? `${val} bpm`
                                : header === 'Sugar'
                                ? `${val} mg/dL`
                                : header === 'Weight'
                                ? `${val} kg`
                                : header === 'Water'
                                ? `${val} mL`
                                : header === 'Steps'
                                ? `${val} steps`
                                : val;
                            return (
                              <View key={header} style={styles.mobileHistoryItem}>
                                <View style={styles.mobileHistoryLabelRow}>
                                  <Text style={styles.mobileHistoryIconText}>{icon}</Text>
                                  <Text style={[styles.mobileHistoryLabel, { color: c.textMuted }]}>
                                    {header}
                                  </Text>
                                </View>
                                <Text style={[styles.mobileHistoryValue, { color: c.text }]}>
                                  {formattedValue}
                                </Text>
                              </View>
                            );
                          })}
                      </View>
                    </View>
                  );
                })}
              </View>
            )
          ) : (
            <View style={[styles.emptyHistoryBox, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={styles.emptyHistoryIcon}>📝</Text>
              <Text style={[styles.emptyHistoryTitle, { color: c.text }]}>No Records Yet</Text>
              <Text style={[styles.emptyHistoryDesc, { color: c.textMuted }]}>
                Tap "+ Log Vitals" to record your first health entry. Your log history will appear here.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: isWeb ? 24 : 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: isWeb ? 24 : 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  logBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  logBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Section blocks
  sectionBlock: {
    marginBottom: 20,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // 3-column grid
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridRowMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vitalCard: {
    borderRadius: 16,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 110,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  cardTitleBlock: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  normalRange: {
    fontSize: 10,
    marginTop: 2,
  },
  cardValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  cardVal: {
    fontSize: 22,
    fontWeight: '900',
  },
  cardUnit: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // History section
  historySection: {
    marginTop: 28,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 18,
  },
  toggleBtnActive: {
    // Background applied inline
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // History table section
  tableContainer: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    minWidth: 800,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    minWidth: 800,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    minWidth: 800,
  },
  tableCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tableCellText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Mobile History List
  mobileHistoryList: {
    gap: 16,
  },
  mobileHistoryCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  mobileHistoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  mobileHistoryDateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileHistoryDateIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  mobileHistoryDate: {
    fontSize: 14,
    fontWeight: '700',
  },
  mobileHistoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mobileHistoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  mobileHistoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    rowGap: 16,
    columnGap: 12,
  },
  mobileHistoryItem: {
    width: '47%',
  },
  mobileHistoryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  mobileHistoryIconText: {
    fontSize: 14,
    marginRight: 6,
  },
  mobileHistoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  mobileHistoryValue: {
    fontSize: 15,
    fontWeight: '800',
  },

  // Empty state
  emptyHistoryBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
  },
  emptyHistoryIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyHistoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptyHistoryDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
});
