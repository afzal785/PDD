import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function SummaryCard({ title, value, icon, isDark }) {
  const c = isDark ? colors.dark : colors.light;
  return (
    <View style={[styles.card, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)', borderColor: c.border }]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.title, { color: c.textMuted }]}>{title}</Text>
      <Text style={[styles.value, { color: c.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flex: 1,
    marginHorizontal: 6,
    minWidth: 140,
  },
  icon: {
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'left',
  },
  value: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'left',
    lineHeight: 22,
  },
});
