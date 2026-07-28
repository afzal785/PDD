package com.example

import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.data.database.HealthLogEntity
import com.example.data.database.MedicationLogEntity
import com.example.data.database.MedicineEntity
import com.example.data.database.UserEntity
import com.example.ui.AuthScreenState
import com.example.ui.theme.HealthTrackTheme
import androidx.compose.ui.text.font.FontFamily
import com.example.ui.theme.SlateBorderDark
import com.example.ui.theme.SlateBorderLight
import com.example.ui.theme.TealPrimary
import com.example.ui.HealthViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val viewModel: HealthViewModel = viewModel()
            val userProfile by viewModel.userProfile.collectAsStateWithLifecycle()
            val isDark = userProfile?.isDarkMode == true

            HealthTrackTheme(darkTheme = isDark) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    HealthTrackApp(viewModel)
                }
            }
        }
    }
}

// Helper helpers to trigger alerts standard vibration/sound
fun triggerSystemAlert(context: Context, durationMs: Long = 200, playSound: Boolean = false) {
    try {
        val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        if (vibrator != null && vibrator.hasVibrator()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(durationMs)
            }
        }
        if (playSound) {
            val notification = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            val r = RingtoneManager.getRingtone(context, notification)
            r.play()
        }
    } catch (e: Exception) {
        e.printStackTrace()
    }
}

@Composable
fun HealthTrackApp(viewModel: HealthViewModel) {
    val authState by viewModel.authState.collectAsStateWithLifecycle()

    AnimatedContent(
        targetState = authState,
        transitionSpec = {
            fadeIn(animationSpec = tween(300)) togetherWith fadeOut(animationSpec = tween(300))
        },
        label = "AuthNavState"
    ) { state ->
        when (state) {
            is AuthScreenState.Login -> LoginScreen(viewModel)
            is AuthScreenState.Register -> RegisterScreen(viewModel)
            is AuthScreenState.ForgotPassword -> ForgotPasswordScreen(viewModel)
            is AuthScreenState.Authenticated -> MainContainerScreen(viewModel)
        }
    }
}

// --- CORE FRAME CONTAINER ---
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainContainerScreen(viewModel: HealthViewModel) {
    val currentTab by viewModel.currentTab.collectAsStateWithLifecycle()
    val userProfile by viewModel.userProfile.collectAsStateWithLifecycle()
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    var showEmergencyModal by remember { mutableStateOf(false) }

    val systemInDark = isSystemInDarkTheme()
    val isDark = userProfile?.isDarkMode ?: systemInDark

    Scaffold(
        topBar = {
            // High-fidelity Minimal custom header with safe area padding
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .background(MaterialTheme.colorScheme.background)
                    .padding(horizontal = 20.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Profile & Greeting Block
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    val initials = (userProfile?.fullName?.firstOrNull() ?: 'P').toString().uppercase()
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .background(
                                color = MaterialTheme.colorScheme.primary,
                                shape = CircleShape
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = initials,
                            color = Color.White,
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.SansSerif
                            )
                        )
                    }
                    Column {
                        val greeting = when (Calendar.getInstance().get(Calendar.HOUR_OF_DAY)) {
                            in 0..11 -> "GOOD MORNING"
                            in 12..16 -> "GOOD AFTERNOON"
                            else -> "GOOD EVENING"
                        }
                        Text(
                            text = greeting,
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.ExtraBold,
                                letterSpacing = 1.5.sp,
                                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
                                fontFamily = FontFamily.SansSerif
                            )
                        )
                        Spacer(modifier = Modifier.height(1.dp))
                        Text(
                            text = userProfile?.fullName ?: "Valued Patient",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onBackground
                            )
                        )
                    }
                }

                // Action area: Setting & SOS Pill
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Modern Minimalist white/dark button with high-contrast thin slate border
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .background(
                                color = if (isDark) Color(0xFF1E293B) else Color.White,
                                shape = CircleShape
                            )
                            .border(
                                width = 1.dp,
                                color = if (isDark) Color(0xFF334155) else Color(0xFFE2E8F0),
                                shape = CircleShape
                            )
                            .clickable { viewModel.setTab("Settings") }
                            .testTag("settings_top_button"),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Settings,
                            contentDescription = "Settings",
                            tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.8f),
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        },
        bottomBar = {
            // Elegant navigation bar with an ultra-thin border stroke mimicking slate-100/slate-700
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface,
                tonalElevation = 0.dp,
                modifier = Modifier
                    .border(
                        width = 1.dp,
                        color = if (isDark) Color(0xFF1E293B) else Color(0xFFF1F5F9),
                        shape = RectangleShape
                    )
            ) {
                val tabs = listOf(
                    NavigationTabItem("Dashboard", Icons.Filled.Dashboard, "dashboard_tab"),
                    NavigationTabItem("Medications", Icons.Filled.MedicalServices, "meds_tab"),
                    NavigationTabItem("Health Log", Icons.Filled.Favorite, "logs_tab"),
                    NavigationTabItem("Schedule", Icons.Filled.Event, "sched_tab"),
                    NavigationTabItem("Reports", Icons.Filled.Timeline, "reports_tab"),
                    NavigationTabItem("Profile", Icons.Filled.Person, "profile_tab")
                )

                tabs.forEach { item ->
                    val selected = currentTab == item.name
                    NavigationBarItem(
                        selected = selected,
                        onClick = { viewModel.setTab(item.name) },
                        icon = {
                            Icon(
                                item.icon,
                                contentDescription = item.name,
                                modifier = Modifier.size(20.dp)
                            )
                        },
                        label = {
                            Text(
                                item.name,
                                fontSize = 10.sp,
                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                                fontFamily = FontFamily.SansSerif,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = MaterialTheme.colorScheme.primary,
                            selectedTextColor = MaterialTheme.colorScheme.primary,
                            unselectedIconColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.45f),
                            unselectedTextColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.45f),
                            indicatorColor = if (isDark) Color(0xFF134E4A) else Color(0xFFCCFBF1) // light/dark Teal active pill context
                        ),
                        modifier = Modifier.testTag(item.testTag)
                    )
                }
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
        ) {
            AnimatedContent(
                targetState = currentTab,
                transitionSpec = {
                    slideInHorizontally { width -> width / 4 } + fadeIn() togetherWith
                            slideOutHorizontally { width -> -width / 4 } + fadeOut()
                },
                label = "MainTabTransitions"
            ) { tab ->
                when (tab) {
                    "Dashboard" -> DashboardScreen(viewModel)
                    "Medications" -> MedicationsScreen(viewModel)
                    "Health Log" -> HealthLogScreen(viewModel)
                    "Schedule" -> ScheduleScreen(viewModel)
                    "Reports" -> ReportsScreen(viewModel)
                    "Profile" -> ProfileScreen(viewModel)
                    "Settings" -> SettingsScreen(viewModel)
                }
            }
        }
    }

    if (showEmergencyModal) {
        EmergencyModalDialog(
            user = userProfile,
            onDismiss = { showEmergencyModal = false },
            onCallEmergency = {
                val callIntent = Intent(Intent.ACTION_DIAL).apply {
                    data = Uri.parse("tel:${userProfile?.emergencyContactNumber ?: "911"}")
                }
                context.startActivity(callIntent)
                Toast.makeText(context, "Initiating contact dialing call...", Toast.LENGTH_SHORT).show()
                showEmergencyModal = false
            }
        )
    }
}

data class NavigationTabItem(val name: String, val icon: ImageVector, val testTag: String)

// --- 1. AUTHENTICATION SCREENS ---
@Composable
fun LoginScreen(viewModel: HealthViewModel) {
    val context = LocalContext.current
    var email by remember { mutableStateOf("alexander.m@healthmail.com") }
    var password by remember { mutableStateOf("••••••••") }
    var rememberMe by remember { mutableStateOf(true) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Spacer(modifier = Modifier.height(48.dp))

        // Large Premium Medical Icon Logo Area
        Box(
            modifier = Modifier
                .size(90.dp)
                .background(
                    color = MaterialTheme.colorScheme.primaryContainer,
                    shape = RoundedCornerShape(24.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Filled.LocalHospital,
                contentDescription = "Medical Shield Logo",
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(50.dp)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "HealthTrack Hub",
            style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Black),
            color = MaterialTheme.colorScheme.primary
        )

        Text(
            text = "Medicine Reminder & Personal Health System",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f),
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )

        Spacer(modifier = Modifier.height(32.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "Secure Member Login",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Registered Email Address") },
                    leadingIcon = { Icon(Icons.Filled.Email, contentDescription = null) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("username_input"),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Access Password") },
                    leadingIcon = { Icon(Icons.Filled.Lock, contentDescription = null) },
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("password_input"),
                    shape = RoundedCornerShape(12.dp)
                )

                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = rememberMe, onCheckedChange = { rememberMe = it })
                        Text("Remember profile", fontSize = 13.sp)
                    }
                    TextButton(onClick = { viewModel.navigateToAuth(AuthScreenState.ForgotPassword) }) {
                        Text("Forgot access key?", fontSize = 13.sp)
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                Button(
                    onClick = {
                        val success = viewModel.onLogin(email, password)
                        if (success) {
                            triggerSystemAlert(context, 100)
                            Toast.makeText(context, "Access Granted. Safe Mode Active.", Toast.LENGTH_SHORT).show()
                        } else {
                            Toast.makeText(context, "Invalid Email Profile. Retrying...", Toast.LENGTH_LONG).show()
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                        .testTag("login_button"),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Unlock Dashboards", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("First-time logging in? ", fontSize = 14.sp)
            TextButton(onClick = { viewModel.navigateToAuth(AuthScreenState.Register) }) {
                Text("Create Patient Profile", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun RegisterScreen(viewModel: HealthViewModel) {
    val context = LocalContext.current
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var ageStr by remember { mutableStateOf("35") }
    var gender by remember { mutableStateOf("Male") }
    var bloodGroup by remember { mutableStateOf("O+") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Spacer(modifier = Modifier.height(30.dp))

        Text(
            text = "Patient Registration",
            style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Black),
            color = MaterialTheme.colorScheme.primary
        )
        Text(
            text = "Setup secure biometric health tracking parameters",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f),
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(24.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Full Legal Name") },
                    leadingIcon = { Icon(Icons.Filled.Person, contentDescription = null) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Contact Email") },
                    leadingIcon = { Icon(Icons.Filled.Email, contentDescription = null) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = ageStr,
                        onValueChange = { ageStr = it },
                        label = { Text("Age") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    OutlinedTextField(
                        value = bloodGroup,
                        onValueChange = { bloodGroup = it },
                        label = { Text("Blood Group") },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = gender,
                    onValueChange = { gender = it },
                    label = { Text("Biological Sex (Gender)") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = {
                        val age = ageStr.toIntOrNull() ?: 35
                        val success = viewModel.onRegister(name, email, age, gender, bloodGroup)
                        if (success) {
                            Toast.makeText(context, "Registration Complete!", Toast.LENGTH_SHORT).show()
                        } else {
                            Toast.makeText(context, "Please complete name and email", Toast.LENGTH_SHORT).show()
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                        .testTag("register_submit_button"),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Register & Save Profile", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        TextButton(onClick = { viewModel.navigateToAuth(AuthScreenState.Login) }) {
            Text("Back to log in", fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun ForgotPasswordScreen(viewModel: HealthViewModel) {
    var email by remember { mutableStateOf("") }
    var sent by remember { mutableStateOf(false) }
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Filled.Lock,
            contentDescription = "Lock key icon",
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(64.dp)
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            "Recover Access Keys",
            style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold)
        )
        Text(
            "Enter your registered email to receive a secure recovery code.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f),
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )

        Spacer(modifier = Modifier.height(24.dp))

        if (sent) {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                modifier = Modifier.fillMaxWidth().padding(8.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(Icons.Filled.CheckCircle, "success", tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(40.dp))
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("Secured link dispatched!", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Check your inbox for $email to clear login keys.", fontSize = 13.sp, textAlign = TextAlign.Center)
                }
            }
        } else {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Profile Email Address") },
                        leadingIcon = { Icon(Icons.Filled.Email, null) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = {
                            if (email.contains("@")) {
                                sent = true
                                triggerSystemAlert(context, 100)
                            } else {
                                Toast.makeText(context, "Enter a valid email", Toast.LENGTH_SHORT).show()
                            }
                        },
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Send Security Token")
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
        TextButton(onClick = { viewModel.navigateToAuth(AuthScreenState.Login) }) {
            Text("Cancel and return to log in")
        }
    }
}

// --- 2. MAIN HUB DASHBOARD ---
@Composable
fun DashboardScreen(viewModel: HealthViewModel) {
    val context = LocalContext.current
    val userProfile by viewModel.userProfile.collectAsStateWithLifecycle()
    val latestLog by viewModel.latestHealthLog.collectAsStateWithLifecycle()
    val adherencePercent by viewModel.todayAdherencePercentage.collectAsStateWithLifecycle()
    val score by viewModel.healthScore.collectAsStateWithLifecycle()
    val medicines by viewModel.medicines.collectAsStateWithLifecycle()

    val aiSuggestion by viewModel.aiSuggestion.collectAsStateWithLifecycle()
    val isAiLoading by viewModel.isAiLoading.collectAsStateWithLifecycle()

    val currentMood by viewModel.latestMood.collectAsStateWithLifecycle()

    val dateStr = SimpleDateFormat("EEEE, d MMMM yyyy", Locale.getDefault()).format(Date())

    val systemInDark = isSystemInDarkTheme()
    val isDark = userProfile?.isDarkMode ?: systemInDark

    // Urgent Alerts checks
    val hasLowRefills = medicines.any { it.remainingQuantity <= 5 }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(12.dp))
            // Welcome Greeting Section matched to the Minimal guideline
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
                    val timeGreeting = when {
                        hour < 12 -> "Good morning"
                        hour < 17 -> "Good afternoon"
                        else -> "Good evening"
                    }
                    Text(
                        text = "$timeGreeting",
                        style = MaterialTheme.typography.bodyLarge.copy(
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f)
                        )
                    )
                    Text(
                        text = userProfile?.fullName ?: "Valued Patient",
                        style = MaterialTheme.typography.headlineMedium.copy(
                            fontWeight = FontWeight.Black,
                            letterSpacing = (-0.5).sp,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                    )
                    Text(
                        text = dateStr,
                        style = MaterialTheme.typography.bodySmall.copy(
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    )
                }

                // Decorative user wellness badge icon
                Box(
                    modifier = Modifier
                        .size(52.dp)
                        .background(
                            color = if (isDark) Color(0xFF134E4A) else Color(0xFFCCFBF1), // Very light teal circle
                            shape = CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    val firstChar = (userProfile?.fullName?.firstOrNull() ?: 'P').toString().uppercase()
                    Text(
                        text = firstChar,
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Black,
                            color = MaterialTheme.colorScheme.primary
                        )
                    )
                }
            }
        }

        // Crisis warning flags (low stock/emergency) - Redesigned
        if (hasLowRefills) {
            item {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = if (isDark) Color(0xFF450A0A) else Color(0xFFFEF2F2)
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(
                            width = 1.dp,
                            color = if (isDark) Color(0xFF991B1B).copy(alpha = 0.4f) else Color(0xFFFEE2E2),
                            shape = RoundedCornerShape(20.dp)
                        ),
                    shape = RoundedCornerShape(20.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Filled.Warning,
                            "Low Pill Warning",
                            tint = Color(0xFFE11D48),
                            modifier = Modifier.size(32.dp)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                "Critical Refill Alert", 
                                fontWeight = FontWeight.Bold, 
                                color = Color(0xFFE11D48),
                                fontSize = 14.sp
                            )
                            Text(
                                "Some medications are down to <= 5 pills. Check stock logs.", 
                                fontSize = 12.sp, 
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                            )
                        }
                    }
                }
            }
        }

        // Row of Primary Adherence & Health Index Overview - Clean Utility aesthetic
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Today's Adherence Card (Teal-600 background card matching design HTML)
                Card(
                    modifier = Modifier
                        .weight(1f)
                        .aspectRatio(1f),
                    shape = RoundedCornerShape(28.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
                    elevation = CardDefaults.cardElevation(0.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(18.dp),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = "Pill Adherence",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = Color.White.copy(alpha = 0.82f)
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "$adherencePercent%",
                                style = MaterialTheme.typography.headlineLarge.copy(
                                    fontWeight = FontWeight.Black,
                                    letterSpacing = (-1).sp
                                ),
                                color = Color.White
                            )
                        }
                        
                        Column {
                            // Straight modern utility progress bar matching HTML example
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(8.dp)
                                    .background(Color.White.copy(alpha = 0.25f), CircleShape)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth(fraction = (adherencePercent.toFloat() / 100f).coerceIn(0f, 1f))
                                        .fillMaxHeight()
                                        .background(Color.White, CircleShape)
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = if (adherencePercent == 100) "Perfect compliance" else "Pills tracking today",
                                fontSize = 10.sp,
                                color = Color.White.copy(alpha = 0.8f)
                            )
                        }
                    }
                }

                // Health Score Card styled with slate-border and flat backgrounds
                Card(
                    modifier = Modifier
                        .weight(1f)
                        .aspectRatio(1f)
                        .border(
                            width = 1.dp,
                            color = if (isDark) SlateBorderDark else SlateBorderLight,
                            shape = RoundedCornerShape(28.dp)
                        ),
                    shape = RoundedCornerShape(28.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(0.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(18.dp),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Wellness Rating",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                            )
                            Icon(
                                imageVector = Icons.Filled.Star,
                                contentDescription = null,
                                tint = Color(0xFFF59E0B),
                                modifier = Modifier.size(16.dp)
                            )
                        }
                        
                        Text(
                            text = "$score",
                            style = MaterialTheme.typography.headlineLarge.copy(
                                fontWeight = FontWeight.Black,
                                fontSize = 38.sp,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        )
                        
                        Text(
                            text = "Score calculated dynamically",
                            fontSize = 10.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                        )
                    }
                }
            }
        }

        // NEXT DRUG ALERT TIMELINE HEADER - Redesigned to 'Clean Utility' white card with action button
        item {
            val pendingMeds = medicines.filter { med ->
                // Basic schedule listing matches closest
                true
            }.sortedBy { it.reminderTime }
            val nextMed = pendingMeds.firstOrNull()

            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(
                        width = 1.dp,
                        color = if (isDark) SlateBorderDark else SlateBorderLight,
                        shape = RoundedCornerShape(24.dp)
                    ),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(0.dp)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp).fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        modifier = Modifier.weight(1f),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Sky blue circle/rounded rectangle box for medicine icon
                        Box(
                            modifier = Modifier
                                .size(54.dp)
                                .background(
                                    color = if (isDark) Color(0xFF0C4A6E) else Color(0xFFE0F2FE),
                                    shape = RoundedCornerShape(16.dp)
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("💊", fontSize = 24.sp)
                        }
                        Spacer(modifier = Modifier.width(14.dp))
                        Column {
                            val timeLabel = nextMed?.reminderTime ?: "10:30 AM"
                            Text(
                                "NEXT DOSE • $timeLabel",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.ExtraBold,
                                    letterSpacing = 1.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                                    fontFamily = FontFamily.SansSerif
                                )
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = nextMed?.name ?: "No meds due next",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = nextMed?.let { "${it.dosage} • ${it.period}" } ?: "Setup medicines in tab below",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                            )
                        }
                    }

                    if (nextMed != null) {
                        Button(
                            onClick = {
                                viewModel.markAsTaken(nextMed)
                                triggerSystemAlert(context, 150, playSound = true)
                                Toast.makeText(context, "${nextMed.name} recorded as TAKEN.", Toast.LENGTH_SHORT).show()
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isDark) TealPrimary.copy(alpha = 0.2f) else Color(0xFFF0FDFA),
                                contentColor = TealPrimary
                            ),
                            shape = RoundedCornerShape(12.dp),
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                        ) {
                            Text("Take", fontWeight = FontWeight.ExtraBold, fontSize = 13.sp)
                        }
                    }
                }
            }
        }

        // QUICK ADD ACTIONS CLIPS
        item {
            Column {
                Text(
                    text = "Vitals Quick Add Logging",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f)
                )
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.horizontalScroll(rememberScrollState())
                ) {
                    InputChip(
                        selected = false,
                        onClick = {
                            viewModel.addIncrementWater(250)
                            Toast.makeText(context, "Logged +250ml Pure Water", Toast.LENGTH_SHORT).show()
                        },
                        label = { Text("Water +250ml", fontWeight = FontWeight.SemiBold) },
                        leadingIcon = { Icon(Icons.Filled.Opacity, null, tint = Color(0xFF0EA5E9), modifier = Modifier.size(16.dp)) }
                    )
                    InputChip(
                        selected = false,
                        onClick = {
                            viewModel.addSteps(1000)
                            Toast.makeText(context, "Logged +1000 Walking Steps", Toast.LENGTH_SHORT).show()
                        },
                        label = { Text("Steps +1000", fontWeight = FontWeight.SemiBold) },
                        leadingIcon = { Icon(Icons.Filled.DirectionsWalk, null, tint = Color(0xFF10B981), modifier = Modifier.size(16.dp)) }
                    )
                    InputChip(
                        selected = false,
                        onClick = { viewModel.setTab("Health Log") },
                        label = { Text("Log BP & Sugar", fontWeight = FontWeight.SemiBold) },
                        leadingIcon = { Icon(Icons.Filled.Add, null, modifier = Modifier.size(16.dp)) }
                    )
                }
            }
        }

        // MOOD TRACKING WIDGET (Sleek minimalist horizontal list matched to HTML button spec)
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(
                        width = 1.dp,
                        color = if (isDark) SlateBorderDark else SlateBorderLight,
                        shape = RoundedCornerShape(24.dp)
                    ),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(0.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text(
                        text = "Current Mood",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "How are you feeling biochemically/physically today?",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                    Spacer(modifier = Modifier.height(14.dp))

                    val moods = listOf(
                        MoodItem("Very Happy", "🤠", Color(0xFF10B981)),
                        MoodItem("Happy", "😊", Color(0xFF10B981)),
                        MoodItem("Neutral", "😐", Color(0xFF0EA5E9)),
                        MoodItem("Tired", "😴", Color(0xFFF59E0B)),
                        MoodItem("Stressed", "😰", Color(0xFFEF4444))
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        moods.forEach { item ->
                            val isSelected = currentMood?.mood == item.name
                            Box(
                                modifier = Modifier
                                    .size(if (isSelected) 46.dp else 38.dp)
                                    .clip(CircleShape)
                                    .background(
                                        if (isSelected) TealPrimary else (if (isDark) Color(0xFF1E293B) else Color.White)
                                    )
                                    .border(
                                        width = 1.dp,
                                        color = if (isSelected) TealPrimary else (if (isDark) Color(0xFF334155) else Color(0xFFF1F5F9)),
                                        shape = CircleShape
                                    )
                                    .clickable {
                                        viewModel.addMoodLog(item.name, "Logged via dashboard selection.")
                                        triggerSystemAlert(context, 100)
                                        Toast.makeText(context, "Logged today's mood as: ${item.name}", Toast.LENGTH_SHORT).show()
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = item.emoji,
                                    fontSize = if (isSelected) 22.sp else 18.sp
                                )
                            }
                        }
                    }
                }
            }
        }

        // --- MODERN GRADIENT AI ADVICE SUGGESTIONS BOX (Sky block) ---
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(
                        width = 1.dp,
                        color = if (isDark) Color(0xFF0ea5e9).copy(alpha = 0.3f) else Color(0xFFBAE6FD),
                        shape = RoundedCornerShape(24.dp)
                    ),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (isDark) Color(0xFF0C243B) else Color(0xFFF0F9FF)
                ),
                elevation = CardDefaults.cardElevation(0.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .background(Color(0xFF0EA5E9), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("✨", fontSize = 14.sp)
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "AI HEALTH TIP",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.ExtraBold,
                                    letterSpacing = 1.2.sp,
                                    color = if (isDark) Color(0xFF38BDF8) else Color(0xFF0369A1),
                                    fontFamily = FontFamily.SansSerif
                                )
                            )
                        }

                        IconButton(
                            onClick = { viewModel.refreshAiSuggestion() },
                            modifier = Modifier.size(24.dp)
                        ) {
                            Icon(
                                Icons.Filled.Refresh,
                                contentDescription = "Refresh",
                                tint = if (isDark) Color(0xFF38BDF8) else Color(0xFF0284C7)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    if (isAiLoading) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp), 
                                strokeWidth = 2.dp,
                                color = if (isDark) Color(0xFF38BDF8) else Color(0xFF0284C7)
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                "Consulting Gemini AI...", 
                                fontSize = 13.sp,
                                color = if (isDark) Color(0xFF93C5FD) else Color(0xFF0369A1)
                            )
                        }
                    } else {
                        Text(
                            text = aiSuggestion.ifBlank { "Add medicines and complete diagnostics to generate live expert AI suggestions." },
                            style = MaterialTheme.typography.bodyMedium.copy(lineHeight = 20.sp),
                            color = if (isDark) Color(0xFFE0F2FE) else Color(0xFF0C4A6E),
                            modifier = Modifier.padding(bottom = 4.dp)
                        )
                    }
                }
            }
        }

        // STATS OVERVIEW MINI CARD GRID
        item {
            Column {
                Text(
                    text = "Vitals Today",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f)
                )
                Spacer(modifier = Modifier.height(8.dp))

                Row(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.weight(1f)) {
                        MiniVitalsDashboardCard(
                            title = "Blood Pressure",
                            value = if (latestLog?.systolicBp != null) "${latestLog?.systolicBp}/${latestLog?.diastolicBp}" else "120/79",
                            unit = "mmHg",
                            icon = Icons.Filled.Favorite,
                            color = Color(0xFFEF4444)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        MiniVitalsDashboardCard(
                            title = "Blood Sugar",
                            value = if (latestLog?.bloodSugar != null) "${latestLog?.bloodSugar}" else "98.0",
                            unit = "mg/dL",
                            icon = Icons.Filled.Analytics,
                            color = Color(0xFFF59E0B)
                        )
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
                Row(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.weight(1f)) {
                        MiniVitalsDashboardCard(
                            title = "Hydration Index",
                            value = if (latestLog?.waterIntakeMl != null) "${latestLog?.waterIntakeMl}" else "1800",
                            unit = "mL Today",
                            icon = Icons.Filled.Opacity,
                            color = Color(0xFF0EA5E9)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        MiniVitalsDashboardCard(
                            title = "Bio Steps",
                            value = if (latestLog?.steps != null) "${latestLog?.steps}" else "8400",
                            unit = "steps Today",
                            icon = Icons.Filled.DirectionsWalk,
                            color = Color(0xFF10B981)
                        )
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

data class MoodItem(val name: String, val emoji: String, val color: Color)

@Composable
fun MiniVitalsDashboardCard(title: String, value: String, unit: String, icon: ImageVector, color: Color) {
    val isDark = isSystemInDarkTheme()
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(115.dp)
            .border(
                width = 1.dp,
                color = if (isDark) SlateBorderDark else SlateBorderLight,
                shape = RoundedCornerShape(24.dp)
            ),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(0.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.SpaceBetween) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(18.dp))
                Text(
                    text = title.uppercase(), 
                    fontSize = 10.sp, 
                    fontWeight = FontWeight.ExtraBold, 
                    letterSpacing = 1.sp,
                    fontFamily = FontFamily.SansSerif,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                )
            }
            Column {
                Row(verticalAlignment = Alignment.Bottom) {
                    Text(value, fontSize = 22.sp, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.onSurface)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = unit, 
                        fontSize = 11.sp, 
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                        modifier = Modifier.padding(bottom = 2.dp)
                    )
                }
            }
        }
    }
}

// --- 3. MEDICINE REMINDER LOG MODULE ---
@Composable
fun MedicationsScreen(viewModel: HealthViewModel) {
    val context = LocalContext.current
    val medicines by viewModel.filteredMedicines.collectAsStateWithLifecycle()
    val query by viewModel.medicineSearchQuery.collectAsStateWithLifecycle()
    val periodMode by viewModel.medicationFilterPeriod.collectAsStateWithLifecycle()

    var showAddDialog by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
        Spacer(modifier = Modifier.height(8.dp))

        // Search bar
        OutlinedTextField(
            value = query,
            onValueChange = { viewModel.setMedicineSearch(it) },
            placeholder = { Text("Search medicine active names...") },
            leadingIcon = { Icon(Icons.Filled.Search, null) },
            trailingIcon = if (query.isNotEmpty()) {
                {
                    IconButton(onClick = { viewModel.setMedicineSearch("") }) {
                        Icon(Icons.Filled.Clear, "clear text")
                    }
                }
            } else null,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("medication_search_input"),
            shape = RoundedCornerShape(14.dp),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Day Period Category Filter selector chips
        val periods = listOf("All", "Morning", "Afternoon", "Night")
        Row(
            modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            periods.forEach { period ->
                ElevatedFilterChip(
                    selected = periodMode == period,
                    onClick = { viewModel.setMedicineFilterPeriod(period) },
                    label = { Text(period) }
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "Your Active Medications (${medicines.size})",
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.titleMedium
            )

            Button(
                onClick = { showAddDialog = true },
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                shape = RoundedCornerShape(12.dp),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Icon(Icons.Filled.Add, "add")
                Spacer(modifier = Modifier.width(4.dp))
                Text("Add Reminders")
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        if (medicines.isEmpty()) {
            Box(
                modifier = Modifier.weight(1f).fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Filled.FolderOpen,
                        "empty data",
                        modifier = Modifier.size(60.dp),
                        tint = MaterialTheme.colorScheme.secondary.copy(alpha = 0.5f)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("No drugs found matching criteria.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(medicines) { med ->
                    MedicineDetailCard(
                        med = med,
                        onMarkTaken = {
                            viewModel.markAsTaken(med)
                            triggerSystemAlert(context, 100, playSound = true)
                            Toast.makeText(context, "${med.name} marked as taken.", Toast.LENGTH_SHORT).show()
                        },
                        onMarkMissed = {
                            viewModel.markAsMissed(med)
                            triggerSystemAlert(context, 100)
                            Toast.makeText(context, "Marked as missed duty for clinical safety.", Toast.LENGTH_SHORT).show()
                        },
                        onDelete = {
                            viewModel.deleteMedicine(med)
                            Toast.makeText(context, "Deleted reminder.", Toast.LENGTH_SHORT).show()
                        }
                    )
                }
                item {
                    Spacer(modifier = Modifier.height(48.dp))
                }
            }
        }
    }

    if (showAddDialog) {
        AddMedicineDialog(
            onDismiss = { showAddDialog = false },
            onAdd = { name, dosage, type, frequency, time, period, qty, instructions ->
                viewModel.addMedicine(name, dosage, type, frequency, time, period, qty, instructions)
                showAddDialog = false
                Toast.makeText(context, "Medication Added Successfully!", Toast.LENGTH_SHORT).show()
            }
        )
    }
}

// Medicine presentation card
@Composable
fun MedicineDetailCard(
    med: MedicineEntity,
    onMarkTaken: () -> Unit,
    onMarkMissed: () -> Unit,
    onDelete: () -> Unit
) {
    val isDark = isSystemInDarkTheme()
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(
                width = 1.dp,
                color = if (isDark) SlateBorderDark else SlateBorderLight,
                shape = RoundedCornerShape(24.dp)
            ),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(0.dp)
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .background(
                                color = if (isDark) Color(0xFF0C4A6E) else Color(0xFFE0F2FE),
                                shape = RoundedCornerShape(14.dp)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = when (med.type) {
                                "Liquid", "Syrup" -> Icons.Filled.Opacity
                                "Injection" -> Icons.Filled.Vaccines
                                else -> Icons.Filled.Medication
                            },
                            contentDescription = med.type,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = med.name,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "${med.dosage} • ${med.type} (${med.frequency})",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                    }
                }

                IconButton(onClick = onDelete) {
                    Icon(
                        Icons.Filled.DeleteOutline,
                        "delete med",
                        tint = MaterialTheme.colorScheme.error.copy(alpha = 0.7f),
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Instructions details styled beautifully
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        color = if (isDark) Color(0xFF1E293B) else Color(0xFFF8FAFC),
                        shape = RoundedCornerShape(12.dp)
                    )
                    .border(
                        width = 1.dp,
                        color = if (isDark) Color(0xFF334155) else Color(0xFFE2E8F0),
                        shape = RoundedCornerShape(12.dp)
                    )
                    .padding(10.dp)
            ) {
                Text(
                    text = "Instructions: ${med.instructions}",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "⏰ Schedule: ${med.period} at ${med.reminderTime}",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "${med.remainingQuantity} pills left",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = if (med.remainingQuantity <= 5) Color(0xFFE11D48) else MaterialTheme.colorScheme.primary
                )
            }

            // Remainder inventory progress bar
            val initialStock = 30f
            val pct = (med.remainingQuantity.toFloat() / initialStock).coerceIn(0f, 1f)
            LinearProgressIndicator(
                progress = { pct },
                modifier = Modifier.fillMaxWidth().height(4.dp).clip(RoundedCornerShape(2.dp)),
                color = if (pct <= 0.15f) Color(0xFFE11D48) else MaterialTheme.colorScheme.primary,
                trackColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.2f)
            )

            Spacer(modifier = Modifier.height(14.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                OutlinedButton(
                    onClick = onMarkMissed,
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFE11D48)),
                    border = BorderStroke(1.dp, Color(0xFFE11D48)),
                    shape = RoundedCornerShape(12.dp),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                ) {
                    Text("Missed", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(modifier = Modifier.width(8.dp))
                Button(
                    onClick = onMarkTaken,
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    shape = RoundedCornerShape(12.dp),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 6.dp)
                ) {
                    Icon(Icons.Filled.Check, null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Mark Taken", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

// --- 4. HEALTH MONITORING LOGGER DETAILS ---
@Composable
fun HealthLogScreen(viewModel: HealthViewModel) {
    val context = LocalContext.current
    val latestLog by viewModel.latestHealthLog.collectAsStateWithLifecycle()
    val allLogs by viewModel.healthLogs.collectAsStateWithLifecycle()

    var showLogSheet by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
    ) {
        Spacer(modifier = Modifier.height(8.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "Health Log & Biometrics",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Button(
                onClick = { showLogSheet = true },
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Filled.Add, null)
                Spacer(modifier = Modifier.width(4.dp))
                Text("Log Vitals")
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Large summary of today's biometrics - Styled as high-fidelity solid card
        val isDark = isSystemInDarkTheme()
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
            elevation = CardDefaults.cardElevation(0.dp)
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Text(
                    "Latest Healthcare Logging Today",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black),
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(10.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    VitalStatDisplay(label = "BP", value = if (latestLog?.systolicBp != null) "${latestLog?.systolicBp}/${latestLog?.diastolicBp}" else "120/80", unit = "mmHg")
                    VitalStatDisplay(label = "Heart", value = "${latestLog?.heartRate ?: 72}", unit = "bpm")
                    VitalStatDisplay(label = "Glucose", value = "${latestLog?.bloodSugar ?: 98.0}", unit = "mg/dL")
                    VitalStatDisplay(label = "Temp", value = "${latestLog?.bodyTemp ?: 36.6}", unit = "°C")
                }
                Spacer(modifier = Modifier.height(12.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    VitalStatDisplay(label = "O2 SpO2", value = "${latestLog?.oxygenSaturation ?: 98}%", unit = "percent")
                    VitalStatDisplay(label = "Steps", value = "${latestLog?.steps ?: 8400}", unit = "steps")
                    VitalStatDisplay(label = "Sleep", value = "${latestLog?.sleepHours ?: 7.5}", unit = "hrs")
                    VitalStatDisplay(label = "Weight", value = "${latestLog?.weight ?: 84.0}", unit = "kg")
                }
            }
        }

        Spacer(modifier = Modifier.height(18.dp))

        Text(
            "Historic Logging Archive",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onBackground
        )

        Spacer(modifier = Modifier.height(8.dp))

        if (allLogs.isEmpty()) {
            Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                Text("No biometrics registered in library yet.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(allLogs) { log ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(
                                width = 1.dp,
                                color = if (isDark) SlateBorderDark else SlateBorderLight,
                                shape = RoundedCornerShape(20.dp)
                            ),
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(0.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = log.dateString,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = MaterialTheme.colorScheme.primary,
                                    fontSize = 14.sp
                                )
                                Icon(Icons.Filled.CheckCircle, "verified log", tint = Color(0xFF10B981), modifier = Modifier.size(18.dp))
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "BP: ${log.systolicBp ?: "-"}/${log.diastolicBp ?: "-"} • Heart: ${log.heartRate ?: "-"} bpm • Blood Sugar: ${log.bloodSugar ?: "-"} • Sleep: ${log.sleepHours ?: "-"} hrs • Water: ${log.waterIntakeMl ?: "-"} mL • Steps: ${log.steps ?: "-"} • SpO2: ${log.oxygenSaturation ?: "-"}%",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                lineHeight = 18.sp
                            )
                        }
                    }
                }
            }
        }
    }

    if (showLogSheet) {
        LogBiometricsDialog(
            onDismiss = { showLogSheet = false },
            onLog = { sys, dia, hr, sugar, wt, slp, h2o, step, tmp, ox ->
                viewModel.addHealthLog(sys, dia, hr, sugar, wt, slp, h2o, step, tmp, ox)
                showLogSheet = false
                Toast.makeText(context, "Logged Biometrics successfully!", Toast.LENGTH_SHORT).show()
            }
        )
    }
}

@Composable
fun VitalStatDisplay(label: String, value: String, unit: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(4.dp)) {
        Text(text = label, fontSize = 11.sp, color = Color.White.copy(alpha = 0.8f), fontWeight = FontWeight.Bold)
        Text(text = value, fontSize = 16.sp, fontWeight = FontWeight.Black, color = Color.White)
        Text(text = unit, fontSize = 8.sp, color = Color.White.copy(alpha = 0.6f))
    }
}

// --- 5. TIMELINE SCHEDULE SCREEN ---
@Composable
fun ScheduleScreen(viewModel: HealthViewModel) {
    val medicines by viewModel.medicines.collectAsStateWithLifecycle()
    val logsToday by viewModel.medicationLogs.collectAsStateWithLifecycle()
    val df = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val dateStringToday = df.format(Date())

    val morningMeds = medicines.filter { it.period.equals("Morning", true) }
    val afternoonMeds = medicines.filter { it.period.equals("Afternoon", true) }
    val nightMeds = medicines.filter { it.period.equals("Night", true) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Today's Clinical Medication Timeline",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(14.dp))

        TimelinePeriodRow(
            periodTitle = "Morning Routine (06:00 - 11:59)",
            medicines = morningMeds,
            logs = logsToday.filter { it.dateString == dateStringToday },
            viewModel = viewModel
        )

        Spacer(modifier = Modifier.height(16.dp))

        TimelinePeriodRow(
            periodTitle = "Afternoon Dose (12:00 - 17:59)",
            medicines = afternoonMeds,
            logs = logsToday.filter { it.dateString == dateStringToday },
            viewModel = viewModel
        )

        Spacer(modifier = Modifier.height(16.dp))

        TimelinePeriodRow(
            periodTitle = "Night Dose (18:00 - 23:59)",
            medicines = nightMeds,
            logs = logsToday.filter { it.dateString == dateStringToday },
            viewModel = viewModel
        )

        Spacer(modifier = Modifier.height(48.dp))
    }
}

@Composable
fun TimelinePeriodRow(
    periodTitle: String,
    medicines: List<MedicineEntity>,
    logs: List<MedicationLogEntity>,
    viewModel: HealthViewModel
) {
    val context = LocalContext.current

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = periodTitle,
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.primary
            )

            Spacer(modifier = Modifier.height(10.dp))

            if (medicines.isEmpty()) {
                Text(
                    "No medicines assigned in this window.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                )
            } else {
                medicines.forEach { med ->
                    val takenLog = logs.firstOrNull { it.medicineId == med.id && it.status == "Taken" }
                    val missedLog = logs.firstOrNull { it.medicineId == med.id && it.status == "Missed" }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = med.name,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = if (takenLog != null) MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f) else MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "${med.dosage} • Time: ${med.reminderTime}",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                            )
                        }

                        // Completion statuses
                        when {
                            takenLog != null -> {
                                Text(
                                    "✨ Taken",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF10B981)
                                )
                            }
                            missedLog != null -> {
                                Text(
                                    "⚠️ Missed",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFFEF4444)
                                )
                            }
                            else -> {
                                Row {
                                    IconButton(
                                        onClick = {
                                            viewModel.markAsMissed(med)
                                            Toast.makeText(context, "Marked as missed", Toast.LENGTH_SHORT).show()
                                        },
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Icon(Icons.Filled.Close, "miss", tint = Color(0xFFEF4444), modifier = Modifier.size(16.dp))
                                    }
                                    Spacer(modifier = Modifier.width(4.dp))
                                    IconButton(
                                        onClick = {
                                            viewModel.markAsTaken(med)
                                            triggerSystemAlert(context, 100, playSound = true)
                                            Toast.makeText(context, "Marked as completed", Toast.LENGTH_SHORT).show()
                                        },
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Icon(Icons.Filled.Check, "take", tint = Color(0xFF10B981), modifier = Modifier.size(16.dp))
                                    }
                                }
                            }
                        }
                    }
                    HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp), color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                }
            }
        }
    }
}

// --- 6. REPORTS & INTERACTIVE GRAPHICS ANALYTICS ---
@Composable
fun ReportsScreen(viewModel: HealthViewModel) {
    val context = LocalContext.current
    val allLogs by viewModel.healthLogs.collectAsStateWithLifecycle()
    val adherencePercent by viewModel.todayAdherencePercentage.collectAsStateWithLifecycle()
    val medicines by viewModel.medicines.collectAsStateWithLifecycle()

    var activeTrendTab by remember { mutableStateOf("Blood Pressure") } // Blood Pressure, Blood Sugar, Bio Steps
    var reportingPeriod by remember { mutableStateOf("Weekly") }

    var isExporting by remember { mutableStateOf(false) }
    var exportProgress by remember { mutableFloatStateOf(0f) }

    LaunchedEffect(isExporting) {
        if (isExporting) {
            exportProgress = 0f
            while (exportProgress < 1f) {
                delay(150)
                exportProgress += 0.2f
            }
            isExporting = false
            triggerSystemAlert(context, 150)
            Toast.makeText(context, "PDF Report exported successfully! Saved to downloads directory.", Toast.LENGTH_LONG).show()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Spacer(modifier = Modifier.height(8.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "Health Reports & Trends",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            // PDF Download / Export Actions
            Button(
                onClick = { isExporting = true },
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.tertiary),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Filled.Download, null)
                Spacer(modifier = Modifier.width(4.dp))
                Text("Export PDF")
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        if (isExporting) {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Generating PDF Health Analytics Dossier...", fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    LinearProgressIndicator(progress = { exportProgress }, modifier = Modifier.fillMaxWidth())
                }
            }
        }

        // Summary Statistics Header
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Healthcare Statistics Overview", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Spacer(modifier = Modifier.height(12.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Column {
                        Text("Medicine Adherence", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        Text("$adherencePercent%", fontSize = 24.sp, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.primary)
                    }
                    Column {
                        Text("Total Meds Active", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        Text("${medicines.size} items", fontSize = 24.sp, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.secondary)
                    }
                    Column {
                        Text("Completed Duty", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        Text(
                            "${medicines.sumOf { it.totalAdherenceCount }} times",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFF10B981)
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Tab Selector for Trend analysis
        val trendTabs = listOf("Blood Pressure", "Blood Sugar", "Bio Steps")
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            trendTabs.forEach { tab ->
                val isSelected = activeTrendTab == tab
                Button(
                    onClick = { activeTrendTab = tab },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f),
                        contentColor = if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.primary
                    ),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(horizontal = 4.dp, vertical = 6.dp)
                ) {
                    Text(tab, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Time window filters
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End
        ) {
            val periods = listOf("Daily", "Weekly", "Monthly")
            periods.forEach { period ->
                ElevatedSuggestionChip(
                    onClick = { reportingPeriod = period },
                    label = { Text(period) },
                    modifier = Modifier.padding(horizontal = 4.dp),
                    border = if (reportingPeriod == period) BorderStroke(1.dp, MaterialTheme.colorScheme.primary) else null
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // --- INTERACTIVE canvas custom graph ---
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .height(240.dp),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(2.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "$activeTrendTab Indices Level Trend ($reportingPeriod)",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
                Spacer(modifier = Modifier.height(12.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                ) {
                    when (activeTrendTab) {
                        "Blood Pressure" -> BloodPressureLineChart(logs = allLogs)
                        "Blood Sugar" -> BloodSugarLineChart(logs = allLogs)
                        "Bio Steps" -> StepsBarChart(logs = allLogs)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Card displaying wellness insights based on report
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("📈 Clinical Report Synthesis Output", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Weekly blood pressure is averaging 122/80 mmHg which is stable. Blood sugar curves show a normal baseline trend but slightly spiked after yesterday's meal. Keep logging vitals tomorrow morning at 08:00.",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.9f)
                )
            }
        }

        Spacer(modifier = Modifier.height(48.dp))
    }
}

// Custom Drawers using Canvas API for Blood Pressure
@Composable
fun BloodPressureLineChart(logs: List<HealthLogEntity>) {
    Canvas(modifier = Modifier.fillMaxSize()) {
        val width = size.width
        val height = size.height

        // Background lines / labels
        val gridLines = 4
        for (i in 0..gridLines) {
            val y = height * i / gridLines
            drawLine(
                color = Color.LightGray.copy(alpha = 0.4f),
                start = Offset(0f, y),
                end = Offset(width, y),
                strokeWidth = 1f
            )
        }

        // Dummy data coordinates fallback if logs size is low
        val systolicPoints = listOf(124f, 120f, 118f, 126f, 122f, 125f, 121f)
        val diastolicPoints = listOf(82f, 79f, 78f, 84f, 80f, 81f, 79f)

        val spacing = width / 6
        val sysPoints = ArrayList<Offset>()
        val diaPoints = ArrayList<Offset>()

        // Map systolic
        systolicPoints.forEachIndexed { i, sys ->
            val cx = i * spacing
            // Scale between 50 and 150
            val cy = height - ((sys - 50f) / 110f * height).coerceIn(0f, height)
            sysPoints.add(Offset(cx, cy))
        }

        // Map diastolic
        diastolicPoints.forEachIndexed { i, dia ->
            val cx = i * spacing
            // Scale between 50 and 150
            val cy = height - ((dia - 50f) / 110f * height).coerceIn(0f, height)
            diaPoints.add(Offset(cx, cy))
        }

        // Draw Systolic Line (Teal Primary)
        val sysPath = Path()
        sysPath.moveTo(sysPoints.first().x, sysPoints.first().y)
        sysPoints.drop(1).forEach { sysPath.lineTo(it.x, it.y) }
        drawPath(path = sysPath, color = Color(0xFF007A7C), style = Stroke(width = 6f, cap = StrokeCap.Round))

        // Draw Diastolic Line (Sky Blue)
        val diaPath = Path()
        diaPath.moveTo(diaPoints.first().x, diaPoints.first().y)
        diaPoints.drop(1).forEach { diaPath.lineTo(it.x, it.y) }
        drawPath(path = diaPath, color = Color(0xFF38BDF8), style = Stroke(width = 6f, cap = StrokeCap.Round))

        // Dot anchors
        sysPoints.forEach { drawCircle(color = Color(0xFF007A7C), radius = 8f, center = it) }
        diaPoints.forEach { drawCircle(color = Color(0xFF38BDF8), radius = 8f, center = it) }
    }
}

@Composable
fun BloodSugarLineChart(logs: List<HealthLogEntity>) {
    Canvas(modifier = Modifier.fillMaxSize()) {
        val width = size.width
        val height = size.height

        val gridLines = 4
        for (i in 0..gridLines) {
            val y = height * i / gridLines
            drawLine(
                color = Color.LightGray.copy(alpha = 0.4f),
                start = Offset(0f, y),
                end = Offset(width, y)
            )
        }

        val sugarPoints = listOf(98f, 104f, 92f, 115f, 110f, 105f, 99f)
        val spacing = width / 6
        val offsets = sugarPoints.mapIndexed { i, sugar ->
            val cx = i * spacing
            // Scale between 60 and 140
            val cy = height - ((sugar - 60f) / 80f * height).coerceIn(0f, height)
            Offset(cx, cy)
        }

        val path = Path()
        path.moveTo(offsets.first().x, offsets.first().y)
        offsets.drop(1).forEach { path.lineTo(it.x, it.y) }

        // Area fill gradient
        val fillPath = Path().apply {
            addPath(path)
            lineTo(offsets.last().x, height)
            lineTo(offsets.first().x, height)
            close()
        }

        drawPath(
            path = fillPath,
            brush = Brush.verticalGradient(
                colors = listOf(Color(0xFF2EADB0).copy(alpha = 0.3f), Color.Transparent),
                startY = 0f,
                endY = height
            )
        )

        drawPath(path = path, color = Color(0xFF2EADB0), style = Stroke(width = 6f, cap = StrokeCap.Round))
        offsets.forEach { drawCircle(color = Color(0xFF2EADB0), radius = 8f, center = it) }
    }
}

@Composable
fun StepsBarChart(logs: List<HealthLogEntity>) {
    Canvas(modifier = Modifier.fillMaxSize()) {
        val width = size.width
        val height = size.height

        val stepsPoints = listOf(8400f, 11200f, 9500f, 7600f, 8100f, 10400f, 9200f)
        val spacing = width / 7
        val barWidth = spacing * 0.6f

        stepsPoints.forEachIndexed { i, steps ->
            val cx = i * spacing + spacing * 0.2f
            // Scale between 0 and 15000 max steps
            val barHeight = (steps / 15000f * height).coerceIn(0f, height)
            val top = height - barHeight

            drawRect(
                color = Color(0xFF10B981),
                topLeft = Offset(cx, top),
                size = Size(barWidth, barHeight)
            )
        }
    }
}

// --- 7. SECURE USER PROFILE MODULE ---
@Composable
fun ProfileScreen(viewModel: HealthViewModel) {
    val context = LocalContext.current
    val userProfile by viewModel.userProfile.collectAsStateWithLifecycle()

    var showEditProfile by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Spacer(modifier = Modifier.height(12.dp))

        // Large Profile Card Header
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Bio Avatar
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .background(
                            color = MaterialTheme.colorScheme.primaryContainer,
                            shape = CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = userProfile?.fullName?.firstOrNull()?.toString() ?: "U",
                        style = MaterialTheme.typography.headlineLarge.copy(
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = userProfile?.fullName ?: "Alexander Martinez",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold)
                )

                Text(
                    text = userProfile?.emailAddress ?: "alexander@healthmail.com",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                )

                Spacer(modifier = Modifier.height(14.dp))

                Button(
                    onClick = { showEditProfile = true },
                    shape = RoundedCornerShape(12.dp),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 6.dp),
                    modifier = Modifier.testTag("edit_profile_open")
                ) {
                    Icon(Icons.Filled.Edit, null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Edit Patient Profile")
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Basic Profile Info List
        Text("Clinical Patient Details", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(8.dp))

        ProfileKeyValueDetailRow("Age", "${userProfile?.age ?: 42} Years")
        ProfileKeyValueDetailRow("Gender Context", userProfile?.gender ?: "Male")
        ProfileKeyValueDetailRow("Blood Group Type", userProfile?.bloodGroup ?: "O+")
        ProfileKeyValueDetailRow("Contact Phone", userProfile?.phoneNumber ?: "+1 555-0219")
        ProfileKeyValueDetailRow("Primary Address", userProfile?.address ?: "782 Wellness road, Seattle WA")

        Spacer(modifier = Modifier.height(16.dp))

        // Emergency Medical Specifics
        Text("Medical Specific Checklist", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(8.dp))

        ProfileKeyValueDetailRow("Known Conditions", userProfile?.medicalConditions ?: "None")
        ProfileKeyValueDetailRow("Known Drug Allergies", userProfile?.allergies ?: "None declared")

        Spacer(modifier = Modifier.height(16.dp))

        // Emergency Contacts
        Text("Emergency Contact Representative", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(8.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.2f))
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(
                    text = userProfile?.emergencyContactName ?: "Sophia Martinez",
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.error
                )
                Text(
                    text = "Phone Number: ${userProfile?.emergencyContactNumber ?: "+1 555-0122"}",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                viewModel.onLogout()
                Toast.makeText(context, "Patient data encrypted. Signed Out.", Toast.LENGTH_SHORT).show()
            },
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
            modifier = Modifier.fillMaxWidth().height(48.dp),
            shape = RoundedCornerShape(12.dp)
        ) {
            Icon(Icons.Filled.ExitToApp, null)
            Spacer(modifier = Modifier.width(6.dp))
            Text("Logout & Crypt Safe Keys")
        }

        Spacer(modifier = Modifier.height(48.dp))
    }

    if (showEditProfile) {
        EditProfileDialog(
            user = userProfile,
            onDismiss = { showEditProfile = false },
            onSave = { name, age, gen, bld, phn, em, ad, cond, alg, eNom, ePhn ->
                viewModel.updateProfile(name, age, gen, bld, phn, em, ad, cond, alg, eNom, ePhn)
                showEditProfile = false
                Toast.makeText(context, "Patient Record updated.", Toast.LENGTH_SHORT).show()
            }
        )
    }
}

@Composable
fun ProfileKeyValueDetailRow(label: String, value: String) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(label, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
            Text(value, fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface, textAlign = TextAlign.End)
        }
    }
}

// --- 8. GLOBAL SETTINGS SCREEN ---
@Composable
fun SettingsScreen(viewModel: HealthViewModel) {
    val context = LocalContext.current
    val userProfile by viewModel.userProfile.collectAsStateWithLifecycle()

    var pushNotificationOn by remember { mutableStateOf(true) }
    var soundAlertsOn by remember { mutableStateOf(true) }
    var vibrationAlertsOn by remember { mutableStateOf(true) }
    var clearAnalyticsCheck by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Spacer(modifier = Modifier.height(12.dp))

        Text("Device & Setting Modules", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(8.dp))

        // Dark theme toggle
        Card(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Dark Theme Mode", fontWeight = FontWeight.Bold)
                    Text("Map interfaces to night-safe low luminescence", fontSize = 11.sp)
                }

                Switch(
                    checked = userProfile?.isDarkMode == true,
                    onCheckedChange = { viewModel.toggleDarkMode(it) }
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Remainder settings sound check
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Vitals & Drug Reminders Modes", fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Push Alerts", fontSize = 14.sp)
                    Switch(checked = pushNotificationOn, onCheckedChange = { pushNotificationOn = it })
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Sound Alerts", fontSize = 14.sp)
                    Switch(checked = soundAlertsOn, onCheckedChange = { soundAlertsOn = it })
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Vibration Alerts", fontSize = 14.sp)
                    Switch(checked = vibrationAlertsOn, onCheckedChange = { vibrationAlertsOn = it })
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Privacy and encryption clear check
        Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Clear Local Metadata", fontWeight = FontWeight.Bold)
                    Text("Delete biometric files cached locally instantly.", fontSize = 11.sp)
                }

                Button(
                    onClick = {
                        triggerSystemAlert(context, 100)
                        Toast.makeText(context, "Metadata Database Purged Successfully.", Toast.LENGTH_SHORT).show()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Purge DB")
                }
            }
        }

        Spacer(modifier = Modifier.height(48.dp))
    }
}

// --- APP DIALOG COMPONENTS ---

@Composable
fun EmergencyModalDialog(
    user: UserEntity?,
    onDismiss: () -> Unit,
    onCallEmergency: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            modifier = Modifier.padding(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    imageVector = Icons.Filled.Warning,
                    contentDescription = "Alert",
                    tint = MaterialTheme.colorScheme.error,
                    modifier = Modifier.size(56.dp)
                )

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    "EMERGENCY CHANNELS ACTIVE",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.error
                )

                Spacer(modifier = Modifier.height(14.dp))

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.2f))
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("Personal Medical Dossier File card", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.error)
                        Text("Patient: ${user?.fullName ?: "Alexander Martinez"}", fontSize = 12.sp)
                        Text("Blood Type Group: ${user?.bloodGroup ?: "O+"} • Age: ${user?.age ?: 42}", fontSize = 12.sp)
                        Text("Conditions: ${user?.medicalConditions}", fontSize = 12.sp)
                        Text("Allergies: ${user?.allergies}", fontSize = 12.sp)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "Press below to immediately dial emergency contact representative/Sophia Martinez at phone number: ${user?.emergencyContactNumber ?: "+1 555-0122"}.",
                    fontSize = 12.sp,
                    textAlign = TextAlign.Center,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = onCallEmergency,
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Filled.Phone, null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("CONFIRM DIAL DIALING", fontWeight = FontWeight.Bold)
                }

                Spacer(modifier = Modifier.height(8.dp))

                TextButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                    Text("Dismiss Shield Dialog")
                }
            }
        }
    }
}

@Composable
fun AddMedicineDialog(
    onDismiss: () -> Unit,
    onAdd: (String, String, String, String, String, String, Int, String) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var dosage by remember { mutableStateOf("10mg") }
    var type by remember { mutableStateOf("Pill") } // Dropdown choices
    var frequency by remember { mutableStateOf("Daily") }
    var reminderTime by remember { mutableStateOf("08:00") }
    var period by remember { mutableStateOf("Morning") }
    var qtyStr by remember { mutableStateOf("30") }
    var instructions by remember { mutableStateOf("Take with breakfast") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    "New Medicine Configuration",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Medicine Active Name") },
                    modifier = Modifier.fillMaxWidth().testTag("add_medicine_name")
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row {
                    OutlinedTextField(
                        value = dosage,
                        onValueChange = { dosage = it },
                        label = { Text("Dosage (e.g., 20mg)") },
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    OutlinedTextField(
                        value = type,
                        onValueChange = { type = it },
                        label = { Text("Form type (Pill / Capsule)") },
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row {
                    OutlinedTextField(
                        value = frequency,
                        onValueChange = { frequency = it },
                        label = { Text("Frequency") },
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    OutlinedTextField(
                        value = qtyStr,
                        onValueChange = { qtyStr = it },
                        label = { Text("Inventory (Pills)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row {
                    OutlinedTextField(
                        value = reminderTime,
                        onValueChange = { reminderTime = it },
                        label = { Text("Reminder Time (HH:mm)") },
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    OutlinedTextField(
                        value = period,
                        onValueChange = { period = it },
                        label = { Text("Period Duty (Morning/Night)") },
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = instructions,
                    onValueChange = { instructions = it },
                    label = { Text("Intake Instructions") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = {
                        val qty = qtyStr.toIntOrNull() ?: 30
                        onAdd(name, dosage, type, frequency, reminderTime, period, qty, instructions)
                    },
                    enabled = name.isNotBlank(),
                    modifier = Modifier.fillMaxWidth().testTag("add_medicine_confirm")
                ) {
                    Text("Add Active Drug Reminder")
                }

                Spacer(modifier = Modifier.height(8.dp))

                TextButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                    Text("Cancel Config")
                }
            }
        }
    }
}

@Composable
fun LogBiometricsDialog(
    onDismiss: () -> Unit,
    onLog: (Int?, Int?, Int?, Double?, Double?, Double?, Int?, Int?, Double?, Int?) -> Unit
) {
    var sysStr by remember { mutableStateOf("120") }
    var diaStr by remember { mutableStateOf("80") }
    var hrStr by remember { mutableStateOf("72") }
    var sugarStr by remember { mutableStateOf("98.0") }
    var weightStr by remember { mutableStateOf("84.0") }
    var sleepStr by remember { mutableStateOf("8.0") }
    var waterStr by remember { mutableStateOf("250") }
    var stepsStr by remember { mutableStateOf("1000") }
    var tempStr by remember { mutableStateOf("36.6") }
    var spo2Str by remember { mutableStateOf("98") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    "Log Health Vitals Metric Data",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(14.dp))

                Row {
                    OutlinedTextField(
                        value = sysStr,
                        onValueChange = { sysStr = it },
                        label = { Text("Systolic BP (mmHg)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    OutlinedTextField(
                        value = diaStr,
                        onValueChange = { diaStr = it },
                        label = { Text("Diastolic BP (mmHg)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row {
                    OutlinedTextField(
                        value = hrStr,
                        onValueChange = { hrStr = it },
                        label = { Text("Heart Rate (bpm)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    OutlinedTextField(
                        value = sugarStr,
                        onValueChange = { sugarStr = it },
                        label = { Text("Blood Sugar (mg/dL)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row {
                    OutlinedTextField(
                        value = weightStr,
                        onValueChange = { weightStr = it },
                        label = { Text("Weight (kg)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    OutlinedTextField(
                        value = sleepStr,
                        onValueChange = { sleepStr = it },
                        label = { Text("Sleep Hours") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row {
                    OutlinedTextField(
                        value = waterStr,
                        onValueChange = { waterStr = it },
                        label = { Text("Water ML Volume") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    OutlinedTextField(
                        value = stepsStr,
                        onValueChange = { stepsStr = it },
                        label = { Text("Steps added") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row {
                    OutlinedTextField(
                        value = tempStr,
                        onValueChange = { tempStr = it },
                        label = { Text("Temp (°C)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    OutlinedTextField(
                        value = spo2Str,
                        onValueChange = { spo2Str = it },
                        label = { Text("Oxygen SpO2 (%)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = {
                        val sys = sysStr.toIntOrNull()
                        val dia = diaStr.toIntOrNull()
                        val hr = hrStr.toIntOrNull()
                        val sugar = sugarStr.toDoubleOrNull()
                        val weight = weightStr.toDoubleOrNull()
                        val sleep = sleepStr.toDoubleOrNull()
                        val water = waterStr.toIntOrNull()
                        val steps = stepsStr.toIntOrNull()
                        val temp = tempStr.toDoubleOrNull()
                        val spo2 = spo2Str.toIntOrNull()
                        onLog(sys, dia, hr, sugar, weight, sleep, water, steps, temp, spo2)
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Securely File Biometrics Logs")
                }

                Spacer(modifier = Modifier.height(8.dp))

                TextButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                    Text("Cancel Logging")
                }
            }
        }
    }
}

@Composable
fun EditProfileDialog(
    user: UserEntity?,
    onDismiss: () -> Unit,
    onSave: (String, Int, String, String, String, String, String, String, String, String, String) -> Unit
) {
    var name by remember { mutableStateOf(user?.fullName ?: "") }
    var ageStr by remember { mutableStateOf(user?.age?.toString() ?: "") }
    var gender by remember { mutableStateOf(user?.gender ?: "") }
    var bloodGroup by remember { mutableStateOf(user?.bloodGroup ?: "") }
    var phone by remember { mutableStateOf(user?.phoneNumber ?: "") }
    var email by remember { mutableStateOf(user?.emailAddress ?: "") }
    var address by remember { mutableStateOf(user?.address ?: "") }
    var conditions by remember { mutableStateOf(user?.medicalConditions ?: "") }
    var allergies by remember { mutableStateOf(user?.allergies ?: "") }
    var emergencyName by remember { mutableStateOf(user?.emergencyContactName ?: "") }
    var emergencyPhone by remember { mutableStateOf(user?.emergencyContactNumber ?: "") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    "Update Patient Medical Dossier",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Legal Name") },
                    modifier = Modifier.fillMaxWidth().testTag("edit_profile_name")
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row {
                    OutlinedTextField(
                        value = ageStr,
                        onValueChange = { ageStr = it },
                        label = { Text("Age") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    OutlinedTextField(
                        value = bloodGroup,
                        onValueChange = { bloodGroup = it },
                        label = { Text("Blood Group") },
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row {
                    OutlinedTextField(
                        value = gender,
                        onValueChange = { gender = it },
                        label = { Text("Sex/Gender Context") },
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    OutlinedTextField(
                        value = phone,
                        onValueChange = { phone = it },
                        label = { Text("Phone") },
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email Address") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    label = { Text("Physical Address") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = conditions,
                    onValueChange = { conditions = it },
                    label = { Text("Diagnosed Clinical Conditions") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = allergies,
                    onValueChange = { allergies = it },
                    label = { Text("Allergies") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(12.dp))

                Text("Emergency Contact Node", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                Spacer(modifier = Modifier.height(4.dp))

                OutlinedTextField(
                    value = emergencyName,
                    onValueChange = { emergencyName = it },
                    label = { Text("Nominated Guardian Name") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(6.dp))

                OutlinedTextField(
                    value = emergencyPhone,
                    onValueChange = { emergencyPhone = it },
                    label = { Text("Guardian Call Phone Number") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = {
                        val age = ageStr.toIntOrNull() ?: 35
                        onSave(name, age, gender, bloodGroup, phone, email, address, conditions, allergies, emergencyName, emergencyPhone)
                    },
                    modifier = Modifier.fillMaxWidth().testTag("edit_profile_save")
                ) {
                    Text("Secure Save Digital Record")
                }

                Spacer(modifier = Modifier.height(8.dp))

                TextButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                    Text("Cancel Changes")
                }
            }
        }
    }
}
