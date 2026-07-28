import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');
const chartWidth = width - 72; // Padding constraints
const chartHeight = 150;

export default function ReportsScreen({ healthLogs, isDark }) {
  const c = isDark ? colors.dark : colors.light;

  // Filter valid logs (sort chronologically for charting)
  const logs = [...healthLogs]
    .filter(l => l.date_string)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-7); // Keep last 7 readings

  const renderBpChart = () => {
    const validLogs = logs.filter(l => l.systolic_bp && l.diastolic_bp);
    if (validLogs.length < 2) {
      return <Text style={[styles.noDataText, { color: c.textMuted }]}>Insufficient data points. Keep logging daily blood pressure.</Text>;
    }

    const sysValues = validLogs.map(l => l.systolic_bp);
    const diaValues = validLogs.map(l => l.diastolic_bp);
    
    const maxVal = Math.max(...sysValues, 140) + 10;
    const minVal = Math.min(...diaValues, 60) - 10;
    const valRange = maxVal - minVal;

    const getX = (index) => (index / (validLogs.length - 1)) * chartWidth + 10;
    const getY = (val) => chartHeight - 10 - ((val - minVal) / valRange) * (chartHeight - 20);

    // Create Path commands
    let sysPath = `M ${getX(0)} ${getY(sysValues[0])}`;
    let diaPath = `M ${getX(0)} ${getY(diaValues[0])}`;

    for (let i = 1; i < validLogs.length; i++) {
      sysPath += ` L ${getX(i)} ${getY(sysValues[i])}`;
      diaPath += ` L ${getX(i)} ${getY(diaValues[i])}`;
    }

    return (
      <View style={styles.chartBox}>
        <Text style={[styles.chartTitle, { color: c.text }]}>Blood Pressure Vitals (systolic/diastolic)</Text>
        <Svg width={chartWidth + 20} height={chartHeight}>
          {/* Grid lines */}
          <Line x1="10" y1={getY(120)} x2={chartWidth + 10} y2={getY(120)} stroke={c.border} strokeWidth="1" strokeDasharray="4,4" />
          <Line x1="10" y1={getY(80)} x2={chartWidth + 10} y2={getY(80)} stroke={c.border} strokeWidth="1" strokeDasharray="4,4" />

          {/* Systolic Line */}
          <Path d={sysPath} fill="none" stroke={c.error} strokeWidth="3" />
          {/* Diastolic Line */}
          <Path d={diaPath} fill="none" stroke={c.primary} strokeWidth="3" />

          {/* Points */}
          {validLogs.map((log, i) => (
            <React.Fragment key={i}>
              <Circle cx={getX(i)} cy={getY(log.systolic_bp)} r="4" fill={c.error} />
              <Circle cx={getX(i)} cy={getY(log.diastolic_bp)} r="4" fill={c.primary} />
            </React.Fragment>
          ))}
        </Svg>
        <View style={styles.legendRow}>
          <Text style={{ color: c.error, fontSize: 11, fontWeight: 'bold' }}>● Systolic (Target &lt; 120)</Text>
          <Text style={{ color: c.primary, fontSize: 11, fontWeight: 'bold' }}>● Diastolic (Target &lt; 80)</Text>
        </View>
      </View>
    );
  };

  const renderSugarChart = () => {
    const validLogs = logs.filter(l => l.blood_sugar);
    if (validLogs.length < 2) {
      return <Text style={[styles.noDataText, { color: c.textMuted }]}>Insufficient sugar readings tracked recently.</Text>;
    }

    const values = validLogs.map(l => l.blood_sugar);
    const maxVal = Math.max(...values, 130) + 10;
    const minVal = Math.min(...values, 60) - 10;
    const valRange = maxVal - minVal;

    const getX = (index) => (index / (validLogs.length - 1)) * chartWidth + 10;
    const getY = (val) => chartHeight - 10 - ((val - minVal) / valRange) * (chartHeight - 20);

    let path = `M ${getX(0)} ${getY(values[0])}`;
    for (let i = 1; i < validLogs.length; i++) {
      path += ` L ${getX(i)} ${getY(values[i])}`;
    }

    return (
      <View style={styles.chartBox}>
        <Text style={[styles.chartTitle, { color: c.text }]}>Glucose Trends (mg/dL)</Text>
        <Svg width={chartWidth + 20} height={chartHeight}>
          <Line x1="10" y1={getY(100)} x2={chartWidth + 10} y2={getY(100)} stroke={c.border} strokeWidth="1" strokeDasharray="4,4" />
          <Path d={path} fill="none" stroke={c.warning} strokeWidth="3" />
          {validLogs.map((log, i) => (
            <Circle key={i} cx={getX(i)} cy={getY(log.blood_sugar)} r="4" fill={c.warning} />
          ))}
        </Svg>
        <View style={styles.legendRow}>
          <Text style={{ color: c.warning, fontSize: 11, fontWeight: 'bold' }}>● Fasting sugar (Optimal 70-100)</Text>
        </View>
      </View>
    );
  };

  const renderStepsChart = () => {
    const validLogs = logs.filter(l => l.steps);
    if (validLogs.length < 2) {
      return <Text style={[styles.noDataText, { color: c.textMuted }]}>Insufficient daily steps logged recently.</Text>;
    }

    const values = validLogs.map(l => l.steps);
    const maxVal = Math.max(...values, 10000);
    const barWidth = chartWidth / (validLogs.length * 1.5);

    const getX = (index) => (index / validLogs.length) * chartWidth + 15;
    const getY = (val) => chartHeight - 10 - (val / maxVal) * (chartHeight - 20);

    return (
      <View style={styles.chartBox}>
        <Text style={[styles.chartTitle, { color: c.text }]}>Activity Tracking (Daily Steps)</Text>
        <Svg width={chartWidth + 20} height={chartHeight}>
          <Line x1="10" y1={getY(10000)} x2={chartWidth + 10} y2={getY(10000)} stroke={c.border} strokeWidth="1" strokeDasharray="4,4" />
          {validLogs.map((log, i) => {
            const y = getY(log.steps);
            const height = chartHeight - 10 - y;
            return (
              <Rect
                key={i}
                x={getX(i)}
                y={y}
                width={barWidth}
                height={Math.max(2, height)}
                fill={log.steps >= 10000 ? c.primary : c.textMuted + '80'}
                rx="3"
              />
            );
          })}
        </Svg>
        <View style={styles.legendRow}>
          <Text style={{ color: c.primary, fontSize: 11, fontWeight: 'bold' }}>● Hits 10k Target</Text>
          <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: 'bold' }}>● Under Target</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.scrollContent}>
      <Text style={[styles.title, { color: c.text }]}>Clinical Reports & Trends</Text>
      <Text style={[styles.subtitle, { color: c.textMuted }]}>
        Visual dashboard graphs summarizing logged vitals and parameters.
      </Text>

      {renderBpChart()}
      {renderSugarChart()}
      {renderStepsChart()}
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
  chartBox: {
    borderRadius: 24,
    backgroundColor: 'transparent',
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  noDataText: {
    fontSize: 12,
    padding: 24,
    textAlign: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
});
