package com.example.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.database.*
import com.example.data.network.HealthAiAssistant
import com.example.data.repository.HealthRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class HealthViewModel(application: Application) : AndroidViewModel(application) {
    private val repository: HealthRepository

    // Current navigation state
    private val _currentTab = MutableStateFlow("Dashboard") // Dashboard, Medications, Health Log, Schedule, Reports, Profile, Settings
    val currentTab: StateFlow<String> = _currentTab.asStateFlow()

    // Auth states
    private val _authState = MutableStateFlow<AuthScreenState>(AuthScreenState.Authenticated)
    val authState: StateFlow<AuthScreenState> = _authState.asStateFlow()

    // AI suggestions states
    private val _aiSuggestion = MutableStateFlow("")
    val aiSuggestion: StateFlow<String> = _aiSuggestion.asStateFlow()

    private val _isAiLoading = MutableStateFlow(false)
    val isAiLoading: StateFlow<Boolean> = _isAiLoading.asStateFlow()

    // Search and filter queries for meds
    private val _medicineSearchQuery = MutableStateFlow("")
    val medicineSearchQuery: StateFlow<String> = _medicineSearchQuery.asStateFlow()

    private val _medicationFilterPeriod = MutableStateFlow("All") // All, Morning, Afternoon, Night
    val medicationFilterPeriod: StateFlow<String> = _medicationFilterPeriod.asStateFlow()

    init {
        val db = AppDatabase.getDatabase(application)
        repository = HealthRepository(db)

        viewModelScope.launch {
            // Seed sample clinical data on first boot to populate dashboard beautifully
            repository.seedMockDataIfNecessary()

            // Check if user profile is set and has active logged in status
            val profile = repository.getUserProfile()
            if (profile != null && profile.isLoggedIn) {
                _authState.value = AuthScreenState.Authenticated
            } else {
                _authState.value = AuthScreenState.Login
            }

            // Load initial AI suggestion
            refreshAiSuggestion()
        }
    }

    // Expose flows from Repository
    val userProfile: StateFlow<UserEntity?> = repository.getUserProfileFlow()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val medicines: StateFlow<List<MedicineEntity>> = repository.getAllMedicines()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val medicationLogs: StateFlow<List<MedicationLogEntity>> = repository.getAllLogs()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val healthLogs: StateFlow<List<HealthLogEntity>> = repository.getAllHealthLogs()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val latestHealthLog: StateFlow<HealthLogEntity?> = repository.getLatestHealthLogFlow()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val moodLogs: StateFlow<List<MoodEntity>> = repository.getAllMoodLogs()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val latestMood: StateFlow<MoodEntity?> = repository.getLatestMoodFlow()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    // Derived statistics calculations
    val todayDateString: String = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())

    val todayAdherencePercentage: StateFlow<Int> = medicationLogs.map { logs ->
        val logsToday = logs.filter { it.dateString == todayDateString }
        if (logsToday.isEmpty()) return@map 100 // Adherence starts perfect
        val taken = logsToday.count { it.status == "Taken" }
        (taken.toDouble() / logsToday.size * 100).toInt()
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 100)

    val healthScore: StateFlow<Int> = latestHealthLog.map { log ->
        if (log == null) return@map 85 // Neutral starting score

        var score = 100
        val sys = log.systolicBp
        val dia = log.diastolicBp
        val sugar = log.bloodSugar
        val spo2 = log.oxygenSaturation
        val sleep = log.sleepHours
        val water = log.waterIntakeMl
        val steps = log.steps

        if (sys != null && dia != null) {
            if (sys >= 140 || dia >= 90) score -= 15
            else if (sys >= 130 || dia >= 80) score -= 5
        }
        if (sugar != null && (sugar > 125.0 || sugar < 70.0)) score -= 10
        if (spo2 != null && spo2 < 95) score -= 15
        if (sleep != null && sleep < 7.0) score -= 10
        if (water != null && water < 1500) score -= 10
        if (steps != null && steps < 5000) score -= 10

        score.coerceIn(0, 100)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 85)

    // Filtered medicines
    val filteredMedicines: StateFlow<List<MedicineEntity>> = combine(
        medicines,
        _medicineSearchQuery,
        _medicationFilterPeriod
    ) { meds, query, period ->
        meds.filter { med ->
            val matchQuery = med.name.contains(query, ignoreCase = true) || med.instructions.contains(query, ignoreCase = true)
            val matchPeriod = period == "All" || med.period.equals(period, ignoreCase = true)
            matchQuery && matchPeriod
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // --- Authentication Actions ---
    fun onLogin(email: String, pword: String): Boolean {
        // Simple mock authentication success check for demonstration
        val profile = userProfile.value
        if (profile != null && email.equals(profile.emailAddress, true)) {
            viewModelScope.launch {
                repository.saveUserProfile(profile.copy(isLoggedIn = true))
                _authState.value = AuthScreenState.Authenticated
                refreshAiSuggestion()
            }
            return true
        } else if (email.isNotEmpty() && pword.length >= 4) {
            viewModelScope.launch {
                val newProfile = (profile ?: UserEntity()).copy(emailAddress = email, isLoggedIn = true)
                repository.saveUserProfile(newProfile)
                _authState.value = AuthScreenState.Authenticated
                refreshAiSuggestion()
            }
            return true
        }
        return false
    }

    fun onRegister(name: String, email: String, age: Int, gender: String, blood: String): Boolean {
        if (name.isBlank() || email.isBlank()) return false
        viewModelScope.launch {
            val user = UserEntity(
                fullName = name,
                age = age,
                gender = gender,
                bloodGroup = blood,
                emailAddress = email,
                isLoggedIn = true
            )
            repository.saveUserProfile(user)
            _authState.value = AuthScreenState.Authenticated
            refreshAiSuggestion()
        }
        return true
    }

    fun onLogout() {
        viewModelScope.launch {
            val profile = userProfile.value ?: UserEntity()
            repository.saveUserProfile(profile.copy(isLoggedIn = false))
            _authState.value = AuthScreenState.Login
            _currentTab.value = "Dashboard"
        }
    }

    fun navigateToAuth(state: AuthScreenState) {
        _authState.value = state
    }

    // --- Tab Navigation ---
    fun setTab(tab: String) {
        _currentTab.value = tab
    }

    // --- Medicine Actions ---
    fun addMedicine(name: String, dosage: String, type: String, frequency: String, reminderTime: String, period: String, qty: Int, instructions: String) {
        viewModelScope.launch {
            repository.addMedicine(
                MedicineEntity(
                    name = name,
                    dosage = dosage,
                    type = type,
                    frequency = frequency,
                    reminderTime = reminderTime,
                    period = period,
                    remainingQuantity = qty,
                    instructions = instructions
                )
            )
            refreshAiSuggestion()
        }
    }

    fun updateMedicine(med: MedicineEntity) {
        viewModelScope.launch {
            repository.updateMedicine(med)
            refreshAiSuggestion()
        }
    }

    fun deleteMedicine(med: MedicineEntity) {
        viewModelScope.launch {
            repository.deleteMedicine(med)
            refreshAiSuggestion()
        }
    }

    fun markAsTaken(med: MedicineEntity) {
        viewModelScope.launch {
            repository.takeMedicine(med, todayDateString)
            // Save log to trigger recomposition, triggers AI update
            refreshAiSuggestion()
        }
    }

    fun markAsMissed(med: MedicineEntity) {
        viewModelScope.launch {
            repository.missMedicine(med, todayDateString)
            refreshAiSuggestion()
        }
    }

    fun setMedicineSearch(query: String) {
        _medicineSearchQuery.value = query
    }

    fun setMedicineFilterPeriod(period: String) {
        _medicationFilterPeriod.value = period
    }

    // --- Health Log Actions ---
    fun addHealthLog(
        sys: Int? = null,
        dia: Int? = null,
        hr: Int? = null,
        sugar: Double? = null,
        weight: Double? = null,
        sleep: Double? = null,
        water: Int? = null,
        steps: Int? = null,
        temp: Double? = null,
        spo2: Int? = null
    ) {
        viewModelScope.launch {
            val log = HealthLogEntity(
                systolicBp = sys,
                diastolicBp = dia,
                heartRate = hr,
                bloodSugar = sugar,
                weight = weight,
                sleepHours = sleep,
                waterIntakeMl = water,
                steps = steps,
                bodyTemp = temp,
                oxygenSaturation = spo2,
                timestamp = System.currentTimeMillis(),
                dateString = todayDateString
            )
            repository.saveHealthLog(log)
            refreshAiSuggestion()
        }
    }

    fun addIncrementWater(ml: Int) {
        viewModelScope.launch {
            val log = HealthLogEntity(
                waterIntakeMl = ml,
                timestamp = System.currentTimeMillis(),
                dateString = todayDateString
            )
            repository.saveHealthLog(log)
        }
    }

    fun addSteps(amount: Int) {
        viewModelScope.launch {
            val log = HealthLogEntity(
                steps = amount,
                timestamp = System.currentTimeMillis(),
                dateString = todayDateString
            )
            repository.saveHealthLog(log)
        }
    }

    // --- Mood Log Actions ---
    fun addMoodLog(mood: String, notes: String) {
        viewModelScope.launch {
            val moodLog = MoodEntity(
                mood = mood,
                notes = notes,
                timestamp = System.currentTimeMillis(),
                dateString = todayDateString
            )
            repository.saveMoodLog(moodLog)
            refreshAiSuggestion()
        }
    }

    // --- Profile Management ---
    fun updateProfile(
        name: String,
        age: Int,
        gender: String,
        blood: String,
        phone: String,
        email: String,
        addr: String,
        conditions: String,
        allergies: String,
        emergencyName: String,
        emergencyPhone: String
    ) {
        viewModelScope.launch {
            val existing = userProfile.value ?: UserEntity()
            val updated = existing.copy(
                fullName = name,
                age = age,
                gender = gender,
                bloodGroup = blood,
                phoneNumber = phone,
                emailAddress = email,
                address = addr,
                medicalConditions = conditions,
                allergies = allergies,
                emergencyContactName = emergencyName,
                emergencyContactNumber = emergencyPhone
            )
            repository.saveUserProfile(updated)
            refreshAiSuggestion()
        }
    }

    // --- AI Refresh ---
    fun refreshAiSuggestion() {
        viewModelScope.launch {
            _isAiLoading.value = true
            val medicinesList = medicines.value
            val healthLog = latestHealthLog.value
            val profile = userProfile.value
            val moodVal = latestMood.value?.mood

            val suggestions = HealthAiAssistant.getHealthSuggestions(
                healthLog = healthLog,
                medicines = medicinesList,
                user = profile,
                latestMood = moodVal
            )
            _aiSuggestion.value = suggestions
            _isAiLoading.value = false
        }
    }

    fun toggleDarkMode(enabled: Boolean) {
        viewModelScope.launch {
            val profile = userProfile.value ?: UserEntity()
            repository.saveUserProfile(profile.copy(isDarkMode = enabled))
        }
    }
}

sealed interface AuthScreenState {
    object Login : AuthScreenState
    object Register : AuthScreenState
    object ForgotPassword : AuthScreenState
    object Authenticated : AuthScreenState
}
