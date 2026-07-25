package com.example.data.database

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {
    @Query("SELECT * FROM user_profile WHERE id = :id")
    fun getUserProfileFlow(id: Int = 1): Flow<UserEntity?>

    @Query("SELECT * FROM user_profile WHERE id = :id")
    suspend fun getUserProfile(id: Int = 1): UserEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateUser(user: UserEntity)
}

@Dao
interface MedicineDao {
    @Query("SELECT * FROM medicines ORDER BY reminderTime ASC")
    fun getAllMedicinesFlow(): Flow<List<MedicineEntity>>

    @Query("SELECT * FROM medicines ORDER BY reminderTime ASC")
    suspend fun getAllMedicinesList(): List<MedicineEntity>

    @Query("SELECT * FROM medicines WHERE id = :id")
    suspend fun getMedicineById(id: Int): MedicineEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMedicine(medicine: MedicineEntity): Long

    @Update
    suspend fun updateMedicine(medicine: MedicineEntity)

    @Delete
    suspend fun deleteMedicine(medicine: MedicineEntity)

    @Query("UPDATE medicines SET remainingQuantity = :quantity WHERE id = :id")
    suspend fun updateRemainingQuantity(id: Int, quantity: Int)
}

@Dao
interface MedicationLogDao {
    @Query("SELECT * FROM medication_logs ORDER BY timestamp DESC")
    fun getAllLogsFlow(): Flow<List<MedicationLogEntity>>

    @Query("SELECT * FROM medication_logs WHERE dateString = :dateString ORDER BY timestamp DESC")
    fun getLogsByDateFlow(dateString: String): Flow<List<MedicationLogEntity>>

    @Query("SELECT * FROM medication_logs WHERE dateString = :dateString ORDER BY timestamp DESC")
    suspend fun getLogsByDateList(dateString: String): List<MedicationLogEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLog(log: MedicationLogEntity)

    @Query("DELETE FROM medication_logs WHERE id = :id")
    suspend fun deleteLogById(id: Int)

    @Query("DELETE FROM medication_logs WHERE medicineId = :medicineId AND dateString = :dateString")
    suspend fun deleteLogsForMedicineAndDate(medicineId: Int, dateString: String)
}

@Dao
interface HealthLogDao {
    @Query("SELECT * FROM health_logs ORDER BY timestamp DESC")
    fun getAllHealthLogsFlow(): Flow<List<HealthLogEntity>>

    @Query("SELECT * FROM health_logs ORDER BY timestamp DESC LIMIT 1")
    fun getLatestHealthLogFlow(): Flow<HealthLogEntity?>

    @Query("SELECT * FROM health_logs ORDER BY timestamp DESC LIMIT 1")
    suspend fun getLatestHealthLog(): HealthLogEntity?

    @Query("SELECT * FROM health_logs WHERE dateString = :dateString LIMIT 1")
    suspend fun getHealthLogByDate(dateString: String): HealthLogEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHealthLog(log: HealthLogEntity)

    @Query("DELETE FROM health_logs WHERE id = :id")
    suspend fun deleteHealthLogById(id: Int)
}

@Dao
interface MoodDao {
    @Query("SELECT * FROM mood_logs ORDER BY timestamp DESC")
    fun getAllMoodsFlow(): Flow<List<MoodEntity>>

    @Query("SELECT * FROM mood_logs ORDER BY timestamp DESC LIMIT 1")
    fun getLatestMoodFlow(): Flow<MoodEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMood(mood: MoodEntity)

    @Query("DELETE FROM mood_logs WHERE id = :id")
    suspend fun deleteMoodById(id: Int)
}
