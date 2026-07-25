package com.example.data.repository

import com.example.data.database.*
import kotlinx.coroutines.flow.Flow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class HealthRepository(private val db: AppDatabase) {
    private val userDao = db.userDao()
    private val medicineDao = db.medicineDao()
    private val medicationLogDao = db.medicationLogDao()
    private val healthLogDao = db.healthLogDao()
    private val moodDao = db.moodDao()

    // --- User Profile ---
    fun getUserProfileFlow(): Flow<UserEntity?> = userDao.getUserProfileFlow()
    suspend fun getUserProfile(): UserEntity? = userDao.getUserProfile()
    suspend fun saveUserProfile(profile: UserEntity) = userDao.insertOrUpdateUser(profile)

    // --- Medicines ---
    fun getAllMedicines(): Flow<List<MedicineEntity>> = medicineDao.getAllMedicinesFlow()
    suspend fun addMedicine(medicine: MedicineEntity): Long = medicineDao.insertMedicine(medicine)
    suspend fun updateMedicine(medicine: MedicineEntity) = medicineDao.updateMedicine(medicine)
    suspend fun deleteMedicine(medicine: MedicineEntity) = medicineDao.deleteMedicine(medicine)
    suspend fun getMedicineById(id: Int): MedicineEntity? = medicineDao.getMedicineById(id)

    // --- Medication Logs ---
    fun getAllLogs(): Flow<List<MedicationLogEntity>> = medicationLogDao.getAllLogsFlow()
    fun getLogsByDate(dateString: String): Flow<List<MedicationLogEntity>> = medicationLogDao.getLogsByDateFlow(dateString)

    suspend fun takeMedicine(medicine: MedicineEntity, dateString: String) {
        // Mark as taken in medication log
        val log = MedicationLogEntity(
            medicineId = medicine.id,
            medicineName = medicine.name,
            status = "Taken",
            timestamp = System.currentTimeMillis(),
            dateString = dateString
        )
        // Check if log already exists and delete to avoid duplicate take for same day
        medicationLogDao.deleteLogsForMedicineAndDate(medicine.id, dateString)
        medicationLogDao.insertLog(log)

        // Reduce remaining count and increment adherence
        val updatedMedicine = medicine.copy(
            remainingQuantity = (medicine.remainingQuantity - 1).coerceAtLeast(0),
            totalAdherenceCount = medicine.totalAdherenceCount + 1
        )
        medicineDao.updateMedicine(updatedMedicine)
    }

    suspend fun missMedicine(medicine: MedicineEntity, dateString: String) {
        // Mark as missed in medication log
        val log = MedicationLogEntity(
            medicineId = medicine.id,
            medicineName = medicine.name,
            status = "Missed",
            timestamp = System.currentTimeMillis(),
            dateString = dateString
        )
        // Check if log already exists and delete to avoid duplicate
        medicationLogDao.deleteLogsForMedicineAndDate(medicine.id, dateString)
        medicationLogDao.insertLog(log)

        // Increment missed count
        val updatedMedicine = medicine.copy(
            missedCount = medicine.missedCount + 1
        )
        medicineDao.updateMedicine(updatedMedicine)
    }

    suspend fun deleteMedicationLog(id: Int) = medicationLogDao.deleteLogById(id)

    // --- Health Logs ---
    fun getAllHealthLogs(): Flow<List<HealthLogEntity>> = healthLogDao.getAllHealthLogsFlow()
    fun getLatestHealthLogFlow(): Flow<HealthLogEntity?> = healthLogDao.getLatestHealthLogFlow()
    suspend fun getLatestHealthLog(): HealthLogEntity? = healthLogDao.getLatestHealthLog()

    suspend fun saveHealthLog(log: HealthLogEntity) {
        // Check if there is already a log for today and merge or insert
        val existingLog = healthLogDao.getHealthLogByDate(log.dateString)
        if (existingLog != null) {
            val mergedLog = existingLog.copy(
                systolicBp = log.systolicBp ?: existingLog.systolicBp,
                diastolicBp = log.diastolicBp ?: existingLog.diastolicBp,
                heartRate = log.heartRate ?: existingLog.heartRate,
                bloodSugar = log.bloodSugar ?: existingLog.bloodSugar,
                weight = log.weight ?: existingLog.weight,
                sleepHours = log.sleepHours ?: existingLog.sleepHours,
                waterIntakeMl = if (log.waterIntakeMl != null) (existingLog.waterIntakeMl ?: 0) + log.waterIntakeMl else existingLog.waterIntakeMl,
                steps = if (log.steps != null) (existingLog.steps ?: 0) + log.steps else existingLog.steps,
                bodyTemp = log.bodyTemp ?: existingLog.bodyTemp,
                oxygenSaturation = log.oxygenSaturation ?: existingLog.oxygenSaturation,
                timestamp = System.currentTimeMillis()
            )
            healthLogDao.insertHealthLog(mergedLog)
        } else {
            healthLogDao.insertHealthLog(log)
        }
    }

    suspend fun deleteHealthLog(id: Int) = healthLogDao.deleteHealthLogById(id)

    // --- Mood Logs ---
    fun getAllMoodLogs(): Flow<List<MoodEntity>> = moodDao.getAllMoodsFlow()
    fun getLatestMoodFlow(): Flow<MoodEntity?> = moodDao.getLatestMoodFlow()
    suspend fun saveMoodLog(moodLog: MoodEntity) = moodDao.insertMood(moodLog)
    suspend fun deleteMood(id: Int) = moodDao.deleteMoodById(id)

    // --- Seed Demo Data (Mock Setup for First Boot) ---
    suspend fun seedMockDataIfNecessary() {
        if (userDao.getUserProfile() == null) {
            // Seed Profile
            userDao.insertOrUpdateUser(
                UserEntity(
                    id = 1,
                    fullName = "Alexander Martinez",
                    age = 42,
                    gender = "Male",
                    bloodGroup = "A+",
                    phoneNumber = "+1 (555) 382-9901",
                    emailAddress = "alexander.m@healthmail.com",
                    address = "782 Wellness Blvd, Seattle WA 98101",
                    medicalConditions = "Mild Hypertension, High Cholesterol",
                    allergies = "Sulfonamides, Peanuts",
                    emergencyContactName = "Sophia Martinez (Spouse)",
                    emergencyContactNumber = "+1 (555) 382-9902",
                    isLoggedIn = true, // By default logged-in for simple demo, can log out
                    isDarkMode = false
                )
            )

            // Seed Medicines
            val lisinoprilId = medicineDao.insertMedicine(
                MedicineEntity(
                    name = "Lisinopril",
                    dosage = "10mg",
                    type = "Pill",
                    frequency = "Daily",
                    reminderTime = "08:00",
                    period = "Morning",
                    recurring = true,
                    remainingQuantity = 24,
                    totalAdherenceCount = 12,
                    missedCount = 1,
                    instructions = "Take in the morning on an empty stomach."
                )
            )

            val metforminId = medicineDao.insertMedicine(
                MedicineEntity(
                    name = "Metformin",
                    dosage = "500mg",
                    type = "Tablet",
                    frequency = "Daily",
                    reminderTime = "13:00",
                    period = "Afternoon",
                    recurring = true,
                    remainingQuantity = 45,
                    totalAdherenceCount = 15,
                    missedCount = 0,
                    instructions = "Take with lunch or immediately after."
                )
            )

            val atorvastatinId = medicineDao.insertMedicine(
                MedicineEntity(
                    name = "Atorvastatin",
                    dosage = "20mg",
                    type = "Tablet",
                    frequency = "Daily",
                    reminderTime = "21:00",
                    period = "Night",
                    recurring = true,
                    remainingQuantity = 18,
                    totalAdherenceCount = 10,
                    missedCount = 2,
                    instructions = "Take in the evening before sleeping."
                )
            )

            // Seed some past medication logs
            val df = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            val today = df.format(Date())
            val yesterday = df.format(Date(System.currentTimeMillis() - 86400000L))
            val dayBefore = df.format(Date(System.currentTimeMillis() - 172800000L))

            medicationLogDao.insertLog(MedicationLogEntity(medicineId = lisinoprilId.toInt(), medicineName = "Lisinopril", status = "Taken", timestamp = System.currentTimeMillis() - 172800000L + 28800000L, dateString = dayBefore))
            medicationLogDao.insertLog(MedicationLogEntity(medicineId = metforminId.toInt(), medicineName = "Metformin", status = "Taken", timestamp = System.currentTimeMillis() - 172800000L + 46800000L, dateString = dayBefore))
            medicationLogDao.insertLog(MedicationLogEntity(medicineId = atorvastatinId.toInt(), medicineName = "Atorvastatin", status = "Missed", timestamp = System.currentTimeMillis() - 172800000L + 75600000L, dateString = dayBefore))

            medicationLogDao.insertLog(MedicationLogEntity(medicineId = lisinoprilId.toInt(), medicineName = "Lisinopril", status = "Taken", timestamp = System.currentTimeMillis() - 86400000L + 28800000L, dateString = yesterday))
            medicationLogDao.insertLog(MedicationLogEntity(medicineId = metforminId.toInt(), medicineName = "Metformin", status = "Taken", timestamp = System.currentTimeMillis() - 86400000L + 46800000L, dateString = yesterday))
            medicationLogDao.insertLog(MedicationLogEntity(medicineId = atorvastatinId.toInt(), medicineName = "Atorvastatin", status = "Taken", timestamp = System.currentTimeMillis() - 86400000L + 75600000L, dateString = yesterday))

            // Seed past health logs
            healthLogDao.insertHealthLog(
                HealthLogEntity(
                    systolicBp = 124,
                    diastolicBp = 82,
                    heartRate = 72,
                    bloodSugar = 98.0,
                    weight = 84.5,
                    sleepHours = 7.5,
                    waterIntakeMl = 1800,
                    steps = 8400,
                    bodyTemp = 36.6,
                    oxygenSaturation = 98,
                    timestamp = System.currentTimeMillis() - 172800000L,
                    dateString = dayBefore
                )
            )

            healthLogDao.insertHealthLog(
                HealthLogEntity(
                    systolicBp = 120,
                    diastolicBp = 79,
                    heartRate = 68,
                    bloodSugar = 104.0,
                    weight = 84.2,
                    sleepHours = 8.0,
                    waterIntakeMl = 2200,
                    steps = 11200,
                    bodyTemp = 36.5,
                    oxygenSaturation = 99,
                    timestamp = System.currentTimeMillis() - 86400000L,
                    dateString = yesterday
                )
            )

            // Seed mood logs
            moodDao.insertMood(MoodEntity(mood = "Happy", timestamp = System.currentTimeMillis() - 172800000L, dateString = dayBefore, notes = "Had a highly productive work day."))
            moodDao.insertMood(MoodEntity(mood = "Neutral", timestamp = System.currentTimeMillis() - 86400000L, dateString = yesterday, notes = "Felt slightly tired in the afternoon."))
        }
    }
}
