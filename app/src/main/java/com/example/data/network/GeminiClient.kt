package com.example.data.network

import com.example.BuildConfig
import com.example.data.database.HealthLogEntity
import com.example.data.database.MedicineEntity
import com.example.data.database.UserEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

object HealthAiAssistant {

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    suspend fun getHealthSuggestions(
        healthLog: HealthLogEntity?,
        medicines: List<MedicineEntity>,
        user: UserEntity?,
        latestMood: String?
    ): String = withContext(Dispatchers.IO) {
        val apiKey = BuildConfig.GEMINI_API_KEY
        val hasKey = apiKey.isNotEmpty() && apiKey != "MY_GEMINI_API_KEY"

        val prompt = buildPrompt(healthLog, medicines, user, latestMood)

        if (hasKey) {
            try {
                val requestJson = JSONObject()
                
                val contentsArray = JSONArray()
                val contentObj = JSONObject()
                val partsArray = JSONArray()
                val partObj = JSONObject()
                partObj.put("text", prompt)
                partsArray.put(partObj)
                contentObj.put("parts", partsArray)
                contentsArray.put(contentObj)
                requestJson.put("contents", contentsArray)

                val systemInstructionObj = JSONObject()
                val sysPartsArray = JSONArray()
                val sysPartObj = JSONObject()
                sysPartObj.put("text", "You are an expert AI Physician and Wellness Specialist named HealthTrack AI. " +
                        "You provide high-quality, professional, objective health advice. " +
                        "Check for abnormal vitals (BP > 130/80, Heart Rate > 100/min or < 60/min, Sugar > 125, O2 < 95%) and warn the user. " +
                        "Provide water/sleep improvements and advice on scheduled drugs. Use markdown bullet points and friendly phrasing. " +
                        "Always add a prominent, standard medical disclaimer at the bottom.")
                sysPartsArray.put(sysPartObj)
                systemInstructionObj.put("parts", sysPartsArray)
                requestJson.put("systemInstruction", systemInstructionObj)

                val generationConfigObj = JSONObject()
                generationConfigObj.put("temperature", 0.5)
                generationConfigObj.put("maxOutputTokens", 800)
                requestJson.put("generationConfig", generationConfigObj)

                val mediaType = "application/json; charset=utf-8".toMediaType()
                val requestBody = requestJson.toString().toRequestBody(mediaType)

                val request = Request.Builder()
                    .url("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$apiKey")
                    .post(requestBody)
                    .build()

                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        val bodyString = response.body?.string()
                        if (!bodyString.isNullOrBlank()) {
                            val root = JSONObject(bodyString)
                            val candidates = root.optJSONArray("candidates")
                            if (candidates != null && candidates.length() > 0) {
                                val candObj = candidates.getJSONObject(0)
                                val content = candObj.optJSONObject("content")
                                if (content != null) {
                                    val parts = content.optJSONArray("parts")
                                    if (parts != null && parts.length() > 0) {
                                        val text = parts.getJSONObject(0).optString("text")
                                        if (text.isNotEmpty()) {
                                            return@withContext text
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                // Fail-safe to expert offline analytics on network/API errors
            }
        }

        // Return expert custom offline recommendation engine if key fails or is missing
        return@withContext generateExpertOfflineSuggestions(healthLog, medicines, user, latestMood)
    }

    private fun buildPrompt(
        healthLog: HealthLogEntity?,
        medicines: List<MedicineEntity>,
        user: UserEntity?,
        latestMood: String?
    ): String {
        val userStr = user?.let {
            "Patient: ${it.fullName}, Age: ${it.age}, Gender: ${it.gender}, Blood: ${it.bloodGroup}. Conditions: ${it.medicalConditions}. Allergies: ${it.allergies}."
        } ?: "Patient: 35yo Male."

        val medicinesStr = if (medicines.isEmpty()) {
            "No active medications."
        } else {
            "Active medications:\n" + medicines.joinToString("\n") {
                "- ${it.name} (${it.dosage}), Type: ${it.type}, Schedule: ${it.period} at ${it.reminderTime}, remaining pills: ${it.remainingQuantity}"
            }
        }

        val vitalsStr = healthLog?.let {
            """
            Current Vitals today:
            - Blood Pressure: ${it.systolicBp ?: "N/A"}/${it.diastolicBp ?: "N/A"} mmHg
            - Heart Rate: ${it.heartRate ?: "N/A"} bpm
            - Blood Sugar: ${it.bloodSugar ?: "N/A"} mg/dL
            - Weight: ${it.weight ?: "N/A"} kg
            - Sleep: ${it.sleepHours ?: "N/A"} hours
            - Water: ${it.waterIntakeMl ?: "N/A"} ml
            - Steps: ${it.steps ?: "N/A"} steps
            - Temperature: ${it.bodyTemp ?: "N/A"} °C
            - Oxygen Saturation (SpO2): ${it.oxygenSaturation ?: "N/A"}%
            """.trimIndent()
        } ?: "No vitals registered today."

        val moodStr = latestMood?.let { "Patient current mood is: $it" } ?: ""

        return """
            Analyze these stats and generate personalized, bulleted health suggestions for the patient.

            $userStr
            $medicinesStr
            $vitalsStr
            $moodStr

            Provide clear warnings if any values like high systolic blood pressure (>130) or blood sugar (>125) are noticed. Keep it clear, clinical yet warm, and around 150-250 words.
        """.trimIndent()
    }

    private fun generateExpertOfflineSuggestions(
        healthLog: HealthLogEntity?,
        medicines: List<MedicineEntity>,
        user: UserEntity?,
        latestMood: String?
    ): String {
        val sb = java.lang.StringBuilder()
        sb.append("### 👋 HealthTrack AI suggestions\n\n")

        val warnings = ArrayList<String>()
        val tips = ArrayList<String>()

        if (user != null && user.medicalConditions.contains("Hypertension", true)) {
            tips.add("Keep sodium intake below 1,500mg daily to manage your Hypertension.")
        }

        if (healthLog != null) {
            val sys = healthLog.systolicBp
            val dia = healthLog.diastolicBp
            if (sys != null && dia != null) {
                if (sys >= 140 || dia >= 90) {
                    warnings.add("⚠️ **High Blood Pressure detected (${sys}/${dia} mmHg)**: This is in the hypertensive range. Please rest for 15 minutes and retake. Consult your cardiologist if persistent.")
                } else if (sys >= 130 || dia >= 80) {
                    warnings.add("⚠️ **Elevated Blood Pressure (${sys}/${dia} mmHg)**: Avoid caffeine and manage stress today.")
                } else {
                    tips.add("✅ Your blood pressure is in the optimal range (${sys}/${dia} mmHg). Good job!")
                }
            }

            val sugar = healthLog.bloodSugar
            if (sugar != null) {
                if (sugar > 140.0) {
                    warnings.add("⚠️ **Elevated Blood Sugar (${sugar} mg/dL)**: High glucose detected. Limit carbohydrates immediately and take scheduled insulin/Metformin with meals as prescribed.")
                } else if (sugar < 70.0) {
                    warnings.add("⚠️ **Hypoglycemia Alert (${sugar} mg/dL)**: Low glucose detected! Consume 15g of fast-acting sugar (fruit juice, candy) and monitor in 15 mins.")
                } else {
                    tips.add("✅ Fasting blood glucose is well-regulated (${sugar} mg/dL).")
                }
            }

            val spo2 = healthLog.oxygenSaturation
            if (spo2 != null) {
                if (spo2 < 95) {
                    warnings.add("🚨 **Low Oxygen Saturation (${spo2}%)**: This is below safe limits. Take deep, diaphragmatic breaths. If it stays below 95%, contact emergency services immediately.")
                } else {
                    tips.add("✅ Excellent oxygenation index (${spo2}% SpO2).")
                }
            }

            val hr = healthLog.heartRate
            if (hr != null) {
                if (hr > 100) {
                    warnings.add("⚠️ **Tachycardia (${hr} bpm)**: Elevated heart rate. Retake while resting. Avoid exertion.")
                } else if (hr < 55) {
                    warnings.add("⚠️ **Bradycardia (${hr} bpm)**: Relatively low pulse. Monitor for symptoms of dizziness or fatigue.")
                }
            }

            val steps = healthLog.steps
            if (steps != null && steps < 5000) {
                tips.add("🚶 **Get Active**: You have recorded only $steps steps today. Let's aim for a short 15-minute walk to keep your cardiovascular function strong.")
            } else if (steps != null && steps >= 10000) {
                tips.add("🎉 **Active Milestone**: You hit $steps steps today! This is incredible for cholesterol and insulin sensitivity.")
            }

            val water = healthLog.waterIntakeMl
            if (water != null && water < 2000) {
                tips.add("💧 **Hydration Alert**: You've tracked $water mL of water today. Please drink a glass of water right now to maintain renal clearance and avoid pill-induced dehydration.")
            }

            val sleep = healthLog.sleepHours
            if (sleep != null && sleep < 7.0) {
                tips.add("🛌 **Sleep Rejuvenation**: $sleep hours of sleep is below the 7.5 hr threshold. Poor sleep elevates cortisol and blood pressure indices; try sleeping 45 mins earlier tonight.")
            }
        }

        // Pill refills suggestion
        val lowMeds = medicines.filter { it.remainingQuantity <= 5 }
        if (lowMeds.isNotEmpty()) {
            val names = lowMeds.joinToString(", ") { "${it.name} (${it.remainingQuantity} left)" }
            warnings.add("💊 **Refill Warning**: Your stock of $names is critically low. Please contact your pharmacist for refills.")
        }

        if (latestMood == "Stressed" || latestMood == "Tired") {
            tips.add("🌸 **Mindfulness Moment**: You reported feeling **$latestMood**. Take 3 slow nasal breaths, holding for 4 seconds, to lower sympathetic nervous activity.")
        }

        if (warnings.isNotEmpty()) {
            sb.append("#### 🩺 Clinical Observations:\n")
            warnings.forEach { sb.append("- $it\n") }
            sb.append("\n")
        }

        sb.append("#### 💡 Today's Recommendations:\n")
        if (tips.isEmpty()) {
            sb.append("- Keep recording your vitals and taking your medicines on time.\n")
            sb.append("- Hydrate regularly: Aim for 2.5 Liters of water daily.\n")
            sb.append("- Walk 30 minutes daily to regulate glycemic index and pressure parameters.\n")
        } else {
            tips.forEach { sb.append("- $it\n") }
        }

        sb.append("\n")
        sb.append("> **Disclaimer:** HealthTrack AI insights are for educational purposes only and do not replace professional cardiological or medical diagnosis. For life-threatening emergencies, press the **SOS** button or call 911 immediately.")

        return sb.toString()
    }
}
