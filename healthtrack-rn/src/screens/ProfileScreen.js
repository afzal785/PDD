import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ user, onEditPress, isDark }) {
  const c = isDark ? colors.dark : colors.light;

  const renderDetailRow = (label, value) => {
    return (
      <View style={[styles.detailRow, { borderBottomColor: c.border, borderBottomWidth: 1 }]}>
        <Text style={[styles.detailLabel, { color: c.textMuted }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: c.text }]}>{value || 'Not set'}</Text>
      </View>
    );
  };

  const firstChar = (user?.full_name?.charAt(0) || 'P').toUpperCase();

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.scrollContent}>
      {/* Profile Header Avatar */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatarCircle, { backgroundColor: c.primary }]}>
          <Text style={styles.avatarText}>{firstChar}</Text>
        </View>
        <Text style={[styles.userName, { color: c.text }]}>{user?.full_name || 'Your Name'}</Text>
        <Text style={[styles.userEmail, { color: c.textMuted }]}>{user?.email_address || 'Tap Edit to set up your profile'}</Text>
      </View>

      {/* Patient demographics cards */}
      <View style={styles.demographicsRow}>
        <View style={[styles.demoCard, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}>
          <Text style={[styles.demoLabel, { color: c.textMuted }]}>Age</Text>
          <Text style={[styles.demoValue, { color: user?.age ? c.text : c.textMuted }]}>{user?.age || '—'}</Text>
        </View>
        <View style={[styles.demoCard, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}>
          <Text style={[styles.demoLabel, { color: c.textMuted }]}>Blood Group</Text>
          <Text style={[styles.demoValue, { color: user?.blood_group ? c.text : c.textMuted }]}>{user?.blood_group || '—'}</Text>
        </View>
        <View style={[styles.demoCard, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}>
          <Text style={[styles.demoLabel, { color: c.textMuted }]}>Gender</Text>
          <Text style={[styles.demoValue, { color: user?.gender ? c.text : c.textMuted }]}>{user?.gender || '—'}</Text>
        </View>
      </View>

      {/* Contact Parameters */}
      <View style={[styles.sectionCard, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}>
        <Text style={[styles.sectionTitle, { color: c.primary }]}>Contact Details</Text>
        {renderDetailRow('Phone Number', user?.phone_number)}
        {renderDetailRow('Primary Address', user?.address)}
      </View>

      {/* Clinical Profile parameters */}
      <View style={[styles.sectionCard, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}>
        <Text style={[styles.sectionTitle, { color: c.primary }]}>Clinical Profile</Text>
        {renderDetailRow('Medical Conditions', user?.medical_conditions)}
        {renderDetailRow('Known Allergies', user?.allergies)}
      </View>

      {/* Emergency channels card */}
      <View style={[styles.sectionCard, { backgroundColor: isDark ? '#3B121E' : '#FFF1F2', borderColor: isDark ? '#F43F5E40' : '#FFD1D7', borderWidth: 1 }]}>
        <Text style={[styles.sectionTitle, { color: colors.light.error }]}>Emergency Contacts</Text>
        {user?.emergency_contact_name || user?.emergency_contact_number ? (
          <View style={styles.emergencyContactRow}>
            <View>
              <Text style={[styles.emergencyName, { color: c.text }]}>{user?.emergency_contact_name || 'Unknown'}</Text>
              <Text style={[styles.emergencyPhone, { color: c.textMuted }]}>{user?.emergency_contact_number || ''}</Text>
            </View>
            <Text style={styles.phoneIcon}>📞</Text>
          </View>
        ) : (
          <Text style={[styles.emptyNote, { color: c.textMuted }]}>No emergency contact set. Tap Edit Profile to add one.</Text>
        )}
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[styles.primaryActionBtn, { backgroundColor: c.primary }]}
        onPress={onEditPress}
      >
        <Text style={styles.primaryActionBtnText}>Edit Profile Parameters</Text>
      </TouchableOpacity>
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
  avatarSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  demographicsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  demoCard: {
    width: (width - 52) / 3,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  demoLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  demoValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  emergencyContactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emergencyName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emergencyPhone: {
    fontSize: 12,
    marginTop: 2,
  },
  phoneIcon: {
    fontSize: 20,
  },
  primaryActionBtn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  primaryActionBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyNote: {
    fontSize: 12,
    paddingVertical: 8,
    fontStyle: 'italic',
  },
});
