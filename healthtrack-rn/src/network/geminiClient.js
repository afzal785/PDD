const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

export const getHealthSuggestions = async (healthLog, medicines, user, latestMood) => {
  const hasKey = GEMINI_API_KEY && GEMINI_API_KEY !== 'your-gemini-key' && GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';

  if (hasKey) {
    try {
      const prompt = buildPrompt(healthLog, medicines, user, latestMood);
      const systemInstruction = 
        "You are an expert AI Physician and Wellness Specialist named HealthTrack AI. " +
        "You provide high-quality, professional, objective health advice. " +
        "Check for abnormal vitals (BP > 130/80, Heart Rate > 100/min or < 60/min, Sugar > 125, O2 < 95%) and warn the user. " +
        "Provide water/sleep improvements and advice on scheduled drugs. Use markdown bullet points and friendly phrasing. " +
        "Always add a prominent, standard medical disclaimer at the bottom.";

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 800,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return text;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch suggestions from Gemini API, falling back to offline analytics:", e);
    }
  }

  return generateExpertOfflineSuggestions(healthLog, medicines, user, latestMood);
};

const buildPrompt = (healthLog, medicines, user, latestMood) => {
  const userStr = user
    ? `Patient: ${user.full_name}, Age: ${user.age}, Gender: ${user.gender}, Blood: ${user.blood_group}. Conditions: ${user.medical_conditions}. Allergies: ${user.allergies}.`
    : "Patient: 35yo Male.";

  const medicinesStr = !medicines || medicines.length === 0
    ? "No active medications."
    : "Active medications:\n" + medicines.map(m => 
        `- ${m.name} (${m.dosage}), Type: ${m.type}, Schedule: ${m.period} at ${m.reminder_time}, remaining: ${m.remaining_quantity}`
      ).join('\n');

  const vitalsStr = healthLog
    ? `Current Vitals today:
- Blood Pressure: ${healthLog.systolic_bp || "N/A"}/${healthLog.diastolic_bp || "N/A"} mmHg
- Heart Rate: ${healthLog.heart_rate || "N/A"} bpm
- Blood Sugar: ${healthLog.blood_sugar || "N/A"} mg/dL
- Weight: ${healthLog.weight || "N/A"} kg
- Sleep: ${healthLog.sleep_hours || "N/A"} hours
- Water: ${healthLog.water_intake_ml || "N/A"} ml
- Steps: ${healthLog.steps || "N/A"} steps
- Temperature: ${healthLog.body_temp || "N/A"} °C
- Oxygen Saturation (SpO2): ${healthLog.oxygen_saturation || "N/A"}%`
    : "No vitals registered today.";

  const moodStr = latestMood ? `Patient current mood is: ${latestMood}` : "";

  return `
    Analyze these stats and generate personalized, bulleted health suggestions for the patient.

    ${userStr}
    ${medicinesStr}
    ${vitalsStr}
    ${moodStr}

    Provide clear warnings if any values like high systolic blood pressure (>130) or blood sugar (>125) are noticed. Keep it clear, clinical yet warm, and around 150-250 words.
  `.trim();
};

const generateExpertOfflineSuggestions = (healthLog, medicines = [], user, latestMood) => {
  const warnings = [];
  const tips = [];

  if (user && user.medical_conditions && user.medical_conditions.toLowerCase().includes("hypertension")) {
    tips.push("Keep sodium intake below 1,500mg daily to manage your Hypertension.");
  }

  if (healthLog) {
    const sys = healthLog.systolic_bp;
    const dia = healthLog.diastolic_bp;
    if (sys !== null && sys !== undefined && dia !== null && dia !== undefined) {
      if (sys >= 140 || dia >= 90) {
        warnings.push(`⚠️ **High Blood Pressure detected (${sys}/${dia} mmHg)**: This is in the hypertensive range. Please rest for 15 minutes and retake. Consult your cardiologist if persistent.`);
      } else if (sys >= 130 || dia >= 80) {
        warnings.push(`⚠️ **Elevated Blood Pressure (${sys}/${dia} mmHg)**: Avoid caffeine and manage stress today.`);
      } else {
        tips.push(`✅ Your blood pressure is in the optimal range (${sys}/${dia} mmHg). Good job!`);
      }
    }

    const sugar = healthLog.blood_sugar;
    if (sugar !== null && sugar !== undefined) {
      if (sugar > 140.0) {
        warnings.push(`⚠️ **Elevated Blood Sugar (${sugar} mg/dL)**: High glucose detected. Limit carbohydrates immediately and take scheduled medications as prescribed.`);
      } else if (sugar < 70.0) {
        warnings.push(`⚠️ **Hypoglycemia Alert (${sugar} mg/dL)**: Low glucose detected! Consume 15g of fast-acting sugar (fruit juice, candy) and monitor in 15 mins.`);
      } else {
        tips.push(`✅ Fasting blood glucose is well-regulated (${sugar} mg/dL).`);
      }
    }

    const spo2 = healthLog.oxygen_saturation;
    if (spo2 !== null && spo2 !== undefined) {
      if (spo2 < 95) {
        warnings.push(`🚨 **Low Oxygen Saturation (${spo2}%)**: This is below safe limits. Take deep, diaphragmatic breaths. If it stays below 95%, contact emergency services immediately.`);
      } else {
        tips.push(`✅ Excellent oxygenation index (${spo2}% SpO2).`);
      }
    }

    const hr = healthLog.heart_rate;
    if (hr !== null && hr !== undefined) {
      if (hr > 100) {
        warnings.push(`⚠️ **Tachycardia (${hr} bpm)**: Elevated heart rate. Retake while resting. Avoid exertion.`);
      } else if (hr < 55) {
        warnings.push(`⚠️ **Bradycardia (${hr} bpm)**: Relatively low pulse. Monitor for symptoms of dizziness or fatigue.`);
      }
    }

    const steps = healthLog.steps;
    if (steps !== null && steps !== undefined) {
      if (steps < 5000) {
        tips.push(`🚶 **Get Active**: You have recorded only ${steps} steps today. Let's aim for a short 15-minute walk to keep your cardiovascular function strong.`);
      } else if (steps >= 10000) {
        tips.push(`🎉 **Active Milestone**: You hit ${steps} steps today! This is incredible for cholesterol and insulin sensitivity.`);
      }
    }

    const water = healthLog.water_intake_ml;
    if (water !== null && water !== undefined) {
      if (water < 2000) {
        tips.push(`💧 **Hydration Alert**: You've tracked ${water} mL of water today. Please drink a glass of water right now to maintain renal clearance and avoid pill-induced dehydration.`);
      }
    }

    const sleep = healthLog.sleep_hours;
    if (sleep !== null && sleep !== undefined) {
      if (sleep < 7.0) {
        tips.push(`🛌 **Sleep Rejuvenation**: ${sleep} hours of sleep is below the 7.5 hr threshold. Poor sleep elevates cortisol and blood pressure indices; try sleeping 45 mins earlier tonight.`);
      }
    }
  }

  // Pill refills warning
  const lowMeds = medicines.filter(m => m.remaining_quantity <= 5);
  if (lowMeds.length > 0) {
    const names = lowMeds.map(m => `${m.name} (${m.remaining_quantity} left)`).join(", ");
    warnings.push(`💊 **Refill Warning**: Your stock of ${names} is critically low. Please contact your pharmacist for refills.`);
  }

  if (latestMood === "Stressed" || latestMood === "Tired") {
    tips.push(`🌸 **Mindfulness Moment**: You reported feeling **${latestMood}**. Take 3 slow nasal breaths, holding for 4 seconds, to lower sympathetic nervous activity.`);
  }

  let suggestions = "### 👋 HealthTrack AI suggestions\n\n";

  if (warnings.length > 0) {
    suggestions += "#### 🩺 Clinical Observations:\n";
    warnings.forEach(w => { suggestions += `- ${w}\n`; });
    suggestions += "\n";
  }

  suggestions += "#### 💡 Today's Recommendations:\n";
  if (tips.length === 0) {
    suggestions += "- Keep recording your vitals and taking your medicines on time.\n";
    suggestions += "- Hydrate regularly: Aim for 2.5 Liters of water daily.\n";
    suggestions += "- Walk 30 minutes daily to regulate glycemic index and pressure parameters.\n";
  } else {
    tips.forEach(t => { suggestions += `- ${t}\n`; });
  }

  suggestions += "\n> **Disclaimer:** HealthTrack AI insights are for educational purposes only and do not replace professional cardiological or medical diagnosis. For life-threatening emergencies, press the **SOS** button or call 911 immediately.";

  return suggestions;
};
