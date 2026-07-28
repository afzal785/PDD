import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from './src/utils/Alert';
import * as Notifications from 'expo-notifications';

import { colors } from './src/theme/colors';
import { supabase } from './src/supabase/supabaseClient';
import { LoginScreen, RegisterScreen, ForgotPasswordScreen } from './src/screens/AuthScreens';
import DashboardScreen from './src/screens/DashboardScreen';
import MedicationsScreen from './src/screens/MedicationsScreen';
import HealthLogScreen from './src/screens/HealthLogScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { AddMedicineModal, LogBiometricsModal, EditProfileModal, EmergencyModal } from './src/components/Modals';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [session, setSession] = useState(null);
  const [authView, setAuthView] = useState('Login'); // Login, Register, ForgotPassword
  const [currentTab, setCurrentTab] = useState('Dashboard'); // Dashboard, Medications, Health Log, Schedule, Reports, Profile, Settings
  const [loading, setLoading] = useState(true);

  // Database States
  const [userProfile, setUserProfile] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [healthLogs, setHealthLogs] = useState([]);
  const [moodLogs, setMoodLogs] = useState([]);
  const [medicationLogs, setMedicationLogs] = useState([]);

  // Modal Dialog States
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [showLogVitals, setShowLogVitals] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Theme State
  const [isDark, setIsDark] = useState(false);
  const c = isDark ? colors.dark : colors.light;

  const notifiedTodayRef = useRef({});

  // Service Worker Registration for Mobile Background & Home Screen Notifications
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('Service Worker Registered successfully:', reg);
      }).catch((e) => console.warn('SW error:', e));
    }
  }, []);

  // Mobile Notification Channel & Permission Setup
  useEffect(() => {
    async function configureNotifications() {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        try { Notification.requestPermission(); } catch (e) {}
      }
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          await Notifications.requestPermissionsAsync();
        }
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Medication Reminders',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#6C47FF',
            sound: 'default',
            enableVibrate: true,
            showBadge: true,
          });
        }
      } catch (e) {
        console.warn('Notification setup error:', e);
      }
    }
    configureNotifications();
  }, []);

function normalizeTime(str) {
  if (!str) return '08:00';
  let s = String(str).trim().toLowerCase();
  const isPM = s.includes('pm');
  const isAM = s.includes('am');
  s = s.replace(/am|pm/g, '').trim();

  const parts = s.split(':');
  if (parts.length < 2) return '08:00';

  let h = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);

  if (isNaN(h)) h = 8;
  if (isNaN(m)) m = 0;

  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;

  const hh = String(h % 24).padStart(2, '0');
  const mm = String(m % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

  // Real-time 1-Second Medicine Alarm Checker for Mobile App
  useEffect(() => {
    const timer = setInterval(async () => {
      if (!medicines || !Array.isArray(medicines) || medicines.length === 0) return;
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${h}:${m}`;

      for (const med of medicines) {
        if (!med.reminder_time) continue;
        const medTimeStr = normalizeTime(med.reminder_time);
        const key = `${med.id}_${dateStr}_${medTimeStr}`;

        if (currentTimeStr === medTimeStr && !notifiedTodayRef.current[key]) {
          notifiedTodayRef.current[key] = true;

          // 1. Service Worker Notification (Phone Home Screen / Notification Shade)
          if (typeof window !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
            try {
              navigator.serviceWorker.ready.then((reg) => {
                reg.showNotification(`⏰ Medicine Reminder: ${med.name}`, {
                  body: `It is time to take ${med.name} (${med.dosage || ''}). Instructions: ${med.instructions || 'Take as prescribed.'}`,
                  icon: 'https://cdn-icons-png.flaticon.com/512/883/883407.png',
                  badge: 'https://cdn-icons-png.flaticon.com/512/883/883407.png',
                  vibrate: [300, 100, 300],
                  requireInteraction: true,
                  tag: `med-${med.id}`,
                });
              });
            } catch (e) {}
          } else if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              try {
                new Notification(`⏰ Medicine Reminder: ${med.name}`, {
                  body: `It is time to take ${med.name} (${med.dosage || ''}). Instructions: ${med.instructions || 'Take as prescribed.'}`,
                  icon: 'https://cdn-icons-png.flaticon.com/512/883/883407.png',
                  requireInteraction: true,
                });
              } catch (e) { console.warn('Web notification error:', e); }
            } else if (Notification.permission === 'default') {
              try { Notification.requestPermission(); } catch (e) {}
            }
          }

          // 2. Native Expo Push Notification
          try {
            await Notifications.presentNotificationAsync({
              title: '⏰ MEDICATION REMINDER ALARM',
              body: `It is time to take ${med.name} (${med.dosage || ''}). Instructions: ${med.instructions || 'Take as prescribed.'}`,
              data: { medId: med.id },
            });
          } catch (err) {
            console.warn('Present notification error:', err);
          }

          // 3. Show interactive alert on mobile screen
          Alert.alert(
            '⏰ MEDICINE REMINDER ALARM',
            `It is time to take your medication:\n\n💊 ${med.name} (${med.dosage || ''})\n⏰ Time: ${med.reminder_time} (${med.period || ''})\n📝 ${med.instructions || 'Take as directed.'}`,
            [
              { text: '✓ Mark as Taken', onPress: () => handleMarkMedicineStatus(med, 'Taken') },
              { text: '✗ Mark as Missed', onPress: () => handleMarkMedicineStatus(med, 'Missed') },
              { text: 'Dismiss', style: 'cancel' }
            ]
          );
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [medicines]);

  // Schedule Daily Native System Notifications for Phone Home Screen & Lock Screen
  useEffect(() => {
    async function scheduleSystemNotifications() {
      if (!medicines || !Array.isArray(medicines)) return;
      for (const med of medicines) {
        if (!med || !med.reminder_time) continue;
        try {
          const [hStr, mStr] = med.reminder_time.split(':');
          const hour = parseInt(hStr, 10);
          const minute = parseInt(mStr, 10);
          if (isNaN(hour) || isNaN(minute)) continue;

          await Notifications.scheduleNotificationAsync({
            content: {
              title: `⏰ Medicine Reminder: ${med.name}`,
              body: `It is time to take ${med.name} (${med.dosage || ''}). Instructions: ${med.instructions || 'Take as prescribed.'}`,
              data: { medId: med.id },
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.MAX,
              vibrate: [0, 250, 250, 250],
            },
            trigger: {
              hour,
              minute,
              repeats: true,
              channelId: 'default',
            },
          });
        } catch (e) {
          console.warn('Schedule system notification error:', e);
        }
      }
    }
    scheduleSystemNotifications();
  }, [medicines]);

  useEffect(() => {
    const checkSession = async () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session) {
          syncUserData(session.user);
        } else {
          setLoading(false);
        }
      }).catch(err => {
        console.warn("Supabase session initialization failed. Check your API keys.", err);
        setLoading(false);
      });
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
        syncUserData(session.user);
      } else {
        setSession(null);
        setUserProfile(null);
        setMedicines([]);
        setHealthLogs([]);
        setMoodLogs([]);
        setMedicationLogs([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);


  

  const syncUserData = async (user) => {
    setLoading(true);
    try {
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setUserProfile(profile);
        setIsDark(profile.is_dark_mode);
      }

      // Fetch user medicines
      const { data: meds } = await supabase
        .from('medicines')
        .select('*')
        .eq('user_id', user.id)
        .order('reminder_time', { ascending: true });
      setMedicines(meds || []);

      // Fetch user health vitals
      const { data: health } = await supabase
        .from('health_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });
      setHealthLogs(health || []);

      // Fetch user moods
      const { data: moods } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });
      setMoodLogs(moods || []);

      // Fetch user medication logs
      const { data: medLogs } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });
      setMedicationLogs(medLogs || []);

    } catch (e) {
      console.warn("Failed syncing user details from Supabase", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    if (session?.user) {
      await syncUserData(session.user);
    }
  };

  const seedMockDataIfNecessary = async (userId) => {
    try {
      const { data: existingMeds } = await supabase
        .from('medicines')
        .select('id')
        .eq('user_id', userId);

      if (existingMeds && existingMeds.length < 6) {
        // Delete any partial existing data first
        if (existingMeds.length > 0) {
          await supabase.from('medicines').delete().eq('user_id', userId);
        }

        // Seed 6 rich medicines
        const { data: insertedMeds, error: medErr } = await supabase
          .from('medicines')
          .insert([
            { user_id: userId, name: "Lisinopril",   dosage: "10mg",    type: "Pill",    frequency: "Daily", reminder_time: "08:00", period: "Morning",   recurring: true, remaining_quantity: 24, total_adherence_count: 28, missed_count: 2, instructions: "Take on an empty stomach in the morning." },
            { user_id: userId, name: "Metformin",    dosage: "500mg",   type: "Tablet",  frequency: "Daily", reminder_time: "13:00", period: "Afternoon", recurring: true, remaining_quantity: 45, total_adherence_count: 30, missed_count: 0, instructions: "Take with lunch or immediately after eating." },
            { user_id: userId, name: "Atorvastatin", dosage: "20mg",    type: "Tablet",  frequency: "Daily", reminder_time: "21:00", period: "Night",     recurring: true, remaining_quantity: 4,  total_adherence_count: 28, missed_count: 3, instructions: "Take in the evening before sleeping." },
            { user_id: userId, name: "Aspirin",      dosage: "75mg",    type: "Tablet",  frequency: "Daily", reminder_time: "08:30", period: "Morning",   recurring: true, remaining_quantity: 60, total_adherence_count: 30, missed_count: 0, instructions: "Take with a full glass of water after food." },
            { user_id: userId, name: "Amlodipine",   dosage: "5mg",     type: "Pill",    frequency: "Daily", reminder_time: "18:00", period: "Evening",   recurring: true, remaining_quantity: 18, total_adherence_count: 25, missed_count: 1, instructions: "Take at the same time each day." },
            { user_id: userId, name: "Vitamin D3",   dosage: "1000 IU", type: "Capsule", frequency: "Daily", reminder_time: "09:00", period: "Morning",   recurring: true, remaining_quantity: 90, total_adherence_count: 28, missed_count: 2, instructions: "Take with your largest meal for best absorption." },
          ])
          .select();

        if (medErr) { console.warn('Med seed error:', medErr); return; }

        if (insertedMeds && insertedMeds.length === 6) {
          const [lisId, metId, atoId, aspId, amlId, vitId] = insertedMeds.map(m => m.id);

          const ds = (n) => new Date(Date.now() - n * 86400000).toISOString().split('T')[0];
          const ts = (n, h=0) => Date.now() - n * 86400000 + h * 3600000;

          // Seed 8 days of medication logs
          await supabase.from('medication_logs').insert([
            // Today
            { user_id: userId, medicine_id: lisId, medicine_name: "Lisinopril",   status: "Taken",  timestamp: ts(0,8),  date_string: ds(0) },
            { user_id: userId, medicine_id: aspId, medicine_name: "Aspirin",       status: "Taken",  timestamp: ts(0,8),  date_string: ds(0) },
            { user_id: userId, medicine_id: vitId, medicine_name: "Vitamin D3",    status: "Taken",  timestamp: ts(0,9),  date_string: ds(0) },
            // Yesterday
            { user_id: userId, medicine_id: lisId, medicine_name: "Lisinopril",   status: "Taken",  timestamp: ts(1,8),  date_string: ds(1) },
            { user_id: userId, medicine_id: metId, medicine_name: "Metformin",     status: "Taken",  timestamp: ts(1,13), date_string: ds(1) },
            { user_id: userId, medicine_id: atoId, medicine_name: "Atorvastatin",  status: "Taken",  timestamp: ts(1,21), date_string: ds(1) },
            { user_id: userId, medicine_id: aspId, medicine_name: "Aspirin",       status: "Taken",  timestamp: ts(1,8),  date_string: ds(1) },
            { user_id: userId, medicine_id: amlId, medicine_name: "Amlodipine",    status: "Taken",  timestamp: ts(1,18), date_string: ds(1) },
            { user_id: userId, medicine_id: vitId, medicine_name: "Vitamin D3",    status: "Missed", timestamp: ts(1,9),  date_string: ds(1) },
            // 2 days ago
            { user_id: userId, medicine_id: lisId, medicine_name: "Lisinopril",   status: "Taken",  timestamp: ts(2,8),  date_string: ds(2) },
            { user_id: userId, medicine_id: metId, medicine_name: "Metformin",     status: "Taken",  timestamp: ts(2,13), date_string: ds(2) },
            { user_id: userId, medicine_id: atoId, medicine_name: "Atorvastatin",  status: "Missed", timestamp: ts(2,21), date_string: ds(2) },
            { user_id: userId, medicine_id: aspId, medicine_name: "Aspirin",       status: "Taken",  timestamp: ts(2,8),  date_string: ds(2) },
            { user_id: userId, medicine_id: amlId, medicine_name: "Amlodipine",    status: "Taken",  timestamp: ts(2,18), date_string: ds(2) },
            // 3 days ago
            { user_id: userId, medicine_id: lisId, medicine_name: "Lisinopril",   status: "Taken",  timestamp: ts(3,8),  date_string: ds(3) },
            { user_id: userId, medicine_id: metId, medicine_name: "Metformin",     status: "Taken",  timestamp: ts(3,13), date_string: ds(3) },
            { user_id: userId, medicine_id: atoId, medicine_name: "Atorvastatin",  status: "Taken",  timestamp: ts(3,21), date_string: ds(3) },
            { user_id: userId, medicine_id: aspId, medicine_name: "Aspirin",       status: "Missed", timestamp: ts(3,8),  date_string: ds(3) },
            { user_id: userId, medicine_id: amlId, medicine_name: "Amlodipine",    status: "Taken",  timestamp: ts(3,18), date_string: ds(3) },
          ]);

          // Seed 8 days of health vitals
          await supabase.from('health_logs').insert([
            { user_id: userId, systolic_bp: 119, diastolic_bp: 77, heart_rate: 69, blood_sugar: 99.0,  weight: 83.9, sleep_hours: 7.2, water_intake_ml: 2100, steps: 9500,  body_temp: 36.6, oxygen_saturation: 99, timestamp: ts(0), date_string: ds(0) },
            { user_id: userId, systolic_bp: 118, diastolic_bp: 78, heart_rate: 71, blood_sugar: 95.0,  weight: 84.0, sleep_hours: 7.0, water_intake_ml: 2400, steps: 12000, body_temp: 36.7, oxygen_saturation: 98, timestamp: ts(1), date_string: ds(1) },
            { user_id: userId, systolic_bp: 120, diastolic_bp: 79, heart_rate: 68, blood_sugar: 104.0, weight: 84.2, sleep_hours: 8.0, water_intake_ml: 2200, steps: 11200, body_temp: 36.5, oxygen_saturation: 99, timestamp: ts(2), date_string: ds(2) },
            { user_id: userId, systolic_bp: 122, diastolic_bp: 80, heart_rate: 70, blood_sugar: 96.0,  weight: 84.4, sleep_hours: 8.0, water_intake_ml: 2000, steps: 9000,  body_temp: 36.5, oxygen_saturation: 99, timestamp: ts(3), date_string: ds(3) },
            { user_id: userId, systolic_bp: 124, diastolic_bp: 82, heart_rate: 72, blood_sugar: 98.0,  weight: 84.5, sleep_hours: 7.5, water_intake_ml: 1800, steps: 8400,  body_temp: 36.6, oxygen_saturation: 98, timestamp: ts(4), date_string: ds(4) },
            { user_id: userId, systolic_bp: 126, diastolic_bp: 83, heart_rate: 74, blood_sugar: 102.0, weight: 84.8, sleep_hours: 6.5, water_intake_ml: 1600, steps: 6200,  body_temp: 36.8, oxygen_saturation: 97, timestamp: ts(5), date_string: ds(5) },
            { user_id: userId, systolic_bp: 128, diastolic_bp: 84, heart_rate: 75, blood_sugar: 108.0, weight: 85.0, sleep_hours: 6.0, water_intake_ml: 1500, steps: 5800,  body_temp: 36.7, oxygen_saturation: 97, timestamp: ts(6), date_string: ds(6) },
            { user_id: userId, systolic_bp: 130, diastolic_bp: 85, heart_rate: 76, blood_sugar: 112.0, weight: 85.2, sleep_hours: 5.5, water_intake_ml: 1400, steps: 4500,  body_temp: 36.9, oxygen_saturation: 96, timestamp: ts(7), date_string: ds(7) },
          ]);

          // Seed 8 mood logs
          await supabase.from('mood_logs').insert([
            { user_id: userId, mood: "😊 Happy",    timestamp: ts(0), date_string: ds(0), notes: "Feeling great after morning exercise!" },
            { user_id: userId, mood: "😴 Tired",    timestamp: ts(1), date_string: ds(1), notes: "Afternoon energy slump." },
            { user_id: userId, mood: "😊 Happy",    timestamp: ts(2), date_string: ds(2), notes: "Had a highly productive work day." },
            { user_id: userId, mood: "😐 Neutral",  timestamp: ts(3), date_string: ds(3), notes: "Average day, nothing special." },
            { user_id: userId, mood: "😊 Happy",    timestamp: ts(4), date_string: ds(4), notes: "Had a great jog in the park." },
            { user_id: userId, mood: "😰 Stressed", timestamp: ts(5), date_string: ds(5), notes: "Work deadline pressures." },
            { user_id: userId, mood: "😐 Neutral",  timestamp: ts(6), date_string: ds(6), notes: "Recovering from a tough week." },
            { user_id: userId, mood: "😴 Tired",    timestamp: ts(7), date_string: ds(7), notes: "Did not sleep well." },
          ]);

          // Update profile with rich info
          await supabase.from('profiles').upsert({
            id: userId,
            full_name: 'Alex Martinez',
            age: 42,
            gender: 'Male',
            blood_group: 'A+',
            phone_number: '+1 (555) 382-9901',
            medical_conditions: 'Mild Hypertension, Type 2 Diabetes, High Cholesterol',
            allergies: 'Sulfonamides, Peanuts',
            emergency_contact_name: 'Sophia Martinez (Spouse)',
            emergency_contact_number: '+1 (555) 382-9902',
          });
        }
      }
    } catch (e) {
      console.warn("Error seeding mock demo values", e);
    }
  };

  // --- CRUD ACTIONS ---
  const handleSaveMedicine = async (medData) => {
    if (!session?.user) return;

    try {
      if (editingMedicine) {
        const { error } = await supabase
          .from('medicines')
          .update(medData)
          .eq('id', editingMedicine.id);
        
        if (!error) {
          Alert.alert('Success', 'Medication updated successfully');
        }
      } else {
        const { error } = await supabase
          .from('medicines')
          .insert([{ user_id: session.user.id, ...medData }]);
        
        if (!error) {
          Alert.alert('Success', 'New medication configured');
        }
      }
      setShowAddMedicine(false);
      setEditingMedicine(null);
      handleRefreshData();
    } catch (e) {
      Alert.alert('Error', 'Failed to save medication changes');
    }
  };

  const handleSaveVitals = async (vitalsData) => {
    if (!session?.user) return;
    const todayDateString = new Date().toISOString().split('T')[0];

    try {
      const { data: existingLogs } = await supabase
        .from('health_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('date_string', todayDateString);

      if (existingLogs && existingLogs.length > 0) {
        const existing = existingLogs[0];
        const merged = {
          systolic_bp: vitalsData.systolic_bp !== null ? vitalsData.systolic_bp : existing.systolic_bp,
          diastolic_bp: vitalsData.diastolic_bp !== null ? vitalsData.diastolic_bp : existing.diastolic_bp,
          heart_rate: vitalsData.heart_rate !== null ? vitalsData.heart_rate : existing.heart_rate,
          blood_sugar: vitalsData.blood_sugar !== null ? vitalsData.blood_sugar : existing.blood_sugar,
          weight: vitalsData.weight !== null ? vitalsData.weight : existing.weight,
          sleep_hours: vitalsData.sleep_hours !== null ? vitalsData.sleep_hours : existing.sleep_hours,
          water_intake_ml: vitalsData.water_intake_ml !== null ? (existing.water_intake_ml || 0) + vitalsData.water_intake_ml : existing.water_intake_ml,
          steps: vitalsData.steps !== null ? (existing.steps || 0) + vitalsData.steps : existing.steps,
          body_temp: vitalsData.body_temp !== null ? vitalsData.body_temp : existing.body_temp,
          oxygen_saturation: vitalsData.oxygen_saturation !== null ? vitalsData.oxygen_saturation : existing.oxygen_saturation,
          timestamp: Date.now()
        };

        await supabase
          .from('health_logs')
          .update(merged)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('health_logs')
          .insert([{
            user_id: session.user.id,
            ...vitalsData,
            timestamp: Date.now(),
            date_string: todayDateString
          }]);
      }

      Alert.alert('Success', 'Biometrics recorded successfully');
      setShowLogVitals(false);
      handleRefreshData();
    } catch (e) {
      Alert.alert('Error', 'Failed to save health biometrics');
    }
  };

  const handleSaveProfile = async (profileData) => {
    if (!session?.user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', session.user.id);

      if (!error) {
        Alert.alert('Profile Saved', 'Successfully updated demographic settings');
        setShowEditProfile(false);
        handleRefreshData();
      } else {
        Alert.alert('Error', error.message);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update user profile parameters');
    }
  };

  const handleToggleDarkMode = async (val) => {
    setIsDark(val);
    if (session?.user) {
      try {
        await supabase
          .from('profiles')
          .update({ is_dark_mode: val })
          .eq('id', session.user.id);
        setUserProfile(prev => prev ? { ...prev, is_dark_mode: val } : null);
      } catch (e) {
        console.warn("Failed saving theme configuration", e);
      }
    }
  };

  const handleMarkMedicineStatus = async (med, status) => {
    const todayDateString = new Date().toISOString().split('T')[0];

    try {
      await supabase
        .from('medication_logs')
        .delete()
        .eq('medicine_id', med.id)
        .eq('date_string', todayDateString);

      await supabase.from('medication_logs').insert([{
        user_id: session.user.id,
        medicine_id: med.id,
        medicine_name: med.name,
        status: status,
        timestamp: Date.now(),
        date_string: todayDateString,
      }]);

      if (status === 'Taken') {
        const nextQty = Math.max(0, med.remaining_quantity - 1);
        const nextAdherence = med.total_adherence_count + 1;
        await supabase
          .from('medicines')
          .update({
            remaining_quantity: nextQty,
            total_adherence_count: nextAdherence,
          })
          .eq('id', med.id);
      } else if (status === 'Missed') {
        const nextMissed = med.missed_count + 1;
        await supabase
          .from('medicines')
          .update({
            missed_count: nextMissed,
          })
          .eq('id', med.id);
      }

      Alert.alert(status === 'Taken' ? 'Success' : 'Logged', `${med.name} marked as ${status.toLowerCase()}!`);
      handleRefreshData();
    } catch (e) {
      console.warn("Failed to update medication status", e);
    }
  };

  const handleDeleteMedicine = async (medId) => {
    try {
      const { error } = await supabase.from('medicines').delete().eq('id', medId);
      if (!error) {
        handleRefreshData();
      }
    } catch (e) {
      console.warn("Error deleting medicine", e);
    }
  };

  const handleLogMood = async (mood) => {
    const todayDateString = new Date().toISOString().split('T')[0];

    try {
      const { error } = await supabase.from('mood_logs').insert([{
        user_id: session.user.id,
        mood,
        timestamp: Date.now(),
        date_string: todayDateString,
        notes: `Mood recorded via Quick Dashboard logger: ${mood}`,
      }]);
      if (!error) {
        handleRefreshData();
      }
    } catch (e) {
      console.warn("Error logging mood", e);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Logout error", e);
    }
    setSession(null);
    setUserProfile(null);
    setMedicines([]);
    setHealthLogs([]);
    setMoodLogs([]);
    setMedicationLogs([]);
    setLoading(false);
  };

  const handleCallEmergency = () => {
    const phone = userProfile?.emergency_contact_number || '+1 555-0122';
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Dialer Failed', 'Biometric phone dialing is not supported on this emulator device.');
    });
    setShowEmergencyModal(false);
  };

  // --- RENDERING ROUTER ---
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.primary} />
        <Text style={{ marginTop: 10, color: c.textMuted }}>Securing clinical workspace...</Text>
      </View>
    );
  }

  // Not Authenticated Layouts
  if (!session) {
    if (authView === 'Register') {
      return (
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
            <RegisterScreen onNavigate={setAuthView} isDark={isDark} />
          </SafeAreaView>
        </SafeAreaProvider>
      );
    }
    if (authView === 'ForgotPassword') {
      return (
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
            <ForgotPasswordScreen onNavigate={setAuthView} isDark={isDark} />
          </SafeAreaView>
        </SafeAreaProvider>
      );
    }
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
          <LoginScreen onNavigate={setAuthView} onLoginSuccess={handleRefreshData} setSession={setSession} isDark={isDark} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Authenticated Layout
  const renderCurrentTab = () => {
    switch (currentTab) {
      case 'Dashboard':
        return (
          <DashboardScreen
            user={userProfile}
            medicines={medicines}
            healthLogs={healthLogs}
            moodLogs={moodLogs}
            medicationLogs={medicationLogs}
            onLogMood={handleLogMood}
            onLogVitalsPress={() => setShowLogVitals(true)}
            onSosPress={() => setShowEmergencyModal(true)}
            isDark={isDark}
            onRefreshData={handleRefreshData}
            onAddMedicinePress={() => setShowAddMedicine(true)}
          />
        );
      case 'Medications':
        return (
          <MedicationsScreen
            medicines={medicines}
            onAddPress={() => {
              setEditingMedicine(null);
              setShowAddMedicine(true);
            }}
            onEditPress={(med) => {
              setEditingMedicine(med);
              setShowAddMedicine(true);
            }}
            onMarkMedicineStatus={handleMarkMedicineStatus}
            onDeleteMedicine={handleDeleteMedicine}
            onRefreshData={handleRefreshData}
            isDark={isDark}
          />
        );
      case 'Health Log':
        return (
          <HealthLogScreen
            healthLogs={healthLogs}
            onLogVitalsPress={() => setShowLogVitals(true)}
            isDark={isDark}
          />
        );
      case 'Schedule':
        return (
          <ScheduleScreen
            medicines={medicines}
            medicationLogs={medicationLogs}
            onMarkMedicineStatus={handleMarkMedicineStatus}
            onRefreshData={handleRefreshData}
            isDark={isDark}
          />
        );
      case 'Reports':
        return (
          <ReportsScreen
            healthLogs={healthLogs}
            isDark={isDark}
          />
        );
      case 'Profile':
        return (
          <ProfileScreen
            user={userProfile}
            onEditPress={() => setShowEditProfile(true)}
            isDark={isDark}
          />
        );
      case 'Settings':
        return (
          <SettingsScreen
            isDark={isDark}
            onToggleDarkMode={handleToggleDarkMode}
            onLogout={handleLogout}
            isDarkTheme={isDark}
          />
        );
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={c.background} />
      <SafeAreaView style={[styles.mainContainer, { backgroundColor: c.background }]}>
        
        {/* Custom Header Layout matching Jetpack Compose style */}
        <View style={[styles.headerBar, { borderBottomColor: c.border, borderBottomWidth: 1 }]}>
          <View style={styles.headerInfo}>
            <View style={[styles.profileAvatarCircle, { backgroundColor: c.primary }]}>
              <Text style={styles.avatarText}>
                {(userProfile?.full_name?.charAt(0) || 'P').toUpperCase()}
              </Text>
            </View>
            <View style={styles.headerTitleColumn}>
              <Text style={[styles.headerGreetingText, { color: c.textMuted }]}>
                {new Date().getHours() < 12 ? 'GOOD MORNING' : new Date().getHours() < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING'}
              </Text>
              <Text style={[styles.headerUserText, { color: c.text }]}>
                {userProfile?.full_name || 'Patient'}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.settingsShortcutBtn, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}
              onPress={() => setCurrentTab('Settings')}
            >
              <Text style={{ fontSize: 16 }}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Screen View Router */}
        <View style={styles.screenWrapper}>
          {renderCurrentTab()}
        </View>

        {/* Custom Navigation Tab bar */}
        <View style={[styles.navigationTabBar, { backgroundColor: c.surface, borderTopColor: c.border, borderTopWidth: 1 }]}>
          {[
            { id: 'Dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'Medications', label: 'Medicines', icon: '💊' },
            { id: 'Health Log', label: 'Health Log', icon: '❤️' },
            { id: 'Schedule', label: 'Schedule', icon: '📅' },
            { id: 'Reports', label: 'Reports', icon: '📈' },
            { id: 'Profile', label: 'Profile', icon: '👤' },
          ].map(tab => {
            const isSelected = currentTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.navigationTabItem}
                onPress={() => setCurrentTab(tab.id)}
              >
                <Text style={{ fontSize: 18, opacity: isSelected ? 1 : 0.4 }}>{tab.icon}</Text>
                <Text style={[styles.tabLabel, { color: isSelected ? c.primary : c.textMuted, fontWeight: isSelected ? 'bold' : '500' }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Modal Dialog Views */}
        <EmergencyModal
          visible={showEmergencyModal}
          user={userProfile}
          onDismiss={() => setShowEmergencyModal(false)}
          onCallEmergency={handleCallEmergency}
          isDark={isDark}
        />

        <AddMedicineModal
          visible={showAddMedicine}
          medicine={editingMedicine}
          onDismiss={() => {
            setShowAddMedicine(false);
            setEditingMedicine(null);
          }}
          onSave={handleSaveMedicine}
          isDark={isDark}
        />

        <LogBiometricsModal
          visible={showLogVitals}
          onDismiss={() => setShowLogVitals(false)}
          onSave={handleSaveVitals}
          isDark={isDark}
        />

        <EditProfileModal
          visible={showEditProfile}
          user={userProfile}
          onDismiss={() => setShowEditProfile(false)}
          onSave={handleSaveProfile}
          isDark={isDark}
        />

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContainer: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 16,
  },
  headerTitleColumn: {
    marginLeft: 10,
  },
  headerGreetingText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  headerUserText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsShortcutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  emergencyShortcutBtn: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosShortcutText: {
    fontSize: 12,
    fontWeight: '900',
  },
  screenWrapper: {
    flex: 1,
  },
  navigationTabBar: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 4,
  },
  navigationTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  tabLabel: {
    fontSize: 9,
    marginTop: 4,
  },
});
