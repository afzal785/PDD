import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';

// --- Emergency modal ---
export const EmergencyModal = ({ visible, user, onDismiss, onCallEmergency, isDark }) => {
  const c = isDark ? colors.dark : colors.light;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.headerContainer}>
              <Text style={[styles.emergencyIcon, { color: c.error }]}>⚠️</Text>
              <Text style={[styles.modalTitle, { color: c.error, fontWeight: 'bold' }]}>
                EMERGENCY CHANNELS ACTIVE
              </Text>
            </View>

            <View style={[styles.medicalDossier, { backgroundColor: isDark ? '#450A0A' : '#FFF1F2', borderColor: c.error + '40', borderWidth: 1 }]}>
              <Text style={[styles.dossierTitle, { color: c.error }]}>Personal Medical Dossier</Text>
              <Text style={[styles.dossierText, { color: c.text }]}>Patient: {user?.full_name || 'N/A'}</Text>
              <Text style={[styles.dossierText, { color: c.text }]}>Blood Type: {user?.blood_group || 'N/A'}  •  Age: {user?.age || 'N/A'}</Text>
              <Text style={[styles.dossierText, { color: c.text }]}>Conditions: {user?.medical_conditions || 'None declared'}</Text>
              <Text style={[styles.dossierText, { color: c.text }]}>Allergies: {user?.allergies || 'None known'}</Text>
            </View>

            <Text style={[styles.alertDescription, { color: c.textMuted }]}>
              {user?.emergency_contact_name
                ? `Press below to immediately dial your emergency contact representative:\n`
                : 'No emergency contact set. Please go to Profile and add one.'}
              {user?.emergency_contact_name
                ? <Text style={{ fontWeight: 'bold', color: c.text }}>{user.emergency_contact_name} ({user?.emergency_contact_number || 'No number'})</Text>
                : null}
            </Text>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: c.error }]}
              onPress={onCallEmergency}
            >
              <Text style={styles.actionBtnText}>CONFIRM DIAL DIALING</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onDismiss}>
              <Text style={[styles.cancelBtnText, { color: c.textMuted }]}>Dismiss Shield Dialog</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// --- Add/Edit Medicine Modal ---
export const AddMedicineModal = ({ visible, medicine, onDismiss, onSave, isDark }) => {
  const c = isDark ? colors.dark : colors.light;

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('10mg');
  const [type, setType] = useState('Pill');
  const [frequency, setFrequency] = useState('Daily');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [period, setPeriod] = useState('Morning');
  const [qty, setQty] = useState('30');
  const [instructions, setInstructions] = useState('Take with breakfast');

  useEffect(() => {
    if (medicine) {
      setName(medicine.name || '');
      setDosage(medicine.dosage || '10mg');
      setType(medicine.type || 'Pill');
      setFrequency(medicine.frequency || 'Daily');
      setReminderTime(medicine.reminder_time || '08:00');
      setPeriod(medicine.period || 'Morning');
      setQty(String(medicine.remaining_quantity || 30));
      setInstructions(medicine.instructions || '');
    } else {
      setName('');
      setDosage('10mg');
      setType('Pill');
      setFrequency('Daily');
      setReminderTime('08:00');
      setPeriod('Morning');
      setQty('30');
      setInstructions('Take with breakfast');
    }
  }, [medicine, visible]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name,
      dosage,
      type,
      frequency,
      reminder_time: reminderTime,
      period,
      remaining_quantity: parseInt(qty, 10) || 0,
      instructions,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}>
          <Text style={[styles.modalTitle, { color: c.text }]}>
            {medicine ? 'Edit Medication' : 'New Medicine Configuration'}
          </Text>

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Text style={[styles.inputLabel, { color: c.textMuted }]}>Medicine Active Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Lisinopril"
              placeholderTextColor={c.textMuted}
            />

            {/* Row 1: Dosage & Inventory (Pills) side-by-side */}
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={[styles.inputLabel, { color: c.textMuted }]}>Dosage</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                  value={dosage}
                  onChangeText={setDosage}
                  placeholder="e.g. 10mg"
                  placeholderTextColor={c.textMuted}
                />
              </View>
              <View style={[styles.flex1, { marginLeft: 10 }]}>
                <Text style={[styles.inputLabel, { color: c.textMuted }]}>Inventory (Pills)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                  value={qty}
                  onChangeText={setQty}
                  keyboardType="numeric"
                  placeholder="e.g. 30"
                  placeholderTextColor={c.textMuted}
                />
              </View>
            </View>

            {/* Row 2: Form Type Touch Selection (full width!) */}
            <Text style={[styles.inputLabel, { color: c.textMuted, marginTop: 12 }]}>Form Type (Tap to select)</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 14 }}>
              {[
                { label: '💊 Pill', val: 'Pill' },
                { label: '🔵 Tablet', val: 'Tablet' },
                { label: '🟡 Capsule', val: 'Capsule' },
                { label: '💧 Liquid', val: 'Liquid' },
                { label: '💉 Injection', val: 'Injection' },
              ].map((item) => {
                const isSelected = type.toLowerCase() === item.val.toLowerCase();
                return (
                  <TouchableOpacity
                    key={item.val}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 20,
                      backgroundColor: isSelected ? c.primary : c.inputBg,
                      borderWidth: 1.5,
                      borderColor: isSelected ? c.primary : c.border,
                    }}
                    onPress={() => setType(item.val)}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: isSelected ? '#FFFFFF' : c.text }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Row 3: Frequency (full width!) */}
            <Text style={[styles.inputLabel, { color: c.textMuted }]}>Frequency</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              value={frequency}
              onChangeText={setFrequency}
              placeholder="e.g. Daily"
              placeholderTextColor={c.textMuted}
            />

            {/* Touch Period Duty Selection */}
            <Text style={[styles.inputLabel, { color: c.textMuted, marginTop: 12 }]}>Touch Period Duty (Tap to select)</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 14 }}>
              {[
                { label: '🌅 Morning', val: 'Morning', defaultTime: '08:00' },
                { label: '☀️ Afternoon', val: 'Afternoon', defaultTime: '13:00' },
                { label: '🌆 Evening', val: 'Evening', defaultTime: '18:00' },
                { label: '🌙 Night', val: 'Night', defaultTime: '21:00' },
              ].map((item) => {
                const isSelected = period.toLowerCase() === item.val.toLowerCase();
                return (
                  <TouchableOpacity
                    key={item.val}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 20,
                      backgroundColor: isSelected ? c.primary : c.inputBg,
                      borderWidth: 1.5,
                      borderColor: isSelected ? c.primary : c.border,
                    }}
                    onPress={() => {
                      setPeriod(item.val);
                      if (!reminderTime || reminderTime === '08:00' || reminderTime === '13:00' || reminderTime === '18:00' || reminderTime === '21:00') {
                        setReminderTime(item.defaultTime);
                      }
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: isSelected ? '#FFFFFF' : c.text }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* User-Friendly Time Picker */}
            <Text style={[styles.inputLabel, { color: c.textMuted }]}>Reminder Time (Tap clock to select time)</Text>
            {Platform.OS === 'web' ? (
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                style={{
                  width: '100%',
                  height: 48,
                  backgroundColor: c.inputBg,
                  color: c.text,
                  border: `1px solid ${c.border}`,
                  borderRadius: 12,
                  padding: '0 14px',
                  fontSize: 15,
                  fontFamily: 'inherit',
                  outline: 'none',
                  marginBottom: 8,
                }}
              />
            ) : (
              <TextInput
                style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                value={reminderTime}
                onChangeText={setReminderTime}
                placeholder="e.g. 08:00 or 08:00 AM"
                placeholderTextColor={c.textMuted}
              />
            )}

            {/* Quick Time Presets */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {['08:00', '13:00', '18:00', '21:00'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 14,
                    backgroundColor: reminderTime === t ? c.primary + '20' : c.inputBg,
                    borderWidth: 1,
                    borderColor: reminderTime === t ? c.primary : c.border,
                  }}
                  onPress={() => setReminderTime(t)}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: reminderTime === t ? c.primary : c.textMuted }}>
                    ⏰ {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: c.textMuted }]}>Intake Instructions</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              value={instructions}
              onChangeText={setInstructions}
              placeholder="e.g. Take with food"
              placeholderTextColor={c.textMuted}
            />

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: c.primary, marginTop: 15 }]}
              onPress={handleSave}
            >
              <Text style={styles.actionBtnText}>Save Medication</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onDismiss}>
              <Text style={[styles.cancelBtnText, { color: c.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// --- Log Biometrics Modal ---
export const LogBiometricsModal = ({ visible, onDismiss, onSave, isDark }) => {
  const c = isDark ? colors.dark : colors.light;

  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');
  const [hr, setHr] = useState('');
  const [sugar, setSugar] = useState('');
  const [weight, setWeight] = useState('');
  const [sleep, setSleep] = useState('');
  const [water, setWater] = useState('');
  const [steps, setSteps] = useState('');
  const [temp, setTemp] = useState('');
  const [spo2, setSpo2] = useState('');

  const handleSave = () => {
    onSave({
      systolic_bp: sys ? parseInt(sys, 10) : null,
      diastolic_bp: dia ? parseInt(dia, 10) : null,
      heart_rate: hr ? parseInt(hr, 10) : null,
      blood_sugar: sugar ? parseFloat(sugar) : null,
      weight: weight ? parseFloat(weight) : null,
      sleep_hours: sleep ? parseFloat(sleep) : null,
      water_intake_ml: water ? parseInt(water, 10) : null,
      steps: steps ? parseInt(steps, 10) : null,
      body_temp: temp ? parseFloat(temp) : null,
      oxygen_saturation: spo2 ? parseInt(spo2, 10) : null,
    });
    // Reset inputs
    setSys(''); setDia(''); setHr(''); setSugar(''); setWeight(''); setSleep(''); setWater(''); setSteps(''); setTemp(''); setSpo2('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, maxHeight: '85%' }]}>
          <Text style={[styles.modalTitle, { color: c.text }]}>Log Daily Biometrics</Text>

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={[styles.inputLabel, { color: c.textMuted }]}>Systolic BP (mmHg)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                  value={sys}
                  onChangeText={setSys}
                  keyboardType="numeric"
                  placeholder="e.g. 120"
                  placeholderTextColor={c.textMuted}
                />
              </View>
              <View style={[styles.flex1, { marginLeft: 10 }]}>
                <Text style={[styles.inputLabel, { color: c.textMuted }]}>Diastolic BP (mmHg)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                  value={dia}
                  onChangeText={setDia}
                  keyboardType="numeric"
                  placeholder="e.g. 80"
                  placeholderTextColor={c.textMuted}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={[styles.inputLabel, { color: c.textMuted }]}>Heart Rate (bpm)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                  value={hr}
                  onChangeText={setHr}
                  keyboardType="numeric"
                  placeholder="e.g. 72"
                  placeholderTextColor={c.textMuted}
                />
              </View>
              <View style={[styles.flex1, { marginLeft: 10 }]}>
                <Text style={[styles.inputLabel, { color: c.textMuted }]}>Blood Sugar (mg/dL)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                  value={sugar}
                  onChangeText={setSugar}
                  keyboardType="numeric"
                  placeholder="e.g. 95"
                  placeholderTextColor={c.textMuted}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={[styles.inputLabel, { color: c.textMuted }]}>Weight (kg)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  placeholder="e.g. 70"
                  placeholderTextColor={c.textMuted}
                />
              </View>
              <View style={[styles.flex1, { marginLeft: 10 }]}>
                <Text style={[styles.inputLabel, { color: c.textMuted }]}>Sleep (hours)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                  value={sleep}
                  onChangeText={setSleep}
                  keyboardType="numeric"
                  placeholder="e.g. 7.5"
                  placeholderTextColor={c.textMuted}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={[styles.inputLabel, { color: c.textMuted }]}>Water (ml)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                  value={water}
                  onChangeText={setWater}
                  keyboardType="numeric"
                  placeholder="e.g. 250"
                  placeholderTextColor={c.textMuted}
                />
              </View>
              <View style={[styles.flex1, { marginLeft: 10 }]}>
                <Text style={[styles.inputLabel, { color: c.textMuted }]}>Steps</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                  value={steps}
                  onChangeText={setSteps}
                  keyboardType="numeric"
                  placeholder="e.g. 5000"
                  placeholderTextColor={c.textMuted}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={[styles.inputLabel, { color: c.textMuted }]}>Body Temp (°C)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                  value={temp}
                  onChangeText={setTemp}
                  keyboardType="numeric"
                  placeholder="e.g. 36.6"
                  placeholderTextColor={c.textMuted}
                />
              </View>
              <View style={[styles.flex1, { marginLeft: 10 }]}>
                <Text style={[styles.inputLabel, { color: c.textMuted }]}>Oxygen Saturation (%)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                  value={spo2}
                  onChangeText={setSpo2}
                  keyboardType="numeric"
                  placeholder="e.g. 98"
                  placeholderTextColor={c.textMuted}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: c.primary, marginTop: 15 }]}
              onPress={handleSave}
            >
              <Text style={styles.actionBtnText}>Save Biometrics</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onDismiss}>
              <Text style={[styles.cancelBtnText, { color: c.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// --- Edit Profile Modal ---
export const EditProfileModal = ({ visible, user, onDismiss, onSave, isDark }) => {
  const c = isDark ? colors.dark : colors.light;

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [blood, setBlood] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [conditions, setConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.full_name || '');
      setAge(String(user.age || ''));
      setGender(user.gender || '');
      setBlood(user.blood_group || '');
      setPhone(user.phone_number || '');
      setAddress(user.address || '');
      setConditions(user.medical_conditions || '');
      setAllergies(user.allergies || '');
      setEmergencyName(user.emergency_contact_name || '');
      setEmergencyPhone(user.emergency_contact_number || '');
    }
  }, [user, visible]);

  const handleSave = () => {
    onSave({
      full_name: name,
      age: parseInt(age, 10) || 0,
      gender,
      blood_group: blood,
      phone_number: phone,
      address,
      medical_conditions: conditions,
      allergies,
      emergency_contact_name: emergencyName,
      emergency_contact_number: emergencyPhone,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, maxHeight: '85%' }]}>
          <Text style={[styles.modalTitle, { color: c.text }]}>Edit Personal Profile</Text>

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Text style={[styles.inputLabel, { color: c.textMuted }]}>Full Legal Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              value={name}
              onChangeText={setName}
            />

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={[styles.inputLabel, { color: c.textMuted }]}>Age</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.flex1, { marginLeft: 10 }]}>
                <Text style={[styles.inputLabel, { color: c.textMuted }]}>Blood Group</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                  value={blood}
                  onChangeText={setBlood}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={[styles.inputLabel, { color: c.textMuted }]}>Gender</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                  value={gender}
                  onChangeText={setGender}
                />
              </View>
              <View style={[styles.flex1, { marginLeft: 10 }]}>
                <Text style={[styles.inputLabel, { color: c.textMuted }]}>Phone Number</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            <Text style={[styles.inputLabel, { color: c.textMuted }]}>Address</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              value={address}
              onChangeText={setAddress}
            />

            <Text style={[styles.inputLabel, { color: c.textMuted }]}>Medical Conditions</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              value={conditions}
              onChangeText={setConditions}
            />

            <Text style={[styles.inputLabel, { color: c.textMuted }]}>Known Allergies</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              value={allergies}
              onChangeText={setAllergies}
            />

            <Text style={[styles.inputLabel, { color: c.textMuted, fontWeight: 'bold', marginTop: 10 }]}>
              Emergency Contact Name
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              value={emergencyName}
              onChangeText={setEmergencyName}
            />

            <Text style={[styles.inputLabel, { color: c.textMuted }]}>Emergency Contact Phone</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              value={emergencyPhone}
              onChangeText={setEmergencyPhone}
            />

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: c.primary, marginTop: 15 }]}
              onPress={handleSave}
            >
              <Text style={styles.actionBtnText}>Save Profile Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onDismiss}>
              <Text style={[styles.cancelBtnText, { color: c.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  emergencyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  medicalDossier: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  dossierTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dossierText: {
    fontSize: 12,
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  actionBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cancelBtn: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBtnText: {
    fontSize: 14,
  },
});
