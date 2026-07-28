import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import { supabase } from '../supabase/supabaseClient';

// ─── Inline Error Banner ───────────────────────────────────────────────────────
const ErrorBanner = ({ message, c }) => {
  if (!message) return null;
  return (
    <View style={[styles.errorBanner, { backgroundColor: c.errorContainer, borderColor: c.error }]}>
      <Text style={[styles.errorBannerText, { color: c.error }]}>⚠️  {message}</Text>
    </View>
  );
};

// ─── Success Banner ────────────────────────────────────────────────────────────
const SuccessBanner = ({ message, c }) => {
  if (!message) return null;
  return (
    <View style={[styles.successBanner, { backgroundColor: '#ECFDF5', borderColor: c.success }]}>
      <Text style={[styles.successBannerText, { color: c.success }]}>✅  {message}</Text>
    </View>
  );
};

// ─── Login Screen ──────────────────────────────────────────────────────────────
export const LoginScreen = ({ onNavigate, onLoginSuccess, isDark, setSession }) => {
  const c = isDark ? colors.dark : colors.light;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (!trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('invalid login credentials') ||
            authError.message.toLowerCase().includes('invalid credentials')) {
          setError('Incorrect email/password, OR your email is not confirmed. (Tip: Disable "Confirm Email" in your Supabase Auth settings).');
        } else if (authError.message.toLowerCase().includes('email not confirmed')) {
          setError('Please confirm your email address first. Check your inbox.');
        } else {
          setError(authError.message);
        }
      } else {
        setSession(data.session);
        onLoginSuccess();
      }
    } catch (e) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContainer, { backgroundColor: c.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.centerWrapper}>
        <View style={styles.card}>
          {/* Logo */}
          <View style={[styles.logoBox, { backgroundColor: c.primaryContainer }]}>
            <Text style={styles.logoIcon}>🏥</Text>
          </View>
          <Text style={[styles.appName, { color: c.primary }]}>HealthTrack Hub</Text>
          <Text style={[styles.appSubtitle, { color: c.textMuted }]}>
            Medicine Reminder & Personal Health System
          </Text>

          {/* Form */}
          <View style={[styles.formCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.formTitle, { color: c.text }]}>Sign In to Your Account</Text>

            <ErrorBanner message={error} c={c} />

            {/* Email */}
            <Text style={[styles.label, { color: c.textMuted }]}>Email Address</Text>
            <TextInput
              id="login-email"
              style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: error ? c.error : c.border }]}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={c.textMuted}
              autoComplete="email"
            />

            {/* Password */}
            <Text style={[styles.label, { color: c.textMuted }]}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                id="login-password"
                style={[styles.input, styles.passwordInput, { backgroundColor: c.inputBg, color: c.text, borderColor: error ? c.error : c.border }]}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(''); }}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
                placeholderTextColor={c.textMuted}
                autoComplete="current-password"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={[styles.eyeBtn, { backgroundColor: c.inputBg, borderColor: c.border }]}
                onPress={() => setShowPassword(v => !v)}
              >
                <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotRow}
              onPress={() => onNavigate('ForgotPassword')}
            >
              <Text style={[styles.linkText, { color: c.primary }]}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            {loading ? (
              <ActivityIndicator size="large" color={c.primary} style={{ marginVertical: 16 }} />
            ) : (
              <>
                <TouchableOpacity
                  id="login-submit-btn"
                  style={[styles.primaryBtn, { backgroundColor: c.primary }]}
                  onPress={handleLogin}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>Sign In</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Register Link */}
          <View style={styles.switchRow}>
            <Text style={{ color: c.textMuted }}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => onNavigate('Register')}>
              <Text style={[styles.linkText, { color: c.primary, fontWeight: 'bold' }]}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

// ─── Register Screen ───────────────────────────────────────────────────────────
export const RegisterScreen = ({ onNavigate, isDark }) => {
  const c = isDark ? colors.dark : colors.light;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [blood, setBlood] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async () => {
    setError('');
    setSuccess('');

    if (!name.trim()) { setError('Full name is required.'); return; }
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email address.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            age: parseInt(age, 10) || null,
            gender: gender.trim() || null,
            blood_group: blood.trim() || null,
          },
        },
      });

      if (authError) {
        setError(authError.message);
      } else {
        setSuccess('Account created! (If login fails, ensure "Confirm Email" is disabled in your Supabase Auth settings).');
        setTimeout(() => onNavigate('Login'), 4500);
      }
    } catch (e) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const GENDERS = ['Male', 'Female', 'Other'];
  const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'O+', 'O−', 'AB+', 'AB−'];

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContainer, { backgroundColor: c.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.centerWrapper}>
        <View style={styles.card}>
          <Text style={[styles.appName, { color: c.primary }]}>Create Account</Text>
          <Text style={[styles.appSubtitle, { color: c.textMuted }]}>
            Join HealthTrack Hub to manage your health
          </Text>

          <View style={[styles.formCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <ErrorBanner message={error} c={c} />
            <SuccessBanner message={success} c={c} />

            {/* Name */}
            <Text style={[styles.label, { color: c.textMuted }]}>Full Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              value={name}
              onChangeText={setName}
              placeholder="John Doe"
              placeholderTextColor={c.textMuted}
            />

            {/* Email */}
            <Text style={[styles.label, { color: c.textMuted }]}>Email Address *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={c.textMuted}
            />

            {/* Password */}
            <Text style={[styles.label, { color: c.textMuted }]}>Password * (min 6 chars)</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
                placeholderTextColor={c.textMuted}
              />
              <TouchableOpacity
                style={[styles.eyeBtn, { backgroundColor: c.inputBg, borderColor: c.border }]}
                onPress={() => setShowPassword(v => !v)}
              >
                <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <Text style={[styles.label, { color: c.textMuted }]}>Confirm Password *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: confirmPassword && confirmPassword !== password ? c.error : c.border }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              placeholder="••••••••"
              placeholderTextColor={c.textMuted}
            />
            {confirmPassword && confirmPassword !== password && (
              <Text style={{ color: c.error, fontSize: 12, marginTop: 4 }}>Passwords do not match</Text>
            )}

            {/* Age & Blood Group Row */}
            <View style={styles.twoColRow}>
              <View style={styles.colHalf}>
                <Text style={[styles.label, { color: c.textMuted }]}>Age</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  placeholder="e.g. 30"
                  placeholderTextColor={c.textMuted}
                  maxLength={3}
                />
              </View>
              <View style={[styles.colHalf, { marginLeft: 12 }]}>
                <Text style={[styles.label, { color: c.textMuted }]}>Blood Group</Text>
                <View style={styles.chipRow}>
                  {BLOOD_GROUPS.map(bg => (
                    <TouchableOpacity
                      key={bg}
                      style={[styles.chip, { borderColor: blood === bg ? c.primary : c.border, backgroundColor: blood === bg ? c.primaryContainer : c.inputBg }]}
                      onPress={() => setBlood(blood === bg ? '' : bg)}
                    >
                      <Text style={[styles.chipText, { color: blood === bg ? c.primary : c.textMuted }]}>{bg}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Gender */}
            <Text style={[styles.label, { color: c.textMuted }]}>Gender</Text>
            <View style={styles.chipRowFull}>
              {GENDERS.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, { borderColor: gender === g ? c.primary : c.border, backgroundColor: gender === g ? c.primaryContainer : c.inputBg }]}
                  onPress={() => setGender(gender === g ? '' : g)}
                >
                  <Text style={[styles.chipText, { color: gender === g ? c.primary : c.textMuted }]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Submit */}
            {loading ? (
              <ActivityIndicator size="large" color={c.primary} style={{ marginVertical: 16 }} />
            ) : (
              <TouchableOpacity
                id="register-submit-btn"
                style={[styles.primaryBtn, { backgroundColor: c.primary }]}
                onPress={handleRegister}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Create Account</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.switchRow}>
            <Text style={{ color: c.textMuted }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => onNavigate('Login')}>
              <Text style={[styles.linkText, { color: c.primary, fontWeight: 'bold' }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

// ─── Forgot Password Screen ────────────────────────────────────────────────────
export const ForgotPasswordScreen = ({ onNavigate, isDark }) => {
  const c = isDark ? colors.dark : colors.light;

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (resetError) {
        setError(resetError.message);
      } else {
        setSent(true);
      }
    } catch (e) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContainer, { backgroundColor: c.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.centerWrapper}>
        <View style={styles.card}>
          <View style={[styles.logoBox, { backgroundColor: c.primaryContainer }]}>
            <Text style={styles.logoIcon}>🔑</Text>
          </View>
          <Text style={[styles.appName, { color: c.text }]}>Reset Password</Text>
          <Text style={[styles.appSubtitle, { color: c.textMuted }]}>
            Enter your email and we'll send you a reset link
          </Text>

          <View style={[styles.formCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            {sent ? (
              <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>📬</Text>
                <Text style={[styles.formTitle, { color: c.text, textAlign: 'center' }]}>Check your inbox!</Text>
                <Text style={[styles.appSubtitle, { color: c.textMuted, textAlign: 'center', marginTop: 8 }]}>
                  We sent a password reset link to{'\n'}<Text style={{ color: c.primary, fontWeight: 'bold' }}>{email}</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: c.primary, marginTop: 24 }]}
                  onPress={() => onNavigate('Login')}
                >
                  <Text style={styles.primaryBtnText}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <ErrorBanner message={error} c={c} />

                <Text style={[styles.label, { color: c.textMuted }]}>Email Address</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(''); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="you@example.com"
                  placeholderTextColor={c.textMuted}
                  onSubmitEditing={handleReset}
                />

                {loading ? (
                  <ActivityIndicator size="large" color={c.primary} style={{ marginVertical: 16 }} />
                ) : (
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: c.primary }]}
                    onPress={handleReset}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryBtnText}>Send Reset Link</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {!sent && (
            <TouchableOpacity style={styles.switchRow} onPress={() => onNavigate('Login')}>
              <Text style={[styles.linkText, { color: c.textMuted }]}>← Back to Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  centerWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 40,
  },
  appName: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 4,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
    lineHeight: 20,
  },
  formCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    fontSize: 15,
    width: '100%',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passwordInput: {
    flex: 1,
  },
  eyeBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 4,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
    borderWidth: 2,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  errorBanner: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  successBanner: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
  successBannerText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  twoColRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  colHalf: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  chipRowFull: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
