package com.example.data.database

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "user_profile")
data class UserEntity(
    @PrimaryKey val id: Int = 1,
    val fullName: String = "John Doe",
    val age: Int = 35,
    val gender: String = "Male",
    val bloodGroup: String = "O+",
    val phoneNumber: String = "+1 555-0199",
    val emailAddress: String = "john.doe@example.com",
    val address: String = "123 Medical Parkway, Tech City",
    val medicalConditions: String = "None declared",
    val allergies: String = "None known",
    val emergencyContactName: String = "Sarah Doe",
    val emergencyContactNumber: String = "+1 555-0122",
    val isLoggedIn: Boolean = false,
    val isDarkMode: Boolean = false
)

@Entity(tableName = "medicines")
data class MedicineEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val dosage: String,
    val type: String,          // Pill, Capsule, Liquid, Injection, Inhaler
    val frequency: String,     // Daily, Weekly, Custom
    val reminderTime: String,  // HH:mm (24 hour format)
    val period: String,        // Morning, Afternoon, Night
    val recurring: Boolean = true,
    val remainingQuantity: Int = 30,
    val totalAdherenceCount: Int = 0,
    val missedCount: Int = 0,
    val instructions: String = "Take with food" // with food, empty stomach, etc.
)

@Entity(tableName = "medication_logs")
data class MedicationLogEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val medicineId: Int,
    val medicineName: String,
    val status: String,        // Taken, Missed, Pending
    val timestamp: Long,
    val dateString: String     // yyyy-MM-dd
)

@Entity(tableName = "health_logs")
data class HealthLogEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val systolicBp: Int? = null,
    val diastolicBp: Int? = null,
    val heartRate: Int? = null,
    val bloodSugar: Double? = null,
    val weight: Double? = null,
    val sleepHours: Double? = null,
    val waterIntakeMl: Int? = null,
    val steps: Int? = null,
    val bodyTemp: Double? = null,
    val oxygenSaturation: Int? = null,
    val timestamp: Long,
    val dateString: String     // yyyy-MM-dd
)

@Entity(tableName = "mood_logs")
data class MoodEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val mood: String,          // Very Happy, Happy, Neutral, Tired, Stressed
    val timestamp: Long,
    val dateString: String,    // yyyy-MM-dd
    val notes: String = ""
)
